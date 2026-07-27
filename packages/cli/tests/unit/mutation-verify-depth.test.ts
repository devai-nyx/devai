// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';
import { mutationVerify } from '../../src/commands/mutation/verify.js';

const root = mkdtempSync(join(tmpdir(), 'devai-mutation-verify-'));
const originalExit = process.exit;
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

interface Options {
  readonly baseline?: string;
  readonly current?: string;
  readonly thresholds?: string;
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly saveBaseline?: boolean;
}

interface CommandCapture {
  option(): CommandCapture;
  action(callback: (options: Options) => void): CommandCapture;
}

let invoke: (options: Options) => void;

beforeAll(() => {
  const command: CommandCapture = {
    option: () => command,
    action(callback) {
      invoke = callback;
      return command;
    },
  };
  mutationVerify.register({ command: () => command } as unknown as CAC);
});

afterEach(() => {
  process.exit = originalExit;
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

async function run(options: Options) {
  let stdout = '';
  let stderr = '';
  process.exitCode = undefined;
  process.exit = ((code?: number) => {
    process.exitCode = code ?? 0;
    return undefined as never;
  }) as typeof process.exit;
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  await withAuthorityHostTestScope(() => invoke({ repoRoot: root, ...options }));
  return { stdout, stderr, exit: process.exitCode ?? 0 };
}

describe('mutation verification command depth', () => {
  it('reports a missing current result as usage failure', async () => {
    const result = await run({ current: 'missing.json' });
    expect(result.exit).toBe(2);
    expect(result.stderr).toContain('--current report not found');
  });

  it('finds threshold and baseline regressions across direct and nested report shapes', async () => {
    writeFileSync(
      join(root, 'current.json'),
      JSON.stringify({ metrics: { mutationScore: 70, survived: 5 } }),
    );
    writeFileSync(join(root, 'baseline.json'), JSON.stringify({ mutation_score: 80, survived: 2 }));
    writeFileSync(
      join(root, 'thresholds.json'),
      JSON.stringify({ mutation: { score_min: 75, survived_max: 3 } }),
    );
    const result = await run({
      current: 'current.json',
      baseline: 'baseline.json',
      thresholds: 'thresholds.json',
    });
    expect(result.exit).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false });
    expect(JSON.parse(result.stdout).findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'below_threshold' })]),
    );
  });

  it('passes absent optional inputs and renders n/a values for humans', async () => {
    writeFileSync(join(root, 'empty.json'), '{}');
    const result = await run({ current: 'empty.json', human: true });
    expect(result.exit).toBe(0);
    expect(result.stdout).toContain('score=n/a% survived=n/a');
  });

  it('ratchets a clean baseline and reports it in both human and JSON modes', async () => {
    writeFileSync(join(root, 'clean.json'), JSON.stringify({ mutation_score: 99, survived: 0 }));
    const json = await run({
      current: 'clean.json',
      baseline: 'saved/baseline.json',
      saveBaseline: true,
    });
    expect(JSON.parse(json.stdout)).toMatchObject({ ok: true, saved_baseline: true });
    expect(readFileSync(join(root, 'saved/baseline.json'), 'utf8')).toContain('mutation_score');
    const human = await run({
      current: 'clean.json',
      baseline: 'saved/baseline-2.json',
      saveBaseline: true,
      human: true,
    });
    expect(human.stdout).toContain('baseline ratcheted');
  });

  it('converts malformed JSON into a fail-closed command error', async () => {
    mkdirSync(join(root, 'bad'), { recursive: true });
    writeFileSync(join(root, 'bad/current.json'), '{');
    const result = await run({ current: 'bad/current.json' });
    expect(result.exit).toBe(2);
    expect(result.stderr).toContain('devai sense mutation verify:');
  });
});
