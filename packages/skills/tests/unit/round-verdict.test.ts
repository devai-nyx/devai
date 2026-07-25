// Invariants: INV-DEVAI-005
import { describe, expect, it } from 'vitest';
import { computeRoundVerdict } from '../../src/skills/ledger/verdict.js';

describe('round verdict precedence', () => {
  it.each([
    [
      'failed',
      {
        gateFailCount: 0,
        waveStatuses: [{ status: 'clean' }],
        blockersCount: 0,
        deferredCount: 0,
        failedExecution: true,
      },
    ],
    [
      'aborted',
      {
        gateFailCount: 1,
        waveStatuses: [{ status: 'aborted' }],
        blockersCount: 1,
        deferredCount: 1,
      },
    ],
    ['with-blockers', { gateFailCount: 0, waveStatuses: [], blockersCount: 1, deferredCount: 1 }],
    [
      'partial',
      {
        gateFailCount: 0,
        waveStatuses: [{ status: 'clean' }, { status: 'review' }],
        blockersCount: 0,
        deferredCount: 0,
      },
    ],
    [
      'partial',
      {
        gateFailCount: 0,
        waveStatuses: [{ status: 'clean' }, { status: 'skipped' }],
        blockersCount: 0,
        deferredCount: 1,
      },
    ],
    [
      'deferred',
      {
        gateFailCount: 0,
        waveStatuses: [{ status: 'skipped' }],
        blockersCount: 0,
        deferredCount: 1,
      },
    ],
    [
      'clean',
      {
        gateFailCount: 0,
        waveStatuses: [{ status: 'clean' }, { status: 'skipped' }],
        blockersCount: 0,
        deferredCount: 0,
      },
    ],
  ] as const)('returns %s for the complete precedence fixture', (expected, inputs) => {
    expect(computeRoundVerdict(inputs)).toBe(expected);
  });
});
