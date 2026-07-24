import type { CAC } from 'cac';
import { extractDependencies } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

export const invDependencies = defineCommand({
  name: 'inv dependencies',
  description: 'Build the import graph (sorted nodes + edges) and compute its SHA-256 hash',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-dependencies', 'Build the import graph + canonical-form hash')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary instead of the full graph')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action((options: CommonInvOptions) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const graph = extractDependencies({ repoRoot, ignoreDirs });
          emit(
            graph,
            options.human === true,
            `inv dependencies: ${String(graph.nodes.length)} node(s), ${String(graph.edges.length)} edge(s)\n  hash: ${graph.hash}`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory dependencies: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
