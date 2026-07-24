import OpenAI from 'openai';
import {
  costOf,
  type LlmClient,
  type LlmCompleteOptions,
  type LlmMessages,
  type LlmPromptMeta,
  type LlmResponse,
} from './types.js';

export interface CodexLlmClientOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly defaultTimeoutMs?: number;
  readonly defaultMaxOutputTokens?: number;
  /** Optional base URL override (e.g. Azure proxy). */
  readonly baseURL?: string;
}

/**
 * Production OpenAI / "Codex family" adapter. Wraps `openai` behind
 * `LlmClient`. The constitutional "codex" label is shorthand for the
 * OpenAI family (per `family: 'claude' | 'codex' | 'other'` in
 * prompt-composition.schema.json and task.schema.json's model_tier
 * semantics).
 *
 * Supports response_format:{type:'json_object'} natively, which makes
 * structured-output skills (sense judge, Article-23 ladder) more
 * reliable on this provider.
 */
export class CodexLlmClient implements LlmClient {
  readonly family = 'codex' as const;
  readonly model: string;
  private readonly sdk: OpenAI;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxOutputTokens: number;

  constructor(opts: CodexLlmClientOptions) {
    this.model = opts.model ?? 'gpt-4o-latest';
    this.sdk = new OpenAI({
      apiKey: opts.apiKey,
      ...(opts.baseURL !== undefined && { baseURL: opts.baseURL }),
    });
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 60_000;
    this.defaultMaxOutputTokens = opts.defaultMaxOutputTokens ?? 4096;
  }

  async complete(
    messages: LlmMessages,
    _meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    const started = Date.now();
    try {
      const result = await this.sdk.chat.completions.create(
        {
          model: this.model,
          max_tokens: opts?.max_output_tokens ?? this.defaultMaxOutputTokens,
          temperature: opts?.temperature ?? 0.2,
          messages: [
            { role: 'system', content: messages.system },
            { role: 'user', content: messages.user },
          ],
          ...(opts?.response_format_json === true && {
            response_format: { type: 'json_object' },
          }),
        },
        { timeout: opts?.timeout_ms ?? this.defaultTimeoutMs },
      );
      const choice = result.choices[0];
      const text = choice?.message.content ?? '';
      const input_tokens = result.usage?.prompt_tokens ?? 0;
      const output_tokens = result.usage?.completion_tokens ?? 0;
      let parsedJson: unknown;
      if (opts?.response_format_json === true) {
        try {
          parsedJson = JSON.parse(text);
        } catch {
          // leave undefined
        }
      }
      return {
        text,
        family: 'codex',
        model: this.model,
        usage: {
          input_tokens,
          output_tokens,
          cost_usd: costOf(this.model, input_tokens, output_tokens),
        },
        finish_reason: mapFinishReason(choice?.finish_reason ?? null),
        latency_ms: Date.now() - started,
        ...(parsedJson !== undefined && { json: parsedJson }),
      };
    } catch (err) {
      throw new Error(
        `OpenAI API error after ${String(Date.now() - started)}ms: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function mapFinishReason(reason: string | null): LlmResponse['finish_reason'] {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'tool_calls':
    case 'function_call':
      return 'tool_use';
    default:
      return 'stop';
  }
}
