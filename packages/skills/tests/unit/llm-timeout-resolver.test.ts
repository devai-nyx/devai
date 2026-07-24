import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKILL_TIMEOUTS_MS,
  DEFAULT_WRITER_TIMEOUT_MS,
  DEFAULT_LLM_TIMEOUT_FALLBACK_MS,
  resolveLlmTimeoutMs,
} from '../../src/llm/factory.js';

/**
 * Phase 24.C (closes D-A-24): per-skill LLM timeout resolution.
 * `resolveLlmTimeoutMs` is the deterministic precedence ladder:
 * caller opts > CLI flag > pack config > per-skill default >
 * writer-prefix default > global fallback (120s).
 */
describe('resolveLlmTimeoutMs (Phase 24.C / D-A-24)', () => {
  it('returns the caller opts.timeout_ms when set (highest precedence)', () => {
    const r = resolveLlmTimeoutMs('SKILL-feedback-iteration', 999_999, 300_000, {
      'SKILL-feedback-iteration': 500_000,
    });
    expect(r.value_ms).toBe(999_999);
    expect(r.source).toBe('caller-opts');
  });

  it('returns the CLI override when caller opts absent', () => {
    const r = resolveLlmTimeoutMs('SKILL-feedback-iteration', undefined, 450_000, {
      'SKILL-feedback-iteration': 500_000,
    });
    expect(r.value_ms).toBe(450_000);
    expect(r.source).toBe('cli-flag');
  });

  it('returns pack-config value when CLI override absent', () => {
    const r = resolveLlmTimeoutMs('SKILL-feedback-iteration', undefined, undefined, {
      'SKILL-feedback-iteration': 500_000,
    });
    expect(r.value_ms).toBe(500_000);
    expect(r.source).toBe('pack-config');
  });

  it('returns Phase-25.C per-skill default when pack-config absent (no backend → no multiplier)', () => {
    const r = resolveLlmTimeoutMs('SKILL-feedback-iteration', undefined, undefined, undefined);
    // Phase 25.C raised the default from 600s to 1800s (30min) —
    // claude-cli OAuth iterations on real codebases need it.
    expect(r.value_ms).toBe(1_800_000);
    expect(r.source).toBe('per-skill-default');
    expect(r.value_ms).toBe(DEFAULT_SKILL_TIMEOUTS_MS['SKILL-feedback-iteration']);
    // No family supplied → multiplier = 1, value_ms == base_value_ms.
    expect(r.backend_multiplier).toBe(1);
    expect(r.base_value_ms).toBe(1_800_000);
  });

  it('returns Phase-25.C assess-state default 300s (was 60s pre-25.C)', () => {
    const r = resolveLlmTimeoutMs('SKILL-assess-state', undefined, undefined, undefined);
    expect(r.value_ms).toBe(300_000);
    expect(r.source).toBe('per-skill-default');
  });

  it('returns Phase-25.C triage / fix-* defaults at 900s (was 300s pre-25.C)', () => {
    expect(resolveLlmTimeoutMs('SKILL-triage', undefined, undefined, undefined).value_ms).toBe(
      900_000,
    );
    expect(resolveLlmTimeoutMs('SKILL-fix-lint', undefined, undefined, undefined).value_ms).toBe(
      900_000,
    );
    expect(resolveLlmTimeoutMs('SKILL-fix-build', undefined, undefined, undefined).value_ms).toBe(
      900_000,
    );
    expect(resolveLlmTimeoutMs('SKILL-fix-test', undefined, undefined, undefined).value_ms).toBe(
      900_000,
    );
  });

  it('matches SKILL-write-* prefix to Phase-25.C writer default 900s (was 300s pre-25.C)', () => {
    const r = resolveLlmTimeoutMs('SKILL-write-overview', undefined, undefined, undefined);
    expect(r.value_ms).toBe(DEFAULT_WRITER_TIMEOUT_MS);
    expect(r.value_ms).toBe(900_000);
    expect(r.source).toBe('writer-default');
    expect(
      resolveLlmTimeoutMs('SKILL-write-api-map', undefined, undefined, undefined).value_ms,
    ).toBe(900_000);
  });

  it('falls back to Phase-25.C global default 300s when skill id is unknown (was 120s pre-25.C)', () => {
    const r = resolveLlmTimeoutMs('SKILL-novel-thing', undefined, undefined, undefined);
    expect(r.value_ms).toBe(DEFAULT_LLM_TIMEOUT_FALLBACK_MS);
    expect(r.value_ms).toBe(300_000);
    expect(r.source).toBe('global-fallback');
  });

  it('falls back to global default when skill id is undefined (no meta.caller)', () => {
    const r = resolveLlmTimeoutMs(undefined, undefined, undefined, undefined);
    expect(r.value_ms).toBe(DEFAULT_LLM_TIMEOUT_FALLBACK_MS);
    expect(r.source).toBe('global-fallback');
  });

  it('ignores non-positive / non-finite pack-config entries (defensive)', () => {
    const r = resolveLlmTimeoutMs('SKILL-feedback-iteration', undefined, undefined, {
      'SKILL-feedback-iteration': 0,
    });
    // 0 is non-positive → ignored → falls through to per-skill default (1800s).
    expect(r.value_ms).toBe(1_800_000);
    expect(r.source).toBe('per-skill-default');
  });

  it('honours pack-config override that shortens the per-skill default', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      undefined,
      { 'SKILL-feedback-iteration': 30_000 }, // adopter wants 30s
    );
    expect(r.value_ms).toBe(30_000);
    expect(r.source).toBe('pack-config');
  });

  it('CLI flag wins over pack-config (precedence ladder regression)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      999_000, // CLI: 999s
      { 'SKILL-feedback-iteration': 30_000 }, // pack: 30s
    );
    expect(r.value_ms).toBe(999_000);
    expect(r.source).toBe('cli-flag');
  });
});

/**
 * Phase 25.C (D-A-25): backend-aware multiplier. Direct-API
 * families (claude / codex) keep multiplier=1; CLI bridges
 * (claude-cli / codex-cli) get 3x because OAuth + prompt-caching +
 * host CLI overhead measurably increases p95 latency. The
 * multiplier scales the per-skill-default and writer-default
 * resolution paths only — caller-opts / CLI-flag / pack-config are
 * absolute (adopter-controlled) and not multiplied.
 */
describe('resolveLlmTimeoutMs backend-aware multiplier (Phase 25.C / D-A-25)', () => {
  it('claude-cli backend triples the per-skill default', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      undefined,
      undefined,
      'claude-cli',
    );
    expect(r.base_value_ms).toBe(1_800_000);
    expect(r.backend_multiplier).toBe(3);
    expect(r.value_ms).toBe(5_400_000); // 1800s * 3 = 90min
    expect(r.source).toBe('per-skill-default');
  });

  it('codex-cli backend also triples (parity with claude-cli)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-assess-state',
      undefined,
      undefined,
      undefined,
      'codex-cli',
    );
    expect(r.base_value_ms).toBe(300_000);
    expect(r.backend_multiplier).toBe(3);
    expect(r.value_ms).toBe(900_000); // 300s * 3 = 15min
  });

  it('claude direct-API backend leaves the default unmultiplied (1x)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      undefined,
      undefined,
      'claude',
    );
    expect(r.value_ms).toBe(1_800_000);
    expect(r.backend_multiplier).toBe(1);
  });

  it('codex direct-API backend leaves the default unmultiplied', () => {
    expect(
      resolveLlmTimeoutMs('SKILL-fix-lint', undefined, undefined, undefined, 'codex').value_ms,
    ).toBe(900_000);
  });

  it('mock backend has no multiplier (matches direct-API behavior)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      undefined,
      undefined,
      'mock',
    );
    expect(r.backend_multiplier).toBe(1);
    expect(r.value_ms).toBe(1_800_000);
  });

  it('multiplier applies to writer-default path (SKILL-write-* prefix)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-write-overview',
      undefined,
      undefined,
      undefined,
      'claude-cli',
    );
    expect(r.value_ms).toBe(2_700_000); // 900s * 3
    expect(r.base_value_ms).toBe(900_000);
    expect(r.backend_multiplier).toBe(3);
    expect(r.source).toBe('writer-default');
  });

  it('multiplier does NOT apply to caller-opts (absolute override)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      55_555, // caller opts
      undefined,
      undefined,
      'claude-cli',
    );
    expect(r.value_ms).toBe(55_555);
    expect(r.backend_multiplier).toBe(1);
    expect(r.source).toBe('caller-opts');
  });

  it('multiplier does NOT apply to CLI flag (absolute override)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      888_888,
      undefined,
      'claude-cli',
    );
    expect(r.value_ms).toBe(888_888);
    expect(r.backend_multiplier).toBe(1);
    expect(r.source).toBe('cli-flag');
  });

  it('multiplier does NOT apply to pack-config (adopter-tuned absolute)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-feedback-iteration',
      undefined,
      undefined,
      { 'SKILL-feedback-iteration': 42_000 },
      'claude-cli',
    );
    expect(r.value_ms).toBe(42_000);
    expect(r.backend_multiplier).toBe(1);
    expect(r.source).toBe('pack-config');
  });

  it('multiplier does NOT apply to global-fallback (unknown skill catch-all)', () => {
    const r = resolveLlmTimeoutMs(
      'SKILL-novel-thing',
      undefined,
      undefined,
      undefined,
      'claude-cli',
    );
    expect(r.value_ms).toBe(300_000);
    expect(r.backend_multiplier).toBe(1);
    expect(r.source).toBe('global-fallback');
  });
});
// Invariants: INV-DEVAI-001
