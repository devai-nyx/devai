// Invariants: INV-DEVAI-002, INV-DEVAI-003
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const script = join(repositoryRoot, 'scripts/check-governed-sequencing.mjs');
const policy = join(repositoryRoot, 'law/policy/governed-sequencing.json');
const roots: string[] = [];

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, author: string, subject: string, path: string): void {
  put(root, path, `${subject}\n`);
  git(root, ['add', path]);
  git(root, [
    '-c',
    `user.name=${author}`,
    '-c',
    'user.email=role@example.test',
    'commit',
    '-qm',
    subject,
  ]);
}

function fixture(): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), 'devai-sequencing-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, 'law/policy/governed-sequencing.json', readFileSync(policy, 'utf8'));
  commit(root, 'DEVAI Architect', 'chore: establish fixture', 'README.md');
  return { root, base: git(root, ['rev-parse', 'HEAD']) };
}

function check(root: string, base: string): ReturnType<typeof spawnSync> {
  return spawnSync(
    process.execPath,
    [script, '--repo-root', root, '--base', base, '--head', 'HEAD', '--json'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('governed sequencing', () => {
  it('accepts law, red contract, then implementation for one attributed round', () => {
    const { root, base } = fixture();
    commit(root, 'DEVAI Architect', 'law(r0006): declare fixture', 'law/decisions/D-999.md');
    commit(root, 'DEVAI Inspector', 'test(r0006): establish red', 'tests/fixture.test.ts');
    commit(root, 'DEVAI Engineer', 'feat(r0006): repair fixture', 'packages/fixture/index.ts');

    const result = check(root, base);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout as string)).toMatchObject({ ok: true, commits_checked: 3 });
  });

  it('rejects implementation before both governing law and red contract', () => {
    const { root, base } = fixture();
    commit(root, 'DEVAI Engineer', 'feat(r0006): skip the gates', 'packages/fixture/index.ts');

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ rule: 'law-before-implementation' }),
        expect.objectContaining({ rule: 'red-before-repair' }),
      ]),
    });
  });
});
