// Invariants: INV-DEVAI-019
import { describe, expect, it } from 'vitest';
import * as broker from '../../src/authority/broker.js';
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
  it('plans non-read registry children as honest blockers instead of spawning them', () => {
    const plan = (
      runSet as unknown as {
        planSensorChild?: (
          command: readonly string[],
          executable: string,
          entries: readonly unknown[],
          version: string,
        ) => { readonly argv: readonly string[]; readonly runnable: boolean };
      }
    ).planSensorChild;
    expect(plan, 'run-set must expose deterministic child planning').toBeTypeOf('function');
    if (plan === undefined) throw new Error('planSensorChild is not implemented');
    const entries = [
      {
        internal_name: 'sense-type-check',
        path: ['sense', 'type', 'check'],
        effects: 'read',
        previous_name: 'sense type check',
      },
      {
        internal_name: 'sense-readings-rebuild',
        path: ['sense', 'readings', 'rebuild'],
        effects: 'local-write',
        previous_name: 'sense readings rebuild',
      },
    ];

    expect(
      plan(['sense', 'run', 'type_check', '--repo-root', '/repo'], '/cli.js', entries, '1.0.0'),
    ).toEqual({ argv: ['sense', 'type', 'check', '--repo-root', '/repo'], runnable: true });
    expect(
      plan(
        ['sense', 'run', 'inventory_regeneration', '--repo-root', '/repo'],
        '/cli.js',
        entries,
        '1.0.0',
      ),
    ).toEqual({
      argv: ['sense', 'readings', 'rebuild', '--repo-root', '/repo'],
      runnable: false,
    });
    expect(
      plan(
        ['sense', 'run', 'test_weakening_review', '--repo-root', '/repo'],
        '/cli.js',
        entries,
        '1.0.0',
      ),
    ).toEqual({ argv: [], runnable: false });
  });

  it('routes a registry-derived public sensor child to its internal binding', () => {
    const route = (
      runSet as unknown as {
        routeSensorChildArgv?: (
          command: readonly string[],
          executable: string,
          entries: readonly unknown[],
          version: string,
        ) => readonly string[];
      }
    ).routeSensorChildArgv;
    expect(route, 'run-set must route child aliases before spawning').toBeTypeOf('function');
    if (route === undefined) throw new Error('routeSensorChildArgv is not implemented');
    const entries = [
      {
        internal_name: 'sense-type-check',
        path: ['sense', 'type', 'check'],
        effects: 'read',
        previous_name: 'sense type check',
      },
    ];
    expect(
      route(['sense', 'run', 'type_check', '--repo-root', '/repo'], '/cli.js', entries, '1.0.0'),
    ).toEqual(['sense', 'type', 'check', '--repo-root', '/repo']);
  });

  it('admits only an exact read-only public sensor child under the aggregate scope', () => {
    const admits = (
      broker as unknown as {
        readOnlyDevaiChild?: (
          executable: string,
          args: readonly unknown[],
          entries: readonly unknown[],
          parentAction: string | undefined,
        ) => boolean;
      }
    ).readOnlyDevaiChild;
    expect(admits, 'broker must expose deterministic child recognition').toBeTypeOf('function');
    if (admits === undefined) throw new Error('readOnlyDevaiChild is not implemented');
    const currentCli = process.argv[1] ?? '';
    const readEntry = {
      internal_name: 'sense-type-check',
      path: ['sense', 'type', 'check'],
      effects: 'read',
      previous_name: 'sense type check',
    };
    const writeEntry = { ...readEntry, internal_name: 'sense-write', effects: 'local-write' };

    expect(
      admits(
        process.execPath,
        [currentCli, 'sense', 'type', 'check', '--repo-root', '/repo'],
        [readEntry],
        'sense run',
      ),
    ).toBe(true);
    expect(
      admits(
        process.execPath,
        [currentCli, 'sense', 'unknown', '--repo-root', '/repo'],
        [readEntry],
        'sense run',
      ),
    ).toBe(false);
    expect(
      admits(
        process.execPath,
        [currentCli, 'sense', 'write', '--repo-root', '/repo'],
        [writeEntry],
        'sense run',
      ),
    ).toBe(false);
    expect(
      admits(
        process.execPath,
        [currentCli, 'sense', 'type', 'check', '--repo-root', '/repo', '--write'],
        [readEntry],
        'sense run',
      ),
    ).toBe(false);
    expect(
      admits(
        process.execPath,
        [currentCli, 'sense-type-check', '--repo-root', '/repo'],
        [readEntry],
        'sense run',
      ),
    ).toBe(false);
  });

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
