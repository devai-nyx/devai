import type { CAC } from 'cac';
import { EXIT_USAGE } from '@devai-nyx/utils';
import { senseTest, type TestSuite } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

const VALID_SUITES: readonly TestSuite[] = ['unit', 'integration', 'regression', 'e2e', 'all'];

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseTestCmd = defineCommand({
  name: 'sense test',
  description: 'Run a test suite (unit|integration|regression|e2e|all); emit a SensorReading',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-test <suite>', 'Run a test suite + emit SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 23.G.',
      )
      .option('--human', 'Human-readable summary')
      .action((suite: string, options: Options) => {
        if (!VALID_SUITES.includes(suite as TestSuite)) {
          process.stderr.write(
            `devai sense test: invalid suite '${suite}' (expected: ${VALID_SUITES.join('|')})\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseTest({
          cwd: repoRoot,
          suite: suite as TestSuite,
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
