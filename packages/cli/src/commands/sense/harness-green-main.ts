import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseHarnessGreenMain } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly branch?: string;
  readonly limit?: number;
  readonly thresholdPass?: number;
  readonly thresholdReview?: number;
  readonly since?: string;
  readonly minSampleSize?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

/**
 * `devai sense harness green main` — emit a harness_green_main
 * SensorReading (Phase 26.K, F5×T9). Calls `gh run list --branch
 * main --json conclusion --limit 50` and maps success rate to
 * PASS/REVIEW/FAIL. Returns status='unknown' cleanly if `gh` is
 * unavailable.
 */
export const senseHarnessGreenMainCmd = defineCommand({
  name: 'sense harness-green-main',
  description:
    'Query gh CLI for main-branch CI history and emit a harness_green_main SensorReading (F5×T9)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-harness-green-main', 'Emit a harness_green_main SensorReading (F5×T9)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--branch <name>', 'Branch to query (default: main)')
      .option('--limit <n>', 'Number of recent runs to inspect (default: 50)')
      .option('--threshold-pass <pct>', 'PASS threshold (default 95)')
      .option('--threshold-review <pct>', 'REVIEW threshold (default 80)')
      .option(
        '--since <iso-date>',
        'Restrict the rolling window to runs whose createdAt >= <iso-date>. Pack-config: extractor_params.harness_green_main.since. Phase 32.D / D-A-34.',
      )
      .option(
        '--min-sample-size <n>',
        'Minimum runs in the post-filter window before emitting a real verdict; below this, status=unknown. Default 5. Phase 32.D / D-A-34.',
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
        let pass = options.thresholdPass !== undefined ? Number(options.thresholdPass) : undefined;
        let review =
          options.thresholdReview !== undefined ? Number(options.thresholdReview) : undefined;
        let since = options.since;
        let minSampleSize: number | undefined =
          options.minSampleSize !== undefined ? Number(options.minSampleSize) : undefined;
        if (
          (pass === undefined ||
            review === undefined ||
            since === undefined ||
            minSampleSize === undefined) &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'harness_green_main',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['threshold_pct'] as
            { pass?: number; review?: number } | undefined;
          if (fromPack !== undefined) {
            if (pass === undefined && typeof fromPack.pass === 'number') pass = fromPack.pass;
            if (review === undefined && typeof fromPack.review === 'number')
              review = fromPack.review;
          }
          if (since === undefined && typeof resolved?.params['since'] === 'string') {
            since = resolved.params['since'] as string;
          }
          if (
            minSampleSize === undefined &&
            typeof resolved?.params['min_sample_size'] === 'number'
          ) {
            minSampleSize = resolved.params['min_sample_size'] as number;
          }
        }
        const thresholds =
          pass !== undefined && review !== undefined ? { pass, review } : undefined;
        const reading = senseHarnessGreenMain({
          repoRoot,
          ...(options.branch !== undefined && { branch: options.branch }),
          ...(options.limit !== undefined && { limit: Number(options.limit) }),
          ...(thresholds !== undefined && { thresholds }),
          ...(since !== undefined && { since }),
          ...(minSampleSize !== undefined && { minSampleSize }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
