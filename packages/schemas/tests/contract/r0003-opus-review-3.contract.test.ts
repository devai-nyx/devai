import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

function text(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function frontmatter(path: string): Record<string, unknown> {
  const source = text(path);
  return parse(source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') as Record<string, unknown>;
}

describe('R-0003 third Opus review repairs', () => {
  it('resolves active register provenance and the seal-failure citation', () => {
    const register = text('law/register/DECISIONS.md');
    expect(register).not.toContain('provenance: regenerated from REV-0002');
    expect(register).toContain('R-0003-ADR-SEAL-FAILURE');
    expect(register).toContain('corrects DII-153');
  });

  it('discloses the immutable ADR-005 body status phrase', () => {
    const adr005 = text('law/adr/ADR-005-ci-economy.md');
    expect(adr005).toContain('Accepted and active in R-0003.');
    const index = text('law/adr/README.md');
    expect(index).toContain('sealed body');
    expect(index).toContain('historical status phrase');
    expect(index).toContain('lifecycle frontmatter controls');
  });

  it('keeps all three audit supersession pairs symmetric', () => {
    const pairs = [
      ['exit-ladder-formatting-failure.md', 'formatting-correction.md'],
      ['exit-ladder-formatting-contract-failure.md', 'formatting-contract-correction.md'],
      ['opus-close-review-2.md', 'opus-close-review-2-correction.md'],
    ] as const;
    for (const [oldFile, replacementFile] of pairs) {
      const oldRecord = frontmatter(`work/audit/R-0003/${oldFile}`);
      const replacement = frontmatter(`work/audit/R-0003/${replacementFile}`);
      expect(oldRecord.status, oldFile).toBe('superseded');
      expect(oldRecord.superseded_by, oldFile).toBe(replacement.id);
      expect(replacement.status, replacementFile).toBe('active');
      expect(replacement.supersedes, replacementFile).toBe(oldRecord.id);
    }
  });

  it('activates the ratified Constitution crosswalk', () => {
    const crosswalk = frontmatter('work/rounds/R-0003/constitution-source-crosswalk.md');
    expect(crosswalk.status).toBe('active');
    expect(String(crosswalk.provenance)).toContain('DII-150');
  });

  it('does not credit draft DII-149 with active authority', () => {
    const manifest = text('work/rounds/R-0003/review-provenance-manifest.md');
    expect(manifest).toContain('DII-149 remains a preserved draft');
    expect(manifest).toContain('active DII-153');
    expect(manifest).not.toContain('DII-149 and DII-152 carry the active dispositions');
  });

  it('binds the seven replay committer anomalies to role-pure originals', () => {
    const register = text('law/register/DECISIONS.md');
    const pairs = [
      ['1449e4d', '16a9f36'],
      ['611e14c', 'bfccf19'],
      ['938e2ab', 'a26369e'],
      ['3d44a48', 'dde5ae2'],
      ['726fe66', '9293ace'],
      ['0ba2612', '93ef651'],
      ['fa17a5c', '7442708'],
    ] as const;
    for (const [replay, original] of pairs) {
      expect(register).toContain(replay);
      expect(register).toContain(original);
      expect(
        execFileSync('git', ['show', '-s', '--format=%an|%cn', replay], {
          cwd: ROOT,
          encoding: 'utf8',
        }).trim(),
      ).toMatch(/^DEVAI (?:Architect|Engineer|Inspector|Auditor)\|Antonio A\. Russo$/);
      expect(
        execFileSync('git', ['show', '-s', '--format=%an|%cn', original], {
          cwd: ROOT,
          encoding: 'utf8',
        }).trim(),
      ).toMatch(
        /^DEVAI (?:Architect|Engineer|Inspector|Auditor)\|DEVAI (?:Architect|Engineer|Inspector|Auditor)$/,
      );
    }
    expect(register).toContain('procedural replay defect');
    expect(register).toContain('does not waive future identity requirements');
  });
});
// Invariants: INV-DEVAI-001
