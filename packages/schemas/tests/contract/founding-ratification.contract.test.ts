import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const RATIFIED_AT = '2026-07-25T22:08:05Z';

function bytes(path: string): Buffer {
  return readFileSync(join(ROOT, path));
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(bytes(path).toString('utf8')) as Record<string, unknown>;
}

describe('R-0003 founding ratification boundary', () => {
  it('has a total, ordered 42-article source crosswalk', () => {
    const text = bytes('work/rounds/R-0003/constitution-source-crosswalk.md').toString('utf8');
    const rows = [...text.matchAll(/^\|\s+(\d+)\s+\|\s+`(#article-[^`]+)`\s+\|/gm)];
    expect(rows.map((row) => Number(row[1]))).toEqual(
      Array.from({ length: 42 }, (_, index) => index + 1),
    );
    expect(new Set(rows.map((row) => row[2])).size).toBe(42);
  });

  it('binds the one ceremony timestamp in Constitution and genesis', () => {
    const constitution = bytes('law/constitution.md').toString('utf8');
    const attestation = json('law/register/attestation/genesis-attestation.json');
    expect(attestation['ratified']).toBe(RATIFIED_AT);
    expect(constitution.match(new RegExp(RATIFIED_AT, 'g'))).toHaveLength(1);
    expect(constitution).toContain('DII-150 ratified this text');
  });

  it('keeps thirteen active ADRs after the sealed lifecycle corrections', () => {
    const adrs = readdirSync(join(ROOT, 'law/adr')).filter((file) =>
      /^ADR-\d{3}-.+\.md$/.test(file),
    );
    expect(adrs).toHaveLength(15);
    const active: string[] = [];
    for (const file of adrs) {
      const adr = bytes(`law/adr/${file}`).toString('utf8');
      if (file === 'ADR-005-ci-economy.md') {
        expect(adr, file).toMatch(/^status: superseded$/m);
        expect(adr, file).toMatch(/^superseded_by: ADR-013$/m);
      } else if (file === 'ADR-014-ci-checker-adr-association.md') {
        expect(adr, file).toMatch(/^status: superseded$/m);
        expect(adr, file).toMatch(/^superseded_by: ADR-015$/m);
      } else {
        expect(adr, file).toMatch(/^status: active$/m);
        expect(adr, file).toMatch(/^superseded_by: null$/m);
        active.push(file);
      }
    }
    expect(active).toHaveLength(13);
    for (let index = 1; index <= 44; index++) {
      const id = `GE-${String(index).padStart(3, '0')}`;
      const entry = json(`law/glossary/${id}.json`);
      expect(entry['status'], id).toBe('active');
    }
  });

  it('binds both policy copies and the self pin to exact ratified bytes', () => {
    const constitution = bytes('law/constitution.md');
    const digest = createHash('sha256').update(constitution).digest('hex');
    expect(readlinkSync(join(ROOT, '.devai/pin/constitution.md'))).toBe(
      '../../law/constitution.md',
    );

    const canonical = bytes('law/policy/authority-policy.json');
    const materialized = bytes('.devai/config/authority-policy.json');
    expect(materialized.equals(canonical)).toBe(true);
    for (const policy of [JSON.parse(canonical.toString('utf8'))] as Array<{
      constitution: { version: string; digest_sha256: string };
    }>) {
      expect(policy.constitution).toEqual({ version: '1.0.0', digest_sha256: digest });
    }
  });
});
// Invariants: INV-DEVAI-001
