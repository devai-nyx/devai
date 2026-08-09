// Invariants: INV-DEVAI-001, INV-DEVAI-017, INV-DEVAI-019, INV-DEVAI-020
// R-0007 B4 execution-surface acceptance: runtime suite and preset resolution
// retains the Architect-owned exact populations, order, effects, and total exits.
import { describe, expect, it } from 'vitest';
import { SENSOR_REGISTRY } from '@devai-nyx/sensors';
import { resolve } from 'node:path';
import {
  aggregateCheckResults,
  resolveCheckPlan,
  runCheckPlan,
  type CheckMemberResult,
  type CheckStatus,
  type CheckSuiteName,
} from '../../src/commands/check/contracts.js';
import { resolveSenseSelection } from '../../src/commands/sense/facade.js';

const ROOT = resolve(import.meta.dirname, '../../../..');

const EXPECTED_SUITES = {
  quick: ['build', 'lint', 'type-check', 'unit-test', 'schema-config-load'],
  standard: [
    'build',
    'lint',
    'type-check',
    'unit-test',
    'schema-config-load',
    'invariant-validation',
    'journey-validation',
    'glossary-validation',
    'trace-validation',
    'test-trace-validation',
    'strategy-validation',
    'action-coverage',
    'ordinary-policy',
  ],
  full: [
    'build',
    'lint',
    'type-check',
    'unit-test',
    'schema-config-load',
    'invariant-validation',
    'journey-validation',
    'glossary-validation',
    'trace-validation',
    'test-trace-validation',
    'strategy-validation',
    'action-coverage',
    'ordinary-policy',
    'full-tests',
    'inventory-integrity',
    'docs-ci-policy',
    'mutation',
    'security-performance',
    'harness-integrity',
    'coverage',
  ],
  release: [
    'build',
    'lint',
    'type-check',
    'unit-test',
    'schema-config-load',
    'invariant-validation',
    'journey-validation',
    'glossary-validation',
    'trace-validation',
    'test-trace-validation',
    'strategy-validation',
    'action-coverage',
    'ordinary-policy',
    'full-tests',
    'inventory-integrity',
    'docs-ci-policy',
    'mutation',
    'security-performance',
    'harness-integrity',
    'coverage',
    'evidence-integrity',
    'release-scorecard',
    'dependency-security',
    'provenance-readiness',
    'changeset-version',
    'workflow-reference',
  ],
} as const satisfies Readonly<Record<CheckSuiteName, readonly string[]>>;

const EXPECTED_PRESETS = {
  baseline: ['build', 'lint', 'type_check', 'unit_test'],
  structural: [
    'build',
    'lint',
    'type_check',
    'unit_test',
    'inventory_api',
    'inventory_routes',
    'inventory_data_model',
    'inventory_rbac',
    'inventory_data_handling',
    'inventory_dep_graph',
    'spec_depth',
    'spec_alignment',
  ],
  governed: [
    'build',
    'lint',
    'type_check',
    'unit_test',
    'inventory_api',
    'inventory_routes',
    'inventory_data_model',
    'inventory_rbac',
    'inventory_data_handling',
    'inventory_dep_graph',
    'spec_depth',
    'spec_alignment',
    'spec_freshness',
    'spec_idiomaticity',
    'test_invariant_alignment',
    'harness_coverage',
    'harness_depth',
    'harness_coherence',
    'harness_invariant_alignment',
    'docs_drift',
  ],
} as const;

function result(id: string, status: CheckStatus): CheckMemberResult {
  return {
    id,
    status,
    effect: 'read',
    binding: { kind: 'runtime-gate', gate_id: id },
    duration_ms: 0,
  };
}

describe('R-0007 B4 execution-surface check suites', () => {
  it('resolves every exact suite population and executes release in canonical order', async () => {
    for (const [suite, expected] of Object.entries(EXPECTED_SUITES) as ReadonlyArray<
      readonly [CheckSuiteName, readonly string[]]
    >) {
      const plan = resolveCheckPlan(ROOT, { suite });
      expect(plan.selection).toEqual({ kind: 'suite', suite });
      expect(plan.ordering).toBe('members-execute-in-declared-order-without-coalescing');
      expect(
        plan.members.map((member) => member.id),
        suite,
      ).toEqual(expected);
      expect(
        plan.members.every((member) => member.source === 'suite-policy'),
        suite,
      ).toBe(true);
    }

    const release = resolveCheckPlan(ROOT, { suite: 'release' });
    const observed: string[] = [];
    const report = await runCheckPlan(release, (member) => {
      observed.push(member.id);
      return {
        id: member.id,
        status: 'pass',
        effect: member.effect,
        binding: member.binding,
        duration_ms: 0,
      };
    });
    expect(observed).toEqual(EXPECTED_SUITES.release);
    expect(report.results.map((member) => member.id)).toEqual(EXPECTED_SUITES.release);
    expect(report).toMatchObject({
      ok: true,
      execution_status: 'pass',
      readiness_status: 'pass',
      exit_code: 0,
    });
  });

  it('applies the complete aggregate precedence and conservative exit table', () => {
    const cases = [
      [[], ['pass', 'na', 0]],
      [['na'], ['pass', 'na', 0]],
      [
        ['pass', 'na'],
        ['pass', 'pass', 0],
      ],
      [
        ['unknown', 'pass', 'na'],
        ['pass', 'unknown', 1],
      ],
      [
        ['review', 'unknown', 'pass'],
        ['pass', 'review', 1],
      ],
      [
        ['fail', 'review', 'unknown', 'pass'],
        ['pass', 'fail', 2],
      ],
      [
        ['error', 'pass'],
        ['error', 'pass', 2],
      ],
      [
        ['error', 'fail', 'review', 'unknown', 'pass', 'na'],
        ['error', 'fail', 2],
      ],
    ] as const satisfies ReadonlyArray<
      readonly [readonly CheckStatus[], readonly ['pass' | 'error', CheckStatus, number]]
    >;

    for (const [statuses, expected] of cases) {
      const aggregate = aggregateCheckResults(
        statuses.map((status, index) => result(`member-${String(index)}`, status)),
      );
      expect(
        [aggregate.execution_status, aggregate.readiness_status, aggregate.exit_code],
        statuses.join(','),
      ).toEqual(expected);
    }
  });

  it('continues after executor throws and makes identity drift a total error result', async () => {
    const quick = resolveCheckPlan(ROOT, { suite: 'quick' });
    const visited: string[] = [];
    const report = await runCheckPlan(quick, (member) => {
      visited.push(member.id);
      if (member.id === 'build') return result('substituted-build', 'pass');
      if (member.id === 'lint') throw new Error('fixture executor failure');
      return result(member.id, 'pass');
    });

    expect(visited).toEqual(EXPECTED_SUITES.quick);
    expect(report.results).toHaveLength(EXPECTED_SUITES.quick.length);
    expect(report.results[0]).toMatchObject({
      id: 'build',
      status: 'error',
      code: 'CHECK_RESULT_IDENTITY_MISMATCH',
    });
    expect(report.results[1]).toMatchObject({
      id: 'lint',
      status: 'error',
      code: 'CHECK_EXECUTION_ERROR',
    });
    expect(report).toMatchObject({
      ok: false,
      execution_status: 'error',
      readiness_status: 'pass',
      exit_code: 2,
    });
  });
});

describe('R-0007 B4 execution-surface sense presets', () => {
  it('resolves baseline, structural, and governed to their exact ordered kinds', () => {
    for (const [preset, expected] of Object.entries(EXPECTED_PRESETS)) {
      const resolved = resolveSenseSelection({ preset });
      expect(resolved.selection).toEqual({ type: 'preset', value: preset });
      expect(resolved.executed, preset).toEqual(expected);
      expect(
        resolved.members.map((member) => member.kind),
        preset,
      ).toEqual(expected);
      expect(resolved.excluded, preset).toEqual([]);
      expect(resolved.round_required, preset).toBe(false);
      expect(resolved.implicit_persistence, preset).toBe(false);
    }
  });

  it('derives sweep as the exact read-only registry order with total write exclusions', () => {
    expect(() => resolveSenseSelection({ preset: 'sweep' })).toThrow('SENSE_ROUND_REQUIRED');
    const resolved = resolveSenseSelection({ preset: 'sweep' }, { roundId: 'R-0007' });
    const readKinds = SENSOR_REGISTRY.entries
      .filter((entry) => entry.effect === 'read')
      .map((entry) => entry.kind);
    const writeKinds = SENSOR_REGISTRY.entries
      .filter((entry) => entry.effect !== 'read')
      .map((entry) => entry.kind);

    expect(resolved.executed).toEqual(readKinds);
    expect(resolved.members.map((member) => member.kind)).toEqual(readKinds);
    expect(resolved.members.every((member) => member.effect === 'read')).toBe(true);
    expect(
      resolved.members.every((member) => !member.consent.write && !member.consent.publish),
    ).toBe(true);
    expect(resolved.excluded.map((member) => member.kind)).toEqual(writeKinds);
    expect(resolved.excluded.every((member) => member.effect !== 'read')).toBe(true);
    expect(resolved.excluded.every((member) => member.reason.trim().length > 0)).toBe(true);
    expect(
      new Set([...resolved.executed, ...resolved.excluded.map((member) => member.kind)]).size,
    ).toBe(SENSOR_REGISTRY.entries.length);
    expect(resolved).toMatchObject({
      round_required: true,
      round_id: 'R-0007',
      aggregate_effect: 'read',
      implicit_persistence: false,
    });
  });
});
