// Invariants: INV-DEVAI-001
import { describe, expect, it } from 'vitest';
import { getSkill } from '../../src/skills/impl/index.js';

describe('governance skill adapters', () => {
  it('KR-R5-036 keeps authority-owned lifecycle mutation outside agent skills', () => {
    for (const id of ['SKILL-round-scaffold', 'SKILL-round-archive', 'SKILL-adr-new']) {
      expect(getSkill(id), id).toBeNull();
    }
  });
});
