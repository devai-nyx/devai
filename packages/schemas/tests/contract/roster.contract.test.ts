import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROSTER, INFRASTRUCTURE } from '../../src/roster.js';
import { getValidator, loadSchema, listSchemaFiles, metaGate, checkSchemas } from '../../src/index.js';

const R = join(import.meta.dirname, '..', '..', '..', '..');

describe('roster', () => {
  it('bijects with law/schemas (count guard: 51)', () => {
    expect(ROSTER.length).toBe(51);
    expect(listSchemaFiles()).toEqual([...ROSTER]);
  });
  it('every roster schema parses and lazily compiles', () => {
    for (const name of ROSTER) expect(getValidator(name)).toBeTypeOf('function');
  });
  it('infrastructure schemas are roster members', () => {
    for (const i of INFRASTRUCTURE) expect(ROSTER).toContain(i);
  });
});

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
    const inst = JSON.parse(readFileSync(join(R, 'law', 'register', 'attestation', 'genesis-attestation.json'), 'utf8'));
    // wireframe stub carries a non-schema _status marker; strip before validating
    delete (inst as Record<string, unknown>)['_status'];
    const ok = v(inst);
    expect(ok, JSON.stringify(v.errors)).toBe(true);
  });
});

describe('meta-gate and canon linter (honest-red assertions)', () => {
  it('meta-gate: the 6 exampled schemas comply; the examples gap is the only failure class', () => {
    const gate = metaGate();
    expect(gate.compliant.length).toBeGreaterThanOrEqual(6);
    for (const nc of gate.noncompliant) {
      expect(nc.errors.join(' '), `${nc.name} fails for a non-examples reason`).toMatch(/examples/);
    }
  });
  it('canon linter: ZERO restated verdict enums (the pass/PASS determination landed: two vocabularies, extensions legitimate, bare restatements rewired)', () => {
    const findings = checkSchemas();
    const verdicts = findings.filter((f) => f.rule === 'restated-verdict-enum');
    expect(verdicts).toEqual([]);
  });
});
