// R20.W1 matrix row 9 — ledger/verdict behavior corpus over synthetic fixtures.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendResolutionRecord,
  closeDecision,
  closeDecisionsFromRound,
  computeRoundVerdict,
  readAllLedgerRecords,
  resolvedDecIds,
} from '../../src/skills/index.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import { baseline, canonical, normalize } from './r20-harness.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

let repo = '';

const SYNTH_LEDGER = [
  {
    schemaVersion: '1.0.0',
    kind: 'decision',
    id: 'DEC-0001',
    title: 'a',
    context: { round_id: 'R3' },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    schemaVersion: '1.0.0',
    kind: 'decision',
    id: 'DEC-0002',
    title: 'b',
    context: { round_id: 'R3-W1' },
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    schemaVersion: '1.0.0',
    kind: 'escalate',
    id: 'DEC-0003',
    title: 'c',
    context: { round_id: 'R4' },
    created_at: '2026-01-03T00:00:00.000Z',
  },
]
  .map((r) => JSON.stringify(r))
  .join('\n');

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'r20-ledger-'));
  mkdirSync(join(repo, '.devai/state'), { recursive: true });
  writeFileSync(join(repo, '.devai/state/decisions.jsonl'), SYNTH_LEDGER + '\n');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

// Exhaustive-ish verdict table: every branch of the precedence chain.
const VERDICT_CASES = [
  { gateFailCount: 0, waveStatuses: [{ status: 'clean' }], blockersCount: 0, deferredCount: 0 },
  {
    gateFailCount: 0,
    waveStatuses: [{ status: 'clean' }, { status: 'clean' }],
    blockersCount: 0,
    deferredCount: 0,
  },
  { gateFailCount: 1, waveStatuses: [{ status: 'clean' }], blockersCount: 0, deferredCount: 0 },
  { gateFailCount: 0, waveStatuses: [{ status: 'clean' }], blockersCount: 2, deferredCount: 0 },
  {
    gateFailCount: 0,
    waveStatuses: [{ status: 'clean' }, { status: 'aborted' }],
    blockersCount: 0,
    deferredCount: 0,
  },
  {
    gateFailCount: 0,
    waveStatuses: [{ status: 'clean' }, { status: 'blocked' }],
    blockersCount: 0,
    deferredCount: 0,
  },
  { gateFailCount: 0, waveStatuses: [{ status: 'clean' }], blockersCount: 0, deferredCount: 3 },
  {
    gateFailCount: 0,
    waveStatuses: [{ status: 'clean' }, { status: 'skipped' }],
    blockersCount: 0,
    deferredCount: 0,
  },
  { gateFailCount: 0, waveStatuses: [{ status: 'skipped' }], blockersCount: 0, deferredCount: 0 },
  { gateFailCount: 5, waveStatuses: [{ status: 'aborted' }], blockersCount: 1, deferredCount: 1 },
  { gateFailCount: 0, waveStatuses: [], blockersCount: 0, deferredCount: 0 },
  {
    gateFailCount: 0,
    waveStatuses: [{ status: 'clean' }],
    blockersCount: 0,
    deferredCount: 0,
    failedExecution: true,
  },
] as const;

describe('R20 baseline: ledger + verdict corpus', () => {
  it('computeRoundVerdict verdict table matches the baseline', () => {
    const table = VERDICT_CASES.map((c) => ({ inputs: c, verdict: computeRoundVerdict(c) }));
    const current = canonical({ table });
    const { expected } = baseline('ledger-verdict-table.json', current);
    expect(current).toBe(expected);
  });

  it('read/resolve/append/close behavior over the synthetic ledger matches the baseline', () => {
    const steps: Record<string, unknown> = {};
    steps['read_all'] = readAllLedgerRecords(repo);
    steps['resolved_before'] = [...resolvedDecIds(repo)].sort();
    appendResolutionRecord(repo, {
      decId: 'DEC-0001',
      disposition: 'closed',
      resolvedBy: 'r20-fixture',
      evidenceRef: 'EV-test',
    });
    steps['resolved_after_append'] = [...resolvedDecIds(repo)].sort();
    steps['close_decision'] = closeDecision(repo, {
      decId: 'DEC-0002',
      disposition: 'superseded',
      resolvedBy: 'r20-fixture',
    });
    steps['close_from_round'] = closeDecisionsFromRound(repo, {
      round: 'R4',
      disposition: 'closed',
      resolvedBy: 'r20-fixture',
    });
    steps['ledger_file_after'] = readFileSync(join(repo, '.devai/state/decisions.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    const current = canonical({ steps: normalize(steps, repo) });
    const { expected } = baseline('ledger-corpus.json', current);
    expect(current).toBe(expected);
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-010
