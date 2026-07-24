import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import * as skills from '../../packages/skills/src/skills/index.js';
import { withAuthorityHostTestScope } from '../../packages/skills/tests/unit/authority-host-test-scope.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

// R18.B.2 (audit finding H5, D-133): applyEditsBounded rejected '..' and
// absolute paths but used a literal-prefix scope check with no realpath /
// symlink containment — a symlinked directory inside the worktree pointing
// outside it lets a scoped relative path write outside the boundary. This
// test expects the function exported (it was module-private) and expects
// realpath containment. Red at declaration on the export assertion.

interface ApplyEditsBounded {
  (
    worktreeRoot: string,
    edits: ReadonlyArray<{ path: string; content: string }>,
    allowedScopes: ReadonlyArray<string>,
  ): { written: string[]; rejected: string[] };
}

let worktree = '';
let outside = '';

beforeEach(() => {
  worktree = mkdtempSync(join(tmpdir(), 'devai-r18-wt-'));
  outside = mkdtempSync(join(tmpdir(), 'devai-r18-outside-'));
});

afterEach(() => {
  rmSync(worktree, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe('applyEditsBounded realpath containment (R18.B.2)', () => {
  it('is exported for direct contract testing', () => {
    expect(
      (skills as Record<string, unknown>)['applyEditsBounded'],
      'applyEditsBounded must be exported (R18.C.2)',
    ).toBeTypeOf('function');
  });

  it('rejects a scoped relative path that traverses a symlink out of the worktree', () => {
    const fn = (skills as Record<string, unknown>)['applyEditsBounded'] as
      ApplyEditsBounded | undefined;
    expect(fn, 'applyEditsBounded must be exported (R18.C.2)').toBeTypeOf('function');
    if (fn === undefined) return;

    // src/vendor -> <outside>: an in-scope prefix whose realpath escapes.
    mkdirSync(join(worktree, 'src'), { recursive: true });
    symlinkSync(outside, join(worktree, 'src/vendor'));

    const result = fn(worktree, [{ path: 'src/vendor/pwned.txt', content: 'escaped' }], ['src/**']);

    expect(result.written).toEqual([]);
    expect(result.rejected).toContain('src/vendor/pwned.txt');
    expect(
      existsSync(join(outside, 'pwned.txt')),
      'nothing may be written outside the worktree',
    ).toBe(false);
  });

  it('still writes an ordinary in-scope path (guard against over-tightening)', () => {
    const fn = (skills as Record<string, unknown>)['applyEditsBounded'] as
      ApplyEditsBounded | undefined;
    expect(fn, 'applyEditsBounded must be exported (R18.C.2)').toBeTypeOf('function');
    if (fn === undefined) return;

    execSync('true'); // keep import used consistently across suites
    writeFileSync(join(worktree, 'README.md'), 'x');
    const result = fn(worktree, [{ path: 'src/ok.ts', content: 'export {};' }], ['src/**']);
    expect(result.rejected).toEqual([]);
    expect(result.written).toEqual(['src/ok.ts']);
    expect(existsSync(join(worktree, 'src/ok.ts'))).toBe(true);
  });
});

// Invariants: INV-DEVAI-015
