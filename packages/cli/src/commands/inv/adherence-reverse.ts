import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { computeReverseAdherence, regenerateInventory } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();

interface Options {
  readonly repoRoot?: string;
  readonly inventory?: string;
  readonly trace?: string;
  readonly include?: string;
  readonly strict?: boolean;
  readonly human?: boolean;
}

export const invAdherenceReverse = defineCommand({
  name: 'inv adherence-reverse',
  description:
    'Reverse-direction adherence audit: surfaces from the inventory that are not claimed by any invariant.code_areas in trace.json. Per Phase 11.F (D-39).',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-adherence-reverse', 'Reverse-direction adherence audit (orphan plant surfaces)')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--inventory <path>',
        'Pre-computed inventory JSON file. When omitted, the inventory is regenerated in-memory.',
      )
      .option('--trace <path>', 'trace.json path (default: <repo-root>/law/trace.json)')
      .option(
        '--include <kinds>',
        'Comma-separated surface kinds (route,module,component,dependency). Default: all four.',
      )
      .option(
        '--strict',
        'Exit non-zero when any orphan exists (default: exit 0 regardless of orphan count)',
      )
      .option('--human', 'Human-readable summary')
      .action(async (options: Options) => {
        const repoRoot = resolve(options.repoRoot ?? DEFAULT_REPO_ROOT);
        const tracePath = options.trace ?? join(repoRoot, 'law/trace.json');
        if (!existsSync(tracePath)) {
          process.stderr.write(`devai inventory adherence: trace.json not found at ${tracePath}\n`);
          process.exit(EXIT_USAGE);
        }
        let inventory: unknown;
        try {
          if (options.inventory !== undefined) {
            inventory = JSON.parse(readFileSync(options.inventory, 'utf8'));
          } else {
            inventory = await regenerateInventory({
              repoRoot,
              timestamp: new Date().toISOString(),
              integrationHead: '0'.repeat(40),
            });
          }
        } catch (err) {
          process.stderr.write(
            `devai inventory adherence: failed to load inventory (${err instanceof Error ? err.message : String(err)})\n`,
          );
          process.exit(EXIT_FAIL);
        }
        let trace: unknown;
        try {
          trace = JSON.parse(readFileSync(tracePath, 'utf8'));
        } catch (err) {
          process.stderr.write(
            `devai inventory adherence: failed to parse trace.json (${err instanceof Error ? err.message : String(err)})\n`,
          );
          process.exit(EXIT_FAIL);
        }
        const include =
          options.include !== undefined
            ? (options.include
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0) as Array<
                'route' | 'module' | 'component' | 'dependency'
              >)
            : undefined;
        const report = computeReverseAdherence({
          inventory: inventory as Parameters<typeof computeReverseAdherence>[0]['inventory'],
          trace: trace as Parameters<typeof computeReverseAdherence>[0]['trace'],
          ...(include !== undefined && { include }),
        });

        if (options.human === true) {
          const lines: string[] = [];
          lines.push(
            `inv adherence-reverse: ${String(report.counts.total)} surface(s); ${String(report.counts.claimed)} claimed, ${String(report.counts.orphan)} orphan`,
          );
          lines.push(
            `  by kind: route=${String(report.by_kind.route)}  module=${String(report.by_kind.module)}  component=${String(report.by_kind.component)}  dependency=${String(report.by_kind.dependency)}`,
          );
          if (report.orphans.length > 0) {
            lines.push('  orphans:');
            for (const o of report.orphans) {
              lines.push(`    [${o.kind}]  ${o.id}  (${o.file})`);
            }
          }
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify(report) + '\n');
        }
        process.exitCode =
          options.strict === true && report.counts.orphan > 0 ? EXIT_FAIL : EXIT_PASS;
      });
  },
});
