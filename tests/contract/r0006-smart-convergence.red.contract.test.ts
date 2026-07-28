// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const roots: string[] = [];

interface Fixture {
  readonly root: string;
  readonly base: string;
  readonly candidate: string;
}

interface RunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, author: string, subject: string, paths: readonly string[]): string {
  git(root, ['add', '--', ...paths]);
  git(root, [
    '-c',
    `user.name=${author}`,
    '-c',
    'user.email=role@example.test',
    'commit',
    '-qm',
    subject,
  ]);
  return git(root, ['rev-parse', 'HEAD']);
}

function canonical(value: unknown): string {
  const stable = (current: unknown): unknown => {
    if (Array.isArray(current)) return current.map(stable);
    if (current !== null && typeof current === 'object') {
      return Object.fromEntries(
        Object.keys(current as Record<string, unknown>)
          .sort()
          .map((key) => [key, stable((current as Record<string, unknown>)[key])]),
      );
    }
    return current;
  };
  return `${JSON.stringify(stable(value))}\n`;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function policy(): string {
  return `${JSON.stringify(
    {
      schemaVersion: '2.0.0',
      declaration: {
        decision_id: 'DII-207',
        base_pattern: 'exact successor base `([0-9a-f]{40})`',
      },
      freshness_schema: 'law/schemas/task-freshness.schema.json',
      review_scope_schema: 'law/schemas/review-scope-manifest.schema.json',
      freshness: {
        policy_version: 'fixture-v1',
        state_root: '.devai/state/round-runs/{round}/close/freshness',
        local_cache_trusted: true,
        remote_cache_trusted: false,
        remote_environment_indicators: ['CI', 'GITHUB_ACTIONS'],
        outcomes: ['EXECUTED_PASS', 'SKIPPED_FRESH', 'EXECUTED_FAIL', 'BLOCKED'],
        environment_allowlist: [
          { name: 'CI', mode: 'value-sha256' },
          { name: 'FIXTURE_ENV', mode: 'value-sha256' },
        ],
        toolchain: [{ id: 'fixture', argv: ['node', 'fixture/tool-version.mjs'] }],
        input_sets: {
          shared: ['package.json', 'pnpm-lock.yaml', 'vitest.config.ts', 'tests/helpers/**'],
          production: ['packages/**/*.ts'],
          tests: ['tests/**/*.ts'],
          coverage: [
            'packages/**/*.ts',
            'tests/**/*.ts',
            'tests/config/**',
            'package.json',
            'pnpm-lock.yaml',
            'vitest.config.ts',
            'law/policy/round-close-controls.json',
          ],
        },
        tasks: [
          {
            id: 'ordinary',
            input_sets: ['shared', 'production', 'tests'],
            dependencies: [],
            outputs: [],
            graph: 'conservative',
          },
          {
            id: 'coverage',
            input_sets: ['coverage'],
            dependencies: ['ordinary'],
            outputs: ['scratch/coverage/coverage-summary.json'],
            graph: 'complete',
            coverage_mode: 'whole-only',
          },
        ],
        unknown_dependency: 'execute-broader-suite',
        dynamic_import_ambiguity: 'execute-broader-suite',
        failed_or_malformed_cache: 'execute',
        dirty_untracked_deleted_renamed_inputs: 'included-in-key',
        coverage_reuse: 'whole-identical-inputs-and-outputs-only',
        partial_coverage_merge: 'forbidden',
      },
      convergence: {
        passes: 2,
        second_pass: 'no-write-clean',
        normalized_runtime_artifacts: [],
        commands: [
          { id: 'ordinary', argv: ['node', 'fixture/gate.mjs', 'ordinary'] },
          { id: 'coverage', argv: ['node', 'fixture/gate.mjs', 'coverage'] },
        ],
      },
      review_scope: {
        policy_version: 'fixture-v1',
        manifest_state: '.devai/state/round-runs/{round}/close/review-scope-manifest.json',
        candidate_manifest_state: '.devai/state/round-runs/{round}/close/candidate-manifest.json',
        candidate_manifest_history:
          '.devai/state/round-runs/{round}/close/candidate-manifests/*.json',
        exact_range: 'declared-base-to-candidate',
        requirement_sources: [
          'work/rounds/R-0006/AUTHORIZATION.md',
          'work/rounds/R-0006/plan.md',
          'work/rounds/R-0006/prompts/00-orchestrator.md',
          'product/owner-mandates/OM-011.md',
        ],
        controlling_sources: ['law/policy/round-close-controls.json', 'law/register/DECISIONS.md'],
        prior_reviews: [1, 2, 3, 4].map(
          (number) => `work/audit/R-0006/review-${String(number)}-failure.md`,
        ),
        topic_sources: [
          'changed-path',
          'requirement',
          'control',
          'previous-finding',
          'candidate-manifest',
        ],
        topic_fields: [
          'topic_id',
          'claim',
          'governing_paths',
          'current_digest',
          'previous_digest',
          'changed_status',
          'required_adversaries',
          'previous_findings',
          'freshness_proof',
          'required_disposition',
        ],
        dispositions: ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'],
        unchanged_requires_recomputation: true,
        exactly_once: true,
        previous_findings_mandatory: true,
        review_record_markers: {
          start: '<!-- review-topic-dispositions:start -->',
          end: '<!-- review-topic-dispositions:end -->',
        },
        review_cycles: {
          maximum: 2,
          cycle_1: 'exhaustive-discovery',
          cycle_2: 'complete-rereview',
          cycle_2_failure: 'stop-and-owner-escalation',
          forced_pass: false,
        },
      },
    },
    null,
    2,
  )}\n`;
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r0006-smart-convergence-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/**\nscratch/**\n');
  put(root, 'package.json', '{"private":true}\n');
  put(root, 'pnpm-lock.yaml', 'lockfileVersion: 9\n');
  put(root, 'vitest.config.ts', 'export default {};\n');
  put(root, 'tests/helpers/shared.ts', 'export const shared = true;\n');
  put(root, 'tests/config/coverage.ts', 'export const threshold = 70;\n');
  put(root, 'tests/unit.test.ts', "import '../packages/source.js';\n");
  put(root, 'packages/source.ts', 'export const source = 1;\n');
  put(root, 'fixture/tool-version.mjs', "process.stdout.write('fixture-tool-v1\\n');\n");
  put(
    root,
    'fixture/gate.mjs',
    "import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';\nconst id=process.argv[2]; const dir='.devai/state/executions'; mkdirSync(dir,{recursive:true}); const path=dir+'/'+id; const count=Number((()=>{try{return readFileSync(path,'utf8')}catch{return '0'}})()); writeFileSync(path,String(count+1)); if(id==='coverage'){mkdirSync('scratch/coverage',{recursive:true}); writeFileSync('scratch/coverage/coverage-summary.json','{\\\"ok\\\":true}\\n')}\n",
  );
  put(root, 'law/policy/round-close-controls.json', policy());
  put(root, 'law/schemas/task-freshness.schema.json', '{}\n');
  put(root, 'law/schemas/review-scope-manifest.schema.json', '{}\n');
  put(root, 'work/rounds/R-0006/AUTHORIZATION.md', '# Authorization\n- Every gate passes.\n');
  put(root, 'work/rounds/R-0006/plan.md', '# Plan\n- Coverage stays whole.\n');
  put(root, 'work/rounds/R-0006/prompts/00-orchestrator.md', '# Prompt\n- Review every topic.\n');
  put(root, 'product/owner-mandates/OM-011.md', '# OM-011\n- Cache only exact PASS.\n');
  for (const number of [1, 2, 3, 4]) {
    put(
      root,
      `work/audit/R-0006/review-${String(number)}-failure.md`,
      `# Review ${String(number)}\n### P1 — defect class ${String(number)}\nFinding ${String(number)}.\n`,
    );
  }
  const base = commit(root, 'DEVAI Architect', 'chore: fixture base', [
    '.gitignore',
    'package.json',
    'pnpm-lock.yaml',
    'vitest.config.ts',
    'tests/helpers/shared.ts',
    'tests/config/coverage.ts',
    'tests/unit.test.ts',
    'packages/source.ts',
    'fixture/tool-version.mjs',
    'fixture/gate.mjs',
    'law/policy/round-close-controls.json',
    'law/schemas/task-freshness.schema.json',
    'law/schemas/review-scope-manifest.schema.json',
    'work/rounds/R-0006/AUTHORIZATION.md',
    'work/rounds/R-0006/plan.md',
    'work/rounds/R-0006/prompts/00-orchestrator.md',
    'product/owner-mandates/OM-011.md',
    ...[1, 2, 3, 4].map((number) => `work/audit/R-0006/review-${String(number)}-failure.md`),
  ]);
  put(
    root,
    'law/register/DECISIONS.md',
    `### DII-207 — fixture\nexact successor base \`${base}\`\n`,
  );
  const candidate = commit(root, 'DEVAI Architect', 'law: declare fixture', [
    'law/register/DECISIONS.md',
  ]);
  const manifestBody = { review_candidate: candidate, published_head: candidate };
  put(
    root,
    '.devai/state/round-runs/R-0006/close/candidate-manifest.json',
    canonical({ ...manifestBody, manifest_digest_sha256: sha256(canonical(manifestBody)) }),
  );
  return { root, base, candidate };
}

function run(
  root: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv = {},
): RunResult {
  return spawnSync(process.execPath, [SCRIPT, ...args, '--repo-root', root, '--json'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  }) as RunResult;
}

function smartArgs(base: string, candidate: string): string[] {
  return ['smart-converge', '--round', 'R-0006', '--base', base, '--head', candidate];
}

function output(result: RunResult): Record<string, unknown> {
  return JSON.parse(result.stdout as string) as Record<string, unknown>;
}

function outcomes(result: RunResult): string[] {
  const passes = output(result).passes as { results: { outcome: string }[] }[];
  return passes.flatMap((pass) => pass.results.map(({ outcome }) => outcome));
}

function executionCount(root: string, task: string): number {
  return Number(readFileSync(join(root, '.devai/state/executions', task), 'utf8'));
}

function generateScope(current: Fixture): Record<string, unknown> {
  const result = run(current.root, [
    'review-scope',
    '--round',
    'R-0006',
    '--base',
    current.base,
    '--candidate',
    current.candidate,
  ]);
  expect(result.status, result.stderr).toBe(0);
  return output(result);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('R-0006 OM-011 content-addressed freshness red contracts', () => {
  it('executes an uncached task and skips only an unchanged content-addressed PASS', () => {
    const current = fixture();
    const result = run(current.root, smartArgs(current.base, current.candidate));
    expect(result.status, result.stderr).toBe(0);
    expect(outcomes(result)).toEqual([
      'EXECUTED_PASS',
      'EXECUTED_PASS',
      'SKIPPED_FRESH',
      'SKIPPED_FRESH',
    ]);
    expect(executionCount(current.root, 'ordinary')).toBe(1);
    expect(executionCount(current.root, 'coverage')).toBe(1);
  });

  it('invalidates dependent tests for source changes and all dependents for shared inputs', () => {
    for (const path of [
      'packages/source.ts',
      'tests/unit.test.ts',
      'tests/helpers/shared.ts',
      'vitest.config.ts',
      'pnpm-lock.yaml',
    ]) {
      const current = fixture();
      const initial = run(current.root, smartArgs(current.base, current.candidate));
      expect(initial.status, initial.stderr).toBe(0);
      put(current.root, path, `${readFileSync(join(current.root, path), 'utf8')}\n// changed\n`);
      const next = commit(
        current.root,
        path.startsWith('tests/') ? 'DEVAI Inspector' : 'DEVAI Engineer',
        `test: change ${path}`,
        [path],
      );
      const rerun = run(current.root, smartArgs(current.base, next));
      expect(rerun.status, rerun.stderr).toBe(0);
      expect(outcomes(rerun).slice(0, 2)).toEqual(['EXECUTED_PASS', 'EXECUTED_PASS']);
      expect(executionCount(current.root, 'ordinary')).toBe(2);
      expect(executionCount(current.root, 'coverage')).toBe(2);
    }
  });

  it.each([
    ['dirty', (root: string) => put(root, 'packages/source.ts', 'export const source = 2;\n')],
    ['untracked', (root: string) => put(root, 'tests/new.test.ts', 'export {};\n')],
    ['deleted', (root: string) => git(root, ['rm', 'tests/unit.test.ts'])],
    ['renamed', (root: string) => git(root, ['mv', 'packages/source.ts', 'packages/renamed.ts'])],
  ])('never skips when a relevant %s input is not committed', (_kind, mutate) => {
    const current = fixture();
    const initial = run(current.root, smartArgs(current.base, current.candidate));
    expect(initial.status, initial.stderr).toBe(0);
    mutate(current.root);
    const result = run(current.root, smartArgs(current.base, current.candidate));
    expect(result.status).not.toBe(0);
    expect(outcomes(result)).not.toContain('SKIPPED_FRESH');
    expect(outcomes(result)).toContain('BLOCKED');
  });

  it('invalidates on toolchain, environment, and policy drift', () => {
    const current = fixture();
    const initial = run(current.root, smartArgs(current.base, current.candidate), {
      FIXTURE_ENV: 'one',
    });
    expect(initial.status, initial.stderr).toBe(0);
    const environment = run(current.root, smartArgs(current.base, current.candidate), {
      FIXTURE_ENV: 'two',
    });
    expect(environment.status, environment.stderr).toBe(0);
    expect(outcomes(environment).slice(0, 2)).toEqual(['EXECUTED_PASS', 'EXECUTED_PASS']);

    put(current.root, 'fixture/tool-version.mjs', "process.stdout.write('fixture-tool-v2\\n');\n");
    const toolCandidate = commit(current.root, 'DEVAI Engineer', 'build: change toolchain', [
      'fixture/tool-version.mjs',
    ]);
    const toolchain = run(current.root, smartArgs(current.base, toolCandidate), {
      FIXTURE_ENV: 'two',
    });
    expect(toolchain.status, toolchain.stderr).toBe(0);
    expect(outcomes(toolchain).slice(0, 2)).toEqual(['EXECUTED_PASS', 'EXECUTED_PASS']);

    const policyValue = JSON.parse(
      readFileSync(join(current.root, 'law/policy/round-close-controls.json'), 'utf8'),
    ) as { freshness: { policy_version: string } };
    policyValue.freshness.policy_version = 'fixture-v2';
    put(current.root, 'law/policy/round-close-controls.json', canonical(policyValue));
    const policyCandidate = commit(current.root, 'DEVAI Architect', 'law: change freshness', [
      'law/policy/round-close-controls.json',
    ]);
    const policyDrift = run(current.root, smartArgs(current.base, policyCandidate), {
      FIXTURE_ENV: 'two',
    });
    expect(policyDrift.status, policyDrift.stderr).toBe(0);
    expect(outcomes(policyDrift).slice(0, 2)).toEqual(['EXECUTED_PASS', 'EXECUTED_PASS']);
  });

  it.each(['failed', 'stale', 'malformed', 'tampered'])(
    'never skips from a %s cache entry',
    (mode) => {
      const current = fixture();
      const initial = run(current.root, smartArgs(current.base, current.candidate));
      expect(initial.status, initial.stderr).toBe(0);
      const cachePath = join(
        current.root,
        '.devai/state/round-runs/R-0006/close/freshness/tasks/ordinary.json',
      );
      if (mode === 'malformed') writeFileSync(cachePath, '{');
      else {
        const cache = JSON.parse(readFileSync(cachePath, 'utf8')) as Record<string, unknown>;
        if (mode === 'failed') cache.outcome = 'EXECUTED_FAIL';
        else cache.task_key = '0'.repeat(64);
        if (mode === 'stale') {
          const body = { ...cache };
          delete body.result_digest;
          cache.result_digest = sha256(canonical(body));
        }
        writeFileSync(cachePath, canonical(cache));
      }
      const result = run(current.root, smartArgs(current.base, current.candidate));
      expect(result.status, result.stderr).toBe(0);
      expect(outcomes(result)[0]).toBe('EXECUTED_PASS');
      expect(executionCount(current.root, 'ordinary')).toBe(2);
    },
  );

  it('widens unknown or dynamic dependency knowledge and reruns whole coverage after provider change', () => {
    const current = fixture();
    const initial = run(current.root, smartArgs(current.base, current.candidate));
    expect(initial.status, initial.stderr).toBe(0);
    put(current.root, 'tests/config/coverage.ts', 'export const threshold = 71;\n');
    put(current.root, 'packages/dynamic.ts', "export const load = import('./unknown.js');\n");
    const candidate = commit(current.root, 'DEVAI Inspector', 'test: change coverage provider', [
      'tests/config/coverage.ts',
      'packages/dynamic.ts',
    ]);
    const result = run(current.root, smartArgs(current.base, candidate));
    expect(result.status, result.stderr).toBe(0);
    expect(outcomes(result).slice(0, 2)).toEqual(['EXECUTED_PASS', 'EXECUTED_PASS']);
    expect(executionCount(current.root, 'ordinary')).toBe(2);
    expect(executionCount(current.root, 'coverage')).toBe(2);
  });

  it('reruns coverage when a required retained output is missing or tampered', () => {
    const current = fixture();
    const initial = run(current.root, smartArgs(current.base, current.candidate));
    expect(initial.status, initial.stderr).toBe(0);
    put(current.root, 'scratch/coverage/coverage-summary.json', '{"tampered":true}\n');
    const result = run(current.root, smartArgs(current.base, current.candidate));
    expect(result.status, result.stderr).toBe(0);
    expect(outcomes(result).slice(0, 2)).toEqual(['SKIPPED_FRESH', 'EXECUTED_PASS']);
    expect(executionCount(current.root, 'ordinary')).toBe(1);
    expect(executionCount(current.root, 'coverage')).toBe(2);
  });

  it('distrusts pre-existing local cache on remote CI and executes the full gate set', () => {
    const current = fixture();
    const local = run(current.root, smartArgs(current.base, current.candidate));
    expect(local.status, local.stderr).toBe(0);
    const remote = run(current.root, smartArgs(current.base, current.candidate), {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    });
    expect(remote.status, remote.stderr).toBe(0);
    expect(outcomes(remote)).toEqual([
      'EXECUTED_PASS',
      'EXECUTED_PASS',
      'SKIPPED_FRESH',
      'SKIPPED_FRESH',
    ]);
    expect(executionCount(current.root, 'ordinary')).toBe(2);
    expect(executionCount(current.root, 'coverage')).toBe(2);
  });

  it('exposes governed package commands and keeps cache below ignored state', () => {
    const scripts = (
      JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>;
      }
    ).scripts;
    expect(scripts).toMatchObject({
      'round-close:smart-converge': expect.stringContaining('smart-converge'),
      'round-close:review-scope': expect.stringContaining('review-scope'),
      'round-close:review-check': expect.stringContaining('review-check'),
    });
    const current = fixture();
    const result = run(current.root, smartArgs(current.base, current.candidate));
    expect(result.status, result.stderr).toBe(0);
    expect(git(current.root, ['status', '--porcelain', '--untracked-files=all'])).toBe('');
  });
});

describe('R-0006 OM-011 exhaustive review-scope red contracts', () => {
  it('makes the cycle-1 failure classes mandatory in the cycle-2 census', () => {
    const livePolicy = JSON.parse(
      readFileSync(join(ROOT, 'law/policy/round-close-controls.json'), 'utf8'),
    ) as {
      review_scope: {
        prior_reviews: string[];
        previous_findings_mandatory: boolean;
      };
    };
    const materializedPolicy = JSON.parse(
      readFileSync(join(ROOT, '.devai/config/round-close-controls.json'), 'utf8'),
    ) as typeof livePolicy;
    const cycleOneRecord = 'work/audit/R-0006/independent-opus-b9-review-5-failure.md';
    expect(livePolicy.review_scope.previous_findings_mandatory).toBe(true);
    expect(livePolicy.review_scope.prior_reviews).toContain(cycleOneRecord);
    expect(materializedPolicy).toEqual(livePolicy);
    expect(materializedPolicy.review_scope.prior_reviews).toContain(cycleOneRecord);
    const source = readFileSync(join(ROOT, cycleOneRecord), 'utf8');
    expect(source).toContain('### P1 — stale current coverage, suite, trace, and range readings');
    expect(source).toContain('### P2 — stale governed-sequencing exception census');
  });

  it('emits every exact-range, requirement, control, manifest, and prior-finding topic exactly once', () => {
    const current = fixture();
    const result = generateScope(current);
    const manifest = result.manifest as {
      topic_count: number;
      topics: { topic_id: string; previous_findings: string[] }[];
    };
    const ids = manifest.topics.map(({ topic_id }) => topic_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(manifest.topic_count).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^changed-path:/u),
        expect.stringMatching(/^requirement:/u),
        expect.stringMatching(/^control:/u),
        expect.stringMatching(/^candidate-manifest:/u),
      ]),
    );
    expect(
      manifest.topics.filter(({ previous_findings }) => previous_findings.length > 0),
    ).toHaveLength(4);
  });

  it.each(['omitted', 'duplicated', 'unverified-unchanged'])(
    'rejects a review record with an %s mandatory-topic disposition',
    (mode) => {
      const current = fixture();
      const generated = generateScope(current);
      const manifest = generated.manifest as {
        topics: { topic_id: string; current_digest: string; changed_status: string }[];
      };
      let dispositions = manifest.topics.map((topic) => ({
        topic_id: topic.topic_id,
        disposition: 'RECHECKED_PASS',
        recomputed_digest: topic.current_digest,
        freshness_verified: true,
        rationale: 'Current invariant independently rechecked.',
      }));
      if (mode === 'omitted') dispositions = dispositions.slice(1);
      if (mode === 'duplicated') {
        const first = dispositions[0];
        if (first === undefined) throw new Error('fixture review scope must contain topics');
        dispositions.push(first);
      }
      if (mode === 'unverified-unchanged') {
        const index = manifest.topics.findIndex(
          ({ changed_status }) => changed_status === 'unchanged',
        );
        expect(index).toBeGreaterThanOrEqual(0);
        const current = dispositions[index];
        if (current === undefined) throw new Error('fixture unchanged topic is missing');
        dispositions[index] = {
          ...current,
          disposition: 'REUSED_FRESH_PASS',
          freshness_verified: false,
          rationale: 'Unchanged.',
        };
      }
      const record = [
        '---',
        'verdict: PASS',
        `review_candidate: ${current.candidate}`,
        '---',
        '<!-- review-topic-dispositions:start -->',
        JSON.stringify(dispositions),
        '<!-- review-topic-dispositions:end -->',
        '',
      ].join('\n');
      put(current.root, 'work/audit/R-0006/review.md', record);
      const result = run(current.root, [
        'review-check',
        '--round',
        'R-0006',
        '--candidate',
        current.candidate,
        '--review-record',
        'work/audit/R-0006/review.md',
      ]);
      expect(result.status).not.toBe(0);
      const codes = (output(result).findings as { code: string }[]).map(({ code }) => code);
      expect(codes).toContain(
        mode === 'omitted'
          ? 'REVIEW_TOPIC_OMITTED'
          : mode === 'duplicated'
            ? 'REVIEW_TOPIC_DUPLICATED'
            : 'REVIEW_TOPIC_FRESHNESS_UNVERIFIED',
      );
    },
  );

  it('retains every prior finding class after repair and blocks review cycle 3', () => {
    const current = fixture();
    const generated = generateScope(current);
    const manifest = generated.manifest as {
      topics: { previous_findings: string[] }[];
    };
    expect(manifest.topics.flatMap(({ previous_findings }) => previous_findings)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('defect class 1'),
        expect.stringContaining('defect class 2'),
        expect.stringContaining('defect class 3'),
        expect.stringContaining('defect class 4'),
      ]),
    );
    const result = run(current.root, [
      'review-check',
      '--round',
      'R-0006',
      '--candidate',
      current.candidate,
      '--review-record',
      'work/audit/R-0006/review.md',
      '--cycle',
      '3',
    ]);
    expect(result.status).not.toBe(0);
    expect(output(result).findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'REVIEW_CYCLE_BUDGET_EXHAUSTED' })]),
    );
  });

  it('binds retained previous candidate-manifest history into the census', () => {
    const current = fixture();
    const previousBody = { review_candidate: current.base, published_head: current.base };
    const previous = {
      ...previousBody,
      manifest_digest_sha256: sha256(canonical(previousBody)),
    };
    put(
      current.root,
      `.devai/state/round-runs/R-0006/close/candidate-manifests/${current.base}-${previous.manifest_digest_sha256}.json`,
      canonical(previous),
    );
    const generated = generateScope(current);
    const manifest = generated.manifest as {
      previous_candidate_manifest_digests: string[];
      topics: { topic_id: string; previous_digest: string | null }[];
    };
    expect(manifest.previous_candidate_manifest_digests).toEqual([previous.manifest_digest_sha256]);
    expect(
      manifest.topics.find(({ topic_id }) => topic_id.startsWith('candidate-manifest:'))
        ?.previous_digest,
    ).not.toBeNull();
  });
});
