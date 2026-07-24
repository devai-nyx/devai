import { join } from 'node:path';
import type { CAC } from 'cac';
import { normalizeCoverage, resolveSensorParams } from '#core-compat';
import { senseTestCoverageDepth } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly coveragePath?: string;
  readonly thresholdPass?: number;
  readonly thresholdReview?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

const DEFAULT_COVERAGE_PATH = 'coverage/coverage-final.json';

/**
 * `devai sense test coverage depth` — emit a test_coverage_depth
 * SensorReading (Phase 26.F, F3×T2). Loads coverage-final.json and
 * maps `lines_pct` to PASS / REVIEW / FAIL via configurable
 * thresholds (default `{pass:80, review:50}`).
 */
export const senseTestCoverageDepthCmd = defineCommand({
  name: 'sense test-coverage-depth',
  description: 'Read coverage-final.json and emit a test_coverage_depth SensorReading (F3×T2)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-test-coverage-depth', 'Emit a test_coverage_depth SensorReading (F3×T2)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--coverage-path <path>',
        `Override coverage-final.json path (default: ${DEFAULT_COVERAGE_PATH})`,
      )
      .option('--threshold-pass <pct>', 'PASS threshold (default 80)')
      .option('--threshold-review <pct>', 'REVIEW threshold (default 50)')
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
        const coveragePath = options.coveragePath ?? join(repoRoot, DEFAULT_COVERAGE_PATH);

        let pass = options.thresholdPass !== undefined ? Number(options.thresholdPass) : undefined;
        let review =
          options.thresholdReview !== undefined ? Number(options.thresholdReview) : undefined;
        if (
          (pass === undefined || review === undefined) &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'test_coverage',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['thresholds'] as
            { pass?: number; review?: number } | undefined;
          if (fromPack !== undefined) {
            if (pass === undefined && typeof fromPack.pass === 'number') pass = fromPack.pass;
            if (review === undefined && typeof fromPack.review === 'number')
              review = fromPack.review;
          }
        }
        const thresholds =
          pass !== undefined && review !== undefined ? { pass, review } : undefined;

        const result = normalizeCoverage({ coveragePath });
        const summary =
          result.summary !== null
            ? {
                lines_total: result.summary.lines_total,
                lines_covered: result.summary.lines_covered,
              }
            : null;
        const reading = senseTestCoverageDepth({
          summary,
          coveragePath,
          ...(thresholds !== undefined && { thresholds }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
