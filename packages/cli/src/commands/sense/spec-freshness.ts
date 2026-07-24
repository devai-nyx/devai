import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseSpecFreshness } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly invariantsDir?: string;
  readonly thresholdDays?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense spec freshness` — emit a spec_freshness SensorReading
 * (Phase 26.D, F1×T9). Compares each invariant's mtime against the
 * latest mtime in its `scope.code_areas[]`; staleness threshold
 * defaults to 90 days, overridable via `--threshold-days` or the
 * pack-config key `extractor_params.spec_freshness.threshold_days`.
 */
export const senseSpecFreshnessCmd = defineCommand({
  name: 'sense spec-freshness',
  description:
    'Compare invariant mtimes against their code_areas mtimes and emit a spec_freshness SensorReading (F1×T9)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-spec-freshness', 'Emit a spec_freshness SensorReading (F1×T9)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--invariants-dir <path>', 'Invariants dir (default: law/invariants)')
      .option(
        '--threshold-days <n>',
        'Staleness threshold in days (default: 90; pack-config overrides)',
      )
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
        // Precedence: CLI flag > pack-config > built-in default (90).
        let thresholdDays: number | undefined =
          options.thresholdDays !== undefined ? Number(options.thresholdDays) : undefined;
        if (
          thresholdDays === undefined &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'spec_freshness',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['threshold_days'];
          if (typeof fromPack === 'number' && Number.isFinite(fromPack) && fromPack > 0) {
            thresholdDays = fromPack;
          }
        }
        const { reading } = senseSpecFreshness({
          repoRoot,
          ...(options.invariantsDir !== undefined && { invariantsDir: options.invariantsDir }),
          ...(thresholdDays !== undefined && { thresholdDays }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
