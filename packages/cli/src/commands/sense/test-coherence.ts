import type { CAC } from 'cac';
import { senseTestCoherence } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly packageRoots?: string | string[];
  readonly minPerPackageRatio?: number;
  readonly passRatio?: number;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseTestCoherenceCmd = defineCommand({
  name: 'sense test-coherence',
  description: 'Test-file naming consistency + per-package test/source ratio; F3×T3',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-test-coherence', 'Emit a test_coherence SensorReading (F3×T3)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--package-roots <glob>', 'Package roots (repeatable; default: packages/*)')
      .option('--min-per-package-ratio <n>', 'Per-package minimum test/source ratio (default: 0.1)')
      .option('--pass-ratio <n>', 'Global PASS threshold (default: 0.3)')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        let packageRoots: readonly string[] | undefined;
        if (options.packageRoots !== undefined) {
          packageRoots = Array.isArray(options.packageRoots)
            ? options.packageRoots
            : [options.packageRoots];
        }
        const reading = senseTestCoherence({
          repoRoot,
          ...(packageRoots !== undefined && { packageRoots }),
          ...(options.minPerPackageRatio !== undefined && {
            minPerPackageRatio: Number(options.minPerPackageRatio),
          }),
          ...(options.passRatio !== undefined && { passRatio: Number(options.passRatio) }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
