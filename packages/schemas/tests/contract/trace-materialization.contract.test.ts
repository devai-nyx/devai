// Invariants: INV-DEVAI-001
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roots: string[] = [];
const generator = resolve(import.meta.dirname, '../../../../scripts/generate-trace.mjs');

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function put(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function track(root: string): void {
  execFileSync('git', ['add', '.'], { cwd: root });
}

describe('canonical trace materialization', () => {
  it('checks freshness without writes and refuses a self-relaxed completeness floor', () => {
    const root = mkdtempSync(join(tmpdir(), 'devai-trace-materialization-'));
    roots.push(root);
    execFileSync('git', ['init', '-q'], { cwd: root });
    put(root, 'law/invariants/INV-A-001.json', '{}\n');
    put(
      root,
      'packages/demo/tests/unit/a.test.ts',
      '// Invariants: INV-A-001\nexpect(true).toBe(true);\n',
    );
    track(root);
    execFileSync(process.execPath, [generator, root]);
    const canonical = join(root, 'law/trace.json');
    const baseline = readFileSync(canonical, 'utf8');

    put(root, 'law/invariants/INV-B-001.json', '{}\n');
    track(root);
    const incomplete = spawnSync(process.execPath, [generator, root, '--check'], {
      encoding: 'utf8',
    });
    expect(incomplete.status).not.toBe(0);
    expect(incomplete.stderr).toContain('INV-B-001');
    expect(readFileSync(canonical, 'utf8')).toBe(baseline);

    put(
      root,
      'packages/demo/tests/unit/b.test.ts',
      '// Invariants: INV-B-001\nexpect(true).toBe(true);\n',
    );
    track(root);
    const stale = spawnSync(process.execPath, [generator, root, '--check'], {
      encoding: 'utf8',
    });
    expect(stale.status).not.toBe(0);
    expect(stale.stderr).toContain('stale');
    expect(readFileSync(canonical, 'utf8')).toBe(baseline);

    execFileSync(process.execPath, [generator, root]);
    const current = JSON.parse(readFileSync(canonical, 'utf8')) as {
      meta: {
        completeness: {
          min_invariants_with_tests_ratio: number;
          min_must_invariants_with_tests_ratio: number;
        };
      };
    };
    expect(current.meta.completeness).toMatchObject({
      min_invariants_with_tests_ratio: 1,
      min_must_invariants_with_tests_ratio: 1,
    });
    expect(
      spawnSync(process.execPath, [generator, root, '--check'], { encoding: 'utf8' }).status,
    ).toBe(0);
  });

  it('rejects assertion-free rows and binds assertion evidence to exact source bytes', () => {
    const root = mkdtempSync(join(tmpdir(), 'devai-trace-assertions-'));
    roots.push(root);
    execFileSync('git', ['init', '-q'], { cwd: root });
    put(root, 'law/invariants/INV-A-001.json', '{}\n');
    const testPath = 'packages/demo/tests/unit/a.test.ts';
    put(root, testPath, '// Invariants: INV-A-001\nexport {};\n');
    track(root);
    const assertionFree = spawnSync(process.execPath, [generator, root], { encoding: 'utf8' });
    expect(assertionFree.status).not.toBe(0);
    expect(assertionFree.stderr).toContain('no executable assertion sites');

    put(root, testPath, '// Invariants: INV-A-001\nexpect(true).toBe(true);\n');
    track(root);
    execFileSync(process.execPath, [generator, root]);
    const trace = JSON.parse(readFileSync(join(root, 'law/trace.json'), 'utf8')) as {
      test_corpus: Array<{
        assertion_count: number;
        assertion_digest_sha256: string;
      }>;
    };
    expect(trace.test_corpus[0]).toMatchObject({ assertion_count: 1 });
    expect(trace.test_corpus[0]?.assertion_digest_sha256).toMatch(/^[a-f0-9]{64}$/u);

    put(
      root,
      testPath,
      '// Invariants: INV-A-001\n// exact-source drift\nexpect(true).toBe(true);\n',
    );
    track(root);
    const stale = spawnSync(process.execPath, [generator, root, '--check'], { encoding: 'utf8' });
    expect(stale.status).not.toBe(0);
    expect(stale.stderr).toContain('stale');
  });
});
