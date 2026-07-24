import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = join(
  HERE,
  '..',
  '..',
  'packages',
  'cli',
  'tests',
  'fixtures',
  'authorized-cli-test-driver.mjs',
);

const skipIfNotBuilt = existsSync(BIN) ? it : it.skip;
const CLI_TIMEOUT_MS = 30_000;

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('node', [BIN, ...args], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function initializeGitRepository(): void {
  expect(spawnSync('git', ['init', '-b', 'main'], { cwd: tempDir }).status).toBe(0);
  writeFileSync(join(tempDir, 'README.md'), 'fixture\n');
  expect(spawnSync('git', ['add', 'README.md'], { cwd: tempDir }).status).toBe(0);
  expect(
    spawnSync(
      'git',
      [
        '-c',
        'user.name=DEVAI Test',
        '-c',
        'user.email=devai-test@example.invalid',
        'commit',
        '-m',
        'test: initialize fixture',
      ],
      { cwd: tempDir },
    ).status,
  ).toBe(0);
}

let tempDir = '';

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'devai-hooks-install-cli-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('devai adopt hooks install (D-123, item 5)', () => {
  skipIfNotBuilt(
    'plan-only mode reports the target without writing anything',
    () => {
      const r = run(['adopt', 'hooks', 'install', '--repo-root', tempDir]);
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout) as { action: string; path: string };
      expect(out.action).toBe('create');
      expect(existsSync(out.path)).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write writes an executable pre-push hook using .git/hooks when no husky dir exists',
    () => {
      const r = run(['adopt', 'hooks', 'install', '--repo-root', tempDir, '--write']);
      expect(r.status).toBe(0);
      const hookPath = join(tempDir, '.git/hooks/pre-push');
      expect(existsSync(hookPath)).toBe(true);
      expect(readFileSync(hookPath, 'utf8')).toContain(
        'devai policy check forbidden actions --strict',
      );
      expect(statSync(hookPath).mode & 0o777).toBe(0o755);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    'prefers .husky/<hook> over .git/hooks when a .husky dir is present',
    () => {
      mkdirSync(join(tempDir, '.husky'), { recursive: true });
      const r = run([
        'adopt',
        'hooks',
        'install',
        '--repo-root',
        tempDir,
        '--hook',
        'pre-commit',
        '--write',
      ]);
      expect(r.status).toBe(0);
      expect(existsSync(join(tempDir, '.husky/pre-commit'))).toBe(true);
      expect(existsSync(join(tempDir, '.git/hooks/pre-commit'))).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    'accepts a non-mutating post-merge installation plan',
    () => {
      const r = run(['adopt', 'hooks', 'install', '--repo-root', tempDir, '--hook', 'post-merge']);
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout) as { hook: string; path: string; command: string };
      expect(out.hook).toBe('post-merge');
      expect(out.path).toBe(join(tempDir, '.git/hooks/post-merge'));
      expect(out.command).toContain('devai govern auditor post-merge --host-receipt');
      expect(existsSync(out.path)).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    'allows only Architect authority to install the post-merge adapter',
    () => {
      initializeGitRepository();
      mkdirSync(join(tempDir, 'law'), { recursive: true });
      writeFileSync(
        join(tempDir, 'law', 'constitution.md'),
        readFileSync(join(HERE, '..', '..', 'law', 'constitution.md'), 'utf8'),
      );
      const materialized = run([
        'adopt',
        'upgrade',
        '--target',
        tempDir,
        '--as-role',
        'architect',
        '--write',
      ]);
      expect(materialized.status, materialized.stderr).toBe(0);

      const engineer = run([
        'adopt',
        'hooks',
        'install',
        '--repo-root',
        tempDir,
        '--hook',
        'post-merge',
        '--as-role',
        'engineer',
        '--write',
      ]);
      expect(engineer.status).not.toBe(0);
      expect(`${engineer.stdout}\n${engineer.stderr}`).toContain('authority human role denied');
      expect(existsSync(join(tempDir, '.git/hooks/post-merge'))).toBe(false);

      const architect = run([
        'adopt',
        'hooks',
        'install',
        '--repo-root',
        tempDir,
        '--hook',
        'post-merge',
        '--as-role',
        'architect',
        '--write',
      ]);
      expect(architect.status, architect.stderr).toBe(0);
      const hookPath = join(tempDir, '.git/hooks/post-merge');
      expect(existsSync(hookPath)).toBe(true);
      expect(readFileSync(hookPath, 'utf8')).toContain('devai govern auditor post-merge');
      expect(existsSync(join(tempDir, '.devai/config/post-merge-host-adapter.json'))).toBe(true);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--format human output names the manager, hook, and command',
    () => {
      const r = run(['adopt', 'hooks', 'install', '--repo-root', tempDir, '--format', 'human']);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('would create');
      expect(r.stdout).toContain('pre-push');
      expect(r.stdout).toContain('devai policy check forbidden actions --strict');
    },
    CLI_TIMEOUT_MS,
  );
});
// Invariants: INV-DEVAI-013
