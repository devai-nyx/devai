import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, describe, expect, it } from 'vitest';
import { getSkill, MockLlmClient } from '../../src/index.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

const repos: string[] = [];

function tempRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), 'devai-r28-artifact-'));
  repos.push(repo);
  return repo;
}

function mock(json: unknown): MockLlmClient {
  return new MockLlmClient({
    responses: new Map([['any', { text: JSON.stringify(json), json }]]),
  });
}

afterEach(() => {
  for (const repo of repos.splice(0)) rmSync(repo, { recursive: true, force: true });
});

describe('R28 mutating LLM skills emit attributable candidate bytes', () => {
  it('SKILL-elicit writes its structured draft under the declared owner scope', async () => {
    const repo = tempRepo();
    const skill = getSkill('SKILL-elicit');
    if (skill === null) throw new Error('SKILL-elicit missing');

    const result = await skill.run({
      repoRoot: repo,
      inputs: { task_id: 'TASK-2801', topic: 'Adopter bootstrap acceptance' },
      timestamp: '2026-07-21T20:30:00.000Z',
      llm: mock({
        candidates: [
          {
            title: 'Bootstrap reaches doctor',
            statement: 'A clean adopter reaches the documented doctor checkpoint.',
            severity: 'hard-fail',
            rationale: 'The supported journey must have no hidden prerequisites.',
          },
        ],
        follow_up_questions: [],
      }),
    });

    expect(result.status).toBe('pass');
    const out = join(repo, 'product/draft/invariants/TASK-2801.json');
    expect(existsSync(out)).toBe(true);
    expect(JSON.parse(readFileSync(out, 'utf8'))).toMatchObject({
      task_id: 'TASK-2801',
      skill_id: 'SKILL-elicit',
      topic: 'Adopter bootstrap acceptance',
    });
  });

  it('SKILL-plan-blueprint writes its structured draft under the declared owner scope', async () => {
    const repo = tempRepo();
    const skill = getSkill('SKILL-plan-blueprint');
    if (skill === null) throw new Error('SKILL-plan-blueprint missing');
    expect(skill.manifest.authority_role).toBe('owner');

    const result = await skill.run({
      repoRoot: repo,
      inputs: { task_id: 'TASK-2802', journey_id: 'JNY-010' },
      timestamp: '2026-07-21T20:31:00.000Z',
      llm: mock({
        blueprint: { id: 'draft-publish-provenance', modules: [] },
        gaps: ['Publication is a repository service rather than an adopter module.'],
        follow_up_questions: [],
      }),
    });

    expect(result.status).toBe('pass');
    const out = join(repo, 'product/draft/blueprints/TASK-2802.json');
    expect(existsSync(out)).toBe(true);
    expect(JSON.parse(readFileSync(out, 'utf8'))).toMatchObject({
      task_id: 'TASK-2802',
      skill_id: 'SKILL-plan-blueprint',
      journey_id: 'JNY-010',
    });
  });

  it('SKILL-compile-tests-from-docs writes a deterministic todo stub at its bounded path', async () => {
    const repo = tempRepo();
    const invariantDir = join(repo, 'law/invariants');
    mkdirSync(invariantDir, { recursive: true });
    writeFileSync(join(invariantDir, 'INV-DEVAI-012.json'), '{"id":"INV-DEVAI-012"}\n');
    const skill = getSkill('SKILL-compile-tests-from-docs');
    if (skill === null) throw new Error('SKILL-compile-tests-from-docs missing');

    const result = await skill.run({
      repoRoot: repo,
      inputs: { task_id: 'TASK-2804', invariant_id: 'INV-DEVAI-012' },
      timestamp: '2026-07-21T20:32:00.000Z',
      llm: mock({
        plan: [
          {
            test_name: 'routes missing readings\nwithout a raw stack',
            assertion: 'the command returns a typed actionable diagnostic',
          },
        ],
        stub_path: 'packages/skills/tests/contract/generated/inv-devai-012.candidate.test.ts',
        language: 'typescript',
      }),
    });

    expect(result.status).toBe('pass');
    const out = join(
      repo,
      'packages/skills/tests/contract/generated/inv-devai-012.candidate.test.ts',
    );
    expect(existsSync(out)).toBe(true);
    const body = readFileSync(out, 'utf8');
    expect(body).toContain("describe('INV-DEVAI-012 candidate plan'");
    expect(body).toContain("it.todo('routes missing readings without a raw stack')");
    expect(body).toContain('the command returns a typed actionable diagnostic');
  });

  it('rejects invariant identifiers that are not safe path segments', async () => {
    const repo = tempRepo();
    const skill = getSkill('SKILL-compile-tests-from-docs');
    if (skill === null) throw new Error('SKILL-compile-tests-from-docs missing');

    const result = await skill.run({
      repoRoot: repo,
      inputs: { task_id: 'TASK-2805', invariant_id: 'INV-../outside' },
      timestamp: '2026-07-21T20:32:30.000Z',
      llm: mock({ plan: [{ test_name: 'must not run' }] }),
    });

    expect(result.status).toBe('fail');
    expect(result.notes?.join(' ')).toContain('filename-safe identifier');
    expect(existsSync(join(repo, 'packages/skills/tests/contract/generated'))).toBe(false);
  });

  it('all three skills refuse to overwrite an existing deterministic candidate path', async () => {
    const cases = [
      {
        skillId: 'SKILL-elicit',
        path: 'product/draft/invariants/TASK-2811.json',
        inputs: { task_id: 'TASK-2811', topic: 'preserve owner draft' },
        response: { candidates: [], follow_up_questions: [] },
      },
      {
        skillId: 'SKILL-plan-blueprint',
        path: 'product/draft/blueprints/TASK-2812.json',
        inputs: { task_id: 'TASK-2812', journey_id: 'JNY-010' },
        response: { blueprint: {}, gaps: [], follow_up_questions: [] },
      },
      {
        skillId: 'SKILL-compile-tests-from-docs',
        path: 'packages/skills/tests/contract/generated/inv-devai-012.candidate.test.ts',
        inputs: { task_id: 'TASK-2813', invariant_id: 'INV-DEVAI-012' },
        response: {
          plan: [{ test_name: 'candidate test', assertion: 'candidate assertion' }],
          stub_path: 'packages/elsewhere/test/ignored.test.ts',
          language: 'typescript',
        },
      },
    ] as const;

    for (const testCase of cases) {
      const repo = tempRepo();
      if (testCase.skillId === 'SKILL-compile-tests-from-docs') {
        const invariantDir = join(repo, 'law/invariants');
        mkdirSync(invariantDir, { recursive: true });
        writeFileSync(join(invariantDir, 'INV-DEVAI-012.json'), '{"id":"INV-DEVAI-012"}\n');
      }
      const out = join(repo, testCase.path);
      mkdirSync(join(out, '..'), { recursive: true });
      writeFileSync(out, 'sentinel\n');
      const skill = getSkill(testCase.skillId);
      if (skill === null) throw new Error(`${testCase.skillId} missing`);

      const result = await skill.run({
        repoRoot: repo,
        inputs: testCase.inputs,
        timestamp: '2026-07-21T20:33:00.000Z',
        llm: mock(testCase.response),
      });

      expect(result.status).toBe('fail');
      expect(result.notes?.join(' ')).toContain('refusing to overwrite existing candidate');
      expect(readFileSync(out, 'utf8')).toBe('sentinel\n');
    }
  });
});

// Invariants: INV-DEVAI-021
