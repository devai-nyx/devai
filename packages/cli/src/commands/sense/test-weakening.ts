import type { CAC } from 'cac';
import { loadTestWeakeningConfig, senseTestWeakening } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly baseRef?: string;
  readonly threshold?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseTestWeakeningCmd = defineCommand({
  name: 'sense test-weakening',
  description:
    'AST-diff each changed test file vs --base-ref; flag unjustified weakening. Reads .devai/config/test-weakening.json if present for per-project threshold overrides (D-21 evolution, Phase 16.F). --threshold flag overrides the config file when both are set.',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-test-weakening', 'AST-diff weakening detector + emit SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--base-ref <ref>', 'Git ref to diff against (default: HEAD~1)')
      .option(
        '--threshold <ratio>',
        'Decrease ratio above which to flag. Overrides .devai/config/test-weakening.json if set (default falls back to that file, then to the D-21 default of 0.20).',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting under .devai/state/sensor-readings/')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        // Config file gives per-project defaults; --threshold flag overrides.
        const cfg = loadTestWeakeningConfig(repoRoot);
        const effectiveThreshold =
          options.threshold !== undefined ? Number(options.threshold) : cfg.threshold_ratio;
        const reading = senseTestWeakening({
          cwd: repoRoot,
          ...(options.baseRef !== undefined && { baseRef: options.baseRef }),
          thresholdRatio: effectiveThreshold,
        });
        // Phase 30 lane D: was using emit+process.exit; now persists
        // under .devai/state/sensor-readings/test_weakening_review/ via
        // the 21.E post-amble. Closes a Phase 23.G omission.
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
