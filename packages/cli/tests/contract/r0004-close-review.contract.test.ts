import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, matchesGlob, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../../..');
const TIER_GLOBS = [
  'packages/*/tests/unit/**/*.test.ts',
  'packages/*/tests/contract/**/*.test.ts',
  'tests/contract/**/*.test.ts',
  'tests/integration/**/*.test.ts',
  'tests/regression/**/*.test.ts',
  'tests/e2e/**/*.test.ts',
  'tests/containment/**/*.test.ts',
] as const;
let temporaryRoot = '';

afterEach(() => {
  if (temporaryRoot !== '') rmSync(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = '';
});

function json<T>(relative: string): T {
  return JSON.parse(readFileSync(join(ROOT, relative), 'utf8')) as T;
}

describe('R-0004 first Opus close-review contracts', () => {
  it('collects every tracked test in at least one executing T1-T6 tier', () => {
    expect(readFileSync(join(ROOT, 'tests/config/t2.contract.config.ts'), 'utf8')).toContain(
      "'tests/contract/**/*.test.ts'",
    );
    const tracked = execFileSync('git', ['ls-files', '*test.ts'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter((file) => file.startsWith('tests/') || file.includes('/tests/'));
    expect(tracked.filter((file) => !TIER_GLOBS.some((glob) => matchesGlob(file, glob)))).toEqual(
      [],
    );
    const trace = json<{
      test_corpus: { path: string; suite: string }[];
    }>('law/trace.json');
    expect(trace.test_corpus).toContainEqual({
      path: 'tests/contract/r0004-governed-surface.red.contract.test.ts',
      suite: 'contract',
      invariant_ids: ['INV-DEVAI-017', 'INV-DEVAI-020'],
      lifecycle: 'supported',
    });
  });

  it('registers policy check schemas through the canonical action path', () => {
    const registry = json<{
      counts: { keep: number; fold: number; tombstone: number };
      entries: { action_id: string; internal_binding: string; disposition: string }[];
    }>('law/policy/action-registry.json');
    expect(registry.counts).toEqual({ keep: 147, fold: 38, tombstone: 1 });
    expect(registry.entries).toContainEqual(
      expect.objectContaining({
        action_id: 'policy check schemas',
        internal_binding: 'check schemas',
        disposition: 'keep',
      }),
    );
    const command = readFileSync(join(ROOT, 'packages/cli/src/commands/check/schemas.ts'), 'utf8');
    const router = readFileSync(join(ROOT, 'packages/cli/src/command-router.ts'), 'utf8');
    expect(command).toContain('defineCommand({');
    expect(command).not.toMatch(/export function registerCheckSchemas[\s\S]*?cli\s*\.command/u);
    expect(router).not.toContain("args[2] === 'schemas'");
  });

  it('keeps every declared law-to-config policy materialization byte-identical', () => {
    for (const name of [
      'authority-policy.json',
      'domains.json',
      'forbidden-actions.json',
      'glob-guards.json',
      'scorecard-na.json',
      'subprocess-effects.json',
      'thresholds.json',
    ]) {
      expect(readFileSync(join(ROOT, '.devai/config', name)), name).toEqual(
        readFileSync(join(ROOT, 'law/policy', name)),
      );
    }
  });

  it('renders sensor-note cells exactly from the canonical registry', () => {
    const registry = json<{
      entries: {
        id: string;
        cells: { substrate: string; property: string }[];
        diagnostic?: boolean;
        design_note: { path: string };
      }[];
    }>('law/policy/sensor-registry.json');
    for (const entry of registry.entries) {
      const note = readFileSync(join(ROOT, entry.design_note.path), 'utf8');
      expect(note, entry.id).not.toContain('[object Object]');
      if (entry.diagnostic === true) {
        expect(entry.cells).toEqual([]);
        expect(note).toContain('Standing: diagnostic');
      } else {
        const cells = entry.cells.map((cell) => `${cell.substrate}×${cell.property}`).join(', ');
        expect(note).toContain(`Bound cells: ${cells}.`);
      }
    }
  });

  it('binds declared root porcelain to non-recursive production argv', () => {
    const surface = json<{
      root_porcelain: { build: { argv: string[] }; test: { argv: string[] } };
    }>('work/rounds/R-0004/surface-disposition.json');
    expect(surface.root_porcelain.build.argv).toEqual(['pnpm', '-r', 'build']);
    expect(surface.root_porcelain.test.argv).toEqual(['pnpm', 'vitest', 'run']);
    const testSource = readFileSync(join(ROOT, 'packages/sensors/src/test.ts'), 'utf8');
    expect(testSource).not.toContain("return ['pnpm', 'test']");
    expect(testSource).toContain("return ['pnpm', 'vitest', 'run', '--config'");
  });

  it('rejects an unpinned workflow use in the production workflow checker', () => {
    temporaryRoot = mkdtempSync(join(tmpdir(), 'devai-workflow-pins-'));
    mkdirSync(join(temporaryRoot, '.github/workflows'), { recursive: true });
    writeFileSync(
      join(temporaryRoot, '.github/workflows/fixture.yml'),
      ['name: Fixture', 'on: [push]', 'jobs:', '  check:', '    uses: vendor/action@v1', ''].join(
        '\n',
      ),
    );
    const result = spawnSync('node', [join(ROOT, 'scripts/check-workflows.mjs')], {
      cwd: temporaryRoot,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('immutable 40-hex SHA');
  });
});
