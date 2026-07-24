import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import {
  listReleases,
  runPostdeployVerify,
  runPostdeployVerifyFromCharter,
  runReleaseGate,
  runRuntimeDrift,
  runRuntimeDriftFromCharter,
} from '#core-compat';
import { executeRuntimeProbe, type RuntimeProbeCharter } from '@devai-nyx/sensors';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();
const KNOWN_ENVS = ['dev', 'staging', 'stage', 'prod', 'preview', 'other'] as const;

function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  else process.stdout.write(JSON.stringify(json) + '\n');
}

interface GateOptions {
  readonly repoRoot?: string;
  readonly scorecard?: string;
  readonly readingsDir?: string;
  readonly invariantsDir?: string;
  readonly artifact?: string;
  readonly environment?: string;
  readonly auditChainHead?: string;
  readonly human?: boolean;
  readonly strict?: boolean;
}

export const releaseGate = defineCommand({
  name: 'release gate',
  description:
    'Compute a deploy-gate decision from scorecard + sensor evidence + invariant state. Persists under .devai/state/releases/REL-NNNN.json. Per Phase 11.B (D-39).',
  authority: 'release_controller',
  register(cli: CAC): void {
    cli
      .command('release-gate', 'Compute a deploy-gate decision')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--scorecard <path>', 'Scorecard JSON to consume')
      .option(
        '--readings-dir <path>',
        'Directory of SensorReading records (default: .devai/state/sensor-readings)',
      )
      .option('--invariants-dir <path>', 'Invariant catalog directory (default: law/invariants)')
      .option('--artifact <ref>', 'Artifact-of-record (digest / tag / image)')
      .option('--environment <kind>', `Target environment. One of: ${KNOWN_ENVS.join(', ')}`)
      .option('--audit-chain-head <sha>', 'Audit chain head (sha-256) at gate time')
      .option('--strict', 'Exit non-zero on verdict != pass (default: always exit 0)')
      .option('--human', 'Human-readable output')
      .action((options: GateOptions) => {
        if (
          options.environment !== undefined &&
          !KNOWN_ENVS.includes(options.environment as never)
        ) {
          process.stderr.write(
            `devai release gate: --environment must be one of ${KNOWN_ENVS.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const invariantsDir = options.invariantsDir ?? join(repoRoot, 'law/invariants');
          const readingsDir = options.readingsDir ?? join(repoRoot, '.devai/state/sensor-readings');
          const record = runReleaseGate({
            repoRoot,
            ...(options.scorecard !== undefined && { scorecardRef: options.scorecard }),
            sensorReadingsDir: readingsDir,
            invariantsDir,
            ...(options.artifact !== undefined && { artifactRef: options.artifact }),
            ...(options.environment !== undefined && {
              environment: options.environment as
                'dev' | 'staging' | 'stage' | 'prod' | 'preview' | 'other',
            }),
            ...(options.auditChainHead !== undefined && { auditChainHead: options.auditChainHead }),
          });
          emit(
            record,
            options.human === true,
            `release gate: ${record.id} → ${record.verdict}` +
              (record.reasons !== undefined && record.reasons.length > 0
                ? '\n  reasons:\n' + record.reasons.map((r) => `    - ${r}`).join('\n')
                : ''),
          );
          process.exitCode =
            options.strict === true && record.verdict !== 'pass' ? EXIT_FAIL : EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai release gate: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

interface PostdeployOptions {
  readonly repoRoot?: string;
  readonly artifact?: string;
  readonly artifactChainHead?: string;
  readonly auditChainHead?: string;
  readonly runtimeCharter?: string;
  readonly environment?: string;
  readonly strict?: boolean;
  readonly human?: boolean;
}

function loadAndValidateCharter(
  path: string,
  expectKind: RuntimeProbeCharter['kind'],
): RuntimeProbeCharter {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const ok = validators.runtimeCharter(parsed);
  if (!ok) {
    throw new Error(
      `charter failed runtime-charter.schema.json validation: ${JSON.stringify(validators.runtimeCharter.errors)}`,
    );
  }
  const charter = parsed as RuntimeProbeCharter;
  if (charter.kind !== expectKind) {
    throw new Error(
      `charter kind '${charter.kind}' does not match expected '${expectKind}' for this verb`,
    );
  }
  return charter;
}

export const releasePostdeployVerify = defineCommand({
  name: 'release postdeploy-verify',
  description:
    'Verify the deployed runtime matches the artifact-of-record. Either record form (operator supplies --artifact-chain-head + --audit-chain-head) or detector form (operator supplies --runtime-charter <path> to an api-kind charter that probes the deployed runtime; charter pass → release pass, any fail/error → block + rollback_recommended).',
  authority: 'release_controller',
  register(cli: CAC): void {
    cli
      .command('release-postdeploy-verify', 'Post-deploy audit-chain match verification')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--artifact <ref>', 'Artifact-of-record (required)')
      .option(
        '--artifact-chain-head <sha>',
        'sha-256 chain head baked into the artifact (required in record mode)',
      )
      .option(
        '--audit-chain-head <sha>',
        'sha-256 chain head observed in the deployed runtime (required in record mode)',
      )
      .option(
        '--runtime-charter <path>',
        'Path to an api-kind runtime-charter.schema.json file; executes the charter against the deployed runtime and derives the verdict from the probe outcomes (detector form). Mutually exclusive with --audit-chain-head.',
      )
      .option('--environment <kind>', `Target environment. One of: ${KNOWN_ENVS.join(', ')}`)
      .option('--strict', 'Exit non-zero on mismatch (default: always exit 0)')
      .option('--human', 'Human-readable output')
      .action(async (options: PostdeployOptions) => {
        if (options.artifact === undefined) {
          process.stderr.write('devai release postdeploy verify: --artifact is required\n');
          process.exit(EXIT_USAGE);
        }
        if (
          options.environment !== undefined &&
          !KNOWN_ENVS.includes(options.environment as never)
        ) {
          process.stderr.write(
            `devai release postdeploy verify: --environment must be one of ${KNOWN_ENVS.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const isDetector = options.runtimeCharter !== undefined;
        const isRecord = options.auditChainHead !== undefined;
        if (isDetector && isRecord) {
          process.stderr.write(
            'devai release postdeploy verify: --runtime-charter and --audit-chain-head are mutually exclusive\n',
          );
          process.exit(EXIT_USAGE);
        }
        if (!isDetector && !isRecord) {
          process.stderr.write(
            'devai release postdeploy verify: either --runtime-charter (detector) or --audit-chain-head (record) is required\n',
          );
          process.exit(EXIT_USAGE);
        }
        if (isRecord && options.artifactChainHead === undefined) {
          process.stderr.write(
            'devai release postdeploy verify: --artifact-chain-head is required in record mode\n',
          );
          process.exit(EXIT_USAGE);
        }
        try {
          let record;
          if (isDetector) {
            const charter = loadAndValidateCharter(options.runtimeCharter as string, 'api');
            const { summary } = await executeRuntimeProbe({ charter });
            record = runPostdeployVerifyFromCharter({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              artifactRef: options.artifact,
              charterPath: options.runtimeCharter as string,
              probeAggregate: {
                summary_verdict: summary.verdict,
                pass: summary.pass,
                fail: summary.fail,
                error: summary.error,
                review: summary.review,
                skipped: summary.skipped,
                findings: summary.outcomes.flatMap((o) =>
                  o.failed_expectations.map((m) => ({
                    code: o.verdict === 'error' ? 'PROBE_ERROR' : 'EXPECT_FAILED',
                    message: `[${o.pid}] ${o.name}: ${m}`,
                  })),
                ),
              },
              ...(options.artifactChainHead !== undefined && {
                artifactChainHead: options.artifactChainHead,
              }),
              ...(options.environment !== undefined && {
                environment: options.environment as
                  'dev' | 'staging' | 'stage' | 'prod' | 'preview' | 'other',
              }),
            });
          } else {
            record = runPostdeployVerify({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              artifactRef: options.artifact,
              artifactChainHead: options.artifactChainHead as string,
              auditChainHead: options.auditChainHead as string,
              ...(options.environment !== undefined && {
                environment: options.environment as
                  'dev' | 'staging' | 'stage' | 'prod' | 'preview' | 'other',
              }),
            });
          }
          emit(
            record,
            options.human === true,
            `release postdeploy-verify: ${record.id} → ${record.verdict}` +
              (record.rollback_recommended === true ? ' (rollback recommended)' : '') +
              (isDetector ? ` (detector: charter=${String(options.runtimeCharter)})` : ''),
          );
          process.exitCode =
            options.strict === true && record.verdict !== 'pass' ? EXIT_FAIL : EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai release postdeploy verify: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

interface DriftOptions {
  readonly repoRoot?: string;
  readonly observation?: string | string[];
  readonly runtimeCharter?: string;
  readonly artifact?: string;
  readonly environment?: string;
  readonly strict?: boolean;
  readonly human?: boolean;
}

function asArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

export const releaseRuntimeDrift = defineCommand({
  name: 'release runtime-drift',
  description:
    'Detect or record runtime drift. Either record form (operator supplies --observation surface=delta pairs) or detector form (operator supplies --runtime-charter <path> to an api/auth charter; each failed/errored probe is translated into a drift observation).',
  authority: 'release_controller',
  register(cli: CAC): void {
    cli
      .command('release-runtime-drift', 'Detect or record runtime drift observations')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--observation <surface=delta>',
        'Drift observation in the form "surface=delta" (repeatable; record form)',
      )
      .option(
        '--runtime-charter <path>',
        'Path to an api or auth runtime-charter.schema.json file; executes the charter and translates failed/errored probes into drift observations (detector form). Mutually exclusive with --observation.',
      )
      .option('--artifact <ref>', 'Artifact-of-record')
      .option('--environment <kind>', `Target environment. One of: ${KNOWN_ENVS.join(', ')}`)
      .option('--strict', 'Exit non-zero when any observation present (default: always exit 0)')
      .option('--human', 'Human-readable output')
      .action(async (options: DriftOptions) => {
        if (
          options.environment !== undefined &&
          !KNOWN_ENVS.includes(options.environment as never)
        ) {
          process.stderr.write(
            `devai release runtime drift: --environment must be one of ${KNOWN_ENVS.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const observations = asArray(options.observation);
        const isDetector = options.runtimeCharter !== undefined;
        const isRecord = observations.length > 0;
        if (isDetector && isRecord) {
          process.stderr.write(
            'devai release runtime drift: --runtime-charter and --observation are mutually exclusive\n',
          );
          process.exit(EXIT_USAGE);
        }
        try {
          let record;
          if (isDetector) {
            // Detector path: run the charter, translate failed probes.
            // Accept either api or auth kind (data-kind drift would be a
            // separate concern: schema integrity, not behavioural drift).
            const charterPath = options.runtimeCharter as string;
            const raw = readFileSync(charterPath, 'utf8');
            const parsed = JSON.parse(raw) as unknown;
            const ok = validators.runtimeCharter(parsed);
            if (!ok) {
              throw new Error(
                `charter failed runtime-charter.schema.json validation: ${JSON.stringify(validators.runtimeCharter.errors)}`,
              );
            }
            const charter = parsed as RuntimeProbeCharter;
            if (charter.kind !== 'api' && charter.kind !== 'auth') {
              throw new Error(
                `runtime-drift charter kind must be api or auth; got '${charter.kind}'`,
              );
            }
            const { summary } = await executeRuntimeProbe({ charter });
            record = runRuntimeDriftFromCharter({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              charterPath,
              outcomes: summary.outcomes.map((o) => ({
                pid: o.pid,
                name: o.name,
                verdict: o.verdict,
                failed_expectations: o.failed_expectations,
              })),
              ...(options.artifact !== undefined && { artifactRef: options.artifact }),
              ...(options.environment !== undefined && {
                environment: options.environment as
                  'dev' | 'staging' | 'stage' | 'prod' | 'preview' | 'other',
              }),
            });
          } else {
            const parsedObservations = observations.map((s) => {
              const eq = s.indexOf('=');
              if (eq <= 0) {
                throw new Error(`--observation expects 'surface=delta' (got '${s}')`);
              }
              return { surface: s.slice(0, eq), delta: s.slice(eq + 1) };
            });
            record = runRuntimeDrift({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              observations: parsedObservations,
              ...(options.artifact !== undefined && { artifactRef: options.artifact }),
              ...(options.environment !== undefined && {
                environment: options.environment as
                  'dev' | 'staging' | 'stage' | 'prod' | 'preview' | 'other',
              }),
            });
          }
          const obsCount = record.drift_observations?.length ?? 0;
          emit(
            record,
            options.human === true,
            `release runtime-drift: ${record.id} → ${record.verdict} (${String(obsCount)} observation(s)` +
              (isDetector ? `, detector: charter=${String(options.runtimeCharter)})` : ')'),
          );
          process.exitCode =
            options.strict === true && record.verdict !== 'pass' ? EXIT_FAIL : EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai release runtime drift: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const releaseList = defineCommand({
  name: 'release list',
  description: 'List release-control records under .devai/state/releases/',
  authority: 'release_controller',
  register(cli: CAC): void {
    cli
      .command('release-list', 'List release records')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--kind <kind>', 'Filter by kind (gate | postdeploy-verify | runtime-drift)')
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; kind?: string; human?: boolean }) => {
        try {
          let records = listReleases(options.repoRoot ?? DEFAULT_REPO_ROOT);
          if (options.kind !== undefined) {
            records = records.filter((r) => r.kind === options.kind);
          }
          emit(
            { count: records.length, releases: records },
            options.human === true,
            `release list: ${String(records.length)} record(s)\n` +
              records
                .map(
                  (r) =>
                    `  ${r.id}  ${r.kind.padEnd(20)}  ${r.verdict.padEnd(12)}  ${r.environment ?? '-'}  ${r.decided_at}`,
                )
                .join('\n'),
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai release list: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
