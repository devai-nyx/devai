import type { CAC } from 'cac';
import { pruneState } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

export const statePrune = defineCommand({
  name: 'state prune',
  description: 'Preview or delete expired disposable outputs while preserving canonical evidence',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('state-prune', 'Prune expired disposable outputs (dry-run by default)')
      .option('--repo-root <path>', 'Repo root (default: .)')
      .option('--older-than-days <n>', 'Retention window in days (default: 30)')
      .option('--apply', 'Delete the previewed disposable files')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          olderThanDays?: number;
          apply?: boolean;
          human?: boolean;
        }) => {
          try {
            const result = pruneState({
              repoRoot: options.repoRoot ?? '.',
              ...(options.olderThanDays !== undefined && {
                olderThanDays: Number(options.olderThanDays),
              }),
              apply: options.apply === true,
            });
            if (options.human === true) {
              process.stdout.write(
                `state prune: ${result.applied ? 'applied' : 'dry-run'}; ${String(result.candidates.length)} candidate(s), ${String(result.deleted.length)} deleted\n`,
              );
            } else {
              process.stdout.write(JSON.stringify(result) + '\n');
            }
            process.exitCode = EXIT_PASS;
          } catch (error) {
            process.stderr.write(
              `devai work state prune: ${error instanceof Error ? error.message : String(error)}\n`,
            );
            process.exit(
              error instanceof Error && error.message.includes('positive integer')
                ? EXIT_USAGE
                : EXIT_FAIL,
            );
          }
        },
      );
  },
});
