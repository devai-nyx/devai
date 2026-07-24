import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { validateInvariantStrategies, type InvariantLike } from '@devai-nyx/spec';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_INVARIANTS_DIR, DEFAULT_REPO_ROOT } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly dir?: string;
  readonly human?: boolean;
}

export const specValidateInvariantStrategies = defineCommand({
  name: 'spec validate-invariant-strategies',
  description: 'Validate non-vacuous completion strategies for readiness-bearing invariants',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-invariant-strategies',
        'Validate completion strategies for readiness-bearing invariants',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--dir <path>', `Invariants directory (default: ${DEFAULT_INVARIANTS_DIR})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const directory = options.dir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const invariants = readdirSync(directory)
            .filter((name) => /^INV-[A-Z0-9-]+\.json$/u.test(name))
            .sort()
            .map(
              (name) => JSON.parse(readFileSync(join(directory, name), 'utf8')) as InvariantLike,
            );
          const result = validateInvariantStrategies(invariants);
          if (options.human === true) {
            process.stdout.write(
              `spec validate invariant strategies: ${result.status.toUpperCase()} (${String(result.population)} invariant(s))\n` +
                result.findings.map((finding) => `  ${finding}\n`).join(''),
            );
          } else {
            process.stdout.write(`${JSON.stringify(result)}\n`);
          }
          process.exitCode = result.status === 'fail' ? EXIT_FAIL : EXIT_PASS;
        } catch (error) {
          process.stderr.write(
            `devai spec validate invariant strategies: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exitCode = EXIT_FAIL;
        }
      });
  },
});
