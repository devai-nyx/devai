import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type { CAC } from 'cac';
import {
  createLlmClient,
  deriveMutatingLlmSkillIds,
  emitAgentRun,
  getSkill,
  listSkills,
  persistSkillEvidence,
  recordMutationCandidate,
  recordMutationEvidenceCommit,
  resolveSensorParams,
  type MutationCandidateRecord,
} from '#core-compat';
import { mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { executeAuthoritySkillRecording } from '../../authority/command-capabilities.js';
import { experimentalLoopRefusal } from '../../runtime-policy.js';
import { validateOrExit } from '../../validate-emit.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Phase 24.C (closes D-A-24): resolve adopter pack's
 * `extractor_params.llm.llm_timeouts: {[skillId]: ms}` for the
 * effective LLM-call timeout registry. Mirrors loop-run's helper.
 */
function resolvePackLlmTimeouts(repoRoot: string): Readonly<Record<string, number>> | undefined {
  try {
    const resolved = resolveSensorParams({ adopterRoot: repoRoot, sensorKind: 'llm' });
    const raw = resolved?.params['llm_timeouts'];
    if (raw === undefined || raw === null || typeof raw !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  else process.stdout.write(JSON.stringify(json) + '\n');
}

export const skillList = defineCommand({
  name: 'skill list',
  description: 'List registered DEVAI skill manifests.',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('skill-list', 'List registered skills')
      .option('--human', 'Human-readable output')
      .action((options: { human?: boolean }) => {
        const manifests = listSkills();
        // Hard-gate (Batch 9.A.1): every manifest emitted must validate
        // against skill-manifest.schema.json. Catches future drift the
        // moment it lands.
        for (const m of manifests) {
          validateOrExit(
            validators.skillManifest,
            m,
            'skill-manifest',
            `devai agent skill list (${m.id})`,
          );
        }
        emit(
          { count: manifests.length, skills: manifests },
          options.human === true,
          `skill list: ${String(manifests.length)} skill(s)\n` +
            manifests
              .map((m) => {
                const kind = m.llm_backed === true ? '[llm]' : '[deterministic]';
                const lifecycle = `[${m.lifecycle ?? 'supported'}]`;
                return `  ${m.id.padEnd(32)} ${m.authority_role.padEnd(10)} ${lifecycle} ${kind}`;
              })
              .join('\n'),
        );
        process.exitCode = EXIT_PASS;
      });
  },
});

export const skillRun = defineCommand({
  name: 'skill run',
  description: 'Run a single skill by id; persist its evidence under .devai/state/skills/',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('skill-run <id>', 'Run a single skill')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--inputs-file <path>', 'JSON file with skill inputs (passed to context.inputs)')
      .option('--timestamp <iso>', 'Override the timestamp passed to the skill')
      .option(
        '--llm-timeout-ms <n>',
        'Override LLM call timeout (ms). Wins over per-skill defaults + pack config. Phase 24.C / D-A-24.',
      )
      .option(
        '--max-iterations <n>',
        'For family=fix skills with auto_fix_capable!=none: max retry attempts on FAIL. Default 3; range 1-10. Skills with auto_fix_capable=none (or absent) always run once. R4-W2.',
      )
      .option(
        '--allow-publish',
        'Grant per-invocation act-tier authority for publish (commit + push + open-pr). Wired to ctx.grants.publish. SKILL-commit-push refuses inputs.push=true without this flag. R5-W3 (ADR-002 §2).',
      )
      .option('--write', 'Authorize a write_requires_flag skill to mutate host substrates')
      .option('--experimental', 'Acknowledge execution of an experimental skill')
      .option(
        '--strict-exit',
        'R10 (D-A-40 / ADR-ROUND-EXECUTE-SEMANTICS Decision 5): for SKILL-round-execute, map the verify-publish verdict to a non-zero exit code (clean=0, deferred=10, with-blockers=20, partial=30, aborted=40, failed=50). Default behavior (no flag) preserves exit 0 for any pass-status result. No effect on other skills.',
      )
      .option('--human', 'Human-readable output')
      .action(
        async (
          id: string,
          options: {
            repoRoot?: string;
            inputsFile?: string;
            timestamp?: string;
            llmTimeoutMs?: number;
            maxIterations?: number;
            allowPublish?: boolean;
            write?: boolean;
            experimental?: boolean;
            strictExit?: boolean;
            human?: boolean;
          },
        ) => {
          const skill = getSkill(id);
          if (skill === null) {
            process.stderr.write(`devai agent skill run: unknown skill '${id}'\n`);
            process.exit(EXIT_USAGE);
          }
          const inputs: Record<string, unknown> =
            options.inputsFile !== undefined
              ? (JSON.parse(readFileSync(options.inputsFile, 'utf8')) as Record<string, unknown>)
              : {};
          const repoRoot = resolve(options.repoRoot ?? DEFAULT_REPO_ROOT);
          if (
            skill.manifest.host_mutation_policy === 'write_requires_flag' &&
            options.write !== true
          ) {
            process.stderr.write(
              `devai agent skill run: ${id} requires explicit --write authorization\n`,
            );
            process.exit(EXIT_USAGE);
          }
          if (options.allowPublish === true && options.write !== true) {
            process.stderr.write('devai agent skill run: --allow-publish also requires --write\n');
            process.exit(EXIT_USAGE);
          }
          if (skill.manifest.lifecycle === 'experimental') {
            const refusal = experimentalLoopRefusal({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              experimental: options.experimental === true,
              write: options.write === true,
            });
            if (refusal !== null) {
              process.stderr.write(
                `devai agent skill run: experimental skill ${id} refused — ${refusal}\n`,
              );
              process.exit(EXIT_USAGE);
            }
          }
          const mutatingLlmSkillIds = deriveMutatingLlmSkillIds(
            listSkills().map((manifest) => ({
              id: manifest.id,
              llm_backed: manifest.llm_backed === true,
              host_mutation_policy: manifest.host_mutation_policy,
            })),
          );
          const requiresTranslationWitness = mutatingLlmSkillIds.includes(id);
          let mutationIntent: Readonly<Record<string, unknown>> | undefined;
          if (requiresTranslationWitness) {
            if (inputs['translation_witness'] !== undefined) {
              process.stderr.write(
                `devai agent skill run: CANDIDATE_PROVENANCE_CALLER_SUPPLIED: inputs.translation_witness is forbidden; supply inputs.mutation_intent\n`,
              );
              process.exit(EXIT_USAGE);
            }
            const intent = inputs['mutation_intent'];
            if (intent === undefined || typeof intent !== 'object' || intent === null) {
              process.stderr.write(
                `devai agent skill run: ${id} requires inputs.mutation_intent for R28 report-only evidence\n`,
              );
              process.exit(EXIT_USAGE);
            }
            if (!validators.mutationIntent(intent)) {
              process.stderr.write(
                `devai agent skill run: MUTATION_INTENT_INVALID: ${JSON.stringify(validators.mutationIntent.errors ?? [])}\n`,
              );
              process.exit(EXIT_USAGE);
            }
            const authorityRole = skill.manifest.authority_role;
            if (!['owner', 'architect', 'inspector', 'engineer'].includes(authorityRole)) {
              process.stderr.write(
                `devai agent skill run: ${id} has no R28 witness-compatible authority role\n`,
              );
              process.exit(EXIT_USAGE);
            }
            const typedIntent = intent as {
              readonly skill_id?: unknown;
              readonly authority_role?: unknown;
            };
            if (typedIntent.skill_id !== id || typedIntent.authority_role !== authorityRole) {
              process.stderr.write(
                `devai agent skill run: MUTATION_INTENT_SKILL_AUTHORITY_MISMATCH\n`,
              );
              process.exit(EXIT_USAGE);
            }
            mutationIntent = intent as Readonly<Record<string, unknown>>;
          }
          const startedAt = new Date().toISOString();
          // Phase 24.C: when --llm-timeout-ms is set OR the pack
          // declares llm_timeouts, build an LLM client at CLI level
          // and pass it via ctx.llm so the skill uses the configured
          // timeout. Otherwise leave llm absent so the skill builds
          // its own (back-compat).
          const packTimeouts = resolvePackLlmTimeouts(repoRoot);
          const llm =
            options.llmTimeoutMs !== undefined || packTimeouts !== undefined
              ? createLlmClient({
                  repoRoot,
                  ...(options.llmTimeoutMs !== undefined && {
                    llmTimeoutOverrideMs: Number(options.llmTimeoutMs),
                  }),
                  ...(packTimeouts !== undefined && { packTimeouts }),
                })
              : undefined;
          // R4-W2 — iteration loop. Skills with auto_fix_capable !== 'none'
          // retry up to --max-iterations on FAIL. Default = 3; bounded 1-10.
          // Skills without the field (or value 'none') always run once.
          const autoFixCap = skill.manifest.auto_fix_capable;
          const iterateThisSkill = autoFixCap !== undefined && autoFixCap !== 'none';
          let maxIterations = skill.manifest.host_mutation_policy === 'write_requires_flag' ? 1 : 3;
          if (options.maxIterations !== undefined) {
            const n = Number(options.maxIterations);
            if (!Number.isInteger(n) || n < 1 || n > 10) {
              process.stderr.write(
                `devai agent skill run: --max-iterations must be an integer in [1,10] (got '${String(options.maxIterations)}')\n`,
              );
              process.exit(EXIT_USAGE);
            }
            maxIterations = n;
          }
          if (mutationIntent !== undefined && maxIterations !== 1) {
            process.stderr.write(
              'devai agent skill run: MUTATION_ITERATION_FORBIDDEN: recorder-governed skills require exactly one mutation run\n',
            );
            process.exit(EXIT_USAGE);
          }
          const effectiveMax = iterateThisSkill ? maxIterations : 1;

          // R5-W3 (ADR-002 §2) — per-CLI-invocation act-tier session-grant.
          // Threads into SkillContext.grants. SKILL-commit-push reads
          // grants.publish before honoring inputs.push=true. SKILL-round-
          // execute composer forwards grants to verify-publish only.
          const grants = options.allowPublish === true ? { publish: true } : undefined;

          const baseCtx = {
            repoRoot,
            ...(options.timestamp !== undefined && { timestamp: options.timestamp }),
            ...(llm !== undefined && { llm }),
            ...(grants !== undefined && { grants }),
            inputs,
          };
          // Run the (possibly iterating) loop and return the LAST verdict +
          // attempts. Always runs ≥1 time because effectiveMax ≥ 1.
          const executeRegisteredSkill = async () => {
            let last: Awaited<ReturnType<typeof skill.run>> | undefined;
            let used = 0;
            for (let iter = 1; iter <= effectiveMax; iter += 1) {
              used = iter;
              last = await skill.run({
                ...baseCtx,
                ...(iterateThisSkill && {
                  iteration: { current: iter, max: effectiveMax },
                }),
              });
              if (last.status === 'pass' || last.status === 'skipped') break;
              // FAIL on a non-final iteration: continue. The skill's
              // run() is expected to mutate host state between attempts
              // (e.g., SKILL-fix-lint runs eslint --fix). The substrate
              // just retries — no CLI-level mutation.
            }
            // `last` is defined because the loop ran ≥1 time.
            return { result: last as Awaited<ReturnType<typeof skill.run>>, iterationsUsed: used };
          };
          let execution: Awaited<ReturnType<typeof executeRegisteredSkill>> | undefined;
          let candidateRecord: MutationCandidateRecord | undefined;
          if (mutationIntent !== undefined) {
            candidateRecord = await recordMutationCandidate({
              repo_root: repoRoot,
              intent: mutationIntent,
              emitted_at: options.timestamp ?? new Date().toISOString(),
              run: async () => {
                execution = await executeRegisteredSkill();
                return execution.result;
              },
            });
          } else {
            execution = await executeRegisteredSkill();
          }
          if (execution === undefined) throw new Error('MUTATION_SKILL_DID_NOT_RUN');
          const { result, iterationsUsed } = execution;
          if (candidateRecord !== undefined) {
            const existingEvidence = result.evidence;
            const evidence =
              typeof existingEvidence === 'object' &&
              existingEvidence !== null &&
              !Array.isArray(existingEvidence)
                ? {
                    ...(existingEvidence as Record<string, unknown>),
                    translation_witness: candidateRecord.witness,
                  }
                : {
                    skill_evidence: existingEvidence,
                    translation_witness: candidateRecord.witness,
                  };
            (result as { evidence?: unknown }).evidence = evidence;
          }
          // Append an iteration-count note when actually iterating.
          if (iterateThisSkill && iterationsUsed > 1) {
            const iterationNote = `R4-W2 iteration: ${String(iterationsUsed)}/${String(effectiveMax)} attempts (auto_fix_capable=${String(autoFixCap)})`;
            (result as { notes?: readonly string[] }).notes = [
              ...(result.notes ?? []),
              iterationNote,
            ];
          }
          let evidencePath: string | null = null;
          let agentRunPath: string | null = null;
          let witnessPath: string | null = null;
          let taskStatePath: string | null = null;
          if (candidateRecord !== undefined) {
            witnessPath = resolve(
              repoRoot,
              `.devai/state/translation-validation/witnesses/${String(candidateRecord.witness['id'])}.json`,
            );
            taskStatePath = `.devai/state/tasks/${String(candidateRecord.witness['task_id'])}.json`;
          }
          executeAuthoritySkillRecording(id, () => {
            if (witnessPath !== null && candidateRecord !== undefined) {
              mkdirSync(dirname(witnessPath), { recursive: true });
              writeFileSync(witnessPath, `${JSON.stringify(candidateRecord.witness, null, 2)}\n`);
            }
            evidencePath = persistSkillEvidence({
              repoRoot,
              result,
            });
            const record = emitAgentRun({
              repoRoot,
              caller: { kind: 'skill', name: id },
              started_at: startedAt,
              ended_at: new Date().toISOString(),
              files_read: [
                ...(options.inputsFile !== undefined ? [options.inputsFile] : []),
                ...(taskStatePath !== null ? [taskStatePath] : []),
              ],
              files_written: [evidencePath, ...(witnessPath !== null ? [witnessPath] : [])],
              compliance: { invariant_ids: ['INV-DEVAI-010'] },
              outcome: {
                status: result.status,
                ...(result.notes !== undefined && { notes: [...result.notes] }),
              },
            });
            agentRunPath = `${repoRoot}/.devai/state/agent-runs/${record.run_id}.json`;
          });
          const evidenceRecord =
            candidateRecord !== undefined && mutationIntent !== undefined
              ? recordMutationEvidenceCommit({
                  repo_root: repoRoot,
                  intent_id: String(mutationIntent['id']),
                  candidate_sha: candidateRecord.candidate_sha,
                  timestamp: options.timestamp ?? new Date().toISOString(),
                  skill_id: id,
                  witness: candidateRecord.witness,
                  state_paths: [
                    ...new Set(
                      [
                        ...candidateRecord.runtime_state_paths,
                        ...(existsSync(resolve(repoRoot, '.devai/state/llm-usage.jsonl'))
                          ? ['.devai/state/llm-usage.jsonl']
                          : []),
                        ...(evidencePath !== null ? [relative(repoRoot, evidencePath)] : []),
                        ...(agentRunPath !== null ? [relative(repoRoot, agentRunPath)] : []),
                        ...(witnessPath !== null ? [relative(repoRoot, witnessPath)] : []),
                        ...(taskStatePath !== null ? [taskStatePath] : []),
                      ].map((path) => path.replaceAll('\\', '/')),
                    ),
                  ],
                })
              : undefined;
          emit(
            {
              ...result,
              evidence_path: evidencePath,
              agent_run_path: agentRunPath,
              ...(candidateRecord !== undefined && {
                candidate_sha: candidateRecord.candidate_sha,
                candidate_ref: candidateRecord.candidate_ref,
                translation_witness: candidateRecord.witness,
              }),
              ...(evidenceRecord !== undefined && {
                evidence_sha: evidenceRecord.evidence_sha,
                evidence_ref: evidenceRecord.evidence_ref,
              }),
            },
            options.human === true,
            `skill run ${id}: ${result.status.toUpperCase()}` +
              (result.notes !== undefined ? '\n  ' + result.notes.join('\n  ') : '') +
              (evidencePath !== null ? `\n  evidence: ${evidencePath}` : '') +
              (agentRunPath !== null ? `\n  agent-run: ${agentRunPath}` : ''),
          );
          // R10 (D-A-40 / ADR Decision 5) — --strict-exit maps the
          // round-execute verdict to a non-zero exit code. Default
          // behavior preserves EXIT_PASS for any pass/skipped status
          // regardless of verdict (back-compat with current CI users).
          if (options.strictExit === true && id === 'SKILL-round-execute') {
            const ev = (
              result.evidence as { executed_artifacts?: { verdict?: string } } | undefined
            )?.executed_artifacts;
            const verdict = ev?.verdict;
            const verdictExitMap: Record<string, number> = {
              clean: 0,
              deferred: 10,
              'with-blockers': 20,
              partial: 30,
              aborted: 40,
              failed: 50,
            };
            if (typeof verdict === 'string' && verdict in verdictExitMap) {
              const code = verdictExitMap[verdict] as number;
              process.exitCode = code;
              return;
            }
          }
          process.exitCode =
            result.status === 'pass' || result.status === 'skipped' ? EXIT_PASS : EXIT_FAIL;
        },
      );
  },
});
