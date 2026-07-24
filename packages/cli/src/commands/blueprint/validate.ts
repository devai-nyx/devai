import type { CAC } from 'cac';
import { loadBlueprint, validateBlueprint } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface Options {
  readonly file?: string;
  readonly human?: boolean;
}

/**
 * `devai spec blueprint validate -f <spec>` — schema + INV-BLUEPRINT-*
 * check on a module blueprint. Phase 18.E (D-59).
 *
 * Exit code: PASS when schema + all 3 INV-BLUEPRINT-* invariants
 * are satisfied. FAIL otherwise. USAGE when -f is missing.
 */
export const blueprintValidate = defineCommand({
  name: 'blueprint validate',
  description: 'Validate a module-blueprint against schema + INV-BLUEPRINT-001/-002/-003',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'blueprint-validate',
        'Validate a module-blueprint file against schema + Phase-18 invariants',
      )
      .option('-f, --file <path>', 'Path to a module-blueprint JSON file (required)')
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const file = options.file;
        if (file === undefined || file.length === 0) {
          process.stderr.write('devai spec blueprint validate: -f <path> is required\n');
          process.exit(EXIT_USAGE);
        }
        const loaded = loadBlueprint(file);
        if (!loaded.ok || loaded.blueprint === undefined) {
          const payload = { ok: false, schema_errors: loaded.errors, violations: [] };
          if (options.human === true) {
            process.stderr.write(`blueprint validate: SCHEMA FAILED (${file})\n`);
            for (const err of loaded.errors) process.stderr.write(`  - ${err}\n`);
          } else {
            process.stdout.write(JSON.stringify(payload) + '\n');
          }
          process.exit(EXIT_FAIL);
        }
        const result = validateBlueprint(loaded.blueprint);
        const payload = {
          ok: result.ok,
          blueprint_id: loaded.blueprint.id,
          blueprint_version: loaded.blueprint.module.version,
          schema_errors: [],
          violations: result.violations,
        };
        if (options.human === true) {
          if (result.ok) {
            process.stdout.write(
              `blueprint validate: PASS — ${loaded.blueprint.id} v${loaded.blueprint.module.version}\n`,
            );
          } else {
            process.stderr.write(
              `blueprint validate: FAIL — ${loaded.blueprint.id} v${loaded.blueprint.module.version}\n`,
            );
            for (const v of result.violations) {
              process.stderr.write(
                `  [${v.invariant_id} ${v.severity}] ${v.pointer}: ${v.message}\n`,
              );
            }
          }
        } else {
          process.stdout.write(JSON.stringify(payload) + '\n');
        }
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});
