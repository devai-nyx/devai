import type { CAC } from 'cac';
import { extractComponents } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

export const invComponents = defineCommand({
  name: 'inv components',
  description: 'List Angular/Nest @Component/@Directive/@Pipe/@Injectable/@Controller classes',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-components', 'List Angular/Nest components and services')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action((options: CommonInvOptions) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const records = extractComponents({ repoRoot, ignoreDirs });
          emit(
            { count: records.length, components: records },
            options.human === true,
            `inv components: ${String(records.length)} component(s)\n${records
              .map((c) => `  ${c.kind.padEnd(20)} ${c.name}  (${c.path})`)
              .join('\n')}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory components: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
