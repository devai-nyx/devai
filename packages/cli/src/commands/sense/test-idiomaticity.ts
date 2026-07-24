import type { CAC } from 'cac';
import { senseTestIdiomaticity } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly testGlobs?: string | string[];
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

function optionList(value: string | string[] | undefined): readonly string[] | undefined {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const parsed = values.flatMap((item) =>
    item
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part !== ''),
  );
  return parsed.length === 0 ? undefined : parsed;
}

export const senseTestIdiomaticityCmd = defineCommand({
  name: 'sense test-idiomaticity',
  description:
    'Fixture-pattern + mock-usage detection in tests; emit a test_idiomaticity SensorReading (F3×T5)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-test-idiomaticity', 'Emit a test_idiomaticity SensorReading (F3×T5)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--test-globs <glob>',
        'Test roots/globs to scan (comma-separated or repeatable; default: packages/*/test, packages/*/src)',
      )
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const testGlobs = optionList(options.testGlobs);
        const reading = senseTestIdiomaticity({
          repoRoot,
          ...(testGlobs !== undefined && { testGlobs }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
