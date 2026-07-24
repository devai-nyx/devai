import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { appendDecisionRecord } from '../ledger/records.js';
import { readWaveLogStatus } from './waves.js';

export function escalateBlocker(
  repoRoot: string,
  blocker: {
    roundId: string;
    waveId?: string;
    subject: string;
    description: string;
    evidence?: unknown;
  },
): string | null {
  return appendDecisionRecord(repoRoot, {
    kind: 'escalate',
    subject: blocker.subject,
    description: blocker.description,
    owner: 'agent:orchestrator',
    roundId: blocker.roundId,
    ...(blocker.waveId !== undefined && { waveId: blocker.waveId }),
    ...(blocker.evidence !== undefined && {
      references: ['record/proofs/work/skill-runs/SKILL-round-orchestrate/(latest evidence)'],
    }),
  });
}

export function findNextFreeRoundN(repoRoot: string): number {
  const workDir = join(repoRoot, 'work/rounds');
  if (!existsSync(workDir)) return 1;
  let maxN = 0;
  for (const name of readdirSync(workDir)) {
    const m = /^R-(\d{4})$/.exec(name);
    if (m !== null) {
      const n = Number.parseInt(m[1] as string, 10);
      if (n > maxN) maxN = n;
    }
  }
  return maxN + 1;
}

/** R4-W5 — read open blockers from decisions.jsonl for a given round. */
export function readOpenBlockersForRound(
  repoRoot: string,
  roundN: number | string,
): { id: string; subject: string; description: string; waveId?: string }[] {
  const ledger = join(repoRoot, '.devai/state/decisions.jsonl');
  if (!existsSync(ledger)) return [];
  const out: { id: string; subject: string; description: string; waveId?: string }[] = [];
  const roundPrefix = `R${String(roundN)}`;
  try {
    const lines = readFileSync(ledger, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        const rec = JSON.parse(line) as {
          id?: string;
          kind?: string;
          status?: string;
          subject?: string;
          description?: string;
          context?: { round_id?: string };
        };
        if (
          rec.kind === 'escalate' &&
          rec.status === 'open' &&
          rec.context?.round_id !== undefined &&
          (rec.context.round_id === roundPrefix ||
            rec.context.round_id.startsWith(`${roundPrefix}-`))
        ) {
          out.push({
            id: rec.id ?? '(?)',
            subject: rec.subject ?? '(no subject)',
            description: rec.description ?? '',
            ...(rec.context.round_id !== roundPrefix && { waveId: rec.context.round_id }),
          });
        }
      } catch {
        // skip malformed
      }
    }
  } catch {
    // ledger unreadable; return empty
  }
  return out;
}

/** R4-W5 — read every wave .log's status under prompts/. */
export function readWaveLogStatuses(promptsDir: string): { wave: string; status: string }[] {
  if (!existsSync(promptsDir)) return [];
  const out: { wave: string; status: string }[] = [];
  for (const name of readdirSync(promptsDir)) {
    const m = /^(\d{2})-([^.]+)\.log$/.exec(name);
    if (m === null) continue;
    if (m[1] === '00') continue; // skip orchestrator's own log
    const status = readWaveLogStatus(join(promptsDir, name));
    out.push({ wave: `W${String(Number.parseInt(m[1] as string, 10))}`, status });
  }
  return out.sort((a, b) => a.wave.localeCompare(b.wave));
}

export interface ScorecardCell {
  readonly substrate?: string;
  readonly property?: string;
  readonly verdict?: string;
  /** Some legacy / synthetic test fixtures pre-compose the id; honored as fallback. */
  readonly id?: string;
}

/**
 * R5-W4 (DEC-0003) — canonical cell id from scorecard cell shape.
 * Scorecard cells have `substrate` (F1-F5) and `property` (T1-T9); the
 * composite cell id is "F<n>×T<m>" per the governed round-plan convention. Earlier
 * round-* render paths read `c.id` which doesn't exist on real cells,
 * producing "(?)" in scratch.md / scorecard deltas. This helper is the
 * one place that knows the composition rule.
 *
 * Fallback to `c.id` is preserved so the synthetic-round test fixtures
 * (which hand-author cells with `id` directly) keep working.
 */
export function scorecardCellId(c: ScorecardCell): string {
  if (c.substrate !== undefined && c.property !== undefined) {
    return `${c.substrate}×${c.property}`;
  }
  return c.id ?? '(?)';
}

/** R4-W5 — compute cell-by-cell delta between two scorecard envelopes. */
export function computeScorecardDelta(
  before: unknown,
  after: unknown,
): {
  flipped: { cell: string; before: string; after: string }[];
  before_count: number;
  after_count: number;
} {
  const b = (before as { cells?: ScorecardCell[] } | null)?.cells ?? [];
  const a = (after as { cells?: ScorecardCell[] } | null)?.cells ?? [];
  const beforeMap = new Map<string, string>(b.map((c) => [scorecardCellId(c), c.verdict ?? '?']));
  const afterMap = new Map<string, string>(a.map((c) => [scorecardCellId(c), c.verdict ?? '?']));
  const flipped: { cell: string; before: string; after: string }[] = [];
  const allKeys = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);
  for (const k of allKeys) {
    const bv = beforeMap.get(k) ?? '(absent)';
    const av = afterMap.get(k) ?? '(absent)';
    if (bv !== av) flipped.push({ cell: k, before: bv, after: av });
  }
  return { flipped, before_count: b.length, after_count: a.length };
}

/** R4-W5 — build the Closeout.md content per round-break.md §8.
 *  R10 (D-A-40 / ADR Decision 2 + 4): verdict expanded to the five-value
 *  taxonomy; gate footer renders `Gates: P pass / F fail / N not-configured`.
 */
