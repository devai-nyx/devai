import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';
import { closePhase, type PhaseClosureDraft } from '../../src/closure/index.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function repoWithTwoClosures(): string {
  const repo = mkdtempSync(join(tmpdir(), 'devai-successor-closure-'));
  roots.push(repo);
  const dir = join(repo, 'record/proofs/compliance/closures');
  mkdirSync(dir, { recursive: true });
  for (const id of ['PC-0001', 'PC-0002']) {
    writeFileSync(
      join(dir, `${id}.json`),
      `${JSON.stringify({ id, round_id: `fixture-${id}` })}\n`,
    );
  }
  return repo;
}

function draft(overrides: Partial<PhaseClosureDraft> = {}): PhaseClosureDraft {
  return {
    round_id: 'R-0002',
    declaring_decision: 'DII-105',
    closing_decision: 'DII-124',
    batches: [{ id: 'close', roles: ['Architect'], headline: 'successor close' }],
    gates: { 'coverage-t1-t3': { status: 'pass' } },
    source_repo_deleted: false,
    validation_criteria: [{ criterion: 'exact candidate reviewed', verdict: 'pass' }],
    closed_at: '2026-07-25T00:00:00.000Z',
    ...overrides,
  };
}

describe('successor phase-closure binding', () => {
  it('requires merged_as on PC-0003', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({ release_disposition: 'none-preratification' }),
      ),
    ).toThrow(/merged_as is required/);
  });

  it('requires release_disposition on PC-0003', () => {
    expect(() =>
      closePhase(repoWithTwoClosures(), draft({ merged_as: '1234567' })),
    ).toThrow(/release_disposition is required/);
  });

  it('rejects an empty failed-gate identity', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          merged_as: '1234567',
          release_disposition: 'none-preratification',
          gates: { '': { status: 'fail' } },
          validation_criteria: [{ criterion: 'some failure', verdict: 'fail' }],
        }),
      ),
    ).toThrow(/gate/i);
  });

  it('does not acknowledge a short gate by substring', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          merged_as: '1234567',
          release_disposition: 'none-preratification',
          gates: { t1: { status: 'fail' } },
          validation_criteria: [
            {
              criterion: 'coverage-t1-t3 remains governed',
              verdict: 'fail',
            },
          ],
        }),
      ),
    ).toThrow(/t1/);
  });
});
