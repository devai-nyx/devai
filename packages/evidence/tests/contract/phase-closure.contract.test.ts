import { mkdtempSync, rmSync } from 'node:fs';
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
