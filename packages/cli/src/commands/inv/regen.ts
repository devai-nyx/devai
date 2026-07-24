import { execFileSync } from '@devai-nyx/authority';
import type { CAC } from 'cac';
import { regenerateInventory } from '#core-compat';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_REPO_ROOT,
  DEFAULT_TIMESTAMP,
  buildIgnoreDirs,
  type CommonInvOptions,
} from './shared.js';

const SHA1_PATTERN = /^[a-f0-9]{40}$/;

interface Options extends CommonInvOptions {
  readonly timestamp?: string;
  readonly integrationHead?: string;
  /** cac maps `--no-git` to `git: false`. */
  readonly git?: boolean;
}

export const invRegen = defineCommand({
  name: 'inv regen',
  description: 'Emit every inventory slice as one schema-conformant record to stdout',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'inv-regen',
        'Emit every inventory slice as one inventory.schema.json instance to stdout',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--timestamp <iso>',
        `Override generated_at (default: now, or ${DEFAULT_TIMESTAMP} for tests/determinism)`,
      )
      .option('--integration-head <sha>', 'Override integration_head (default: git rev-parse HEAD)')
      .option('--no-git', 'Skip git head detection (integration_head = sentinel)')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .action(async (options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const timestamp = options.timestamp ?? new Date().toISOString();
          if (
            options.integrationHead !== undefined &&
            !SHA1_PATTERN.test(options.integrationHead)
          ) {
            process.stderr.write(
              `devai inventory regen: invalid --integration-head '${options.integrationHead}' (expected 40 hex chars matching ^[a-f0-9]{40}$)\n`,
            );
            process.exit(EXIT_USAGE);
          }
          const integrationHead = resolveIntegrationHead(
            repoRoot,
            options.integrationHead,
            options.git === false,
          );

          const ignoreDirs = buildIgnoreDirs(options);
          const inventory = await regenerateInventory({
            repoRoot,
            timestamp,
            integrationHead,
            ignoreDirs,
          });

          // Self-application: the output we just emitted must validate
          // against inventory.schema.json (Phase-3 validation criterion #4).
          const ok = validators.inventory(inventory);
          if (!ok) {
            process.stderr.write(
              `devai inventory regen: output does not validate against inventory.schema.json: ${JSON.stringify(validators.inventory.errors)}\n`,
            );
            process.exit(EXIT_FAIL);
          }

          process.stdout.write(JSON.stringify(inventory) + '\n');
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory regen: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

// Sentinel SHA used when no real git head is available. 39 zero hex chars +
// trailing 'f' — satisfies inventory.schema.json's `integration_head` type
// (string), matches our SHA-1 validation pattern (`^[a-f0-9]{40}$`), and is
// clearly recognizable as "no git context." The trailing 'f' is essential:
// without it, cac's auto-coercion turns the all-zero string into number 0.
const NO_GIT_SENTINEL = '0'.repeat(39) + 'f';

function resolveIntegrationHead(
  repoRoot: string,
  override: string | undefined,
  noGit: boolean,
): string {
  if (override !== undefined) return override;
  if (noGit) return NO_GIT_SENTINEL;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return NO_GIT_SENTINEL;
  }
}
