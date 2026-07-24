import { appendResolutionRecord, readAllLedgerRecords } from './records.js';

export function closeDecision(
  repoRoot: string,
  opts: {
    decId: string;
    disposition: 'closed' | 'superseded' | 'invalidated';
    resolvedBy: string;
    evidenceRef?: string;
    note?: string;
    force?: boolean;
    context?: { round_id?: string; commit_sha?: string };
  },
): string {
  const all = readAllLedgerRecords(repoRoot);
  const target = all.find((record) => record.id === opts.decId && record.kind !== 'resolution');
  if (target === undefined) throw new Error(`DEC id not found in ledger: ${opts.decId}`);
  if (opts.force !== true) {
    const alreadyResolved = all.some(
      (record) => record.kind === 'resolution' && record.resolves_dec_id === opts.decId,
    );
    if (alreadyResolved) {
      throw new Error(
        `DEC ${opts.decId} already has a resolution record; pass --force to append another.`,
      );
    }
  }
  return appendResolutionRecord(repoRoot, {
    decId: opts.decId,
    disposition: opts.disposition,
    resolvedBy: opts.resolvedBy,
    ...(opts.evidenceRef !== undefined && { evidenceRef: opts.evidenceRef }),
    ...(opts.note !== undefined && { note: opts.note }),
    ...(opts.context !== undefined && { context: opts.context }),
  });
}

export function closeDecisionsFromRound(
  repoRoot: string,
  opts: {
    round: string;
    disposition: 'closed' | 'superseded' | 'invalidated';
    resolvedBy: string;
    evidenceRef?: string;
    note?: string;
    force?: boolean;
    context?: { round_id?: string; commit_sha?: string };
  },
): readonly string[] {
  const all = readAllLedgerRecords(repoRoot);
  const alreadyResolved = new Set<string>();
  for (const record of all) {
    if (record.kind === 'resolution' && typeof record.resolves_dec_id === 'string') {
      alreadyResolved.add(record.resolves_dec_id);
    }
  }
  const candidates = all.filter((record) => {
    if (record.kind === 'resolution' || typeof record.id !== 'string') return false;
    const roundId = record.context?.round_id;
    if (roundId === undefined) return false;
    return roundId === opts.round || roundId.startsWith(`${opts.round}-`);
  });
  const written: string[] = [];
  for (const record of candidates) {
    const id = record.id as string;
    if (!opts.force && alreadyResolved.has(id)) continue;
    written.push(
      appendResolutionRecord(repoRoot, {
        decId: id,
        disposition: opts.disposition,
        resolvedBy: opts.resolvedBy,
        ...(opts.evidenceRef !== undefined && { evidenceRef: opts.evidenceRef }),
        ...(opts.note !== undefined && { note: opts.note }),
        ...(opts.context !== undefined && { context: opts.context }),
      }),
    );
  }
  return written;
}
