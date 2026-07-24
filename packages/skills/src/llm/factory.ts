import { spawnSync } from '@devai-nyx/authority';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AnthropicLlmClient } from './anthropic-client.js';
import { CliLlmClient } from './cli-client.js';
import { CodexLlmClient } from './codex-client.js';
import { MockLlmClient, type MockResponseSpec } from './mock-client.js';
import { RateLimitedLlmClient, type RateLimitOptions } from './rate-limit.js';
import { assertWithinBudget, recordUsage } from './telemetry.js';
import type {
  LlmClient,
  LlmCompleteOptions,
  LlmFamily,
  LlmMessages,
  LlmPromptMeta,
  LlmResponse,
} from './types.js';

/**
 * Phase 20.C (D-A-6): family-equivalence helper for Article-23
 * cross-family adjudication. `claude-cli` is the same provider
 * stack as `claude`; `codex-cli` is the same as `codex`. Callers
 * that need "different-vendor breaker" semantics should use this
 * helper rather than `===` on the family field.
 */
export function familyVendor(family: LlmFamily): 'anthropic' | 'openai' | 'mock' {
  switch (family) {
    case 'claude':
    case 'claude-cli':
      return 'anthropic';
    case 'codex':
    case 'codex-cli':
      return 'openai';
    case 'mock':
      return 'mock';
  }
}

export interface CreateLlmClientOptions {
  /**
   * Backend: 'claude' | 'codex' | 'mock' | 'auto'.
   *   - 'auto' (default in production): read .devai/config/llm.json's
   *     default_family.
   *   - DEVAI_LLM_BACKEND env always takes precedence over `family`.
   */
  readonly family?: LlmFamily | 'auto';
  /** Per-family model override. */
  readonly model?: string;
  /**
   * Repo root for config + telemetry. Default '.'. Telemetry writes
   * to <repoRoot>/record/proofs/work/llm-usage.jsonl.
   */
  readonly repoRoot?: string;
  /** Pre-seeded mock responses (only used when family resolves to 'mock'). */
  readonly mockResponses?: ReadonlyMap<string, MockResponseSpec>;
  /** Strict mock (throw on unmatched prompts). */
  readonly mockStrict?: boolean;
  /** Rate-limit overrides. */
  readonly rateLimit?: RateLimitOptions;
  /** Disable rate limiting (tests). */
  readonly disableRateLimit?: boolean;
  /** Disable telemetry persistence (tests). */
  readonly disableTelemetry?: boolean;
  /**
   * Phase 24.C (closes D-A-24): CLI-flag-level timeout override.
   * When set (e.g. `--llm-timeout-ms 600000`), this wins over the
   * per-skill default registry and the pack config for every LLM
   * call routed through this client instance. Used by `loop-run`,
   * `skill-run`, `docs-synthesize`. Per-call `opts.timeout_ms` from
   * the skill itself still wins over this.
   */
  readonly llmTimeoutOverrideMs?: number;
  /**
   * Phase 24.C (closes D-A-24): pack-config timeout overrides,
   * keyed by skill id. Adopters declare this via
   * `extractor_params.llm.llm_timeouts` on their stack-adapter pack
   * to lengthen / shorten the per-skill defaults. The CLI flag wins
   * over this; this wins over the built-in default registry.
   */
  readonly packTimeouts?: Readonly<Record<string, number>>;
}

/**
 * Phase 24.C (introduced) / Phase 25.C (raised): per-skill default
 * LLM timeouts. Used when the caller doesn't pass an explicit
 * `opts.timeout_ms` and no CLI/pack-config override is present.
 *
 * Phase 25.C raised the defaults because the 24.C values turned out
 * to be too tight for substantive claude-cli OAuth iterations (the
 * stynx U2 verification timed out on `SKILL-feedback-iteration` at
 * the 600s default — see D-A-25 + `docs/adopters/common-pitfalls.md`
 * "LLM call timeouts and per-skill defaults" for the p95 latency
 * table per backend).
 *
 * Defaults are tuned for the substantive case (real iteration on
 * real codebases via claude-cli OAuth) — adopters running against
 * an API-key backend can shorten via pack config to reflect the
 * 3-5x lower latency.
 *
 *   - assess-state    → 300s (was 60s; narrative + per-cell signals
 *                             is fast but not 60s-fast)
 *   - feedback-iter   → 1800s (was 600s; Engineer iteration can
 *                              author files + reason multi-step;
 *                              p95 25-35min via claude-cli OAuth)
 *   - triage / fix-*  → 900s (was 300s; focused single-file work
 *                             still 5-15min via claude-cli)
 *   - writers        → 900s (was 300s; writer-payload prompts can
 *                            be substantial — pii_map docs, large
 *                            api maps, etc.)
 *   - default        → 300s (was 120s; matches assess-state)
 *
 * Adopters override via `extractor_params.llm.llm_timeouts:
 * {[skillId]: ms}` on their pack; callers override per-invocation
 * via `--llm-timeout-ms` (CLI) or `opts.timeout_ms` (skill code).
 */
export const DEFAULT_SKILL_TIMEOUTS_MS: Readonly<Record<string, number>> = {
  'SKILL-assess-state': 300_000,
  'SKILL-feedback-iteration': 1_800_000,
  'SKILL-triage': 900_000,
  'SKILL-fix-lint': 900_000,
  'SKILL-fix-build': 900_000,
  'SKILL-fix-test': 900_000,
};

export const DEFAULT_LLM_TIMEOUT_FALLBACK_MS = 300_000;
export const DEFAULT_WRITER_TIMEOUT_MS = 900_000;

/**
 * Phase 25.C (D-A-25 follow-on): backend-aware timeout multiplier.
 * Adopters running against the host CLI (claude-cli / codex-cli)
 * see 3-5x higher p95 latency than direct-API adopters because the
 * OAuth roundtrip + host CLI's own model selection + the prompt-
 * caching layer all add overhead. The multiplier scales the
 * resolved per-skill default to compensate — preserving the
 * 1x ratio for direct-API backends and 3x for CLI bridges.
 *
 * Multiplier is applied AFTER caller-opts / CLI-flag / pack-config
 * (which are absolute and adopter-controlled) and BEFORE the per-
 * skill default lookup. It does NOT touch the writer-default or
 * global-fallback paths: those are catch-alls where the multiplier
 * would compound surprise.
 */
const BACKEND_MULTIPLIERS_DEFAULT: Readonly<Record<LlmFamily, number>> = {
  claude: 1,
  codex: 1,
  'claude-cli': 3,
  'codex-cli': 3,
  mock: 1,
};

export type LlmTimeoutSource =
  | 'caller-opts'
  | 'cli-flag'
  | 'pack-config'
  | 'per-skill-default'
  | 'writer-default'
  | 'global-fallback';

export interface ResolvedLlmTimeout {
  readonly value_ms: number;
  /** Base value before the backend multiplier is applied. */
  readonly base_value_ms: number;
  readonly source: LlmTimeoutSource;
  readonly skill_id: string | undefined;
  /** 1 for direct-API families, >1 for CLI bridges (Phase 25.C). */
  readonly backend_multiplier: number;
}

export interface ResolveTimeoutInputs {
  readonly skillId: string | undefined;
  readonly callerOptsMs: number | undefined;
  readonly cliOverrideMs: number | undefined;
  readonly packTimeouts: Readonly<Record<string, number>> | undefined;
  /** Phase 25.C: family used to pick the backend multiplier. */
  readonly family?: LlmFamily;
}

/**
 * Phase 24.C: deterministic resolution of the effective LLM call
 * timeout. Phase 25.C extension: the per-skill-default + writer-
 * default paths are scaled by a backend multiplier (3x for CLI
 * bridges, 1x for direct API), reflecting the empirically-observed
 * latency gap between the two paths.
 *
 * Precedence (high → low):
 *   1. callerOptsMs — the skill itself passed `opts.timeout_ms`
 *      (no multiplier — adopter knows what they're doing)
 *   2. cliOverrideMs — `--llm-timeout-ms <n>` (no multiplier)
 *   3. packTimeouts[skillId] — adopter pack config (no multiplier;
 *      pack values are already adopter-tuned)
 *   4. DEFAULT_SKILL_TIMEOUTS_MS[skillId] * backend_multiplier
 *   5. DEFAULT_WRITER_TIMEOUT_MS * backend_multiplier
 *      (for SKILL-write-* prefix matches)
 *   6. DEFAULT_LLM_TIMEOUT_FALLBACK_MS (no multiplier — catch-all)
 *
 * The original 4-argument signature is preserved for back-compat;
 * the new ResolveTimeoutInputs object form is the recommended path.
 */
export function resolveLlmTimeoutMs(
  skillId: string | undefined,
  callerOptsMs: number | undefined,
  cliOverrideMs: number | undefined,
  packTimeouts: Readonly<Record<string, number>> | undefined,
  family?: LlmFamily,
): ResolvedLlmTimeout {
  const multiplier =
    family !== undefined && BACKEND_MULTIPLIERS_DEFAULT[family] !== undefined
      ? BACKEND_MULTIPLIERS_DEFAULT[family]
      : 1;
  if (callerOptsMs !== undefined) {
    return {
      value_ms: callerOptsMs,
      base_value_ms: callerOptsMs,
      source: 'caller-opts',
      skill_id: skillId,
      backend_multiplier: 1,
    };
  }
  if (cliOverrideMs !== undefined) {
    return {
      value_ms: cliOverrideMs,
      base_value_ms: cliOverrideMs,
      source: 'cli-flag',
      skill_id: skillId,
      backend_multiplier: 1,
    };
  }
  if (skillId !== undefined && packTimeouts !== undefined) {
    const v = packTimeouts[skillId];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      return {
        value_ms: v,
        base_value_ms: v,
        source: 'pack-config',
        skill_id: skillId,
        backend_multiplier: 1,
      };
    }
  }
  if (skillId !== undefined && DEFAULT_SKILL_TIMEOUTS_MS[skillId] !== undefined) {
    const base = DEFAULT_SKILL_TIMEOUTS_MS[skillId] as number;
    return {
      value_ms: base * multiplier,
      base_value_ms: base,
      source: 'per-skill-default',
      skill_id: skillId,
      backend_multiplier: multiplier,
    };
  }
  if (skillId !== undefined && skillId.startsWith('SKILL-write-')) {
    return {
      value_ms: DEFAULT_WRITER_TIMEOUT_MS * multiplier,
      base_value_ms: DEFAULT_WRITER_TIMEOUT_MS,
      source: 'writer-default',
      skill_id: skillId,
      backend_multiplier: multiplier,
    };
  }
  return {
    value_ms: DEFAULT_LLM_TIMEOUT_FALLBACK_MS,
    base_value_ms: DEFAULT_LLM_TIMEOUT_FALLBACK_MS,
    source: 'global-fallback',
    skill_id: skillId,
    backend_multiplier: 1,
  };
}

interface LlmConfig {
  readonly default_family?: LlmFamily;
  readonly default_model_claude?: string;
  readonly default_model_codex?: string;
  readonly default_model_claude_cli?: string;
  readonly default_model_codex_cli?: string;
  readonly max_budget_usd_cli?: number;
  readonly rate_limit_claude_rpm?: number;
  readonly rate_limit_codex_rpm?: number;
}

const KNOWN_FAMILIES: ReadonlySet<LlmFamily> = new Set<LlmFamily>([
  'claude',
  'codex',
  'mock',
  'claude-cli',
  'codex-cli',
]);

function isKnownFamily(v: unknown): v is LlmFamily {
  return typeof v === 'string' && KNOWN_FAMILIES.has(v as LlmFamily);
}

function loadLlmConfig(repoRoot: string): LlmConfig {
  const path = join(repoRoot, '.devai/config/llm.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as LlmConfig;
  } catch {
    return {};
  }
}

function commandAvailable(command: 'claude' | 'codex'): boolean {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    encoding: 'utf8',
    stdio: 'ignore',
  });
  return result.status === 0;
}

/**
 * Resolve the effective family per the precedence ladder:
 *   1. DEVAI_LLM_BACKEND env var
 *   2. opts.family (if not 'auto')
 *   3. .devai/config/llm.json default_family
 *   4. natural host CLI credentials: claude-cli, then codex-cli
 *   5. fallback to 'mock' only when no natural real provider is available
 */
function resolveFamily(optsFamily: LlmFamily | 'auto' | undefined, config: LlmConfig): LlmFamily {
  const envBackend = process.env.DEVAI_LLM_BACKEND;
  if (isKnownFamily(envBackend)) return envBackend;
  if (optsFamily !== undefined && optsFamily !== 'auto') return optsFamily;
  if (isKnownFamily(config.default_family)) return config.default_family;
  if (commandAvailable('claude')) return 'claude-cli';
  if (commandAvailable('codex')) return 'codex-cli';
  return 'mock';
}

/**
 * Build an LlmClient. Wraps the chosen provider in a rate limiter
 * (unless disabled) and a telemetry interceptor that records every
 * successful call to record/proofs/work/llm-usage.jsonl and enforces the
 * DEVAI_LLM_BUDGET_USD cap (set in telemetry.ts).
 */
export function createLlmClient(opts: CreateLlmClientOptions = {}): LlmClient {
  const repoRoot = opts.repoRoot ?? '.';
  const config = loadLlmConfig(repoRoot);
  const family = resolveFamily(opts.family, config);

  let base: LlmClient;
  if (family === 'mock') {
    base = new MockLlmClient({
      ...(opts.mockResponses !== undefined && { responses: opts.mockResponses }),
      ...(opts.mockStrict === true && { strict: true }),
      ...(opts.model !== undefined && { model: opts.model }),
    });
  } else if (family === 'claude') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey === undefined || apiKey === '') {
      throw new Error(
        'createLlmClient: family=claude requires ANTHROPIC_API_KEY (set in env, or DEVAI_LLM_BACKEND=claude-cli to use the Claude Code CLI with host OAuth, or DEVAI_LLM_BACKEND=mock)',
      );
    }
    base = new AnthropicLlmClient({
      apiKey,
      ...(opts.model !== undefined && { model: opts.model }),
      ...(config.default_model_claude !== undefined &&
        opts.model === undefined && { model: config.default_model_claude }),
    });
  } else if (family === 'codex') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey === undefined || apiKey === '') {
      throw new Error(
        'createLlmClient: family=codex requires OPENAI_API_KEY (set in env, or DEVAI_LLM_BACKEND=codex-cli to use the codex CLI with host OAuth, or DEVAI_LLM_BACKEND=mock)',
      );
    }
    base = new CodexLlmClient({
      apiKey,
      ...(opts.model !== undefined && { model: opts.model }),
      ...(config.default_model_codex !== undefined &&
        opts.model === undefined && { model: config.default_model_codex }),
    });
  } else if (family === 'claude-cli') {
    // Phase 20.C (D-A-6): no API key required; auth delegated to the
    // host Claude Code CLI's OAuth session.
    const cliModel = opts.model ?? config.default_model_claude_cli ?? undefined;
    base = new CliLlmClient({
      cli: 'claude',
      ...(cliModel !== undefined && { model: cliModel }),
      ...(config.max_budget_usd_cli !== undefined && {
        maxBudgetUsd: config.max_budget_usd_cli,
      }),
    });
  } else {
    // codex-cli
    const cliModel = opts.model ?? config.default_model_codex_cli ?? undefined;
    base = new CliLlmClient({
      cli: 'codex',
      ...(cliModel !== undefined && { model: cliModel }),
      ...(config.max_budget_usd_cli !== undefined && {
        maxBudgetUsd: config.max_budget_usd_cli,
      }),
    });
  }

  const rateOpts: RateLimitOptions = {
    ...(family === 'claude' &&
      config.rate_limit_claude_rpm !== undefined && {
        rpm: config.rate_limit_claude_rpm,
      }),
    ...(family === 'codex' &&
      config.rate_limit_codex_rpm !== undefined && {
        rpm: config.rate_limit_codex_rpm,
      }),
    ...opts.rateLimit,
  };
  // Rate-limit only the SDK families. Mock has no quota; CLI bridges
  // are gated by the host CLI's own concurrency limits.
  const skipRateLimit =
    opts.disableRateLimit === true ||
    family === 'mock' ||
    family === 'claude-cli' ||
    family === 'codex-cli';
  const rateLimited = skipRateLimit ? base : new RateLimitedLlmClient(base, rateOpts);

  // Phase 24.C: timeout resolver — applies the per-skill default
  // registry + pack config + CLI override at LLM-call time, using
  // `meta.caller` as the skill-id key. Wraps `base` so the timeout
  // resolution happens inside both rate-limiting + telemetry.
  const timeoutResolved = new TimeoutResolverWrapper(rateLimited, {
    ...(opts.llmTimeoutOverrideMs !== undefined && {
      cliOverrideMs: opts.llmTimeoutOverrideMs,
    }),
    ...(opts.packTimeouts !== undefined && { packTimeouts: opts.packTimeouts }),
  });

  // Outermost wrapper: telemetry + budget enforcement.
  return new TelemetryWrapper(timeoutResolved, repoRoot, opts.disableTelemetry === true);
}

/**
 * Phase 24.C (closes D-A-24): per-call timeout resolver. Reads the
 * caller's skill id from `meta.caller`, computes the effective
 * timeout per `resolveLlmTimeoutMs` precedence, and forwards
 * `opts.timeout_ms = resolved.value_ms` to the inner client when
 * no caller-explicit value is set. On timeout error, rewrites the
 * message to name the resolution source so adopters know which lever
 * to pull (CLI flag vs pack config vs built-in default).
 */
class TimeoutResolverWrapper implements LlmClient {
  readonly family: LlmClient['family'];
  readonly model: string;
  private readonly cliOverrideMs: number | undefined;
  private readonly packTimeouts: Readonly<Record<string, number>> | undefined;
  constructor(
    private readonly inner: LlmClient,
    opts: { cliOverrideMs?: number; packTimeouts?: Readonly<Record<string, number>> },
  ) {
    this.family = inner.family;
    this.model = inner.model;
    this.cliOverrideMs = opts.cliOverrideMs;
    this.packTimeouts = opts.packTimeouts;
  }
  async complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    // Phase 25.C (D-A-25): pass the inner client's `family` so the
    // per-skill default + writer-default paths get scaled by the
    // backend multiplier (3x for claude-cli / codex-cli; 1x for
    // direct-API claude / codex; 1x for mock). Caller-opts, CLI
    // flag, and pack-config values bypass the multiplier — they're
    // already adopter-controlled absolute values.
    const resolved = resolveLlmTimeoutMs(
      meta.caller,
      opts?.timeout_ms,
      this.cliOverrideMs,
      this.packTimeouts,
      this.inner.family,
    );
    const enrichedOpts: LlmCompleteOptions = { ...opts, timeout_ms: resolved.value_ms };
    try {
      return await this.inner.complete(messages, meta, enrichedOpts);
    } catch (err) {
      if (err instanceof Error && /call timed out after/.test(err.message)) {
        const suggested = suggestNextTimeoutMs(resolved.value_ms);
        const sourceLabel = describeTimeoutSource(resolved);
        throw new Error(
          `${err.message} Source: ${sourceLabel}. To increase, retry with --llm-timeout-ms ${String(suggested)} (next step) or set extractor_params.llm.llm_timeouts.${resolved.skill_id ?? '<skill-id>'} = ${String(suggested)} on your stack-adapter pack.`,
        );
      }
      throw err;
    }
  }
}

function describeTimeoutSource(r: ResolvedLlmTimeout): string {
  // Phase 25.C: when the backend multiplier is active, surface the
  // base value AND the multiplier in the error message so adopters
  // know both the upstream lever (per-skill default) and the
  // backend-aware scaling.
  const multiplierNote =
    r.backend_multiplier !== 1
      ? ` × ${String(r.backend_multiplier)}x backend multiplier (base ${String(r.base_value_ms)}ms)`
      : '';
  switch (r.source) {
    case 'caller-opts':
      return `caller opts.timeout_ms (${String(r.value_ms)}ms)`;
    case 'cli-flag':
      return `--llm-timeout-ms flag (${String(r.value_ms)}ms)`;
    case 'pack-config':
      return `pack config llm_timeouts[${r.skill_id ?? '?'}] (${String(r.value_ms)}ms)`;
    case 'per-skill-default':
      return `built-in default for ${r.skill_id ?? '?'} (${String(r.value_ms)}ms${multiplierNote})`;
    case 'writer-default':
      return `built-in writer default (${String(r.value_ms)}ms${multiplierNote}; matched ${r.skill_id ?? '?'} via SKILL-write-* prefix)`;
    case 'global-fallback':
      return `global fallback (${String(r.value_ms)}ms; no skill id supplied in meta.caller)`;
  }
}

function suggestNextTimeoutMs(currentMs: number): number {
  // Next-larger step in the registry. Keep simple: round up to the
  // next 60s/300s/600s/1800s/3600s.
  const steps = [60_000, 120_000, 300_000, 600_000, 1_800_000, 3_600_000];
  for (const s of steps) {
    if (s > currentMs) return s;
  }
  return currentMs * 2;
}

class TelemetryWrapper implements LlmClient {
  readonly family: LlmClient['family'];
  readonly model: string;
  constructor(
    private readonly inner: LlmClient,
    private readonly repoRoot: string,
    private readonly disableTelemetry: boolean,
  ) {
    this.family = inner.family;
    this.model = inner.model;
  }
  async complete(
    messages: LlmMessages,
    meta: LlmPromptMeta,
    opts?: LlmCompleteOptions,
  ): Promise<LlmResponse> {
    // Enforce budget BEFORE the call (cheaper to refuse than to spend
    // and refuse the next one). The post-call assert below catches
    // crossings that happen mid-batch.
    assertWithinBudget();
    const response = await this.inner.complete(messages, meta, opts);
    if (!this.disableTelemetry) {
      recordUsage(this.repoRoot, response, meta);
    }
    // Re-check after recording so the NEXT call (or the caller's next
    // step) sees the updated total.
    assertWithinBudget();
    return response;
  }
}
