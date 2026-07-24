import type { CAC } from 'cac';
import { senseHarnessPerformance } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly branch?: string;
  readonly limit?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessPerformanceCmd = defineCommand({
  name: 'sense harness-performance',
  description:
    'gh run list median + p95 wall-clock; emit a harness_performance SensorReading (F5×T7)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-performance', 'Emit a harness_performance SensorReading (F5×T7)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--branch <name>', 'Branch to query (default: main)')
      .option('--limit <n>', 'Recent runs to inspect (default: 50)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseHarnessPerformance({
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
