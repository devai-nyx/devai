import { describe, expect, it } from 'vitest';
import { canonicalJsonV1, canonicalJsonV2, canonicalSha256 } from '../../src/canonical-json/index.js';

describe('canonicalJsonV1 (legacy)', () => {
  it('sorts top-level keys lexicographically', () => {
    expect(canonicalJsonV1({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('filters nested object keys (the array-replacer applies recursively — known v1.0 quirk)', () => {
    // `JSON.stringify(obj, replacer)` where replacer is an array
    // applies that allowlist to EVERY nested object. Because the
    // top-level Object.keys(...).sort() array contains only the
    // top-level keys, nested objects' keys are filtered out wholesale.
    // This is why v1.0 hashes are insensitive to nested content
    // changes and why we want v2.0 (deep-sort, real canonical) for
    // new writes.
    const out = canonicalJsonV1({ b: { y: 1, x: 2 }, a: 3 });
    expect(out).toBe('{"a":3,"b":{}}');
  });

  it('passes through primitives', () => {
    expect(canonicalJsonV1(42)).toBe('42');
    expect(canonicalJsonV1('hi')).toBe('"hi"');
    expect(canonicalJsonV1(null)).toBe('null');
  });
});

describe('canonicalJsonV2 (deep-sort)', () => {
  it('sorts top-level keys lexicographically', () => {
    expect(canonicalJsonV2({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('recursively sorts nested object keys', () => {
    const out = canonicalJsonV2({ b: { y: 1, x: 2 }, a: 3 });
    expect(out).toBe('{"a":3,"b":{"x":2,"y":1}}');
  });

  it('preserves array order (arrays are semantically ordered)', () => {
    expect(canonicalJsonV2([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles deeply nested mixed structures', () => {
    const input = {
      z: [
        { b: 2, a: 1 },
        { d: 4, c: 3 },
      ],
      a: { nested: { y: 1, x: 2 } },
    };
    const out = canonicalJsonV2(input);
    // Outer keys sorted: a, z. Inner objects in array also sorted.
    expect(out).toBe('{"a":{"nested":{"x":2,"y":1}},"z":[{"a":1,"b":2},{"c":3,"d":4}]}');
  });

  it('passes through primitives', () => {
    expect(canonicalJsonV2(42)).toBe('42');
    expect(canonicalJsonV2('hi')).toBe('"hi"');
    expect(canonicalJsonV2(null)).toBe('null');
    expect(canonicalJsonV2(true)).toBe('true');
  });
});

describe('canonicalSha256', () => {
  it('produces a deterministic 64-char hex string', () => {
    const h = canonicalSha256({ a: 1, b: 2 });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('defaults to v2.0', () => {
    // Same value, v2.0 (default) vs v1.0 explicit: should differ on
    // any value with nested objects in non-sorted insertion order.
    const value = { z: { b: 1, a: 2 }, a: 3 };
    expect(canonicalSha256(value)).not.toBe(canonicalSha256(value, '1.0'));
  });

  it('v1.0 and v2.0 agree on flat objects', () => {
    // No nested objects → no recursive-sort effect → same output.
    const value = { a: 1, b: 2, c: 'x' };
    expect(canonicalSha256(value, '1.0')).toBe(canonicalSha256(value, '2.0'));
  });

  it('is stable under key-insertion-order changes (v2.0)', () => {
    const a = { x: 1, y: { p: 1, q: 2 } };
    const b = { y: { q: 2, p: 1 }, x: 1 };
    expect(canonicalSha256(a, '2.0')).toBe(canonicalSha256(b, '2.0'));
  });

  it('v1.0 collapses nested objects to {} (documents the legacy quirk)', () => {
    // Because v1.0 uses JSON.stringify with an array replacer
    // (top-level keys only), nested objects' keys are filtered out.
    // So {x:{p:1}} and {x:{q:2}} produce the SAME v1.0 hash — v1.0
    // is insensitive to nested content. v2.0 fixes this.
    const a = { x: { p: 1 } };
    const b = { x: { q: 2 } };
    expect(canonicalSha256(a, '1.0')).toBe(canonicalSha256(b, '1.0'));
    expect(canonicalSha256(a, '2.0')).not.toBe(canonicalSha256(b, '2.0'));
  });
});
// Invariants: INV-DEVAI-001
