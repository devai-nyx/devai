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

  it('roster is gapless ADR-001..017', () => {
    const nums = files.map((f) => Number(f.slice(4, 7)));
    expect(nums).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
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

  it('lifecycle discipline preserves fourteen active ADRs and all replacements', () => {
    for (const f of files) {
      const fm = frontMatter(f);
      if (f === 'ADR-005-ci-economy.md') {
        expect(fm.status, f).toBe('superseded');
        expect(fm.superseded_by, f).toBe('ADR-013');
      } else if (f === 'ADR-011-prompt-firewall.md') {
        expect(fm.status, f).toBe('superseded');
        expect(fm.superseded_by, f).toBe('ADR-016');
      } else if (f === 'ADR-014-ci-checker-adr-association.md') {
        expect(fm.status, f).toBe('superseded');
        expect(fm.superseded_by, f).toBe('ADR-015');
      } else {
        expect(fm.status, f).toBe('active');
        expect(fm.superseded_by, f).toBeNull();
      }
      if (
        f === 'ADR-014-ci-checker-adr-association.md' ||
        f === 'ADR-017-r0005-independent-review-corrections.md'
      ) {
        expect(fm.supersedes, `${f} preserves its first sealed source list`).toEqual([]);
      } else {
        expect(
          Array.isArray(fm.supersedes) && (fm.supersedes as unknown[]).length > 0,
          `${f} names what it absorbs`,
        ).toBe(true);
      }
      expect(fm.provenance, f).toBeTruthy();
    }
    expect(frontMatter('ADR-013-ci-economy-correction.md').supersedes).toEqual(['ADR-005']);
    expect(frontMatter('ADR-014-ci-checker-adr-association.md').supersedes).toEqual([]);
    expect(frontMatter('ADR-015-ci-governance-path-coverage.md').supersedes).toEqual(['ADR-014']);
    expect(frontMatter('ADR-016-bounded-authority-prompt-composition.md').supersedes).toEqual([
      'ADR-011',
    ]);
    expect(frontMatter('ADR-017-r0005-independent-review-corrections.md').supersedes).toEqual([]);
  });
});
// Invariants: INV-DEVAI-001
