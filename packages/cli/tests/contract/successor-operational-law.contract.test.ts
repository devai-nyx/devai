import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PKG_ROOT = join(import.meta.dirname, '..', '..');
const ROOT = join(PKG_ROOT, '..', '..');
const BIN = join(PKG_ROOT, 'dist', 'bin.js');
const DRIVER = join(PKG_ROOT, 'tests', 'fixtures', 'authorized-cli-test-driver.mjs');
const cliIt = existsSync(BIN) ? it : it.skip;

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [DRIVER, ...args], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('successor operational law', () => {
  cliIt('validates all twelve successor ADRs through the production command', () => {
    const result = run(['policy', 'check', 'adrs', '--repo-root', ROOT]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      files_scanned: number;
      errors: unknown[];
      adrs: unknown[];
    };
    expect(report).toMatchObject({ ok: true, files_scanned: 12, errors: [] });
    expect(report.adrs).toHaveLength(12);
  });

  cliIt('evaluates non-vacuous successor glob guards through the production command', () => {
    const result = run(['policy', 'check', 'glob', 'guards', '--repo-root', ROOT]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      registry_entries: number;
      failing: string[];
      results: Array<{ min_matches: number; match_count: number; pattern: string }>;
    };
    expect(report.ok).toBe(true);
    expect(report.registry_entries).toBeGreaterThanOrEqual(3);
    expect(report.failing).toEqual([]);
    for (const guard of report.results) {
      expect(guard.min_matches, guard.pattern).toBeGreaterThan(0);
      expect(guard.match_count, guard.pattern).toBeGreaterThanOrEqual(guard.min_matches);
      expect(guard.pattern).toMatch(/^(?:law|product|work|record|packages|tests)\//);
    }
  });

  cliIt('resolves the successor trace through a materialized domains policy', () => {
    const result = run(['spec', 'validate', 'trace', '--repo-root', ROOT]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      errors: unknown[];
      files_scanned: number;
      trace_invariants_count: number;
    };
    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.files_scanned).toBeGreaterThan(0);
    expect(report.trace_invariants_count).toBeGreaterThan(0);
  });

  it('makes every declared forbidden action detectable and protects successor law paths', () => {
    const registry = JSON.parse(
      readFileSync(join(ROOT, '.devai', 'config', 'forbidden-actions.json'), 'utf8'),
    ) as {
      actions: Array<{ id: string; detect_patterns?: string[] }>;
    };
    for (const action of registry.actions) {
      expect(action.detect_patterns, `${action.id} has detection semantics`).toBeDefined();
      expect(action.detect_patterns?.length ?? 0, action.id).toBeGreaterThan(0);
    }
    const patterns = registry.actions.flatMap((action) => action.detect_patterns ?? []);
    for (const probe of [
      'git rm law/constitution.md',
      'git rm work/rounds/R-0002/plan.md',
      'git rm work/audit/R-0002/opening-audit.md',
    ]) {
      expect(
        patterns.some((pattern) => new RegExp(pattern, 'i').test(probe)),
        `forbidden-action registry covers: ${probe}`,
      ).toBe(true);
    }
  });
});
