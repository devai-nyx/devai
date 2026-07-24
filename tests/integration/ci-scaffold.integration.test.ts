import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

let tempDir = '';

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'devai-ci-scaffold-cli-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('devai adopt ci scaffold (D-123, item 5)', () => {
  skipIfNotBuilt(
    'plan-only mode reports the target path without writing anything',
    () => {
      const r = run(['adopt', 'ci', 'scaffold', '--repo-root', tempDir]);
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout) as { path: string; exists: boolean };
      expect(out.exists).toBe(false);
      expect(existsSync(out.path)).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write writes a workflow calling the pinned reusable-evidence-gate.yml',
    () => {
      const r = run([
        'adopt',
        'ci',
        'scaffold',
        '--repo-root',
        tempDir,
        '--devai-ref',
        'v0.4.0',
        '--write',
      ]);
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout) as { path: string; written: boolean };
      expect(out.written).toBe(true);
      const content = readFileSync(out.path, 'utf8');
      expect(content).toContain('reusable-evidence-gate.yml@v0.4.0');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write without --force refuses to clobber an existing file',
    () => {
      const outputPath = join(tempDir, '.github/workflows/gates.yml');
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, 'hand-authored, do not clobber');
      const r = run([
        'adopt',
        'ci',
        'scaffold',
        '--repo-root',
        tempDir,
        '--output',
        outputPath,
        '--write',
      ]);
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout) as { written: boolean; reason?: string };
      expect(out.written).toBe(false);
      expect(readFileSync(outputPath, 'utf8')).toBe('hand-authored, do not clobber');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write --force overwrites an existing file',
    () => {
      const outputPath = join(tempDir, '.github/workflows/gates.yml');
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, 'stale');
      const r = run([
        'adopt',
        'ci',
        'scaffold',
        '--repo-root',
        tempDir,
        '--output',
        outputPath,
        '--write',
        '--force',
      ]);
      expect(r.status).toBe(0);
      const content = readFileSync(outputPath, 'utf8');
      expect(content).toContain('devai-gates');
      expect(content).not.toBe('stale');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    'rejects an unknown --mode value with EXIT_USAGE',
    () => {
      const r = run(['adopt', 'ci', 'scaffold', '--repo-root', tempDir, '--mode', 'bogus']);
      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain('--mode must be one of');
    },
    CLI_TIMEOUT_MS,
  );
});
// Invariants: INV-SCAFFOLD-001
// Invariants: INV-DEVAI-013
