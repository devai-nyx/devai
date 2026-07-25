import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSensorReading } from '@devai-nyx/sensors';
import { SKILLS, getSkill, listSkills, skillAllowsWritePath } from '../../src/skills/impl/index.js';
import { createSkillRegistry, persistSkillEvidence } from '../../src/skills/registry.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];
const NOW = '2026-07-24T00:00:00.000Z';

afterEach(() => {
  for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true });
});

function root(): string {
  const path = mkdtempSync(join(tmpdir(), 'devai-skills-coverage-'));
  roots.push(path);
  return path;
}

function write(repo: string, rel: string, body: string): string {
  const path = join(repo, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return path;
}

function skill(id: string) {
  const entry = getSkill(id);
  if (entry === null) throw new Error(`missing fixture skill: ${id}`);
  return entry;
}

const reading = buildSensorReading({
  sensorName: 'fixture',
  sensorKind: 'lint',
  command: ['fixture'],
  status: 'fail',
  deterministic: true,
  timestamp: NOW,
  findings: [{ severity: 'error', code: 'LINT_FAILED', message: 'fixture failure' }],
});

describe('skill registry behavior', () => {
  it('lists manifests and resolves write scopes fail-closed', () => {
    expect(listSkills()).toHaveLength(SKILLS.length);
    expect(getSkill('SKILL-triage')?.manifest.id).toBe('SKILL-triage');
    expect(getSkill('SKILL-missing')).toBeNull();
    expect(skillAllowsWritePath('SKILL-missing', 'anything')).toBe(false);
    expect(
      skillAllowsWritePath(
        'SKILL-commit-push',
        'record/proofs/work/skill-runs/SKILL-commit-push/run.json',
      ),
    ).toBe(true);
    expect(skillAllowsWritePath('SKILL-commit-push', 'packages/core/src/index.ts')).toBe(false);
    expect(skillAllowsWritePath('SKILL-scaffold-db', 'domain/demo/db/migration.sql')).toBe(true);
    expect(skillAllowsWritePath('SKILL-scaffold-db', 'domain/demo/api/index.ts')).toBe(false);
  });

  it('builds a standalone registry and persists evidence through authority', async () => {
    const custom = createSkillRegistry([skill('SKILL-triage')]);
    expect(custom.listSkills().map((manifest) => manifest.id)).toEqual(['SKILL-triage']);
    expect(custom.getSkill('SKILL-triage')).not.toBeNull();
    expect(custom.getSkill('SKILL-missing')).toBeNull();
    const repo = root();
    await withAuthorityHostTestScope(() => {
      const path = persistSkillEvidence({
        repoRoot: repo,
        result: { skill_id: 'SKILL-triage', status: 'pass', evidence: { ok: true } },
      });
      expect(path).toContain('record/proofs/work/skill-runs/SKILL-triage/');
    });
  });
});

describe('core skill implementations', () => {
  it('validates commit inputs and builds a complete dry-run command tape', async () => {
    const repo = root();
    const run = skill('SKILL-commit-push').run;
    expect(await run({ repoRoot: repo })).toMatchObject({ status: 'fail' });
    expect(await run({ repoRoot: repo, inputs: { files: ['ok', 1] } })).toMatchObject({
      status: 'fail',
    });
    expect(await run({ repoRoot: repo, inputs: { files: ['../escape'] } })).toMatchObject({
      status: 'fail',
    });
    expect(await run({ repoRoot: repo, inputs: { files: ['ok'], open_pr: true } })).toMatchObject({
      status: 'fail',
    });
    expect(await run({ repoRoot: repo, inputs: { files: ['ok'], push: true } })).toMatchObject({
      status: 'fail',
    });

    const body = write(repo, 'pr.md', '# Derived PR title\n\nBody');
    const dry = await run({
      repoRoot: repo,
      inputs: {
        files: ['packages/demo/src/index.ts'],
        message: 'fixture commit',
        push: true,
        open_pr: true,
        dry_run: true,
        pr_body_file: body,
      },
    });
    expect(dry).toMatchObject({
      status: 'pass',
      evidence: { committed: false, pushed: false, pr_opened: false, mode: 'dry-run' },
    });
    expect(
      (dry.evidence as { commands: string[][] }).commands.map((command) => command[0]),
    ).toEqual(['git', 'git', 'git', 'gh']);
  });

  it('runs triage, prompt, scorecard, backlog, assessment, RGR, and mutation paths', async () => {
    const repo = root();
    expect(await skill('SKILL-triage').run({ repoRoot: repo })).toMatchObject({
      status: 'fail',
    });
    expect(await skill('SKILL-triage').run({ repoRoot: repo, inputs: { reading } })).toMatchObject({
      status: 'pass',
    });
    expect(
      await skill('SKILL-materialize-prompt').run({
        repoRoot: repo,
        timestamp: NOW,
        inputs: {
          task_id: 'TASK-0001',
          components: [
            { layer: 'global', name: 'base', body: 'Base prompt.' },
            { layer: 'task', name: 'task', body: 'Do the work.' },
          ],
        },
      }),
    ).toMatchObject({ status: 'pass' });

    const scorecard = {
      cells: [
        { substrate: 'F1', property: 'T1', verdict: 'FAIL' },
        { substrate: 'F2', property: 'T2', verdict: 'REVIEW' },
        { substrate: 'F3', property: 'T3', verdict: 'PASS' },
      ],
    };
    expect(
      await skill('SKILL-compile-backlog').run({ repoRoot: repo, inputs: { scorecard } }),
    ).toMatchObject({ status: 'pass', evidence: { count: 2 } });
    expect(await skill('SKILL-compile-backlog').run({ repoRoot: repo })).toMatchObject({
      status: 'fail',
    });
    expect(
      await skill('SKILL-compute-scorecard').run({ repoRoot: repo, timestamp: NOW }),
    ).toMatchObject({ status: 'pass' });
    expect(await skill('SKILL-assess-state').run({ repoRoot: repo, timestamp: NOW })).toMatchObject(
      { status: 'pass' },
    );

    await withAuthorityHostTestScope(async () => {
      expect(
        await skill('SKILL-emit-rgr').run({
          repoRoot: repo,
          timestamp: NOW,
          inputs: {
            reading,
            summary: 'Missing contract',
            ambiguity: 'Which contract applies?',
            emitting_task_id: 'TASK-0001',
            evidence_refs: ['EV-fixture'],
          },
        }),
      ).toMatchObject({ status: 'pass' });
      expect(
        await skill('SKILL-emit-rgr').run({
          repoRoot: repo,
          inputs: { reading, emitting_task_id: 'invalid' },
        }),
      ).toMatchObject({ status: 'fail' });
      expect(
        await skill('SKILL-mutation-test').run({
          repoRoot: repo,
          inputs: {
            command: [process.execPath, '-e', "console.log('Mutation score: 100.0%')"],
            threshold: 0.9,
          },
        }),
      ).toMatchObject({ status: 'pass', evidence: { mutation_score: 1, passed: true } });
    });
    expect(await skill('SKILL-mutation-test').run({ repoRoot: repo })).toMatchObject({
      status: 'fail',
    });
  });
});

describe('scaffolder and round skill envelopes', () => {
  it('fails every deterministic scaffolder consistently when the blueprint is absent', async () => {
    const repo = root();
    for (const id of [
      'SKILL-scaffold-db',
      'SKILL-scaffold-api',
      'SKILL-scaffold-ui',
      'SKILL-scaffold-tests',
      'SKILL-scaffold-docs',
      'SKILL-scaffold-ci',
    ]) {
      expect(await skill(id).run({ repoRoot: repo })).toMatchObject({
        skill_id: id,
        status: 'fail',
      });
    }
  });

  it('materializes audit/backlog and emits safe orchestration and execution plans', async () => {
    const repo = root();
    await withAuthorityHostTestScope(async () => {
      expect(
        await skill('SKILL-round-audit').run({ repoRoot: repo, inputs: { round_n: 7 } }),
      ).toMatchObject({ status: 'pass' });
      expect(
        await skill('SKILL-round-backlog').run({ repoRoot: repo, inputs: { round_n: 7 } }),
      ).toMatchObject({ status: 'pass' });
    });

    expect(
      await skill('SKILL-round-orchestrate').run({
        repoRoot: repo,
        inputs: { round_n: 8 },
      }),
    ).toMatchObject({
      status: 'pass',
      evidence: { executed_artifacts: { mode: 'dry-run' } },
    });
    expect(
      await skill('SKILL-round-execute').run({
        repoRoot: repo,
        inputs: { round_n: 8, mode: 'plan' },
      }),
    ).toMatchObject({
      status: 'pass',
      evidence: { executed_artifacts: { mode: 'plan' } },
    });
    expect(
      await skill('SKILL-round-execute').run({
        repoRoot: repo,
        inputs: { round_n: 8, mode: 'invalid' },
      }),
    ).toMatchObject({ status: 'fail' });
  });
});
