// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeArgv } from '../../src/command-router.js';
import { ACTION_REGISTRY } from '../../src/generated/action-registry.js';

const originalArgv = [...process.argv];
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;
const originalExit = process.exit;

afterEach(() => {
  process.argv = [...originalArgv];
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  process.exit = originalExit;
});

async function run(args: readonly string[]): Promise<{
  stdout: string;
  stderr: string;
  exit: number;
}> {
  vi.resetModules();
  let stdout = '';
  let stderr = '';
  process.argv = ['node', 'devai', ...args, '--format', 'json'];
  process.exitCode = undefined;
  process.stdout.write = ((chunk: unknown) => {
    stdout += typeof chunk === 'string' ? chunk : String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += typeof chunk === 'string' ? chunk : String(chunk);
    return true;
  }) as typeof process.stderr.write;
  await import('../../src/bin.js');
  await new Promise<void>((done) => setImmediate(done));
  return {
    stdout,
    stderr,
    exit: typeof process.exitCode === 'number' ? process.exitCode : 0,
  };
}

const kept = ACTION_REGISTRY.filter((entry) => entry.disposition === 'keep');
const retired = ACTION_REGISTRY.filter((entry) => entry.disposition !== 'keep');

const expectedCatalog = kept.map((entry) => ({
  name: entry.action_id,
  previous_name: entry.internal_binding,
  path: entry.path,
  lifecycle: entry.lifecycle,
  lifecycle_reason: entry.lifecycle_reason,
  promotion_criteria: entry.promotion_criteria,
  visibility: entry.visibility,
  tier: entry.tier,
  profiles: entry.profiles,
  effects: entry.effect,
  authority: entry.authority ?? 'mesh_controller',
  description: entry.description,
  authority_contract_version: entry.authority_contract_version,
}));

describe('public read-action runtime seams', () => {
  it('catalog actions returns the exact 42 kept actions in canonical registry order', async () => {
    expect(kept).toHaveLength(42);

    const result = await run(['catalog', 'actions']);
    expect(result.exit, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual({
      schemaVersion: '1.0.0',
      action_id: 'catalog actions',
      ok: true,
      result: {
        media_type: 'application/json',
        value: expectedCatalog,
      },
    });
  }, 30_000);

  it('keeps every fold and tombstone router-only with exact migration guidance', () => {
    expect(retired).toHaveLength(180);

    const violations = retired.flatMap((entry) => {
      const result = routeArgv(
        ['node', 'devai', ...entry.path, '--format', 'json'],
        [],
        '1.0.0-contract',
      );
      if (result.kind !== 'output') return [`${entry.action_id}:dispatched`];
      if (result.exitCode !== 2) return [`${entry.action_id}:exit=${String(result.exitCode)}`];
      const error = JSON.parse(result.text) as {
        readonly code?: string;
        readonly class?: string;
        readonly exit?: number;
        readonly remediation?: string;
        readonly context?: {
          readonly action?: string;
          readonly disposition?: string;
          readonly migration?: string | null;
        };
      };
      const f5Vocabulary = entry.action_id === 'init apply-f5';
      const expectedCode = f5Vocabulary
        ? 'CLI_VOCABULARY_RETIRED'
        : entry.disposition === 'fold'
          ? 'ACTION_FOLDED'
          : 'ACTION_TOMBSTONED';
      const expectedRemediation = f5Vocabulary ? 'Use devai init apply harness.' : entry.migration;
      const context = error.context;
      return error.code === expectedCode &&
        error.class === 'routing-authority' &&
        error.exit === 2 &&
        error.remediation === expectedRemediation &&
        (f5Vocabulary ||
          (context !== undefined &&
            context.action === entry.action_id &&
            context.disposition === entry.disposition &&
            context.migration === entry.migration))
        ? []
        : [`${entry.action_id}:${JSON.stringify(error)}`];
    });

    expect(violations).toEqual([]);
  });
});
