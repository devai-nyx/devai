import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseInventoryPerformance } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly readingsDir?: string;
  readonly thresholdPass?: number;
  readonly thresholdReview?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseInventoryPerformanceCmd = defineCommand({
  name: 'sense inventory-performance',
  description:
    'Aggregate persisted inventory_* SR durations into a p95-based verdict (F4×T7, Phase 29.F / R-1)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-inventory-performance', 'Emit an inventory_performance SensorReading (F4×T7)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--readings-dir <path>',
        'Override readings directory (default: .devai/state/sensor-readings)',
      )
      .option('--threshold-pass <ms>', 'p95 below this is PASS (default 2000)')
      .option(
        '--threshold-review <ms>',
        'p95 below this (and ≥ pass) is REVIEW; above this is FAIL (default 5000)',
      )
      .option('--adopter-root <path>', 'Adopter root for pack-tune')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        let pass = options.thresholdPass !== undefined ? Number(options.thresholdPass) : undefined;
        let review =
          options.thresholdReview !== undefined ? Number(options.thresholdReview) : undefined;
        if (
          (pass === undefined || review === undefined) &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'inventory_performance',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['thresholds'] as
            { pass?: number; review?: number } | undefined;
          if (fromPack !== undefined) {
            if (pass === undefined && typeof fromPack.pass === 'number') pass = fromPack.pass;
            if (review === undefined && typeof fromPack.review === 'number')
              review = fromPack.review;
          }
        }
        const thresholds =
          pass !== undefined && review !== undefined ? { pass, review } : undefined;
        const reading = senseInventoryPerformance({
          repoRoot,
          ...(options.readingsDir !== undefined && { readingsDir: options.readingsDir }),
          ...(thresholds !== undefined && { thresholds }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
