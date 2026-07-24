import type {
  LlmClient,
  LlmCompleteOptions,
  LlmMessages,
  LlmPromptMeta,
  LlmResponse,
} from './types.js';

export interface RateLimitOptions {
  /** Max requests per minute. Default 60. */
  readonly rpm?: number;
  /** Max retries on 429 / 5xx. Default 3. */
  readonly maxRetries?: number;
  /** Base backoff in ms (exponential). Default 1000. */
  readonly baseBackoffMs?: number;
}

/**
 * Token-bucket rate limiter + exponential-backoff retry wrapper around
 * any `LlmClient`. Defaults are sane for the public Anthropic / OpenAI
 * tiers; clients can tighten via .devai/config/llm.json (read by the
 * factory in `factory.ts`).
 *
 * Concurrency model: a single-token bucket replenished at `rpm/60`
 * tokens/sec. Multiple async callers wait their turn fairly via a
 * promise queue.
 */
export class RateLimitedLlmClient implements LlmClient {
  readonly family: LlmClient['family'];
  readonly model: string;
  private readonly inner: LlmClient;
  private readonly intervalMs: number;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;
  private queue: Promise<void> = Promise.resolve();
  private nextAvailableAt = 0;

  constructor(inner: LlmClient, opts: RateLimitOptions = {}) {
    this.inner = inner;
    this.family = inner.family;
    this.model = inner.model;
    const rpm = opts.rpm ?? 60;
    this.intervalMs = Math.max(0, Math.floor(60_000 / rpm));
    this.maxRetries = opts.maxRetries ?? 3;
    this.baseBackoffMs = opts.baseBackoffMs ?? 1000;
  }

  async complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    await this.acquireSlot();
    return this.completeWithRetry(messages, meta, opts, 0);
  }

  private async acquireSlot(): Promise<void> {
    // Serialize slot acquisition; each waiter blocks until the bucket
    // ticks. Simple, correct under concurrency, and fair.
    const previous = this.queue;
    let release: () => void = () => undefined;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    const now = Date.now();
    const waitMs = Math.max(0, this.nextAvailableAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    this.nextAvailableAt = Math.max(now, this.nextAvailableAt) + this.intervalMs;
    release();
  }

  private async completeWithRetry(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts: LlmCompleteOptions | undefined,
    attempt: number,
  ): Promise<LlmResponse> {
    try {
      return await this.inner.complete(messages, meta, opts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /\b(429|500|502|503|504|timeout|ECONN|EAI)\b/i.test(msg);
      if (!transient || attempt >= this.maxRetries) throw err;
      const backoff = this.baseBackoffMs * 2 ** attempt;
      await sleep(backoff);
      return this.completeWithRetry(messages, meta, opts, attempt + 1);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
