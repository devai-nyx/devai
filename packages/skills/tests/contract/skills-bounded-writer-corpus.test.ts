// R20.W1 matrix row 6 — applyEditsBounded behavior corpus. Must remain
// table-identical after W2 slice 4 extracts the writer and routes it through
// the authority seam's observe-only passthrough.
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import { applyEditsBounded } from '../../src/skills/index.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import { baseline, canonical } from './r20-harness.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

let worktree = '';
let outside = '';

beforeEach(() => {
  worktree = mkdtempSync(join(tmpdir(), 'r20-bw-'));
  outside = mkdtempSync(join(tmpdir(), 'r20-bw-out-'));
  mkdirSync(join(worktree, 'src'), { recursive: true });
  symlinkSync(outside, join(worktree, 'src/vendor'));
});

afterEach(() => {
  rmSync(worktree, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe('R20 baseline: bounded-writer behavior corpus', () => {
  it('the behavior table matches the baseline byte-for-byte', () => {
    const cases: Array<{
      label: string;
      edits: Array<{ path: string; content: string }>;
      scopes: string[];
    }> = [
      {
        label: 'in-scope simple write',
        edits: [{ path: 'src/ok.ts', content: 'export {};' }],
        scopes: ['src/**'],
      },
      {
        label: 'out-of-scope reject',
        edits: [{ path: 'lib/no.ts', content: 'x' }],
        scopes: ['src/**'],
      },
      {
        label: 'dotdot traversal reject',
        edits: [{ path: '../escape.ts', content: 'x' }],
        scopes: ['**'],
      },
      {
        label: 'absolute path reject',
        edits: [{ path: '/tmp/abs.ts', content: 'x' }],
        scopes: ['**'],
      },
      { label: 'empty path reject', edits: [{ path: '', content: 'x' }], scopes: ['**'] },
      { label: 'dash-prefix reject', edits: [{ path: '-rf', content: 'x' }], scopes: ['**'] },
      {
        label: 'symlink escape reject',
        edits: [{ path: 'src/vendor/pwned.txt', content: 'x' }],
        scopes: ['src/**'],
      },
      {
        label: 'star-star allows everything in tree',
        edits: [{ path: 'anywhere/file.md', content: 'x' }],
        scopes: ['**'],
      },
      {
        label: 'mixed batch: authorized written, unauthorized rejected',
        edits: [
          { path: 'src/a.ts', content: 'a' },
          { path: 'lib/b.ts', content: 'b' },
          { path: 'src/vendor/c.ts', content: 'c' },
          { path: 'src/d.ts', content: 'd' },
        ],
        scopes: ['src/**'],
      },
      {
        label: 'literal-prefix scope match',
        edits: [{ path: 'docs/x.md', content: 'x' }],
        scopes: ['docs/*'],
      },
    ];
    const table = cases.map((c) => {
      const result = applyEditsBounded(worktree, c.edits, c.scopes);
      return { label: c.label, written: result.written, rejected: result.rejected };
    });
    // Post-condition: nothing ever escapes the worktree via the symlink.
    expect(existsSync(join(outside, 'pwned.txt'))).toBe(false);
    expect(existsSync(join(outside, 'c.ts'))).toBe(false);
    const current = canonical({ table });
    const { expected } = baseline('bounded-writer-corpus.json', current);
    expect(current).toBe(expected);
  });
});

// Invariants: INV-DEVAI-015
