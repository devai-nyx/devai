// Invariants: INV-DEVAI-001, INV-DEVAI-008, INV-DEVAI-017
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const WORKFLOW_CHECKER = join(ROOT, 'scripts/check-workflows.mjs');
const WORKFLOW_DIRECTORY = join(ROOT, '.github/workflows');
const ACTION_DIRECTORY = join(ROOT, '.github/actions');
const ROUND_CLOSE_CONTROLS = join(ROOT, 'law/policy/round-close-controls.json');
const COMMIT_VALIDATION_POLICY = join(ROOT, 'law/policy/commit-validation.json');
const FEATURE_POLICY = join(ROOT, 'law/policy/github-actions-features.json');
const OPTIMISATION_EVIDENCE = join(ROOT, 'work/audit/R-0007/ci-optimisation-benchmark.json');
const ACTION_PIN = 'a'.repeat(40);
const temporaryRoots: string[] = [];

interface CommandResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function runWorkflowChecker(root: string): CommandResult {
  const result = spawnSync(process.execPath, [WORKFLOW_CHECKER], {
    cwd: root,
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function workflowFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-ci-contract-'));
  temporaryRoots.push(root);
  const target = join(root, '.github/workflows');
  mkdirSync(target, { recursive: true });
  for (const file of readdirSync(WORKFLOW_DIRECTORY).filter((name) => /\.ya?ml$/u.test(name))) {
    copyFileSync(join(WORKFLOW_DIRECTORY, file), join(target, file));
  }
  cpSync(ACTION_DIRECTORY, join(root, '.github/actions'), { recursive: true });
  const policyTarget = join(root, 'law/policy');
  mkdirSync(policyTarget, { recursive: true });
  copyFileSync(ROUND_CLOSE_CONTROLS, join(policyTarget, 'round-close-controls.json'));
  return root;
}

function replaceOnce(root: string, file: string, needle: string, replacement: string): void {
  const path = join(root, file);
  const source = readFileSync(path, 'utf8');
  if (!source.includes(needle)) throw new Error(`${file}: mutation anchor is absent: ${needle}`);
  writeFileSync(path, source.replace(needle, replacement));
}

function diagnosticFailure(root: string, diagnostic: string, specimen: string): string | undefined {
  const result = runWorkflowChecker(root);
  const output = `${result.stderr}\n${result.stdout}`;
  if (result.status !== 1) {
    return `${specimen}: escaped with exit ${String(result.status)}; expected ${diagnostic}`;
  }
  if (!output.includes(diagnostic)) {
    return `${specimen}: failed without ${diagnostic}; output=${JSON.stringify(output.trim())}`;
  }
  return undefined;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function optionalEvidence(): Record<string, unknown> | undefined {
  return existsSync(OPTIMISATION_EVIDENCE) ? readJson(OPTIMISATION_EVIDENCE) : undefined;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

beforeAll(() => {
  const baseline = runWorkflowChecker(ROOT);
  expect(
    baseline.status,
    `known-green pre-R-0007 workflow baseline failed:\n${baseline.stderr}\n${baseline.stdout}`,
  ).toBe(0);
});

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('R-0007 GitHub Actions acceleration red contracts', () => {
  it('R7-024-CACHE-ACQUISITION-ONLY rejects verdict caches and always retains frozen install', () => {
    const verdictCacheRoot = workflowFixture();
    replaceOnce(
      verdictCacheRoot,
      '.github/actions/r7-pnpm-setup/action.yml',
      '        path: ${{ steps.pnpm-store.outputs.path }}',
      '        path: node_modules',
    );
    replaceOnce(
      verdictCacheRoot,
      '.github/actions/r7-pnpm-setup/action.yml',
      "        key: r7-pnpm-store-${{ runner.os }}-${{ runner.arch }}-node-${{ hashFiles('.node-version') }}-pnpm-${{ hashFiles('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc') }}-${{ steps.pnpm-store.outputs.candidate }}",
      "        key: verdict-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}",
    );

    const conditionalInstallRoot = workflowFixture();
    replaceOnce(
      conditionalInstallRoot,
      '.github/actions/r7-pnpm-setup/action.yml',
      [
        '    - name: Frozen dependency installation',
        '      id: frozen-install',
        '      shell: bash',
        '      run: pnpm install --frozen-lockfile',
      ].join('\n'),
      [
        '    - name: Frozen dependency installation',
        '      id: frozen-install',
        "      if: steps.pnpm-store-cache.outputs.cache-hit != 'true'",
        '      shell: bash',
        '      run: pnpm install --frozen-lockfile',
      ].join('\n'),
    );

    expect(
      [
        diagnosticFailure(
          verdictCacheRoot,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'node_modules cache adopts a verdict namespace',
        ),
        diagnosticFailure(
          conditionalInstallRoot,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'cache hit can skip pnpm install --frozen-lockfile',
        ),
      ].filter(Boolean),
      'R7-F014 requires cache state to affect acquisition time only',
    ).toEqual([]);
  });

  it('R7-024-ARTIFACT-NOT-PASS rejects undigested PASS transport and hidden reusable inputs', () => {
    const artifactRoot = workflowFixture();
    replaceOnce(
      artifactRoot,
      '.github/workflows/ci.yml',
      '      - name: Derive fail-closed validation plan',
      [
        `      - uses: actions/download-artifact@${ACTION_PIN} # v4`,
        '        with:',
        '          name: gate-pass',
        '          path: transport',
        '      - id: transported-verdict',
        '        run: test -f transport/PASS && echo "verdict=PASS" >> "$GITHUB_OUTPUT"',
        '',
        '      - name: Derive fail-closed validation plan',
      ].join('\n'),
    );

    const hiddenInputRoot = workflowFixture();
    replaceOnce(
      hiddenInputRoot,
      '.github/workflows/reusable-evidence-gate.yml',
      '  verify:\n    runs-on: ubuntu-latest',
      [
        '  verify:',
        '    runs-on: ubuntu-latest',
        '    env:',
        '      HIDDEN_TRUST_ROOT: ${{ secrets.RUNTIME_TRUST_ROOT }}',
      ].join('\n'),
    );

    expect(
      [
        diagnosticFailure(
          artifactRoot,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'artifact name/existence substitutes for a digest-verified semantic gate',
        ),
        diagnosticFailure(
          hiddenInputRoot,
          'CI_REUSABLE_INPUT_UNBOUND',
          'reusable workflow consumes an undeclared trust-root input',
        ),
      ].filter(Boolean),
      'R7-F014 requires digest-checked non-authoritative artifacts and explicit reusable inputs',
    ).toEqual([]);
  });

  it('R7-024-FORK-POISONING-FAILS-CLOSED rejects fork cache poisoning, mutable pins, and permission widening', () => {
    const forkRoot = workflowFixture();
    replaceOnce(
      forkRoot,
      '.github/actions/r7-pnpm-setup/action.yml',
      '        path: ${{ steps.pnpm-store.outputs.path }}',
      ['        path: |', '          .devai/state', '          .devai/pin'].join('\n'),
    );
    replaceOnce(
      forkRoot,
      '.github/actions/r7-pnpm-setup/action.yml',
      "        key: r7-pnpm-store-${{ runner.os }}-${{ runner.arch }}-node-${{ hashFiles('.node-version') }}-pnpm-${{ hashFiles('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc') }}-${{ steps.pnpm-store.outputs.candidate }}",
      [
        '        key: base-${{ github.base_ref }}-${{ github.sha }}',
        '        restore-keys: base-${{ github.base_ref }}-',
      ].join('\n'),
    );

    const mutablePinRoot = workflowFixture();
    replaceOnce(
      mutablePinRoot,
      '.github/workflows/ci.yml',
      'actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4',
      'actions/checkout@v4 # v4',
    );

    const permissionRoot = workflowFixture();
    replaceOnce(
      permissionRoot,
      '.github/workflows/ci.yml',
      'permissions:\n  contents: read',
      'permissions: write-all',
    );

    expect(
      [
        diagnosticFailure(
          forkRoot,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'pull-request cache shares base-ref state and forbidden DEVAI paths',
        ),
        diagnosticFailure(
          mutablePinRoot,
          'CI_ACTION_REFERENCE_MUTABLE',
          'external action uses a mutable version tag',
        ),
        diagnosticFailure(
          permissionRoot,
          'CI_WORKFLOW_PERMISSION_WIDENED',
          'workflow grants write-all instead of least privilege',
        ),
      ].filter(Boolean),
      'R7-F014 requires immutable action provenance, least privilege, and fork-safe caches',
    ).toEqual([]);
  });

  it('R7-025-DAG-PRESERVES-ORDER rejects lost needs edges and reversed cold stage order', () => {
    const needsRoot = workflowFixture();
    replaceOnce(needsRoot, '.github/workflows/round-gates.yml', '    needs: regression\n', '');

    const tierRoot = workflowFixture();
    replaceOnce(
      tierRoot,
      '.github/workflows/cold-sentinel.yml',
      [
        '      - name: Cold 09 / stage 1',
        '        continue-on-error: true',
        '        run: node scripts/r7-ci-cold-sentinel.mjs --execute stage1 --ordinal 9 --records scratch/r7-ci/cold-sentinel/commands -- pnpm run ci:stage1',
        '      - name: Cold 10 / stage 2',
        '        continue-on-error: true',
        '        run: node scripts/r7-ci-cold-sentinel.mjs --execute stage2 --ordinal 10 --records scratch/r7-ci/cold-sentinel/commands -- pnpm run ci:stage2',
      ].join('\n'),
      [
        '      - name: Cold 09 / stage 2',
        '        continue-on-error: true',
        '        run: node scripts/r7-ci-cold-sentinel.mjs --execute stage2 --ordinal 9 --records scratch/r7-ci/cold-sentinel/commands -- pnpm run ci:stage2',
        '      - name: Cold 10 / stage 1',
        '        continue-on-error: true',
        '        run: node scripts/r7-ci-cold-sentinel.mjs --execute stage1 --ordinal 10 --records scratch/r7-ci/cold-sentinel/commands -- pnpm run ci:stage1',
      ].join('\n'),
    );

    expect(
      [
        diagnosticFailure(
          needsRoot,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          'smoke-e2e no longer needs regression',
        ),
        diagnosticFailure(
          tierRoot,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          'cold stage2 executes before stage1 in the authoritative roster',
        ),
      ].filter(Boolean),
      'R7-F015 requires semantic job edges and declared cold command ordering',
    ).toEqual([]);
  });

  it('R7-025-MATRIX-COMPLETE rejects cells that do not execute their declared population', () => {
    const root = workflowFixture();
    replaceOnce(
      root,
      '.github/workflows/ci.yml',
      '    runs-on: ubuntu-latest\n    permissions:',
      [
        '    runs-on: ubuntu-latest',
        '    strategy:',
        '      fail-fast: false',
        '      matrix:',
        '        tier: [test:t1, test:t2]',
        '    permissions:',
      ].join('\n'),
    );

    expect(
      [
        diagnosticFailure(
          root,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          'both matrix cells ignore matrix.tier and execute the same partial population',
        ),
      ].filter(Boolean),
      'R7-F015 requires every declared matrix cell exactly once',
    ).toEqual([]);
  });

  it('R7-025-AUTHORITATIVE-RUN-NOT-CANCELLED permits PR feedback cancellation only', () => {
    const unsafeFastRoot = workflowFixture();
    replaceOnce(
      unsafeFastRoot,
      '.github/workflows/ci.yml',
      "  cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
      '  cancel-in-progress: true',
    );
    const unsafeColdRoot = workflowFixture();
    replaceOnce(
      unsafeColdRoot,
      '.github/workflows/cold-sentinel.yml',
      '  cancel-in-progress: false',
      '  cancel-in-progress: true',
    );

    expect(
      [
        diagnosticFailure(
          unsafeFastRoot,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          'fast workflow cancels authoritative push-main and merge-queue runs',
        ),
        diagnosticFailure(
          unsafeColdRoot,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          'cold sentinel cancellation can replace an authoritative observation',
        ),
      ].filter(Boolean),
      'R7-F015 forbids cancellation of main, merge-queue, frozen-candidate, convergence, and close runs',
    ).toEqual([]);
  });

  it('R7-028-FEATURE-CENSUS-TOTAL requires a current one-to-one feature disposition census', () => {
    const featurePolicy = readJson(FEATURE_POLICY);
    const discovered = featurePolicy.applicable_features as unknown[] | undefined;
    const dispositions = featurePolicy.feature_dispositions as
      Array<Record<string, unknown>> | undefined;

    expect(
      discovered,
      'CI_FEATURE_CENSUS_INCOMPLETE: applicable_features must be an array',
    ).toBeInstanceOf(Array);
    expect(
      dispositions,
      'CI_FEATURE_CENSUS_INCOMPLETE: feature_dispositions must be an array',
    ).toBeInstanceOf(Array);
    if (!Array.isArray(discovered) || !Array.isArray(dispositions)) return;

    const discoveredIds = discovered.map((entry) =>
      typeof entry === 'string' ? entry : String((entry as Record<string, unknown>).feature_id),
    );
    const dispositionIds = dispositions.map((entry) => String(entry.feature_id));
    expect(new Set(discoveredIds).size, 'CI_FEATURE_CENSUS_INCOMPLETE: duplicate discovery').toBe(
      discoveredIds.length,
    );
    expect(
      dispositionIds.sort(),
      'CI_FEATURE_CENSUS_INCOMPLETE: census/disposition mismatch',
    ).toEqual([...discoveredIds].sort());
    expect(
      dispositions.every(
        (entry) =>
          ['adopt', 'defer', 'reject'].includes(String(entry.disposition)) &&
          typeof entry.security_rationale === 'string' &&
          typeof entry.semantic_rationale === 'string' &&
          typeof entry.cost_rationale === 'string' &&
          Array.isArray(entry.immutable_source_refs) &&
          typeof entry.observed_at === 'string',
      ),
      'CI_FEATURE_CENSUS_INCOMPLETE: every feature needs one factual current disposition',
    ).toBe(true);

    const mandatoryFoundation = [
      'pnpm-content-store-cache',
      'reusable-setup',
      'dependency-dag',
      'complete-matrix',
      'event-specific-concurrency',
      'immutable-action-pins',
      'least-privilege-permissions',
      'fork-cache-boundaries',
      'bounded-artifact-retention',
      'structured-reports',
      'workflow-summaries',
      'timing-telemetry',
      'artifact-transport',
      'fast-feedback-lane',
      'cold-authoritative-lane',
    ];
    expect(
      mandatoryFoundation.every((id) => discoveredIds.includes(id)),
      'CI_FEATURE_CENSUS_INCOMPLETE: OM-021 foundation item absent from live census',
    ).toBe(true);
  });

  it('R7-028-PAIRED-CRITICAL-PATH blocks activation until equal-population timings exist', () => {
    const policy = readJson(COMMIT_VALIDATION_POLICY);
    const activation = policy.activation as Record<string, unknown>;
    const boundaries = activation.acceptance_boundaries as Record<string, unknown>;
    const b3c = boundaries.B3C as Record<string, unknown>;
    const b7 = boundaries.B7 as Record<string, unknown>;

    expect(activation.current_state).toBe('disabled-pending-paired-evidence');
    expect(b3c.paired_benchmark_required).toBe(false);
    expect(b3c.required_state).toBe('disabled-pending-paired-evidence');
    expect(b7.paired_benchmark_required).toBe(true);
    expect(b7.required_evidence).toBe('work/audit/R-0007/ci-optimisation-benchmark.json');

    const evidence = optionalEvidence();
    if (evidence === undefined) return;
    const pairs = evidence.paired_runs as Array<Record<string, unknown>> | undefined;
    expect(
      pairs,
      'CI_OPTIMISATION_POPULATION_MISMATCH: paired_runs must be an array',
    ).toBeInstanceOf(Array);
    if (!Array.isArray(pairs)) return;
    expect(
      pairs.length,
      'CI_OPTIMISATION_SAMPLE_INCOMPLETE: cold and warm pairs required',
    ).toBeGreaterThanOrEqual(2);

    for (const pair of pairs) {
      expect(['cold-miss', 'warm-hit']).toContain(pair.cache_state);
      expect(typeof pair.exact_candidate_sha).toBe('string');
      expect(typeof pair.runner_class).toBe('string');
      expect(pair.semantic_population_equal).toBe(true);
      const baseline = pair.baseline_runs as Array<Record<string, unknown>>;
      const candidate = pair.candidate_runs as Array<Record<string, unknown>>;
      expect(
        baseline.length,
        'CI_OPTIMISATION_SAMPLE_INCOMPLETE: repeated baseline runs',
      ).toBeGreaterThanOrEqual(3);
      expect(candidate.length, 'CI_OPTIMISATION_SAMPLE_INCOMPLETE: repeated candidate runs').toBe(
        baseline.length,
      );
      const allRuns = [...baseline, ...candidate];
      for (const run of allRuns) {
        expect(run.semantic_population).toMatchObject({
          files: expect.any(Number),
          suites: expect.any(Number),
          cases: expect.any(Number),
          executed: expect.any(Number),
          reused: expect.any(Number),
          coverage: expect.any(Object),
        });
        expect(run.timings_ms).toMatchObject({
          queue: expect.any(Number),
          setup: expect.any(Number),
          install: expect.any(Number),
          jobs: expect.any(Object),
          gates: expect.any(Object),
          artifact_verification: expect.any(Number),
          critical_path: expect.any(Number),
        });
      }
      expect(
        candidate.map((run) => run.semantic_population),
        'CI_OPTIMISATION_POPULATION_MISMATCH: timing follows exact population equality',
      ).toEqual(baseline.map((run) => run.semantic_population));
      const baselineMedian = median(
        baseline.map((run) => Number((run.timings_ms as Record<string, unknown>).critical_path)),
      );
      const candidateMedian = median(
        candidate.map((run) => Number((run.timings_ms as Record<string, unknown>).critical_path)),
      );
      const summary = pair.median_critical_path_change as Record<string, unknown>;
      expect(summary.absolute_ms).toBe(candidateMedian - baselineMedian);
      expect(summary.percentage).toBeCloseTo(
        ((candidateMedian - baselineMedian) / baselineMedian) * 100,
      );
    }
  });
});
