import type { CAC } from 'cac';
import { senseSpecRobustnessTargets } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseSpecRobustnessTargetsCmd = defineCommand({
  name: 'sense spec-robustness-targets',
  description:
    'Count error_semantics invariants + error contracts; emit a spec_robustness_targets SensorReading (F1×T8)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-spec-robustness-targets',
        'Emit a spec_robustness_targets SensorReading (F1×T8)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseSpecRobustnessTargets({ repoRoot });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
