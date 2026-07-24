import type { CAC } from 'cac';
import { diffBlueprintAgainstInventory, loadBlueprint } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface Options {
  readonly file?: string;
  readonly against?: string;
  readonly human?: boolean;
}

/**
 * `devai spec blueprint diff <spec> --against <repo>` — the bridge that
 * unifies brownfield + greenfield: against an empty repo it lists
 * everything in the blueprint (scaffold everything); against a real
 * repo it lists deltas (scaffold the missing pieces).
 *
 * Phase 18.E (D-59). Exit code: PASS when status=aligned; REVIEW
 * when status=has_deltas or no_inventory (deltas exist; scaffolding
 * needed but no failure); FAIL only on validation problems.
 */
export const blueprintDiff = defineCommand({
  name: 'blueprint diff',
  description:
    'Compare a module-blueprint to brownfield inventory; emit deltas (the bridge between brownfield and greenfield)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('blueprint-diff <file>', 'Diff a module-blueprint against an adopter repo inventory')
      .option('--against <repo>', 'Adopter repo root to compare against (default: cwd)')
      .option('--human', 'Human-readable summary')
      .action((file: string, options: Options) => {
        if (typeof file !== 'string' || file.length === 0) {
          process.stderr.write('devai spec blueprint diff: <file> is required\n');
          process.exit(EXIT_USAGE);
        }
        const loaded = loadBlueprint(file);
        if (!loaded.ok || loaded.blueprint === undefined) {
          if (options.human === true) {
            process.stderr.write(`blueprint diff: SCHEMA FAILED (${file})\n`);
            for (const err of loaded.errors) process.stderr.write(`  - ${err}\n`);
          } else {
            process.stdout.write(
              JSON.stringify({ ok: false, schema_errors: loaded.errors }) + '\n',
            );
          }
          process.exit(EXIT_FAIL);
        }
        const inventoryRoot = options.against ?? '.';
        const diff = diffBlueprintAgainstInventory({
          blueprint: loaded.blueprint,
          inventoryRoot,
        });
        const payload = {
          ok: diff.status === 'aligned',
          blueprint_id: loaded.blueprint.id,
          blueprint_version: loaded.blueprint.module.version,
          inventory_root: inventoryRoot,
          ...diff,
        };
        if (options.human === true) {
          process.stdout.write(
            `blueprint diff: ${diff.status.toUpperCase()} — ${loaded.blueprint.id} v${loaded.blueprint.module.version} vs ${inventoryRoot}\n`,
          );
          process.stdout.write(
            `  missing: ${String(diff.summary.missing_entities)} entities, ${String(diff.summary.missing_fields)} fields, ${String(diff.summary.missing_routes)} routes, ${String(diff.summary.missing_permissions)} permissions\n`,
          );
          for (const d of diff.deltas) {
            process.stdout.write(`  [${d.kind}] ${d.target}: ${d.detail}\n`);
          }
        } else {
          process.stdout.write(JSON.stringify(payload) + '\n');
        }
        process.exitCode = diff.status === 'aligned' ? EXIT_PASS : EXIT_REVIEW;
      });
  },
});
