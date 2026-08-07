import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = join(HERE, '..', '..', 'packages', 'cli', 'dist', 'bin.js');

const skipIfNotBuilt = existsSync(BIN) ? it : it.skip;
const CLI_TIMEOUT_MS = 30_000;

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('node', [BIN, ...args], {
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

interface ActionEnvelope {
  readonly action_id: string;
  readonly ok: boolean;
  readonly result?: { readonly value: unknown };
  readonly error?: {
    readonly code: string;
    readonly class: string;
    readonly exit: number;
    readonly message: string;
    readonly remediation?: string;
  };
}

function envelope(text: string): ActionEnvelope {
  return JSON.parse(text) as ActionEnvelope;
}

function expectFoldedRoute(): void {
  const refusal = run(['adopt', 'ci', 'scaffold', '--format', 'json']);
  expect(refusal.status).toBe(2);
  expect(refusal.stdout).toBe('');
  expect(envelope(refusal.stderr)).toMatchObject({
    action_id: 'adopt ci scaffold',
    ok: false,
    error: {
      code: 'ACTION_FOLDED',
      class: 'routing-authority',
      exit: 2,
      remediation: 'init apply harness --include ci',
    },
  });
}

function materializeAuthorityPolicy(): void {
  const materialized = run([
    'init',
    'upgrade',
    '--target',
    tempDir,
    '--as-role',
    'architect',
    '--write',
    '--format',
    'json',
  ]);
  expect(materialized.status, materialized.stderr).toBe(0);
  expect(envelope(materialized.stdout)).toMatchObject({
    action_id: 'init upgrade',
    ok: true,
  });
  expect(existsSync(join(tempDir, '.devai/config/authority-policy.json'))).toBe(true);
}

function applyCi(extra: readonly string[] = []): ReturnType<typeof run> {
  return run(['init', 'apply', 'harness', '--target', tempDir, '--include', 'ci', ...extra]);
}

let tempDir = '';

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'devai-ci-scaffold-cli-'));
  const pinDirectory = join(tempDir, '.devai/pin');
  mkdirSync(pinDirectory, { recursive: true });
  writeFileSync(
    join(pinDirectory, 'constitution.md'),
    readFileSync(join(HERE, '..', '..', 'law', 'constitution.md'), 'utf8'),
  );
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('devai init apply harness --include ci (D-123, item 5)', () => {
  skipIfNotBuilt(
    'refuses missing write consent without writing the target',
    () => {
      expectFoldedRoute();
      const outputPath = join(tempDir, '.github/workflows/devai-gates.yml');
      const r = applyCi(['--as-role', 'architect', '--format', 'json']);
      expect(r.status).toBe(2);
      expect(r.stdout).toBe('');
      expect(envelope(r.stderr)).toMatchObject({
        action_id: 'init apply harness',
        ok: false,
        error: {
          class: 'routing-authority',
          exit: 2,
          message: expect.stringContaining('local mutation requires --write'),
        },
      });
      expect(existsSync(outputPath)).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write writes a workflow calling the pinned reusable-evidence-gate.yml',
    () => {
      materializeAuthorityPolicy();
      const r = applyCi([
        '--devai-ref',
        'v0.4.0',
        '--as-role',
        'architect',
        '--write',
        '--format',
        'json',
      ]);
      expect(r.status, r.stderr).toBe(0);
      expect(envelope(r.stdout)).toMatchObject({
        action_id: 'init apply harness',
        ok: true,
      });
      const content = readFileSync(join(tempDir, '.github/workflows/devai-gates.yml'), 'utf8');
      expect(content).toContain('reusable-evidence-gate.yml@v0.4.0');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write without --force refuses to clobber an existing file',
    () => {
      materializeAuthorityPolicy();
      const outputPath = join(tempDir, '.github/workflows/gates.yml');
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, 'hand-authored, do not clobber');
      const r = applyCi([
        '--output',
        outputPath,
        '--as-role',
        'architect',
        '--write',
        '--format',
        'json',
      ]);
      expect(r.status, r.stderr).toBe(0);
      expect(envelope(r.stdout)).toMatchObject({
        action_id: 'init apply harness',
        ok: true,
        result: {
          value: {
            included: [{ component: 'ci', result: { written: false, reason: expect.any(String) } }],
          },
        },
      });
      expect(readFileSync(outputPath, 'utf8')).toBe('hand-authored, do not clobber');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    '--write --force overwrites an existing file',
    () => {
      materializeAuthorityPolicy();
      const outputPath = join(tempDir, '.github/workflows/gates.yml');
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, 'stale');
      const r = applyCi([
        '--output',
        outputPath,
        '--as-role',
        'architect',
        '--write',
        '--force',
        '--format',
        'json',
      ]);
      expect(r.status, r.stderr).toBe(0);
      expect(envelope(r.stdout)).toMatchObject({
        action_id: 'init apply harness',
        ok: true,
        result: { value: { included: [{ component: 'ci', result: { written: true } }] } },
      });
      const content = readFileSync(outputPath, 'utf8');
      expect(content).toContain('devai-gates');
      expect(content).not.toBe('stale');
    },
    CLI_TIMEOUT_MS,
  );

  skipIfNotBuilt(
    'rejects an unknown --mode value with EXIT_USAGE',
    () => {
      materializeAuthorityPolicy();
      const outputPath = join(tempDir, '.github/workflows/devai-gates.yml');
      const r = applyCi([
        '--mode',
        'bogus',
        '--as-role',
        'architect',
        '--write',
        '--format',
        'json',
      ]);
      expect(r.status).toBe(2);
      expect(r.stdout).toBe('');
      expect(envelope(r.stderr)).toMatchObject({
        action_id: 'init apply harness',
        ok: false,
        error: {
          class: 'routing-authority',
          exit: 2,
          message: expect.stringContaining('--mode must be one of'),
        },
      });
      expect(existsSync(outputPath)).toBe(false);
    },
    CLI_TIMEOUT_MS,
  );
});
// Invariants: INV-SCAFFOLD-001
// Invariants: INV-DEVAI-013
