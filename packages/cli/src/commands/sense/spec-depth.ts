import type { CAC } from 'cac';
import { senseSpecDepth } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly invariantsDir?: string;
  readonly adrDir?: string;
  readonly useCasesDir?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense spec depth` — emit a spec_depth SensorReading (Phase
 * 26.B, F1×T2). Walks `law/invariants/`, `law/adr/`,
 * and `product/use-cases/` and emits per-component depth metrics
 * + an aggregate status.
 */
export const senseSpecDepthCmd = defineCommand({
  name: 'sense spec-depth',
  description: 'Walk authored spec dirs and emit a spec_depth SensorReading (F1×T2)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-spec-depth', 'Emit a spec_depth SensorReading (F1×T2)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--invariants-dir <path>', 'Override invariants dir (default: law/invariants)')
      .option('--adr-dir <path>', 'Override ADR dir (default: docs/adr)')
      .option('--use-cases-dir <path>', 'Override use-cases dir (default: product/use-cases)')
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const { reading } = senseSpecDepth({
          repoRoot,
          ...(options.invariantsDir !== undefined && { invariantsDir: options.invariantsDir }),
          ...(options.adrDir !== undefined && { adrDir: options.adrDir }),
          ...(options.useCasesDir !== undefined && { useCasesDir: options.useCasesDir }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
