import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseLint } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly target?: string;
  readonly timeoutMs?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseLintCmd = defineCommand({
  name: 'sense lint',
  description: 'Wrap eslint --format=json; emit a SensorReading with per-message findings',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-lint', 'Wrap eslint + emit SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--target <path>', 'File or directory to lint (default: .)')
      .option(
        '--timeout-ms <n>',
        'Hard timeout for eslint (default 120000). On timeout, emits status=review + LINT_TIMED_OUT finding. Phase 32.B / D-A-32.',
      )
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 23.G.',
      )
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;

        let timeoutMs: number | undefined =
          options.timeoutMs !== undefined ? Number(options.timeoutMs) : undefined;

        if (options.packTune === true || options.packId !== undefined) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'lint',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          if (resolved !== null) {
            if (timeoutMs === undefined && typeof resolved.params['timeout_ms'] === 'number') {
              timeoutMs = resolved.params['timeout_ms'] as number;
            }
          }
        }

        const reading = senseLint({
          cwd: repoRoot,
          ...(options.target !== undefined && { target: options.target }),
          ...(timeoutMs !== undefined && { timeoutMs }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
