import type { CAC } from 'cac';
import { sensePlantDepth } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly sourceGlobs?: string | string[];
  readonly thresholdPass?: number;
  readonly thresholdReview?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const sensePlantDepthCmd = defineCommand({
  name: 'sense plant-depth',
  description: 'File-size distribution + 95th percentile; emit a plant_depth SensorReading (F2×T2)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-plant-depth', 'Emit a plant_depth SensorReading (F2×T2)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--source-globs <glob>', 'Source globs (repeatable; default: packages/*/src/**)')
      .option('--threshold-pass <n>', 'p95 below this is PASS (default: 500)')
      .option(
        '--threshold-review <n>',
        'p95 below this (and ≥ pass) is REVIEW; above this is FAIL (default: 1000)',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting the SensorReading')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        let sourceGlobs: readonly string[] | undefined;
        if (options.sourceGlobs !== undefined) {
          sourceGlobs = Array.isArray(options.sourceGlobs)
            ? options.sourceGlobs
            : [options.sourceGlobs];
        }
        const thresholds =
          options.thresholdPass !== undefined && options.thresholdReview !== undefined
            ? { pass: Number(options.thresholdPass), review: Number(options.thresholdReview) }
            : undefined;
        const reading = sensePlantDepth({
          repoRoot,
          ...(sourceGlobs !== undefined && { sourceGlobs }),
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
