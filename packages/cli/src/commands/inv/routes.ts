import type { CAC } from 'cac';
import { extractRoutes } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

export const invRoutes = defineCommand({
  name: 'inv routes',
  description: 'List NestJS HTTP routes (controller decorator walk)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-routes', 'List NestJS HTTP routes')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action((options: CommonInvOptions) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const records = extractRoutes({ repoRoot, ignoreDirs });
          emit(
            { count: records.length, routes: records },
            options.human === true,
            `inv routes: ${String(records.length)} route(s)\n${records
              .map(
                (r) =>
                  `  ${r.method.padEnd(6)} ${r.path}  (${r.module}${r.protected === true ? ', protected' : ''})`,
              )
              .join('\n')}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory routes: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
