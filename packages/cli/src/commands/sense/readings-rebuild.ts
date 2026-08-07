import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { buildSensorReading, type SensorFinding, type SensorReading } from '@devai-nyx/sensors';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, persistSensorReading } from './shared.js';

/**
 * Phase 21.E (closes D-A-8): companion to the `--emit-reading`
 * default on the seven L0 sense commands. Walks
 * `<repoRoot>/.devai/state/sensors/<verb>/` body files and
 * synthesizes a minimal `SensorReading` for each, writing it to
 * `<repoRoot>/.devai/state/sensor-readings/<sensor-kind>/<id>.json`.
 *
 * Use case: adopters who ran the seven sensors pre-21.E now have
 * body files but no `SensorReading` records. Re-running the
 * sensors would refresh both, but for adopters who don't want to
 * incur the static-walk cost again, this aggregator backfills
 * the readings from the existing bodies.
 *
 * Limitations: the synthesized readings carry only `status: 'pass'`
 * + a body_path-like `evidence_path` pointer + the canonical
 * kind/name fields. They don't reconstruct the original sensor's
 * findings or metrics — that information is lost when the sensor
 * exits. The synthesized reading is sufficient for the scorecard
 * to attribute coverage to the sensor; it isn't a substitute for
 * a fresh sensor run when the sensor's findings matter.
 */

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
}

const SENSOR_KINDS: ReadonlyArray<{
  readonly subdir: string;
  readonly kind: string;
  readonly name: string;
}> = [
  { subdir: 'inventory_api', kind: 'inventory_api', name: 'inventory:api' },
  { subdir: 'inventory_routes', kind: 'inventory_routes', name: 'inventory:routes' },
  { subdir: 'inventory_data_model', kind: 'inventory_data_model', name: 'inventory:data-model' },
  {
    subdir: 'inventory_data_handling',
    kind: 'inventory_data_handling',
    name: 'inventory:data-handling',
  },
  { subdir: 'inventory_rbac', kind: 'inventory_rbac', name: 'inventory:rbac' },
  { subdir: 'inventory_dep_graph', kind: 'inventory_dep_graph', name: 'inventory:dep-graph' },
  { subdir: 'inventory_coverage', kind: 'inventory_coverage', name: 'inventory:coverage' },
];

export interface RebuildEntry {
  readonly kind: string;
  readonly body_path: string;
  readonly reading_path: string;
  readonly action: 'created' | 'skipped-exists';
}

export interface RebuildReport {
  readonly ok: boolean;
  readonly repo_root: string;
  readonly entries: readonly RebuildEntry[];
  readonly skipped: number;
  readonly created: number;
  readonly errors: readonly string[];
}

export interface RebuildSensorReadingsResult {
  readonly report: RebuildReport;
  readonly reading: SensorReading;
}

function synthesizeReading(
  spec: (typeof SENSOR_KINDS)[number],
  bodyAbsPath: string,
  bodyRelPath: string,
): { id: string; reading: unknown } {
  const idSeed = createHash('sha256')
    .update(`${spec.kind}::${bodyRelPath}::rebuild`)
    .digest('hex')
    .slice(0, 16);
  const id = `SR-${idSeed}`;
  const command = `devai sense readings rebuild --repo-root . (synthesized from ${bodyRelPath})`;
  const command_hash = createHash('sha256').update(command).digest('hex');
  const timestamp = new Date().toISOString();
  const reading = {
    schemaVersion: '1.0.0',
    id,
    sensor: { name: spec.name, kind: spec.kind, version: '1.0.0' },
    timestamp,
    status: 'pass',
    deterministic: true,
    command,
    command_hash,
    tier: 'L0',
    evidence_path: bodyAbsPath,
    findings: [
      {
        severity: 'info',
        code: 'REBUILT_FROM_BODY',
        message:
          'SensorReading synthesized post-hoc from an existing body file by `devai sense readings rebuild` (Phase 21.E). Findings + metrics from the original sensor run are not preserved.',
      },
    ],
  };
  return { id, reading };
}

/** Direct in-process adapter used by both the retired wrapper and `sense record --rebuild`. */
export function rebuildSensorReadings(repoRoot: string): RebuildSensorReadingsResult {
  const entries: RebuildEntry[] = [];
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;
  for (const spec of SENSOR_KINDS) {
    const bodyDir = join(repoRoot, '.devai/state/sensors', spec.subdir);
    if (!existsSync(bodyDir)) continue;
    let bodyFiles: readonly string[];
    try {
      bodyFiles = readdirSync(bodyDir)
        .filter((name) => name.endsWith('.json'))
        .sort();
    } catch (error) {
      errors.push(
        `read ${bodyDir} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const outDir = join(repoRoot, '.devai/state/sensor-readings', spec.kind);
    mkdirSync(outDir, { recursive: true });
    for (const file of bodyFiles) {
      const bodyAbsPath = join(bodyDir, file);
      const bodyRelPath = join('.devai/state/sensors', spec.subdir, file);
      try {
        JSON.parse(readFileSync(bodyAbsPath, 'utf8'));
      } catch (error) {
        errors.push(
          `parse ${bodyRelPath} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const { id, reading } = synthesizeReading(spec, bodyAbsPath, bodyRelPath);
      const target = join(outDir, `${id}.json`);
      if (existsSync(target)) {
        entries.push({
          kind: spec.kind,
          body_path: bodyRelPath,
          reading_path: target,
          action: 'skipped-exists',
        });
        skipped += 1;
        continue;
      }
      try {
        writeFileSync(target, `${JSON.stringify(reading, null, 2)}\n`);
        entries.push({
          kind: spec.kind,
          body_path: bodyRelPath,
          reading_path: target,
          action: 'created',
        });
        created += 1;
      } catch (error) {
        errors.push(
          `write ${target} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const report: RebuildReport = {
    ok: errors.length === 0,
    repo_root: repoRoot,
    entries,
    created,
    skipped,
    errors,
  };
  const kindsTouched = new Set(entries.map((entry) => entry.kind)).size;
  let status: 'pass' | 'review' | 'fail';
  const findings: SensorFinding[] = [];
  if (errors.length > 0) {
    status = 'fail';
    for (const error of errors.slice(0, 5)) {
      findings.push({
        severity: 'error',
        code: 'READINGS_REBUILD_ERROR',
        message: error.slice(0, 200),
      });
    }
  } else if (kindsTouched === 0) {
    status = 'review';
    findings.push({
      severity: 'info',
      code: 'INVENTORY_REGENERATION_NO_KINDS_TOUCHED',
      message: 'No inventory bodies were found; nothing was rebuilt.',
    });
  } else {
    status = 'pass';
  }
  const reading = buildSensorReading({
    sensorName: 'sense-readings-rebuild',
    sensorKind: 'inventory_regeneration',
    command: ['devai', 'sense', 'record', '--rebuild'],
    status,
    deterministic: true,
    tier: 'L0',
    findings,
    metrics: {
      kinds_touched: kindsTouched,
      kinds_rebuilt: created,
      kinds_up_to_date: skipped,
      error_count: errors.length,
    },
    forceUniqueId: true,
  });
  persistSensorReading(reading, repoRoot);
  return { report, reading };
}

export const senseReadingsRebuildCmd = defineCommand({
  name: 'sense readings-rebuild',
  description:
    'Synthesize SensorReadings from existing .devai/state/sensors/<verb>/ bodies into .devai/state/sensor-readings/ (Phase 21.E).',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-readings-rebuild',
        'Backfill .devai/state/sensor-readings/ from existing sensor body files (Phase 21.E, D-A-8 companion)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const { report } = rebuildSensorReadings(repoRoot);
        if (options.human === true) {
          process.stdout.write(
            `sense readings-rebuild: created=${String(report.created)} skipped=${String(report.skipped)} errors=${String(report.errors.length)}\n`,
          );
          for (const e of report.entries) {
            process.stdout.write(`  [${e.action}] ${e.kind}: ${e.reading_path}\n`);
          }
          for (const err of report.errors) {
            process.stdout.write(`  [error] ${err}\n`);
          }
        } else {
          process.stdout.write(JSON.stringify(report) + '\n');
        }
        process.exit(report.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});
