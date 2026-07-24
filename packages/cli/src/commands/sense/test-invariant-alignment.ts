import type { CAC } from 'cac';
import { senseTestInvariantAlignment } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly tracePath?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense test invariant alignment` — emit a
 * test_invariant_alignment SensorReading (Phase 26.G, F3×T4).
 * Reads law/trace.json and asserts each invariant has
 * at least one `tests[]` entry.
 */
export const senseTestInvariantAlignmentCmd = defineCommand({
  name: 'sense test-invariant-alignment',
  description: 'Read trace.json and emit a test_invariant_alignment SensorReading (F3×T4)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-test-invariant-alignment',
        'Emit a test_invariant_alignment SensorReading (F3×T4)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--trace-path <path>', 'Override trace.json path (default: law/trace.json)')
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseTestInvariantAlignment({
          repoRoot,
          ...(options.tracePath !== undefined && { tracePath: options.tracePath }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
