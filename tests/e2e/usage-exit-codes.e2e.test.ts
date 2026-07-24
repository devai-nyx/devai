import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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

// R18.B.6 (audit finding M3, D-133): the router's fail-closed contract
// (usage failures exit 2 before side effects, D-129) did not reach the
// command layer — missing required args crashed with raw cac stack traces
// (exit 1) or exited with the legacy EXIT_USAGE=64. One contract, one code:
// every usage failure exits 2 with a one-line usage message and no stack.

const USAGE_CASES: ReadonlyArray<{ label: string; args: readonly string[] }> = [
  { label: 'spec blueprint plan (missing args)', args: ['spec', 'blueprint', 'plan'] },
  { label: 'spec blueprint diff (missing args)', args: ['spec', 'blueprint', 'diff'] },
  { label: 'spec blueprint validate (missing -f)', args: ['spec', 'blueprint', 'validate'] },
  {
    label: 'work db provision (missing --database-url)',
    args: ['work', 'db', 'provision', 'TASK-0042', '--write'],
  },
  {
    label: 'work db drop (missing --database-url)',
    args: ['work', 'db', 'drop', 'TASK-0042', '--write'],
  },
];

describe('command-layer usage failures exit 2 without stack traces (R18.B.6)', () => {
  for (const c of USAGE_CASES) {
    skipIfNotBuilt(
      c.label,
      () => {
        const r = run(c.args);
        const combined = r.stdout + r.stderr;
        expect(r.status, `${c.label}: usage failures exit 2`).toBe(2);
        expect(combined, `${c.label}: no raw stack trace`).not.toMatch(/^\s+at /m);
        expect(combined, `${c.label}: says what is missing or how to use it`).toMatch(
          /required|usage|missing/i,
        );
      },
      CLI_TIMEOUT_MS,
    );
  }

  skipIfNotBuilt(
    'mutation help remains a non-authorizing read',
    () => {
      const r = run(['init', 'apply-owner', '--help']);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('Usage: devai init apply-owner <command>');
      expect(r.stdout).toContain('--help');
      expect(r.stdout + r.stderr).not.toMatch(/AUTHORITY_|required for this invocation/i);
    },
    CLI_TIMEOUT_MS,
  );
});

// Invariants: INV-DEVAI-001
