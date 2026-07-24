import type { CAC } from 'cac';
import { extractModules } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

export const invModules = defineCommand({
  name: 'inv modules',
  description: 'List NestJS @Module and Angular @NgModule classes (AST extraction)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-modules', 'List NestJS @Module and Angular @NgModule classes')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action((options: CommonInvOptions) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const records = extractModules({ repoRoot, ignoreDirs });
          emit(
            { count: records.length, modules: records },
            options.human === true,
            `inv modules: ${String(records.length)} module(s)\n${records
              .map((m) => `  ${m.id}  ${m.kind}  ${m.name}  (${m.path})`)
              .join('\n')}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory modules: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
