import type { CAC } from 'cac';
import { resolveStackAdapterPack } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Phase 17.G gap-2 close: `devai adopt pack resolve` — evaluate every
 * registered stack-adapter pack's detect signals against the
 * adopter repo and print the resolution.
 *
 * Exit-code policy:
 *   EXIT_PASS    one pack matched cleanly (no ambiguity)
 *   EXIT_REVIEW  zero matches OR ≥2 packs tied at top priority
 *   EXIT_FAIL    internal resolution error (reserved; should not fire)
 */

interface Options {
  readonly repoRoot?: string;
  readonly adopterRoot?: string;
  readonly seedsDir?: string;
  readonly explicitId?: string;
  readonly human?: boolean;
}

export const packResolve = defineCommand({
  name: 'pack resolve',
  description:
    'Resolve which stack-adapter pack matches the current repo (or --adopter-root); report match + priority.',
  authority: 'host_tooling',
  register(cli: CAC): void {
    cli
      .command(
        'pack-resolve',
        'Evaluate stack-adapter detect signals; print the matched pack id and tie state',
      )
      .option(
        '--repo-root <path>',
        `Repo root for finding bundled packs (default: ${DEFAULT_REPO_ROOT})`,
      )
      .option(
        '--adopter-root <path>',
        'Repo to evaluate detect signals against (default: same as --repo-root, for self-introspection)',
      )
      .option(
        '--seeds-dir <path>',
        'Additional pack directory to consider (comma-separated allowed); pass per existing --seeds plumbing',
      )
      .option('--explicit-id <id>', 'Force a specific pack id, skip auto-detection')
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const additional = options.seedsDir
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const result = resolveStackAdapterPack({
          repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
          ...(options.adopterRoot !== undefined && { adopterRoot: options.adopterRoot }),
          ...(additional !== undefined && additional.length > 0 && { additionalDirs: additional }),
          ...(options.explicitId !== undefined && { explicitId: options.explicitId }),
        });

        if (options.human === true) {
          if (result.matched === null) {
            process.stdout.write('pack resolve: no pack matched.\n');
            if (result.candidates.length === 0) {
              process.stdout.write('  (no packs evaluated had any signal hits)\n');
            }
          } else {
            process.stdout.write(
              `pack resolve: ${result.matched.id}` +
                ` (priority=${String(result.matched.detect.priority ?? 50)}` +
                `${result.ambiguous ? ', AMBIGUOUS tie at top' : ''})\n`,
            );
            process.stdout.write(
              `  stack: ${result.matched.stack.backend} / ${result.matched.stack.frontend} / ${result.matched.stack.db}\n`,
            );
            const top = result.candidates[0];
            if (top !== undefined) {
              process.stdout.write(`  matched signals (${String(top.matched_signals.length)}):\n`);
              for (const sig of top.matched_signals) {
                const detail = sig.path ?? sig.package ?? '';
                process.stdout.write(`    ${sig.kind}: ${detail}\n`);
              }
            }
            if (result.candidates.length > 1) {
              process.stdout.write(`  other candidates: ${String(result.candidates.length - 1)}\n`);
            }
          }
        } else {
          process.stdout.write(
            JSON.stringify({
              matched_id: result.matched?.id ?? null,
              ambiguous: result.ambiguous,
              candidates: result.candidates.map((c) => ({
                id: c.pack.id,
                priority: c.priority,
                matched_signal_count: c.matched_signals.length,
              })),
            }) + '\n',
          );
        }

        process.exitCode = result.matched === null || result.ambiguous ? EXIT_REVIEW : EXIT_PASS;
        void EXIT_FAIL;
      });
  },
});
