// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { validateAdrs } from '../../src/adr/index.js';

const roots: string[] = [];

function root(): string {
  const path = mkdtempSync(join(tmpdir(), 'devai-adr-'));
  roots.push(path);
  return path;
}

function put(base: string, relativePath: string, contents: string): string {
  const path = join(base, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return path;
}

function adr(
  id: string,
  overrides: {
    readonly title?: string;
    readonly status?: string;
    readonly sections?: readonly string[];
    readonly blockArrays?: boolean;
  } = {},
): string {
  const sections = overrides.sections ?? [
    'Status',
    'Context',
    'Decision',
    'Consequences',
    'Alternatives Considered',
    'Affected Rules',
  ];
  const arrays = overrides.blockArrays
    ? [
        'supersedes:',
        '  - predecessor-record',
        'provenance:',
        '  - bootstrap',
        'affected_rules: []',
      ]
    : ['supersedes: [predecessor-record]', 'provenance: ["bootstrap"]', 'affected_rules: []'];
  return [
    '---',
    '# fixture frontmatter',
    `id: ${id}`,
    `title: "${overrides.title ?? 'Fixture decision'}"`,
    'type: adr',
    `status: ${overrides.status ?? 'draft'}`,
    'date: 2026-07-24',
    'authority: Architect',
    ...arrays,
    'superseded_by: null',
    '---',
    ...sections.map((section) => `## ${section}\nfixture`),
    '',
  ].join('\n');
}

afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('ADR validation', () => {
  it('accepts sorted successor ADRs using inline and block array frontmatter', () => {
    const dir = join(root(), 'law/adr');
    put(dir, 'ADR-002-second.md', adr('ADR-002', { blockArrays: true }));
    put(dir, 'ADR-001-first.md', adr('ADR-001'));
    put(dir, 'README.md', 'ignored');

    const result = validateAdrs({ adrsDir: dir });
    expect(result.ok).toBe(true);
    expect(result.files_scanned).toBe(2);
    expect(result.adrs.map(({ adr_id }) => adr_id)).toEqual(['ADR-001', 'ADR-002']);
    expect(result.adrs[0]).toMatchObject({
      title: 'Fixture decision',
      status: 'draft',
      date: '2026-07-24',
    });
  });

  it('reports missing frontmatter, predecessor metadata, schema errors, and unreadable files', () => {
    const dir = join(root(), 'law/adr');
    put(dir, 'ADR-001-missing.md', '# no frontmatter');
    put(
      dir,
      'ADR-002-predecessor.md',
      ['---', 'adr_id: ADR-002', 'status: accepted', '---', '## Status'].join('\n'),
    );
    put(
      dir,
      'ADR-003-schema.md',
      ['---', 'id: ADR-003', 'type: adr', 'status: invalid', '---', 'body'].join('\n'),
    );
    mkdirSync(dir, { recursive: true });
    symlinkSync(join(dir, 'absent-target'), join(dir, 'ADR-004-broken.md'));

    const result = validateAdrs({ adrsDir: dir });
    expect(result.ok).toBe(false);
    expect(result.files_scanned).toBe(4);
    expect(result.errors.some(({ message }) => message.includes('missing YAML'))).toBe(true);
    expect(result.errors.some(({ message }) => message.includes("'adr_id'"))).toBe(true);
    expect(result.errors.some(({ message }) => message.includes('required'))).toBe(true);
    expect(result.errors.some(({ message }) => message.startsWith('cannot read:'))).toBe(true);
  });

  it('reports filename, mandatory-section, and numbering-gap diagnostics', () => {
    const dir = join(root(), 'law/adr');
    put(
      dir,
      'ADR-001-wrong-id.md',
      adr('ADR-002', {
        sections: ['Status', 'Context', 'Decisions', 'Consequences'],
      }),
    );

    const result = validateAdrs({ adrsDir: dir });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(({ message }) => message.includes("does not start with id 'ADR-002-'")),
    ).toBe(true);
    expect(result.errors.filter(({ message }) => message.includes('body missing'))).toHaveLength(2);
    expect(result.errors.some(({ message }) => message.includes('numbering gap'))).toBe(true);
    expect(result.adrs[0]?.adr_id).toBe('ADR-002');
  });

  it('returns empty success for an absent directory and a read error for a file path', () => {
    const base = root();
    expect(validateAdrs({ adrsDir: join(base, 'absent') })).toEqual({
      ok: true,
      files_scanned: 0,
      errors: [],
      adrs: [],
    });
    const file = put(base, 'not-a-directory', 'fixture');
    const result = validateAdrs({ adrsDir: file });
    expect(result.ok).toBe(false);
    expect(result.files_scanned).toBe(0);
    expect(result.errors[0]?.message).toContain('cannot read directory:');
  });
});
