import type { CAC } from 'cac';
import { sensePlantCoherence } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly sourceGlobs?: string | string[];
  readonly maxReviewIncoherent?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const sensePlantCoherenceCmd = defineCommand({
  name: 'sense plant-coherence',
  description: 'Per-directory casing consistency; emit a plant_coherence SensorReading (F2×T3)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-plant-coherence', 'Emit a plant_coherence SensorReading (F2×T3)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--source-globs <glob>', 'Source globs (repeatable; default: packages/*/src/**)')
      .option(
        '--max-review-incoherent <n>',
        'REVIEW/FAIL boundary on count of incoherent dirs (default: 3)',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        let sourceGlobs: readonly string[] | undefined;
        if (options.sourceGlobs !== undefined) {
          sourceGlobs = Array.isArray(options.sourceGlobs)
            ? options.sourceGlobs
            : [options.sourceGlobs];
        }
        const reading = sensePlantCoherence({
          repoRoot,
          ...(sourceGlobs !== undefined && { sourceGlobs }),
          ...(options.maxReviewIncoherent !== undefined && {
            maxReviewIncoherent: Number(options.maxReviewIncoherent),
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
