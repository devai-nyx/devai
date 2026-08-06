// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective red for DII-255 / OM-020. The authorized repair changes scheduling only:
// every existing test, timeout, literal argv, detached install, and coverage floor remains.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const SCHEDULER = resolve(ROOT, 'vitest.scheduler.ts');
const ROOT_CONFIG = resolve(ROOT, 'vitest.config.ts');
const COVERAGE_CONFIG = resolve(ROOT, 'tests/config/t1-t3.coverage.config.ts');
const PACKAGE = resolve(ROOT, 'package.json');

const SERIALIZED = [
  'tests/contract/pre-r0007-close-controls.red.contract.test.ts',
  'tests/contract/pre-r0007-cycle1-defect-classes.red.contract.test.ts',
  'tests/contract/pre-r0007-impact-dag.adversarial.contract.test.ts',
  'tests/contract/pre-r0007-manifest-gate.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-1.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-2.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-3.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-4.red.contract.test.ts',
  'tests/contract/pre-r0007-remediation-5.red.contract.test.ts',
  'tests/contract/pre-r0007-review-run-1-repairs.red.contract.test.ts',
  'tests/contract/pre-r0007-round-artifact-uniqueness.red.contract.test.ts',
  'tests/contract/r0006-output-totality-cycle5.red.contract.test.ts',
] as const;

function text(path: string): string {
  return readFileSync(path, 'utf8');
}

function listed(config?: string): Array<{ project: string; path: string }> {
  const args = ['vitest', 'list', '--filesOnly'];
  if (config !== undefined) args.push('--config', config);
  const result = spawnSync('pnpm', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('.test.ts'))
    .map((line) => {
      const match = line.match(/^\[([^\]]+)\]\s+(.+)$/u);
      const absolute = match?.[2] ?? line;
      return {
        project: match?.[1] ?? '',
        path: absolute.replace(`${ROOT}/`, ''),
      };
    });
}

describe('DII-255 evidence-preserving scheduler serialization', () => {
  it('declares the exact Architect-bound cohort once in shared workspace tooling', () => {
    expect(existsSync(SCHEDULER)).toBe(true);
    const source = text(SCHEDULER);
    for (const path of SERIALIZED) expect(source.match(new RegExp(path.replaceAll('.', '\\.'), 'gu'))).toHaveLength(1);
    expect(source).toContain('fileParallelism: false');
    expect(source).toContain('groupOrder: 0');
    expect(source).toContain('groupOrder: 1');
    expect(source).not.toMatch(/testTimeout|maxWorkers|VITEST_MAX_WORKERS|DEVAI_R7_DETACHED_GATE/u);
  });

  it('applies the shared disjoint partition to ordinary and merged coverage', () => {
    const root = text(ROOT_CONFIG);
    const coverage = text(COVERAGE_CONFIG);
    expect(root).toContain("from './vitest.scheduler.js'");
    expect(coverage).toContain("from '../../vitest.scheduler.js'");
    for (const source of [root, coverage])
      expect(source).toContain('evidencePreservingProjects(');
  });

  it('retains literal top-level commands, timeouts, cold install, argv roster, and floors', () => {
    const pkg = JSON.parse(text(PACKAGE)) as { scripts: Record<string, string> };
    expect(pkg.scripts['test']).toBe(
      'pnpm devai:prepare && node packages/cli/dist/bin.js sense test all --repo-root . --no-emit-reading',
    );
    expect(pkg.scripts['test:coverage:t1-t3']).toBe(
      'pnpm run devai:prepare && vitest run --config tests/config/t1-t3.coverage.config.ts --coverage.reportsDirectory=scratch/coverage/t1-t3',
    );
    expect(text(resolve(ROOT, 'tests/contract/pre-r0007-close-controls.red.contract.test.ts'))).toContain(
      'vi.setConfig({ testTimeout: 30_000 })',
    );
    const cold = text(resolve(ROOT, 'tests/contract/pre-r0007-remediation-4.red.contract.test.ts'));
    expect(cold).toContain("['install', '--offline', '--frozen-lockfile'");
    expect(cold).toContain('policy.convergence.commands');
    expect(text(resolve(ROOT, 'law/policy/thresholds.json'))).toMatch(
      /"lines": 70[\s\S]*"branches": 60[\s\S]*"functions": 70[\s\S]*"statements": 70/u,
    );
  });

  it('selects every ordinary file exactly once and assigns only the cohort to the serial project', () => {
    const rows = listed();
    expect(new Set(rows.map(({ path }) => path)).size).toBe(rows.length);
    expect(
      rows
        .filter(({ project }) => project === 'detached-candidate-serial')
        .map(({ path }) => path)
        .sort(),
    ).toEqual([...SERIALIZED].sort());
    expect(
      rows
        .filter(({ project }) => project === 'ordinary-parallel')
        .some(({ path }) => SERIALIZED.includes(path as (typeof SERIALIZED)[number])),
    ).toBe(false);
  });

  it('selects every coverage file exactly once with the identical serial cohort', () => {
    const rows = listed('tests/config/t1-t3.coverage.config.ts');
    expect(new Set(rows.map(({ path }) => path)).size).toBe(rows.length);
    expect(
      rows
        .filter(({ project }) => project === 'coverage-detached-candidate-serial')
        .map(({ path }) => path)
        .sort(),
    ).toEqual([...SERIALIZED].sort());
    expect(
      rows
        .filter(({ project }) => project === 'coverage-parallel')
        .some(({ path }) => SERIALIZED.includes(path as (typeof SERIALIZED)[number])),
    ).toBe(false);
  });
});
