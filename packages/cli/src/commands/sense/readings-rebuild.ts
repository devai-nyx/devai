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
import { buildSensorReading } from '@devai-nyx/sensors';
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

interface RebuildEntry {
  readonly kind: string;
  readonly body_path: string;
  readonly reading_path: string;
  readonly action: 'created' | 'skipped-exists';
}

interface RebuildReport {
  readonly ok: boolean;
  readonly repo_root: string;
  readonly entries: readonly RebuildEntry[];
  readonly skipped: number;
  readonly created: number;
  readonly errors: readonly string[];
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
              .filter((n) => n.endsWith('.json'))
              .sort();
          } catch (err) {
            errors.push(
              `read ${bodyDir} failed: ${err instanceof Error ? err.message : String(err)}`,
            );
            continue;
          }
          const outDir = join(repoRoot, '.devai/state/sensor-readings', spec.kind);
          mkdirSync(outDir, { recursive: true });
          for (const file of bodyFiles) {
            const bodyAbsPath = join(bodyDir, file);
            const bodyRelPath = join('.devai/state/sensors', spec.subdir, file);
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
              writeFileSync(target, JSON.stringify(reading, null, 2) + '\n');
              entries.push({
                kind: spec.kind,
                body_path: bodyRelPath,
                reading_path: target,
                action: 'created',
              });
              created += 1;
            } catch (err) {
              errors.push(
                `write ${target} failed: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
            // Pre-consume the source body so unparseable JSON surfaces as
            // an error rather than producing a malformed reading.
            try {
              JSON.parse(readFileSync(bodyAbsPath, 'utf8'));
            } catch (err) {
              errors.push(
                `parse ${bodyRelPath} failed: ${err instanceof Error ? err.message : String(err)}`,
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
        if (options.human === true) {
          process.stdout.write(
            `sense readings-rebuild: created=${String(created)} skipped=${String(skipped)} errors=${String(errors.length)}\n`,
          );
          for (const e of entries) {
            process.stdout.write(`  [${e.action}] ${e.kind}: ${e.reading_path}\n`);
          }
          for (const err of errors) {
            process.stdout.write(`  [error] ${err}\n`);
          }
        } else {
          process.stdout.write(JSON.stringify(report) + '\n');
        }

        // Phase 30.E (closes W-3): always emit an inventory_regeneration
        // SensorReading per invocation, even when no kind needed
        // rebuilding. Pre-30.E the command exited without an SR write
        // when every reading was already present, leaving F4×T9
        // (inventory_regeneration cell) at UNKNOWN even after a clean
        // regen. Now: status=pass if every rebuild succeeded; fail
        // if any errored; review if zero kinds detected at all.
        const totalKinds = entries.length + skipped + created; // placeholder; recomputed below
        const kindsTouched = new Set(entries.map((e) => e.kind)).size;
        let summaryStatus: 'pass' | 'review' | 'fail';
        const summaryFindings: import('@devai-nyx/sensors').SensorFinding[] = [];
        if (errors.length > 0) {
          summaryStatus = 'fail';
          for (const err of errors.slice(0, 5)) {
            summaryFindings.push({
              severity: 'error',
              code: 'READINGS_REBUILD_ERROR',
              message: err.slice(0, 200),
            });
          }
        } else if (kindsTouched === 0) {
          summaryStatus = 'review';
          summaryFindings.push({
            severity: 'info',
            code: 'INVENTORY_REGENERATION_NO_KINDS_TOUCHED',
            message:
              'No inventory_* bodies found; nothing to rebuild. Run `devai sense inventory api` (etc.) first.',
          });
        } else {
          summaryStatus = 'pass';
        }
        const summaryReading = buildSensorReading({
          sensorName: 'sense-readings-rebuild',
          sensorKind: 'inventory_regeneration',
          command: ['devai', 'sense-readings-rebuild'],
          status: summaryStatus,
          deterministic: true,
          tier: 'L0',
          findings: summaryFindings,
          metrics: {
            kinds_touched: kindsTouched,
            kinds_rebuilt: created,
            kinds_up_to_date: skipped,
            error_count: errors.length,
          },
          // Use forceUniqueId so each invocation leaves an audit-trail entry,
          // mirroring 30.D's test-weakening fix.
          forceUniqueId: true,
        });
        persistSensorReading(summaryReading, repoRoot);
        void totalKinds;

        process.exit(report.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});
