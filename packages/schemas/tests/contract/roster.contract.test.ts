import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROSTER, INFRASTRUCTURE } from '../../src/roster.js';
import {
  getValidator,
  listSchemaFiles,
  metaGate,
  checkSchema,
  checkSchemas,
} from '../../src/index.js';

const R = join(import.meta.dirname, '..', '..', '..', '..');

describe('roster', () => {
  it('bijects with the complete law/schemas population', () => {
    expect(new Set(ROSTER).size).toBe(ROSTER.length);
    expect(listSchemaFiles()).toEqual([...ROSTER].sort());
  });
  it('every roster schema parses and lazily compiles', () => {
    for (const name of ROSTER) expect(getValidator(name)).toBeTypeOf('function');
  });
  it('infrastructure schemas are roster members', () => {
    for (const i of INFRASTRUCTURE) expect(ROSTER).toContain(i);
  });
  it('rejects a malformed round-close manifest', () => {
    const validate = getValidator('round-close-manifest.schema.json');
    expect(validate({ schemaVersion: '1.0.0' })).toBe(false);
    expect(validate.errors?.length).toBeGreaterThan(0);
  });
});
// Invariants: INV-DEVAI-001

describe('live instances validate (the W02 recipe, proven)', () => {
  it('all 34 invariants green', () => {
    const v = getValidator('invariant.schema.json');
    const dir = join(R, 'law', 'invariants');
    const files = readdirSync(dir).filter((f) => f.startsWith('INV-'));
    expect(files.length).toBe(34);
    for (const f of files) {
      const ok = v(JSON.parse(readFileSync(join(dir, f), 'utf8')));
      expect(ok, `${f}: ${JSON.stringify(v.errors)}`).toBe(true);
    }
  });
  it('trace green with common-defs refs resolving', () => {
    const v = getValidator('trace.schema.json');
    expect(v(JSON.parse(readFileSync(join(R, 'law', 'trace.json'), 'utf8')))).toBe(true);
  });
  it('genesis attestation stub green', () => {
    const v = getValidator('genesis-attestation.schema.json');
    const inst = JSON.parse(
      readFileSync(join(R, 'law', 'register', 'attestation', 'genesis-attestation.json'), 'utf8'),
    );
    // wireframe stub carries a non-schema _status marker; strip before validating
    delete (inst as Record<string, unknown>)['_status'];
    const ok = v(inst);
    expect(ok, JSON.stringify(v.errors)).toBe(true);
  });
});

describe('meta-gate and canon linter', () => {
  it('meta-gate: every roster schema complies', () => {
    const gate = metaGate();
    expect(gate.compliant).toHaveLength(ROSTER.length);
    expect(gate.noncompliant).toEqual([]);
  });
  it('canon linter: the complete roster has zero findings', () => {
    expect(checkSchemas()).toEqual([]);
  });
  it('canon linter: open complete shapes fail while predicate fragments do not', () => {
    const completeShape = {
      type: 'object',
      additionalProperties: false,
      properties: {
        open: {
          type: 'object',
          properties: { value: { type: 'string' } },
        },
      },
    };
    expect(checkSchema('complete-shape.schema.json', completeShape)).toEqual([
      {
        schema: 'complete-shape.schema.json',
        rule: 'open-world-object',
        path: '$root/properties/open',
      },
    ]);

    const predicateFragments = {
      type: 'object',
      additionalProperties: false,
      properties: {},
      allOf: [
        {
          if: { properties: { kind: { const: 'conditional' } } },
          then: { properties: { value: { type: 'string' } } },
          else: { properties: { fallback: { type: 'string' } } },
        },
        {
          additionalProperties: false,
          properties: {
            values: {
              type: 'array',
              contains: { properties: { selected: { const: true } } },
            },
          },
        },
        {
          oneOf: [
            { properties: { mode: { const: 'first' } } },
            { properties: { mode: { const: 'second' } } },
          ],
        },
      ],
    };
    expect(checkSchema('predicate-fragments.schema.json', predicateFragments)).toEqual([]);
  });
});
