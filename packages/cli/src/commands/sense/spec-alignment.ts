import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseSpecAlignment } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly invariantsDir?: string;
  readonly sourceGlobs?: string | string[];
  readonly reverseThreshold?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseSpecAlignmentCmd = defineCommand({
  name: 'sense spec-alignment',
  description:
    'Forward + reverse spec↔code claim verification; emit a spec_alignment SensorReading (F1×T4)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-spec-alignment', 'Emit a spec_alignment SensorReading (F1×T4)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--invariants-dir <path>', 'Override invariants dir (default: law/invariants)')
      .option(
        '--source-globs <glob>',
        'Reverse-scan source globs (repeatable; default: packages/*/src/**)',
      )
      .option(
        '--reverse-threshold <pct>',
        'PASS/REVIEW boundary for reverse-claim ratio (default: 80)',
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
        let sourceGlobs: readonly string[] | undefined;
        if (options.sourceGlobs !== undefined) {
          sourceGlobs = Array.isArray(options.sourceGlobs)
            ? options.sourceGlobs
            : [options.sourceGlobs];
        }
        let reverseThreshold =
          options.reverseThreshold !== undefined ? Number(options.reverseThreshold) : undefined;
        if (
          (sourceGlobs === undefined || reverseThreshold === undefined) &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'spec_alignment',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          if (sourceGlobs === undefined) {
            const fromPack = resolved?.params['source_globs'];
            if (Array.isArray(fromPack))
              sourceGlobs = fromPack.filter((s): s is string => typeof s === 'string');
          }
          if (reverseThreshold === undefined) {
            const fromPack = resolved?.params['reverse_threshold_pct'];
            if (typeof fromPack === 'number' && Number.isFinite(fromPack))
              reverseThreshold = fromPack;
          }
        }
        const reading = senseSpecAlignment({
          repoRoot,
          ...(options.invariantsDir !== undefined && { invariantsDir: options.invariantsDir }),
          ...(sourceGlobs !== undefined && { sourceGlobs }),
          ...(reverseThreshold !== undefined && { reverseThresholdPct: reverseThreshold }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
