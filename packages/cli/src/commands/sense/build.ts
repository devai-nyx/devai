import type { CAC } from 'cac';
import { senseBuild } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseBuildCmd = defineCommand({
  name: 'sense build',
  description: 'Run the fixed recursive project build (pnpm -r build); emit a SensorReading',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-build', 'Wrap the project build + emit SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 23.G.',
      )
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseBuild({ cwd: repoRoot });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
