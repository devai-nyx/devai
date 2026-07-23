import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { getValidator } from '../../src/index.js';

// Product tier under check-records: JSON artifacts validate with native §5.1
// fields; markdown front-matter validates against record-meta; the Article-12
// seam resolves (every related_invariants id exists in law/invariants).
const R = join(import.meta.dirname, '..', '..', '..', '..');
const P = join(R, 'product');

function fm(path: string): Record<string, unknown> {
  const t = readFileSync(path, 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n/);
  expect(m, `${path} has front-matter`).toBeTruthy();
  return parse(m![1]) as Record<string, unknown>;
}

describe('product tier records', () => {
  const journeyFiles = readdirSync(join(P, 'journeys')).filter((f) => f.startsWith('JNY-')).sort();
  const invariantIds = new Set(
    readdirSync(join(R, 'law', 'invariants')).filter((f) => f.startsWith('INV-')).map((f) => f.replace('.json', '')),
  );

  it('all 14 journeys validate with provenance applied', () => {
    expect(journeyFiles.length).toBe(14);
    const v = getValidator('journey.schema.json');
    for (const f of journeyFiles) {
      const j = JSON.parse(readFileSync(join(P, 'journeys', f), 'utf8'));
      expect(v(j), `${f}: ${JSON.stringify(v.errors)}`).toBe(true);
      expect(j.provenance?.[0], f).toMatch(/^ex-JNY-\d+@devai-original$/);
    }
  });

  it('Article-12 seam: every related_invariants id resolves to a live invariant', () => {
    for (const f of journeyFiles) {
      const j = JSON.parse(readFileSync(join(P, 'journeys', f), 'utf8'));
      for (const id of j.related_invariants as string[]) {
        expect(invariantIds.has(id), `${f} -> ${id} must exist in law/invariants`).toBe(true);
      }
      expect((j.related_invariants as string[]).length, `${f} has a non-empty seam`).toBeGreaterThan(0);
    }
  });

  it('use-cases bundle validates and carries its ratification-pending signals', () => {
    const v = getValidator('use-cases.schema.json');
    const u = JSON.parse(readFileSync(join(P, 'use-cases', 'devai-cli.json'), 'utf8'));
    expect(v(u), JSON.stringify(v.errors)).toBe(true);
    expect(String(u.provenance?.[1] ?? ''), 'signals recorded').toMatch(/REV-0006/);
  });

  it('markdown artifacts (mandate, README, compilation) validate against record-meta', () => {
    const v = getValidator('record-meta.schema.json');
    for (const p of ['owner-mandates/OM-001.md', 'README.md', 'compilation.md']) {
      const rec = fm(join(P, p));
      expect(v(rec), `${p}: ${JSON.stringify(v.errors)}`).toBe(true);
    }
  });

  it('Owner authority is declared on every markdown record', () => {
    for (const p of ['owner-mandates/OM-001.md', 'README.md', 'compilation.md']) {
      expect(String(fm(join(P, p)).authority)).toBe('Owner');
    }
  });
});

describe('glossary records (joint tier)', () => {
  const G = join(R, 'law', 'glossary');
  const files = readdirSync(G).filter((f) => f.startsWith('GE-')).sort();
  const geIds = new Set(files.map((f) => f.replace('.json', '')));
  const invariantIds = new Set(
    readdirSync(join(R, 'law', 'invariants')).filter((f) => f.startsWith('INV-')).map((f) => f.replace('.json', '')),
  );

  it('all 37 entries validate with provenance applied', () => {
    expect(files.length).toBe(37);
    const v = getValidator('glossary-entry.schema.json');
    for (const f of files) {
      const g = JSON.parse(readFileSync(join(G, f), 'utf8'));
      expect(v(g), `${f}: ${JSON.stringify(v.errors)}`).toBe(true);
      expect(g.provenance?.[0], f).toMatch(/^ex-GE-\d+@devai-original$/);
    }
  });

  it('the intra-glossary graph resolves: see_also -> existing GE ids; related_invariants -> live invariants', () => {
    for (const f of files) {
      const g = JSON.parse(readFileSync(join(G, f), 'utf8'));
      for (const ref of (g.see_also ?? []) as string[]) expect(geIds.has(ref), `${f} see_also ${ref}`).toBe(true);
      for (const id of (g.related_invariants ?? []) as string[]) expect(invariantIds.has(id), `${f} -> ${id}`).toBe(true);
    }
  });

  it('README declares the joint authority', () => {
    const rec = fm(join(G, 'README.md'));
    expect(getValidator('record-meta.schema.json')(rec)).toBe(true);
    expect(String(rec.authority)).toMatch(/Owner \+ Architect/);
  });
});
