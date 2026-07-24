import Anthropic from '@anthropic-ai/sdk';
import {
  costOf,
  type LlmClient,
  type LlmCompleteOptions,
  type LlmMessages,
  type LlmPromptMeta,
  type LlmResponse,
} from './types.js';

export interface AnthropicLlmClientOptions {
  readonly apiKey: string;
  readonly model?: string;
  /** Provider-specific defaults (overridable per-call via LlmCompleteOptions). */
  readonly defaultTimeoutMs?: number;
  readonly defaultMaxOutputTokens?: number;
}

/**
 * Production Anthropic adapter. Wraps `@anthropic-ai/sdk` behind the
 * provider-agnostic `LlmClient` interface so skills don't import the
 * SDK directly.
 *
 * `response_format_json` is best-effort: Anthropic doesn't have a
 * dedicated JSON mode at the API level; we set a system suffix that
 * instructs the model to emit only valid JSON, then try to parse the
 * response. Skills should validate the parsed structure separately.
 */
export class AnthropicLlmClient implements LlmClient {
  readonly family = 'claude' as const;
  readonly model: string;
  private readonly sdk: Anthropic;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxOutputTokens: number;

  constructor(opts: AnthropicLlmClientOptions) {
    this.model = opts.model ?? 'claude-3-5-sonnet-latest';
    this.sdk = new Anthropic({ apiKey: opts.apiKey });
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 60_000;
    this.defaultMaxOutputTokens = opts.defaultMaxOutputTokens ?? 4096;
  }

  async complete(
    messages: LlmMessages,
    _meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    const started = Date.now();
    const system =
      opts?.response_format_json === true
        ? `${messages.system}\n\n[JSON_ONLY]: Respond with a single valid JSON object. No prose, no markdown fences. Just the JSON.`
        : messages.system;
    try {
      const result = await this.sdk.messages.create(
        {
          model: this.model,
          max_tokens: opts?.max_output_tokens ?? this.defaultMaxOutputTokens,
          temperature: opts?.temperature ?? 0.2,
          system,
          messages: [{ role: 'user', content: messages.user }],
        },
        { timeout: opts?.timeout_ms ?? this.defaultTimeoutMs },
      );
      const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('');
      const input_tokens = result.usage.input_tokens;
      const output_tokens = result.usage.output_tokens;
      let parsedJson: unknown;
      if (opts?.response_format_json === true) {
        try {
          parsedJson = JSON.parse(text);
        } catch {
          // leave undefined; caller checks json field
        }
      }
      return {
        text,
        family: 'claude',
        model: this.model,
        usage: {
          input_tokens,
          output_tokens,
          cost_usd: costOf(this.model, input_tokens, output_tokens),
        },
        finish_reason: mapStopReason(result.stop_reason),
        latency_ms: Date.now() - started,
        ...(parsedJson !== undefined && { json: parsedJson }),
      };
    } catch (err) {
      // Re-throw with a typed shape; orchestrator catches and routes.
      throw new Error(
        `Anthropic API error after ${String(Date.now() - started)}ms: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function mapStopReason(reason: string | null | undefined): LlmResponse['finish_reason'] {
  switch (reason) {
    case 'end_turn':
      return 'stop';
    case 'max_tokens':
      return 'length';
    case 'tool_use':
      return 'tool_use';
    default:
      return 'stop';
  }
}
