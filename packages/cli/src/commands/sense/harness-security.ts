import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseHarnessSecurity } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly workflowDir?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense harness security` — emit a harness_security
 * SensorReading (Phase 26.J, F5×T6). Parses .github/workflows/*.yml
 * for SHA-pinning, permissions-block presence, and the
 * pull_request_target + checkout CVE pattern.
 */
export const senseHarnessSecurityCmd = defineCommand({
  name: 'sense harness-security',
  description:
    'Parse GitHub Actions workflows for security signals and emit a harness_security SensorReading (F5×T6)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-security', 'Emit a harness_security SensorReading (F5×T6)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--workflow-dir <path>', 'Override workflows dir (default: .github/workflows)')
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        let workflowDir = options.workflowDir;
        if (
          workflowDir === undefined &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'harness_security',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['workflow_dir'];
          if (typeof fromPack === 'string' && fromPack.length > 0) workflowDir = fromPack;
        }
        const { reading } = senseHarnessSecurity({
          repoRoot,
          ...(workflowDir !== undefined && { workflowDir }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
