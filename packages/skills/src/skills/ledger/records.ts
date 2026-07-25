import { appendFileSync, mkdirSync } from '@devai-nyx/authority';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { AnyLedgerRecord, ResolutionRecord } from '../types.js';

interface DecisionRecordSummary {
  readonly id?: string;
  readonly kind?: string;
  readonly status?: string;
  readonly subject?: string;
  readonly context?: { readonly round_id?: string };
}

/** R5-W1 — read decision-shaped records; skip absent, unreadable, or malformed lines. */
function readDecisionRecords(repoRoot: string): DecisionRecordSummary[] {
  const ledgerPath = join(repoRoot, '.devai/state/decisions.jsonl');
  if (!existsSync(ledgerPath)) return [];
  const out: DecisionRecordSummary[] = [];
  try {
    const lines = readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0);
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as DecisionRecordSummary);
      } catch {
        // Skip malformed records.
      }
    }
  } catch {
    // Treat an unreadable ledger as empty, preserving the established API.
  }
  return out;
}

function nextDecisionId(repoRoot: string): string {
  let nextNum = 1;
  for (const rec of readDecisionRecords(repoRoot)) {
    const match = /^DEC-(\d+)$/.exec(rec.id ?? '');
    if (match !== null) {
      const value = Number.parseInt(match[1] as string, 10);
      if (value >= nextNum) nextNum = value + 1;
    }
  }
  return `DEC-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Append a decision record unless its idempotency predicate already matches.
 * Sequential id allocation intentionally preserves the current serialized
 * round-execution contract.
 */
export function appendDecisionRecord(
  repoRoot: string,
  opts: {
    kind: 'escalate' | 'defer' | 'accept' | 'reject' | 'supersede';
    subject: string;
    description: string;
    owner: string;
    roundId: string;
    waveId?: string;
    references?: readonly string[];
    isDuplicate?: (existing: DecisionRecordSummary) => boolean;
  },
): string | null {
  const ledgerPath = join(repoRoot, '.devai/state/decisions.jsonl');
  mkdirSync(dirname(ledgerPath), { recursive: true });
  const duplicate =
    opts.isDuplicate ??
    ((existing: DecisionRecordSummary) =>
      existing.subject === opts.subject &&
      existing.context?.round_id === (opts.waveId ?? opts.roundId));
  for (const rec of readDecisionRecords(repoRoot)) {
    if (duplicate(rec)) return null;
  }
  const id = nextDecisionId(repoRoot);
  const record = {
    schemaVersion: '1.0.0',
    id,
    created_at: new Date().toISOString(),
    kind: opts.kind,
    subject: opts.subject,
    description: opts.description,
    owner: opts.owner,
    status: 'open' as const,
    context: { round_id: opts.waveId ?? opts.roundId },
    ...(opts.references !== undefined &&
      opts.references.length > 0 && { references: [...opts.references] }),
  };
  appendFileSync(ledgerPath, JSON.stringify(record) + '\n');
  return id;
}

export function readAllLedgerRecords(repoRoot: string): readonly AnyLedgerRecord[] {
  const ledgerPath = join(repoRoot, '.devai/state/decisions.jsonl');
  if (!existsSync(ledgerPath)) return [];
  const out: AnyLedgerRecord[] = [];
  try {
    const lines = readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0);
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as AnyLedgerRecord);
      } catch {
        // Skip malformed records.
      }
    }
  } catch {
    // Treat an unreadable ledger as empty, preserving the established API.
  }
  return out;
}

export function resolvedDecIds(repoRoot: string): ReadonlySet<string> {
  const out = new Set<string>();
  for (const record of readAllLedgerRecords(repoRoot)) {
    if (record.kind === 'resolution' && typeof record.resolves_dec_id === 'string') {
      out.add(record.resolves_dec_id);
    }
  }
  return out;
}

export function appendResolutionRecord(
  repoRoot: string,
  opts: {
    decId: string;
    disposition: 'closed' | 'superseded' | 'invalidated';
    resolvedBy: string;
    evidenceRef?: string;
    note?: string;
    context?: { round_id?: string; commit_sha?: string };
  },
): string {
  const ledgerPath = join(repoRoot, '.devai/state/decisions.jsonl');
  mkdirSync(dirname(ledgerPath), { recursive: true });
  const id = `${opts.decId}-resolution`;
  const record: ResolutionRecord = {
    schemaVersion: '1.0.0',
    id,
    kind: 'resolution',
    resolves_dec_id: opts.decId,
    resolved_at: new Date().toISOString(),
    resolved_by: opts.resolvedBy,
    disposition: opts.disposition,
    ...(opts.evidenceRef !== undefined && { evidence_ref: opts.evidenceRef }),
    ...(opts.note !== undefined && { note: opts.note }),
    ...(opts.context !== undefined &&
      Object.keys(opts.context).length > 0 && { context: { ...opts.context } }),
  };
  appendFileSync(ledgerPath, JSON.stringify(record) + '\n');
  return id;
}
