import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import { closePhase, computeLedger, readClosures, type PhaseClosureDraft } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();

/**
 * D-110 — `devai govern phase close` + `devai govern phase ledger`.
 *
 * `close` validates a draft closure record (JSON file via --input, or
 * stdin with --stdin), assigns the next sequential PC id, and writes
 * .devai/state/closures/PC-NNNN.json. `ledger` computes the derived
 * properties — the consecutive no-deletion streak, per-round batch
 * counts, gate-failure history — from the records on demand; derived
 * counters are never stored or hand-narrated (the D-108 drift class).
 */

interface CloseOptions {
  readonly repoRoot?: string;
  readonly input?: string;
  readonly stdin?: boolean;
  readonly human?: boolean;
}

export const phaseClose = defineCommand({
  name: 'phase close',
  description:
    'Validate and record a phase/round closure (phase-closure.schema.json) under .devai/state/closures/',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('phase-close', 'Record a machine-validated phase/round closure (D-110)')
      .option('--repo-root <path>', 'Repo root (default: cwd)')
      .option(
        '--input <path>',
        'Path to the draft closure JSON (without schemaVersion/id; closed_at optional)',
      )
      .option('--stdin', 'Read the draft closure JSON from stdin')
      .option('--human', 'Human-readable output')
      .action((options: CloseOptions) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        let raw: string;
        if (options.input !== undefined) {
          raw = readFileSync(options.input, 'utf8');
        } else if (options.stdin === true) {
          raw = readFileSync(0, 'utf8');
        } else {
          process.stderr.write('devai govern phase close: pass --input <draft.json> or --stdin\n');
          process.exit(EXIT_USAGE);
          return;
        }
        try {
          const draft = JSON.parse(raw) as PhaseClosureDraft;
          const { record, path } = closePhase(repoRoot, draft);
          if (options.human === true) {
            process.stdout.write(
              `phase close: ${record.id} (${record.round_id}) → ${path}\n` +
                `  decisions: ${record.declaring_decision} → ${record.closing_decision}\n` +
                `  batches: ${String(record.batches.length)}  gates: ${Object.keys(record.gates).join(', ')}\n`,
            );
          } else {
            process.stdout.write(
              JSON.stringify({ ok: true, id: record.id, path, record }, null, 2) + '\n',
            );
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai govern phase close: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

interface LedgerOptions {
  readonly repoRoot?: string;
  readonly human?: boolean;
}

export const phaseLedger = defineCommand({
  name: 'phase ledger',
  description:
    'Compute the closure ledger (no-deletion streak, batch counts, gate history) from recorded closures',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('phase-ledger', 'Render the computed closure ledger (D-110)')
      .option('--repo-root <path>', 'Repo root (default: cwd)')
      .option('--human', 'Human-readable output')
      .action((options: LedgerOptions) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        try {
          const ledger = computeLedger(readClosures(repoRoot));
          if (options.human === true) {
            const lines = [
              `phase ledger: ${String(ledger.count)} closure(s); no-deletion streak ${String(ledger.no_deletion_streak)} (${ledger.streak_basis})`,
            ];
            for (const r of ledger.rounds) {
              const flags = [
                r.source_repo_deleted ? 'DELETION' : 'no-deletion',
                ...(r.gates_failed.length > 0 ? [`gates-failed: ${r.gates_failed.join(',')}`] : []),
                ...(r.superseded_by !== undefined ? [`superseded by ${r.superseded_by}`] : []),
              ].join('; ');
              lines.push(
                `  ${r.id}  ${r.round_id.padEnd(20)}  ${r.declaring_decision} → ${r.closing_decision}  ${String(r.batch_count)} batch(es)  [${flags}]`,
              );
            }
            process.stdout.write(lines.join('\n') + '\n');
          } else {
            process.stdout.write(JSON.stringify(ledger, null, 2) + '\n');
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai govern phase ledger: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
