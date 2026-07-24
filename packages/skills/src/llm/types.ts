/**
 * Phase-9 LLM substrate — provider-agnostic types.
 *
 * The framework speaks `LlmClient` to providers. `AnthropicLlmClient`
 * and `CodexLlmClient` are first-class peers; `MockLlmClient` makes
 * tests deterministic and free. Article 23's cross-family tie-breaker
 * is built on top of this multi-provider abstraction.
 *
 * Concept of operations:
 *   - Skills build a PromptComposition (composePrompt) AND keep the
 *     raw component bodies in scope.
 *   - For the LLM call, the skill assembles system + user message
 *     strings (or uses `messagesFromComposition`) and invokes
 *     `client.complete({system, user}, {prompt_pc_id, ...}, opts)`.
 *   - The substrate logs prompt_pc_id + stack_sha256 in usage
 *     telemetry so two callers with identical inputs share audit IDs.
 */

import type { PromptComposition, PromptComponentInput, PromptLayer } from '@devai-nyx/loop';

/**
 * Phase 20.C (D-A-6): `claude-cli` and `codex-cli` are CLI-bridge
 * families that shell out to a locally-installed host CLI (Claude
 * Code or codex) with `--print --output-format json`. Auth is
 * delegated to the host CLI's own OAuth session, so adopters with
 * the CLI on PATH no longer need to export ANTHROPIC_API_KEY /
 * OPENAI_API_KEY to use DEVAI's writer pipeline.
 *
 * For Article-23 cross-family adjudication purposes, `claude-cli`
 * is treated as the same family as `claude` (both ride the
 * Anthropic stack) and `codex-cli` as the same family as `codex`
 * (both ride the OpenAI stack). Family-equivalence helpers live
 * in factory.ts.
 */
export type LlmFamily = 'claude' | 'codex' | 'mock' | 'claude-cli' | 'codex-cli';

export interface LlmUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cost_usd: number;
}

export interface LlmMessages {
  readonly system: string;
  readonly user: string;
}

export interface LlmPromptMeta {
  /** PC-<16hex> id from the corresponding PromptComposition. */
  readonly prompt_pc_id?: string;
  /** Full stack_sha256 for audit replay. */
  readonly stack_sha256?: string;
  /** Skill or sensor name making the call (e.g. 'SKILL-feedback-iteration'). */
  readonly caller?: string;
}

export interface LlmResponse {
  readonly text: string;
  readonly family: LlmFamily;
  readonly model: string;
  readonly usage: LlmUsage;
  readonly finish_reason: 'stop' | 'length' | 'tool_use' | 'error';
  readonly latency_ms: number;
  /**
   * Set when the response parsed-as-JSON successfully. Skills that
   * require structured output should branch on this rather than
   * re-parsing `text`.
   */
  readonly json?: unknown;
}

export interface LlmCompleteOptions {
  /** Hard upper bound on output tokens. */
  readonly max_output_tokens?: number;
  /** Sampling temperature; default 0.2 for skills that want determinism. */
  readonly temperature?: number;
  /** Set true to request a JSON-shaped response (provider-best-effort). */
  readonly response_format_json?: boolean;
  /**
   * Exact JSON Schema for a structured response envelope. Local CLI bridges
   * pass this through unchanged only when response_format_json=true. Omitting
   * it leaves JSON parsing best-effort and must not advertise a generic shape.
   */
  readonly response_json_schema?: Readonly<Record<string, unknown>>;
  /** Per-call timeout in ms; default 60s. */
  readonly timeout_ms?: number;
}

export interface LlmClient {
  readonly family: LlmFamily;
  readonly model: string;
  complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse>;
}

export interface LlmPricing {
  /** USD per million input tokens. */
  readonly input_per_mtok: number;
  /** USD per million output tokens. */
  readonly output_per_mtok: number;
}

/** Default cost tables. Override via .devai/config/llm-pricing.json. */
export const DEFAULT_PRICING: Readonly<Record<string, LlmPricing>> = {
  // Anthropic — public reference prices, subject to change. Override
  // via .devai/config/llm-pricing.json when they drift.
  'claude-3-5-sonnet-latest': { input_per_mtok: 3.0, output_per_mtok: 15.0 },
  'claude-3-5-haiku-latest': { input_per_mtok: 0.8, output_per_mtok: 4.0 },
  // OpenAI / Codex family — public reference prices.
  'gpt-4o-latest': { input_per_mtok: 2.5, output_per_mtok: 10.0 },
  'gpt-4o-mini': { input_per_mtok: 0.15, output_per_mtok: 0.6 },
  // Mock — zero cost.
  'mock-deterministic': { input_per_mtok: 0, output_per_mtok: 0 },
  // CLI bridges — cost is reported by the host CLI envelope's
  // `total_cost_usd`, so the table entries stay zero; the CLI
  // client overrides `cost_usd` post-hoc from the envelope.
  'claude-cli-default': { input_per_mtok: 0, output_per_mtok: 0 },
  'codex-cli-default': { input_per_mtok: 0, output_per_mtok: 0 },
};

export function costOf(model: string, input_tokens: number, output_tokens: number): number {
  const p = DEFAULT_PRICING[model] ?? { input_per_mtok: 0, output_per_mtok: 0 };
  return (
    (input_tokens / 1_000_000) * p.input_per_mtok + (output_tokens / 1_000_000) * p.output_per_mtok
  );
}

/**
 * Compose a PromptComposition AND derive the system/user messages from
 * its component bodies in one call. Returns both — the composition for
 * audit, the messages for the LLM call.
 */
const SECTION_SEPARATOR = '\n\n---\n\n';
const SYSTEM_LAYERS: ReadonlySet<PromptLayer> = new Set(['global', 'role', 'discipline']);

export function messagesFromComposition(components: readonly PromptComponentInput[]): LlmMessages {
  const systemParts: string[] = [];
  const userParts: string[] = [];
  for (const c of components) {
    if (SYSTEM_LAYERS.has(c.layer)) systemParts.push(c.body);
    else userParts.push(c.body);
  }
  return {
    system: systemParts.join(SECTION_SEPARATOR),
    user: userParts.join(SECTION_SEPARATOR),
  };
}

/** Convenience: build the meta record from a PromptComposition. */
export function metaFromComposition(
  composition: PromptComposition,
  caller?: string,
): LlmPromptMeta {
  const meta: LlmPromptMeta = {
    prompt_pc_id: composition.id,
    stack_sha256: composition.stack_sha256,
  };
  if (caller !== undefined) return { ...meta, caller };
  return meta;
}
