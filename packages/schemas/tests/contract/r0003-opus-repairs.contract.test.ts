import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

function text(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function sha256(path: string): string {
  return createHash('sha256')
    .update(readFileSync(join(ROOT, path)))
    .digest('hex');
}

function row(article: number): string {
  return (
    text('work/rounds/R-0003/constitution-source-crosswalk.md')
      .split('\n')
      .find((line) => new RegExp(`^\\|\\s+${String(article)}\\s+\\|`).test(line)) ?? ''
  );
}

describe('R-0003 first Opus review repairs', () => {
  it('binds founding provenance to predecessor Constitution 0.8.0', () => {
    const constitution = text('law/constitution.md');
    const crosswalk = text('work/rounds/R-0003/constitution-source-crosswalk.md');
    expect(constitution).toContain("predecessor's live 0.8.0 text");
    expect(constitution).not.toMatch(/predecessor(?:'s)?(?: live)? 0\.6\.0|0\.1\.0.?0\.6\.0/);
    expect(crosswalk).toContain('predecessor Constitution 0.8.0');
    expect(crosswalk).not.toContain('predecessor Constitution 0.6.0');
  });

  it('makes the article ledger total and describes the Article 7 authority delta', () => {
    expect(row(18)).toContain('`.devai/config/thresholds.json`');
    expect(row(30)).toContain('`.devai/config/thresholds.json`');
    for (const phrase of ['transfer', 'seal', 'does not commit', 'durable']) {
      expect(row(7)).toContain(phrase);
    }
    expect(text('law/constitution.md')).not.toContain(
      'six annex deltas are now IN the article text above, each marked',
    );
  });

  it('activates only the decision-register container and preserves draft entries', () => {
    const register = text('law/register/DECISIONS.md');
    const frontmatter = parse(register.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') as Record<
      string,
      unknown
    >;
    expect(frontmatter.status).toBe('active');
    expect(frontmatter.date).toBe('2026-07-25');
    expect(register).not.toMatch(/WIREFRAME DRAFT|Nothing here carries authority|W03 ratifies/);
    expect(register).toContain('Only entries with `status: active` carry authority');
    expect(register).toMatch(/DII-149[^\n]*\n`type: decision · status: draft/);
    expect(register).toMatch(/DII-150[^\n]*\n`type: decision · status: active/);
  });

  it('resolves ADR-005 affected rules and parses every multi-source supersession', () => {
    const adr005 = text('law/adr/ADR-005-ci-economy.md');
    expect(adr005).not.toContain('.github/workflows/reusable-evidence-gate.yml');
    expect(adr005).toContain('.github/workflows/ci.yml');
    expect(adr005).toContain('.github/workflows/round-gates.yml');
    for (const file of [
      'ADR-002-human-supervised-experimental-loop.md',
      'ADR-003-actions-evidence-promotion.md',
      'ADR-007-publication-ia.md',
      'ADR-008-publish-path.md',
      'ADR-010-capabilities-and-effects.md',
      'ADR-011-prompt-firewall.md',
    ]) {
      const supersedes = text(`law/adr/${file}`).match(/^supersedes: \[(.+)]$/m)?.[1] ?? '';
      expect(supersedes, file).not.toContain(';');
      expect(
        supersedes
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean).length,
        file,
      ).toBe(2);
    }
  });

  it('records the Owner correction and describes retained glossary entries truthfully', () => {
    const correction = text('product/glossary-ratification-correction-marks.md');
    expect(correction).toContain('GE-006/016/020/022');
    expect(correction).toContain('already active');
    const readme = text('law/glossary/README.md');
    expect(readme).toContain('were retained after joint review');
    expect(readme).not.toContain('touch-ups were jointly activated');
  });

  it('materializes the ratified version pin from the canonical Constitution', () => {
    const versions = JSON.parse(text('.devai/pin/versions.json')) as Record<string, unknown>;
    expect(versions.constitution_version).toBe('1.0.0');
    expect(versions._status).toBe('active materialization');
    expect(text('.devai/pin/versions.json')).not.toMatch(/predecessor-seed|wireframe/i);
  });

  it('preserves load-bearing review inputs as exact durable bytes', () => {
    const expected = {
      'REV-0001.md': '4b9f317ae63695077088999fc9d979929d7c7e76a6317ff02f41949a8915085d',
      'REV-0003.md': 'da4223ac70b9f662c8e8efade42cd64f2c82f3a06655f87059d4a982e9d2015f',
      'REV-0006.md': '7d8bdb3ed0fb3f7d13b5ac892f0a7baf75d534bfd4460764847b2f1b2e2754bc',
    } as const;
    const manifest = text('work/rounds/R-0003/review-provenance-manifest.md');
    for (const [file, digest] of Object.entries(expected)) {
      const path = `work/rounds/R-0003/reviews/${file}`;
      expect(existsSync(join(ROOT, path)), path).toBe(true);
      expect(sha256(path), path).toBe(digest);
      expect(manifest).toContain(`\`${file}\``);
      expect(manifest).toContain(`\`${digest}\``);
    }
  });

  it('binds the repair batches and fresh exact-candidate gates in an audit correction', () => {
    const correction = text('work/audit/R-0003/first-opus-corrections.md');
    expect(correction).toContain('BL-120 through BL-127');
    expect(correction).toContain('250eac1');
    expect(correction).toContain('repository-reference');
    expect(correction).toContain('exact candidate');
  });

  it('offers a no-write current-target repository-reference check', () => {
    const scriptPath = join(ROOT, 'scripts/generate-repository-reference-triage.mjs');
    const source = readFileSync(scriptPath, 'utf8');
    expect(source).toContain('--check');
    expect(source).not.toContain("const targetRelative = 'work/rounds/R-0002/");
    const output = execFileSync(
      'node',
      [
        scriptPath,
        ROOT,
        '--check',
        '--target',
        'work/rounds/R-0002/repository-reference-triage.json',
      ],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(output).toContain('repository references verified');
  });
});
// Invariants: INV-DEVAI-001
