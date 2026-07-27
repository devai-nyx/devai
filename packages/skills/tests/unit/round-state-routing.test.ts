// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getSkill } from '../../src/skills/impl/index.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-round-state-routing-'));
  roots.push(root);
  return root;
}

function write(root: string, relativePath: string, body: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function skill(id: string) {
  const entry = getSkill(id);
  if (entry === null) throw new Error(`missing fixture skill: ${id}`);
  return entry;
}

describe('R-0005 canonical round-state routing', () => {
  it('KR-R5-038 carries backlog proposals and orchestration logs into verify/defer', async () => {
    const repo = fixtureRoot();
    write(
      repo,
      'work/rounds/R-0007/plan.md',
      '# R-0007\n\n**Goal:** prove canonical state routing\n',
    );

    const backlog = await withAuthorityHostTestScope(async () => {
      await skill('SKILL-round-audit').run({ repoRoot: repo, inputs: { round_n: 7 } });
      write(
        repo,
        'work/audit/R-0007/scorecard.baseline.json',
        JSON.stringify({ cells: [{ substrate: 'F1', property: 'T6', verdict: 'FAIL' }] }),
      );
      return skill('SKILL-round-backlog').run({ repoRoot: repo, inputs: { round_n: 7 } });
    });

    expect(backlog).toMatchObject({
      status: 'pass',
      evidence: {
        steps: [
          expect.objectContaining({ description: expect.stringContaining('work/audit/R-0007/') }),
          expect.any(Object),
          expect.objectContaining({
            description: expect.stringContaining(
              '.devai/state/round-runs/R-0007/backlog/prompts/00-orchestrator.md',
            ),
          }),
          expect.objectContaining({
            description: expect.stringContaining(
              '.devai/state/round-runs/R-0007/backlog/prompts/NN-<slug>.md',
            ),
          }),
          expect.any(Object),
        ],
      },
    });

    const orchestrated = await withAuthorityHostTestScope(() =>
      skill('SKILL-round-orchestrate').run({
        repoRoot: repo,
        inputs: { round_n: 7 },
      }),
    );
    expect(orchestrated).toMatchObject({
      status: 'pass',
      evidence: {
        executed_artifacts: {
          dispatched: [expect.objectContaining({ status: 'not-dispatched' })],
        },
      },
    });

    write(
      repo,
      '.devai/config/project.json',
      JSON.stringify({
        hardFailGates: {
          lint: null,
          typecheck: null,
          test: null,
          'docs-links': null,
          'action-coverage': null,
        },
      }),
    );

    const verified = await withAuthorityHostTestScope(() =>
      skill('SKILL-round-verify-publish').run({ repoRoot: repo, inputs: { round_n: 7 } }),
    );
    expect(verified).toMatchObject({
      status: 'pass',
      notes: expect.arrayContaining(['Deferred: 1 backlog item(s)']),
      evidence: {
        executed_artifacts: {
          deferred_count: 1,
          deferred_item_indices: [0],
          wave_statuses: [{ wave: 'W1', status: 'not-dispatched' }],
        },
      },
    });
    expect(
      readFileSync(join(repo, '.devai/state/round-runs/R-0007/verify-publish/Closeout.md'), 'utf8'),
    ).toContain('prove canonical state routing');
  });
});
