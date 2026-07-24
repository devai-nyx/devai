import type { CAC } from 'cac';
import { gcStaleInvariantCandidates, suggestInvariants } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly fromInventory?: boolean;
  readonly outDir?: string;
  readonly dryRun?: boolean;
  readonly coverageBodyPath?: string;
  readonly dataHandlingBodyPath?: string;
  readonly depGraphBodyPath?: string;
  readonly rbacBodyPath?: string;
  readonly human?: boolean;
  readonly gcStale?: boolean;
}

/**
 * `devai inventory suggest --from-inventory` — the inventory →
 * invariant-candidate bridge (Phase 17.E, D-57). Reads sensor bodies
 * under .devai/state/sensors/inventory_* and emits INV-CANDIDATE-<ulid>
 * records under .devai/state/inv-candidates/ for Architect curation.
 *
 * --from-inventory is the only mode in 17.E and is required to make
 * the command's data-source explicit. Future modes (e.g.
 * --from-runtime-probes) ride the same plumbing.
 */
export const invSuggest = defineCommand({
  name: 'inv suggest',
  description:
    'Propose INV-CANDIDATE records from inventory sensor outputs (the brownfield-adoption bridge)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'inv-suggest',
        'Emit invariant-candidate records (INV-CANDIDATE-*) from inventory sensor bodies',
      )
      .option(
        '--from-inventory',
        'Source candidates from inventory sensor outputs (required in 17.E)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--out-dir <path>',
        'Override candidate output dir (default: .devai/state/inv-candidates)',
      )
      .option('--dry-run', 'Do not persist; emit summary to stdout only')
      .option('--coverage-body-path <path>', 'Override coverage-matrix body location')
      .option('--data-handling-body-path <path>', 'Override data-handling body location')
      .option('--dep-graph-body-path <path>', 'Override dep-graph body location')
      .option(
        '--rbac-body-path <path>',
        'Override rbac body location (for unbound_endpoint detector)',
      )
      .option(
        '--gc-stale',
        'Phase 29.H (R-3): instead of suggesting new candidates, garbage-collect existing INV-CANDIDATE-*.json records whose target no longer surfaces in the relevant inventory body. Appends gc-evidence.jsonl (audit-trail).',
      )
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        // Phase 29.H (R-3): --gc-stale runs GC instead of suggestion.
        if (options.gcStale === true) {
          const r = gcStaleInvariantCandidates({
            repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
            ...(options.outDir !== undefined && { outDir: options.outDir }),
            ...(options.coverageBodyPath !== undefined && {
              coverageBodyPath: options.coverageBodyPath,
            }),
            ...(options.dataHandlingBodyPath !== undefined && {
              dataHandlingBodyPath: options.dataHandlingBodyPath,
            }),
            ...(options.depGraphBodyPath !== undefined && {
              depGraphBodyPath: options.depGraphBodyPath,
            }),
            ...(options.rbacBodyPath !== undefined && { rbacBodyPath: options.rbacBodyPath }),
            ...(options.dryRun !== undefined && { dryRun: options.dryRun }),
          });
          if (options.human === true) {
            process.stdout.write(
              `inv suggest --gc-stale: scanned ${String(r.scanned)} candidate(s), ${String(r.stale)} stale, ${String(r.kept)} kept\n` +
                (r.evidence_log_path !== null ? `  evidence: ${r.evidence_log_path}\n` : ''),
            );
          } else {
            process.stdout.write(JSON.stringify(r) + '\n');
          }
          process.exitCode = EXIT_PASS;
          return;
        }
        if (options.fromInventory !== true) {
          process.stderr.write(
            "devai inventory suggest: --from-inventory is required in 17.E (the only supported mode). Re-run with: 'devai inventory suggest --from-inventory'.\n",
          );
          process.exit(EXIT_USAGE);
        }

        const result = suggestInvariants({
          repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
          ...(options.outDir !== undefined && { outDir: options.outDir }),
          ...(options.dryRun !== undefined && { dryRun: options.dryRun }),
          ...(options.coverageBodyPath !== undefined && {
            coverageBodyPath: options.coverageBodyPath,
          }),
          ...(options.dataHandlingBodyPath !== undefined && {
            dataHandlingBodyPath: options.dataHandlingBodyPath,
          }),
          ...(options.depGraphBodyPath !== undefined && {
            depGraphBodyPath: options.depGraphBodyPath,
          }),
          ...(options.rbacBodyPath !== undefined && {
            rbacBodyPath: options.rbacBodyPath,
          }),
        });

        if (options.human === true) {
          const lines: string[] = [`inv suggest: ${String(result.summary.total)} candidate(s)`];
          for (const [cat, n] of Object.entries(result.summary.by_category)) {
            if (n > 0) lines.push(`  ${cat}: ${String(n)}`);
          }
          if (result.summary.unread_inputs.length > 0) {
            lines.push(`  unread inputs: ${result.summary.unread_inputs.join(', ')}`);
          }
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(
            JSON.stringify({
              summary: result.summary,
              written_files: result.written_files,
            }) + '\n',
          );
        }

        // Exit-code policy:
        //   - missing inputs (unread) → EXIT_REVIEW
        //   - candidates emitted     → EXIT_REVIEW (gaps to curate)
        //   - clean (zero candidates, zero unread) → EXIT_PASS
        process.exitCode =
          result.summary.unread_inputs.length > 0 || result.summary.total > 0
            ? EXIT_REVIEW
            : EXIT_PASS;
        // EXIT_FAIL would only fire on an internal error inside the
        // suggest module (caught and rethrown above); the catch-all
        // path is the process default.
        void EXIT_FAIL;
      });
  },
});
