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

  it('moves repaired fifth-review items into the compact closed set only after audit', () => {
    const source = readFileSync(REGISTER, 'utf8');
    const closedRow = source.split('\n').find((line) => line.startsWith('| Closed in R-0002 '));
    expect(closedRow).toBeDefined();
    expect(closedRow).toContain('BL-066–079');
    expect(closedRow).toContain('BL-082–083');
    expect(closedRow).toContain('BL-085–104');
    expect(source).not.toMatch(/^\| Reopened in R-0002\s+\|/mu);
    expect(source).toMatch(/^\| Awaiting exact seventh review\/close\s+\| BL-105\s+\|/mu);
  });
});
