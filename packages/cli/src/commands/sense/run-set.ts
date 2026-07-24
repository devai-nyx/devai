import { spawnSync } from '@devai-nyx/authority';
import type { CAC } from 'cac';
import {
  canonicalSha256,
  computeSensorInputDigest,
  evaluateSensorInputIntegrity,
  loadScorecardNaConfig,
  resolveScorecardNaPath,
  scorecardCellsForSensorKind,
  scorecardNaCellSet,
  type SensorInputRegistry,
  type SensorInputSpec,
} from '#core-compat';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validators } from '@devai-nyx/schemas';
import type { SensorReading } from '@devai-nyx/sensors';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { resolveCliVersion } from '../../version.js';

type SensorSet = 'baseline' | 'tier1' | 'tier2' | 'tier3' | 'all';

type ReadinessStatus = 'pass' | 'review' | 'fail' | 'unknown' | 'na';
type StructuredStatus = Exclude<ReadinessStatus, 'na'> | 'skipped' | 'error' | 'killed';
type AggregateCountStatus = ReadinessStatus | 'error';

export interface SensorRunChildResult {
  readonly command: string;
  readonly processStatus: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly na?: boolean;
}

export interface SensorRunAggregate {
  readonly execution_status: 'pass' | 'error';
  readonly readiness_status: ReadinessStatus;
  readonly applicable_count: number;
  readonly na_count: number;
  readonly counts: Readonly<Record<AggregateCountStatus, number>>;
}

interface IncrementalMeasurement {
  readonly command: string;
  readonly kind: string | null;
  readonly eligible: boolean;
  readonly would_skip: boolean;
  readonly reason?: 'no_input_spec' | 'baseline_missing' | 'input_changed' | 'input_unchanged';
  readonly input_digest_sha256?: string;
  readonly subject?: ReturnType<typeof computeSensorInputDigest>['subject'];
  readonly observed_duration_ms?: number;
}

interface IncrementalBaselineReport {
  readonly measurements?: readonly IncrementalMeasurement[];
}

interface TimingReport {
  readonly results?: readonly { readonly command?: unknown; readonly stdout?: unknown }[];
}

interface IncrementalOptions {
  readonly set?: string;
  readonly repoRoot?: string;
  readonly dryRun?: boolean;
  readonly human?: boolean;
  readonly incremental?: boolean;
  readonly sensorInputs?: string;
  readonly baselineReport?: string;
  readonly timingsReport?: string;
}

const STRUCTURED_STATUSES = new Set([
  'pass',
  'review',
  'fail',
  'unknown',
  'skipped',
  'error',
  'killed',
]);

function parseStructuredStatus(stdout: string): StructuredStatus | undefined {
  try {
    const parsed: unknown = JSON.parse(stdout.trim());
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
    const status = (parsed as { readonly status?: unknown }).status;
    return typeof status === 'string' && STRUCTURED_STATUSES.has(status)
      ? (status as StructuredStatus)
      : undefined;
  } catch {
    return undefined;
  }
}

function readingIsNa(stdout: string, naCells: ReadonlySet<string>): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return false;
  }
  if (!validators.sensorReading(parsed)) return false;
  const mappings = scorecardCellsForSensorKind((parsed as SensorReading).sensor.kind);
  return (
    mappings.length > 0 &&
    mappings.every((cell) => naCells.has(`${cell.substrate}:${cell.property}`))
  );
}

/**
 * Aggregate sensor readiness independently from whether every child executed.
 *
 * Sensor process exit codes intentionally overlap readiness states (for example,
 * REVIEW exits 1 and FAIL exits 2), so the structured SensorReading is the
 * readiness authority. Missing/malformed readings and operational statuses are
 * execution errors; they cannot be translated into readiness FAIL.
 */
export function aggregateSensorRunResults(
  children: readonly SensorRunChildResult[],
): SensorRunAggregate {
  const counts: Record<AggregateCountStatus, number> = {
    pass: 0,
    review: 0,
    fail: 0,
    unknown: 0,
    na: 0,
    error: 0,
  };
  let executionError = false;

  for (const child of children) {
    if (child.processStatus === null) {
      counts['error'] += 1;
      executionError = true;
      continue;
    }

    const status = parseStructuredStatus(child.stdout);
    if (status === undefined || status === 'error' || status === 'killed') {
      counts['error'] += 1;
      executionError = true;
      continue;
    }

    if (child.na === true) {
      counts['na'] += 1;
      continue;
    }

    if (
      (status === 'pass' || status === 'unknown' || status === 'skipped') &&
      child.processStatus !== EXIT_PASS
    ) {
      counts['error'] += 1;
      executionError = true;
    }

    if (status === 'skipped') {
      counts['na'] += 1;
      continue;
    }

    counts[status] += 1;
  }

  const applicableCount = counts['pass'] + counts['review'] + counts['fail'] + counts['unknown'];
  let readinessStatus: ReadinessStatus;
  if (applicableCount === 0) readinessStatus = counts['na'] > 0 ? 'na' : 'unknown';
  else if (counts['fail'] > 0) readinessStatus = 'fail';
  else if (counts['review'] > 0) readinessStatus = 'review';
  else if (counts['unknown'] > 0) readinessStatus = 'unknown';
  else readinessStatus = 'pass';

  return {
    execution_status: executionError ? 'error' : 'pass',
    readiness_status: readinessStatus,
    applicable_count: applicableCount,
    na_count: counts['na'],
    counts,
  };
}

const BASELINE: readonly (readonly string[])[] = [
  ['sense', 'build'],
  ['sense', 'lint'],
  ['sense', 'type', 'check'],
  ['sense', 'test', 'unit'],
];

const TIER2_ADDITIONS: readonly (readonly string[])[] = [
  ['sense', 'inventory', 'api'],
  ['sense', 'inventory', 'routes'],
  ['sense', 'inventory', 'data', 'model'],
  ['sense', 'inventory', 'rbac'],
  ['sense', 'inventory', 'data', 'handling'],
  ['sense', 'inventory', 'dep', 'graph'],
  ['sense', 'spec', 'depth'],
  ['sense', 'spec', 'alignment'],
];

const TIER3_ADDITIONS: readonly (readonly string[])[] = [
  ['sense', 'spec', 'freshness'],
  ['sense', 'spec', 'idiomaticity'],
  ['sense', 'test', 'invariant', 'alignment'],
  ['sense', 'harness', 'coverage'],
  ['sense', 'harness', 'depth'],
  ['sense', 'harness', 'coherence'],
  ['sense', 'harness', 'invariant', 'alignment'],
  ['sense', 'docs', 'drift'],
];

export function expandSensorSet(set: SensorSet): readonly (readonly string[])[] {
  if (set === 'baseline' || set === 'tier1') return BASELINE;
  if (set === 'tier2') return [...BASELINE, ...TIER2_ADDITIONS];
  return [...BASELINE, ...TIER2_ADDITIONS, ...TIER3_ADDITIONS];
}

const COMMAND_KINDS: Readonly<Record<string, string>> = {
  'sense build': 'build',
  'sense lint': 'lint',
  'sense type check': 'type_check',
  'sense inventory api': 'inventory_api',
  'sense inventory routes': 'inventory_routes',
  'sense inventory data model': 'inventory_data_model',
  'sense inventory rbac': 'inventory_rbac',
  'sense inventory data handling': 'inventory_data_handling',
  'sense inventory dep graph': 'inventory_dep_graph',
  'sense spec depth': 'spec_depth',
};

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function resolveSensorInputRegistryPath(repoRoot: string, requested?: string): string {
  if (requested !== undefined) return resolve(repoRoot, requested);
  const architectSource = join(repoRoot, 'law/policy/sensor-inputs.json');
  if (existsSync(architectSource)) return architectSource;
  return join(repoRoot, '.devai/config/sensor-inputs.json');
}

function loadSensorInputRegistry(path: string): SensorInputRegistry {
  const parsed = loadJson(path);
  if (!validators.sensorInputSpec(parsed)) {
    throw new Error(
      `sensor input registry failed sensor-input-spec.schema.json validation: ${JSON.stringify(validators.sensorInputSpec.errors)}`,
    );
  }
  return parsed as SensorInputRegistry;
}

function resolveToolVersion(repoRoot: string, name: string): string {
  const packagePath = join(repoRoot, 'node_modules', ...name.split('/'), 'package.json');
  if (!existsSync(packagePath)) throw new Error(`sensor input tool version is unresolved: ${name}`);
  const parsed = loadJson(packagePath) as { readonly version?: unknown };
  if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
    throw new Error(`sensor input tool package has no version: ${name}`);
  }
  return parsed.version;
}

function digestContext(repoRoot: string, command: string, spec: SensorInputSpec) {
  return {
    sensor_version: resolveCliVersion(),
    command_hash: canonicalSha256({ command }),
    tool_versions: Object.fromEntries(
      spec.tool_inputs.map((name) => [name, resolveToolVersion(repoRoot, name)]),
    ),
    env_values: Object.fromEntries(
      spec.env_inputs.map((name) => [name, process.env[name] ?? '<unset>']),
    ),
  };
}

function loadBaseline(path?: string): ReadonlyMap<string, IncrementalMeasurement> {
  if (path === undefined) return new Map();
  const parsed = loadJson(path) as IncrementalBaselineReport;
  return new Map((parsed.measurements ?? []).map((item) => [item.command, item]));
}

function loadTimings(path?: string): ReadonlyMap<string, number> {
  if (path === undefined) return new Map();
  const parsed = loadJson(path) as TimingReport;
  const timings = new Map<string, number>();
  for (const result of parsed.results ?? []) {
    if (typeof result.command !== 'string' || typeof result.stdout !== 'string') continue;
    let reading: unknown;
    try {
      reading = JSON.parse(result.stdout);
    } catch {
      continue;
    }
    if (typeof reading !== 'object' || reading === null || Array.isArray(reading)) continue;
    const duration = (reading as { readonly duration_ms?: unknown }).duration_ms;
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) continue;
    timings.set(result.command.replace(/^devai /u, ''), duration);
  }
  return timings;
}

function incrementalDryRun(
  set: SensorSet,
  commands: readonly (readonly string[])[],
  options: IncrementalOptions,
): { readonly status: number; readonly output: unknown; readonly human: string } {
  const started = Date.now();
  const repoRoot = resolve(options.repoRoot ?? '.');
  const registryPath = resolveSensorInputRegistryPath(repoRoot, options.sensorInputs);
  const registry = loadSensorInputRegistry(registryPath);
  const integrity = evaluateSensorInputIntegrity(repoRoot, registry);
  if (!integrity.ok) {
    return {
      status: EXIT_FAIL,
      output: { ok: false, dry_run: true, incremental: true, set, integrity },
      human: `devai sense run (${set}) incremental: input integrity FAIL (${String(integrity.issues.length)} issue(s))`,
    };
  }
  const specs = new Map(registry.specs.map((spec) => [spec.kind, spec]));
  const baseline = loadBaseline(options.baselineReport);
  const timings = loadTimings(options.timingsReport);
  const measurements: IncrementalMeasurement[] = commands.map((argv) => {
    const command = argv.join(' ');
    const kind = COMMAND_KINDS[command] ?? null;
    const spec = kind === null ? undefined : specs.get(kind);
    if (kind === null || spec === undefined) {
      return {
        command,
        kind,
        eligible: false,
        would_skip: false,
        reason: 'no_input_spec',
        ...(timings.has(command) && { observed_duration_ms: timings.get(command) }),
      };
    }
    const digest = computeSensorInputDigest(repoRoot, spec, digestContext(repoRoot, command, spec));
    const previous = baseline.get(command);
    const unchanged = previous?.input_digest_sha256 === digest.input_digest_sha256;
    return {
      command,
      kind,
      eligible: true,
      would_skip: unchanged,
      reason:
        previous === undefined
          ? 'baseline_missing'
          : unchanged
            ? 'input_unchanged'
            : 'input_changed',
      input_digest_sha256: digest.input_digest_sha256,
      subject: digest.subject,
      ...(timings.has(command) && { observed_duration_ms: timings.get(command) }),
    };
  });
  const durationFor = (predicate: (item: IncrementalMeasurement) => boolean): number =>
    measurements.filter(predicate).reduce((sum, item) => sum + (item.observed_duration_ms ?? 0), 0);
  const eligible = measurements.filter((item) => item.eligible);
  const skipped = eligible.filter((item) => item.would_skip);
  const observedSensorMs = durationFor((item) => item.eligible);
  const observedTestMs = durationFor((item) => item.command.startsWith('sense test '));
  const observedOtherMs = durationFor(
    (item) => !item.eligible && !item.command.startsWith('sense test '),
  );
  const estimatedSavedMs = durationFor((item) => item.eligible && item.would_skip);
  const summary = {
    total_commands: measurements.length,
    eligible_commands: eligible.length,
    would_skip: skipped.length,
    would_run: measurements.length - skipped.length,
    observed_sensor_duration_ms: observedSensorMs,
    observed_test_duration_ms: observedTestMs,
    observed_other_duration_ms: observedOtherMs,
    estimated_saved_sensor_ms: estimatedSavedMs,
    estimated_sensor_reduction_percent:
      observedSensorMs === 0
        ? null
        : Number(((estimatedSavedMs / observedSensorMs) * 100).toFixed(2)),
    digest_computation_ms: Date.now() - started,
  };
  return {
    status: EXIT_PASS,
    output: {
      ok: true,
      dry_run: true,
      incremental: true,
      report_only: true,
      set,
      registry: registryPath,
      integrity,
      commands: commands.map((command) => command.join(' ')),
      measurements,
      summary,
    },
    human: `devai sense run (${set}) incremental report-only: would skip ${String(summary.would_skip)} of ${String(summary.total_commands)}; estimated sensor saving ${String(summary.estimated_saved_sensor_ms)}ms (${summary.estimated_sensor_reduction_percent === null ? 'unmeasured' : `${String(summary.estimated_sensor_reduction_percent)}%`})`,
  };
}

export const senseRunSetCmd = defineCommand({
  name: 'sense run',
  description:
    'Run a deterministic sensor preset for an adoption tier; --dry-run prints the exact expansion.',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-run', 'Run a deterministic sensor preset')
      .option('--set <name>', 'baseline | tier1 | tier2 | tier3 | all (default: baseline)')
      .option('--repo-root <path>', 'Repository root (default: .)')
      .option('--dry-run', 'Print the expansion without running sensors')
      .option('--incremental', 'R26 report-only input-digest measurement; requires --dry-run')
      .option(
        '--sensor-inputs <path>',
        'Sensor-input registry (default: F1 source, then F5 target)',
      )
      .option('--baseline-report <path>', 'Prior incremental report used only for comparison')
      .option('--timings-report <path>', 'Actual sense-run JSON used only for observed durations')
      .option('--human', 'Human-readable summary')
      .action((options: IncrementalOptions) => {
        const set = options.set ?? 'baseline';
        if (!['baseline', 'tier1', 'tier2', 'tier3', 'all'].includes(set)) {
          process.stderr.write(
            `devai sense run: unknown set '${set}'; expected baseline | tier1 | tier2 | tier3 | all\n`,
          );
          process.exitCode = EXIT_USAGE;
          return;
        }
        const commands = expandSensorSet(set as SensorSet);
        if (options.incremental === true && options.dryRun !== true) {
          process.stderr.write(
            'devai sense run: --incremental is report-only in R26 and requires --dry-run\n',
          );
          process.exitCode = EXIT_USAGE;
          return;
        }
        if (options.incremental === true) {
          try {
            const report = incrementalDryRun(set as SensorSet, commands, options);
            process.stdout.write(
              options.human === true ? `${report.human}\n` : `${JSON.stringify(report.output)}\n`,
            );
            process.exitCode = report.status;
          } catch (error) {
            process.stderr.write(
              `devai sense run incremental: ${error instanceof Error ? error.message : String(error)}\n`,
            );
            process.exitCode = EXIT_FAIL;
          }
          return;
        }
        if (options.dryRun === true) {
          const output = {
            ok: true,
            dry_run: true,
            set,
            commands: commands.map((c) => c.join(' ')),
          };
          process.stdout.write(
            options.human === true
              ? `devai sense run (${set}):\n${commands.map((c) => `  devai ${c.join(' ')}`).join('\n')}\n`
              : `${JSON.stringify(output)}\n`,
          );
          process.exitCode = EXIT_PASS;
          return;
        }

        const repoRoot = options.repoRoot ?? '.';
        const naCells = scorecardNaCellSet(loadScorecardNaConfig(resolveScorecardNaPath(repoRoot)));
        const executable = process.argv[1] ?? '';
        const results = commands.map((command) => {
          const args = [...command, '--repo-root', repoRoot];
          const result = spawnSync(process.execPath, [executable, ...args], {
            encoding: 'utf8',
            env: process.env,
          });
          return {
            command: `devai ${command.join(' ')}`,
            processStatus: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            na: readingIsNa(result.stdout, naCells),
          };
        });
        const aggregate = aggregateSensorRunResults(results);
        const ok = aggregate.execution_status === 'pass' && aggregate.readiness_status === 'pass';
        if (options.human === true) {
          process.stdout.write(
            `devai sense run (${set}): execution=${aggregate.execution_status.toUpperCase()} readiness=${aggregate.readiness_status.toUpperCase()}\n${results
              .map((result) => {
                const status = parseStructuredStatus(result.stdout);
                return `  ${(status ?? 'error').toUpperCase()} ${result.command}`;
              })
              .join('\n')}\n`,
          );
        } else {
          const publicResults = results.map(({ processStatus, ...result }) => ({
            ...result,
            status: processStatus,
          }));
          process.stdout.write(
            `${JSON.stringify({ ok, dry_run: false, set, ...aggregate, results: publicResults })}\n`,
          );
        }
        process.exitCode =
          aggregate.execution_status === 'error' || aggregate.readiness_status === 'fail'
            ? EXIT_FAIL
            : aggregate.readiness_status === 'review'
              ? EXIT_REVIEW
              : EXIT_PASS;
      });
  },
});
