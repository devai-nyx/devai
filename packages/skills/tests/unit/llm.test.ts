import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MockLlmClient,
  RateLimitedLlmClient,
  costOf,
  createLlmClient,
  getUsageLogPath,
  messagesFromComposition,
  metaFromComposition,
  resetUsageCounters,
} from '../../src/llm/index.js';
import { composePrompt } from '@devai-nyx/loop';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import './skill-implementation-cases.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

const SYSTEM_PROMPT = 'You are a deterministic test stub.';
const USER_PROMPT = 'echo: foo';

describe('MockLlmClient', () => {
  it('returns a canned response when the prompt hash matches the fixture', async () => {
    const responses = new Map([['stack-hash-test', { text: 'hello world' }]]);
    const client = new MockLlmClient({ responses });
    const r = await client.complete(
      { system: SYSTEM_PROMPT, user: USER_PROMPT },
      { stack_sha256: 'stack-hash-test', caller: 'unit-test' },
    );
    expect(r.text).toBe('hello world');
    expect(r.family).toBe('mock');
    expect(r.model).toBe('mock-deterministic');
    expect(r.usage.cost_usd).toBe(0);
  });

  it('falls back to echo when the prompt is unknown and strict is false', async () => {
    const client = new MockLlmClient();
    const r = await client.complete(
      { system: SYSTEM_PROMPT, user: USER_PROMPT },
      { caller: 'unit-test' },
    );
    expect(r.text).toContain('[mock-echo]');
    expect(r.family).toBe('mock');
  });

  it('throws when strict and no fixture matches', async () => {
    const client = new MockLlmClient({ strict: true });
    await expect(
      client.complete({ system: '', user: '' }, { caller: 'unit-test' }),
    ).rejects.toThrow(/no fixture/);
  });

  it('parses text as JSON when response_format_json is set and json is absent', async () => {
    const client = new MockLlmClient({
      responses: new Map([['k', { text: '{"verdict":"pass"}' }]]),
    });
    const r = await client.complete(
      { system: '', user: '' },
      { stack_sha256: 'k' },
      {
        response_format_json: true,
      },
    );
    expect(r.json).toEqual({ verdict: 'pass' });
  });

  // Phase 20.B (D-A-1): writer-aware stubs in echo-fallback mode.
  describe('writer-contract stub (Phase 20.B, D-A-1)', () => {
    const WRITER_SKILL_IDS = [
      'SKILL-write-overview',
      'SKILL-write-software-stack',
      'SKILL-write-architecture-guide',
      'SKILL-write-database-reference',
      'SKILL-write-erd',
      'SKILL-write-api-map',
      'SKILL-write-frontend-routes-map',
      'SKILL-write-rbac-matrix',
      'SKILL-write-compliance-lgpd',
      'SKILL-write-compliance-gdpr',
      'SKILL-write-compliance-ccpa',
      'SKILL-write-fp-report',
      'SKILL-write-threat-model',
      'SKILL-write-onboarding',
    ] as const;

    it.each(WRITER_SKILL_IDS)(
      'returns a parseable {markdown, citations, inferred_fields, gaps} stub for %s',
      async (skillId) => {
        const client = new MockLlmClient();
        const r = await client.complete(
          { system: SYSTEM_PROMPT, user: USER_PROMPT },
          { caller: skillId },
          { response_format_json: true },
        );
        expect(r.family).toBe('mock');
        expect(r.json).toBeDefined();
        const obj = r.json as {
          markdown: string;
          citations: unknown[];
          inferred_fields: unknown[];
          gaps: unknown[];
        };
        expect(typeof obj.markdown).toBe('string');
        expect(obj.markdown.length).toBeGreaterThan(0);
        expect(obj.markdown).toContain(skillId);
        expect(Array.isArray(obj.citations)).toBe(true);
        expect(Array.isArray(obj.inferred_fields)).toBe(true);
        expect(Array.isArray(obj.gaps)).toBe(true);
        // Text round-trips through JSON.parse — write-helper's
        // fallback parser (`JSON.parse(response.text)`) must also
        // succeed.
        expect(() => JSON.parse(r.text)).not.toThrow();
      },
    );

    it('detects the contract via the OUTPUT_CONTRACT marker when caller is absent', async () => {
      const client = new MockLlmClient();
      const systemWithMarker =
        'You are a doc writer. Output ONLY JSON: { "markdown": "<doc body>", "citations": [], ... }';
      const r = await client.complete(
        { system: systemWithMarker, user: 'PAYLOAD' },
        { caller: 'unit-test' },
        { response_format_json: true },
      );
      expect(r.json).toBeDefined();
      const obj = r.json as { markdown: string };
      expect(obj.markdown.length).toBeGreaterThan(0);
    });

    it('does not enter writer-stub mode when caller is not a writer skill', async () => {
      const client = new MockLlmClient();
      const r = await client.complete(
        { system: SYSTEM_PROMPT, user: USER_PROMPT },
        { caller: 'SKILL-feedback-iteration' },
      );
      expect(r.text).toContain('[mock-echo]');
    });

    it('lets fixture matches win over writer-stub detection', async () => {
      const client = new MockLlmClient({
        responses: new Map([['fx-key', { text: 'fixture wins' }]]),
      });
      const r = await client.complete(
        { system: SYSTEM_PROMPT, user: USER_PROMPT },
        { stack_sha256: 'fx-key', caller: 'SKILL-write-overview' },
      );
      expect(r.text).toBe('fixture wins');
    });
  });
});

describe('messagesFromComposition + metaFromComposition', () => {
  it('routes global/role/discipline to system; task/payload/overlay to user', () => {
    const components = [
      { layer: 'global' as const, name: 'g', body: 'GLOBAL' },
      { layer: 'role' as const, name: 'r', body: 'ROLE' },
      { layer: 'task' as const, name: 't', body: 'TASK' },
      { layer: 'payload' as const, name: 'p', body: 'PAYLOAD' },
    ];
    const m = messagesFromComposition(components);
    expect(m.system).toContain('GLOBAL');
    expect(m.system).toContain('ROLE');
    expect(m.system).not.toContain('TASK');
    expect(m.user).toContain('TASK');
    expect(m.user).toContain('PAYLOAD');
  });

  it('metaFromComposition carries pc_id + stack_sha256', () => {
    const composition = composePrompt({
      task_id: 'TASK-0001',
      components: [{ layer: 'role', name: 'r', body: 'hello' }],
      timestamp: '2026-05-12T00:00:00.000Z',
    });
    const meta = metaFromComposition(composition, 'unit-test');
    expect(meta.prompt_pc_id).toBe(composition.id);
    expect(meta.stack_sha256).toBe(composition.stack_sha256);
    expect(meta.caller).toBe('unit-test');
  });
});

describe('RateLimitedLlmClient', () => {
  it('paces back-to-back calls per the configured RPM', async () => {
    const inner = new MockLlmClient({
      responses: new Map([['k', { text: 'ok' }]]),
    });
    // 600 rpm = 100ms between calls. Two calls should take at least
    // ~100ms — assert ≥95ms to tolerate JS timer/Date.now() slop under
    // load (observed CI flake: elapsed=99). The signal we care about
    // is "the limiter actually paced, not zero" — a 5ms slop window
    // doesn't change that.
    const limited = new RateLimitedLlmClient(inner, { rpm: 600 });
    const messages = { system: '', user: '' };
    const meta = { stack_sha256: 'k' };
    const start = Date.now();
    await limited.complete(messages, meta);
    await limited.complete(messages, meta);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(95);
  });

  it('retries on transient 429 errors', async () => {
    let attempts = 0;
    const flaky = {
      family: 'mock' as const,
      model: 'mock-flaky',
      async complete() {
        attempts++;
        if (attempts < 2) throw new Error('429 Too Many Requests');
        return {
          text: 'ok',
          family: 'mock' as const,
          model: 'mock-flaky',
          usage: { input_tokens: 1, output_tokens: 1, cost_usd: 0 },
          finish_reason: 'stop' as const,
          latency_ms: 0,
        };
      },
    };
    const limited = new RateLimitedLlmClient(flaky, { rpm: 6000, baseBackoffMs: 1 });
    const r = await limited.complete({ system: '', user: '' }, {});
    expect(r.text).toBe('ok');
    expect(attempts).toBe(2);
  });
});

describe('cost telemetry', () => {
  let repo: string;
  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'devai-llm-'));
    resetUsageCounters();
  });
  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('writes a usage row per call when telemetry is enabled', async () => {
    const client = createLlmClient({
      family: 'mock',
      repoRoot: repo,
      mockResponses: new Map([['k', { text: 'ok', input_tokens: 10, output_tokens: 5 }]]),
    });
    await client.complete({ system: '', user: '' }, { stack_sha256: 'k', caller: 'unit-test' });
    const log = readFileSync(getUsageLogPath(repo), 'utf8');
    const row = JSON.parse(log.trim()) as { family: string; input_tokens: number; caller: string };
    expect(row.family).toBe('mock');
    expect(row.input_tokens).toBe(10);
    expect(row.caller).toBe('unit-test');
  });

  it('cost calculations look right for known models', () => {
    // 1M input tokens of claude-3-5-sonnet = $3.00
    expect(costOf('claude-3-5-sonnet-latest', 1_000_000, 0)).toBeCloseTo(3.0, 4);
    // 1M output of gpt-4o = $10.00
    expect(costOf('gpt-4o-latest', 0, 1_000_000)).toBeCloseTo(10.0, 4);
    // Mock model = free
    expect(costOf('mock-deterministic', 1_000_000, 1_000_000)).toBe(0);
  });
});

describe('factory routing', () => {
  const originalBackend = process.env.DEVAI_LLM_BACKEND;

  afterEach(() => {
    if (originalBackend === undefined) {
      delete process.env.DEVAI_LLM_BACKEND;
    } else {
      process.env.DEVAI_LLM_BACKEND = originalBackend;
    }
  });

  it('defaults to a natural host CLI when available, otherwise mock', () => {
    delete process.env.DEVAI_LLM_BACKEND;
    const client = createLlmClient({ disableTelemetry: true });
    expect(['claude-cli', 'codex-cli', 'mock']).toContain(client.family);
  });

  it('respects DEVAI_LLM_BACKEND=mock env override', () => {
    process.env.DEVAI_LLM_BACKEND = 'mock';
    const client = createLlmClient({ family: 'claude', disableTelemetry: true });
    expect(client.family).toBe('mock');
  });

  it('refuses claude without ANTHROPIC_API_KEY', () => {
    delete process.env.DEVAI_LLM_BACKEND;
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => createLlmClient({ family: 'claude', disableTelemetry: true })).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it('refuses codex without OPENAI_API_KEY', () => {
    delete process.env.DEVAI_LLM_BACKEND;
    delete process.env.OPENAI_API_KEY;
    expect(() => createLlmClient({ family: 'codex', disableTelemetry: true })).toThrow(
      /OPENAI_API_KEY/,
    );
  });
});
// Invariants: INV-DEVAI-001
