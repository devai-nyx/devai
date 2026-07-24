import type { CAC } from 'cac';
import { senseHarnessDepth } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly thresholdPass?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessDepthCmd = defineCommand({
  name: 'sense harness-depth',
  description: 'Per-workflow step + matrix counts; emit a harness_depth SensorReading (F5×T2)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-depth', 'Emit a harness_depth SensorReading (F5×T2)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir')
      .option('--threshold-pass <n>', 'steps_p95 PASS boundary (default 3)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const thresholds =
          options.thresholdPass !== undefined ? { pass: Number(options.thresholdPass) } : undefined;
        const reading = senseHarnessDepth({
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
