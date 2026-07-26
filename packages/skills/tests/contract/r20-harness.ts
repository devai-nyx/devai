// R20.W1 shared characterization harness (Inspector; D-137 v2 matrix).
// Capture mode: R20_CAPTURE=1 writes baselines under fixtures/r20-baseline/;
// committed tests only compare. Fixtures are never normalized to pass —
// a delta stops the slice (Plan.md, parity contract).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  LlmClient,
  LlmCompleteOptions,
  LlmMessages,
  LlmPromptMeta,
  LlmResponse,
} from '../../src/llm/types.js';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const BASELINE_DIR = join(HERE, 'fixtures/r20-baseline');
export const CAPTURE = process.env['R20_CAPTURE'] === '1';

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/** Deterministic stable-key-order stringify (canonical JSON for fixtures). */
export function canonical(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v !== null && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        out[k] = sort((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sort(value), null, 2) + '\n';
}

/** Compare-or-capture a named baseline fixture. Returns the baseline text. */
export function baseline(name: string, current: string): { expected: string; captured: boolean } {
  const path = join(BASELINE_DIR, name);
  if (CAPTURE) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, current);
    return { expected: current, captured: true };
  }
  if (!existsSync(path)) {
    throw new Error(`r20-baseline fixture missing: ${name} — run W1 capture (R20_CAPTURE=1) first`);
  }
  // Parse-then-recanonicalize: parity is over exact CONTENT (canonical
  // form), immune to formatter churn on the stored fixture file.
  return { expected: canonical(JSON.parse(readFileSync(path, 'utf8'))), captured: false };
}

export interface RecordedCall {
  readonly seq: number;
  readonly messages: LlmMessages;
  readonly meta: LlmPromptMeta;
  readonly opts: LlmCompleteOptions | null;
}

export interface RecordingClient extends LlmClient {
  readonly calls: RecordedCall[];
}

/**
 * The W1 prompt-parity authority (matrix row 4): records every outbound
 * payload byte-for-byte and returns a fully deterministic response. The
 * response text echoes a stable digest of the request so downstream skill
 * logic that embeds response content stays deterministic too.
 */
export function makeRecordingClient(cannedJson?: unknown): RecordingClient {
  const calls: RecordedCall[] = [];
  return {
    family: 'claude',
    model: 'mock-deterministic',
    calls,
    complete(
      messages: LlmMessages,
      meta: LlmPromptMeta,
      opts?: LlmCompleteOptions,
    ): Promise<LlmResponse> {
      calls.push({ seq: calls.length, messages, meta, opts: opts ?? null });
      const digest = sha256(messages.system + '\0' + messages.user).slice(0, 16);
      const text =
        cannedJson !== undefined
          ? JSON.stringify(cannedJson)
          : `[r20-mock:${digest}] deterministic characterization response.`;
      return Promise.resolve({
        text,
        family: 'claude',
        model: 'mock-deterministic',
        usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0 },
        finish_reason: 'stop',
        latency_ms: 0,
        ...(cannedJson !== undefined && { json: cannedJson }),
      });
    },
  };
}

const VOLATILE_KEYS = new Set([
  'timestamp',
  'created_at',
  'closed_at',
  'generated_at',
  'started_at',
  'finished_at',
  'duration_ms',
  'latency_ms',
  'cost_usd',
]);

const ANSI_SEQUENCE = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/**
 * Normalize a skill result for signature purposes: volatile keys masked,
 * absolute fixture paths rewritten to <FIXTURE>, 16-hex ids masked.
 * The rule set is part of the fixture contract (matrix row 5).
 */
export function normalize(value: unknown, fixtureRoot: string): unknown {
  let fixtureRealpath = fixtureRoot;
  try {
    fixtureRealpath = realpathSync(fixtureRoot);
  } catch {
    // Some callers normalize evidence after a disposable fixture is gone.
    // The lexical path remains the only available alias in that case.
  }
  const fixtureAliases = [...new Set([fixtureRoot, fixtureRealpath])].sort(
    (a, b) => b.length - a.length,
  );
  const walk = (v: unknown, key?: string): unknown => {
    if (typeof v === 'string') {
      // Key-/source-aware masking (W1 correction contract item 5): every
      // mask names a specific volatile identifier class with its reason.
      // Semantic/evidence/content/stack hashes are PRESERVED — a drifting
      // content hash must fail parity, never vanish into a blanket mask.
      let s = v.replace(ANSI_SEQUENCE, '');
      for (const alias of fixtureAliases) s = s.split(alias).join('<FIXTURE>');
      // Vitest selects a per-file progress line in CI but omits it in the
      // local non-interactive reporter. The exact R20 fixture has one fixed
      // passing test; its progress duration is presentation, while summary
      // metrics and raw SensorReading output remain unmodified.
      s = s.replace(/^[ \t]*✓ tests\/fixture\.test\.ts \(1 test\) \d+ms\n/gmu, '');
      // ISO timestamps: wall-clock.
      s = s.replace(/\d{4}-\d{2}-\d{2}T[0-9:.]+Z/g, '<TS>');
      // Vitest's human reporter embeds wall-clock start time and aggregate
      // duration/phase timings in evidence heads even when assertions and
      // fixtures are deterministic.
      s = s.replace(/Start at\s+\d{2}:\d{2}:\d{2}/g, 'Start at <TIME>');
      s = s.replace(/Duration\s+[^\n]+/g, 'Duration <DURATION>');
      // Compact timestamp ids (AS-/SC- record ids embed wall-clock even
      // under a pinned ctx.timestamp).
      s = s.replace(/\d{8}T\d{6}/g, '<TSC>');
      // Subprocess PIDs in tool stderr.
      s = s.replace(/\(node:\d+\)/g, '(node:<PID>)');
      // SensorReading / evidence-record ids: hashed over payloads that
      // include wall-clock timestamps — volatile by construction. RGR/DEC
      // counter ids are deterministic from fresh fixtures and stay raw.
      s = s.replace(/\bSR-[0-9a-f]{8,32}\b/g, 'SR-<ID>');
      s = s.replace(/\bEV-[0-9a-f]{8,32}\b/g, 'EV-<ID>');
      return s;
    }
    if (typeof v === 'number' && key !== undefined && VOLATILE_KEYS.has(key)) return '<N>';
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v !== null && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = VOLATILE_KEYS.has(k) && typeof val === 'string' ? '<TS>' : walk(val, k);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}

// Invariants: INV-DEVAI-001
