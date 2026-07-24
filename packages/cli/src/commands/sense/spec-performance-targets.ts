import type { CAC } from 'cac';
import { senseSpecPerformanceTargets } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseSpecPerformanceTargetsCmd = defineCommand({
  name: 'sense spec-performance-targets',
  description:
    'Count perf invariants + perf use-cases; emit a spec_performance_targets SensorReading (F1×T7)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-spec-performance-targets',
        'Emit a spec_performance_targets SensorReading (F1×T7)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseSpecPerformanceTargets({ repoRoot });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
