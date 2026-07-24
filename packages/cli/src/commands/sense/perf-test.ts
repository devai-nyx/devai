import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { sensePerfTest, type PerfTestThresholds } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly scriptName?: string;
  readonly timeoutMs?: number;
  readonly passP50Ms?: number;
  readonly reviewP50Ms?: number;
  readonly passP95Ms?: number;
  readonly reviewP95Ms?: number;
  readonly passThroughputRps?: number;
  readonly reviewThroughputRps?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const sensePerfTestCmd = defineCommand({
  name: 'sense perf-test',
  description:
    'Wrap an adopter-declared perf script and emit a perf_test SensorReading (F2×T7, Phase 30.H / S-2)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-perf-test', 'Emit a perf_test SensorReading (F2×T7)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--script-name <name>', 'package.json script name to invoke (default: test:perf)')
      .option('--timeout-ms <ms>', 'Hard timeout for the perf script (default 600000)')
      .option('--pass-p50-ms <ms>', 'PASS upper bound for p50 latency')
      .option('--review-p50-ms <ms>', 'REVIEW upper bound for p50 latency')
      .option('--pass-p95-ms <ms>', 'PASS upper bound for p95 latency')
      .option('--review-p95-ms <ms>', 'REVIEW upper bound for p95 latency')
      .option('--pass-throughput-rps <rps>', 'PASS lower bound for throughput')
      .option('--review-throughput-rps <rps>', 'REVIEW lower bound for throughput')
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;

        let scriptName = options.scriptName;
        const thresholds: PerfTestThresholds = {};
        const setIfDefined = (k: keyof PerfTestThresholds, v: number | undefined): void => {
          if (v !== undefined) (thresholds as Record<string, number>)[k] = v;
        };
        setIfDefined(
          'pass_p50_ms',
          options.passP50Ms !== undefined ? Number(options.passP50Ms) : undefined,
        );
        setIfDefined(
          'review_p50_ms',
          options.reviewP50Ms !== undefined ? Number(options.reviewP50Ms) : undefined,
        );
        setIfDefined(
          'pass_p95_ms',
          options.passP95Ms !== undefined ? Number(options.passP95Ms) : undefined,
        );
        setIfDefined(
          'review_p95_ms',
          options.reviewP95Ms !== undefined ? Number(options.reviewP95Ms) : undefined,
        );
        setIfDefined(
          'pass_throughput_rps',
          options.passThroughputRps !== undefined ? Number(options.passThroughputRps) : undefined,
        );
        setIfDefined(
          'review_throughput_rps',
          options.reviewThroughputRps !== undefined
            ? Number(options.reviewThroughputRps)
            : undefined,
        );

        if (options.packTune === true || options.packId !== undefined) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'perf_test',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          if (resolved !== null) {
            if (scriptName === undefined && typeof resolved.params['script_name'] === 'string') {
              scriptName = resolved.params['script_name'] as string;
            }
            const packThresh = resolved.params['thresholds'] as Record<string, unknown> | undefined;
            if (packThresh !== undefined) {
              const apply = (k: keyof PerfTestThresholds): void => {
                if (thresholds[k] === undefined && typeof packThresh[k] === 'number') {
                  (thresholds as Record<string, number>)[k] = packThresh[k] as number;
                }
              };
              apply('pass_p50_ms');
              apply('review_p50_ms');
              apply('pass_p95_ms');
              apply('review_p95_ms');
              apply('pass_throughput_rps');
              apply('review_throughput_rps');
            }
          }
        }

        const reading = sensePerfTest({
          repoRoot,
          ...(scriptName !== undefined && { scriptName }),
          ...(options.timeoutMs !== undefined && { timeoutMs: Number(options.timeoutMs) }),
          ...(Object.keys(thresholds).length > 0 && { thresholds }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
