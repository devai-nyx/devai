import type { CAC } from 'cac';
import { senseHarnessRobustness } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly branch?: string;
  readonly limit?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessRobustnessCmd = defineCommand({
  name: 'sense harness-robustness',
  description: 'gh run list flakiness rate; emit a harness_robustness SensorReading (F5×T8)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-robustness', 'Emit a harness_robustness SensorReading (F5×T8)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--branch <name>', 'Branch to query (default: main)')
      .option('--limit <n>', 'Recent runs to inspect (default: 100)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseHarnessRobustness({
          repoRoot,
          ...(options.branch !== undefined && { branch: options.branch }),
          ...(options.limit !== undefined && { limit: Number(options.limit) }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
