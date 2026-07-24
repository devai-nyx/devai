import type { CAC } from 'cac';
import { senseHarnessCoverage } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly thresholdPass?: number;
  readonly thresholdReview?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessCoverageCmd = defineCommand({
  name: 'sense harness-coverage',
  description:
    'CI workflow path-filter coverage vs tracked files; emit a harness_coverage SensorReading (F5×T1)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-coverage', 'Emit a harness_coverage SensorReading (F5×T1)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir (default: .github/workflows)')
      .option('--threshold-pass <pct>', 'PASS threshold (default 80)')
      .option('--threshold-review <pct>', 'REVIEW threshold (default 50)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const thresholds =
          options.thresholdPass !== undefined && options.thresholdReview !== undefined
            ? { pass: Number(options.thresholdPass), review: Number(options.thresholdReview) }
            : undefined;
        const reading = senseHarnessCoverage({
          repoRoot,
          ...(options.workflowDir !== undefined && { workflowDir: options.workflowDir }),
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
