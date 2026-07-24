import { describe, expect, it } from 'vitest';
import { checkPrCompliance } from '../../src/pr-compliance/index.js';

describe('checkPrCompliance', () => {
  it('extracts ids from a well-formed trailer', () => {
    const body = [
      '## Summary',
      'Implements the new override scanner.',
      '',
      'Inv-Compliance: INV-DEVAI-002, INV-DEVAI-005',
    ].join('\n');
    const r = checkPrCompliance({ body });
    expect(r.ok).toBe(true);
    expect(r.cited_ids).toEqual(['INV-DEVAI-002', 'INV-DEVAI-005']);
  });

  it('flags missing trailer when required (default)', () => {
    const r = checkPrCompliance({ body: 'no trailer here' });
    expect(r.ok).toBe(false);
    expect(r.findings[0]?.code).toBe('missing-trailer');
  });

  it('accepts missing trailer when --optional', () => {
    const r = checkPrCompliance({ body: 'no trailer here', required: false });
    expect(r.ok).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it('flags malformed ids', () => {
    const r = checkPrCompliance({
      body: 'Inv-Compliance: INV-foo, INV-DEVAI-002',
    });
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'malformed-id' && f.invariant_id === 'INV-foo')).toBe(
      true,
    );
  });

  it('flags unknown ids against the catalog', () => {
    const r = checkPrCompliance({
      body: 'Inv-Compliance: INV-DEVAI-999, INV-DEVAI-002',
      invariant_ids: new Set(['INV-DEVAI-002']),
    });
    expect(
      r.findings.some((f) => f.code === 'unknown-id' && f.invariant_id === 'INV-DEVAI-999'),
    ).toBe(true);
  });

  it('flags empty trailer', () => {
    const r = checkPrCompliance({ body: 'Inv-Compliance:   ' });
    expect(r.findings[0]?.code).toBe('empty-trailer');
  });

  it('is case-insensitive on the trailer key', () => {
    const r = checkPrCompliance({
      body: 'inv-compliance: INV-DEVAI-002',
    });
    expect(r.ok).toBe(true);
    expect(r.cited_ids).toEqual(['INV-DEVAI-002']);
  });

  it('dedupes repeated ids', () => {
    const r = checkPrCompliance({
      body: 'Inv-Compliance: INV-DEVAI-002, INV-DEVAI-002, INV-DEVAI-005',
    });
    expect(r.cited_ids).toEqual(['INV-DEVAI-002', 'INV-DEVAI-005']);
  });
});
// Invariants: INV-DEVAI-001
// Invariants: INV-RBAC-001
