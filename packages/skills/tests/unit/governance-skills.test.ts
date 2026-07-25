import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { getSkill } from '../../src/skills/impl/index.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];

function root(): string {
  const path = mkdtempSync(join(tmpdir(), 'devai-governance-skills-'));
  roots.push(path);
  return path;
}

function skill(id: string) {
  const entry = getSkill(id);
  if (entry === null) throw new Error(`missing skill ${id}`);
  return entry;
}

afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('governance skill adapters', () => {
  it('requires a round input for both round adapters', async () => {
    await expect(skill('SKILL-round-scaffold').run({ repoRoot: root() })).rejects.toThrow(
      'ROUND_INPUT_REQUIRED',
    );
    await expect(
      skill('SKILL-round-archive').run({ repoRoot: root(), inputs: { round: null } }),
    ).rejects.toThrow('ROUND_INPUT_REQUIRED');
  });

  it('accepts both numeric and string round inputs and reports lifecycle failures', async () => {
    const repo = root();
    await withAuthorityHostTestScope(async () => {
      const scaffold = await skill('SKILL-round-scaffold').run({
        repoRoot: repo,
        inputs: { round_n: 7 },
      });
      expect(scaffold).toMatchObject({
        skill_id: 'SKILL-round-scaffold',
        status: 'pass',
        evidence: { id: 'R-0007', path: 'work/rounds/R-0007' },
      });
      expect(readFileSync(join(repo, 'work/rounds/R-0007/plan.md'), 'utf8')).toContain(
        '# Round 7 plan',
      );
      await expect(
        skill('SKILL-round-scaffold').run({
          repoRoot: repo,
          inputs: { round: 'R-0007' },
        }),
      ).rejects.toThrow('ROUND_ALREADY_EXISTS');
      await expect(
        skill('SKILL-round-archive').run({
          repoRoot: repo,
          inputs: { round: '8' },
        }),
      ).rejects.toThrow('ROUND_ARCHIVE_SOURCE_MISSING');
    });
  });

  it('scaffolds collision-free decision records with explicit and default metadata', async () => {
    const repo = root();
    mkdirSync(join(repo, 'law/register'), { recursive: true });
    writeFileSync(join(repo, 'law/register/D-4.md'), '# existing\n');
    await withAuthorityHostTestScope(async () => {
      const first = await skill('SKILL-adr-new').run({
        repoRoot: repo,
        inputs: { title: '  Coverage decision  ', round: 'R-0002' },
        timestamp: '2026-07-24T12:34:56.000Z',
      });
      expect(first).toMatchObject({
        skill_id: 'SKILL-adr-new',
        status: 'pass',
        evidence: { id: 'D-5', path: 'law/register/D-5.md' },
      });
      expect(readFileSync(join(repo, 'law/register/D-5.md'), 'utf8')).toContain(
        'title: "Coverage decision"',
      );

      const second = await skill('SKILL-adr-new').run({
        repoRoot: repo,
        inputs: { title: 42, round: 2 },
        timestamp: '2026-07-25T00:00:00.000Z',
      });
      expect(second).toMatchObject({ status: 'pass', evidence: { id: 'D-6' } });
      const body = readFileSync(join(repo, 'law/register/D-6.md'), 'utf8');
      expect(body).toContain('title: "New governance decision"');
      expect(body).toContain('round: "pre-round"');
    });
  });
});
