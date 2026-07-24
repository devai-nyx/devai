import type { CAC } from 'cac';
import { senseHarnessIdiomaticity } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly minWorkflowsForReusable?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessIdiomaticityCmd = defineCommand({
  name: 'sense harness-idiomaticity',
  description: 'Composite-action / reusable-workflow / cache discipline; F5×T5',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-idiomaticity', 'Emit a harness_idiomaticity SensorReading (F5×T5)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir')
      .option(
        '--min-workflows-for-reusable <n>',
        'Suppress the reusable-workflow signal when workflow_count < n. Default: 1 (always check). Small-CI repos pack-tune to 3.',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseHarnessIdiomaticity({
          repoRoot,
          ...(options.workflowDir !== undefined && { workflowDir: options.workflowDir }),
          ...(options.minWorkflowsForReusable !== undefined && {
            minWorkflowsForReusableCheck: Number(options.minWorkflowsForReusable),
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
