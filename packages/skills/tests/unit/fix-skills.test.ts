// Invariants: INV-DEVAI-013
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { getSkill } from '../../src/skills/impl/index.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];

function root(): string {
  const path = mkdtempSync(join(tmpdir(), 'devai-fix-skills-'));
  roots.push(path);
  return path;
}

function put(base: string, relativePath: string, contents: string): string {
  const path = join(base, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return path;
}

function skill(id: string) {
  const entry = getSkill(id);
  if (entry === null) throw new Error(`missing skill ${id}`);
  return entry;
}

function git(repo: string, args: readonly string[]): void {
  execFileSync('git', args, {
    cwd: repo,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'DEVAI Test',
      GIT_AUTHOR_EMAIL: 'devai-test@example.invalid',
      GIT_COMMITTER_NAME: 'DEVAI Test',
      GIT_COMMITTER_EMAIL: 'devai-test@example.invalid',
    },
  });
}

afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('fix skill behavior expansion', () => {
  it('diagnoses empty docs and unresolved local links while skipping external targets', async () => {
    const repo = root();
    expect(await skill('SKILL-fix-docs-links').run({ repoRoot: repo })).toMatchObject({
      status: 'pass',
      evidence: { broken_before: [], broken_after: [], fix_log: [] },
    });
    put(
      repo,
      'docs/guide.md',
      [
        '[web](https://example.com)',
        '[mail](mailto:test@example.com)',
        '[anchor](#local)',
        '[data](data:text/plain,x)',
        '[missing](old.md#section)',
        '[query](other.md?raw=1 "title")',
      ].join('\n'),
    );
    await withAuthorityHostTestScope(async () => {
      const result = await skill('SKILL-fix-docs-links').run({
        repoRoot: repo,
        inputs: { dir: 'docs' },
        iteration: { current: 2, max: 3 },
      });
      expect(result).toMatchObject({ status: 'fail' });
      expect(
        (result.evidence as { fix_log: Array<{ outcome: string }> }).fix_log.map(
          ({ outcome }) => outcome,
        ),
      ).toEqual(['no-rename-history', 'no-rename-history']);
    });
  });

  it('rewrites an unambiguous git rename and preserves the link suffix', async () => {
    const repo = root();
    git(repo, ['init', '-q']);
    put(repo, 'docs/old.md', '# Old');
    put(repo, 'docs/guide.md', '[moved](old.md#section)');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-qm', 'initial']);
    git(repo, ['mv', 'docs/old.md', 'docs/new.md']);
    git(repo, ['commit', '-qm', 'rename']);

    await withAuthorityHostTestScope(async () => {
      const result = await skill('SKILL-fix-docs-links').run({ repoRoot: repo });
      expect(result).toMatchObject({ status: 'pass' });
      expect(readFileSync(join(repo, 'docs/guide.md'), 'utf8')).toContain(
        '[moved](new.md#section)',
      );
      expect(
        (result.evidence as { fix_log: Array<{ outcome: string }> }).fix_log[0]?.outcome,
      ).toBe('rewritten');
    });
  });

  it('deduplicates identical override blocks and leaves distinct records intact', async () => {
    const repo = root();
    const block = [
      '// inv-override: INV-DEVAI-005',
      '// reason: temporary fixture waiver',
      '// ticket: ENG-1234',
      '// expires: 2999-Q4',
      '// approver: @owner',
      '// adr: ADR-001',
    ].join('\n');
    const path = put(
      repo,
      'packages/demo/src/index.ts',
      [block, 'export const one = 1;', block, 'export const two = 2;'].join('\n'),
    );
    await withAuthorityHostTestScope(async () => {
      const result = await skill('SKILL-fix-overrides').run({
        repoRoot: repo,
        iteration: { current: 1, max: 3 },
      });
      expect(result).toMatchObject({ status: 'pass' });
      expect(
        (result.evidence as { fix_log: Array<{ outcome: string }> }).fix_log,
      ).toHaveLength(1);
      expect(readFileSync(path, 'utf8').match(/inv-override:/g)).toHaveLength(1);
      const second = await skill('SKILL-fix-overrides').run({ repoRoot: repo });
      expect(second).toMatchObject({ status: 'pass', evidence: { fix_log: [] } });
    });
  });

  it('scaffolds missing ADR sections and escalates malformed and off-pattern records', async () => {
    const repo = root();
    const frontmatter = [
      '---',
      'id: ADR-001',
      'title: Fixture',
      'type: adr',
      'status: draft',
      'date: 2026-07-24',
      'authority: Architect',
      'supersedes: [predecessor]',
      'superseded_by: null',
      'provenance: [bootstrap]',
      'affected_rules: []',
      '---',
      '## Status',
      'Draft.',
    ].join('\n');
    const canonical = put(repo, 'law/adr/ADR-001-fixture.md', frontmatter);
    put(repo, 'law/adr/ADR-002-malformed.md', '# missing frontmatter');
    put(
      repo,
      'law/adr/legacy-name.md',
      ['---', 'adr_id: ADR-003', 'title: Legacy title', '---', 'body'].join('\n'),
    );

    await withAuthorityHostTestScope(async () => {
      const result = await skill('SKILL-fix-adrs').run({
        repoRoot: repo,
        iteration: { current: 3, max: 3 },
      });
      expect(result).toMatchObject({ status: 'fail' });
      const outcomes = (
        result.evidence as { fix_log: Array<{ outcome: string }> }
      ).fix_log.map(({ outcome }) => outcome);
      expect(outcomes).toContain('section-scaffolded');
      expect(outcomes).toContain('escalate-malformed-front-matter');
      expect(outcomes).toContain('rename-skipped-not-git');
      expect(readFileSync(canonical, 'utf8')).toContain('## Affected Rules');
    });
  });

  it('runs prompt-overlay and forbidden-action diagnostic envelopes', async () => {
    const repo = root();
    expect(await skill('SKILL-fix-prompt-overlays').run({ repoRoot: repo })).toMatchObject({
      skill_id: 'SKILL-fix-prompt-overlays',
      status: expect.stringMatching(/pass|fail/),
    });
    expect(await skill('SKILL-fix-forbidden-actions').run({ repoRoot: repo })).toMatchObject({
      skill_id: 'SKILL-fix-forbidden-actions',
      status: 'pass',
    });
  });
});
