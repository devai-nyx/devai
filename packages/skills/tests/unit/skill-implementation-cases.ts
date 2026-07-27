import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSensorReading } from '@devai-nyx/sensors';
import { SKILLS, getSkill, listSkills, skillAllowsWritePath } from '../../src/skills/impl/index.js';
import { createSkillRegistry, persistSkillEvidence } from '../../src/skills/registry.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];
const NOW = '2026-07-24T00:00:00.000Z';
const R20_FIXTURES = join(import.meta.dirname, '..', 'contract', 'fixtures', 'r20-baseline');

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

  it('renders every deterministic scaffolder idempotently and reports file drift', async () => {
    const repo = root();
    const blueprintPath = join(repo, 'blueprint.json');
    writeFileSync(
      blueprintPath,
      readFileSync(join(R20_FIXTURES, 'BP-DEMO-BOOKMARK-001.json'), 'utf8'),
    );
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0', '@angular/core': '17.0.0' } }),
    );
    cpSync(
      join(R20_FIXTURES, 'redox-pack-nestjs-postgres-angular'),
      join(repo, 'examples/redox-pack-nestjs-postgres-angular'),
      { recursive: true },
    );

    await withAuthorityHostTestScope(async () => {
      for (const id of [
        'SKILL-scaffold-db',
        'SKILL-scaffold-api',
        'SKILL-scaffold-ui',
        'SKILL-scaffold-tests',
        'SKILL-scaffold-docs',
        'SKILL-scaffold-ci',
      ]) {
        const fresh = await skill(id).run({
          repoRoot: repo,
          inputs: { blueprint_path: blueprintPath },
        });
        expect(fresh).toMatchObject({
          skill_id: id,
          status: 'pass',
          evidence: { idempotency: 'fresh' },
        });
        expect(
          (fresh.evidence as { files_created: string[] }).files_created.length,
          `${id} must create an assertion-visible product`,
        ).toBeGreaterThan(0);

        const repeat = await skill(id).run({
          repoRoot: repo,
          inputs: { blueprint_path: blueprintPath },
        });
        expect(repeat).toMatchObject({
          skill_id: id,
          status: 'pass',
          evidence: { idempotency: 'no-op' },
        });
      }

      writeFileSync(
        join(repo, 'domain/demo-bookmark/api/src/demo-bookmark/demo-bookmark.module.ts'),
        'operator-owned drift\n',
      );
      const drift = await skill('SKILL-scaffold-api').run({
        repoRoot: repo,
        inputs: { blueprint_path: blueprintPath },
      });
      expect(drift).toMatchObject({
        status: 'review',
        evidence: {
          idempotency: 'drift-detected',
          drift_report: {
            differing_files: [expect.objectContaining({ actual_sha256: expect.any(String) })],
          },
        },
      });
    });
  });

  it('materializes audit/backlog and emits safe orchestration and execution plans', async () => {
    const repo = root();
    await withAuthorityHostTestScope(async () => {
      expect(
        await skill('SKILL-round-audit').run({ repoRoot: repo, inputs: { round_n: 7 } }),
      ).toMatchObject({ status: 'pass' });
      writeFileSync(
        join(repo, 'work/audit/R-0007/scorecard.baseline.json'),
        JSON.stringify({
          cells: [{ substrate: 'F1', property: 'T6', verdict: 'FAIL' }],
        }),
      );
      expect(
        await skill('SKILL-round-backlog').run({ repoRoot: repo, inputs: { round_n: 7 } }),
      ).toMatchObject({ status: 'pass' });
    });

    expect(existsSync(join(repo, 'work/rounds/R-0007'))).toBe(false);
    expect(existsSync(join(repo, '.devai/state/round-runs/R-0007/backlog/backlog.json'))).toBe(
      true,
    );
    const proposedOrchestrator = readFileSync(
      join(repo, '.devai/state/round-runs/R-0007/backlog/prompts/00-orchestrator.md'),
      'utf8',
    );
    const proposedWave = readFileSync(
      join(repo, '.devai/state/round-runs/R-0007/backlog/prompts/01-f1-t6-fail.md'),
      'utf8',
    );
    expect(proposedOrchestrator).toContain('work/rounds/R-0007/plan.md');
    expect(proposedOrchestrator).not.toContain('../Plan.md');
    expect(proposedWave).toContain('work/audit/R-0007/');
    expect(proposedWave).not.toContain('../audit/');

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
