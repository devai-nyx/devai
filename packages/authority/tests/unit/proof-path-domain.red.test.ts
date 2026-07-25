import { describe, expect, it } from 'vitest';
import { classifyAuthorityPath } from '../../src/capabilities/path-domains.js';

describe('machine-proof path domain', () => {
  it('classifies canonical proof records separately from general workspace mutation', () => {
    expect(
      classifyAuthorityPath('/repo', 'record/proofs/compliance/closures/PC-0002.json'),
    ).toBe('fs:proofs');
    expect(classifyAuthorityPath('/repo', 'record/derived/inventory/current.json')).toBe(
      'fs:f4-inventory',
    );
    expect(classifyAuthorityPath('/repo', 'packages/evidence/src/index.ts')).toBe('fs:workspace');
  });
});
// Invariants: INV-AUTH-002, INV-AUTH-003
