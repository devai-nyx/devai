import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';
import {
  closePhase,
  computeLedger,
  readClosures,
  type PhaseClosureDraft,
} from '../../src/closure/index.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

const roots: string[] = [];
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
// Invariants: INV-DEVAI-001

function repoRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-phase-closure-'));
  roots.push(root);
  return root;
}

function draft(
  declaring_decision: string,
  closing_decision: string,
  overrides: Partial<PhaseClosureDraft> = {},
): PhaseClosureDraft {
  return {
    round_id: `R-${declaring_decision}-${closing_decision}`,
    declaring_decision,
    closing_decision,
    batches: [{ id: 'B0', roles: ['Architect'], headline: 'contract fixture' }],
    gates: { contract: { status: 'pass' } },
    source_repo_deleted: false,
    validation_criteria: [{ criterion: 'contract fixture', verdict: 'pass' }],
    closed_at: '2026-07-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('phase-closure proof path', () => {
  it('describes the immutable compliance-proof path instead of mutable runtime state', () => {
    const schema = JSON.parse(
      readFileSync(join(ROOT, 'law/schemas/phase-closure.schema.json'), 'utf8'),
    ) as { readonly description?: string };

    expect(schema.description).toContain('record/proofs/compliance/closures/PC-NNNN.json');
    expect(schema.description).not.toContain('.devai/state/closures');
  });
});

describe('phase-closure decision ordering', () => {
  it('accepts a strictly increasing DII decision pair', () => {
    const result = closePhase(repoRoot(), draft('DII-104', 'DII-105'));
    expect(result.record.declaring_decision).toBe('DII-104');
    expect(result.record.closing_decision).toBe('DII-105');
  });

  it.each([
    ['equal', 'DII-105', 'DII-105'],
    ['inverted', 'DII-105', 'DII-104'],
    ['mixed legacy-to-successor', 'D-196', 'DII-105'],
    ['mixed successor-to-legacy', 'DII-105', 'D-196'],
    ['malformed declaring id', 'DII-X', 'DII-105'],
    ['malformed closing id', 'DII-104', 'DII-X'],
  ])('rejects %s ordering', (_label, declaring, closing) => {
    expect(() => closePhase(repoRoot(), draft(declaring, closing))).toThrow();
  });
});

describe('phase-closure release disposition', () => {
  it('expresses none-preratification through the typed closure path', () => {
    const typedDraft = draft('DII-104', 'DII-105', {
      release_disposition: 'none-preratification',
    }) satisfies PhaseClosureDraft;
    expect(closePhase(repoRoot(), typedDraft).record.release_disposition).toBe(
      'none-preratification',
    );
  });
});

describe('phase-closure failed-gate acknowledgment', () => {
  it.each([
    ['all criteria pass', [{ criterion: 'coverage-t1-t3 threshold', verdict: 'pass' as const }]],
    [
      'the failing criterion names another gate',
      [
        {
          criterion: 'different-gate failed',
          verdict: 'fail' as const,
          evidence: 'BL-999',
        },
      ],
    ],
  ])('rejects a failed gate when %s', (_label, validation_criteria) => {
    expect(() =>
      closePhase(
        repoRoot(),
        draft('DII-104', 'DII-105', {
          gates: { 'coverage-t1-t3': { status: 'fail' } },
          validation_criteria,
        }),
      ),
    ).toThrow(/coverage-t1-t3/);
  });

  it.each([
    [
      'criterion',
      {
        criterion: 'coverage-t1-t3 remains below the unchanged floor',
        verdict: 'fail' as const,
      },
    ],
    [
      'evidence',
      {
        criterion: 'Merged coverage remains governed',
        verdict: 'fail' as const,
        evidence: 'coverage-t1-t3 is the exact BL-017 red',
      },
    ],
  ])('accepts an explicit failing acknowledgment in the %s', (_label, criterion) => {
    const result = closePhase(
      repoRoot(),
      draft('DII-104', 'DII-105', {
        gates: { 'coverage-t1-t3': { status: 'fail' } },
        validation_criteria: [criterion],
      }),
    );
    expect(result.record.gates['coverage-t1-t3']?.status).toBe('fail');
  });
});

describe('phase-closure machine attribution', () => {
  it('records a machine-verb batch without relabeling it as a human role', () => {
    const result = closePhase(
      repoRoot(),
      draft('DII-105', 'DII-112', {
        batches: [
          {
            id: 'B6-machine',
            roles: ['Machine'],
            commit: 'bec810bb38e74ebdf0bd31ec3ee90aa0b186d1ed',
            headline: 'Emitted the append-only PC-0002 correction through the production verb',
          },
          {
            id: 'B6-inspector',
            roles: ['Inspector'],
            commit: 'ab1ef5a2338f76d04fa2af383e51839ecc9a4d9f',
            headline: 'Verified closure supersession and ledger selection',
          },
        ],
      }),
    );

    expect(result.record.batches[0]?.roles).toEqual(['Machine']);
    expect(result.record.batches[1]?.roles).toEqual(['Inspector']);
  });
});

describe('PC-0002 append-only correction', () => {
  it('preserves PC-0001 and selects PC-0002 as the effective R-0001 closure', () => {
    const pc1 = readFileSync(join(ROOT, 'record/proofs/compliance/closures/PC-0001.json'));
    const pc2 = readFileSync(join(ROOT, 'record/proofs/compliance/closures/PC-0002.json'));
    expect(createHash('sha256').update(pc1).digest('hex')).toBe(
      '56f8d37868ec72ca9b16f22e3f1d74fd2098b2c050f73a230a9c147c250bfad9',
    );
    expect(createHash('sha256').update(pc2).digest('hex')).toBe(
      'b1d4ce8873272149d61de4eb71776c985b4d41c3086ddb7efed89550a1354135',
    );
    const records = readClosures(ROOT);
    const original = records.find((record) => record.id === 'PC-0001');
    const correction = records.find((record) => record.id === 'PC-0002');
    const originalEvidence = (original as { readonly evidence?: unknown } | undefined)?.evidence;
    const correctionEvidence = (correction as { readonly evidence?: unknown } | undefined)
      ?.evidence;
    expect(correction).toMatchObject({
      round_id: 'R-0001',
      supersedes: 'PC-0001',
      release_disposition: 'none-preratification',
    });
    expect(correction?.batches).toEqual(original?.batches);
    expect(correction?.gates).toEqual(original?.gates);
    expect(correctionEvidence).toEqual(originalEvidence);
    expect(correction?.validation_criteria).toContainEqual(
      expect.objectContaining({
        verdict: 'fail',
        evidence: expect.stringContaining('BL-045'),
      }),
    );
    const ledger = computeLedger(records);
    expect(ledger.count).toBe(1);
    expect(ledger.streak_basis).toContain('PC-0002');
    expect(ledger.rounds.find((record) => record.id === 'PC-0001')?.superseded_by).toBe('PC-0002');
  });
});
