import type { CAC } from 'cac';
import { discoverTests } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

export const invTests = defineCommand({
  name: 'inv tests',
  description: 'Discover *.test.ts/*.spec.ts files; classify by suite; extract invariant markers',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-tests', 'Discover test files + extract INV-* markers')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action((options: CommonInvOptions) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const records = discoverTests({ repoRoot, ignoreDirs });
          emit(
            { count: records.length, tests: records },
            options.human === true,
            `inv tests: ${String(records.length)} test file(s)\n${records
              .map(
                (t) =>
                  `  ${t.suite.padEnd(8)} ${t.path}${t.invariants.length > 0 ? `  [${t.invariants.join(', ')}]` : ''}`,
              )
              .join('\n')}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory tests: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
