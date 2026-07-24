import type { spawnSync as spawnSyncType } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { CliLlmClient } from '../../src/llm/cli-client.js';

/**
 * Phase 24.C (closes D-A-24): TimeoutResolverWrapper + error-
 * message tightening. We can't directly import TimeoutResolverWrapper
 * (it's an internal class in factory.ts), but we can exercise its
 * behaviour through createLlmClient by injecting a CliLlmClient
 * with a controllable spawn stub. The CliLlmClient's call-timeout
 * error message bubbles up to the wrapper, which enriches it with
 * the resolution source + a suggested-next-step.
 *
 * Mock backend can't easily simulate timeouts (it returns
 * synthesized responses), so use CliLlmClient with a spawn stub
 * that produces an ETIMEDOUT error on the second call (post-pre-
 * flight).
 */

function makeTimingOutSpawnStub(): typeof spawnSyncType {
  const timeout = Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' });
  const stub = ((_command: string, args?: readonly string[]) => {
    if (args?.length === 1 && args[0] === '--version') {
      // pre-flight succeeds
      return {
        pid: 1,
        output: ['', '1.0.0\n', ''] as Array<string | null>,
        stdout: '1.0.0\n',
        stderr: '',
        status: 0,
        signal: null,
      };
    }
    return {
      pid: 2,
      output: ['', '', ''] as Array<string | null>,
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: timeout,
    };
  }) as unknown as typeof spawnSyncType;
  return stub;
}

describe('CliLlmClient timeout error message structure (Phase 24.C foundation)', () => {
  it('emits "call timed out after Nms" with the actual Nms value, which the wrapper enriches', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      defaultTimeoutMs: 7_777,
      spawn: makeTimingOutSpawnStub(),
    });
    await expect(
      client.complete({ system: '', user: 'q' }, { caller: 'SKILL-feedback-iteration' }),
    ).rejects.toThrow(/call timed out after 7777ms \(pre-flight probe succeeded\)/);
  });

  it('per-call opts.timeout_ms wins over the client default (used by TimeoutResolverWrapper)', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      defaultTimeoutMs: 999_999,
      spawn: makeTimingOutSpawnStub(),
    });
    // The wrapper sets opts.timeout_ms after resolving the registry;
    // CliLlmClient honours it over its own default. The error
    // message carries the per-call value.
    await expect(
      client.complete(
        { system: '', user: 'q' },
        { caller: 'SKILL-assess-state' },
        { timeout_ms: 12_345 },
      ),
    ).rejects.toThrow(/call timed out after 12345ms/);
  });
});
// Invariants: INV-DEVAI-001
