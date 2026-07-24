import type { CAC } from 'cac';
import { senseHarnessInvariantAlignment } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly invariantsDir?: string;
  readonly gateSeverityValue?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseHarnessInvariantAlignmentCmd = defineCommand({
  name: 'sense harness-invariant-alignment',
  description: 'Every severity=gate invariant has CI coverage; F5×T4',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-harness-invariant-alignment',
        'Emit a harness_invariant_alignment SensorReading (F5×T4)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir')
      .option('--invariants-dir <path>', 'Override invariants dir')
      .option('--gate-severity-value <s>', 'Severity value treated as a gate (default "gate")')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseHarnessInvariantAlignment({
          repoRoot,
          ...(options.workflowDir !== undefined && { workflowDir: options.workflowDir }),
          ...(options.invariantsDir !== undefined && { invariantsDir: options.invariantsDir }),
          ...(options.gateSeverityValue !== undefined && {
            gateSeverityValue: options.gateSeverityValue,
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
