import { sensorCellMap } from '@devai-nyx/sensors';
import type { CellVerdict, Scorecard } from '../loop/scorecard.js';
import { actionToSensorKind } from './action-kind-registry.js';

/**
 * Phase 29.I (closes O-1): per-invariant scorecard rollup.
 *
 * For each invariant: walk `measurable_via[]`, map each action to
 * its sensor kind, map kind to its cell(s) via the same logic
 * `mapSensorToCell` uses, look up each cell's verdict in the
 * scorecard, and emit a worst-wins rollup so invariant authors
 * see which sensor verdicts gate their invariant.
 *
 * The kind→cell mapping is duplicated here rather than imported
 * to avoid a circular dep between `scorecard/` and `loop/scorecard.ts`.
 * A future refactor could relocate the table; for now the inline
 * version matches the canonical map exactly.
 */

export interface PerInvariantRollupGate {
  readonly action: string;
  readonly kind: string | null;
  readonly substrate: string | null;
  readonly property: string | null;
  readonly verdict: CellVerdict;
}

export interface PerInvariantRollup {
  readonly gates: readonly PerInvariantRollupGate[];
  readonly worst_verdict: CellVerdict;
}

export interface InvariantInput {
  readonly id: string;
  readonly measurable_via?: readonly string[];
}

/** Cell reachability comes only from the validated sensor registry. */
const KIND_TO_CELLS = sensorCellMap();

const VERDICT_ORDER: Readonly<Record<CellVerdict, number>> = {
  PASS: 0,
  'N/A': 1,
  UNKNOWN: 2,
  REVIEW: 3,
  FAIL: 4,
};

function worseVerdict(a: CellVerdict, b: CellVerdict): CellVerdict {
  return VERDICT_ORDER[a] >= VERDICT_ORDER[b] ? a : b;
}

export function computePerInvariantRollups(
  scorecard: Pick<Scorecard, 'cells'>,
  invariants: readonly InvariantInput[],
): Record<string, PerInvariantRollup> {
  // Build a quick verdict lookup by `${substrate}:${property}`.
  const verdictBy: Record<string, CellVerdict> = {};
  for (const cell of scorecard.cells) {
    verdictBy[`${cell.substrate}:${cell.property}`] = cell.verdict;
  }

  const out: Record<string, PerInvariantRollup> = {};
  for (const inv of invariants) {
    const actions = inv.measurable_via ?? [];
    const gates: PerInvariantRollupGate[] = [];
    for (const action of actions) {
      const kind = actionToSensorKind(action);
      if (kind === null) {
        gates.push({ action, kind: null, substrate: null, property: null, verdict: 'UNKNOWN' });
        continue;
      }
      const cells = KIND_TO_CELLS[kind] ?? [];
      if (cells.length === 0) {
        gates.push({ action, kind, substrate: null, property: null, verdict: 'UNKNOWN' });
        continue;
      }
      for (const c of cells) {
        const v = verdictBy[`${c.substrate}:${c.property}`] ?? 'UNKNOWN';
        gates.push({ action, kind, substrate: c.substrate, property: c.property, verdict: v });
      }
    }
    let worst: CellVerdict = 'PASS';
    for (const g of gates) worst = worseVerdict(worst, g.verdict);
    if (gates.length === 0) worst = 'UNKNOWN';
    out[inv.id] = { gates, worst_verdict: worst };
  }
  return out;
}
