import type { CAC } from 'cac';
import { senseSiteDrift } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
}

export const senseSiteDriftCmd = defineCommand({
  name: 'sense site-drift',
  description:
    'Compare local gh-pages provenance with repository and package history; emit a site_drift SensorReading',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-site-drift', 'Emit a site_drift SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const reading = senseSiteDrift({ repoRoot });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
        });
      });
  },
});
