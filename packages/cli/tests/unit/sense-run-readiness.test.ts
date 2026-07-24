// Invariants: INV-DEVAI-019
import { describe, expect, it } from 'vitest';
import * as runSet from '../../src/commands/sense/run-set.js';

type Child = {
  readonly command: string;
  readonly processStatus: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly na?: boolean;
};

type Aggregate = {
  readonly execution_status: 'pass' | 'error';
  readonly readiness_status: 'pass' | 'review' | 'fail' | 'unknown' | 'na';
  readonly applicable_count: number;
  readonly na_count: number;
  readonly counts: Record<string, number>;
};

function reading(status: string): string {
  return JSON.stringify({ status });
}

function aggregate(children: readonly Child[]): Aggregate {
  const fn = (
    runSet as unknown as { aggregateSensorRunResults?: (c: readonly Child[]) => Aggregate }
  ).aggregateSensorRunResults;
  expect(fn, 'run-set must export its deterministic structured aggregator').toBeTypeOf('function');
  if (fn === undefined) throw new Error('aggregateSensorRunResults is not implemented');
  return fn(children);
}

describe('sense run readiness aggregation', () => {
  it('preserves N/A, REVIEW, and UNKNOWN without translating them to PASS or FAIL', () => {
    const result = aggregate([
      { command: 'one', processStatus: 0, stdout: reading('pass'), stderr: '' },
      { command: 'two', processStatus: 0, stdout: reading('review'), stderr: '' },
      { command: 'three', processStatus: 0, stdout: reading('unknown'), stderr: '' },
      { command: 'four', processStatus: 0, stdout: reading('pass'), stderr: '', na: true },
    ]);

    expect(result).toMatchObject({
      execution_status: 'pass',
      readiness_status: 'review',
      applicable_count: 3,
      na_count: 1,
    });
    expect(result.counts).toMatchObject({ pass: 1, review: 1, unknown: 1, na: 1 });
  });

  it('returns readiness N/A when every configured child is N/A', () => {
    expect(
      aggregate([
        { command: 'one', processStatus: 0, stdout: reading('pass'), stderr: '', na: true },
        { command: 'two', processStatus: 0, stdout: reading('review'), stderr: '', na: true },
      ]),
    ).toMatchObject({ execution_status: 'pass', readiness_status: 'na', applicable_count: 0 });
  });

  it('classifies malformed JSON and spawn failures as execution ERROR, not readiness FAIL', () => {
    const malformed = aggregate([
      { command: 'one', processStatus: 0, stdout: 'not-json', stderr: '' },
    ]);
    const spawnFailure = aggregate([
      { command: 'two', processStatus: null, stdout: '', stderr: 'ENOENT' },
    ]);

    expect(malformed.execution_status).toBe('error');
    expect(spawnFailure.execution_status).toBe('error');
    expect(malformed.readiness_status).not.toBe('fail');
    expect(spawnFailure.readiness_status).not.toBe('fail');
  });
});
