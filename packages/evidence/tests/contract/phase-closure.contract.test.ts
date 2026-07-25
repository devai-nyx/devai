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

describe('PC-0002 append-only correction', () => {
  it('preserves PC-0001 and selects PC-0002 as the effective R-0001 closure', () => {
    const pc1 = readFileSync(
      join(ROOT, 'record/proofs/compliance/closures/PC-0001.json'),
    );
    expect(createHash('sha256').update(pc1).digest('hex')).toBe(
      '56f8d37868ec72ca9b16f22e3f1d74fd2098b2c050f73a230a9c147c250bfad9',
    );
    const records = readClosures(ROOT);
    const original = records.find((record) => record.id === 'PC-0001');
    const correction = records.find((record) => record.id === 'PC-0002');
    const originalEvidence = (original as { readonly evidence?: unknown } | undefined)?.evidence;
    const correctionEvidence = (correction as { readonly evidence?: unknown } | undefined)?.evidence;
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
    expect(ledger.rounds.find((record) => record.id === 'PC-0001')?.superseded_by).toBe(
      'PC-0002',
    );
  });
});
