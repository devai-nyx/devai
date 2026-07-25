// Invariants: INV-DEVAI-017, INV-DEVAI-018
import { describe, expect, it } from 'vitest';
import {
  ACTIONS_FRESHNESS_JOBS,
  ACTIONS_REUSABLE_JOBS,
  ActionsEvidenceError,
  aggregateActionsEvidenceRequiredCheck,
  evaluateActionsEvidenceWindow,
  selectActionsEvidenceJobs,
  validateActionsEvidenceShadowTuple,
  verifyActionsRunEvidence,
  type ActionsRunEvidenceManifest,
  type CurrentActionsCheckout,
} from '../../src/local-evidence/actions-run.js';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const C = 'c'.repeat(40);
const TREE = 'd'.repeat(40);
const DIGEST = 'e'.repeat(64);
const OTHER = 'f'.repeat(64);

function digests(overrides: Partial<ActionsRunEvidenceManifest['actionsRun']['digests']> = {}) {
  return {
    workflowPolicySha256: DIGEST,
    lockfileSha256: DIGEST,
    toolchainContractSha256: DIGEST,
    testContractSha256: DIGEST,
    serviceContractSha256: DIGEST,
    ...overrides,
  };
}

function manifest(
  actionsOverrides: Partial<ActionsRunEvidenceManifest['actionsRun']> = {},
): ActionsRunEvidenceManifest {
  return {
    schemaVersion: 1,
    generatedAt: '2026-07-25T00:00:00.000Z',
    origin: 'actions-run',
    sourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 12 },
    policy: {
      maxAgeHours: 24,
      requiredJobs: [...ACTIONS_REUSABLE_JOBS],
      allowedPlatforms: ['linux/amd64'],
    },
    tools: { node: { expected: '>=24', observed: ['v24.15.0'] } },
    platforms: ['linux/amd64'],
    jobs: Object.fromEntries(
      ACTIONS_REUSABLE_JOBS.map((job) => [
        job,
        {
          result: 'success',
          metadata: { job, platform: 'linux/amd64' },
          artifactChecksum: { algorithm: 'sha256', value: DIGEST, fileCount: 1 },
        },
      ]),
    ),
    actionsRun: {
      repository: 'devai-nyx/devaii',
      workflowRef: 'devai-nyx/devaii/.github/workflows/ci.yml@refs/pull/1/merge',
      eventName: 'pull_request',
      runId: '100',
      runAttempt: 1,
      actor: 'fixture',
      headSha: A,
      baseSha: B,
      mergeBaseSha: C,
      testedCommitSha: A,
      testedTree: { algorithm: 'sha1', value: TREE },
      digests: digests(),
      ...actionsOverrides,
    },
  };
}

function current(overrides: Partial<CurrentActionsCheckout> = {}): CurrentActionsCheckout {
  return {
    repository: 'devai-nyx/devaii',
    workflowRef: 'devai-nyx/devaii/.github/workflows/ci.yml@refs/pull/1/merge',
    runId: '100',
    runAttempt: 1,
    headSha: A,
    baseSha: B,
    mergeBaseSha: C,
    basePolicySatisfied: true,
    headIsMergeInput: true,
    mergedTree: { algorithm: 'sha1', value: TREE },
    recomputedSourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 12 },
    digests: digests(),
    successfulJobs: [...ACTIONS_REUSABLE_JOBS],
    ...overrides,
  };
}

function verify(
  overrides: {
    mode?: 'shadow' | 'gate';
    manifest?: unknown | null;
    current?: CurrentActionsCheckout;
    authorized?: boolean;
  } = {},
) {
  return verifyActionsRunEvidence({
    mode: overrides.mode ?? 'shadow',
    gateAuthorization:
      overrides.authorized === undefined
        ? undefined
        : {
            authorized: overrides.authorized,
            status: overrides.authorized ? 'active' : 'unavailable',
            source: 'base-parent',
            reason: 'fixture',
          },
    manifest: overrides.manifest === undefined ? manifest() : overrides.manifest,
    current: overrides.current ?? current(),
  });
}

function fullResult(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    kind: 'actions-run-full-result',
    repository: 'devai-nyx/devaii',
    workflowRef: 'devai-nyx/devaii/.github/workflows/ci.yml@refs/pull/1/merge',
    runId: '100',
    runAttempt: 1,
    testedCommitSha: A,
    testedTree: { algorithm: 'sha1', value: TREE },
    result: 'success',
    fullCiAuthoritative: true,
    jobs: Object.fromEntries(ACTIONS_REUSABLE_JOBS.map((job) => [job, 'success'])),
    ...overrides,
  };
}

function shadowDecision(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    kind: 'actions-evidence-shadow-decision',
    mainRunId: '200',
    mainRunAttempt: 1,
    mergedCommitSha: C,
    fullCiResult: 'success',
    shadowFullEquivalent: true,
    disposition: 'promotion-hit',
    reason: 'fixture comparison',
    executeFullCi: true,
    reusableJobs: [...ACTIONS_REUSABLE_JOBS],
    freshnessJobs: [...ACTIONS_FRESHNESS_JOBS],
    ...overrides,
  };
}

describe('Actions-run promotion policy', () => {
  it('keeps shadow execution full and permits a base-authorized exact gate hit', () => {
    expect(verify()).toMatchObject({
      disposition: 'promotion-hit',
      executeFullCi: true,
      hardFailure: false,
    });
    const gate = verify({ mode: 'gate', authorized: true });
    expect(gate).toMatchObject({ disposition: 'promotion-hit', executeFullCi: false });
    expect(selectActionsEvidenceJobs(gate)).toEqual({
      runJobs: ACTIONS_FRESHNESS_JOBS,
      skippedJobs: ACTIONS_REUSABLE_JOBS,
    });
    expect(selectActionsEvidenceJobs(verify())).toEqual({
      runJobs: [...ACTIONS_FRESHNESS_JOBS, ...ACTIONS_REUSABLE_JOBS],
      skippedJobs: [],
    });
  });

  it('classifies every checkout mismatch without borrowing another disposition', () => {
    const cases: Array<[CurrentActionsCheckout, string]> = [
      [current({ repository: 'fork/repo' }), 'invalid-claim'],
      [current({ workflowRef: 'fork/workflow' }), 'invalid-claim'],
      [current({ runId: '101' }), 'invalid-claim'],
      [current({ runAttempt: 2 }), 'invalid-claim'],
      [current({ headSha: C }), 'invalid-claim'],
      [current({ mergeBaseSha: A }), 'invalid-claim'],
      [current({ headIsMergeInput: false }), 'invalid-claim'],
      [current({ baseSha: C }), 'fallback-base-moved'],
      [current({ basePolicySatisfied: false }), 'fallback-base-moved'],
      [current({ mergedTree: { algorithm: 'sha256', value: TREE } }), 'fallback-tree-mismatch'],
      [
        current({
          recomputedSourceHash: { algorithm: 'sha256', value: OTHER, fileCount: 12 },
        }),
        'fallback-tree-mismatch',
      ],
      [
        current({
          recomputedSourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 13 },
        }),
        'fallback-tree-mismatch',
      ],
      [current({ digests: digests({ lockfileSha256: OTHER }) }), 'fallback-lockfile-changed'],
      [
        current({ digests: digests({ toolchainContractSha256: OTHER }) }),
        'fallback-toolchain-changed',
      ],
      [current({ digests: digests({ workflowPolicySha256: OTHER }) }), 'fallback-policy-changed'],
      [current({ digests: digests({ testContractSha256: OTHER }) }), 'fallback-policy-changed'],
      [current({ digests: digests({ serviceContractSha256: OTHER }) }), 'fallback-policy-changed'],
      [current({ successfulJobs: ACTIONS_REUSABLE_JOBS.slice(1) }), 'fallback-job-incomplete'],
    ];
    for (const [checkout, disposition] of cases) {
      const result = verify({ current: checkout });
      expect(result.disposition, result.reason).toBe(disposition);
      expect(result.executeFullCi).toBe(true);
    }
  });

  it('distinguishes absent, unauthorized, and malformed evidence', () => {
    expect(verify({ mode: 'gate' })).toMatchObject({
      disposition: 'fallback-no-evidence',
      hardFailure: false,
    });
    expect(verify({ manifest: null })).toMatchObject({
      disposition: 'fallback-no-evidence',
      hardFailure: false,
    });
    expect(verify({ manifest: { origin: 'actions-run' } })).toMatchObject({
      disposition: 'invalid-claim',
      hardFailure: true,
    });
  });

  it('aggregates the required check with an exact promotion-only skip exception', () => {
    const promoted = verify({ mode: 'gate', authorized: true });
    expect(
      aggregateActionsEvidenceRequiredCheck({
        preflight: 'success',
        evidenceGate: 'success',
        freshness: 'success',
        reusable: 'skipped',
        decision: promoted,
      }),
    ).toBe('success');
    for (const override of [
      { preflight: 'failure' as const },
      { evidenceGate: 'failure' as const },
      { freshness: 'failure' as const },
      { reusable: 'failure' as const },
    ]) {
      expect(
        aggregateActionsEvidenceRequiredCheck({
          preflight: 'success',
          evidenceGate: 'success',
          freshness: 'success',
          reusable: 'success',
          decision: promoted,
          ...override,
        }),
      ).toBe('failure');
    }
    expect(
      aggregateActionsEvidenceRequiredCheck({
        preflight: 'success',
        evidenceGate: 'success',
        freshness: 'success',
        reusable: 'success',
        decision: verify(),
      }),
    ).toBe('success');
  });
});

describe('Actions-run observation windows and imported tuples', () => {
  const observation = (ordinal: number, overrides: Record<string, unknown> = {}) => ({
    mergeSha: ordinal.toString(16).padStart(40, '0'),
    disposition: ordinal <= 3 ? ('promotion-hit' as const) : ('fallback-base-moved' as const),
    shadowFullEquivalent: true,
    durable: true,
    ...overrides,
  });

  it('qualifies only a complete uninterrupted observation window', () => {
    expect(evaluateActionsEvidenceWindow([])).toMatchObject({
      qualifies: false,
      consecutiveMerges: 0,
      promotionHits: 0,
    });
    expect(evaluateActionsEvidenceWindow([1, 2, 3, 4, 5].map((n) => observation(n)))).toMatchObject(
      {
        qualifies: true,
        consecutiveMerges: 5,
        promotionHits: 3,
      },
    );
    for (const broken of [
      observation(3, { disposition: 'UNKNOWN' }),
      observation(3, { disposition: 'invalid-claim' }),
      observation(3, { shadowFullEquivalent: false }),
      observation(3, { durable: false }),
      observation(3, { mechanismDefect: true }),
    ]) {
      const result = evaluateActionsEvidenceWindow([
        observation(1),
        observation(2),
        broken,
        observation(4),
        observation(5),
      ]);
      expect(result).toMatchObject({
        qualifies: false,
        consecutiveMerges: 2,
        resetAfterMerge: broken.mergeSha,
      });
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it('accepts one exact tuple and rejects malformed fields across every envelope', () => {
    expect(
      validateActionsEvidenceShadowTuple({
        manifest: manifest(),
        fullResult: fullResult(),
        decision: shadowDecision(),
        mergeParents: [B, A],
      }),
    ).toEqual({
      mergeSha: C,
      disposition: 'promotion-hit',
      shadowFullEquivalent: true,
      durable: true,
    });

    const invalidCases: Array<[unknown, unknown, unknown, readonly string[]]> = [
      [{}, fullResult(), shadowDecision(), [B, A]],
      [manifest(), null, shadowDecision(), [B, A]],
      [manifest(), fullResult(), null, [B, A]],
      [manifest(), fullResult({ schemaVersion: 2 }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ kind: 'other' }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ result: 'failure' }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ fullCiAuthoritative: false }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ repository: 'fork/repo' }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ testedTree: {} }), shadowDecision(), [B, A]],
      [manifest(), fullResult({ jobs: null }), shadowDecision(), [B, A]],
      [
        manifest(),
        fullResult({ jobs: { ...fullResult().jobs, [ACTIONS_REUSABLE_JOBS[0]]: 'failure' } }),
        shadowDecision(),
        [B, A],
      ],
      [manifest(), fullResult(), shadowDecision({ schemaVersion: 2 }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ kind: 'other' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ mainRunId: '' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ mainRunAttempt: 0 }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ mergedCommitSha: 'short' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ fullCiResult: 'failure' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ executeFullCi: false }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ reason: '' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ disposition: 'other' }), [B, A]],
      [manifest(), fullResult(), shadowDecision({ shadowFullEquivalent: 'yes' }), [B, A]],
      [
        manifest(),
        fullResult(),
        shadowDecision({ disposition: 'UNKNOWN', shadowFullEquivalent: true }),
        [B, A],
      ],
      [
        manifest(),
        fullResult(),
        shadowDecision({ reusableJobs: ACTIONS_REUSABLE_JOBS.slice(1) }),
        [B, A],
      ],
      [
        manifest(),
        fullResult(),
        shadowDecision({ freshnessJobs: ACTIONS_FRESHNESS_JOBS.slice(1) }),
        [B, A],
      ],
      [manifest(), fullResult(), shadowDecision(), [B, C]],
    ];
    for (const [claim, full, decision, parents] of invalidCases) {
      expect(() =>
        validateActionsEvidenceShadowTuple({
          manifest: claim,
          fullResult: full,
          decision,
          mergeParents: parents,
        }),
      ).toThrow(ActionsEvidenceError);
    }
  });

  it('accepts a non-equivalent UNKNOWN observation as durable but non-promotable', () => {
    expect(
      validateActionsEvidenceShadowTuple({
        manifest: manifest(),
        fullResult: fullResult(),
        decision: shadowDecision({
          disposition: 'UNKNOWN',
          shadowFullEquivalent: false,
        }),
        mergeParents: [],
      }),
    ).toMatchObject({ disposition: 'UNKNOWN', shadowFullEquivalent: false, durable: true });
  });
});
