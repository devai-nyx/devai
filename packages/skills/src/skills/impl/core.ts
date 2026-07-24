import {
  execFileSync,
  mkdirSync,
  spawnSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { validators } from '@devai-nyx/schemas';
import type { SensorReading } from '@devai-nyx/sensors';
import { senseBuild, senseLint, senseTest, senseTypeCheck } from '@devai-nyx/sensors';
import { nextCounterId } from '@devai-nyx/utils';
import {
  assessScorecard,
  classifyFailure,
  composePrompt,
  computeScorecard,
  dispatchFor,
} from '@devai-nyx/loop';
import {
  createLlmClient,
  messagesFromComposition,
  metaFromComposition,
  responseSchemaForMutatingSkill,
} from '../../llm/index.js';
import { resolveScorecardInputs } from '@devai-nyx/loop';
import { applyExactReplacementsBounded, readExactBoundedSourceContext } from '../bounded-writer.js';
import { loadSkillPrompt } from '../prompt-loader.js';
import { MANDATORY_MIN_GATES, runGate } from '../round/waves.js';
import type { SkillEntry } from '../types.js';

function validateEvidenceOrFail<T>(
  result: {
    skill_id: string;
    status: 'pass' | 'fail' | 'review' | 'skipped';
    evidence?: T;
    notes?: readonly string[];
  },
  validator: (((instance: unknown) => boolean) & { errors?: unknown }) | null,
  contractName: string,
): typeof result {
  if (validator === null) return result;
  if (result.status !== 'pass') return result;
  if (result.evidence === undefined) return result;
  const ok = validator(result.evidence);
  if (ok) return result;
  return {
    skill_id: result.skill_id,
    status: 'fail',
    notes: [
      `evidence does not validate against ${contractName}.schema.json`,
      JSON.stringify(validator.errors),
    ],
  };
}

// =====================================================================
// 16 skill manifests (Phase-8 MVP, reshaped in Batch 9.A.1 to conform
// to skill-manifest.schema.json). Phases 9.C–9.E + 9.G shipped real
// implementations for the LLM-backed skills; the phase_9_reserved
// honest-relabel mechanism was retired in Phase 16.B (decision item 10).
// =====================================================================

/**
 * R5-W2 — branch-hygiene precondition for SKILL-commit-push push path.
 * Per ADR-002 §4:
 *   1. Working tree must be clean of unstaged changes outside `files`.
 *   2. Current branch must fast-forward to its origin/<branch> (we must be
 *      ahead of or equal to origin; never behind/diverged).
 * Returns { ok: true } on pass, { ok: false, notes } on fail.
 */
function checkBranchHygiene(
  repoRoot: string,
  files: readonly string[],
): { ok: true } | { ok: false; notes: string[] } {
  // 1. Unstaged changes outside `files`.
  try {
    const unstaged = execFileSync('git', ['diff', '--name-only'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    })
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const filesSet = new Set(files);
    const stray = unstaged.filter((p) => !filesSet.has(p));
    if (stray.length > 0) {
      return {
        ok: false,
        notes: [
          `Branch-hygiene refusal (ADR-002 §4): ${String(stray.length)} unstaged tracked file(s) outside inputs.files:`,
          ...stray.slice(0, 10).map((p) => `  - ${p}`),
          ...(stray.length > 10 ? [`  ... and ${String(stray.length - 10)} more`] : []),
          'Stash, commit separately, or add them to inputs.files.',
        ],
      };
    }
  } catch (err) {
    return {
      ok: false,
      notes: [
        `Branch-hygiene check failed: git diff errored (${err instanceof Error ? err.message : String(err)})`,
      ],
    };
  }

  // 2. Fast-forward to origin/<branch>.
  let branch: string;
  try {
    branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch (err) {
    return {
      ok: false,
      notes: [
        `Branch-hygiene check failed: cannot resolve current branch (${err instanceof Error ? err.message : String(err)})`,
      ],
    };
  }
  if (branch === 'HEAD' || branch.length === 0) {
    return {
      ok: false,
      notes: ['Branch-hygiene refusal: detached HEAD. Check out a branch first.'],
    };
  }

  // Does origin/<branch> exist? If not, this is a brand-new branch — allowed (push will create upstream).
  try {
    execFileSync('git', ['rev-parse', '--verify', `origin/${branch}`], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return { ok: true }; // no upstream yet; push --set-upstream is operator's responsibility
  }

  // origin/<branch> exists — must be an ancestor of HEAD (ADR-002 §4).
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', `origin/${branch}`, 'HEAD'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return {
      ok: false,
      notes: [
        `Branch-hygiene refusal (ADR-002 §4): origin/${branch} is not an ancestor of HEAD — branch has diverged.`,
        `Rebase onto origin/${branch} first; this skill refuses to silently rewrite history.`,
      ],
    };
  }

  return { ok: true };
}

/**
 * R5-W2 — derive a PR title for `gh pr create`. Order:
 *   1. inputs.pr_title (if provided)
 *   2. first H1 from inputs.pr_body_file (if file exists and has one)
 *   3. commit message
 */
function derivePrTitle(
  repoRoot: string,
  inputs: Readonly<Record<string, unknown>> | undefined,
  message: string,
): string {
  const explicit = inputs?.['pr_title'];
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  const bodyFile = inputs?.['pr_body_file'];
  if (typeof bodyFile === 'string' && bodyFile.length > 0) {
    const abs = isAbsolute(bodyFile) ? bodyFile : join(repoRoot, bodyFile);
    if (existsSync(abs)) {
      try {
        const first = readFileSync(abs, 'utf8')
          .split('\n')
          .find((l) => /^#\s+/.test(l));
        if (first !== undefined) return first.replace(/^#\s+/, '').trim();
      } catch {
        // fall through to commit message
      }
    }
  }
  return message;
}

const skillCommitPush: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-commit-push',
    title: 'Commit and push',
    version: '1.1.0',
    summary:
      'Deterministic git add (of explicitly named files) + commit. R5-W2 extended with optional push, ' +
      'gh pr create, branch-hygiene preconditions, final pre-commit gate re-run, and dry-run mode. ' +
      'permission_tier stays `write`; act-tier escalation is per-invocation via inputs.push=true + ' +
      'ctx.grants.publish=true (session-grant wired by --allow-publish in W3). See ADR-002.',
    kind: 'command',
    authority_role: 'engineer',
    deterministic: true,
    llm_backed: false,
    agent_class: 'coding-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    // R12 W4 (disposition i — narrow to honest paths): this skill does
    // NOT write source files. It stages caller-provided files via
    // `git add --`, runs `git commit` / `git push` / `gh pr create`, and
    // persists its own evidence under record/proofs/work/skill-runs/. The
    // R11-era `['**']` declaration overstated authorial surface —
    // git/gh invocations are orthogonal to allowed_write_scopes
    // (the firewall governs file writes by the skill body, not
    // commit contents). See ADR-FIREWALL-OVERLAPS-GLOB-AWARE.
    allowed_write_scopes: ['record/proofs/work/skill-runs/SKILL-commit-push/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-commit-push/*.json'],
    risk_level: 'medium',
    tags: ['vcs', 'commit', 'push', 'pr'],
    entry: 'devai agent skill run SKILL-commit-push',
  },
  async run(ctx) {
    // CLAUDE.md commit conventions explicitly forbid `git add -A` /
    // `git add .` in automated paths because they can silently stage
    // .env, credentials, dumps, large binaries, and other untracked
    // junk. This skill MUST receive an explicit list of files to stage.
    const filesInput = ctx.inputs?.files;
    if (!Array.isArray(filesInput) || filesInput.length === 0) {
      return {
        skill_id: 'SKILL-commit-push',
        status: 'fail',
        notes: [
          'SKILL-commit-push requires inputs.files: string[] (explicit paths to stage).',
          'Refusing to run `git add -A` — CLAUDE.md commit convention forbids it ' +
            '(risk of staging .env, credentials, large binaries).',
        ],
      };
    }
    const files: string[] = [];
    for (const f of filesInput) {
      if (typeof f !== 'string' || f.length === 0) {
        return {
          skill_id: 'SKILL-commit-push',
          status: 'fail',
          notes: [`inputs.files[i] must be a non-empty string; got: ${JSON.stringify(f)}`],
        };
      }
      // Refuse arguments that look like flags or path traversal — they
      // would let a caller smuggle `-A`, `.`, or escape the repo root.
      if (f.startsWith('-') || f.includes('..')) {
        return {
          skill_id: 'SKILL-commit-push',
          status: 'fail',
          notes: [`inputs.files: refusing suspicious path '${f}' (leading dash or '..' traversal)`],
        };
      }
      files.push(f);
    }
    const message = (ctx.inputs?.message as string | undefined) ?? 'devai: automated commit';

    // R5-W2: new optional inputs.
    const push = ctx.inputs?.['push'] === true;
    const openPr = ctx.inputs?.['open_pr'] === true;
    const dryRun = ctx.inputs?.['dry_run'] === true;
    const runFinalGates = push || ctx.inputs?.['run_final_gates'] === true;

    // open_pr requires push.
    if (openPr && !push) {
      return {
        skill_id: 'SKILL-commit-push',
        status: 'fail',
        notes: ['inputs.open_pr=true requires inputs.push=true (PR-open implies push to origin).'],
      };
    }

    // R5-W2 (ADR-002 §1, §2): act-tier escalation when push=true.
    // The session-grant gate is at runtime via ctx.grants.publish (wired by
    // skill-run CLI's --allow-publish flag in W3). Dry-run bypasses since
    // no remote state mutates.
    if (push && !dryRun && ctx.grants?.publish !== true) {
      return {
        skill_id: 'SKILL-commit-push',
        status: 'fail',
        notes: [
          'inputs.push=true requires an act-tier session grant.',
          'Add --allow-publish to your `devai agent skill run` invocation.',
          'See ADR-002 §2 for the session-grant rationale.',
        ],
      };
    }

    // R5-W2 (ADR-002 §4): branch hygiene preconditions when pushing.
    // Dry-run skips so tests can exercise the command-shape path without
    // requiring a configured upstream.
    if (push && !dryRun) {
      const hygiene = checkBranchHygiene(ctx.repoRoot, files);
      if (!hygiene.ok) {
        return { skill_id: 'SKILL-commit-push', status: 'fail', notes: hygiene.notes };
      }
    }

    // R5-W2 (ADR-002 §7): gh auth check before open_pr (skip in dry-run).
    if (openPr && !dryRun) {
      try {
        execFileSync('gh', ['auth', 'status'], {
          cwd: ctx.repoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        return {
          skill_id: 'SKILL-commit-push',
          status: 'fail',
          notes: [
            'inputs.open_pr=true requires `gh` CLI authenticated.',
            'Run `gh auth login` first, or omit open_pr to commit-and-push without PR.',
          ],
        };
      }
    }

    // R5-W2 (ADR-002 §5): final mandatory-gate re-run.
    // R10 (D-A-40): runGate may now also return `not-configured` (gate
    // command unmapped) — treat that as neutral, NOT a fail. The publish
    // path should not abort on gates the adopter never configured.
    const finalGateResults: { gate: string; status: 'pass' | 'fail' | 'not-configured' }[] = [];
    if (runFinalGates && !dryRun) {
      for (const gate of MANDATORY_MIN_GATES) {
        const r = runGate(gate, ctx.repoRoot);
        const recordedStatus: 'pass' | 'fail' | 'not-configured' =
          r.status === 'error' ? 'fail' : r.status;
        finalGateResults.push({ gate, status: recordedStatus });
        if (r.status === 'fail') {
          return {
            skill_id: 'SKILL-commit-push',
            status: 'fail',
            notes: [
              `Final pre-commit gate re-run failed: ${gate}.`,
              'Per ADR-002 §5, a red gate aborts the publish. Fix the gate and re-invoke.',
            ],
            evidence: { final_gate_results: finalGateResults },
          };
        }
      }
    }

    // Build the command tape (mutations gated by !dryRun).
    const commands: string[][] = [];
    try {
      // `--` separates options from pathspecs; defensive against any path
      // beginning with a dash that slipped past the check above.
      commands.push(['git', 'add', '--', ...files]);
      if (!dryRun) {
        execFileSync('git', ['add', '--', ...files], {
          cwd: ctx.repoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      }
      commands.push(['git', 'commit', '-m', message]);
      if (!dryRun) {
        execFileSync('git', ['commit', '-m', message], {
          cwd: ctx.repoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      }
      if (push) {
        commands.push(['git', 'push', 'origin', 'HEAD']);
        if (!dryRun) {
          execFileSync('git', ['push', 'origin', 'HEAD'], {
            cwd: ctx.repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        }
      }
      if (openPr) {
        const prTitle = derivePrTitle(ctx.repoRoot, ctx.inputs, message);
        const ghArgs = ['pr', 'create', '--title', prTitle];
        const bodyFile = ctx.inputs?.['pr_body_file'];
        if (typeof bodyFile === 'string' && bodyFile.length > 0) {
          ghArgs.push('--body-file', bodyFile);
        } else {
          ghArgs.push('--body', `Opened by SKILL-commit-push.\n\n${message}`);
        }
        commands.push(['gh', ...ghArgs]);
        if (!dryRun) {
          execFileSync('gh', ghArgs, {
            cwd: ctx.repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        }
      }
      const noteParts: string[] = [];
      if (dryRun) noteParts.push(`mode=dry-run; ${String(commands.length)} commands previewed`);
      else {
        const verbs = ['committed', ...(push ? ['pushed'] : []), ...(openPr ? ['pr-opened'] : [])];
        noteParts.push(verbs.join(' + '));
      }
      return {
        skill_id: 'SKILL-commit-push',
        status: 'pass',
        notes: noteParts,
        evidence: {
          committed: !dryRun,
          pushed: push && !dryRun,
          pr_opened: openPr && !dryRun,
          files,
          mode: dryRun ? 'dry-run' : 'live',
          commands,
          ...(finalGateResults.length > 0 && { final_gate_results: finalGateResults }),
        },
      };
    } catch (err) {
      return {
        skill_id: 'SKILL-commit-push',
        status: 'fail',
        notes: [err instanceof Error ? err.message : String(err)],
        evidence: { commands_attempted: commands, mode: dryRun ? 'dry-run' : 'live' },
      };
    }
  },
};

const skillTriage: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-triage',
    title: 'Classify a failure',
    version: '1.0.0',
    summary: 'Classify a SensorReading failure via the rule-based triage classifier',
    kind: 'command',
    authority_role: 'harness',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-triage/*.json'],
    risk_level: 'low',
    tags: ['triage', 'classification'],
    entry: 'devai agent skill run SKILL-triage',
  },
  async run(ctx) {
    const reading = ctx.inputs?.reading as SensorReading | undefined;
    if (reading === undefined) {
      return { skill_id: 'SKILL-triage', status: 'fail', notes: ['missing input: reading'] };
    }
    const triage = classifyFailure(reading);
    const dispatch = dispatchFor(triage);
    // Validate the TriageVerdict against its schema before emitting.
    // The wrapper object { triage, dispatch } isn't itself a schema'd
    // contract, so we validate the triage sub-record specifically.
    const triageOk = validators.triage(triage);
    if (!triageOk) {
      return {
        skill_id: 'SKILL-triage',
        status: 'fail',
        notes: [
          'classifyFailure produced a TriageVerdict that does not validate against triage.schema.json',
          JSON.stringify(validators.triage.errors),
        ],
      };
    }
    return { skill_id: 'SKILL-triage', status: 'pass', evidence: { triage, dispatch } };
  },
};

const skillMaterializePrompt: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-materialize-prompt',
    title: 'Materialize a prompt stack',
    version: '1.0.0',
    summary: 'Compose a prompt stack deterministically and emit the PromptComposition',
    kind: 'command',
    authority_role: 'harness',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-materialize-prompt/*.json'],
    risk_level: 'low',
    tags: ['prompts'],
    entry: 'devai agent skill run SKILL-materialize-prompt',
  },
  async run(ctx) {
    const components =
      (ctx.inputs?.components as Array<{
        layer: 'global' | 'role' | 'discipline' | 'task' | 'payload' | 'overlay';
        name: string;
        body: string;
      }>) ?? [];
    const taskId = (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000';
    const composition = composePrompt({
      task_id: taskId,
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    return validateEvidenceOrFail(
      { skill_id: 'SKILL-materialize-prompt', status: 'pass', evidence: composition },
      validators.promptComposition,
      'prompt-composition',
    );
  },
};

const skillComputeScorecard: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-compute-scorecard',
    title: 'Compute scorecard',
    version: '1.0.0',
    summary: 'Compute the substrate × property scorecard from a SensorReading set',
    kind: 'command',
    authority_role: 'auditor',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-compute-scorecard/*.json'],
    risk_level: 'low',
    tags: ['scorecard', 'audit'],
    entry: 'devai agent skill run SKILL-compute-scorecard',
  },
  async run(ctx) {
    // Phase 25.B (closes D-A-26): use the shared scorecard-input
    // resolver. Pre-25.B this skill read only `ctx.inputs.readings`
    // (empty when invoked via `devai agent skill run SKILL-compute-scorecard
    // --repo-root .`), reporting 44 UNKNOWN + 1 N/A cells; meanwhile
    // SKILL-assess-state was loading readings from disk and reporting
    // a realistic distribution. Both skills now resolve inputs via
    // `resolveScorecardInputs`, producing identical cell verdicts
    // against the same state.
    const timestamp = ctx.timestamp ?? new Date().toISOString();
    const { scorecard } = resolveScorecardInputs({
      repoRoot: ctx.repoRoot,
      inputs: ctx.inputs,
      timestamp,
      ...(ctx.inputs?.integrationHead !== undefined && {
        integrationHead: ctx.inputs.integrationHead as string,
      }),
    });
    return validateEvidenceOrFail(
      { skill_id: 'SKILL-compute-scorecard', status: 'pass', evidence: scorecard },
      validators.scorecard,
      'scorecard',
    );
  },
};

const skillCompileBacklog: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-compile-backlog',
    title: 'Compile backlog from scorecard',
    version: '1.0.0',
    summary: 'Translate failing scorecard cells into backlog items (MVP: one per fail)',
    kind: 'command',
    authority_role: 'auditor',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-compile-backlog/*.json'],
    risk_level: 'low',
    tags: ['backlog', 'audit'],
    entry: 'devai agent skill run SKILL-compile-backlog',
  },
  async run(ctx) {
    const scorecard = ctx.inputs?.scorecard as ReturnType<typeof computeScorecard> | undefined;
    if (scorecard === undefined) {
      return {
        skill_id: 'SKILL-compile-backlog',
        status: 'fail',
        notes: ['missing input: scorecard'],
      };
    }
    const items = scorecard.cells
      .filter((c) => c.verdict === 'FAIL' || c.verdict === 'REVIEW')
      .map((c) => ({
        id: `BL-${c.substrate}-${c.property}`,
        title: `${c.substrate} × ${c.property} → ${c.verdict}`,
        priority: c.verdict === 'FAIL' ? 80 : 50,
        // R5-W4 (DEC-0003) — bind cell metadata so downstream backlog/wave
        // template renderers can show "F1×T6" instead of "?".
        cell: `${c.substrate}×${c.property}`,
        verdict: c.verdict,
      }));
    return {
      skill_id: 'SKILL-compile-backlog',
      status: 'pass',
      evidence: { count: items.length, items },
    };
  },
};

interface FeedbackIterationLog {
  readonly iteration: number;
  readonly readings_before: ReadonlyArray<{ kind: string; status: string }>;
  readonly prompt_pc_id: string;
  readonly llm: { family: string; model: string; cost_usd: number };
  readonly edits: { written: string[]; rejected: string[] };
  readonly readings_after: ReadonlyArray<{ kind: string; status: string }>;
  readonly acceptance: ReadonlyArray<{ command: readonly string[]; exit_code: number }>;
  readonly converged: boolean;
}

const skillFeedbackIteration: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-feedback-iteration',
    title: 'Engineer iteration loop',
    version: '1.0.0',
    lifecycle: 'experimental',
    lifecycle_reason:
      'D-126: autonomous preparation is opt-in and stops at human review until promotion criteria are met.',
    promotion_criteria: [
      'Correct commit and integration semantics with no work-loss path',
      'Task-specific acceptance and complete hard-gate enforcement',
      'Deterministic full-loop E2E including interruption and escalation',
      'Supervised live-adopter pilot and independent Auditor approval',
    ],
    summary:
      'Engineer iteration loop: sense (lint/test/type-check) → triage → LLM edits → re-sense; up to max_iterations.',
    kind: 'workflow',
    authority_role: 'engineer',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'coding-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    // R12 W4 (disposition i — narrow to honest paths): Engineer iteration
    // loop. The LLM-proposed replacements are prepared atomically and written
    // through the same bounded host-effect seam.
    // and the iteration logs are persisted under
    // record/proofs/work/skill-runs/SKILL-feedback-iteration/**. Engineer authority
    // covers packages/** code; the broad `['**']` declaration was
    // sloppy authoring, not need. Callers can still pass an override
    // via inputs.allowed_write_scopes for niche cases. See
    // ADR-FIREWALL-OVERLAPS-GLOB-AWARE.
    allowed_write_scopes: ['packages/**', 'record/proofs/work/skill-runs/SKILL-feedback-iteration/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-feedback-iteration/**/*.json'],
    risk_level: 'high',
    tags: ['phase-9', 'engineer-loop', 'llm'],
    entry: 'devai agent skill run SKILL-feedback-iteration',
  },
  async run(ctx) {
    const taskId = (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000';
    const worktreeRoot = (ctx.inputs?.worktree_root as string | undefined) ?? ctx.repoRoot;
    const maxIterations = (ctx.inputs?.max_iterations as number | undefined) ?? 3;
    const taskTitle = (ctx.inputs?.task_title as string | undefined) ?? 'unspecified task';
    const taskDescription = (ctx.inputs?.task_description as string | undefined) ?? '';
    const acceptanceCommands =
      (ctx.inputs?.acceptance_commands as ReadonlyArray<ReadonlyArray<string>> | undefined) ?? [];
    const allowedScopes =
      (ctx.inputs?.allowed_write_scopes as ReadonlyArray<string> | undefined) ??
      skillFeedbackIteration.manifest.allowed_write_scopes;

    const sourceContext = readExactBoundedSourceContext(worktreeRoot, allowedScopes, {
      maxFileBytes: 64 * 1024,
      maxTotalBytes: 128 * 1024,
    });
    if (sourceContext.rejected.length > 0) {
      return {
        skill_id: 'SKILL-feedback-iteration',
        status: 'fail',
        notes: [`source context refused: ${sourceContext.rejected.join(', ')}`],
      };
    }

    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const iterations: FeedbackIterationLog[] = [];
    let converged = false;

    for (let i = 1; i <= maxIterations; i++) {
      // 1. Sense.
      const lint = senseLint({ cwd: worktreeRoot });
      const tc = senseTypeCheck({ cwd: worktreeRoot }).aggregate;
      const test = senseTest({ cwd: worktreeRoot, suite: 'unit' });
      const readingsBefore = [lint, tc, test];
      // 2. Compose prompt with current failing findings as payload.
      const failingPayload = readingsBefore
        .filter((r) => r.status !== 'pass')
        .map(
          (r) =>
            `## ${r.sensor.kind} (${r.status})\n` +
            (r.findings ?? [])
              .slice(0, 10)
              .map((f) => `- [${f.severity}] ${f.code}: ${f.message}`)
              .join('\n'),
        )
        .join('\n\n');
      const prompt = loadSkillPrompt('SKILL-feedback-iteration');
      const components = [
        {
          layer: 'global' as const,
          name: 'feedback-iteration.global',
          body: prompt.global,
        },
        {
          layer: 'role' as const,
          name: 'engineer.role',
          body: prompt.role,
        },
        {
          layer: 'task' as const,
          name: 'task.spec',
          body: `Task: ${taskTitle}\n\n${taskDescription}`,
        },
        ...(sourceContext.files.length > 0
          ? [
              {
                layer: 'payload' as const,
                name: 'bounded.source-context',
                body: sourceContext.files
                  .map(({ path, content }) => `## ${path}\n\n${content}`)
                  .join('\n\n'),
              },
            ]
          : []),
        {
          layer: 'payload' as const,
          name: 'iteration.findings',
          body:
            `Iteration ${String(i)} of ${String(maxIterations)}. Implement the task even when baseline gates are already green.\n\n` +
            (failingPayload.length > 0
              ? failingPayload
              : 'Baseline lint, typecheck, and unit gates are green.'),
        },
      ];
      const composition = composePrompt({
        task_id: taskId,
        components,
        timestamp: ctx.timestamp ?? new Date().toISOString(),
      });
      const messages = messagesFromComposition(components);
      const meta = metaFromComposition(composition, 'SKILL-feedback-iteration');

      // 3. LLM call.
      let response;
      try {
        response = await llm.complete(messages, meta, {
          response_format_json: true,
          response_json_schema: responseSchemaForMutatingSkill('SKILL-feedback-iteration'),
          temperature: 0.2,
          max_output_tokens: 4096,
        });
      } catch (err) {
        return {
          skill_id: 'SKILL-feedback-iteration',
          status: 'fail',
          notes: [
            `LLM call failed on iteration ${String(i)}: ${err instanceof Error ? err.message : String(err)}`,
          ],
          evidence: { iterations },
        };
      }

      // 4. Parse + apply edits.
      type ParsedEdits = {
        edits?: Array<{ path?: string; find?: string; replace?: string }>;
        rationale?: string;
      };
      let parsed: ParsedEdits | null = null;
      if (
        response.json !== undefined &&
        response.json !== null &&
        typeof response.json === 'object'
      ) {
        parsed = response.json as ParsedEdits;
      } else {
        try {
          parsed = JSON.parse(response.text) as ParsedEdits;
        } catch {
          parsed = null;
        }
      }
      const validEdits = (parsed?.edits ?? []).filter(
        (edit): edit is { path: string; find: string; replace: string } =>
          typeof edit.path === 'string' &&
          typeof edit.find === 'string' &&
          typeof edit.replace === 'string',
      );
      const editResult = applyExactReplacementsBounded(worktreeRoot, validEdits, allowedScopes);

      // 5. Persist iteration log.
      const iterDir = join(
        ctx.repoRoot,
        `record/proofs/work/skill-runs/SKILL-feedback-iteration/${taskId}/iter-${String(i)}`,
      );
      try {
        mkdirSync(iterDir, { recursive: true });
        writeFileSync(join(iterDir, 'prompt.json'), JSON.stringify(composition, null, 2));
        writeFileSync(join(iterDir, 'response.json'), JSON.stringify(response, null, 2));
        writeFileSync(
          join(iterDir, 'readings-before.json'),
          JSON.stringify(readingsBefore, null, 2),
        );
        writeFileSync(join(iterDir, 'edits.json'), JSON.stringify(editResult, null, 2));
      } catch {
        // best-effort
      }

      // 6. Re-sense.
      const lintAfter = senseLint({ cwd: worktreeRoot });
      const tcAfter = senseTypeCheck({ cwd: worktreeRoot }).aggregate;
      const testAfter = senseTest({ cwd: worktreeRoot, suite: 'unit' });
      const readingsAfter = [lintAfter, tcAfter, testAfter];
      const acceptance = acceptanceCommands.map((command) => {
        if (command.length === 0) return { command, exit_code: 1 };
        const [executable, ...args] = command;
        const run = spawnSync(executable as string, args, {
          cwd: worktreeRoot,
          encoding: 'utf8',
          timeout: 180_000,
          shell: false,
        });
        return { command, exit_code: run.status ?? 1 };
      });
      try {
        writeFileSync(join(iterDir, 'readings-after.json'), JSON.stringify(readingsAfter, null, 2));
      } catch {
        // best-effort
      }
      const convergedAfter =
        editResult.written.length > 0 &&
        readingsAfter.every((r) => r.status === 'pass') &&
        acceptanceCommands.length > 0 &&
        acceptance.every((result) => result.exit_code === 0);
      iterations.push({
        iteration: i,
        readings_before: readingsBefore.map((r) => ({ kind: r.sensor.kind, status: r.status })),
        prompt_pc_id: composition.id,
        llm: {
          family: response.family,
          model: response.model,
          cost_usd: response.usage.cost_usd,
        },
        edits: editResult,
        readings_after: readingsAfter.map((r) => ({ kind: r.sensor.kind, status: r.status })),
        acceptance,
        converged: convergedAfter,
      });
      if (convergedAfter) {
        converged = true;
        break;
      }
    }

    return {
      skill_id: 'SKILL-feedback-iteration',
      status: converged ? 'pass' : 'fail',
      evidence: { task_id: taskId, converged, iterations },
      notes: converged
        ? [`converged in ${String(iterations.length)} iteration(s)`]
        : [
            `did not converge after ${String(iterations.length)} iteration(s); escalate per Article 19`,
          ],
    };
  },
};

const skillFixLint: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-fix-lint',
    title: 'Auto-fix lint',
    version: '1.0.0',
    summary: 'Run sense lint; if failing, run eslint --fix; re-run; record evidence',
    kind: 'command',
    authority_role: 'engineer',
    deterministic: true,
    llm_backed: false,
    agent_class: 'coding-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    // R12 W4 (disposition i — narrow to honest paths): eslint is
    // configured (eslint.config.mjs) to ignore docs/**, .devai/**,
    // dist/**, node_modules/**, coverage/**, generated/**, examples/**.
    // The honest write surface is packages/** source (lintable code).
    // Markdown and ADRs are explicitly NOT linted; the prior
    // `**/*.{ts,tsx,js,jsx,md,json}` declaration over-included `.md`
    // and root-level dot-files that eslint never touches. This skill
    // is family:'fix' but agent_class:'coding-agent' (the autofix is
    // mechanical eslint --fix), so it does NOT qualify for
    // isAutofixSelfScope (which requires review-agent). Narrowing the
    // scope to its honest surface keeps the firewall green without
    // requiring a new exemption. See
    // ADR-FIREWALL-OVERLAPS-GLOB-AWARE.
    allowed_write_scopes: ['packages/**/*.{ts,tsx,js,jsx,json}'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-fix-lint/*.json'],
    risk_level: 'medium',
    tags: ['lint', 'autofix'],
    entry: 'devai agent skill run SKILL-fix-lint',
    family: 'fix',
    gate_id: 'lint',
    auto_fix_capable: 'full',
  },
  async run(ctx) {
    const before = senseLint({ cwd: ctx.repoRoot });
    if (before.status === 'pass') {
      return { skill_id: 'SKILL-fix-lint', status: 'pass', evidence: { before } };
    }
    try {
      execFileSync('npx', ['eslint', '--fix', '.'], {
        cwd: ctx.repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      // eslint --fix exits non-zero when unfixed errors remain; fall through.
    }
    const after = senseLint({ cwd: ctx.repoRoot });
    return {
      skill_id: 'SKILL-fix-lint',
      status: after.status === 'pass' ? 'pass' : 'fail',
      evidence: { before, after },
    };
  },
};

const skillFixBuild: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-fix-build',
    title: 'Diagnose build failure',
    version: '1.0.0',
    summary: 'Run sense build; on failure, surface the SensorReading for downstream remediation',
    kind: 'command',
    authority_role: 'engineer',
    deterministic: true,
    llm_backed: false,
    // MVP: read-only diagnosis. A future Phase-9 variant could apply
    // minimal mechanical fixes (missing imports etc.) under
    // write_requires_flag.
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'read_only',
    allowed_write_scopes: [],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-fix-build/*.json'],
    risk_level: 'low',
    tags: ['build', 'diagnose'],
    entry: 'devai agent skill run SKILL-fix-build',
    family: 'fix',
    gate_id: 'build',
    auto_fix_capable: 'none',
  },
  async run(ctx) {
    const reading = senseBuild({ cwd: ctx.repoRoot });
    return {
      skill_id: 'SKILL-fix-build',
      status: reading.status === 'pass' ? 'pass' : 'fail',
      evidence: reading,
    };
  },
};

const skillFixTest: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-fix-test',
    title: 'Diagnose test failure',
    version: '1.0.0',
    summary: 'Run sense test unit; on failure surface the SensorReading',
    kind: 'command',
    authority_role: 'engineer',
    deterministic: false,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'read_only',
    allowed_write_scopes: [],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-fix-test/*.json'],
    risk_level: 'low',
    tags: ['tests', 'diagnose'],
    entry: 'devai agent skill run SKILL-fix-test',
    family: 'fix',
    gate_id: 'test',
    auto_fix_capable: 'none',
  },
  async run(ctx) {
    const reading = senseTest({ cwd: ctx.repoRoot, suite: 'unit' });
    return {
      skill_id: 'SKILL-fix-test',
      status: reading.status === 'pass' ? 'pass' : 'fail',
      evidence: reading,
    };
  },
};

const skillEmitRgr: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-emit-rgr',
    title: 'Emit Reference Gap Report',
    version: '1.0.0',
    summary: 'Draft a Reference Gap Report from a SensorReading + question text',
    kind: 'template',
    authority_role: 'engineer',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**', 'record/proofs/work/rgr/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-emit-rgr/*.json', 'record/proofs/work/rgr/RGR-*.json'],
    risk_level: 'low',
    tags: ['rgr', 'reference-gap'],
    entry: 'devai agent skill run SKILL-emit-rgr',
  },
  async run(ctx) {
    const reading = ctx.inputs?.reading as SensorReading | undefined;
    const summary = (ctx.inputs?.summary as string | undefined) ?? 'reference gap';
    const ambiguity =
      (ctx.inputs?.ambiguity as string | undefined) ??
      (ctx.inputs?.question as string | undefined) ??
      'specification ambiguity';
    const emitting_task_id = (ctx.inputs?.emitting_task_id as string | undefined) ?? 'TASK-0000';
    const emitting_discipline =
      (ctx.inputs?.emitting_discipline as 'engineer' | 'inspector' | 'auditor' | undefined) ??
      'engineer';
    if (reading === undefined) {
      return { skill_id: 'SKILL-emit-rgr', status: 'fail', notes: ['missing input: reading'] };
    }
    if (!/^TASK-/.test(emitting_task_id)) {
      return {
        skill_id: 'SKILL-emit-rgr',
        status: 'fail',
        notes: [`emitting_task_id must match ^TASK- (got '${emitting_task_id}')`],
      };
    }
    // Evidence refs must match ^EV-. The SensorReading's id is SR-... so
    // we project it into an EV- ref by reusing the hash. Callers can pass
    // explicit evidence_refs:string[] to override.
    const evidence_refs = (ctx.inputs?.evidence_refs as string[] | undefined) ?? [
      reading.id.startsWith('SR-') ? `EV-${reading.id.slice(3)}` : `EV-${reading.id}`,
    ];

    // RGR id must match rgr.schema.json pattern ^RGR-[0-9]{4,}$.
    // Use the counters substrate so the numeric monotonically increases.
    const rgrId = nextRgrId(ctx.repoRoot);
    const rgr = {
      schemaVersion: '1.0.0' as const,
      id: rgrId,
      emitting_task_id,
      emitting_discipline,
      created_at: ctx.timestamp ?? new Date().toISOString(),
      problem: { summary, ambiguity },
      questions: [{ qid: 'Q1', question: ambiguity }],
      evidence_refs,
      status: 'open' as const,
    };
    return validateEvidenceOrFail(
      { skill_id: 'SKILL-emit-rgr', status: 'pass', evidence: rgr },
      validators.rgr,
      'rgr',
    );
  },
};

const skillCompileTestsFromDocs: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-compile-tests-from-docs',
    title: 'Compile tests from docs',
    version: '1.1.0',
    summary:
      'Generate a test plan + stub file from an invariant declaration. LLM-backed (Phase-9 Batch 9.E).',
    kind: 'workflow',
    authority_role: 'inspector',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'coding-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    allowed_write_scopes: ['packages/*/tests/**', 'tests/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-compile-tests-from-docs/*.json'],
    risk_level: 'medium',
    tags: ['phase-9', 'tests', 'scaffold', 'llm'],
    entry: 'devai agent skill run SKILL-compile-tests-from-docs',
  },
  async run(ctx) {
    const invariantId = ctx.inputs?.invariant_id as string | undefined;
    if (invariantId === undefined || !/^INV-[A-Za-z0-9._-]+$/.test(invariantId)) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: ['inputs.invariant_id must be an INV- prefixed, filename-safe identifier'],
      };
    }
    // Locate the invariant file. The caller can override the dir.
    const invariantsDir =
      (ctx.inputs?.invariants_dir as string | undefined) ??
      join(ctx.repoRoot, 'law/invariants');
    const invariantPath = join(invariantsDir, `${invariantId}.json`);
    if (!existsSync(invariantPath)) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: [`invariant file not found: ${invariantPath}`],
      };
    }
    const invariantBody = readFileSync(invariantPath, 'utf8');
    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const prompt = loadSkillPrompt('SKILL-compile-tests-from-docs');
    const components = [
      {
        layer: 'global' as const,
        name: 'compile-tests.global',
        body: prompt.global,
      },
      {
        layer: 'role' as const,
        name: 'inspector.role',
        body: prompt.role,
      },
      {
        layer: 'payload' as const,
        name: 'invariant.body',
        body: invariantBody,
      },
    ];
    const composition = composePrompt({
      task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    const messages = messagesFromComposition(components);
    const meta = metaFromComposition(composition, 'SKILL-compile-tests-from-docs');
    let response;
    try {
      response = await llm.complete(messages, meta, {
        response_format_json: true,
        response_json_schema: responseSchemaForMutatingSkill('SKILL-compile-tests-from-docs'),
        temperature: 0.1,
        max_output_tokens: 2048,
      });
    } catch (err) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
    type CompileTestsResponse = {
      plan?: Array<{ test_name?: string; assertion?: string }>;
      stub_path?: string;
      language?: string;
    };
    let parsed: CompileTestsResponse | null = null;
    if (
      response.json !== undefined &&
      response.json !== null &&
      typeof response.json === 'object'
    ) {
      parsed = response.json as CompileTestsResponse;
    } else {
      try {
        parsed = JSON.parse(response.text) as CompileTestsResponse;
      } catch {
        parsed = null;
      }
    }
    if (parsed === null || !Array.isArray(parsed.plan)) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: ['LLM response did not parse as { plan: [...], stub_path, language }'],
        evidence: { invariant_id: invariantId, raw_response: response.text },
      };
    }
    const taskId = (ctx.inputs?.task_id as string | undefined) ?? '';
    if (!/^TASK-[0-9]{4,}$/.test(taskId)) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: ['inputs.task_id (matching ^TASK-[0-9]{4,}$) is required for candidate output'],
      };
    }
    const stubPath = `packages/skills/tests/contract/generated/${invariantId.toLowerCase()}.candidate.test.ts`;
    const stubAbsolute = join(ctx.repoRoot, stubPath);
    if (existsSync(stubAbsolute)) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: [`refusing to overwrite existing candidate stub: ${stubPath}`],
      };
    }
    const todoLines = parsed.plan
      .filter(
        (item): item is { test_name: string; assertion?: string } =>
          typeof item.test_name === 'string' && item.test_name.length > 0,
      )
      .map((item) => {
        const assertion =
          typeof item.assertion === 'string'
            ? item.assertion.replace(/[\r\n]+/g, ' ').trim()
            : 'No assertion rationale supplied.';
        const testName = item.test_name
          .replace(/[\r\n]+/g, ' ')
          .trim()
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'");
        return `  // Intended assertion: ${assertion}\n  it.todo('${testName}');`;
      });
    if (todoLines.length === 0) {
      return {
        skill_id: 'SKILL-compile-tests-from-docs',
        status: 'fail',
        notes: ['LLM test plan contained no non-empty test_name entries'],
      };
    }
    const stubBody =
      `import { describe, it } from 'vitest';\n\n` +
      `// Candidate test plan generated for ${invariantId}; assertions remain Inspector-authored.\n` +
      `describe('${invariantId} candidate plan', () => {\n` +
      `${todoLines.join('\n\n')}\n` +
      `});\n`;
    mkdirSync(dirname(stubAbsolute), { recursive: true });
    writeFileSync(stubAbsolute, stubBody, 'utf8');
    return {
      skill_id: 'SKILL-compile-tests-from-docs',
      status: 'pass',
      evidence: {
        invariant_id: invariantId,
        plan: parsed.plan,
        stub_path: stubPath,
        proposed_stub_path: parsed.stub_path ?? null,
        language: parsed.language ?? 'typescript',
        llm: {
          family: response.family,
          model: response.model,
          cost_usd: response.usage.cost_usd,
        },
      },
    };
  },
};

/**
 * Read all SensorReading JSON files from `.devai/state/sensor-readings/`
 * (or a caller-supplied dir). Returns an empty array if the dir doesn't
 * exist — empty input yields a vacuous "all UNKNOWN" scorecard, which is
 * a legitimate self-application state when no sense has been run yet.
 */
// Phase 25.B: loadReadingsFromDir was relocated to
// `packages/skills/src/scorecard/inputs.ts` as part of the shared
// scorecard-input resolver. Both SKILL-compute-scorecard and
// SKILL-assess-state now call resolveScorecardInputs, which calls
// loadReadingsFromDir internally. The function is still exported
// from @devai-nyx/loop for external callers (e.g. CLI score-compute).

// nextRgrId — delegates to the shared counter helper. The local
// stub here exists only so the SKILL-emit-rgr body keeps its
// existing call shape; new code should import nextRgrId from
// @devai-nyx/loop (or nextCounterId directly).
function nextRgrId(repoRoot: string): string {
  return nextCounterId({
    repoRoot,
    key: 'RGR',
    prefix: 'RGR',
    effects: { mkdirSync, writeFileSync },
  });
}

const skillAssessState: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-assess-state',
    title: 'Assess current state',
    version: '1.0.0',
    summary:
      'Auditor narrative summary of the current scorecard. ' +
      'If no scorecard is provided, computes one from .devai/state/sensor-readings/.',
    kind: 'command',
    authority_role: 'auditor',
    deterministic: true,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-assess-state/*.json'],
    risk_level: 'low',
    tags: ['assessment', 'audit'],
    entry: 'devai agent skill run SKILL-assess-state',
  },
  async run(ctx) {
    const timestamp = ctx.timestamp ?? new Date().toISOString();
    // Phase 25.B (closes D-A-26): both this skill and
    // SKILL-compute-scorecard now resolve inputs via the same
    // shared helper. The earlier local fallback (which loaded
    // readings from `.devai/state/sensor-readings/` when
    // `ctx.inputs.scorecard` was absent) lives in
    // `resolveScorecardInputs` so both skills agree on cell
    // verdicts against the same state.
    const { scorecard, readings } = resolveScorecardInputs({
      repoRoot: ctx.repoRoot,
      inputs: ctx.inputs,
      timestamp,
    });
    // Phase 23.I: pass readings through so per-cell-class narrative
    // can quote SR finding details, list review reasons, and surface
    // classifier-mismatch UNKNOWNs.
    const assessment = assessScorecard(scorecard, timestamp, 1, readings);
    return validateEvidenceOrFail(
      { skill_id: 'SKILL-assess-state', status: 'pass', evidence: assessment },
      validators.assessment,
      'assessment',
    );
  },
};

const skillReviewDry: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-review-dry',
    title: 'Dry refactor review',
    version: '1.0.0',
    summary:
      'Periodic refactor pass: read named files, propose changes (no edits applied). LLM-backed (Phase-9 Batch 9.E).',
    kind: 'command',
    authority_role: 'engineer',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-review-dry/*.json'],
    risk_level: 'low',
    tags: ['phase-9', 'refactor', 'dry-run', 'llm'],
    entry: 'devai agent skill run SKILL-review-dry',
  },
  async run(ctx) {
    const filesInput = ctx.inputs?.files;
    if (!Array.isArray(filesInput) || filesInput.length === 0) {
      return {
        skill_id: 'SKILL-review-dry',
        status: 'fail',
        notes: ['inputs.files: string[] is required'],
      };
    }
    const focus = (ctx.inputs?.focus as string | undefined) ?? 'general code health';
    const fileContents: Array<{ path: string; body: string }> = [];
    for (const f of filesInput) {
      if (typeof f !== 'string' || f.length === 0) continue;
      const abs = isAbsolute(f) ? f : join(ctx.repoRoot, f);
      if (!existsSync(abs)) continue;
      try {
        fileContents.push({ path: f, body: readFileSync(abs, 'utf8') });
      } catch {
        // skip
      }
    }
    if (fileContents.length === 0) {
      return {
        skill_id: 'SKILL-review-dry',
        status: 'fail',
        notes: ['no readable files in inputs.files'],
      };
    }
    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const REVIEW_DRY_TRUNCATE_AT = 8000;
    const truncated: Array<{ path: string; original_length: number; included_length: number }> = [];
    const payload = fileContents
      .map((f) => {
        const body = f.body.slice(0, REVIEW_DRY_TRUNCATE_AT);
        if (body.length < f.body.length) {
          truncated.push({
            path: f.path,
            original_length: f.body.length,
            included_length: body.length,
          });
        }
        const marker =
          body.length < f.body.length
            ? `\n[TRUNCATED — showing first ${String(body.length)} of ${String(f.body.length)} chars]`
            : '';
        return `### ${f.path}${marker}\n\`\`\`\n${body}\n\`\`\``;
      })
      .join('\n\n');
    const truncationNotice =
      truncated.length > 0
        ? ` Some files in the payload are truncated (marked [TRUNCATED] inline) — do not propose refactors anchored to lines beyond the truncation point.`
        : '';
    const prompt = loadSkillPrompt('SKILL-review-dry');
    const components = [
      {
        layer: 'global' as const,
        name: 'review-dry.global',
        body: prompt.global + truncationNotice,
      },
      {
        layer: 'role' as const,
        name: 'engineer.role',
        body: prompt.role.replace('{{focus}}', focus),
      },
      { layer: 'payload' as const, name: 'review.payload', body: payload },
    ];
    const composition = composePrompt({
      task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    const messages = messagesFromComposition(components);
    const meta = metaFromComposition(composition, 'SKILL-review-dry');
    let response;
    try {
      response = await llm.complete(messages, meta, {
        response_format_json: true,
        temperature: 0.3,
        max_output_tokens: 2048,
      });
    } catch (err) {
      return {
        skill_id: 'SKILL-review-dry',
        status: 'fail',
        notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
    type ReviewDryResponse = {
      proposals?: Array<{
        file?: string;
        line?: number;
        smell?: string;
        suggestion?: string;
        severity?: string;
      }>;
    };
    let parsed: ReviewDryResponse | null = null;
    if (
      response.json !== undefined &&
      response.json !== null &&
      typeof response.json === 'object'
    ) {
      parsed = response.json as ReviewDryResponse;
    } else {
      try {
        parsed = JSON.parse(response.text) as ReviewDryResponse;
      } catch {
        parsed = null;
      }
    }
    if (parsed === null || !Array.isArray(parsed.proposals)) {
      return {
        skill_id: 'SKILL-review-dry',
        status: 'fail',
        notes: ['LLM response did not parse as { proposals: [...] }'],
        evidence: { raw_response: response.text },
      };
    }
    return {
      skill_id: 'SKILL-review-dry',
      status: 'pass',
      evidence: {
        files_reviewed: fileContents.map((f) => f.path),
        truncated_files: truncated,
        proposals: parsed.proposals,
        llm: { family: response.family, model: response.model, cost_usd: response.usage.cost_usd },
      },
    };
  },
};

const skillMutationTest: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-mutation-test',
    title: 'Run mutation testing',
    version: '1.0.0',
    summary:
      'Run an external mutation-testing tool (Stryker, mutmut, etc.) and parse its score. Tool name + threshold come from .devai/config/mutation.json.',
    kind: 'command',
    authority_role: 'inspector',
    deterministic: false,
    llm_backed: false,
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-mutation-test/*.json'],
    risk_level: 'low',
    tags: ['phase-9', 'mutation-testing'],
    entry: 'devai agent skill run SKILL-mutation-test',
  },
  async run(ctx) {
    // Configuration is intentionally external (.devai/config/mutation.json).
    // Pinning to a specific tool (e.g. Stryker) in framework code would
    // couple DEVAI to one ecosystem; clients pick their own.
    const configPath = join(ctx.repoRoot, '.devai/config/mutation.json');
    let config: {
      command?: string[];
      threshold?: number;
      score_regex?: string;
    } = {};
    if (existsSync(configPath)) {
      try {
        config = JSON.parse(readFileSync(configPath, 'utf8')) as typeof config;
      } catch {
        // ignore; fall through to error below
      }
    }
    const command = (ctx.inputs?.command as string[] | undefined) ?? config.command;
    const threshold = (ctx.inputs?.threshold as number | undefined) ?? config.threshold ?? 0.7;
    const scoreRegex = (ctx.inputs?.score_regex as string | undefined) ?? config.score_regex;
    if (command === undefined || command.length === 0) {
      return {
        skill_id: 'SKILL-mutation-test',
        status: 'fail',
        notes: [
          'no mutation-test command configured. Provide inputs.command: string[] or set .devai/config/mutation.json',
          'example: { "command": ["npx", "stryker", "run"], "threshold": 0.7, "score_regex": "Mutation score: ([0-9.]+)%" }',
        ],
      };
    }
    const [bin, ...args] = command;
    if (bin === undefined) {
      return { skill_id: 'SKILL-mutation-test', status: 'fail', notes: ['empty command'] };
    }
    let stdout = '';
    let exitCode = -1;
    try {
      stdout = execFileSync(bin, args, {
        cwd: ctx.repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      exitCode = 0;
    } catch (err) {
      const e = err as { stdout?: string; status?: number; message?: string };
      stdout = e.stdout ?? '';
      exitCode = e.status ?? -1;
      if (stdout.length === 0) {
        return {
          skill_id: 'SKILL-mutation-test',
          status: 'fail',
          notes: [`mutation-test command failed: ${e.message ?? 'unknown'}`],
          evidence: { command, exit_code: exitCode },
        };
      }
    }
    // Extract score. Default regex looks for `Mutation score: 73.5%`
    // style summaries. Clients with non-standard tools provide their
    // own regex in config.
    const re = new RegExp(scoreRegex ?? 'Mutation score:\\s*([0-9.]+)\\s*%');
    const match = re.exec(stdout);
    if (match === null || match[1] === undefined) {
      return {
        skill_id: 'SKILL-mutation-test',
        status: 'fail',
        notes: [
          `mutation-test command exited ${String(exitCode)} but no score matched regex ${re.source}`,
        ],
        evidence: { command, exit_code: exitCode, stdout_head: stdout.slice(0, 2000) },
      };
    }
    const scorePct = Number(match[1]);
    if (!Number.isFinite(scorePct)) {
      return {
        skill_id: 'SKILL-mutation-test',
        status: 'fail',
        notes: [`parsed score is not a number: ${String(match[1])}`],
      };
    }
    const score = scorePct / 100;
    const passed = score >= threshold;
    return {
      skill_id: 'SKILL-mutation-test',
      status: passed ? 'pass' : 'fail',
      evidence: {
        command,
        exit_code: exitCode,
        mutation_score: score,
        threshold,
        passed,
      },
      notes: passed
        ? [
            `mutation score ${(score * 100).toFixed(1)}% ≥ threshold ${(threshold * 100).toFixed(1)}%`,
          ]
        : [
            `mutation score ${(score * 100).toFixed(1)}% < threshold ${(threshold * 100).toFixed(1)}%`,
          ],
    };
  },
};

const skillElicit: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-elicit',
    title: 'Elicit invariant candidates',
    version: '1.1.0',
    summary:
      'Owner/Architect guided interview: a topic + answers → invariant-candidate drafts. LLM-backed (Phase-9 Batch 9.E).',
    kind: 'elicitation',
    authority_role: 'owner',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'review-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    allowed_write_scopes: ['product/draft/**', 'law/draft/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-elicit/*.json'],
    risk_level: 'medium',
    tags: ['phase-9', 'elicitation', 'llm'],
    entry: 'devai agent skill run SKILL-elicit',
  },
  async run(ctx) {
    const topic = ctx.inputs?.topic as string | undefined;
    if (topic === undefined || topic.length === 0) {
      return {
        skill_id: 'SKILL-elicit',
        status: 'fail',
        notes: ['inputs.topic: string is required'],
      };
    }
    // Batch-mode answers (interactive mode is a Phase-10 concern):
    // inputs.answers: Array<{ question, answer }>.
    const answers =
      (ctx.inputs?.answers as Array<{ question?: string; answer?: string }> | undefined) ?? [];
    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const prompt = loadSkillPrompt('SKILL-elicit');
    const components = [
      {
        layer: 'global' as const,
        name: 'elicit.global',
        body: prompt.global,
      },
      {
        layer: 'role' as const,
        name: 'owner-architect.role',
        body: prompt.role,
      },
      {
        layer: 'payload' as const,
        name: 'elicit.topic',
        body: `Topic: ${topic}\n\nPrior Q&A:\n${answers.map((qa) => `Q: ${qa.question ?? '?'}\nA: ${qa.answer ?? ''}`).join('\n\n')}`,
      },
    ];
    const composition = composePrompt({
      task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    const messages = messagesFromComposition(components);
    const meta = metaFromComposition(composition, 'SKILL-elicit');
    let response;
    try {
      response = await llm.complete(messages, meta, {
        response_format_json: true,
        response_json_schema: responseSchemaForMutatingSkill('SKILL-elicit'),
        temperature: 0.4,
        max_output_tokens: 1024,
      });
    } catch (err) {
      return {
        skill_id: 'SKILL-elicit',
        status: 'fail',
        notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
    type ElicitResponse = {
      candidates?: Array<{
        title?: string;
        statement?: string;
        severity?: string;
        rationale?: string;
      }>;
      follow_up_questions?: string[];
    };
    let parsed: ElicitResponse | null = null;
    if (
      response.json !== undefined &&
      response.json !== null &&
      typeof response.json === 'object'
    ) {
      parsed = response.json as ElicitResponse;
    } else {
      try {
        parsed = JSON.parse(response.text) as ElicitResponse;
      } catch {
        parsed = null;
      }
    }
    if (parsed === null || !Array.isArray(parsed.candidates)) {
      return {
        skill_id: 'SKILL-elicit',
        status: 'fail',
        notes: ['LLM response did not parse as { candidates: [...], follow_up_questions: [...] }'],
        evidence: { raw_response: response.text },
      };
    }
    const taskId = (ctx.inputs?.task_id as string | undefined) ?? '';
    if (!/^TASK-[0-9]{4,}$/.test(taskId)) {
      return {
        skill_id: 'SKILL-elicit',
        status: 'fail',
        notes: ['inputs.task_id (matching ^TASK-[0-9]{4,}$) is required for candidate output'],
      };
    }
    const outPath = `product/draft/invariants/${taskId}.json`;
    const outAbsolute = join(ctx.repoRoot, outPath);
    if (existsSync(outAbsolute)) {
      return {
        skill_id: 'SKILL-elicit',
        status: 'fail',
        notes: [`refusing to overwrite existing candidate draft: ${outPath}`],
      };
    }
    const draft = {
      schemaVersion: '1.0.0',
      task_id: taskId,
      skill_id: 'SKILL-elicit',
      topic,
      candidates: parsed.candidates,
      follow_up_questions: parsed.follow_up_questions ?? [],
    };
    mkdirSync(dirname(outAbsolute), { recursive: true });
    writeFileSync(outAbsolute, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
    return {
      skill_id: 'SKILL-elicit',
      status: 'pass',
      evidence: {
        topic,
        candidates: parsed.candidates,
        follow_up_questions: parsed.follow_up_questions ?? [],
        out_path: outPath,
        llm: { family: response.family, model: response.model, cost_usd: response.usage.cost_usd },
      },
    };
  },
};

const skillAlignDocs: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-align-docs',
    title: 'Detect doc coherence drift',
    version: '1.0.0',
    summary:
      'Architect doc coherence pass: read named docs, flag drift / contradictions. LLM-backed (Phase-9 Batch 9.E).',
    kind: 'workflow',
    authority_role: 'architect',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'review-agent',
    permission_tier: 'read',
    host_mutation_policy: 'evidence_only',
    allowed_write_scopes: ['record/proofs/work/skill-runs/**'],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-align-docs/*.json'],
    risk_level: 'low',
    tags: ['phase-9', 'docs', 'drift', 'llm'],
    entry: 'devai agent skill run SKILL-align-docs',
  },
  async run(ctx) {
    const docsInput = ctx.inputs?.docs;
    if (!Array.isArray(docsInput) || docsInput.length < 2) {
      return {
        skill_id: 'SKILL-align-docs',
        status: 'fail',
        notes: ['inputs.docs: string[] (at least 2 paths) is required'],
      };
    }
    const ALIGN_DOCS_TRUNCATE_AT = 16000;
    const loaded: Array<{ path: string; body: string; originalLength: number }> = [];
    for (const d of docsInput) {
      if (typeof d !== 'string' || d.length === 0) continue;
      const abs = isAbsolute(d) ? d : join(ctx.repoRoot, d);
      if (!existsSync(abs)) continue;
      try {
        const fullBody = readFileSync(abs, 'utf8');
        loaded.push({
          path: d,
          body: fullBody.slice(0, ALIGN_DOCS_TRUNCATE_AT),
          originalLength: fullBody.length,
        });
      } catch {
        // skip
      }
    }
    if (loaded.length < 2) {
      return {
        skill_id: 'SKILL-align-docs',
        status: 'fail',
        notes: ['fewer than 2 docs were readable'],
      };
    }
    const truncatedDocs = loaded
      .filter((d) => d.body.length < d.originalLength)
      .map((d) => ({
        path: d.path,
        original_length: d.originalLength,
        included_length: d.body.length,
      }));
    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const payload = loaded
      .map((d) => {
        const marker =
          d.body.length < d.originalLength
            ? `\n[TRUNCATED — showing first ${String(d.body.length)} of ${String(d.originalLength)} chars]`
            : '';
        return `### ${d.path}${marker}\n\`\`\`\n${d.body}\n\`\`\``;
      })
      .join('\n\n');
    const truncationNotice =
      truncatedDocs.length > 0
        ? ' Some docs in the payload are truncated (marked [TRUNCATED] inline) — do not flag missing content past the truncation point as drift.'
        : '';
    const prompt = loadSkillPrompt('SKILL-align-docs');
    const components = [
      {
        layer: 'global' as const,
        name: 'align-docs.global',
        body: prompt.global + truncationNotice,
      },
      {
        layer: 'role' as const,
        name: 'architect.role',
        body: prompt.role,
      },
      { layer: 'payload' as const, name: 'align-docs.payload', body: payload },
    ];
    const composition = composePrompt({
      task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    const messages = messagesFromComposition(components);
    const meta = metaFromComposition(composition, 'SKILL-align-docs');
    let response;
    try {
      response = await llm.complete(messages, meta, {
        response_format_json: true,
        temperature: 0.2,
        max_output_tokens: 2048,
      });
    } catch (err) {
      return {
        skill_id: 'SKILL-align-docs',
        status: 'fail',
        notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
    type AlignDocsResponse = {
      drifts?: Array<{
        doc_a?: string;
        doc_b?: string;
        summary?: string;
        severity?: string;
        suggested_resolution?: string;
      }>;
    };
    let parsed: AlignDocsResponse | null = null;
    if (
      response.json !== undefined &&
      response.json !== null &&
      typeof response.json === 'object'
    ) {
      parsed = response.json as AlignDocsResponse;
    } else {
      try {
        parsed = JSON.parse(response.text) as AlignDocsResponse;
      } catch {
        parsed = null;
      }
    }
    if (parsed === null || !Array.isArray(parsed.drifts)) {
      return {
        skill_id: 'SKILL-align-docs',
        status: 'fail',
        notes: ['LLM response did not parse as { drifts: [...] }'],
        evidence: { raw_response: response.text },
      };
    }
    return {
      skill_id: 'SKILL-align-docs',
      status: 'pass',
      evidence: {
        docs: loaded.map((d) => d.path),
        truncated_docs: truncatedDocs,
        drifts: parsed.drifts,
        llm: { family: response.family, model: response.model, cost_usd: response.usage.cost_usd },
      },
    };
  },
};

// =====================================================================
// Phase 17.F (D-57): writer-skill family — doc synthesis from
// inventory sensor bodies. Each SKILL-write-* maps to a top-level
// `docs/<Name>.md` output. Authority pattern: review-agent + write
// tier with a *single-file* allowed_write_scope (avoids the broader
// docs/** which would overlap Architect-reserved subpaths under the
// prompt-firewall rules from Phase 12.B).
//
// 17.F.1 shipped SKILL-write-overview as the first concrete writer.
// 17.F.2 (this batch) refactors it to use a shared `runWriterSkill`
// helper and adds the remaining 11 writers in one go. Each writer
// is a thin record: id, output path, two prompt strings. All the
// boilerplate (load inventories → compose prompt → call LLM →
// parse JSON → write file → return evidence) lives in the helper.
// =====================================================================

export const coreSkills: readonly SkillEntry[] = [
  skillCommitPush,
  skillTriage,
  skillMaterializePrompt,
  skillComputeScorecard,
  skillCompileBacklog,
  skillFeedbackIteration,
  skillFixLint,
  skillFixBuild,
  skillFixTest,
  skillEmitRgr,
  skillCompileTestsFromDocs,
  skillAssessState,
  skillReviewDry,
  skillMutationTest,
  skillElicit,
  skillAlignDocs,
];
