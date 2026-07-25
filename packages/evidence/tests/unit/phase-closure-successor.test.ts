// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, aroundEach, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';
import { closePhase, type PhaseClosureDraft } from '../../src/closure/index.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

const roots: string[] = [];
const fullCommit = '1234567890abcdef1234567890abcdef12345678';

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
      `${JSON.stringify({
        schemaVersion: '1.0.0',
        id,
        round_id: `fixture-${id}`,
        declaring_decision: 'DII-100',
        closing_decision: 'DII-101',
        batches: [{ id: 'fixture', roles: ['Architect'], headline: 'fixture close' }],
        gates: { fixture: { status: 'pass' } },
        source_repo_deleted: false,
        validation_criteria: [{ criterion: 'fixture', verdict: 'pass' }],
        closed_at: '2026-07-24T00:00:00.000Z',
      })}\n`,
    );
  }
  execFileSync('git', ['init', '--quiet'], { cwd: repo });
  execFileSync('git', ['add', '.'], { cwd: repo });
  execFileSync(
    'git',
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
    { cwd: repo },
  );
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
  it('validates raw draft shape before dereferencing batches', () => {
    const malformed = {
      ...draft({
        merged_as: fullCommit,
        release_disposition: 'none-preratification',
      }),
      batches: undefined,
    } as unknown as PhaseClosureDraft;
    expect(() => closePhase(repoWithTwoClosures(), malformed)).toThrow(
      /does not validate.*batches/i,
    );
  });

  it('reports malformed existing closure JSON deterministically', () => {
    const repo = mkdtempSync(join(tmpdir(), 'devai-malformed-closure-'));
    roots.push(repo);
    const dir = join(repo, 'record/proofs/compliance/closures');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'PC-0001.json'), '{ malformed');

    expect(() =>
      closePhase(
        repo,
        draft({
          merged_as: fullCommit,
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/PC-0001.*malformed/i);
  });

  it('quarantines a parseable existing closure that violates the closure schema', () => {
    const repo = repoWithTwoClosures();
    writeFileSync(
      join(repo, 'record/proofs/compliance/closures/PC-0001.json'),
      '{"id":"PC-0001","round_id":"parseable-but-invalid"}\n',
    );
    expect(() =>
      closePhase(
        repo,
        draft({
          merged_as: fullCommit,
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/PC-0001.*does not validate.*phase-closure\.schema\.json/i);
  });

  it('requires merged_as on PC-0003', () => {
    expect(() =>
      closePhase(repoWithTwoClosures(), draft({ release_disposition: 'none-preratification' })),
    ).toThrow(/merged_as is required/);
  });

  it('requires release_disposition on PC-0003', () => {
    expect(() => closePhase(repoWithTwoClosures(), draft({ merged_as: fullCommit }))).toThrow(
      /release_disposition is required/,
    );
  });

  it('rejects a caller-supplied closure id', () => {
    const callerSteered = {
      ...draft({
        merged_as: fullCommit,
        release_disposition: 'none-preratification',
      }),
      id: 'PC-9999',
    } as PhaseClosureDraft;
    expect(() => closePhase(repoWithTwoClosures(), callerSteered)).toThrow(/caller-supplied.*id/i);
  });

  it('rejects an abbreviated merged_as identity', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          merged_as: '1234567',
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/merged_as/i);
  });

  it('requires a full commit identity for Machine-attributed batches', () => {
    const machineBatch = (commit?: string) => ({
      id: 'close',
      roles: ['Machine'] as const,
      ...(commit !== undefined && { commit }),
      headline: 'machine successor close',
    });
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          batches: [machineBatch()],
          merged_as: fullCommit,
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/Machine.*commit/i);
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          batches: [machineBatch('1234567')],
          merged_as: fullCommit,
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/Machine.*commit/i);
  });

  it('accepts a full commit identity for Machine-attributed batches', () => {
    const repo = repoWithTwoClosures();
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    const result = closePhase(
      repo,
      draft({
        batches: [
          {
            id: 'close',
            roles: ['Machine'],
            commit,
            headline: 'machine successor close',
          },
        ],
        merged_as: fullCommit,
        release_disposition: 'none-preratification',
      }),
    );
    expect(result.record.id).toBe('PC-0003');
  });

  it('rejects a full-length batch commit that does not resolve to a commit object', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          batches: [
            {
              id: 'close',
              roles: ['Auditor'],
              commit: fullCommit,
              headline: 'fabricated full identity',
            },
          ],
          merged_as: fullCommit,
          release_disposition: 'none-preratification',
        }),
      ),
    ).toThrow(/batch.*commit.*does not resolve/i);
  });

  it('rejects an empty failed-gate identity', () => {
    expect(() =>
      closePhase(
        repoWithTwoClosures(),
        draft({
          merged_as: fullCommit,
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
          merged_as: fullCommit,
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
