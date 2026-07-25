// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateTestTrace } from '../../src/spec/test-trace-validator.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function root(): string {
  const path = mkdtempSync(join(tmpdir(), 'devai-test-trace-'));
  roots.push(path);
  return path;
}

function put(base: string, relativePath: string, body: string): string {
  const path = join(base, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return path;
}

function invariant(base: string, id: string, lifecycle?: 'supported' | 'experimental'): void {
  put(
    base,
    `law/invariants/${id}.json`,
    JSON.stringify({ id, ...(lifecycle === undefined ? {} : { lifecycle }) }),
  );
}

describe('canonical test-trace validation', () => {
  it('accepts an exact corpus and counts supported and experimental tests', () => {
    const repo = root();
    invariant(repo, 'INV-DEMO-001');
    invariant(repo, 'INV-DEMO-002', 'experimental');
    put(repo, 'packages/demo/tests/unit/a.test.ts', '// Invariants: INV-DEMO-001\n');
    put(repo, 'tests/integration/b.test.ts', '// Invariants: INV-DEMO-002\n');
    put(
      repo,
      'law/trace.json',
      JSON.stringify({
        test_corpus: [
          {
            path: 'packages/demo/tests/unit/a.test.ts',
            invariant_ids: ['INV-DEMO-001'],
            lifecycle: 'supported',
          },
          {
            path: 'tests/integration/b.test.ts',
            invariant_ids: ['INV-DEMO-002'],
            lifecycle: 'experimental',
          },
        ],
        invariants: [
          {
            id: 'INV-DEMO-001',
            tests: [{ path: 'packages/demo/tests/unit/a.test.ts' }],
          },
          { id: 'INV-DEMO-002', tests: [{ path: 'tests/integration/b.test.ts' }] },
        ],
      }),
    );

    expect(validateTestTrace({ repoRoot: repo })).toEqual({
      ok: true,
      errors: [],
      files_scanned: 2,
      discovered_test_files: 2,
      referenced_test_files: 2,
      supported_test_files: 1,
      experimental_test_files: 1,
    });
  });

  it('reports marker, lifecycle, corpus, and stale-path defects together', () => {
    const repo = root();
    invariant(repo, 'INV-DEMO-001');
    invariant(repo, 'INV-DEMO-002', 'experimental');
    put(repo, 'law/invariants/malformed.json', '{');
    put(repo, 'packages/demo/dist/ignored.test.ts', '// Invariants: INV-DEMO-001\n');
    put(repo, 'packages/demo/node_modules/ignored.test.ts', '// Invariants: INV-DEMO-001\n');
    put(repo, 'packages/demo/tests/unit/unmarked.test.ts', 'export {};\n');
    put(
      repo,
      'packages/demo/tests/unit/mixed.test.ts',
      '// Invariants: INV-DEMO-001, INV-DEMO-001, INV-DEMO-002, INV-MISSING-999\n',
    );
    put(
      repo,
      'law/trace.json',
      JSON.stringify({
        test_corpus: [
          {
            path: 'packages/demo/tests/unit/mixed.test.ts',
            invariant_ids: ['INV-DEMO-001'],
            lifecycle: 'experimental',
          },
          {
            path: 'packages/demo/tests/unit/mixed.test.ts',
            invariant_ids: ['INV-DEMO-002'],
            lifecycle: 'experimental',
          },
          {
            path: 'packages/demo/tests/unit/stale.test.ts',
            invariant_ids: ['INV-DEMO-001'],
            lifecycle: 'supported',
          },
        ],
        invariants: [
          { id: 'INV-DEMO-001', tests: [{ path: 'packages/demo/tests/unit' }] },
          { id: 'INV-DEMO-002', tests: [{ path: 'missing.test.ts' }] },
        ],
      }),
    );

    const result = validateTestTrace({ repoRoot: repo });
    expect(result.ok).toBe(false);
    expect(result.discovered_test_files).toBe(2);
    expect(result.referenced_test_files).toBe(1);
    expect(result.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('missing invariant marker'),
        expect.stringContaining('duplicate invariant reference'),
        expect.stringContaining('unknown invariant'),
        expect.stringContaining('mixed invariant lifecycles'),
        expect.stringContaining('duplicate canonical test mapping'),
        expect.stringContaining('stale trace path'),
        expect.stringContaining('absent from trace.test_corpus'),
        expect.stringContaining('canonical invariant mapping differs'),
      ]),
    );
  });

  it('fails closed for a missing or malformed trace and absent invariant catalog', () => {
    const missing = root();
    put(missing, 'packages/demo/tests/unit/a.test.ts', '// Invariants: INV-MISSING-001\n');
    const missingResult = validateTestTrace({ repoRoot: missing });
    expect(missingResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('unknown invariant') }),
        expect.objectContaining({ message: 'trace file missing' }),
        expect.objectContaining({ message: 'test is absent from trace.test_corpus' }),
      ]),
    );

    const malformed = root();
    put(malformed, 'law/trace.json', '{');
    expect(validateTestTrace({ repoRoot: malformed })).toMatchObject({
      ok: false,
      discovered_test_files: 0,
      referenced_test_files: 0,
      errors: [expect.objectContaining({ message: expect.stringContaining('parse error') })],
    });
  });
});
