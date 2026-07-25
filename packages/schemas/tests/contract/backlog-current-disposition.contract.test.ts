// Invariants: INV-DEVAI-001
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const REGISTER = join(ROOT, 'work/audit/R-0002-preflight/backlog-register.md');

describe('R-0002 backlog current disposition', () => {
  it('keeps closed inherited rows out of the Active state', () => {
    const source = readFileSync(REGISTER, 'utf8');
    for (const id of [
      'BL-001',
      'BL-002',
      'BL-003',
      'BL-007',
      'BL-012',
      'BL-014',
      'BL-017',
      'BL-023',
    ]) {
      const row = source.split('\n').find((line) => line.startsWith(`| ${id} `));
      expect(row, `${id} has a detailed current-disposition row`).toBeDefined();
      expect(row, `${id} is not still Active`).not.toMatch(/\|\s*Active;/u);
    }
  });

  it('does not report reopened items in the compact closed set', () => {
    const source = readFileSync(REGISTER, 'utf8');
    const closedRow = source.split('\n').find((line) => line.startsWith('| Closed in R-0002 '));
    expect(closedRow).toBeDefined();
    for (const id of ['BL-075', 'BL-077', 'BL-079', 'BL-082', 'BL-086', 'BL-092']) {
      expect(closedRow, `${id} is reopened`).not.toContain(id);
    }
  });
});
