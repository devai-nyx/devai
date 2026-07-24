import type { spawnSync as spawnSyncType } from 'node:child_process';
import { aroundEach, describe, expect, it } from 'vitest';
import {
  CliLlmClient,
  extractJson,
  extractText,
  familyVendor,
  mapUsage,
  messagesToText,
  responseSchemaForMutatingSkill,
  type CliEnvelope,
} from '../../src/llm/index.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

/**
 * Phase 20.C (D-A-6): CLI-bridge LLM backend smoke tests. Mocks
 * `spawn` via the injection seam so the test never touches a real
 * host CLI; pins envelope-parsing precedence (`structured_output`
 * over `result`), fenced-`result` fallback, usage mapping, and
 * exact `--json-schema` argv composition.
 */

function makeSpawnStub(opts: {
  stdout?: string;
  status?: number | null;
  stderr?: string;
  capture?: { command?: string; args?: readonly string[]; options?: unknown };
}): typeof spawnSyncType {
  const stdout = opts.stdout ?? '{}';
  const status = opts.status ?? 0;
  const stderr = opts.stderr ?? '';
  const stub = (command: string, args?: readonly string[], options?: unknown) => {
    const argList = args ?? [];
    if (argList.length === 1 && argList[0] === '--version') {
      return {
        pid: 41,
        output: ['', '1.2.3\n', ''] as Array<string | null>,
        stdout: '1.2.3\n',
        stderr: '',
        status: 0,
        signal: null,
      };
    }
    if (opts.capture !== undefined) {
      opts.capture.command = command;
      opts.capture.args = argList;
      opts.capture.options = options;
    }
    const effectiveStdout =
      command === 'codex'
        ? (() => {
            const envelope = JSON.parse(stdout) as CliEnvelope;
            const finalText =
              envelope.structured_output !== undefined
                ? JSON.stringify(envelope.structured_output)
                : (envelope.result ?? '');
            return [
              JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' }),
              JSON.stringify({
                type: 'item.completed',
                item: { id: 'item-1', type: 'agent_message', text: finalText },
              }),
            ].join('\n');
          })()
        : stdout;
    return {
      pid: 42,
      output: ['', effectiveStdout, stderr] as Array<string | null>,
      stdout: effectiveStdout,
      stderr,
      status,
      signal: null,
    };
  };
  return stub as unknown as typeof spawnSyncType;
}

describe('messagesToText', () => {
  it('joins system + user with role tags', () => {
    const t = messagesToText({ system: 'You are a writer.', user: 'PAYLOAD' });
    expect(t).toContain('[SYSTEM]');
    expect(t).toContain('You are a writer.');
    expect(t).toContain('[USER]');
    expect(t).toContain('PAYLOAD');
  });

  it('omits the system tag when system is empty', () => {
    const t = messagesToText({ system: '', user: 'just user' });
    expect(t).toBe('just user');
  });
});

describe('extractText + extractJson (envelope precedence)', () => {
  it('prefers structured_output over result when both are set', () => {
    const env: CliEnvelope = {
      result: 'chat status string',
      structured_output: { markdown: 'hi' },
    };
    expect(extractText(env)).toBe('{"markdown":"hi"}');
    expect(extractJson(env, { response_format_json: true })).toEqual({ markdown: 'hi' });
  });

  it('strips ```json fences from result when structured_output is absent', () => {
    const env: CliEnvelope = {
      result: '```json\n{"markdown":"fenced"}\n```',
    };
    expect(extractText(env)).toBe('{"markdown":"fenced"}');
    expect(extractJson(env, { response_format_json: true })).toEqual({ markdown: 'fenced' });
  });

  it('returns undefined json when response_format_json is not set', () => {
    const env: CliEnvelope = { result: 'plain text' };
    expect(extractJson(env, undefined)).toBeUndefined();
    expect(extractJson(env, { response_format_json: false })).toBeUndefined();
  });
});

describe('mapUsage', () => {
  it('folds cache_read + cache_creation into input_tokens', () => {
    const u = mapUsage({
      input_tokens: 100,
      output_tokens: 50,
      cache_read_input_tokens: 30,
      cache_creation_input_tokens: 20,
    });
    expect(u.input_tokens).toBe(150);
    expect(u.output_tokens).toBe(50);
  });

  it('defaults missing fields to 0', () => {
    expect(mapUsage(undefined)).toEqual({ input_tokens: 0, output_tokens: 0 });
    expect(mapUsage({})).toEqual({ input_tokens: 0, output_tokens: 0 });
  });
});

describe('familyVendor (Article-23 cross-family helper)', () => {
  it('groups claude + claude-cli under anthropic', () => {
    expect(familyVendor('claude')).toBe('anthropic');
    expect(familyVendor('claude-cli')).toBe('anthropic');
  });
  it('groups codex + codex-cli under openai', () => {
    expect(familyVendor('codex')).toBe('openai');
    expect(familyVendor('codex-cli')).toBe('openai');
  });
  it('treats mock as its own vendor', () => {
    expect(familyVendor('mock')).toBe('mock');
  });
});

describe('CliLlmClient — claude family', () => {
  it('round-trips a structured_output envelope into LlmResponse.json', async () => {
    const stub = { markdown: '# stub\n\nhello' };
    const envelope = {
      structured_output: stub,
      usage: { input_tokens: 100, output_tokens: 50 },
      total_cost_usd: 0.05,
    };
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({ stdout: JSON.stringify(envelope) }),
    });
    const r = await client.complete(
      { system: 'sys', user: 'usr' },
      { caller: 'SKILL-write-overview' },
      { response_format_json: true },
    );
    expect(r.family).toBe('claude-cli');
    expect(r.json).toEqual(stub);
    expect(r.text).toBe(JSON.stringify(stub));
    expect(r.usage.input_tokens).toBe(100);
    expect(r.usage.output_tokens).toBe(50);
    expect(r.usage.cost_usd).toBeCloseTo(0.05);
  });

  it('passes --json-schema only when an exact response schema is supplied', async () => {
    const cap: { args?: readonly string[] } = {};
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({ result: 'hi' }),
        capture: cap,
      }),
    });
    await client.complete({ system: '', user: 'q' }, { caller: 'unit' }, {});
    expect(cap.args).toBeDefined();
    expect((cap.args ?? []).join(' ')).not.toContain('--json-schema');
    const cap2: { args?: readonly string[] } = {};
    const client2 = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({ structured_output: { ok: true } }),
        capture: cap2,
      }),
    });
    const responseSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['ok'],
      properties: { ok: { type: 'boolean' } },
    } as const;
    await client2.complete(
      { system: '', user: 'q' },
      { caller: 'unit' },
      { response_format_json: true, response_json_schema: responseSchema },
    );
    expect((cap2.args ?? []).join(' ')).toContain('--json-schema');
    expect((cap2.args ?? [])[(cap2.args ?? []).indexOf('--json-schema') + 1]).toBe(
      JSON.stringify(responseSchema),
    );
  });

  it('throws a typed error on non-zero CLI exit', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({ status: 2, stderr: 'not logged in', stdout: '' }),
    });
    await expect(client.complete({ system: '', user: 'q' }, { caller: 'unit' })).rejects.toThrow(
      /claude-cli exit=2.*not logged in/,
    );
  });

  it('throws a parse error when stdout is not valid JSON', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({ stdout: 'this is not json' }),
    });
    await expect(client.complete({ system: '', user: 'q' }, { caller: 'unit' })).rejects.toThrow(
      /envelope parse failed/,
    );
  });

  it('uses envelope.model in the response when supplied', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({
          result: 'ok',
          model: 'claude-sonnet-4-6-canary',
        }),
      }),
    });
    const r = await client.complete({ system: '', user: 'q' }, { caller: 'unit' });
    expect(r.model).toBe('claude-sonnet-4-6-canary');
  });

  it('falls back to costOf() when envelope omits total_cost_usd', async () => {
    const client = new CliLlmClient({
      cli: 'claude',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({
          result: 'ok',
          usage: { input_tokens: 1_000_000, output_tokens: 0 },
          // no total_cost_usd
        }),
      }),
    });
    const r = await client.complete({ system: '', user: 'q' }, { caller: 'unit' });
    expect(r.usage.cost_usd).toBe(0);
  });
});

describe('CliLlmClient — codex family', () => {
  it('uses `exec` subcommand and reports family=codex-cli', async () => {
    const cap: { command?: string; args?: readonly string[] } = {};
    const client = new CliLlmClient({
      cli: 'codex',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({ structured_output: { ok: true } }),
        capture: cap,
      }),
    });
    const r = await client.complete(
      { system: 'sys', user: 'usr' },
      { caller: 'SKILL-write-overview' },
      {
        response_format_json: true,
        response_json_schema: responseSchemaForMutatingSkill('SKILL-write-overview'),
      },
    );
    expect(r.family).toBe('codex-cli');
    expect(cap.command).toBe('codex');
    const args = cap.args ?? [];
    expect(args[0]).toBe('exec');
    expect(args[args.indexOf('--model') + 1]).toBe('gpt-5.6-sol');
    expect(args).toContain('--output-schema');
    expect(args).toContain('--json');
    expect(args).not.toContain('--json-schema');
  });

  it('preserves an explicit Codex model override', async () => {
    const cap: { args?: readonly string[] } = {};
    const client = new CliLlmClient({
      cli: 'codex',
      model: 'custom-codex-model',
      spawn: makeSpawnStub({
        stdout: JSON.stringify({ structured_output: { ok: true } }),
        capture: cap,
      }),
    });
    await client.complete(
      { system: 'sys', user: 'usr' },
      { caller: 'SKILL-write-overview' },
      {
        response_format_json: true,
        response_json_schema: responseSchemaForMutatingSkill('SKILL-write-overview'),
      },
    );
    const args = cap.args ?? [];
    expect(args[args.indexOf('--model') + 1]).toBe('custom-codex-model');
  });
});

/**
 * Phase 23.B (D-A-19): pre-flight probe + explicit env propagation.
 * Pins the four post-23.B behaviours that close the C-4 T5 spawn-
 * ETIMEDOUT misdiagnosis:
 *   (1) every `complete()` spawn carries `env: { ...process.env }` so
 *       the child shell sees PATH, DEVAI_LLM_BACKEND, etc.;
 *   (2) the pre-flight `<cli> --version` probe runs before the first
 *       real call and is cached for the instance lifetime;
 *   (3) pre-flight ENOENT → "not on PATH; check shell rc" message;
 *   (4) post-pre-flight ETIMEDOUT at LLM-call time → "call timed out
 *       (pre-flight probe succeeded)", differentiated from
 *       PATH/login messaging.
 */
describe('CliLlmClient — env propagation + pre-flight probe (23.B / D-A-19)', () => {
  it('passes env: { ...process.env } to spawn on the LLM call', async () => {
    const cap: { command?: string; args?: readonly string[]; options?: unknown } = {};
    const sentinel = `DEVAI_23B_SENTINEL_${Date.now()}`;
    process.env[sentinel] = '1';
    try {
      const client = new CliLlmClient({
        cli: 'claude',
        spawn: makeSpawnStub({
          stdout: JSON.stringify({ result: 'ok' }),
          capture: cap,
        }),
      });
      await client.complete({ system: '', user: 'q' }, { caller: 'unit' });
      const opts = cap.options as { env?: NodeJS.ProcessEnv } | undefined;
      expect(opts?.env).toBeDefined();
      expect(opts?.env?.[sentinel]).toBe('1');
      expect(opts?.env?.PATH).toBe(process.env.PATH);
    } finally {
      process.env[sentinel] = undefined;
    }
  });

  it('runs the --version pre-flight exactly once per instance (cached)', async () => {
    const calls: { args: readonly string[] }[] = [];
    const stub = ((command: string, args?: readonly string[]) => {
      calls.push({ args: args ?? [] });
      const isVersion = args?.length === 1 && args[0] === '--version';
      return {
        pid: 1,
        output: ['', isVersion ? '1.0.0\n' : JSON.stringify({ result: 'ok' }), ''] as Array<
          string | null
        >,
        stdout: isVersion ? '1.0.0\n' : JSON.stringify({ result: 'ok' }),
        stderr: '',
        status: 0,
        signal: null,
      };
    }) as unknown as typeof spawnSyncType;
    const client = new CliLlmClient({ cli: 'claude', spawn: stub });
    await client.complete({ system: '', user: 'q1' }, { caller: 'unit' });
    await client.complete({ system: '', user: 'q2' }, { caller: 'unit' });
    await client.complete({ system: '', user: 'q3' }, { caller: 'unit' });
    const versionCalls = calls.filter((c) => c.args.length === 1 && c.args[0] === '--version');
    expect(versionCalls).toHaveLength(1);
    expect(calls).toHaveLength(4);
  });

  it('throws "not on PATH; check shell rc" on pre-flight ENOENT', async () => {
    const enoent = Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' });
    const stub = (() => ({
      pid: -1,
      output: ['', '', ''] as Array<string | null>,
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: enoent,
    })) as unknown as typeof spawnSyncType;
    const client = new CliLlmClient({ cli: 'claude', spawn: stub });
    await expect(client.complete({ system: '', user: 'q' }, { caller: 'unit' })).rejects.toThrow(
      /pre-flight failed: 'claude' not on PATH.*check that your shell rc/i,
    );
  });

  it('throws "did not return within 5s" on pre-flight ETIMEDOUT', async () => {
    const timeout = Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' });
    const stub = (() => ({
      pid: -1,
      output: ['', '', ''] as Array<string | null>,
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: timeout,
    })) as unknown as typeof spawnSyncType;
    const client = new CliLlmClient({ cli: 'claude', spawn: stub });
    await expect(client.complete({ system: '', user: 'q' }, { caller: 'unit' })).rejects.toThrow(
      /pre-flight failed.*did not return within 5s/i,
    );
  });

  it('differentiates ETIMEDOUT after the pre-flight succeeded (real LLM-call timeout)', async () => {
    const timeout = Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' });
    let nthCall = 0;
    const stub = ((_command: string, args?: readonly string[]) => {
      nthCall += 1;
      if (args?.length === 1 && args[0] === '--version') {
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
    const client = new CliLlmClient({ cli: 'claude', spawn: stub });
    await expect(client.complete({ system: '', user: 'q' }, { caller: 'unit' })).rejects.toThrow(
      /call timed out after \d+ms \(pre-flight probe succeeded\)/,
    );
    expect(nthCall).toBe(2);
  });
});
// Invariants: INV-DEVAI-001
