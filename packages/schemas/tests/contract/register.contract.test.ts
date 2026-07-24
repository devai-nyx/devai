import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getValidator } from '../../src/index.js';

// check-records prototype: every register entry is a governed record
// validating against record-meta.schema.json (dossier Part IX §5.1).
const R = join(import.meta.dirname, '..', '..', '..', '..');

describe('register records', () => {
  const md = readFileSync(join(R, 'law', 'register', 'DECISIONS.md'), 'utf8');
  const fmDate = md.match(/^date: (\S+)/m)?.[1] ?? '';
  const entryRe = /^### (DII-[A-Z0-9-]+) — (.+)\n`type: (\S+) · status: (\S+) · authority: ([^·]+) · provenance: (.+)`$/gm;
  const entries = [...md.matchAll(entryRe)].map((m) => ({
    id: m[1], title: m[2], type: m[3], status: m[4], date: fmDate,
    authority: m[5].trim(), supersedes: null, superseded_by: null, provenance: m[6],
  }));

  it('parses a non-trivial population (count guard: 104 provisional entries)', () => {
    expect(entries.length).toBe(104);
  });
  it('every entry validates against record-meta', () => {
    const v = getValidator('record-meta.schema.json');
    for (const rec of entries) expect(v(rec), `${rec.id}: ${JSON.stringify(v.errors)}`).toBe(true);
  });
  it('ids are unique and the REJ family is complete', () => {
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of ['DII-REJ-A', 'DII-REJ-B', 'DII-REJ-C', 'DII-REJ-D']) expect(ids).toContain(r);
  });
  it('every entry carries predecessor provenance or an explicit session-draft marker', () => {
    for (const e of entries) expect(e.provenance).toMatch(/ex-|dossier|closes|generalizes|session-draft|Part/);
  });
});
