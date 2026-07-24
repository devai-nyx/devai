import { spawnSync, type SpawnSyncOptions } from '@devai-nyx/authority';
import { readFileSync } from 'node:fs';
import { responseSchemaAssetForMutatingSkill } from './response-schemas.js';
import {
  costOf,
  type LlmClient,
  type LlmCompleteOptions,
  type LlmFamily,
  type LlmMessages,
  type LlmPromptMeta,
  type LlmResponse,
  type LlmUsage,
} from './types.js';

/**
 * Phase 20.C (D-A-6): CLI-bridge LLM client.
 *
 * Shells out to a locally-installed host CLI (Claude Code's `claude`
 * or codex's `codex exec`) with `--print --output-format json` and
 * parses the envelope back into an `LlmResponse`. Authentication is
 * delegated to the host CLI's own OAuth session — DEVAI passes no
 * API key. An adopter who has `claude` on PATH with a valid login
 * can run the writer pipeline without ever exporting an
 * ANTHROPIC_API_KEY.
 *
 * Envelope-parsing rule (discovered during the C-4 stynx pilot, see
 * `../stynx/docs/devai-phase-a-retro.md` §5 A.5b): when
 * `--json-schema` is set, the host CLI puts the parsed object in
 * `envelope.structured_output`, NOT `envelope.result`. The `result`
 * field carries a chat-style status message. Without `--json-schema`,
 * the JSON lives in `envelope.result` (often inside a triple-backtick
 * `json` fence). This client reads `structured_output` first and
 * falls back to fenced `result` parsing.
 *
 * Telemetry: the envelope's `usage` + `total_cost_usd` map into the
 * existing `recordUsage()` shape. Cost reported by the host CLI is
 * authoritative (the DEVAI pricing table is bypassed for CLI families).
 */

export interface CliLlmClientOptions {
  /** 'claude' or 'codex' — the executable name on PATH. */
  readonly cli: 'claude' | 'codex';
  /** Per-family model override. */
  readonly model?: string;
  /** Optional per-call max budget the host CLI enforces. */
  readonly maxBudgetUsd?: number;
  /** Default timeout per call (ms). Default 120s. */
  readonly defaultTimeoutMs?: number;
  /**
   * Injection seam for tests: replace the spawn implementation with a
   * deterministic stub. Production passes through to node:child_process.
   */
  readonly spawn?: typeof spawnSync;
}

export interface CliEnvelopeUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly cache_read_input_tokens?: number;
  readonly cache_creation_input_tokens?: number;
}

export interface CliEnvelope {
  readonly result?: string;
  readonly structured_output?: unknown;
  readonly usage?: CliEnvelopeUsage;
  readonly total_cost_usd?: number;
  readonly modelUsage?: Record<string, unknown>;
  readonly model?: string;
}

export class CliLlmClient implements LlmClient {
  readonly family: LlmFamily;
  readonly model: string;
  private readonly cli: 'claude' | 'codex';
  private readonly maxBudgetUsd: number | undefined;
  private readonly defaultTimeoutMs: number;
  private readonly spawnProcess: typeof spawnSync;
  /**
   * Phase 23.B (D-A-19): pre-flight result cache. `null` = not yet
   * probed; `true` = host CLI responded to `--version` (cached for
   * the lifetime of this client instance); `false` = probe failed
   * and the error was already thrown to the caller.
   */
  private cliReachable: boolean | null = null;

  constructor(opts: CliLlmClientOptions) {
    this.cli = opts.cli;
    this.family = opts.cli === 'claude' ? 'claude-cli' : 'codex-cli';
    this.model = opts.model ?? defaultModelFor(opts.cli);
    this.maxBudgetUsd = opts.maxBudgetUsd;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 120_000;
    this.spawnProcess = opts.spawn ?? spawnSync;
  }

  async complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    this.ensureCliReachable();
    if (opts?.response_json_schema !== undefined && opts.response_format_json !== true) {
      throw new Error('response_json_schema requires response_format_json=true');
    }
    const started = Date.now();
    const prompt = messagesToText(messages);
    const codexSchemaPath =
      this.cli === 'codex' && opts?.response_json_schema !== undefined
        ? (() => {
            const caller = meta.caller;
            if (typeof caller !== 'string' || !/^SKILL-[A-Za-z0-9._-]+$/u.test(caller)) {
              throw new Error(`STRUCTURED_RESPONSE_SCHEMA_CALLER_INVALID: ${String(caller)}`);
            }
            const schemaPath = responseSchemaAssetForMutatingSkill(caller);
            const assetSchema = JSON.parse(readFileSync(schemaPath, 'utf8')) as unknown;
            if (JSON.stringify(assetSchema) !== JSON.stringify(opts.response_json_schema)) {
              throw new Error(`STRUCTURED_RESPONSE_SCHEMA_ASSET_MISMATCH: ${caller}`);
            }
            return schemaPath;
          })()
        : undefined;
    const argv = this.buildArgs(prompt, opts, codexSchemaPath);
    const spawnOpts: SpawnSyncOptions = {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      timeout: opts?.timeout_ms ?? this.defaultTimeoutMs,
      env: { ...process.env },
    };
    const proc = this.spawnProcess(this.cli, argv, spawnOpts);
    if (proc.error !== undefined && proc.error !== null) {
      const code = (proc.error as NodeJS.ErrnoException).code;
      if (code === 'ETIMEDOUT') {
        throw new Error(
          `${this.cli}-cli call timed out after ${String(spawnOpts.timeout)}ms (pre-flight probe succeeded). The CLI is on PATH but did not return in time — consider increasing --timeout-ms or simplifying the prompt.`,
        );
      }
      throw new Error(
        `${this.cli}-cli spawn failed: ${proc.error.message}. Is '${this.cli}' on PATH and logged in?`,
      );
    }
    if (proc.status !== 0) {
      const stderr = typeof proc.stderr === 'string' ? proc.stderr.slice(0, 500) : '';
      throw new Error(`${this.cli}-cli exit=${String(proc.status)}: ${stderr}`);
    }
    const stdout = typeof proc.stdout === 'string' ? proc.stdout : '';
    if (this.cli === 'codex') {
      const codex = extractCodexJsonl(stdout);
      const text = codex.text;
      let parsedJson: unknown;
      if (opts?.response_format_json === true) {
        try {
          parsedJson = JSON.parse(text);
        } catch {
          parsedJson = undefined;
        }
      }
      return {
        text,
        family: this.family,
        model: this.model,
        usage: {
          ...codex.usage,
          cost_usd: costOf(this.model, codex.usage.input_tokens, codex.usage.output_tokens),
        },
        finish_reason: 'stop',
        latency_ms: Date.now() - started,
        ...(parsedJson !== undefined && { json: parsedJson }),
      };
    }
    let envelope: CliEnvelope;
    try {
      envelope = JSON.parse(stdout) as CliEnvelope;
    } catch (err) {
      throw new Error(
        `${this.cli}-cli envelope parse failed: ${err instanceof Error ? err.message : String(err)}; stdout head: ${stdout.slice(0, 200)}`,
      );
    }
    const text = extractText(envelope);
    const parsedJson = extractJson(envelope, opts);
    const usage = mapUsage(envelope.usage);
    const cliCost = typeof envelope.total_cost_usd === 'number' ? envelope.total_cost_usd : null;
    const cost_usd =
      cliCost !== null ? cliCost : costOf(this.model, usage.input_tokens, usage.output_tokens);
    return {
      text,
      family: this.family,
      model: envelope.model ?? this.model,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd,
      },
      finish_reason: 'stop',
      latency_ms: Date.now() - started,
      ...(parsedJson !== undefined && { json: parsedJson }),
    };
  }

  private buildArgs(prompt: string, opts?: LlmCompleteOptions, codexSchemaPath?: string): string[] {
    if (this.cli === 'claude') {
      const argv: string[] = [
        '--print',
        '--no-session-persistence',
        '--safe-mode',
        '--disable-slash-commands',
        '--tools',
        '',
        '--model',
        this.model,
        '--output-format',
        'json',
      ];
      if (this.maxBudgetUsd !== undefined) {
        argv.push('--max-budget-usd', String(this.maxBudgetUsd));
      }
      if (opts?.response_json_schema !== undefined) {
        argv.push('--json-schema', JSON.stringify(opts.response_json_schema));
      }
      argv.push(prompt);
      return argv;
    }
    // codex
    const argv: string[] = [
      'exec',
      '--model',
      this.model,
      '--json',
      '--ephemeral',
      '--ignore-user-config',
      '--ignore-rules',
      '--sandbox',
      'read-only',
    ];
    if (codexSchemaPath !== undefined) {
      argv.push('--output-schema', codexSchemaPath);
    }
    argv.push(prompt);
    return argv;
  }

  /**
   * Phase 23.B (D-A-19): one-time-per-instance pre-flight probe.
   * Spawns `<cli> --version` with a 5s timeout. On success, marks the
   * instance reachable and caches; subsequent `complete()` calls skip
   * the probe. On failure, throws a precise message distinguishing
   * "not on PATH" (ENOENT) from "not responsive" (ETIMEDOUT) from
   * non-zero exit (e.g. corrupted install). This replaces the
   * pre-23.B failure mode where a missing-CLI or hung-CLI host shell
   * surfaced as a 120s `claude-cli spawn failed: ... ETIMEDOUT`
   * message at LLM-call time, miscategorising both shapes as
   * "PATH/login issue."
   */
  private ensureCliReachable(): void {
    if (this.cliReachable === true) return;
    const proc = this.spawnProcess(this.cli, ['--version'], {
      encoding: 'utf8',
      timeout: 5_000,
      env: { ...process.env },
    });
    if (proc.error !== undefined && proc.error !== null) {
      this.cliReachable = false;
      const code = (proc.error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(
          `${this.cli}-cli pre-flight failed: '${this.cli}' not on PATH. Check that your shell rc exports the CLI's bin directory; child PATH head: ${(process.env.PATH ?? '').split(':').slice(0, 6).join(':')}`,
        );
      }
      if (code === 'ETIMEDOUT') {
        throw new Error(
          `${this.cli}-cli pre-flight failed: '${this.cli} --version' did not return within 5s — the binary is on PATH but unresponsive (host shell may be wedged, or the CLI is waiting for interactive auth).`,
        );
      }
      throw new Error(`${this.cli}-cli pre-flight failed: ${proc.error.message}`);
    }
    if (proc.status !== 0) {
      this.cliReachable = false;
      const stderr = typeof proc.stderr === 'string' ? proc.stderr.slice(0, 300) : '';
      throw new Error(`${this.cli}-cli pre-flight exit=${String(proc.status)}: ${stderr}`);
    }
    this.cliReachable = true;
  }
}

function defaultModelFor(cli: 'claude' | 'codex'): string {
  return cli === 'claude' ? 'claude-sonnet-4-6' : 'gpt-5.6-sol';
}

/**
 * Flatten LlmMessages into a single prompt string suitable for the
 * host CLI's positional <prompt> argument. The CLI doesn't have a
 * native system/user split, so we tag the system block.
 */
export function messagesToText(messages: LlmMessages): string {
  const sys = messages.system.trim();
  const usr = messages.user.trim();
  if (sys.length === 0) return usr;
  return `[SYSTEM]\n${sys}\n\n[USER]\n${usr}`;
}

/**
 * Extract the textual response from an envelope. When
 * `structured_output` is set (i.e. `--json-schema` was passed), it
 * carries the parsed object — we serialize it back to JSON for the
 * `text` field. Otherwise `result` may contain a fenced JSON block;
 * strip the fence so downstream JSON.parse works.
 */
export function extractText(envelope: CliEnvelope): string {
  if (envelope.structured_output !== undefined && envelope.structured_output !== null) {
    return JSON.stringify(envelope.structured_output);
  }
  const raw = envelope.result ?? '';
  return raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
}

/**
 * Pull the structured JSON object from an envelope. Prefers
 * `structured_output` (set when `--json-schema` is passed). Falls
 * back to parsing `result` as JSON when the caller requested
 * `response_format_json` and structured_output was absent.
 */
export function extractJson(envelope: CliEnvelope, opts?: LlmCompleteOptions): unknown | undefined {
  if (envelope.structured_output !== undefined && envelope.structured_output !== null) {
    return envelope.structured_output;
  }
  if (opts?.response_format_json !== true) return undefined;
  const text = extractText(envelope);
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

interface CodexJsonlResult {
  readonly text: string;
  readonly usage: Pick<LlmUsage, 'input_tokens' | 'output_tokens'>;
}

/** Extract only the final agent message and terminal usage from Codex JSONL. */
export function extractCodexJsonl(stdout: string): CodexJsonlResult {
  let text: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;
  for (const line of stdout.split('\n')) {
    if (line.trim().length === 0) continue;
    let event: unknown;
    try {
      event = JSON.parse(line);
    } catch (err) {
      throw new Error(
        `codex-cli JSONL parse failed: ${err instanceof Error ? err.message : String(err)}; line head: ${line.slice(0, 160)}`,
      );
    }
    if (typeof event !== 'object' || event === null) continue;
    const record = event as Record<string, unknown>;
    if (record['type'] === 'item.completed') {
      const item = record['item'];
      if (typeof item === 'object' && item !== null) {
        const itemRecord = item as Record<string, unknown>;
        if (itemRecord['type'] === 'agent_message' && typeof itemRecord['text'] === 'string') {
          text = itemRecord['text'];
        }
      }
    }
    if (record['type'] === 'turn.completed') {
      const usage = record['usage'];
      if (typeof usage === 'object' && usage !== null) {
        const usageRecord = usage as Record<string, unknown>;
        const directInput = usageRecord['input_tokens'];
        const cachedInput = usageRecord['cached_input_tokens'];
        const directOutput = usageRecord['output_tokens'];
        inputTokens =
          (typeof directInput === 'number' ? directInput : 0) +
          (typeof cachedInput === 'number' ? cachedInput : 0);
        outputTokens = typeof directOutput === 'number' ? directOutput : 0;
      }
    }
  }
  if (text === undefined) {
    throw new Error('codex-cli JSONL final agent_message missing');
  }
  return { text, usage: { input_tokens: inputTokens, output_tokens: outputTokens } };
}

/**
 * Map the host CLI envelope's `usage` block into the DEVAI
 * `LlmUsage` shape. `cache_read_input_tokens` and
 * `cache_creation_input_tokens` are folded into `input_tokens` so
 * existing telemetry consumers don't need new fields; the cache
 * accounting still rides through `cost_usd` via the CLI's
 * `total_cost_usd`.
 */
export function mapUsage(
  usage: CliEnvelopeUsage | undefined,
): Pick<LlmUsage, 'input_tokens' | 'output_tokens'> {
  const u = usage ?? {};
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheCreate = u.cache_creation_input_tokens ?? 0;
  const base = u.input_tokens ?? 0;
  return {
    input_tokens: base + cacheRead + cacheCreate,
    output_tokens: u.output_tokens ?? 0,
  };
}
