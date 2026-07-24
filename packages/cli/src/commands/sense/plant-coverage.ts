import type { CAC } from 'cac';
import { sensePlantCoverage } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly apiMapPath?: string;
  readonly routesInventoryPath?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense plant coverage` — emit a plant_coverage SensorReading
 * (Phase 26.E, F2×T1). Joins the api-map + routes-inventory bodies
 * emitted by sense-api + sense-routes and asserts that each
 * recorded controller.file / component.file is present on disk.
 */
export const sensePlantCoverageCmd = defineCommand({
  name: 'sense plant-coverage',
  description:
    'Verify api-map + routes-inventory file refs against disk and emit a plant_coverage SensorReading (F2×T1)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-plant-coverage', 'Emit a plant_coverage SensorReading (F2×T1)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--api-map-path <path>',
        'Override api-map.json path (default: .devai/state/sensors/inventory_api/api-map.json)',
      )
      .option(
        '--routes-inventory-path <path>',
        'Override routes-inventory.json path (default: .devai/state/sensors/inventory_routes/routes-inventory.json)',
      )
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = sensePlantCoverage({
          repoRoot,
          ...(options.apiMapPath !== undefined && { apiMapPath: options.apiMapPath }),
          ...(options.routesInventoryPath !== undefined && {
            routesInventoryPath: options.routesInventoryPath,
          }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
