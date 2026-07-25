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
  return parse(m?.[1] ?? '') as Record<string, unknown>;
}

describe('product tier records', () => {
  const journeyFiles = readdirSync(join(P, 'journeys'))
    .filter((f) => f.startsWith('JNY-'))
    .sort();
  const invariantIds = new Set(
    readdirSync(join(R, 'law', 'invariants'))
      .filter((f) => f.startsWith('INV-'))
      .map((f) => f.replace('.json', '')),
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
    const journeys = journeyFiles.map((f) => ({
      file: f,
      record: JSON.parse(readFileSync(join(P, 'journeys', f), 'utf8')) as {
        id: string;
        status: string;
        supersedes: string[] | null;
        superseded_by: string | null;
        related_invariants: string[];
      },
    }));
    const activeJourneys = journeys.filter(({ record }) => record.status === 'active');
    expect(activeJourneys).toHaveLength(13);
    for (const { file, record: j } of activeJourneys) {
      for (const id of j.related_invariants as string[]) {
        expect(invariantIds.has(id), `${file} -> ${id} must exist in law/invariants`).toBe(true);
      }
      expect(j.related_invariants.length, `${file} has a non-empty seam`).toBeGreaterThan(0);
    }
    const retired = journeys.find(({ record }) => record.id === 'JNY-007')?.record;
    const successor = journeys.find(({ record }) => record.id === 'JNY-014')?.record;
    expect(retired?.status).toBe('retired');
    expect(retired?.superseded_by).toBe('JNY-014');
    expect(successor?.supersedes).toEqual(['JNY-007']);
  });

  it('use-cases bundle validates and carries the applied Owner mappings', () => {
    const v = getValidator('use-cases.schema.json');
    const u = JSON.parse(readFileSync(join(P, 'use-cases', 'devai-cli.json'), 'utf8')) as {
      generatedAt?: unknown;
      provenance?: string[];
      cases: Array<{
        mainFlow: Array<{ refs: { actionRefs: Array<{ id: string; provisional?: boolean }> } }>;
        alternateFlows?: Array<{
          steps: Array<{ refs: { actionRefs: Array<{ id: string; provisional?: boolean }> } }>;
        }>;
      }>;
    };
    expect(v(u), JSON.stringify(v.errors)).toBe(true);
    expect(u.cases).toHaveLength(12);
    expect(Object.hasOwn(u, 'generatedAt')).toBe(false);
    for (const useCase of u.cases) {
      const steps = [
        ...useCase.mainFlow,
        ...(useCase.alternateFlows ?? []).flatMap((flow) => flow.steps),
      ];
      for (const step of steps) {
        expect(step.refs.actionRefs.length).toBeGreaterThan(0);
        for (const ref of step.refs.actionRefs) {
          expect(ref.id.trim().length).toBeGreaterThan(0);
          if ('provisional' in ref) expect(ref.provisional).toBe(true);
        }
      }
    }
    expect(u.provenance).toContain(
      'REV-0006 Owner marks applied 2026-07-23: stale hand-maintained generatedAt removed; all 12 imported use cases mapped to successor or explicitly provisional predecessor CLI action identifiers',
    );
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
// Invariants: INV-BLUEPRINT-001

describe('glossary records (joint tier)', () => {
  const G = join(R, 'law', 'glossary');
  const files = readdirSync(G)
    .filter((f) => f.startsWith('GE-'))
    .sort();
  const geIds = new Set(files.map((f) => f.replace('.json', '')));
  const invariantIds = new Set(
    readdirSync(join(R, 'law', 'invariants'))
      .filter((f) => f.startsWith('INV-'))
      .map((f) => f.replace('.json', '')),
  );

  it('all 44 entries validate with imported or rider provenance applied', () => {
    expect(files.length).toBe(44);
    const v = getValidator('glossary-entry.schema.json');
    for (const f of files) {
      const g = JSON.parse(readFileSync(join(G, f), 'utf8'));
      expect(v(g), `${f}: ${JSON.stringify(v.errors)}`).toBe(true);
      const id = Number(f.slice(3, 6));
      if (id <= 37) {
        expect(g.provenance?.[0], f).toMatch(/^ex-GE-\d+@devai-original$/);
      } else {
        expect(g.status, f).toBe('draft');
        expect(g.authority, f).toBe('joint');
        expect(g.provenance?.[0], f).toMatch(/REV-0006 vocabulary rider.*Owner 2026-07-23/);
      }
    }
  });

  it('the intra-glossary graph resolves: see_also -> existing GE ids; related_invariants -> live invariants', () => {
    for (const f of files) {
      const g = JSON.parse(readFileSync(join(G, f), 'utf8'));
      for (const ref of (g.see_also ?? []) as string[])
        expect(geIds.has(ref), `${f} see_also ${ref}`).toBe(true);
      for (const id of (g.related_invariants ?? []) as string[])
        expect(invariantIds.has(id), `${f} -> ${id}`).toBe(true);
    }
  });

  it('README declares the joint authority', () => {
    const rec = fm(join(G, 'README.md'));
    expect(getValidator('record-meta.schema.json')(rec)).toBe(true);
    expect(String(rec.authority)).toMatch(/Owner \+ Architect/);
  });
});
