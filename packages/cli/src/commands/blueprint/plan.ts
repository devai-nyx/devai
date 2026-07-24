import type { CAC } from 'cac';
import { loadBlueprint, planScaffoldFromBlueprint, validateBlueprint } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface Options {
  readonly file?: string;
  readonly human?: boolean;
}

/**
 * `devai spec blueprint plan <spec>` — emit a deterministic scaffold plan
 * (per-skill target paths + template ids). No file writes; pure data.
 * The plan's blueprint_sha256 anchors INV-SCAFFOLD-001 once the
 * scaffolders run from it.
 *
 * Phase 18.E (D-59). Exit: PASS when blueprint validates + plan
 * derives cleanly; FAIL when validation fails.
 */
export const blueprintPlan = defineCommand({
  name: 'blueprint plan',
  description: 'Emit a deterministic scaffold plan from a module-blueprint (no file writes)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('blueprint-plan <file>', 'Plan the scaffold tasks for a module-blueprint')
      .option('--human', 'Human-readable summary')
      .action((file: string, options: Options) => {
        if (typeof file !== 'string' || file.length === 0) {
          process.stderr.write('devai spec blueprint plan: <file> is required\n');
          process.exit(EXIT_USAGE);
        }
        const loaded = loadBlueprint(file);
        if (!loaded.ok || loaded.blueprint === undefined) {
          if (options.human === true) {
            process.stderr.write(`blueprint plan: SCHEMA FAILED (${file})\n`);
            for (const err of loaded.errors) process.stderr.write(`  - ${err}\n`);
          } else {
            process.stdout.write(
              JSON.stringify({ ok: false, schema_errors: loaded.errors }) + '\n',
            );
          }
          process.exit(EXIT_FAIL);
        }
        const v = validateBlueprint(loaded.blueprint);
        if (!v.ok) {
          if (options.human === true) {
            process.stderr.write(
              `blueprint plan: INVARIANT VIOLATIONS — ${loaded.blueprint.id} v${loaded.blueprint.module.version}\n`,
            );
            for (const vio of v.violations) {
              process.stderr.write(
                `  [${vio.invariant_id} ${vio.severity}] ${vio.pointer}: ${vio.message}\n`,
              );
            }
          } else {
            process.stdout.write(JSON.stringify({ ok: false, violations: v.violations }) + '\n');
          }
          process.exit(EXIT_FAIL);
        }
        const plan = planScaffoldFromBlueprint(loaded.blueprint);
        if (options.human === true) {
          process.stdout.write(
            `blueprint plan: ${plan.blueprint_id} v${plan.blueprint_version} (${plan.blueprint_sha256.slice(0, 8)})\n`,
          );
          process.stdout.write(`  module_slug: ${plan.module_slug}\n`);
          for (const task of plan.tasks) {
            process.stdout.write(
              `  ${task.skill_id}: ${String(task.target_paths.length)} file(s)\n`,
            );
            for (const p of task.target_paths) process.stdout.write(`    - ${p}\n`);
          }
        } else {
          process.stdout.write(JSON.stringify(plan) + '\n');
        }
        process.exitCode = EXIT_PASS;
      });
  },
});
