import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { getValidator, loadSchema } from '../../src/index.js';

// check-records over the ADR roster: front-matter validates against record-meta,
// ids are gapless and filename-bound (the successor form of `check adrs`).
const R = join(import.meta.dirname, '..', '..', '..', '..');
const DIR = join(R, 'law', 'adr');

function frontMatter(file: string): Record<string, unknown> {
  const t = readFileSync(join(DIR, file), 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n/);
  expect(m, `${file} has front-matter`).toBeTruthy();
  return parse(m?.[1] ?? '') as Record<string, unknown>;
}

describe('ADR roster records', () => {
  const files = readdirSync(DIR)
    .filter((f) => /^ADR-\d{3}-.+\.md$/.test(f))
    .sort();

  it('roster is gapless ADR-001..012', () => {
    const nums = files.map((f) => Number(f.slice(4, 7)));
    expect(nums).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it('every front-matter validates against record-meta', () => {
    const v = getValidator('record-meta.schema.json');
    for (const f of files) {
      const fm = frontMatter(f);
      expect(v(fm), `${f}: ${JSON.stringify(v.errors)}`).toBe(true);
    }
  });

  it('id matches the common-defs id_adr pattern AND the filename prefix', () => {
    const commonDefs = loadSchema('common-defs.schema.json') as {
      $defs: { id_adr: { pattern: string } };
    };
    const pattern = new RegExp(commonDefs.$defs.id_adr.pattern);
    for (const f of files) {
      const id = String(frontMatter(f).id);
      expect(id, f).toMatch(pattern);
      expect(f.startsWith(`${id}-`), `${f} filename binds its id`).toBe(true);
    }
  });

  it('founding lifecycle discipline: active status, null superseded_by, non-empty supersedes + provenance', () => {
    for (const f of files) {
      const fm = frontMatter(f);
      expect(fm.status, f).toBe('active');
      expect(fm.superseded_by, f).toBeNull();
      expect(
        Array.isArray(fm.supersedes) && (fm.supersedes as unknown[]).length > 0,
        `${f} names what it absorbs`,
      ).toBe(true);
      expect(fm.provenance, f).toBeTruthy();
    }
  });
});
// Invariants: INV-DEVAI-001
