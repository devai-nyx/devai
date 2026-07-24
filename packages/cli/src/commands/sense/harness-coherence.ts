import type { CAC } from 'cac';
import { senseHarnessCoherence } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly maxReviewIncoherence?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessCoherenceCmd = defineCommand({
  name: 'sense harness-coherence',
  description: 'Cross-workflow consistency; emit a harness_coherence SensorReading (F5×T3)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-coherence', 'Emit a harness_coherence SensorReading (F5×T3)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir')
      .option('--max-review-incoherence <n>', 'REVIEW/FAIL boundary (default 3)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseHarnessCoherence({
          repoRoot,
          ...(options.workflowDir !== undefined && { workflowDir: options.workflowDir }),
          ...(options.maxReviewIncoherence !== undefined && {
            maxReviewIncoherence: Number(options.maxReviewIncoherence),
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
