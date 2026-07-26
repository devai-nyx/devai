import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { destroyWorktree } from '../../src/loop/worktrees.js';
import { withAuthorityHostTestScope } from '../../../skills/tests/unit/authority-host-test-scope.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temp(prefix: string): string {
  const value = mkdtempSync(join(tmpdir(), prefix));
  roots.push(value);
  return value;
}

describe('managed worktree destruction containment', () => {
  it('KR-R5-019 rejects an external mutable-registry path without deleting it', async () => {
    const repo = temp('devai-worktree-repo-');
    const external = temp('devai-worktree-external-');
    const marker = join(external, 'preserve.txt');
    writeFileSync(marker, 'preserve\n');
    const registry = join(repo, '.devai/state/worktrees.json');
    mkdirSync(dirname(registry), { recursive: true });
    writeFileSync(
      registry,
      `${JSON.stringify({
        worktrees: [
          {
            id: 'WT-unsafe',
            path: external,
            branch: 'unsafe',
            created_at: '2026-07-26T00:00:00.000Z',
          },
        ],
      })}\n`,
    );

    await withAuthorityHostTestScope(() => {
      expect(() => destroyWorktree({ repoRoot: repo, id: 'WT-unsafe' })).toThrow(
        'WORKTREE_REGISTRY_PATH_INVALID',
      );
    });
    expect(existsSync(marker)).toBe(true);
  });
});
