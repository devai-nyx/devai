import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { getValidator } from '../../src/index.js';

// Constitution structure guard — born from the Article-41 duplication catch
// during the final tree review: manual checks graduate into guards.
const R = join(import.meta.dirname, '..', '..', '..', '..');
const text = readFileSync(join(R, 'law', 'constitution.md'), 'utf8');

describe('constitution structure', () => {
  const nums = [...text.matchAll(/^### Article (\d+)\./gm)].map((m) => Number(m[1]));

  it('exactly 42 articles, numbered 1..42, unique, in order', () => {
    expect(nums).toEqual(Array.from({ length: 42 }, (_, i) => i + 1));
  });
  it('front-matter is active and the body carries the exact founding ratification', () => {
    const fm = parse(text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '') as Record<string, unknown>;
    expect(getValidator('record-meta.schema.json')(fm), 'constitution front-matter').toBe(true);
    expect(fm.status).toBe('active');
    expect(fm.title).toBe('DEVAI-II Constitution 1.0.0');
    expect(text).toContain('**Version:** 1.0.0');
    expect(text).toContain('**Status:** ratified (active lifecycle)');
    expect(text).toContain('**Ratified:** 2026-07-25T22:08:05Z');
    expect(text).not.toMatch(/WIREFRAME DRAFT|Candidate version|status:\s*draft/i);
  });
  it('the annex is the crosswalk form, not the stale checklist', () => {
    expect(text).toContain('application crosswalk');
    expect(text).not.toContain('deltas to work into article text');
  });
});
// Invariants: INV-DEVAI-001
