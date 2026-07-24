import { createHash } from 'node:crypto';

/**
 * Canonical-JSON helpers for content hashing of governance records
 * (Phase 16.G, closes the canonical-hash divergence item from
 * known-tech-debt.md).
 *
 * Two algorithms are supported. The version-stamped helper
 * `canonicalSha256(value, version)` dispatches; record schemas that
 * store a `manifest_hash` (agent-run, rtd-manifest) also carry an
 * optional `hash_algo_version` field that names which algorithm was
 * in force when the hash was computed. Absence means '1.0'
 * (backward-compatible read of records written before this batch).
 *
 *   v1.0 — `JSON.stringify(value, Object.keys(value).sort())`.
 *     The replacer is an *array allowlist applied recursively to
 *     EVERY object in the tree*, including nested ones. Because the
 *     allowlist contains only the top-level keys, nested objects'
 *     keys are filtered out wholesale (a nested object renders as
 *     `{}` unless its own keys happen to coincide with top-level
 *     names). This is what agent-run / rgr / release historically
 *     used. Hashes computed under v1.0 are insensitive to most
 *     nested content changes — a real limitation of the legacy form,
 *     preserved here only so existing persisted records continue to
 *     verify.
 *
 *   v2.0 — true recursive deep-sort canonicalisation. Every nested
 *     object's keys are emitted in lexicographic order. This is the
 *     correct algorithm for hash stability under refactoring; it is
 *     what `rtd-manifest` has always used (its `hashCanonical` is
 *     now this function).
 *
 * Going forward, all NEW writes by canonical DEVAI's record-emitting
 * modules use v2.0. Existing persisted records keep their v1.0
 * hashes (verifying via the v1.0 algorithm when their
 * `hash_algo_version` field is absent or equals '1.0'). The two
 * algorithms coexist in the substrate; per-record dispatch decides
 * which to run for any given verification call.
 */

export type CanonicalHashAlgoVersion = '1.0' | '2.0';

/** Default version for new writes. Reads of records lacking the field default to v1.0. */
export const DEFAULT_CANONICAL_HASH_ALGO_VERSION: CanonicalHashAlgoVersion = '2.0';

/**
 * v1.0 canonicalisation: shallow-sort via `JSON.stringify` replacer.
 * Preserves the historical algorithm for backward-compatible
 * verification of records written before Phase 16.G.
 */
export function canonicalJsonV1(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  const obj = value as Record<string, unknown>;
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * v2.0 canonicalisation: recursive deep-sort. Every nested object
 * has its keys emitted in lexicographic order. Arrays preserve
 * their order (semantically ordered). Primitives serialise via
 * normal `JSON.stringify`.
 */
export function canonicalJsonV2(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalJsonV2(v)).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const k of keys) {
    parts.push(JSON.stringify(k) + ':' + canonicalJsonV2(obj[k]));
  }
  return '{' + parts.join(',') + '}';
}

/**
 * Dispatch to the appropriate algorithm by version, then SHA-256.
 * Pass an explicit `version` to verify a stored record; omit (or
 * pass undefined) to use the current default for new writes.
 */
export function canonicalSha256(
  value: unknown,
  version: CanonicalHashAlgoVersion = DEFAULT_CANONICAL_HASH_ALGO_VERSION,
): string {
  const canonical = version === '1.0' ? canonicalJsonV1(value) : canonicalJsonV2(value);
  return createHash('sha256').update(canonical).digest('hex');
}
