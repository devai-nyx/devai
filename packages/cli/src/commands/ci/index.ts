import type { CAC } from 'cac';
import { buildCiScaffoldPlan, executeCiScaffoldPlan, type CiScaffoldMode } from '#core-compat';
import { EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = '.';
const CI_SCAFFOLD_MODES: readonly CiScaffoldMode[] = ['gate', 'verify'];

export const ciScaffold = defineCommand({
  name: 'ci scaffold',
  description:
    'Generate a starter .github/workflows/devai-gates.yml that calls the canonical reusable-evidence-gate.yml. Plan-only unless --write; refuses to overwrite unless --force (D-123, item 5).',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('ci-scaffold', 'Generate (or plan) a starter devai-gates CI workflow')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--output <path>',
        'Output path (default: <repo-root>/.github/workflows/devai-gates.yml)',
      )
      .option(
        '--devai-ref <ref>',
        'git ref of devai-nyx/devai to pin the reusable workflow to (default: main)',
      )
      .option('--mode <mode>', `${CI_SCAFFOLD_MODES.join(' | ')} (default: gate)`)
      .option(
        '--chain-file <path>',
        'Evidence chain path passed to the reusable workflow (default: record/proofs/chain.json)',
      )
      .option('--execute', 'Write the workflow file (default: print the plan only)')
      .option('--force', 'With --execute: overwrite an existing file')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          output?: string;
          devaiRef?: string;
          mode?: string;
          chainFile?: string;
          execute?: boolean;
          force?: boolean;
          human?: boolean;
        }) => {
          if (
            options.mode !== undefined &&
            !CI_SCAFFOLD_MODES.includes(options.mode as CiScaffoldMode)
          ) {
            process.stderr.write(
              `devai adopt ci scaffold: --mode must be one of ${CI_SCAFFOLD_MODES.join(' | ')} (got '${options.mode}')\n`,
            );
            process.exit(EXIT_USAGE);
          }
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const plan = buildCiScaffoldPlan({
            targetRoot: repoRoot,
            ...(options.output !== undefined && { outputPath: options.output }),
            ...(options.devaiRef !== undefined && { devaiRef: options.devaiRef }),
            ...(options.mode !== undefined && { mode: options.mode as CiScaffoldMode }),
            ...(options.chainFile !== undefined && { chainFile: options.chainFile }),
          });

          if (options.execute !== true) {
            if (options.human === true) {
              process.stdout.write(
                `ci scaffold (plan only): would write ${plan.path}${plan.exists ? ' (already exists — re-run with --write --force to overwrite)' : ''}\n`,
              );
            } else {
              process.stdout.write(JSON.stringify(plan) + '\n');
            }
            process.exitCode = EXIT_PASS;
            return;
          }

          const result = executeCiScaffoldPlan(plan, { force: options.force === true });
          if (options.human === true) {
            process.stdout.write(
              result.written
                ? `ci scaffold: wrote ${plan.path}\n`
                : `ci scaffold: skipped ${plan.path} (${result.reason ?? 'not written'})\n`,
            );
          } else {
            process.stdout.write(JSON.stringify({ ...plan, ...result }) + '\n');
          }
          // Deny-by-default skip is expected steady-state behavior (matches
          // `devai init`'s convention), not a failure — exit PASS either way.
          process.exitCode = EXIT_PASS;
        },
      );
  },
});
