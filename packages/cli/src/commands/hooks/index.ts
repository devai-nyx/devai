import type { CAC } from 'cac';
import {
  buildHooksInstallPlan,
  executeHooksInstallPlan,
  HOOK_NAMES,
  type HookName,
} from '#core-compat';
import { EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { resolveCliVersion } from '../../version.js';

const DEFAULT_REPO_ROOT = '.';

export const hooksInstall = defineCommand({
  name: 'hooks install',
  description:
    'Wire a devai check into a local git hook (husky-aware, idempotent via a marker block). Plan-only unless --execute (D-123, item 5).',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('hooks-install', 'Install (or plan) a devai check into a local git hook')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--hook <name>', `${HOOK_NAMES.join(' | ')} (default: pre-push)`)
      .option(
        '--command <cmd>',
        'Command to run (default: devai policy check forbidden actions --strict)',
      )
      .option('--execute', 'Write the hook file (default: print the plan only)')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          hook?: string;
          command?: string;
          execute?: boolean;
          human?: boolean;
        }) => {
          if (options.hook !== undefined && !HOOK_NAMES.includes(options.hook as HookName)) {
            process.stderr.write(
              `devai adopt hooks install: --hook must be one of ${HOOK_NAMES.join(' | ')} (got '${options.hook}')\n`,
            );
            process.exit(EXIT_USAGE);
          }
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const plan = buildHooksInstallPlan({
            targetRoot: repoRoot,
            devaiVersion: resolveCliVersion(),
            ...(options.hook !== undefined && { hook: options.hook as HookName }),
            ...(options.command !== undefined && { command: options.command }),
          });
          if (options.execute === true) {
            executeHooksInstallPlan(plan);
          }
          const executed = options.execute === true;
          if (options.human === true) {
            process.stdout.write(
              `hooks install: ${executed ? plan.action : `would ${plan.action}`} ${plan.path} (${plan.manager}, ${plan.hook} → \`${plan.command}\`)\n`,
            );
          } else {
            process.stdout.write(JSON.stringify({ ...plan, executed }) + '\n');
          }
          process.exitCode = EXIT_PASS;
        },
      );
  },
});
