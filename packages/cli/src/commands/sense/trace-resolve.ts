import type { CAC } from 'cac';
import { senseTraceResolve } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly trace?: string;
  readonly invariantsDir?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense trace resolve` — emit a trace_resolution SensorReading.
 *
 * Phase 30 lane D (DEVAI self-application): converted from the pre-21.E
 * `emit + process.exit` pattern to `finishSenseCommand` so the SR
 * persists under `.devai/state/sensor-readings/trace_resolution/`.
 * Phase 23.G converted lint/test/build; trace-resolve was missed.
 */
export const senseTraceResolveCmd = defineCommand({
  name: 'sense trace-resolve',
  description: 'Resolve trace.json against the invariant catalog and check coverage',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-trace-resolve', 'Run trace-resolution + emit SensorReading')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--trace <path>', 'Trace file (default: law/trace.json)')
      .option('--invariants-dir <path>', 'Invariants directory (default: law/invariants)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting under .devai/state/sensor-readings/')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseTraceResolve({
          repoRoot,
          ...(options.trace !== undefined && { tracePath: options.trace }),
          ...(options.invariantsDir !== undefined && { invariantsDir: options.invariantsDir }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
