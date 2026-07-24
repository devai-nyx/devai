import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { join } from 'node:path';
import { getValidator } from '@devai-nyx/schemas';

const validatePhaseClosure = getValidator('phase-closure.schema.json');

/**
 * Phase/round closure ledger (D-110; governance-roadmap item 4).
 *
 * One PhaseClosure record per closed phase/round under
 * record/proofs/compliance/closures/PC-NNNN.json. Records are append-only:
 * `closePhase` never overwrites, and corrections append a new record
 * carrying `supersedes`. Derived properties (the consecutive
 * no-deletion streak, batch counts, gate history) are computed from
 * the records by `computeLedger` — they are never stored, so they can
 * never drift the way hand-narrated counters did (D-108).
 */

export type ClosureRole = 'Owner' | 'Architect' | 'Inspector' | 'Engineer' | 'Auditor';

export interface ClosureBatch {
  readonly id: string;
  readonly roles: readonly ClosureRole[];
  readonly commit?: string;
  readonly headline: string;
}

export interface ClosureGateResult {
  readonly status: 'pass' | 'fail' | 'skipped';
  readonly detail?: string;
}

export interface ClosureCriterion {
  readonly criterion: string;
  readonly verdict: 'pass' | 'fail' | 'n/a';
  readonly evidence?: string;
}

export interface PhaseClosureDraft {
  readonly round_id: string;
  readonly title?: string;
  readonly declaring_decision: string;
  readonly closing_decision: string;
  readonly batches: readonly ClosureBatch[];
  readonly gates: Readonly<Record<string, ClosureGateResult>>;
  readonly source_repo_deleted: boolean;
  readonly validation_criteria: readonly ClosureCriterion[];
  readonly closed_at?: string;
  readonly supersedes?: string;
  // R18 (D-133/H1): the shipped-state fields. Optional in the schema for
  // pre-R18 record validity; the ceremony requires both from PC-0007 on.
  readonly merged_as?: string;
  readonly release_disposition?:
    'published' | 'changeset-pending' | 'none-preratification' | 'none-needed' | 'missing';
  readonly notes?: string;
}

export interface PhaseClosureRecord extends PhaseClosureDraft {
  readonly schemaVersion: '1.0.0';
  readonly id: string;
  readonly closed_at: string;
}

const CLOSURES_DIR = 'record/proofs/compliance/closures';

function closuresDir(repoRoot: string): string {
  return join(repoRoot, CLOSURES_DIR);
}

export function readClosures(repoRoot: string): PhaseClosureRecord[] {
  const dir = closuresDir(repoRoot);
  if (!existsSync(dir)) return [];
  const records: PhaseClosureRecord[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!/^PC-[0-9]{4}\.json$/.test(name)) continue;
    records.push(JSON.parse(readFileSync(join(dir, name), 'utf8')) as PhaseClosureRecord);
  }
  return records.sort((a, b) => a.id.localeCompare(b.id));
}

function nextClosureId(existing: readonly PhaseClosureRecord[]): string {
  let max = 0;
  for (const r of existing) {
    const n = Number(r.id.slice(3));
    if (n > max) max = n;
  }
  return `PC-${String(max + 1).padStart(4, '0')}`;
}

interface ParsedDecisionId {
  readonly namespace: 'D' | 'DII';
  readonly number: number;
}

function parseDecisionId(value: string): ParsedDecisionId {
  const match = /^(D|DII)-([0-9]+)$/.exec(value);
  if (match === null) throw new Error(`phase close: malformed decision id '${value}'`);
  const number = Number(match[2]);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`phase close: malformed decision id '${value}'`);
  }
  return { namespace: match[1] as ParsedDecisionId['namespace'], number };
}

export interface ClosePhaseResult {
  readonly record: PhaseClosureRecord;
  readonly path: string;
}

/**
 * Validate a draft, assign the next sequential id, and write the
 * record. Throws on schema violation, on closing-decision number
 * lower than the declaring one, on duplicate round_id (unless the new
 * record supersedes), and on any failing gate without an explicit
 * failing validation criterion acknowledging it.
 */
export function closePhase(repoRoot: string, draft: PhaseClosureDraft): ClosePhaseResult {
  const existing = readClosures(repoRoot);
  const record: PhaseClosureRecord = {
    schemaVersion: '1.0.0',
    id: nextClosureId(existing),
    closed_at: draft.closed_at ?? new Date().toISOString(),
    ...draft,
  } as PhaseClosureRecord;

  if (!validatePhaseClosure(record)) {
    const errors = (validatePhaseClosure.errors ?? [])
      .map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`)
      .join('; ');
    throw new Error(
      `phase close: draft does not validate against phase-closure.schema.json: ${errors}`,
    );
  }
  const declaring = parseDecisionId(record.declaring_decision);
  const closing = parseDecisionId(record.closing_decision);
  if (declaring.namespace !== closing.namespace) {
    throw new Error(
      `phase close: declaring decision ${record.declaring_decision} and closing decision ${record.closing_decision} use different namespaces`,
    );
  }
  if (closing.number <= declaring.number) {
    throw new Error(
      `phase close: closing decision ${record.closing_decision} must strictly follow declaring decision ${record.declaring_decision}`,
    );
  }
  const dup = existing.find((r) => r.round_id === record.round_id);
  if (dup !== undefined && record.supersedes !== dup.id) {
    throw new Error(
      `phase close: round_id '${record.round_id}' already closed as ${dup.id}; pass supersedes: '${dup.id}' to correct it`,
    );
  }
  if (record.supersedes !== undefined && !existing.some((r) => r.id === record.supersedes)) {
    throw new Error(`phase close: supersedes ${record.supersedes} does not exist`);
  }
  // R18.E (D-133/H1): from PC-0007 onward the ceremony attests SHIPPED
  // state, not a pre-merge working tree — PC-0005 attested a SHA that was
  // not the shipped tip, its first remote CI run failed, and no release
  // disposition existed. merged_as and release_disposition are therefore
  // mandatory (the schema keeps them optional so pre-R18 records stay
  // valid); the ceremony runs at/after merge under the D-134 convention.
  const numericId = Number(record.id.slice(3));
  if (numericId >= 7) {
    if (record.merged_as === undefined) {
      throw new Error(
        'phase close: merged_as is required from PC-0007 onward — run the ceremony at/after the merge that ships the round (D-134)',
      );
    }
    if (record.release_disposition === undefined) {
      throw new Error(
        'phase close: release_disposition is required from PC-0007 onward (published | changeset-pending | none-preratification | none-needed | missing)',
      );
    }
  }

  const dir = closuresDir(repoRoot);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${record.id}.json`);
  if (existsSync(path)) {
    throw new Error(`phase close: ${path} already exists (closures are append-only)`);
  }
  writeFileSync(path, JSON.stringify(record, null, 2) + '\n');
  return { record, path };
}

export interface LedgerRound {
  readonly id: string;
  readonly round_id: string;
  readonly title?: string;
  readonly closed_at: string;
  readonly declaring_decision: string;
  readonly closing_decision: string;
  readonly batch_count: number;
  readonly roles: readonly ClosureRole[];
  readonly gates_failed: readonly string[];
  readonly source_repo_deleted: boolean;
  readonly superseded_by?: string;
}

export interface ClosureLedger {
  readonly count: number;
  /** Consecutive no-deletion closures counting back from the latest effective record. */
  readonly no_deletion_streak: number;
  readonly streak_basis: string;
  readonly rounds: readonly LedgerRound[];
}

/** Latest-wins view: records superseded by a later record are annotated, not dropped. */
export function computeLedger(records: readonly PhaseClosureRecord[]): ClosureLedger {
  const supersededBy = new Map<string, string>();
  for (const r of records) {
    if (r.supersedes !== undefined) supersededBy.set(r.supersedes, r.id);
  }
  const rounds: LedgerRound[] = records.map((r) => ({
    id: r.id,
    round_id: r.round_id,
    ...(r.title !== undefined && { title: r.title }),
    closed_at: r.closed_at,
    declaring_decision: r.declaring_decision,
    closing_decision: r.closing_decision,
    batch_count: r.batches.length,
    roles: [...new Set(r.batches.flatMap((b) => b.roles))],
    gates_failed: Object.entries(r.gates)
      .filter(([, g]) => g.status === 'fail')
      .map(([name]) => name),
    source_repo_deleted: r.source_repo_deleted,
    ...(supersededBy.has(r.id) && { superseded_by: supersededBy.get(r.id) }),
  }));

  const effective = rounds.filter((r) => r.superseded_by === undefined);
  let streak = 0;
  for (let i = effective.length - 1; i >= 0; i -= 1) {
    if (effective[i]?.source_repo_deleted === true) break;
    streak += 1;
  }
  return {
    count: effective.length,
    no_deletion_streak: streak,
    streak_basis:
      effective.length > 0
        ? `since records began (${effective[0]?.id ?? '?'})`
        : 'no closure records yet',
    rounds,
  };
}
