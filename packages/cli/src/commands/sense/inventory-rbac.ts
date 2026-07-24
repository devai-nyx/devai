import type { CAC } from 'cac';
import { senseInventoryRbac } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishInventorySenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly dataModelPath?: string;
  readonly apiMapPath?: string;
  readonly bodyPath?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory rbac` — emit an inventory_rbac SensorReading at tier L0
 * by inferring RBAC tables (roles, permissions, role-permission joins)
 * from a pre-existing data-model body. Run `devai sense inventory data model`
 * first. Per Phase 17.C3 (D-57).
 */
export const senseInventoryRbacCmd = defineCommand({
  name: 'sense rbac',
  description:
    'Static RBAC inventory inferred from data-model output (tier L0); emit SensorReading + rbac body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-rbac', 'Infer RBAC inventory from data-model and emit a SensorReading + body')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--data-model-path <path>',
        'Path to data-model body (default: .devai/state/sensors/inventory_data_model/data-model.json)',
      )
      .option(
        '--api-map-path <path>',
        'Path to api-map body for endpointBindings synthesis from @UseGuards/@Roles (default: .devai/state/sensors/inventory_api/api-map.json)',
      )
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_rbac/rbac.json)',
      )
      .option('--human', 'Human-readable summary')
      .option(
        '--output <mode>',
        "Stdout payload: 'reading' (default) or the complete non-persisted 'body'",
      )
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 21.E.',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const { reading, body } = senseInventoryRbac({
          repoRoot,
          persistBody: false,
          ...(options.dataModelPath !== undefined && { dataModelPath: options.dataModelPath }),
          ...(options.apiMapPath !== undefined && { apiMapPath: options.apiMapPath }),
          ...(options.bodyPath !== undefined && { bodyPath: options.bodyPath }),
        });
        finishInventorySenseCommand(reading, body, {
          repoRoot,
          ...(options.output !== undefined && { output: options.output }),
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
