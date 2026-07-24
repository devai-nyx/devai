import { describe, expect, it } from 'vitest';
import { getValidator } from '@devai-nyx/schemas';

const validateLocalEvidenceManifest = getValidator('local-evidence-manifest.schema.json');

// R22 W07 / D-146 / ADR-005: red-first contract for Actions-run evidence.
// W08 promotes this file by implementing the expected module; the Inspector
// owns these assertions and the Engineer must not weaken them to obtain green.

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);
const TREE = 'd'.repeat(40);
const DIGEST = '1'.repeat(64);
const OTHER_DIGEST = '2'.repeat(64);

const REUSABLE_JOBS = [
  'merged-coverage',
  'regression',
  'contract',
  'smoke',
  'supported-e2e',
  'experimental-containment',
  'gate-invariant-verb-smoke',
  'inventory-spec-self-application',
] as const;

const FRESHNESS_JOBS = [
  'build',
  'lint',
  'format',
  'typecheck',
  'evidence-chain',
  'changeset-version-contract',
  'dependency-policy',
] as const;

type Disposition =
  | 'promotion-hit'
  | 'fallback-no-evidence'
  | 'fallback-tree-mismatch'
  | 'fallback-base-moved'
  | 'fallback-policy-changed'
  | 'fallback-lockfile-changed'
  | 'fallback-toolchain-changed'
  | 'fallback-job-incomplete'
  | 'invalid-claim';

interface DigestSet {
  readonly workflowPolicySha256: string;
  readonly lockfileSha256: string;
  readonly toolchainContractSha256: string;
  readonly testContractSha256: string;
  readonly serviceContractSha256: string;
}

interface CurrentCheckout {
  readonly repository: string;
  readonly workflowRef: string;
  readonly runId: string;
  readonly runAttempt: number;
  readonly headSha: string;
  readonly baseSha: string;
  readonly mergeBaseSha: string;
  readonly basePolicySatisfied: boolean;
  readonly headIsMergeInput: boolean;
  readonly mergedTree: { readonly algorithm: 'sha1' | 'sha256'; readonly value: string };
  /** Must be recomputed from the merged checkout, never copied from the claim. */
  readonly recomputedSourceHash: {
    readonly algorithm: 'sha256';
    readonly value: string;
    readonly fileCount: number;
  };
  readonly digests: DigestSet;
  readonly successfulJobs: readonly string[];
}

interface EvidenceDecision {
  readonly disposition: Disposition;
  readonly reason: string;
  readonly executeFullCi: boolean;
  readonly reusableJobs: readonly string[];
  readonly freshnessJobs: readonly string[];
}

interface WindowObservation {
  readonly mergeSha: string;
  readonly disposition: Disposition | 'UNKNOWN';
  readonly shadowFullEquivalent: boolean;
  readonly durable: boolean;
  readonly mechanismDefect?: boolean;
}

interface WindowDecision {
  readonly qualifies: boolean;
  readonly consecutiveMerges: number;
  readonly promotionHits: number;
  readonly resetAfterMerge?: string;
  readonly reason: string;
}

interface ActionsEvidenceApi {
  readonly verifyActionsRunEvidence: (inputs: {
    readonly mode: 'shadow' | 'gate';
    readonly gateAuthorized?: boolean;
    readonly manifest: unknown | null;
    readonly current: CurrentCheckout;
  }) => EvidenceDecision;
  readonly evaluateActionsEvidenceWindow: (
    observations: readonly WindowObservation[],
  ) => WindowDecision;
  readonly validateActionsEvidenceShadowTuple: (inputs: {
    readonly manifest: unknown;
    readonly fullResult: unknown;
    readonly decision: unknown;
    readonly mergeParents: readonly string[];
  }) => WindowObservation;
}

let apiPromise: Promise<ActionsEvidenceApi | null> | undefined;

async function api(): Promise<ActionsEvidenceApi> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- W07 intentionally pins the W08 module before it exists.
  apiPromise ??= import('../../src/local-evidence/actions-run.js')
    .then((loaded: Record<string, unknown>) => loaded as unknown as ActionsEvidenceApi)
    .catch(() => null);
  const loaded = await apiPromise;
  expect(
    loaded,
    'The evidence package must implement src/local-evidence/actions-run.ts',
  ).not.toBeNull();
  expect(typeof loaded?.verifyActionsRunEvidence).toBe('function');
  expect(typeof loaded?.evaluateActionsEvidenceWindow).toBe('function');
  return loaded as ActionsEvidenceApi;
}

function fullResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const claim = manifest().actionsRun as Record<string, unknown>;
  return {
    schemaVersion: 1,
    kind: 'actions-run-full-result',
    repository: claim.repository,
    workflowRef: claim.workflowRef,
    runId: claim.runId,
    runAttempt: claim.runAttempt,
    testedCommitSha: claim.testedCommitSha,
    testedTree: claim.testedTree,
    result: 'success',
    fullCiAuthoritative: true,
    jobs: Object.fromEntries(REUSABLE_JOBS.map((job) => [job, 'success'])),
    ...overrides,
  };
}

function shadowDecision(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    kind: 'actions-evidence-shadow-decision',
    mainRunId: '29633313693',
    mainRunAttempt: 1,
    mergedCommitSha: SHA_C,
    fullCiResult: 'success',
    shadowFullEquivalent: true,
    disposition: 'promotion-hit',
    reason: 'exact tested value is eligible for promotion',
    executeFullCi: true,
    reusableJobs: [...REUSABLE_JOBS],
    freshnessJobs: [...FRESHNESS_JOBS],
    ...overrides,
  };
}

function digests(overrides: Partial<DigestSet> = {}): DigestSet {
  return {
    workflowPolicySha256: DIGEST,
    lockfileSha256: DIGEST,
    toolchainContractSha256: DIGEST,
    testContractSha256: DIGEST,
    serviceContractSha256: DIGEST,
    ...overrides,
  };
}

function localFields(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    generatedAt: '2026-07-17T12:00:00.000Z',
    sourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 12 },
    policy: {
      maxAgeHours: 24,
      requiredJobs: [...REUSABLE_JOBS],
      allowedPlatforms: ['linux/amd64'],
    },
    tools: {
      node: { expected: '>=24.0.0', observed: ['v24.15.0'] },
      pnpm: { expected: '10.0.0', observed: ['10.0.0'] },
    },
    platforms: ['linux/amd64'],
    jobs: Object.fromEntries(
      REUSABLE_JOBS.map((job) => [
        job,
        {
          result: 'success',
          metadata: { job, platform: 'linux/amd64' },
          artifactChecksum: { algorithm: 'sha256', value: DIGEST, fileCount: 1 },
        },
      ]),
    ),
  };
}

function manifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...localFields(),
    origin: 'actions-run',
    actionsRun: {
      repository: 'devai-nyx/devai',
      workflowRef: 'devai-nyx/devai/.github/workflows/ci.yml@refs/pull/46/merge',
      eventName: 'pull_request',
      runId: '29623903828',
      runAttempt: 1,
      actor: 'aarusso',
      headSha: SHA_A,
      baseSha: SHA_B,
      mergeBaseSha: SHA_C,
      testedCommitSha: SHA_A,
      testedTree: { algorithm: 'sha1', value: TREE },
      digests: digests(),
    },
    ...overrides,
  };
}

function current(overrides: Partial<CurrentCheckout> = {}): CurrentCheckout {
  return {
    repository: 'devai-nyx/devai',
    workflowRef: 'devai-nyx/devai/.github/workflows/ci.yml@refs/pull/46/merge',
    runId: '29623903828',
    runAttempt: 1,
    headSha: SHA_A,
    baseSha: SHA_B,
    mergeBaseSha: SHA_C,
    basePolicySatisfied: true,
    headIsMergeInput: true,
    mergedTree: { algorithm: 'sha1', value: TREE },
    recomputedSourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 12 },
    digests: digests(),
    successfulJobs: [...REUSABLE_JOBS],
    ...overrides,
  };
}

async function decide(
  options: {
    readonly manifest?: unknown | null;
    readonly current?: CurrentCheckout;
    readonly mode?: 'shadow' | 'gate';
  } = {},
): Promise<EvidenceDecision> {
  return (await api()).verifyActionsRunEvidence({
    mode: options.mode ?? 'shadow',
    gateAuthorized: false,
    manifest: options.manifest === undefined ? manifest() : options.manifest,
    current: options.current ?? current(),
  });
}

function expectFallback(
  decision: EvidenceDecision,
  disposition: Disposition,
  reason: RegExp,
): void {
  expect(decision).toMatchObject({ disposition, executeFullCi: true });
  expect(decision.reason).toMatch(reason);
}

describe('R22 Actions-run manifest compatibility', () => {
  it('accepts the actions-run variant without rejecting an unchanged legacy local manifest', () => {
    expect(validateLocalEvidenceManifest(manifest())).toBe(true);
    expect(validateLocalEvidenceManifest(localFields())).toBe(true);
  });
});

describe('R22 exact-value promotion decisions', () => {
  it('reports a promotion hit in shadow but still executes full CI', async () => {
    const decision = await decide();
    expect(decision).toMatchObject({ disposition: 'promotion-hit', executeFullCi: true });
    expect(decision.reusableJobs).toEqual(REUSABLE_JOBS);
    expect(decision.freshnessJobs).toEqual(FRESHNESS_JOBS);
  });

  it('falls back when the actual merged tree differs', async () => {
    const decision = await decide({
      current: current({ mergedTree: { algorithm: 'sha1', value: SHA_C } }),
    });
    expectFallback(decision, 'fallback-tree-mismatch', /tree/i);
  });

  it('falls back when the merged-checkout sourceHash differs despite tree equality', async () => {
    const decision = await decide({
      current: current({
        recomputedSourceHash: { algorithm: 'sha256', value: OTHER_DIGEST, fileCount: 12 },
      }),
    });
    expectFallback(decision, 'fallback-tree-mismatch', /source.?hash/i);
  });

  it('falls back when the sourceHash file count differs', async () => {
    const decision = await decide({
      current: current({
        recomputedSourceHash: { algorithm: 'sha256', value: DIGEST, fileCount: 13 },
      }),
    });
    expectFallback(decision, 'fallback-tree-mismatch', /file.?count|source.?hash/i);
  });

  it('falls back when the protected base moved', async () => {
    const decision = await decide({ current: current({ baseSha: SHA_C }) });
    expectFallback(decision, 'fallback-base-moved', /base/i);
  });

  it('falls back when required-up-to-date or merge-queue policy was not satisfied', async () => {
    const decision = await decide({ current: current({ basePolicySatisfied: false }) });
    expectFallback(decision, 'fallback-base-moved', /up.?to.?date|merge.?queue|base/i);
  });

  it.each([
    ['workflow policy', { workflowPolicySha256: OTHER_DIGEST }, /workflow|policy/i],
    ['test contract', { testContractSha256: OTHER_DIGEST }, /test/i],
    ['service contract', { serviceContractSha256: OTHER_DIGEST }, /service/i],
  ])('falls back when the %s digest changes', async (_name, changed, reason) => {
    const decision = await decide({ current: current({ digests: digests(changed) }) });
    expectFallback(decision, 'fallback-policy-changed', reason);
  });

  it('falls back when the lockfile digest changes', async () => {
    const decision = await decide({
      current: current({ digests: digests({ lockfileSha256: OTHER_DIGEST }) }),
    });
    expectFallback(decision, 'fallback-lockfile-changed', /lockfile/i);
  });

  it('falls back when the Node or package-manager contract changes', async () => {
    const decision = await decide({
      current: current({ digests: digests({ toolchainContractSha256: OTHER_DIGEST }) }),
    });
    expectFallback(decision, 'fallback-toolchain-changed', /toolchain/i);
  });

  it('falls back when a required heavy job is absent', async () => {
    const decision = await decide({
      current: current({ successfulJobs: REUSABLE_JOBS.slice(1) }),
    });
    expectFallback(decision, 'fallback-job-incomplete', /job/i);
  });

  it('uses absence as a legitimate fallback and malformed claims as hard invalidity', async () => {
    expectFallback(await decide({ manifest: null }), 'fallback-no-evidence', /evidence|claim/i);
    const invalid = await decide({ manifest: { origin: 'actions-run' } });
    expect(invalid.disposition).toBe('invalid-claim');
    expect(invalid.reason).toMatch(/schema|manifest|claim/i);
  });

  it.each([
    ['repository', current({ repository: 'attacker/fork' })],
    ['workflow', current({ workflowRef: 'attacker/fork/.github/workflows/ci.yml@main' })],
    ['run attempt', current({ runAttempt: 2 })],
    ['run id', current({ runId: '999' })],
    ['head input', current({ headSha: SHA_C })],
    ['merge base', current({ mergeBaseSha: SHA_A })],
    ['merge-method input', current({ headIsMergeInput: false })],
  ])('treats inconsistent %s identity as an invalid claim', async (_name, checkout) => {
    const decision = await decide({ current: checkout });
    expect(decision.disposition).toBe('invalid-claim');
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it('selects full execution before an explicit recorded graduation', async () => {
    const loaded = await api();
    expect(
      loaded.verifyActionsRunEvidence({
        mode: 'gate',
        gateAuthorized: false,
        manifest: manifest(),
        current: current(),
      }),
    ).toMatchObject({ executeFullCi: true });
  });
});

describe('R22 strong consecutive-window semantics', () => {
  function observation(
    ordinal: number,
    overrides: Partial<WindowObservation> = {},
  ): WindowObservation {
    return {
      mergeSha: ordinal.toString(16).padStart(40, '0'),
      disposition: ordinal <= 3 ? 'promotion-hit' : 'fallback-base-moved',
      shadowFullEquivalent: true,
      durable: true,
      ...overrides,
    };
  }

  it('qualifies five consecutive durable equivalent merges with at least three hits', async () => {
    const result = (await api()).evaluateActionsEvidenceWindow(
      [1, 2, 3, 4, 5].map((ordinal) => observation(ordinal)),
    );
    expect(result).toMatchObject({ qualifies: true, consecutiveMerges: 5, promotionHits: 3 });
  });

  it('does not skip UNKNOWN inside a candidate streak', async () => {
    const observations = [
      observation(1),
      observation(2),
      observation(3, { disposition: 'UNKNOWN' }),
      observation(4),
      observation(5),
      observation(6, { disposition: 'promotion-hit' }),
      observation(7, { disposition: 'promotion-hit' }),
    ];
    const result = (await api()).evaluateActionsEvidenceWindow(observations);
    expect(result).toMatchObject({
      qualifies: false,
      consecutiveMerges: 4,
      resetAfterMerge: observations[2]?.mergeSha,
    });
    expect(result.reason).toMatch(/UNKNOWN|unknown|missing/i);
  });

  it('resets after an undurable observation or any mechanism defect', async () => {
    for (const broken of [
      observation(3, { durable: false }),
      observation(3, { mechanismDefect: true }),
      observation(3, { shadowFullEquivalent: false }),
    ]) {
      const observations = [observation(1), observation(2), broken, observation(4), observation(5)];
      const result = (await api()).evaluateActionsEvidenceWindow(observations);
      expect(result.qualifies).toBe(false);
      expect(result.consecutiveMerges).toBe(2);
      expect(result.resetAfterMerge).toBe(broken.mergeSha);
    }
  });
});

describe('R22 durable shadow-tuple import validation', () => {
  it('accepts a byte-importable tuple only when the source claim, full result, decision, and merge parents agree', async () => {
    const loaded = await api();
    expect(typeof loaded.validateActionsEvidenceShadowTuple).toBe('function');
    const result = loaded.validateActionsEvidenceShadowTuple({
      manifest: manifest(),
      fullResult: fullResult(),
      decision: shadowDecision(),
      mergeParents: [SHA_B, SHA_A],
    });
    expect(result).toEqual({
      mergeSha: SHA_C,
      disposition: 'promotion-hit',
      shadowFullEquivalent: true,
      durable: true,
    });
  });

  it('rejects a full result that does not describe the exact manifest run', async () => {
    const loaded = await api();
    expect(() =>
      loaded.validateActionsEvidenceShadowTuple({
        manifest: manifest(),
        fullResult: fullResult({ runAttempt: 2 }),
        decision: shadowDecision(),
        mergeParents: [SHA_B, SHA_A],
      }),
    ).toThrow(/run attempt|full result|manifest/i);
  });

  it('rejects a claimed promotion hit unless the merged commit has the exact tested base and head parents', async () => {
    const loaded = await api();
    expect(() =>
      loaded.validateActionsEvidenceShadowTuple({
        manifest: manifest(),
        fullResult: fullResult(),
        decision: shadowDecision(),
        mergeParents: [SHA_B, 'e'.repeat(40)],
      }),
    ).toThrow(/parent|merge input|head/i);
  });

  it('accepts UNKNOWN only as a non-equivalent durable observation that still executes full CI', async () => {
    const result = (await api()).validateActionsEvidenceShadowTuple({
      manifest: manifest(),
      fullResult: fullResult(),
      decision: shadowDecision({
        disposition: 'UNKNOWN',
        shadowFullEquivalent: false,
        reason: 'transport unavailable',
      }),
      mergeParents: [],
    });
    expect(result).toMatchObject({
      mergeSha: SHA_C,
      disposition: 'UNKNOWN',
      shadowFullEquivalent: false,
      durable: true,
    });
  });
});

// Invariants: INV-DEVAI-017
