import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SensorReading } from '@devai-nyx/sensors';
import { computeScorecard, type Scorecard } from '../loop/scorecard.js';
import { filterLatestPerKind } from './latest.js';

export { filterLatestPerKind } from './latest.js';

/**
 * Phase 25.B (closes D-A-26): shared scorecard-input resolver
 * consumed by both `SKILL-compute-scorecard` and `SKILL-assess-state`.
 *
 * Pre-25.B, the two skills resolved inputs via divergent code paths:
 *   - `SKILL-compute-scorecard` read only `ctx.inputs.readings`; when
 *     absent (the canonical `devai agent skill run SKILL-compute-scorecard
 *     --repo-root .` invocation supplies no inputs), it operated on
 *     an empty array → 44 UNKNOWN + 1 N/A cells.
 *   - `SKILL-assess-state` (post-Phase-23.I) read
 *     `ctx.inputs.scorecard` first, then fell back to loading
 *     readings from `.devai/state/sensor-readings/<kind>/<id>.json`
 *     via the disk walker (Phase 21.E persistence + 23.G kind-subdir
 *     traversal). Same stynx state → 4 PASS + 3 REVIEW + 37 UNKNOWN
 *     + 1 N/A cells.
 *
 * The two distributions were both correct *given their respective
 * inputs* but adopters running both skills back-to-back saw two
 * answers to the same question, which is confusing and undermines
 * the report-vs-assessment contract.
 *
 * `resolveScorecardInputs` is the single canonical resolver. Both
 * skills call it. Precedence:
 *   1. `inputs.scorecard` if pre-populated → return as-is (caller
 *      supplied a fully-computed scorecard).
 *   2. `inputs.readings` if pre-populated → compute scorecard from
 *      it (caller supplied raw readings).
 *   3. Disk fallback: walk `<repoRoot>/.devai/state/sensor-readings/`
 *      (or `inputs.readings_dir` override) one level deep into
 *      `<kind>/<id>.json` subdirectories.
 *
 * The per-cell classifier (`mapSensorToCell`) lives in
 * `loop/scorecard.ts` and is consumed identically by both skills via
 * `computeScorecard` — the divergence was solely in the inputs
 * layer, not the classifier itself. This module makes the input
 * resolution shared so the alignment between the two skills is
 * auditable from a single file.
 *
 * Non-unification (D-73): the two skills remain separate.
 * `SKILL-compute-scorecard` emits the canonical `scorecard.json`
 * artifact; `SKILL-assess-state` emits a narrative + per-cell
 * signals + backlog actions *against* the scorecard. They read
 * the same inputs and produce different downstream evidence.
 */
export interface ScorecardInputs {
  readonly repoRoot: string;
  readonly inputs: Readonly<Record<string, unknown>> | undefined;
  readonly timestamp: string;
  readonly integrationHead?: string;
}

export interface ResolvedScorecardInputs {
  readonly scorecard: Scorecard;
  readonly readings: readonly SensorReading[];
  /**
   * Where the readings came from. `'inputs'` = caller pre-populated
   * `inputs.readings` or `inputs.scorecard`; `'disk'` = the disk
   * walker found readings under `.devai/state/sensor-readings/`;
   * `'empty'` = nothing on disk + no inputs supplied.
   */
  readonly source: 'inputs' | 'disk' | 'empty';
}

const DEFAULT_INTEGRATION_HEAD = '0'.repeat(39) + 'f';

export function resolveScorecardInputs(opts: ScorecardInputs): ResolvedScorecardInputs {
  const inputs = opts.inputs ?? {};
  const integrationHead = opts.integrationHead ?? DEFAULT_INTEGRATION_HEAD;

  // (1) Caller supplied a fully-computed scorecard.
  const preComputed = inputs['scorecard'] as Scorecard | undefined;
  if (preComputed !== undefined) {
    const preReadings = filterLatestPerKind(
      (inputs['readings'] as readonly SensorReading[] | undefined) ?? [],
    );
    return { scorecard: preComputed, readings: preReadings, source: 'inputs' };
  }

  // (2) Caller supplied raw readings.
  const suppliedReadings = inputs['readings'] as readonly SensorReading[] | undefined;
  if (suppliedReadings !== undefined && suppliedReadings.length > 0) {
    const preReadings = filterLatestPerKind(suppliedReadings);
    const scorecard = computeScorecard({
      timestamp: opts.timestamp,
      integrationHead,
      readings: preReadings,
    });
    return { scorecard, readings: preReadings, source: 'inputs' };
  }

  // (3) Disk fallback.
  const readingsDir =
    (inputs['readings_dir'] as string | undefined) ??
    join(opts.repoRoot, '.devai/state/sensor-readings');
  const readings = loadReadingsFromDir(readingsDir);
  const scorecard = computeScorecard({
    timestamp: opts.timestamp,
    integrationHead,
    readings,
  });
  return { scorecard, readings, source: readings.length > 0 ? 'disk' : 'empty' };
}

/**
 * Phase 25.B: extracted from the predecessor's skills implementation,
 * where it lived as a private helper. Walks `<dir>` for
 * `*.json` and one level into `<dir>/<kind>/*.json` subdirectories
 * — the canonical shape `persistSensorReading` writes since 21.E.
 * Both skills now use the same loader.
 *
 * DII-103 supersedes the predecessor's opt-in compaction: the loader
 * always selects current standing per sensor kind before returning
 * readings for any computation subset. Disk evidence remains intact.
 */
export interface LoadReadingsOptions {
  /** Deprecated compatibility input. DII-103 makes this unconditional. */
  readonly latestPerKind?: boolean;
}

export function loadReadingsFromDir(
  dir: string,
  options: LoadReadingsOptions = {},
): SensorReading[] {
  const out: SensorReading[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (entry.endsWith('.json')) {
      try {
        const parsed = JSON.parse(readFileSync(full, 'utf8')) as unknown;
        if (Array.isArray(parsed)) {
          for (const r of parsed) out.push(r as SensorReading);
        } else {
          out.push(parsed as SensorReading);
        }
      } catch {
        // skip unparseable
      }
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) continue;
    for (const childName of readdirSync(full).sort()) {
      if (!childName.endsWith('.json')) continue;
      try {
        const parsed = JSON.parse(readFileSync(join(full, childName), 'utf8')) as unknown;
        if (Array.isArray(parsed)) {
          for (const r of parsed) out.push(r as SensorReading);
        } else {
          out.push(parsed as SensorReading);
        }
      } catch {
        // skip unparseable
      }
    }
  }
  void options;
  return filterLatestPerKind(out);
}
