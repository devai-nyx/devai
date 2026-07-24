import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyExactReplacementsBounded,
  readExactBoundedSourceContext,
} from '../../src/skills/bounded-writer.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

let worktree = '';
let outside = '';

beforeEach(() => {
  worktree = mkdtempSync(join(tmpdir(), 'r28-feedback-'));
  outside = mkdtempSync(join(tmpdir(), 'r28-feedback-outside-'));
  mkdirSync(join(worktree, 'packages/cli/src'), { recursive: true });
});

afterEach(() => {
  rmSync(worktree, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe('D-184 exact bounded feedback replacements', () => {
  it('preserves every surrounding byte and applies repeated-file replacements in order', () => {
    const path = 'packages/cli/src/large.ts';
    const before = `${'// preserved\n'.repeat(700)}const oldName = 'old';\nuse(oldName);\n`;
    writeFileSync(join(worktree, path), before);

    const result = applyExactReplacementsBounded(
      worktree,
      [
        { path, find: "const oldName = 'old';", replace: "const stableName = 'new';" },
        { path, find: 'use(oldName);', replace: 'use(stableName);' },
      ],
      [path],
    );

    expect(result).toEqual({ written: [path], rejected: [] });
    expect(readFileSync(join(worktree, path), 'utf8')).toBe(
      before
        .replace("const oldName = 'old';", "const stableName = 'new';")
        .replace('use(oldName);', 'use(stableName);'),
    );
  });

  it.each([
    { label: 'missing', find: 'not present', replace: 'x' },
    { label: 'ambiguous', find: 'repeat', replace: 'x' },
    { label: 'empty', find: '', replace: 'x' },
    { label: 'no-op', find: 'unique', replace: 'unique' },
  ])('rejects a $label anchor atomically before any write', ({ find, replace }) => {
    const first = 'packages/cli/src/first.ts';
    const second = 'packages/cli/src/second.ts';
    writeFileSync(join(worktree, first), 'unique\n');
    writeFileSync(join(worktree, second), 'repeat repeat\n');

    const result = applyExactReplacementsBounded(
      worktree,
      [
        { path: first, find: 'unique', replace: 'changed' },
        { path: second, find, replace },
      ],
      ['packages/cli/src/**'],
    );

    expect(result.written).toEqual([]);
    expect(result.rejected).toContain(second);
    expect(readFileSync(join(worktree, first), 'utf8')).toBe('unique\n');
    expect(readFileSync(join(worktree, second), 'utf8')).toBe('repeat repeat\n');
  });

  it('rejects traversal and symlink escape without touching the outside target', () => {
    writeFileSync(join(outside, 'target.ts'), 'outside\n');
    symlinkSync(outside, join(worktree, 'packages/cli/src/vendor'));

    const result = applyExactReplacementsBounded(
      worktree,
      [
        { path: '../escape.ts', find: 'x', replace: 'y' },
        {
          path: 'packages/cli/src/vendor/target.ts',
          find: 'outside',
          replace: 'changed',
        },
      ],
      ['**'],
    );

    expect(result.written).toEqual([]);
    expect(result.rejected).toHaveLength(2);
    expect(readFileSync(join(outside, 'target.ts'), 'utf8')).toBe('outside\n');
    expect(existsSync(join(worktree, 'escape.ts'))).toBe(false);
  });

  it('grounds only exact declared files and refuses oversize or escaping context', () => {
    const path = 'packages/cli/src/context.ts';
    writeFileSync(join(worktree, path), 'source bytes\n');
    symlinkSync(outside, join(worktree, 'packages/cli/src/vendor'));
    writeFileSync(join(outside, 'secret.ts'), 'outside bytes\n');

    expect(
      readExactBoundedSourceContext(worktree, [path, 'packages/**'], {
        maxFileBytes: 1024,
        maxTotalBytes: 1024,
      }),
    ).toEqual({ files: [{ path, content: 'source bytes\n' }], rejected: [] });

    const refused = readExactBoundedSourceContext(
      worktree,
      [path, 'packages/cli/src/vendor/secret.ts'],
      { maxFileBytes: 5, maxTotalBytes: 1024 },
    );
    expect(refused.files).toEqual([]);
    expect(refused.rejected).toEqual([path, 'packages/cli/src/vendor/secret.ts']);
  });
});

// Invariants: INV-DEVAI-015
