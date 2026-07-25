import { mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import {
  appendDecisionRecord,
  appendResolutionRecord,
  readAllLedgerRecords,
} from '../ledger/records.js';
import { computeRoundVerdict } from '../ledger/verdict.js';
import { buildCloseoutMd } from '../round/closeout.js';
import {
  buildAuditScratchMd,
  buildBacklogMd,
  buildOrchestratorTemplate,
  buildWavePromptTemplate,
  ensureAuditDir,
  ensurePromptsDir,
  resolveAuditDir,
  roundDir,
  type RoundPlan,
} from '../round/scaffold.js';
import {
  computeScorecardDelta,
  escalateBlocker,
  findNextFreeRoundN,
  readOpenBlockersForRound,
  readWaveLogStatuses,
} from '../round/state.js';
import {
  MANDATORY_MIN_GATES,
  findWavePromptFile,
  isUnbackedWave,
  parseWaveCatalog,
  parseWavePromptHeader,
  pollWaveLog,
  readWaveLogStatus,
  runGate,
  writeWaveLog,
  type DispatchedWave,
  type GateRun,
} from '../round/waves.js';
import type { GateEvidence, RoundVerdict, SkillEntry, SkillResult } from '../types.js';

export function createRoundSkills(
  resolveSkill: (skillId: string) => SkillEntry | null,
): readonly SkillEntry[] {
  const skillRoundAudit: SkillEntry = {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-audit',
      title: 'Round audit',
      version: '1.0.0',
      summary:
        'Measure phase of the round loop. R4-W3 real execution: invokes SKILL-assess-state + ' +
        'SKILL-compute-scorecard and materializes the audit context pack (scratch.md, ' +
        'assessment.json, scorecard.baseline.json) under work/audit/R-NNNN/.',
      kind: 'workflow',
      authority_role: 'auditor',
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: ['record/proofs/work/skill-runs/**', 'work/audit/R-*/**'],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-audit/*.json'],
      risk_level: 'medium',
      tags: ['round', 'audit', 'measure'],
      entry: 'devai agent skill run SKILL-round-audit',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'audit',
    },
    async run(ctx) {
      const dir = roundDir(ctx);
      const auditDir = ensureAuditDir(ctx.repoRoot, dir);
      const filesWritten: string[] = [];

      // Sub-skill: SKILL-assess-state.
      let assessEvidence: unknown = null;
      const assess = resolveSkill('SKILL-assess-state');
      if (assess !== null) {
        try {
          const r = await assess.run({ repoRoot: ctx.repoRoot });
          if (r.status === 'pass' && r.evidence !== undefined) {
            assessEvidence = r.evidence;
            const p = join(auditDir, 'assessment.json');
            writeFileSync(p, JSON.stringify(r.evidence, null, 2));
            filesWritten.push(p);
          }
        } catch {
          // best-effort — sub-skill failure doesn't fail the round-audit run
        }
      }

      // Sub-skill: SKILL-compute-scorecard.
      let scorecardEvidence: unknown = null;
      const scorecard = resolveSkill('SKILL-compute-scorecard');
      if (scorecard !== null) {
        try {
          const r = await scorecard.run({ repoRoot: ctx.repoRoot });
          if (r.status === 'pass' && r.evidence !== undefined) {
            scorecardEvidence = r.evidence;
            const p = join(auditDir, 'scorecard.baseline.json');
            writeFileSync(p, JSON.stringify(r.evidence, null, 2));
            filesWritten.push(p);
          }
        } catch {
          // best-effort
        }
      }

      // Materialize scratch.md.
      const scratchPath = join(auditDir, 'scratch.md');
      writeFileSync(scratchPath, buildAuditScratchMd(dir, assessEvidence, scorecardEvidence));
      filesWritten.push(scratchPath);

      // Enriched envelope: static plan (back-compat) + executed_artifacts.
      const plan: RoundPlan = {
        round_dir: dir,
        phase: 'audit',
        steps: [
          {
            id: 'audit.1',
            description: 'Run SKILL-assess-state to compute the current scorecard.',
          },
          {
            id: 'audit.2',
            description: 'Run SKILL-compute-scorecard for the per-cell verdict matrix.',
          },
          {
            id: 'audit.3',
            description: `Materialize ${auditDir.replace(`${ctx.repoRoot}/`, '')}/scratch.md with findings, open questions, and prior-round carryovers.`,
          },
          {
            id: 'audit.4',
            description: `Snapshot relevant governance inputs into ${auditDir.replace(`${ctx.repoRoot}/`, '')}/inputs/.`,
          },
        ],
        next_phase: 'backlog',
        references: {
          prompts_library: 'docs/adopters/round-prompts/B0-audit.md',
          skills: ['SKILL-assess-state', 'SKILL-compute-scorecard'],
        },
      };
      return {
        skill_id: 'SKILL-round-audit',
        status: 'pass',
        evidence: {
          ...plan,
          executed_artifacts: {
            round_dir: dir,
            audit_dir: auditDir.replace(`${ctx.repoRoot}/`, ''),
            files: filesWritten.map((f) => f.replace(`${ctx.repoRoot}/`, '')),
            sub_skill_results: {
              'SKILL-assess-state': assessEvidence !== null ? 'pass' : 'skipped',
              'SKILL-compute-scorecard': scorecardEvidence !== null ? 'pass' : 'skipped',
            },
          },
        },
      };
    },
  };

  const skillRoundBacklog: SkillEntry = {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-backlog',
      title: 'Round backlog',
      version: '1.0.0',
      summary:
        'Plan phase of the round loop. R4-W3 real execution: reads the audit scorecard, invokes ' +
        'SKILL-compile-backlog, and materializes backlog.json + backlog.md + per-item templated ' +
        'wave prompts under work/rounds/R-NNNN/{,prompts/}.',
      kind: 'workflow',
      authority_role: 'architect',
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: ['record/proofs/work/skill-runs/**', 'work/rounds/R-*/**'],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-backlog/*.json'],
      risk_level: 'medium',
      tags: ['round', 'backlog', 'plan'],
      entry: 'devai agent skill run SKILL-round-backlog',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'backlog',
    },
    async run(ctx) {
      const dir = roundDir(ctx);
      const roundDirAbs = isAbsolute(dir) ? dir : join(ctx.repoRoot, dir);
      const auditDir = resolveAuditDir(ctx.repoRoot, dir);
      const promptsDir = ensurePromptsDir(ctx.repoRoot, dir);
      const filesWritten: string[] = [];

      // Read the scorecard baseline if present (audit must have run first).
      let scorecard: unknown = null;
      const scPath = join(auditDir, 'scorecard.baseline.json');
      if (existsSync(scPath)) {
        try {
          scorecard = JSON.parse(readFileSync(scPath, 'utf8'));
        } catch {
          // best-effort; absent scorecard → empty backlog
        }
      }

      // Sub-skill: SKILL-compile-backlog.
      let items: unknown[] = [];
      const compile = resolveSkill('SKILL-compile-backlog');
      if (compile !== null && scorecard !== null) {
        try {
          const r = await compile.run({
            repoRoot: ctx.repoRoot,
            inputs: { scorecard },
          });
          if (r.status === 'pass' && r.evidence !== undefined) {
            const ev = r.evidence as { items?: unknown[] };
            items = ev.items ?? [];
          }
        } catch {
          // best-effort; absent compile → empty backlog
        }
      }

      // Write backlog.json (raw) + backlog.md (narrative).
      const backlogJsonPath = join(roundDirAbs, 'backlog.json');
      mkdirSync(dirname(backlogJsonPath), { recursive: true });
      writeFileSync(
        backlogJsonPath,
        JSON.stringify({ items, generated_at: new Date().toISOString() }, null, 2),
      );
      filesWritten.push(backlogJsonPath);

      const backlogMdPath = join(roundDirAbs, 'backlog.md');
      writeFileSync(backlogMdPath, buildBacklogMd(dir, items));
      filesWritten.push(backlogMdPath);

      // Materialize per-item templated wave prompts under prompts/.
      // Wave numbering: items get 01..NN (00 is reserved for the orchestrator).
      const roundN = (ctx.inputs?.['round_n'] as number | string | undefined) ?? 0;
      for (let i = 0; i < items.length; i += 1) {
        const waveN = i + 1; // 01..NN
        const item = items[i] as {
          id?: string;
          title?: string;
          priority?: number;
          cell?: string;
          description?: string;
        };
        const slug = (item.title ?? item.id ?? `wave-${String(waveN)}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 50);
        const fname = `${String(waveN).padStart(2, '0')}-${slug}.md`;
        const path = join(promptsDir, fname);
        writeFileSync(path, buildWavePromptTemplate(roundN, waveN, item));
        filesWritten.push(path);
      }

      // R6-W1 (closes F-1): materialize default 00-orchestrator.md alongside
      // wave prompts. Operator can replace, but the substrate now provides
      // a sane default so SKILL-round-orchestrate has a wave catalog to
      // parse on first composer run. Do NOT overwrite if a hand-authored
      // orchestrator already exists.
      const orchestratorPath = join(promptsDir, '00-orchestrator.md');
      if (!existsSync(orchestratorPath)) {
        writeFileSync(
          orchestratorPath,
          buildOrchestratorTemplate(
            roundN,
            items as Array<{ id?: string; title?: string; cell?: string }>,
          ),
        );
        filesWritten.push(orchestratorPath);
      }

      const plan: RoundPlan = {
        round_dir: dir,
        phase: 'backlog',
        steps: [
          {
            id: 'backlog.1',
            description: `Read ${dir}/audit/scratch.md and run SKILL-compile-backlog for the failing-cell list.`,
          },
          {
            id: 'backlog.2',
            description: 'Group items into waves; assign Model effort hints (low/medium/high).',
          },
          {
            id: 'backlog.3',
            description: `Materialize ${dir}/prompts/00-orchestrator.md from B3 template.`,
          },
          {
            id: 'backlog.4',
            description: `Materialize ${dir}/prompts/NN-<slug>.md per backlog item from B1/B2 templates.`,
          },
          {
            id: 'backlog.5',
            description:
              'Each worker prompt MUST carry Goal / Inputs / Deliverable / Acceptance / Logging / Model headings.',
          },
        ],
        next_phase: 'orchestrate',
        references: {
          prompts_library: 'docs/adopters/round-prompts/B1-backlog.md',
          skills: ['SKILL-compile-backlog'],
        },
      };
      return {
        skill_id: 'SKILL-round-backlog',
        status: 'pass',
        evidence: {
          ...plan,
          executed_artifacts: {
            round_dir: dir,
            prompts_dir: `${dir}/prompts`,
            backlog_item_count: items.length,
            files: filesWritten.map((f) => f.replace(`${ctx.repoRoot}/`, '')),
          },
        },
      };
    },
  };

  // R4-W4 — real execution for SKILL-round-orchestrate.
  // Parses the wave catalog from prompts/00-orchestrator.md, dispatches
  // waves sequentially (skill-backed in-process; prompt-only via poll-
  // with-timeout), runs gates between waves with R4-W2's iteration
  // substrate, escalates blockers into .devai/state/decisions.jsonl.

  const skillRoundOrchestrate: SkillEntry = {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-orchestrate',
      title: 'Round orchestrate',
      version: '1.0.0',
      lifecycle: 'experimental',
      lifecycle_reason:
        'Autonomous wave dispatch and fix-skill composition require a verified host adapter and role-separated execution.',
      promotion_criteria: [
        'Role-separated controller dispatch is enforced mechanically.',
        'Mutating subprocesses execute only through a verified host adapter.',
        'A supervised adopter pilot demonstrates recoverable operation.',
      ],
      summary:
        'Execute phase of the round loop. R4-W4 real execution: parses the wave catalog from ' +
        'prompts/00-orchestrator.md, dispatches waves sequentially (skill-backed in-process; ' +
        'prompt-only via poll-with-timeout), runs gates between waves with the R4-W2 iteration ' +
        'substrate, escalates blockers into .devai/state/decisions.jsonl.',
      kind: 'workflow',
      authority_role: 'orchestrator',
      deterministic: false,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: [
        'work/rounds/R-*/**',
        'record/proofs/work/skill-runs/**',
        '.devai/state/decisions.jsonl',
      ],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-orchestrate/*.json'],
      risk_level: 'high',
      tags: ['round', 'orchestrate', 'execute'],
      entry: 'devai agent skill run SKILL-round-orchestrate',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'orchestrate',
    },
    async run(ctx) {
      const dir = roundDir(ctx);
      const roundN = (ctx.inputs?.['round_n'] as number | string | undefined) ?? 0;
      const roundDirAbs = isAbsolute(dir) ? dir : join(ctx.repoRoot, dir);
      const promptsDir = join(roundDirAbs, 'prompts');
      const orchestratorPath = join(promptsDir, '00-orchestrator.md');
      const waveTimeoutMs = (ctx.inputs?.['wave_timeout_ms'] as number | undefined) ?? 3600000; // 1h default

      // R11 (closes R6 F-4) — unbacked-wave knobs. Pack-tune via:
      //   extractor_params.round_orchestrate.skip_unbacked_waves (default true)
      //   extractor_params.round_orchestrate.unbacked_wave_timeout_ms (default 180_000 = 3min)
      // When skip_unbacked_waves=true (default), unbacked waves emit a NOTE log entry
      // with status=not-dispatched and move on immediately — no poll wait.
      // When skip_unbacked_waves=false, unbacked waves use unbacked_wave_timeout_ms
      // (3min) instead of the full 1h wave_timeout_ms.
      const skipUnbackedWaves =
        (ctx.inputs?.['skip_unbacked_waves'] as boolean | undefined) ?? true;
      const unbackedWaveTimeoutMs =
        (ctx.inputs?.['unbacked_wave_timeout_ms'] as number | undefined) ?? 180000; // 3min default

      const dispatched: DispatchedWave[] = [];
      const escalatedBlockers: string[] = [];
      const pushIfId = (id: string | null): void => {
        if (id !== null) escalatedBlockers.push(id);
      };
      const gateRuns: GateRun[] = [];

      // Static plan — preserved as the back-compat envelope across both
      // success and failure paths.
      const plan: RoundPlan = {
        round_dir: dir,
        phase: 'orchestrate',
        steps: [
          {
            id: 'orch.1',
            description: `Read ${dir}/prompts/00-orchestrator.md (wave fan-out + gates).`,
          },
          {
            id: 'orch.2',
            description:
              'For each wave: dispatch worker prompts (parallel where the orchestrator marks safe).',
          },
          {
            id: 'orch.3',
            description:
              'After each wave: run the gates declared by the orchestrator (lint, typecheck, schema validate).',
          },
          {
            id: 'orch.4',
            description:
              'On gate failure: invoke SKILL-fix-lint / SKILL-fix-build / SKILL-fix-test as appropriate.',
          },
          { id: 'orch.5', description: `Maintain ${dir}/blockers.md for human-input items.` },
        ],
        next_phase: 'verify-publish',
        references: {
          prompts_library: 'docs/adopters/round-prompts/B3-orchestrate.md',
          skills: ['SKILL-fix-lint', 'SKILL-fix-build', 'SKILL-fix-test'],
        },
      };

      // Discovery: parse the wave catalog from the orchestrator prompt.
      // If the round dir doesn't exist (or the prompt is missing), degrade
      // to dry-run mode — emit the plan envelope without dispatching. This
      // preserves back-compat for callers that invoke orchestrate with a
      // not-yet-scaffolded round_n (e.g., the R2-Δ3 dry-run tests).
      if (!existsSync(orchestratorPath)) {
        return {
          skill_id: 'SKILL-round-orchestrate',
          status: 'pass',
          notes: [
            `Round dir not present (no orchestrator prompt at ${orchestratorPath}); dry-run mode — no waves dispatched.`,
          ],
          evidence: {
            ...plan,
            executed_artifacts: {
              round_dir: dir,
              mode: 'dry-run',
              reason: 'orchestrator_prompt_absent',
              dispatched: [],
              blockers_escalated: [],
              gate_runs: [],
            },
          },
        };
      }
      const catalog = parseWaveCatalog(readFileSync(orchestratorPath, 'utf8'));

      // Dispatch loop — sequential.
      for (const entry of catalog) {
        const promptPath = findWavePromptFile(promptsDir, entry.num);
        if (promptPath === null) {
          dispatched.push({ num: entry.num, slug: entry.slug, mode: 'skipped', status: 'aborted' });
          const id = escalateBlocker(ctx.repoRoot, {
            roundId: `R${String(roundN)}`,
            waveId: `R${String(roundN)}-W${String(entry.num)}`,
            subject: `R${String(roundN)}-W${String(entry.num)} (${entry.slug}) — wave prompt not found`,
            description: `Orchestrator catalog declared wave ${String(entry.num)} (${entry.slug}) but no matching prompt file under ${promptsDir}.`,
          });
          pushIfId(id);
          continue;
        }
        const logPath = promptPath.replace(/\.md$/, '.log');

        // Idempotency: skip clean.
        const existingStatus = readWaveLogStatus(logPath);
        if (existingStatus === 'clean') {
          dispatched.push({ num: entry.num, slug: entry.slug, mode: 'skipped', status: 'skipped' });
          continue;
        }

        // Read wave prompt header.
        const header = parseWavePromptHeader(readFileSync(promptPath, 'utf8'));

        let waveStatus: 'clean' | 'blocked' | 'aborted' | 'timeout';
        let mode: 'skill' | 'poll';

        // CASE I — skill-backed wave.
        const subSkill = header.skill_id !== undefined ? resolveSkill(header.skill_id) : null;
        if (header.skill_id !== undefined && subSkill !== null) {
          mode = 'skill';
          let subResult: SkillResult;
          try {
            subResult = await subSkill.run({
              repoRoot: ctx.repoRoot,
              inputs: { round_n: roundN, wave_num: entry.num },
            });
          } catch (err) {
            subResult = {
              skill_id: header.skill_id,
              status: 'fail',
              notes: [
                `exception during sub-skill execution: ${err instanceof Error ? err.message : String(err)}`,
              ],
            };
          }
          waveStatus =
            subResult.status === 'pass' || subResult.status === 'skipped' ? 'clean' : 'blocked';
          writeWaveLog(logPath, {
            roundN,
            waveNum: entry.num,
            slug: entry.slug,
            status: waveStatus,
            summary: `Skill-backed wave invoked SKILL-${header.skill_id} in-process. Sub-skill status: ${subResult.status}.`,
          });
        } else {
          // CASE II — prompt-only wave. agent_cli header is reserved for future II.b.
          // R11 (closes R6 F-4): detect unbacked (auto-generated, no dispatch:/SKILL-*)
          // waves and handle them without the 1h poll-wait.
          const unbacked = isUnbackedWave(promptPath);
          if (unbacked && skipUnbackedWaves) {
            // CASE II.a — unbacked + skip_unbacked_waves=true (default).
            // Emit a NOTE wave log with status=not-dispatched; move on immediately.
            // No blocker escalation — this is an expected skip, not a failure.
            writeWaveLog(logPath, {
              roundN,
              waveNum: entry.num,
              slug: entry.slug,
              status: 'not-dispatched',
              summary:
                `NOTE (R11 R6-F-4): wave has no dispatch:/skill_id:/agent_cli: header and no SKILL-* ` +
                `body reference — classified as auto-generated/unbacked. ` +
                `skip_unbacked_waves=true; skipping poll. ` +
                `To force a full poll on this wave, set skip_unbacked_waves=false or add a dispatch: header.`,
            });
            dispatched.push({
              num: entry.num,
              slug: entry.slug,
              mode: 'not-dispatched',
              status: 'not-dispatched',
            });
            continue;
          }
          // CASE II.b — poll-with-timeout.
          // Unbacked + skip_unbacked_waves=false → short timeout. Backed → full timeout.
          const effectiveTimeout = unbacked ? unbackedWaveTimeoutMs : waveTimeoutMs;
          mode = 'poll';
          if (existingStatus === 'not_present') {
            writeWaveLog(logPath, {
              roundN,
              waveNum: entry.num,
              slug: entry.slug,
              status: 'dispatched',
              summary:
                `Dispatched at ${new Date().toISOString()} (R4-W4 poll-with-timeout). ` +
                `Agent or human SHOULD update status to clean|blocked|aborted on completion. ` +
                `Timeout: ${String(effectiveTimeout)}ms` +
                (unbacked ? ` (unbacked-wave short timeout; skip_unbacked_waves=false).` : `.`),
            });
          }
          waveStatus = await pollWaveLog(logPath, effectiveTimeout);
          if (waveStatus === 'timeout') {
            // Convert to a blocker.
            writeWaveLog(logPath, {
              roundN,
              waveNum: entry.num,
              slug: entry.slug,
              status: 'blocked',
              summary: `Polled ${String(effectiveTimeout)}ms; no clean|blocked|aborted status set; orchestrator marked blocked.`,
            });
          }
        }

        dispatched.push({ num: entry.num, slug: entry.slug, mode, status: waveStatus });

        if (waveStatus !== 'clean') {
          const id = escalateBlocker(ctx.repoRoot, {
            roundId: `R${String(roundN)}`,
            waveId: `R${String(roundN)}-W${String(entry.num)}`,
            subject: `R${String(roundN)}-W${String(entry.num)} (${entry.slug}) closed as ${waveStatus}`,
            description: `Wave ${String(entry.num)} (${entry.slug}) closed with status=${waveStatus} via ${mode} mode. Round continues; verify-publish will surface this blocker in Closeout.md.`,
          });
          pushIfId(id);
          // Don't run gates after a non-clean wave; continue to next wave.
          continue;
        }

        // Mid-wave gates — run mandatory minimum after clean waves.
        // R10 (D-A-40): a `not-configured` gate is neutral — neither pass
        // nor fail. No fix-skill is invoked and no blocker escalates. We
        // emit a gate run with status='pass' (back-compat: GateRun's status
        // field is 'pass'|'fail') and 0 fix attempts so the orchestrate
        // evidence still records it; the per-gate evidence carries the
        // not-configured detail.
        for (const gate of MANDATORY_MIN_GATES) {
          const r = runGate(gate, ctx.repoRoot);
          if (r.status === 'not-configured') {
            gateRuns.push({ wave_num: entry.num, gate, status: 'pass', fix_attempts: 0 });
            continue;
          }
          if (r.status === 'fail' || r.status === 'error') {
            const fixSkill = resolveSkill(`SKILL-fix-${gate}`);
            if (
              fixSkill !== null &&
              fixSkill.manifest.auto_fix_capable !== undefined &&
              fixSkill.manifest.auto_fix_capable !== 'none'
            ) {
              // Iterate up to 3 times — mirror R4-W2 substrate semantics in-process.
              for (let iter = 1; iter <= 3; iter += 1) {
                try {
                  await fixSkill.run({
                    repoRoot: ctx.repoRoot,
                    iteration: { current: iter, max: 3 },
                  });
                } catch {
                  // best-effort
                }
                const recheck = runGate(gate, ctx.repoRoot);
                if (recheck.status === 'pass') {
                  gateRuns.push({ wave_num: entry.num, gate, status: 'pass', fix_attempts: iter });
                  break;
                }
                if (iter === 3) {
                  gateRuns.push({ wave_num: entry.num, gate, status: 'fail', fix_attempts: iter });
                  const id = escalateBlocker(ctx.repoRoot, {
                    roundId: `R${String(roundN)}`,
                    waveId: `R${String(roundN)}-W${String(entry.num)}`,
                    subject: `Mid-wave gate '${gate}' red after ${String(iter)} fix attempts`,
                    description: `After wave ${String(entry.num)} (${entry.slug}) closed clean, gate '${gate}' failed. SKILL-fix-${gate} (auto_fix_capable=${String(fixSkill.manifest.auto_fix_capable)}) was invoked ${String(iter)} times; gate remained red. Escalated as blocker.`,
                    evidence: recheck.evidence,
                  });
                  pushIfId(id);
                }
              }
            } else {
              // No fix-skill or auto_fix_capable=none → straight to blocker.
              gateRuns.push({ wave_num: entry.num, gate, status: 'fail', fix_attempts: 0 });
              const id = escalateBlocker(ctx.repoRoot, {
                roundId: `R${String(roundN)}`,
                waveId: `R${String(roundN)}-W${String(entry.num)}`,
                subject: `Mid-wave gate '${gate}' red; no fix-skill available`,
                description: `After wave ${String(entry.num)} (${entry.slug}) closed clean, gate '${gate}' failed. ${fixSkill === null ? `No SKILL-fix-${gate} registered.` : `SKILL-fix-${gate} has auto_fix_capable=none.`} Escalated as blocker.`,
                evidence: r.evidence,
              });
              pushIfId(id);
            }
          } else {
            gateRuns.push({ wave_num: entry.num, gate, status: 'pass', fix_attempts: 0 });
          }
        }
      }

      return {
        skill_id: 'SKILL-round-orchestrate',
        status: 'pass',
        notes: [
          'Round dispatch complete; SKILL-round-verify-publish required for verdict.',
          ...(escalatedBlockers.length > 0
            ? [
                `Blockers escalated: ${String(escalatedBlockers.length)} (see .devai/state/decisions.jsonl)`,
              ]
            : []),
        ],
        evidence: {
          ...plan,
          executed_artifacts: {
            round_dir: dir,
            wave_timeout_ms: waveTimeoutMs,
            skip_unbacked_waves: skipUnbackedWaves,
            unbacked_wave_timeout_ms: unbackedWaveTimeoutMs,
            dispatched,
            gate_runs: gateRuns,
            blockers_escalated: escalatedBlockers,
          },
        },
      };
    },
  };

  const skillRoundVerifyPublish: SkillEntry = {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-verify-publish',
      title: 'Round verify and publish',
      version: '1.0.0',
      lifecycle: 'experimental',
      lifecycle_reason:
        'The legacy combined Auditor closeout and publication flow crosses observation, ratification, and remote-actuation authority.',
      promotion_criteria: [
        'Auditor observation and Architect close/publish are separate invocations.',
        'Remote publication is independently reverified by a verified host adapter.',
        'A supervised adopter pilot demonstrates the split close ceremony.',
      ],
      summary:
        'Compare phase of the round loop. R4-W5 real execution: re-runs mandatory minimum gates, ' +
        'recomputes scorecard via SKILL-compute-scorecard, diffs against the audit baseline, lifts ' +
        'open blockers from .devai/state/decisions.jsonl, and materializes a disposable local Closeout.md.',
      kind: 'workflow',
      authority_role: 'auditor',
      deterministic: false,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: [
        'record/proofs/work/skill-runs/**',
        '.devai/state/decisions.jsonl',
        'work/rounds/R-*/**',
      ],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-verify-publish/*.json'],
      risk_level: 'medium',
      tags: ['round', 'verify', 'publish', 'compare'],
      entry: 'devai agent skill run SKILL-round-verify-publish',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'verify-publish',
    },
    async run(ctx) {
      const dir = roundDir(ctx);
      const roundN = (ctx.inputs?.['round_n'] as number | string | undefined) ?? 0;
      const roundDirAbs = isAbsolute(dir) ? dir : join(ctx.repoRoot, dir);
      const auditDir = resolveAuditDir(ctx.repoRoot, dir);
      const closeoutDir = join(roundDirAbs, 'closeout');
      const promptsDir = join(roundDirAbs, 'prompts');

      const plan: RoundPlan = {
        round_dir: dir,
        phase: 'verify-publish',
        steps: [
          {
            id: 'verify.1',
            description:
              'Re-run all gates declared by the round-orchestrator (lint, typecheck, tests, scorecard).',
          },
          {
            id: 'verify.2',
            description: `Diff current scorecard vs ${dir}/audit/scorecard.baseline.json — flag regressions.`,
          },
          {
            id: 'verify.3',
            description: `Write ${dir}/closeout.md with verdict + scorecard delta + outstanding blockers.`,
          },
          {
            id: 'verify.4',
            description:
              'STOP. The disposable round workspace cannot be published or used as durable evidence.',
          },
        ],
        next_phase: 'done',
        references: {
          prompts_library: 'docs/adopters/round-prompts/B4-verify-publish.md',
        },
      };

      // Dry-run fallback — preserves back-compat for R2-Δ3 dry-run tests.
      if (!existsSync(roundDirAbs)) {
        return {
          skill_id: 'SKILL-round-verify-publish',
          status: 'pass',
          notes: [
            `Round dir not present (${dir}); dry-run mode — no gates re-run, no Closeout written.`,
          ],
          evidence: {
            ...plan,
            executed_artifacts: {
              round_dir: dir,
              mode: 'dry-run',
              reason: 'round_dir_absent',
            },
          },
        };
      }

      // 1. Re-run mandatory minimum gates.
      // R10 (D-A-40 / ADR Decision 3 + 4): full GateEvidence per gate, with
      // `not-configured` as a first-class status (no DEC record). The
      // close-time evidence shape is the rich per-gate object; the
      // back-compat-shaped `gate_results` summary continues to live alongside
      // for older consumers, but adds `status: 'not-configured'`.
      const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const gateEvidences: GateEvidence[] = [];
      for (const gate of MANDATORY_MIN_GATES) {
        const r = runGate(gate, ctx.repoRoot, { runId });
        gateEvidences.push(r.evidence);
      }
      // Optional: scope-conditional gates if requested. Tagged as `extra-gate`
      // so consumers can attribute the source.
      const extraGates = ctx.inputs?.['extra_gates'];
      if (Array.isArray(extraGates)) {
        for (const g of extraGates) {
          if (typeof g === 'string') {
            const r = runGate(g, ctx.repoRoot, { runId, sourceOverride: 'extra-gate' });
            gateEvidences.push(r.evidence);
          }
        }
      }
      // R10: back-compat-shaped summary array (kept so existing consumers
      // reading `evidence.executed_artifacts.gate_results[i].status` keep
      // working). The full GateEvidence is also persisted alongside.
      const gateResults: {
        gate: string;
        status: 'pass' | 'fail' | 'not-configured';
        cli_bin?: string;
      }[] = gateEvidences.map((ev) => ({
        gate: ev.gate,
        status: (ev.status === 'error' ? 'fail' : ev.status) as 'pass' | 'fail' | 'not-configured',
        ...(ev.cli_bin !== undefined && { cli_bin: ev.cli_bin }),
      }));

      // 2. Recompute scorecard via SKILL-compute-scorecard.
      let scorecardAfter: unknown = null;
      const scorecardSkill = resolveSkill('SKILL-compute-scorecard');
      if (scorecardSkill !== null) {
        try {
          const r = await scorecardSkill.run({ repoRoot: ctx.repoRoot });
          if (r.status === 'pass' && r.evidence !== undefined) {
            scorecardAfter = r.evidence;
            mkdirSync(closeoutDir, { recursive: true });
            writeFileSync(
              join(closeoutDir, 'scorecard.after.json'),
              JSON.stringify(r.evidence, null, 2),
            );
          }
        } catch {
          // best-effort
        }
      }

      // 3. Read baseline.
      let scorecardBefore: unknown = null;
      const baselinePath = join(auditDir, 'scorecard.baseline.json');
      if (existsSync(baselinePath)) {
        try {
          scorecardBefore = JSON.parse(readFileSync(baselinePath, 'utf8'));
        } catch {
          // best-effort
        }
      }

      // 4. Compute delta.
      const delta = computeScorecardDelta(scorecardBefore, scorecardAfter);

      // 5. Read open blockers.
      const blockers = readOpenBlockersForRound(ctx.repoRoot, roundN);

      // 6. Read wave statuses.
      const waveStatuses = readWaveLogStatuses(promptsDir);

      // 7. Compute deferred count (used by verdict + ledger pass below).
      //    A backlog item is "deferred" when its corresponding wave (by
      //    index) didn't close clean/skipped. Matches the F-3 suppression
      //    rule: if NO waves dispatched, deferred=0 (first-run state).
      const orchestrateDispatchedForVerdict = waveStatuses.length > 0;
      const backlogPathForCount = join(roundDirAbs, 'backlog.json');
      let deferredCount = 0;
      const deferredItemIndices: number[] = [];
      if (orchestrateDispatchedForVerdict && existsSync(backlogPathForCount)) {
        try {
          const bl = JSON.parse(readFileSync(backlogPathForCount, 'utf8')) as {
            items?: Array<{ id?: string; title?: string }>;
          };
          const items = bl.items ?? [];
          for (let i = 0; i < items.length; i += 1) {
            const waveLabel = `W${String(i + 1)}`;
            const matched = waveStatuses.find((w) => w.wave === waveLabel);
            const isDeferred =
              matched === undefined || (matched.status !== 'clean' && matched.status !== 'skipped');
            if (isDeferred) {
              deferredCount += 1;
              deferredItemIndices.push(i);
            }
          }
        } catch {
          // best-effort
        }
      }

      // 8. Compute verdict per ADR Decision 2. `not-configured` does NOT
      //    count toward gate_fail_count.
      const gateFailCount = gateResults.filter((g) => g.status === 'fail').length;
      const verdict = computeRoundVerdict({
        gateFailCount,
        waveStatuses,
        blockersCount: blockers.length,
        deferredCount,
      });

      // 8. Read Plan.md goal if available. R6-W2 (closes F-2) — fallback
      //    chain when **Goal:** line absent or Plan.md absent entirely.
      //    Pre-fix: "R<n> (goal not extracted)" — misleading; suggested
      //    the substrate failed when actually the operator just hadn't
      //    authored a Plan.md yet (legitimate state on first invocation).
      let goal: string;
      const planPath = join(roundDirAbs, 'Plan.md');
      if (!existsSync(planPath)) {
        goal = `R${String(roundN)} (auto-materialized; no Plan.md authored)`;
      } else {
        let planText = '';
        try {
          planText = readFileSync(planPath, 'utf8');
        } catch {
          /* best-effort */
        }
        const goalMatch = /\*\*Goal:\*\*\s*(.+?)(?:\n|$)/.exec(planText);
        if (goalMatch !== null) {
          goal = goalMatch[1] as string;
        } else {
          // Plan.md exists but no **Goal:** line — fall back to first H1
          // (the round's title heading).
          const h1Match = /^#\s+(.+?)$/m.exec(planText);
          if (h1Match !== null) {
            goal = (h1Match[1] as string).trim();
          } else {
            goal = `R${String(roundN)} (Plan.md present but no **Goal:** or H1 found)`;
          }
        }
      }

      // 9. Materialize Closeout.md.
      const closeoutPath = join(roundDirAbs, 'Closeout.md');
      writeFileSync(
        closeoutPath,
        buildCloseoutMd({
          roundN,
          goal,
          verdict,
          closingCommits: [],
          gateResults,
          scorecardDelta: delta,
          waveStatuses,
          blockers,
        }),
      );

      // 10. R5-W1 (DEC-0002) — auto-WRITE ledger records.
      //     (a) Gate-rerun failures → kind:escalate.
      //     (b) Wave statuses other than `clean` → kind:escalate (covers waves
      //         that closed blocked/aborted without orchestrate observing the
      //         transition, e.g. a hand-run wave).
      //     (c) Backlog items without a clean wave → kind:defer (the round
      //         declared the work but didn't deliver it).
      //     Idempotent via (round_id, subject); never duplicates an existing
      //     orchestrate-written escalate.
      const ledgerWrites: string[] = [];
      const roundIdStr = `R${String(roundN)}`;

      // (a) Failed gates.
      for (const g of gateResults) {
        if (g.status === 'fail') {
          const id = appendDecisionRecord(ctx.repoRoot, {
            kind: 'escalate',
            subject: `Gate '${g.gate}' failed at ${roundIdStr} close-time rerun`,
            description:
              `SKILL-round-verify-publish re-ran '${g.gate}' at close time and it failed. ` +
              `Either the gate regressed since orchestrate-time, or it was scope-conditional and not run mid-round.`,
            owner: 'agent:auditor',
            roundId: roundIdStr,
          });
          if (id !== null) ledgerWrites.push(id);
        }
      }

      // (a.super) D-A-42 mechanism (c) — auto-supersession.
      //   For each gate that NOW passes, locate any prior `kind:escalate`
      //   record for the SAME gate from a DIFFERENT round (subject prefix
      //   `Gate '<gate>' failed at R…`) that has no resolution record yet,
      //   and append a `disposition: superseded` resolution. Tie to the
      //   current run via `resolved_by: run-<runId>`.
      //   Per ADR-ROUND-EXECUTE-SEMANTICS Decision 2/3: the subject string
      //   shape is the stable identifier; gate-evidence's `gate` field is
      //   the substring we match on.
      const allLedgerForSupersede = readAllLedgerRecords(ctx.repoRoot);
      const alreadyResolvedIds = new Set<string>();
      for (const r of allLedgerForSupersede) {
        if (r.kind === 'resolution' && typeof r.resolves_dec_id === 'string') {
          alreadyResolvedIds.add(r.resolves_dec_id);
        }
      }
      for (const g of gateResults) {
        if (g.status !== 'pass') continue;
        const subjectPrefix = `Gate '${g.gate}' failed at `;
        for (const r of allLedgerForSupersede) {
          if (r.kind !== 'escalate') continue;
          if (typeof r.id !== 'string' || typeof r.subject !== 'string') continue;
          if (!r.subject.startsWith(subjectPrefix)) continue;
          // Only supersede DECs from PRIOR rounds (don't supersede a DEC
          // we just wrote at the top of this loop above).
          if (r.context?.round_id === roundIdStr) continue;
          if (alreadyResolvedIds.has(r.id)) continue;
          try {
            appendResolutionRecord(ctx.repoRoot, {
              decId: r.id,
              disposition: 'superseded',
              resolvedBy: `run-${runId}`,
              evidenceRef: `record/proofs/work/skill-runs/SKILL-round-verify-publish/${runId}/gate-${g.gate}.stdout.log`,
              note: `Gate '${g.gate}' now passes at ${roundIdStr} close-time rerun; superseding the prior escalation.`,
              context: { round_id: roundIdStr },
            });
            alreadyResolvedIds.add(r.id);
            ledgerWrites.push(`${r.id}-resolution`);
          } catch {
            /* best-effort */
          }
        }
      }

      // (b) Non-clean wave statuses.
      for (const w of waveStatuses) {
        if (w.status !== 'clean' && w.status !== 'skipped') {
          const waveIdStr = `${roundIdStr}-${w.wave}`;
          const id = appendDecisionRecord(ctx.repoRoot, {
            kind: 'escalate',
            subject: `Wave ${waveIdStr} closed as ${w.status}`,
            description:
              `Wave ${w.wave} of round ${roundIdStr} closed with status=${w.status}. ` +
              `Surfaced by verify-publish (orchestrate may not have observed the transition if the wave ran out-of-band).`,
            owner: 'agent:auditor',
            roundId: roundIdStr,
            waveId: waveIdStr,
          });
          if (id !== null) ledgerWrites.push(id);
        }
      }

      // (c) Deferred backlog items — items whose corresponding wave (by index)
      //     didn't close clean. backlog.json is materialized by SKILL-round-backlog;
      //     waves are numbered 01..NN matching backlog item index 0..NN-1.
      //
      // R6-W3 (closes F-3): if NO wave .log files exist under promptsDir at
      // all, this is a first-run state where orchestrate hasn't dispatched
      // anything yet — backlog items haven't been ATTEMPTED, much less
      // deferred. Suppress the entire defer pass to avoid false positives.
      // (waveStatuses comes from readWaveLogStatuses which scans .log files
      // — an empty array means no logs exist.)
      const orchestrateDispatched = waveStatuses.length > 0;
      const backlogPath = join(roundDirAbs, 'backlog.json');
      if (orchestrateDispatched && existsSync(backlogPath)) {
        try {
          const bl = JSON.parse(readFileSync(backlogPath, 'utf8')) as {
            items?: Array<{ id?: string; title?: string }>;
          };
          const items = bl.items ?? [];
          for (let i = 0; i < items.length; i += 1) {
            const waveNum = i + 1;
            const waveLabel = `W${String(waveNum)}`;
            const matchedWave = waveStatuses.find((w) => w.wave === waveLabel);
            const isDeferred =
              matchedWave === undefined ||
              (matchedWave.status !== 'clean' && matchedWave.status !== 'skipped');
            if (isDeferred) {
              const item = items[i] as { id?: string; title?: string };
              const title = item.title ?? item.id ?? `(item ${String(i)})`;
              const id = appendDecisionRecord(ctx.repoRoot, {
                kind: 'defer',
                subject: `${roundIdStr} backlog item not delivered: ${title}`,
                description:
                  `Backlog item ${item.id ?? `#${String(i)}`} (${title}) was planned for wave ${waveLabel} ` +
                  `but the wave ${matchedWave === undefined ? 'never produced a log' : `closed as ${matchedWave.status}`}. ` +
                  `Deferred — re-evaluate in a successor round.`,
                owner: 'agent:architect',
                roundId: roundIdStr,
              });
              if (id !== null) ledgerWrites.push(id);
            }
          }
        } catch {
          // backlog unreadable — best-effort; skip the defer pass.
        }
      }

      // 11. R29 — local round workspaces are disposable and non-authoritative.
      //     Fail closed if a caller attempts to publish them or derive a PR
      //     body from them. Durable evidence must be independently promoted
      //     through its owning schema and authority ceremony.
      interface PublishOutcome {
        readonly status: 'skipped' | 'pass' | 'fail';
        readonly mode?: 'dry-run' | 'live';
        readonly note?: string;
        readonly evidence?: unknown;
      }
      let publish: PublishOutcome = { status: 'skipped' };
      if (ctx.inputs?.['publish'] === true) {
        publish = {
          status: 'fail',
          note: 'publish=true refused: .devai/local round workspaces are disposable and cannot be durable evidence or publication inputs.',
        };
      }
      const published = publish.status === 'pass' && publish.mode === 'live';

      const gatePassCount = gateResults.filter((g) => g.status === 'pass').length;
      const gateNotConfiguredCount = gateResults.filter(
        (g) => g.status === 'not-configured',
      ).length;
      return {
        skill_id: 'SKILL-round-verify-publish',
        status: 'pass',
        notes: [
          `Verdict: ${verdict}`,
          // R10 (D-A-40 / ADR Decision 4): summary shape "P pass / F fail / N not-configured".
          `Gates: ${String(gatePassCount)} pass / ${String(gateFailCount)} fail / ${String(gateNotConfiguredCount)} not-configured`,
          `Blockers: ${String(blockers.length)} open`,
          ...(deferredCount > 0 ? [`Deferred: ${String(deferredCount)} backlog item(s)`] : []),
          ...(ledgerWrites.length > 0
            ? [
                `Ledger records written: ${String(ledgerWrites.length)} (${ledgerWrites.join(', ')})`,
              ]
            : []),
          ...(publish.status !== 'skipped'
            ? [
                `Publish: ${publish.status} (${publish.mode ?? 'unknown'})${publish.note !== undefined ? ` — ${publish.note}` : ''}`,
              ]
            : []),
        ],
        evidence: {
          ...plan,
          executed_artifacts: {
            round_dir: dir,
            closeout_path: closeoutPath.replace(`${ctx.repoRoot}/`, ''),
            verdict,
            // R10 (D-A-40 / ADR Decision 3 + 4): rich per-gate evidence and
            // not-configured count alongside the back-compat summary array.
            gate_results: gateResults,
            gate_evidences: gateEvidences,
            gate_fail_count: gateFailCount,
            gate_pass_count: gatePassCount,
            gate_not_configured_count: gateNotConfiguredCount,
            deferred_count: deferredCount,
            deferred_item_indices: deferredItemIndices,
            run_id: runId,
            scorecard_delta: delta,
            wave_statuses: waveStatuses,
            blockers,
            ledger_writes: ledgerWrites,
            published,
            ...(publish.status !== 'skipped' && {
              publish: {
                status: publish.status,
                ...(publish.mode !== undefined && { mode: publish.mode }),
                ...(publish.evidence !== undefined && { commit_push_evidence: publish.evidence }),
              },
            }),
          },
        },
      };
    },
  };

  const skillRoundExecute: SkillEntry = {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-execute',
      title: 'Round execute',
      version: '1.0.0',
      lifecycle: 'experimental',
      lifecycle_reason:
        'End-to-end round composition spans Auditor, Architect, and execution-controller authority and is not valid under one session role.',
      promotion_criteria: [
        'Each phase is dispatched under a distinct declared human role or verified external controller identity.',
        'The composer cannot mutate directly or inherit a child role.',
        'Experimental containment and supervised adopter evidence are green.',
      ],
      summary:
        'Execute one round end-to-end. R4-W5 real composition: invokes SKILL-round-audit → ' +
        'SKILL-round-backlog → SKILL-round-orchestrate → SKILL-round-verify-publish in sequence. ' +
        'Picks round_n from inputs or finds the next free integer. Renamed from SKILL-round-loop ' +
        'in R3-W2; "loop" reserved for multi-instance iteration semantics.',
      kind: 'workflow',
      authority_role: 'orchestrator',
      deterministic: false,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: [
        'work/rounds/R-*/**',
        'record/proofs/work/skill-runs/**',
        '.devai/state/decisions.jsonl',
      ],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-execute/*.json'],
      risk_level: 'high',
      tags: ['round', 'execute'],
      entry: 'devai agent skill run SKILL-round-execute',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'execute',
    },
    async run(ctx) {
      // R10 (D-A-40 / ADR Decision 1) — `mode` flag. Default = `compose`
      // (current four-phase composition). Unknown values fail with usage
      // hint. `execute` is a reserved keyword (real per-wave executor
      // deferred to a future round).
      const modeRaw = ctx.inputs?.['mode'];
      const mode: 'plan' | 'compose' | 'execute' | 'closeout' =
        modeRaw === undefined
          ? 'compose'
          : (modeRaw as 'plan' | 'compose' | 'execute' | 'closeout');
      const allowedModes: ReadonlyArray<string> = ['plan', 'compose', 'execute', 'closeout'];
      if (!allowedModes.includes(mode)) {
        return {
          skill_id: 'SKILL-round-execute',
          status: 'fail',
          notes: [
            `inputs.mode='${String(modeRaw)}' is not recognized.`,
            `Accepted values: ${allowedModes.map((m) => `'${m}'`).join(', ')}. Default: 'compose'.`,
          ],
        };
      }

      // Resolve round_n. Default = explicit input, or next free integer.
      let roundN = ctx.inputs?.['round_n'] as number | string | undefined;
      if (roundN === undefined || roundN === 0) {
        roundN = findNextFreeRoundN(ctx.repoRoot);
      }
      const dir = `work/rounds/R-${String(roundN).padStart(4, '0')}`;

      const plan: RoundPlan = {
        round_dir: dir,
        phase: 'loop',
        steps: [
          {
            id: 'loop.1',
            description: `Pick or create ${dir} (N = next free integer from work/rounds/R-*).`,
          },
          { id: 'loop.2', description: 'Invoke SKILL-round-audit.' },
          { id: 'loop.3', description: 'Invoke SKILL-round-backlog.' },
          { id: 'loop.4', description: 'Invoke SKILL-round-orchestrate.' },
          {
            id: 'loop.5',
            description:
              'Invoke SKILL-round-verify-publish (stops before publish unless --publish threaded through).',
          },
        ],
        next_phase: 'done',
        references: {
          prompts_library: 'docs/adopters/round-prompts/',
          skills: [
            'SKILL-round-audit',
            'SKILL-round-backlog',
            'SKILL-round-orchestrate',
            'SKILL-round-verify-publish',
          ],
        },
      };

      // R10: `mode=plan` — emit the RoundPlan only, do not invoke sub-skills.
      if (mode === 'plan') {
        return {
          skill_id: 'SKILL-round-execute',
          status: 'pass',
          notes: [
            `mode=plan — emitted RoundPlan for round ${String(roundN)}; no sub-skills invoked.`,
          ],
          evidence: {
            ...plan,
            executed_artifacts: {
              round_dir: dir,
              round_n: roundN,
              mode,
              sub_results: {},
            },
          },
        };
      }

      // R10: `mode=execute` — reserved keyword per ADR Decision 1.
      if (mode === 'execute') {
        return {
          skill_id: 'SKILL-round-execute',
          status: 'fail',
          notes: [
            'mode=execute is a reserved keyword for a future per-wave blocking executor; semantics deferred to a later round.',
            "Use mode='compose' (the default — current four-phase composer) or mode='plan' / mode='closeout'.",
          ],
          evidence: {
            ...plan,
            executed_artifacts: {
              round_dir: dir,
              round_n: roundN,
              mode,
              sub_results: {},
              reason: 'mode=execute reserved for a future round; use mode=compose (default)',
            },
          },
        };
      }

      // Compose the four phases (mode=compose, default) OR run just verify-publish
      // (mode=closeout — assumes audit/backlog/orchestrate already ran).
      // Each gets the same round_n + repo_root.
      // verdict (one of the five values) belongs to verify-publish.
      //
      // R5-W3: publish + publish_dry_run + grants are forwarded ONLY to
      // verify-publish per ADR-002 §1 — audit/backlog/orchestrate must NOT
      // escalate to act-tier even with a session grant in scope.
      const baseSubInputs = {
        round_n: roundN,
        ...(ctx.inputs?.['wave_timeout_ms'] !== undefined && {
          wave_timeout_ms: ctx.inputs['wave_timeout_ms'],
        }),
      };
      const verifyPublishExtraInputs = {
        ...(ctx.inputs?.['publish'] === true && { publish: true }),
        ...(ctx.inputs?.['publish_dry_run'] === true && { publish_dry_run: true }),
      };
      const subResults: Record<
        string,
        { status: string; notes?: readonly string[]; evidence?: unknown }
      > = {};
      const composePhases = [
        { id: 'SKILL-round-audit', name: 'audit', allowGrants: false, extraInputs: {} },
        { id: 'SKILL-round-backlog', name: 'backlog', allowGrants: false, extraInputs: {} },
        { id: 'SKILL-round-orchestrate', name: 'orchestrate', allowGrants: false, extraInputs: {} },
        {
          id: 'SKILL-round-verify-publish',
          name: 'verify-publish',
          allowGrants: true,
          extraInputs: verifyPublishExtraInputs,
        },
      ];
      const closeoutPhases = [
        {
          id: 'SKILL-round-verify-publish',
          name: 'verify-publish',
          allowGrants: true,
          extraInputs: verifyPublishExtraInputs,
        },
      ];
      const phaseOrder: {
        id: string;
        name: string;
        allowGrants: boolean;
        extraInputs: Record<string, unknown>;
      }[] = mode === 'closeout' ? closeoutPhases : composePhases;
      for (const phase of phaseOrder) {
        const sub = resolveSkill(phase.id);
        if (sub === null) {
          subResults[phase.name] = { status: 'fail', notes: [`skill not registered: ${phase.id}`] };
          continue;
        }
        try {
          const r = await sub.run({
            repoRoot: ctx.repoRoot,
            ...(phase.allowGrants && ctx.grants !== undefined && { grants: ctx.grants }),
            inputs: { ...baseSubInputs, ...phase.extraInputs },
          });
          subResults[phase.name] = {
            status: r.status,
            ...(r.notes !== undefined && { notes: r.notes }),
            ...(r.evidence !== undefined && { evidence: r.evidence }),
          };
        } catch (err) {
          subResults[phase.name] = {
            status: 'fail',
            notes: [
              `exception during ${phase.id}: ${err instanceof Error ? err.message : String(err)}`,
            ],
          };
        }
      }

      const anyFail = Object.values(subResults).some((r) => r.status === 'fail');
      const overallStatus: 'pass' | 'fail' = anyFail ? 'fail' : 'pass';

      // R10 (D-A-40 / ADR Decision 2): surface the verify-publish verdict at
      // the composer level so consumers (CLI --strict-exit, sibling skills)
      // can read it without traversing nested sub-results. Falls back to
      // 'failed' if verify-publish didn't run or didn't return a verdict.
      const vpEvidence = subResults['verify-publish']?.evidence as
        { executed_artifacts?: { verdict?: RoundVerdict } } | undefined;
      const verdict: RoundVerdict =
        vpEvidence?.executed_artifacts?.verdict ?? (anyFail ? 'failed' : 'clean');

      return {
        skill_id: 'SKILL-round-execute',
        status: overallStatus,
        notes: [
          `Round ${String(roundN)} composer (mode=${mode}): ${anyFail ? 'one or more phases failed' : 'all phases passed'}`,
          `Verdict: ${verdict}`,
          ...(subResults['verify-publish']?.notes ?? []),
        ],
        evidence: {
          ...plan,
          executed_artifacts: {
            round_dir: dir,
            round_n: roundN,
            mode,
            verdict,
            sub_results: subResults,
          },
        },
      };
    },
  };

  // =====================================================================
  // Skill registry
  // =====================================================================

  return [
    skillRoundAudit,
    skillRoundBacklog,
    skillRoundOrchestrate,
    skillRoundVerifyPublish,
    skillRoundExecute,
  ];
}
