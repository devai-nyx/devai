import { createHash } from 'node:crypto';
import {
  costOf,
  type LlmClient,
  type LlmCompleteOptions,
  type LlmMessages,
  type LlmPromptMeta,
  type LlmResponse,
} from './types.js';

/**
 * Deterministic LLM client for tests and CI.
 *
 * Mode 1 — fixture map: caller supplies a Map<stack_sha256, LlmResponse>
 * pre-seeded for known prompts. Mode used by production tests where
 * the prompt hash is computed in advance from a known PromptComposition.
 *
 * Mode 2 — writer-aware stub: when no fixture matches, no strict
 * mode, AND the caller is a writer skill (`meta.caller` matches
 * `SKILL-write-*`) or the prompt carries the writer output-contract
 * marker, the mock emits a stub that conforms to the
 * `{markdown, citations, inferred_fields, gaps}` envelope so
 * adopter wiring smoke (`DEVAI_LLM_BACKEND=mock`) verifies the
 * pipeline end-to-end. Phase 20.B (closes D-A-1).
 *
 * Mode 3 — echo: when no fixture matches and the prompt is not a
 * writer-contract request, returns an echo of the concatenated
 * messages (useful for round-trip tests). Set `strict: true` to
 * throw on unknown prompts instead — recommended for production
 * tests so an unmocked path fails loudly rather than silently
 * returning the wrong thing.
 */
export interface MockLlmClientOptions {
  /** Map keyed by stack_sha256 (or 'any' for the default fallback). */
  readonly responses?: ReadonlyMap<string, MockResponseSpec>;
  /** Throw on unmatched prompts (default: false → echo fallback). */
  readonly strict?: boolean;
  /** Override `model` reported in responses. */
  readonly model?: string;
}

export interface MockResponseSpec {
  readonly text: string;
  readonly json?: unknown;
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly finish_reason?: LlmResponse['finish_reason'];
  readonly latency_ms?: number;
}

export class MockLlmClient implements LlmClient {
  readonly family = 'mock' as const;
  readonly model: string;
  private readonly responses: ReadonlyMap<string, MockResponseSpec>;
  private readonly strict: boolean;

  constructor(opts: MockLlmClientOptions = {}) {
    this.responses = opts.responses ?? new Map();
    this.strict = opts.strict === true;
    this.model = opts.model ?? 'mock-deterministic';
  }

  async complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    // Look up by stack_sha256 first; fall back to a content-derived
    // hash so callers that haven't gone through composePrompt still
    // get deterministic matching.
    const key = meta.stack_sha256 ?? hashMessages(messages);
    const spec = this.responses.get(key) ?? this.responses.get('any');
    if (spec === undefined) {
      if (this.strict) {
        throw new Error(
          `MockLlmClient: no fixture for prompt key '${key.slice(0, 16)}…' (caller=${meta.caller ?? '?'})`,
        );
      }
      const writerSkillId = detectWriterContractRequest(meta, messages);
      if (writerSkillId !== null) {
        return this.buildWriterContractStub(writerSkillId, messages);
      }
      // Echo fallback: return the concatenated messages so callers can
      // at least verify the request mapping.
      const text = `[mock-echo] system:${String(messages.system.length)}b user:${String(messages.user.length)}b`;
      const input_tokens = approxTokens(messages.system + messages.user);
      const output_tokens = approxTokens(text);
      return {
        text,
        family: 'mock',
        model: this.model,
        usage: {
          input_tokens,
          output_tokens,
          cost_usd: costOf(this.model, input_tokens, output_tokens),
        },
        finish_reason: 'stop',
        latency_ms: 0,
      };
    }
    const input_tokens = spec.input_tokens ?? approxTokens(messages.system + messages.user);
    const output_tokens = spec.output_tokens ?? approxTokens(spec.text);
    const response: LlmResponse = {
      text: spec.text,
      family: 'mock',
      model: this.model,
      usage: {
        input_tokens,
        output_tokens,
        cost_usd: costOf(this.model, input_tokens, output_tokens),
      },
      finish_reason: spec.finish_reason ?? 'stop',
      latency_ms: spec.latency_ms ?? 0,
      ...(spec.json !== undefined && { json: spec.json }),
    };
    // Honour response_format_json: try to parse text as JSON if no
    // explicit `json` was provided.
    if (response.json === undefined && opts?.response_format_json === true) {
      try {
        return { ...response, json: JSON.parse(spec.text) };
      } catch {
        // leave as-is
      }
    }
    return response;
  }

  /**
   * Build a writer-contract-conforming stub for adopter wiring smoke
   * runs (`DEVAI_LLM_BACKEND=mock` against `SKILL-write-*`). The
   * envelope shape matches what `write-helper.ts` expects:
   * `{markdown, citations, inferred_fields, gaps}` with `markdown`
   * non-empty. Phase 20.B (closes D-A-1).
   */
  private buildWriterContractStub(skillId: string, messages: LlmMessages): LlmResponse {
    const stub = {
      markdown:
        `# ${skillId} stub\n\n` +
        'Mock backend output for wiring verification only. ' +
        'Set DEVAI_LLM_BACKEND=claude or DEVAI_LLM_BACKEND=claude-cli ' +
        'for real synthesis.',
      citations: [] as Array<{ kind: string; ref: string }>,
      inferred_fields: [] as string[],
      gaps: [] as string[],
    };
    const text = JSON.stringify(stub);
    const input_tokens = approxTokens(messages.system + messages.user);
    const output_tokens = approxTokens(text);
    return {
      text,
      family: 'mock',
      model: this.model,
      usage: {
        input_tokens,
        output_tokens,
        cost_usd: costOf(this.model, input_tokens, output_tokens),
      },
      finish_reason: 'stop',
      latency_ms: 0,
      json: stub,
    };
  }
}

/**
 * Detect whether the prompt is a writer-skill contract request. Two
 * signals carry equal authority: an explicit `SKILL-write-*` caller
 * id in meta, or the OUTPUT_CONTRACT_INSTRUCTION marker appearing in
 * the system layer (the helper appends it as a global component).
 * Returns the resolved skill id (or a generic placeholder when only
 * the marker is seen) or `null` when the prompt is not a writer.
 */
function detectWriterContractRequest(meta: LlmPromptMeta, messages: LlmMessages): string | null {
  const caller = meta.caller;
  if (typeof caller === 'string' && caller.startsWith('SKILL-write-')) {
    return caller;
  }
  // Marker is the literal opening of OUTPUT_CONTRACT_INSTRUCTION
  // from packages/skills/src/skills/writers/write-helper.ts. Keeping
  // it as a substring check (not a regex) keeps the dependency
  // structurally one-directional: write-helper imports nothing from
  // mock-client, and mock-client never imports from write-helper.
  if (messages.system.includes('Output ONLY JSON: { "markdown":')) {
    return 'SKILL-write-unknown';
  }
  return null;
}

/** Rough token estimator (4 chars ≈ 1 token). Good enough for telemetry. */
function approxTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Content-hash a messages pair when callers don't supply stack_sha256. */
function hashMessages(messages: LlmMessages): string {
  return createHash('sha256')
    .update(messages.system + '\n\n' + messages.user)
    .digest('hex');
}
