import type { CAC } from 'cac';
import {
  createLlmClient,
  emitAgentRun,
  getSkill,
  persistSkillEvidence,
  resolveSensorParams,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

export function resolvePackLlmTimeouts(
  repoRoot: string,
): Readonly<Record<string, number>> | undefined {
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

const DEFAULT_REPO_ROOT = '.';

/**
 * Phase 17.F (D-57): `devai docs synthesize <kind>` — invoke a
 * SKILL-write-<kind> writer skill against the inventory sensor
 * bodies. Thin wrapper around the skill-runner that adds:
 *   - kind → skill-id mapping (overview → SKILL-write-overview, …)
 *   - default invocation against the current repo
 *   - agent-run + evidence persistence (same plumbing as skill run)
 *
 * 17.F.1 ships only `overview`; 17.F.2+ add `architecture-guide`,
 * `database-reference`, `erd`, `api-map`, `frontend-routes-map`,
 * `rbac-matrix`, `compliance-lgpd`, `fp-report`, `threat-model`,
 * `onboarding`, `software-stack`. P3.11 (Option B) adds the
 * sibling compliance regimes: `compliance-gdpr` and
 * `compliance-ccpa`.
 */

export const KIND_TO_SKILL: Record<string, string> = {
  overview: 'SKILL-write-overview',
  'software-stack': 'SKILL-write-software-stack',
  'architecture-guide': 'SKILL-write-architecture-guide',
  'database-reference': 'SKILL-write-database-reference',
  erd: 'SKILL-write-erd',
  'api-map': 'SKILL-write-api-map',
  'frontend-routes-map': 'SKILL-write-frontend-routes-map',
  'rbac-matrix': 'SKILL-write-rbac-matrix',
  'compliance-lgpd': 'SKILL-write-compliance-lgpd',
  'compliance-gdpr': 'SKILL-write-compliance-gdpr',
  'compliance-ccpa': 'SKILL-write-compliance-ccpa',
  'fp-report': 'SKILL-write-fp-report',
  'threat-model': 'SKILL-write-threat-model',
  onboarding: 'SKILL-write-onboarding',
};

interface Options {
  readonly repoRoot?: string;
  readonly outPath?: string;
  readonly seeds?: string;
  readonly llmTimeoutMs?: number;
  readonly human?: boolean;
}

export const docsSynthesize = defineCommand({
  name: 'docs synthesize',
  description:
    'Synthesize a brownfield doc from inventory sensor bodies via a SKILL-write-* writer',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'docs-synthesize <kind>',
        'Synthesize docs/<Name>.md from inventory sensor outputs (e.g. devai docs synthesize overview)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--out-path <path>', 'Override the output path (default: docs/<Name>.md per kind)')
      .option(
        '--seeds <csv>',
        'Comma-separated paths to additional stack-adapter pack dirs (in addition to in-repo examples/redox-pack-*)',
      )
      .option(
        '--llm-timeout-ms <n>',
        'Override LLM call timeout (ms). Wins over per-skill defaults + pack config. Writer skills default to 300000ms. Phase 24.C / D-A-24.',
      )
      .option('--human', 'Human-readable summary')
      .action(async (kind: string, options: Options) => {
        const skillId = KIND_TO_SKILL[kind];
        if (skillId === undefined) {
          process.stderr.write(
            `devai docs synthesize: unknown kind '${kind}'. Supported in 17.F.1: ${Object.keys(KIND_TO_SKILL).join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const skill = getSkill(skillId);
        if (skill === null) {
          process.stderr.write(`devai docs synthesize: ${skillId} not registered\n`);
          process.exit(EXIT_FAIL);
        }
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const inputs: Record<string, unknown> = {};
        if (options.outPath !== undefined) inputs.out_path = options.outPath;
        if (options.seeds !== undefined) inputs.seeds = options.seeds;

        const startedAt = new Date().toISOString();
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
        const result = await skill.run({
          repoRoot,
          inputs,
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

        const summary = {
          kind,
          ...result,
          skill_id: skillId,
          evidence_path: evidencePath,
          agent_run_path: agentRunPath,
        };

        if (options.human === true) {
          const lines: string[] = [
            `docs synthesize ${kind} (${skillId}): ${result.status.toUpperCase()}`,
          ];
          if (result.evidence !== undefined && result.evidence !== null) {
            const ev = result.evidence as { out_path?: string; word_count?: number };
            if (ev.out_path !== undefined) lines.push(`  wrote: ${ev.out_path}`);
            if (ev.word_count !== undefined) lines.push(`  words: ${String(ev.word_count)}`);
          }
          if (result.notes !== undefined) lines.push('  ' + result.notes.join('\n  '));
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify(summary) + '\n');
        }

        if (result.status === 'pass' || result.status === 'skipped') {
          process.exitCode = EXIT_PASS;
          return;
        }
        if (result.status === 'review') {
          process.exitCode = EXIT_REVIEW;
          return;
        }
        process.exitCode = EXIT_FAIL;
      });
  },
});
