// Invariants: INV-DEVAI-015
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyEditsBounded,
  applyExactReplacementsBounded,
  readExactBoundedSourceContext,
  type BoundedWriteObservation,
} from '../../src/skills/bounded-writer.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function root(prefix = 'devai-bounded-writer-'): string {
  const path = mkdtempSync(join(tmpdir(), prefix));
  roots.push(path);
  return path;
}

function put(base: string, relativePath: string, body: string): string {
  const path = join(base, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return path;
}

describe('bounded source reads and writes', () => {
  it('reads only exact contained files within both byte ceilings', () => {
    const repo = root();
    put(repo, 'packages/demo/a.ts', 'alpha');
    put(repo, 'packages/demo/b.ts', 'bravo!');
    expect(
      readExactBoundedSourceContext(
        repo,
        ['packages/demo/a.ts', 'packages/**', 'packages/demo/b.ts', 'missing.ts'],
        { maxFileBytes: 6, maxTotalBytes: 10 },
      ),
    ).toEqual({
      files: [{ path: 'packages/demo/a.ts', content: 'alpha' }],
      rejected: ['packages/demo/b.ts', 'missing.ts'],
    });
    expect(
      readExactBoundedSourceContext(repo, ['packages/demo/a.ts'], {
        maxFileBytes: -1,
        maxTotalBytes: -1,
      }),
    ).toEqual({ files: [], rejected: ['packages/demo/a.ts'] });
  });

  it('rejects path escapes, directories, symlink escapes, and malformed edit paths', async () => {
    const repo = root();
    const outside = root('devai-bounded-outside-');
    put(outside, 'secret.ts', 'secret');
    mkdirSync(join(repo, 'packages/demo'), { recursive: true });
    symlinkSync(outside, join(repo, 'packages/demo/link'));

    expect(
      readExactBoundedSourceContext(
        repo,
        [
          '',
          '-option',
          '../escape',
          join(outside, 'secret.ts'),
          'packages/demo',
          'packages/demo/link/secret.ts',
        ],
        { maxFileBytes: 100, maxTotalBytes: 100 },
      ).rejected,
    ).toHaveLength(6);

    await withAuthorityHostTestScope(() => {
      const result = applyEditsBounded(
        repo,
        [
          { path: '', content: 'x' },
          { path: '-option', content: 'x' },
          { path: '../escape', content: 'x' },
          { path: join(outside, 'absolute.ts'), content: 'x' },
          { path: 'docs/not-allowed.md', content: 'x' },
          { path: 'packages/demo/link/escaped.ts', content: 'x' },
        ],
        ['packages/**'],
      );
      expect(result.written).toEqual([]);
      expect(result.rejected).toHaveLength(6);
    });
  });

  it('applies exact single-occurrence replacements atomically and reports observations', async () => {
    const repo = root();
    put(repo, 'packages/demo/a.ts', 'alpha beta gamma\n');
    const observations: BoundedWriteObservation[] = [];

    await withAuthorityHostTestScope(() => {
      const result = applyExactReplacementsBounded(
        repo,
        [
          { path: 'packages/demo/a.ts', find: 'alpha', replace: 'ALPHA' },
          { path: 'packages/demo/a.ts', find: 'beta', replace: 'BETA' },
        ],
        ['packages/**'],
        (observation) => observations.push(observation),
      );
      expect(result).toEqual({ written: ['packages/demo/a.ts'], rejected: [] });
    });
    expect(readFileSync(join(repo, 'packages/demo/a.ts'), 'utf8')).toBe('ALPHA BETA gamma\n');
    expect(observations).toEqual([
      { canonical_relative_path: 'packages/demo/a.ts', operation: 'update' },
    ]);
  });

  it('refuses an entire replacement batch when any anchor or target is ambiguous', async () => {
    const repo = root();
    put(repo, 'packages/demo/a.ts', 'repeat repeat unique\n');
    const cases = [
      [],
      [{ path: '../escape', find: 'x', replace: 'y' }],
      [{ path: 'packages/demo/a.ts', find: '', replace: 'y' }],
      [{ path: 'packages/demo/a.ts', find: 'unique', replace: 'unique' }],
      [{ path: 'packages/demo/a.ts', find: 'repeat', replace: 'changed' }],
      [{ path: 'packages/demo/a.ts', find: 'absent', replace: 'changed' }],
    ];
    await withAuthorityHostTestScope(() => {
      for (const replacements of cases) {
        expect(applyExactReplacementsBounded(repo, replacements, ['packages/**']).written).toEqual(
          [],
        );
      }
    });
    expect(readFileSync(join(repo, 'packages/demo/a.ts'), 'utf8')).toBe('repeat repeat unique\n');
  });

  it('creates and updates allowed files while containing observer and parent failures', async () => {
    const repo = root();
    put(repo, 'packages/demo/existing.ts', 'before');
    put(repo, 'packages/demo/blocked-parent', 'file');
    const observations: BoundedWriteObservation[] = [];

    await withAuthorityHostTestScope(() => {
      expect(
        applyEditsBounded(
          repo,
          [
            { path: 'packages/demo/existing.ts', content: 'after' },
            { path: 'packages/demo/new/nested.ts', content: 'new' },
            { path: 'packages/demo/blocked-parent/child.ts', content: 'blocked' },
          ],
          ['**'],
          (observation) => observations.push(observation),
        ),
      ).toEqual({
        written: ['packages/demo/existing.ts', 'packages/demo/new/nested.ts'],
        rejected: ['packages/demo/blocked-parent/child.ts'],
      });
      expect(
        applyEditsBounded(
          repo,
          [{ path: 'packages/demo/observer.ts', content: 'no write' }],
          ['packages/**'],
          () => {
            throw new Error('observer refusal');
          },
        ),
      ).toEqual({ written: [], rejected: ['packages/demo/observer.ts'] });
    });
    expect(observations).toEqual([
      { canonical_relative_path: 'packages/demo/existing.ts', operation: 'update' },
      { canonical_relative_path: 'packages/demo/new/nested.ts', operation: 'create' },
      { canonical_relative_path: 'packages/demo/blocked-parent/child.ts', operation: 'create' },
    ]);
  });
});
