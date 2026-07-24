import type { CAC } from 'cac';
import { senseDocsDrift } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly claimFiles?: string;
  readonly schemasDir?: string;
  readonly worktreeCapSource?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseDocsDriftCmd = defineCommand({
  name: 'sense docs-drift',
  description:
    'Cross-check machine-derivable reference-doc claims against ground truth; emit a docs_drift SensorReading (F5×T3)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-docs-drift', 'Emit a docs_drift SensorReading (F5×T3)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--claim-files <csv>', 'Files scanned for claims (default: README.md,CLAUDE.md)')
      .option('--schemas-dir <path>', 'Schema-count ground truth dir (default: law/schemas)')
      .option(
        '--worktree-cap-source <path>',
        'Source file carrying WORKTREE_CAP; DEVAI self posture auto-detects its canonical source',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseDocsDrift({
          repoRoot,
          ...(options.claimFiles !== undefined && {
            claimFiles: options.claimFiles
              .split(',')
              .map((f) => f.trim())
              .filter((f) => f.length > 0),
          }),
          ...(options.schemasDir !== undefined && { schemasDir: options.schemasDir }),
          ...(options.worktreeCapSource !== undefined && {
            worktreeCapSource: options.worktreeCapSource,
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
