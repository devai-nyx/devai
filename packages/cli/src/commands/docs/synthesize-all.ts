import type { CAC } from 'cac';
import { createLlmClient, emitAgentRun, getSkill, persistSkillEvidence } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { KIND_TO_SKILL, resolvePackLlmTimeouts } from './synthesize.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Phase 17.F gap-6 close: `devai docs synthesize all` — invoke every
 * registered SKILL-write-* writer in sequence. Thin loop over
 * KIND_TO_SKILL; same per-skill machinery as `docs synthesize <kind>`
 * (agent-run + evidence persistence).
 *
 * Exit-code policy aggregates over the per-kind outcomes:
 *   - EXIT_PASS    every kind passed (or skipped)
 *   - EXIT_REVIEW  at least one kind produced status=review (and no fails)
 *   - EXIT_FAIL    at least one kind failed
 *
 * Per-skill outputs continue to land at their default paths under
 * docs/<Name>.md; failures persist evidence + an agent-run record.
 * The aggregate summary is the human-visible artefact.
 */

interface Options {
  readonly repoRoot?: string;
  readonly seeds?: string;
  readonly llmTimeoutMs?: number;
  readonly human?: boolean;
}

interface PerKindResult {
  readonly kind: string;
  readonly skill_id: string;
  readonly status: string;
  readonly out_path?: string;
  readonly word_count?: number;
  readonly notes?: readonly string[];
  readonly evidence_path: string | null;
  readonly agent_run_path: string | null;
}

export const docsSynthesizeAll = defineCommand({
  name: 'docs synthesize-all',
  description: 'Synthesize every brownfield doc by running each SKILL-write-* in sequence.',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'docs-synthesize-all',
        'Run every SKILL-write-* writer skill against the current inventory sensor bodies',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--seeds <csv>',
        'Comma-separated paths to additional stack-adapter pack dirs (forwarded to each writer skill)',
      )
      .option(
        '--llm-timeout-ms <n>',
        'Override LLM call timeout (ms). Wins over per-skill defaults + pack config for every writer. Phase 24.C / D-A-24.',
      )
      .option('--human', 'Human-readable summary')
      .action(async (options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const results: PerKindResult[] = [];
        const sharedInputs: Record<string, unknown> = {};
        if (options.seeds !== undefined) sharedInputs.seeds = options.seeds;
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

        for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) {
          const skill = getSkill(skillId);
          if (skill === null) {
            results.push({
              kind,
              skill_id: skillId,
              status: 'fail',
              notes: [`${skillId} is not registered`],
              evidence_path: null,
              agent_run_path: null,
            });
            continue;
          }
          const startedAt = new Date().toISOString();
          const result = await skill.run({
            repoRoot,
            inputs: { ...sharedInputs },
            ...(llm !== undefined && { llm }),
          });
          let evidencePath: string | null = null;
          try {
            evidencePath = persistSkillEvidence({ repoRoot, result });
          } catch {
            // best-effort
          }
          let agentRunPath: string | null = null;
          try {
            const record = emitAgentRun({
              repoRoot,
              caller: { kind: 'skill', name: skillId },
              started_at: startedAt,
              ended_at: new Date().toISOString(),
              files_read: [],
              files_written: evidencePath !== null ? [evidencePath] : [],
              compliance: { invariant_ids: ['INV-DEVAI-010'] },
              outcome: {
                status: result.status,
                ...(result.notes !== undefined && { notes: [...result.notes] }),
              },
            });
            agentRunPath = `${repoRoot}/.devai/state/agent-runs/${record.run_id}.json`;
          } catch {
            // best-effort
          }
          const evidence =
            (result.evidence as { out_path?: string; word_count?: number } | undefined) ?? {};
          results.push({
            kind,
            skill_id: skillId,
            status: result.status,
            ...(evidence.out_path !== undefined && { out_path: evidence.out_path }),
            ...(evidence.word_count !== undefined && { word_count: evidence.word_count }),
            ...(result.notes !== undefined && { notes: [...result.notes] }),
            evidence_path: evidencePath,
            agent_run_path: agentRunPath,
          });
        }

        const summary = {
          total: results.length,
          passed: results.filter((r) => r.status === 'pass' || r.status === 'skipped').length,
          review: results.filter((r) => r.status === 'review').length,
          failed: results.filter((r) => r.status === 'fail' || r.status === 'error').length,
        };

        if (options.human === true) {
          const lines: string[] = [
            `docs synthesize-all: ${String(summary.passed)}/${String(summary.total)} passed` +
              (summary.review > 0 ? `, ${String(summary.review)} review` : '') +
              (summary.failed > 0 ? `, ${String(summary.failed)} failed` : ''),
          ];
          for (const r of results) {
            const tag =
              r.status === 'pass' || r.status === 'skipped'
                ? 'OK'
                : r.status === 'review'
                  ? '??'
                  : 'XX';
            lines.push(
              `  [${tag}] ${r.kind.padEnd(22)} ${r.status}${r.out_path !== undefined ? ` -> ${r.out_path}` : ''}`,
            );
          }
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify({ summary, results }) + '\n');
        }

        if (summary.failed > 0) {
          process.exitCode = EXIT_FAIL;
          return;
        }
        if (summary.review > 0) {
          process.exitCode = EXIT_REVIEW;
          return;
        }
        process.exitCode = EXIT_PASS;
      });
  },
});
