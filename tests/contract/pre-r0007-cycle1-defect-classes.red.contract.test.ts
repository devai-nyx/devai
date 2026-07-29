// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 45_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const ROUND = 'R-9000';
const roots: string[] = [];

// Governed sequencing must be able to resolve every red contract to these exact
// Engineer/Architect implementation surfaces. Keep the paths literal.
const REPAIR_IMPLEMENTATION_PATHS = [
  'scripts/run-round-close-controls.mjs',
  'packages/schemas/src/roster.ts',
  'law/policy/round-close-controls.json',
  '.devai/config/round-close-controls.json',
  'work/rounds/R-0007/affected-test-graph.json',
  'law/schemas/task-freshness.schema.json',
  'law/schemas/review-scope-manifest.schema.json',
  'law/schemas/review-result.schema.json',
  'law/schemas/current-claims.schema.json',
] as const;

interface Fixture {
  readonly root: string;
  readonly base: string;
}

interface Result {
  readonly status: number | null;
  readonly value: Record<string, unknown>;
  readonly stderr: string;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stable(child)]),
    );
  }
  return value;
}

function canonical(value: unknown): string {
  return `${JSON.stringify(stable(value))}\n`;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function putJson(root: string, relativePath: string, value: unknown): void {
  put(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copy(root: string, relativePath: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, relativePath), target);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, subject: string): string {
  git(root, ['add', '-A']);
  git(root, [
    '-c',
    'user.name=DEVAI Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '-qm',
    subject,
  ]);
  return git(root, ['rev-parse', 'HEAD']);
}

function run(
  fixture: Fixture,
  command: string,
  args: readonly string[] = [],
  env: NodeJS.ProcessEnv = {},
): Result {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', fixture.root, '--round', ROUND, ...args, '--json'],
    { cwd: fixture.root, encoding: 'utf8', env: { ...process.env, ...env } },
  );
  let value: Record<string, unknown> = {};
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = { stdout: result.stdout };
  }
  return { status: result.status, value, stderr: result.stderr };
}

function findingCodes(result: Result): string[] {
  return ((result.value.findings ?? []) as Array<{ code: string }>).map(({ code }) => code);
}

function nodeOutcomes(result: Result): Map<string, string> {
  return new Map(
    ((result.value.nodes ?? []) as Array<{ node_id: string; outcome: string }>).map((node) => [
      node.node_id,
      node.outcome,
    ]),
  );
}

function fixture(options: { bound?: boolean; reusePolicy?: string } = {}): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-cycle1-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/\nfixture/out/**\n');
  for (const name of [
    'affected-test-graph.schema.json',
    'common-defs.schema.json',
    'current-claims.schema.json',
    'review-obligations.schema.json',
    'review-result.schema.json',
    'review-scope-manifest.schema.json',
    'round-close-manifest.schema.json',
    'round-close-profile.schema.json',
    'task-freshness.schema.json',
  ]) {
    copy(root, `law/schemas/${name}`);
  }

  const convergenceCommands = [
    'formatting',
    'preparation',
    'action-registry',
    'trace',
    'repository-references',
    'materializations',
    'diff-check',
    'ordinary',
    'stage1',
    'stage2',
    't4',
    't5',
    't6',
    'changesets',
    'coverage',
    'governance',
  ].map((id) => ({ id, argv: ['node', 'fixture/gate.mjs', id] }));
  const policy = {
    schemaVersion: '3.0.0',
    policy_id: 'cycle-1-fixture',
    policy_version: 'fixture-v3',
    profile_discovery: {
      path_template: 'work/rounds/{round}/close-control-profile.json',
      round_pattern: '^R-[0-9]{4}$',
    },
    schemas: {
      round_profile: 'law/schemas/round-close-profile.schema.json',
      affected_test_graph: 'law/schemas/affected-test-graph.schema.json',
      task_freshness: 'law/schemas/task-freshness.schema.json',
      semantic_obligations: 'law/schemas/review-obligations.schema.json',
      current_claims: 'law/schemas/current-claims.schema.json',
      candidate_manifest: 'law/schemas/round-close-manifest.schema.json',
      review_scope: 'law/schemas/review-scope-manifest.schema.json',
      review_result: 'law/schemas/review-result.schema.json',
    },
    freshness: {
      policy_version: 'fixture-freshness-v2',
      remote_environment_indicators: ['CI', 'GITHUB_ACTIONS'],
      environment_allowlist: [],
      toolchain: [],
      partial_coverage_merge: 'forbidden',
    },
    review_scope: {
      policy_version: 'fixture-review-v2',
      topic_sources: [
        'semantic-obligation',
        'changed-path',
        'active-control',
        'current-claim',
        'previous-finding-class',
        'candidate-identity',
        'convergence-evidence',
      ],
    },
    convergence: { passes: 2, second_pass: 'no-write-clean', commands: convergenceCommands },
  };
  putJson(root, 'law/policy/round-close-controls.json', policy);
  putJson(root, '.devai/config/round-close-controls.json', policy);

  const profile = {
    schemaVersion: '1.0.0',
    round: ROUND,
    policy_version: 'fixture-v3',
    decision_id: 'DII-900',
    phase: 'pre-entry-preparation',
    sources: {
      authorization: `work/rounds/${ROUND}/AUTHORIZATION.md`,
      plan: `work/rounds/${ROUND}/plan.md`,
      orchestrator: `work/rounds/${ROUND}/prompts/00-orchestrator.md`,
      affected_test_graph: `work/rounds/${ROUND}/affected-test-graph.json`,
      obligations: `work/rounds/${ROUND}/review-obligations.json`,
      current_claims: `work/rounds/${ROUND}/current-claims.json`,
      additional_controls: ['product/owner-mandates/OM-900.md'],
      prior_findings: ['DF-PRIOR'],
    },
    runtime: {
      state_root: `.devai/state/round-runs/${ROUND}/close`,
      candidate_manifest: `.devai/state/round-runs/${ROUND}/close/candidate-manifest.json`,
      review_scope: `.devai/state/round-runs/${ROUND}/close/review-scope-manifest.json`,
      review_result: `.devai/state/round-runs/${ROUND}/close/review-result.json`,
    },
    reviewer: {
      binding: 'owner-mandate-required',
      mandate_id: options.bound ? 'OM-900' : null,
      model_selector: options.bound ? 'reviewer-exact-v1' : null,
      role: 'independent-read-only',
      fallback: 'forbidden',
    },
    review_budget: {
      substantive_cycles: 2,
      transport_retries_per_cycle: 1,
      cycle_three: 'forbidden',
      cycle_two_failure: 'ESCALATION_REQUIRED',
    },
    remote_ci: { local_cache_trusted: false, gate_population: 'complete-authoritative' },
    deployment: 'forbidden',
  };
  putJson(root, `work/rounds/${ROUND}/close-control-profile.json`, profile);
  put(root, `work/rounds/${ROUND}/AUTHORIZATION.md`, '# authorization\n');
  put(root, `work/rounds/${ROUND}/plan.md`, '# plan\n');
  put(root, `work/rounds/${ROUND}/prompts/00-orchestrator.md`, '# orchestrator\n');

  const node = (
    id: string,
    selectors: string[],
    depends_on: string[] = [],
    kind = 'test-shard',
    coverage_mode = 'none',
  ) => ({
    id,
    kind,
    input_selectors: [...selectors, 'fixture/gate.mjs'],
    depends_on,
    command: ['node', 'fixture/gate.mjs', id],
    cwd: '.',
    outputs: [],
    coverage_mode,
  });
  putJson(root, `work/rounds/${ROUND}/affected-test-graph.json`, {
    schemaVersion: '1.0.0',
    graph_version: 'fixture-graph-v1',
    round: ROUND,
    population: {
      production: ['packages/*/src/**/*.ts'],
      tests: ['tests/**/*.test.ts'],
      classification: 'complete-or-full-suite-fallback',
    },
    shared_inputs: [
      {
        id: 'workspace-policy',
        selectors: ['package.json'],
        invalidates: ['full-suite', 'full-coverage'],
      },
    ],
    nodes: [
      node('unit-a', ['packages/a/src/**/*.ts', 'tests/a.test.ts']),
      node('unit-b', ['packages/b/src/**/*.ts', 'tests/b.test.ts'], ['unit-a']),
      node('full-suite', ['packages/**/*.ts', 'tests/**/*.ts'], [], 'fallback'),
      node(
        'full-coverage',
        ['packages/**/*.ts', 'tests/**/*.ts'],
        ['full-suite'],
        'fallback',
        'whole-only',
      ),
    ],
    fallbacks: {
      unknown_dependency: 'full-suite',
      dynamic_import: 'full-suite',
      incomplete_population: 'full-suite',
    },
    coverage: { node: 'full-coverage', mode: 'whole-only', partial_merge: 'forbidden' },
  });
  putJson(root, `work/rounds/${ROUND}/review-obligations.json`, {
    schemaVersion: '1.0.0',
    registry_version: 'fixture-obligations-v1',
    round: ROUND,
    obligations: [
      {
        obligation_id: 'R9000-P0-IDENTITY',
        claim: 'Exact candidate identity is independently verified.',
        risk: 'P0',
        source_refs: [`work/rounds/${ROUND}/plan.md`],
        governing_paths: ['packages/**'],
        required_evidence: ['candidate manifest'],
        required_adversaries: ['wrong candidate'],
        reuse_policy: options.reusePolicy ?? 'always-recheck',
        finding_classes: ['DF-PRIOR'],
      },
    ],
  });
  putJson(root, `work/rounds/${ROUND}/current-claims.json`, {
    schemaVersion: '1.0.0',
    ledger_version: 'fixture-claims-v1',
    round: ROUND,
    mode: 'registry',
    candidate: null,
    claims: [
      {
        claim_id: 'suite.population',
        volatility: 'tree',
        producer: ['node', 'fixture/claim.mjs'],
        extractor: '$.count',
        source_paths: ['tests/**/*.test.ts'],
        rendered_locations: [`work/audit/${ROUND}/as-built.md`],
        source_digest: null,
        value_digest: null,
      },
    ],
  });
  put(
    root,
    'fixture/gate.mjs',
    "import { appendFileSync, mkdirSync } from 'node:fs';\nmkdirSync('.devai/state', { recursive: true });\nappendFileSync('.devai/state/gates.log', `${process.argv[2]}\\n`);\n",
  );
  put(root, 'fixture/claim.mjs', 'process.stdout.write(JSON.stringify({count: 1}));\n');
  put(root, 'package.json', '{"name":"fixture","private":true}\n');
  put(root, 'packages/a/src/index.ts', 'export const a = 1;\n');
  put(root, 'packages/b/src/index.ts', 'export const b = 1;\n');
  put(root, 'tests/a.test.ts', 'export const testA = true;\n');
  put(root, 'tests/b.test.ts', 'export const testB = true;\n');
  if (options.bound) {
    put(
      root,
      'product/owner-mandates/OM-900.md',
      'status: active\nauthority: Owner\nround: R-9000\nmodel_selector: reviewer-exact-v1\nfallback: forbidden\n',
    );
  }
  return { root, base: commit(root, 'fixture base') };
}

function freezeCandidate(fixtureValue: Fixture, candidate: string): void {
  const body = {
    schemaVersion: '1.0.0',
    round: ROUND,
    base_sha: fixtureValue.base,
    candidate_sha: candidate,
    tree_sha: git(fixtureValue.root, ['rev-parse', `${candidate}^{tree}`]),
  };
  putJson(fixtureValue.root, `.devai/state/round-runs/${ROUND}/close/candidate-manifest.json`, {
    ...body,
    manifest_digest_sha256: digest(canonical(body)),
  });
}

function scope(fixtureValue: Fixture, cycle: 1 | 2, candidate = 'HEAD'): Result {
  return run(fixtureValue, 'review-scope', [
    '--base',
    fixtureValue.base,
    '--candidate',
    candidate,
    '--cycle',
    String(cycle),
  ]);
}

function passingReview(manifest: Record<string, unknown>): Record<string, unknown> {
  const topics = manifest.topics as Array<{ topic_id: string; current_digest: string }>;
  return {
    schemaVersion: '1.0.0',
    round: ROUND,
    cycle: manifest.cycle,
    review_candidate: manifest.review_candidate,
    manifest_digest: manifest.manifest_digest_sha256,
    policy_digest: manifest.policy_digest,
    dispositions: topics.map((topic) => ({
      topic_id: topic.topic_id,
      disposition: 'RECHECKED_PASS',
      recomputed_digest: topic.current_digest,
      evidence_refs: ['independent fixture evidence'],
      justification: 'Independently recomputed against the exact candidate.',
      finding_ids: [],
    })),
    findings: [],
    terminal: {
      verdict: 'PASS',
      topic_count: topics.length,
      disposition_counts: {
        RECHECKED_PASS: topics.length,
        RECHECKED_FAIL: 0,
        REUSED_FRESH_PASS: 0,
        BLOCKED: 0,
      },
      finding_count: 0,
      complete: true,
    },
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('pre-R-0007 independent review cycle-1 defect classes', () => {
  it('F-001 resolves exactly one active Owner binding using exact fields, not substrings', () => {
    expect(REPAIR_IMPLEMENTATION_PATHS).toContain('scripts/run-round-close-controls.mjs');
    const current = fixture({ bound: true });
    put(
      current.root,
      'product/owner-mandates/OM-901.md',
      'status: active\nauthority: Owner\nround: R-9000\nmodel_selector: competing-v1\nfallback: forbidden\n',
    );
    put(
      current.root,
      'product/owner-mandates/OM-900.md',
      'status: active\nauthority: Owner\nnote: R-9000 reviewer-exact-v1 are substrings only\nfallback: alternate-model\n',
    );
    const result = run(current, 'entry-check');
    expect(result.status).toBe(1);
    expect(findingCodes(result)).toEqual(
      expect.arrayContaining([
        'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
        'ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT',
        'REVIEWER_FALLBACK_FORBIDDEN',
      ]),
    );
  });

  it('F-002 represents and executes all 16 policy gates across clean equivalent passes', () => {
    const current = fixture();
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    const result = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(result.status).toBe(0);
    const passes = result.value.passes as Array<{ results: Array<{ node_id: string }> }>;
    expect(passes).toHaveLength(2);
    const expected = [
      'formatting',
      'preparation',
      'action-registry',
      'trace',
      'repository-references',
      'materializations',
      'diff-check',
      'ordinary',
      'stage1',
      'stage2',
      't4',
      't5',
      't6',
      'changesets',
      'coverage',
      'governance',
    ];
    expect(passes.map((pass) => pass.results.map(({ node_id }) => node_id))).toEqual([
      expected,
      expected,
    ]);
    expect(
      readFileSync(join(current.root, '.devai/state/gates.log'), 'utf8').trim().split('\n'),
    ).toEqual(expected);
    expect(git(current.root, ['status', '--porcelain', '--untracked-files=all'])).toBe('');
    expect(result.value).toMatchObject({
      exact_head_before: candidate,
      exact_head_after: candidate,
      second_pass_no_write: true,
      pass_boundaries_equivalent: true,
    });
  });

  it('F-003 includes the complete WORKTREE population and widens every ambiguous class', () => {
    const cases = [
      [
        'staged',
        (root: string) => {
          put(root, 'packages/a/src/index.ts', 'export const a = 2;\n');
          git(root, ['add', 'packages/a/src/index.ts']);
        },
      ],
      ['unstaged', (root: string) => put(root, 'packages/a/src/index.ts', 'export const a = 3;\n')],
      [
        'untracked',
        (root: string) => put(root, 'packages/c/src/index.ts', 'export const c = 1;\n'),
      ],
      ['deleted', (root: string) => rmSync(join(root, 'packages/a/src/index.ts'))],
      [
        'renamed',
        (root: string) => {
          git(root, ['mv', 'packages/a/src/index.ts', 'packages/a/src/renamed.ts']);
        },
      ],
      [
        'dynamic',
        (root: string) =>
          put(root, 'packages/a/src/dynamic.ts', 'export const x = import(variable);\n'),
      ],
      [
        'incomplete',
        (root: string) => put(root, 'packages/c/src/incomplete.ts', 'export const c = 1;\n'),
      ],
    ] as const;
    for (const [name, change] of cases) {
      const current = fixture();
      change(current.root);
      const result = run(current, 'impact-plan', ['--base', current.base, '--head', 'WORKTREE']);
      expect(result.status, `${name}: ${result.stderr}`).toBe(0);
      const outcomes = nodeOutcomes(result);
      expect(outcomes.get('full-suite'), name).toBe('EXECUTE');
      expect(outcomes.get('full-coverage'), name).toBe('EXECUTE');
    }
  });

  it('F-004 rejects cache records without exact task and fresh dependency-result identity', () => {
    const current = fixture();
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'change shared source');
    const cold = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(cold.status).toBe(0);
    const freshness = join(current.root, `.devai/state/round-runs/${ROUND}/close/freshness/tasks`);
    const [unitARecord] = readdirSync(join(freshness, 'unit-a'));
    expect(unitARecord).toBeDefined();
    if (unitARecord === undefined) throw new Error('unit-a freshness record missing');
    const unitAPath = join(freshness, 'unit-a', unitARecord);
    const value = JSON.parse(readFileSync(unitAPath, 'utf8')) as Record<string, unknown>;
    const body: Record<string, unknown> = {
      ...value,
      task_id: 'unit-b',
      task_key: 'f'.repeat(64),
    };
    delete body.result_digest;
    putJson(current.root, unitAPath.slice(current.root.length + 1), {
      ...body,
      result_digest: digest(canonical(body)),
    });
    const warm = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(warm.status).toBe(0);
    expect(nodeOutcomes(warm).get('unit-a')).toBe('EXECUTE');
    expect(findingCodes(warm)).toContain('CACHE_RECORD_IDENTITY_INVALID');
  });

  it('F-004 invalidates a dependent PASS when its dependency PASS is no longer fresh', () => {
    const current = fixture();
    put(current.root, 'tests/b.test.ts', 'export const testB = "changed";\n');
    const candidate = commit(current.root, 'change dependent test');
    const cold = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(cold.status).toBe(0);
    const freshness = join(current.root, `.devai/state/round-runs/${ROUND}/close/freshness/tasks`);
    const [unitARecord] = readdirSync(join(freshness, 'unit-a'));
    expect(unitARecord).toBeDefined();
    if (unitARecord === undefined) throw new Error('unit-a freshness record missing');
    const unitAPath = join(freshness, 'unit-a', unitARecord);
    const value = JSON.parse(readFileSync(unitAPath, 'utf8')) as Record<string, unknown>;
    const body: Record<string, unknown> = { ...value, result: 'EXECUTED_FAIL', exit_code: 1 };
    delete body.result_digest;
    putJson(current.root, unitAPath.slice(current.root.length + 1), {
      ...body,
      result_digest: digest(canonical(body)),
    });
    const warm = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(warm.status).toBe(0);
    expect(nodeOutcomes(warm).get('unit-a')).toBe('EXECUTE');
    expect(nodeOutcomes(warm).get('unit-b')).toBe('EXECUTE');
  });

  it('F-005 requires an exact candidate manifest and emits all seven generic topic classes', () => {
    const current = fixture();
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'candidate change');
    const missing = scope(current, 1, candidate);
    expect(missing.status).toBe(1);
    expect(findingCodes(missing)).toContain('CANDIDATE_MANIFEST_REQUIRED');

    freezeCandidate(current, candidate);
    const result = scope(current, 1, candidate);
    expect(result.status).toBe(0);
    const manifest = result.value.manifest as Record<string, unknown>;
    const topics = manifest.topics as Array<{ topic_kind: string; obligation_id?: string }>;
    expect(new Set(topics.map(({ topic_kind }) => topic_kind))).toEqual(
      new Set([
        'semantic-obligation',
        'changed-path',
        'active-control',
        'current-claim',
        'previous-finding-class',
        'candidate-identity',
        'convergence-evidence',
      ]),
    );
    expect(JSON.stringify(topics)).not.toContain('R7-P0-CANDIDATE-IDENTITY');
  });

  it('F-006 enforces each semantic obligation reuse policy', () => {
    const current = fixture({ reusePolicy: 'always-recheck' });
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    freezeCandidate(current, candidate);
    const scoped = scope(current, 1, candidate);
    expect(scoped.status).toBe(0);
    const manifest = scoped.value.manifest as Record<string, unknown>;
    const topic = (manifest.topics as Array<Record<string, unknown>>).find(
      ({ obligation_id }) => obligation_id === 'R9000-P0-IDENTITY',
    );
    expect(topic?.allowed_dispositions).not.toContain('REUSED_FRESH_PASS');
  });

  it('F-006 rejects non-canonical JSONL and orphan or mismatched finding links', () => {
    const current = fixture({ reusePolicy: 'always-recheck' });
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    freezeCandidate(current, candidate);
    const scoped = scope(current, 1, candidate);
    expect(scoped.status).toBe(0);
    const manifest = scoped.value.manifest as Record<string, unknown>;
    const review = passingReview(manifest);
    const [disposition] = review.dispositions as Array<Record<string, unknown>>;
    expect(disposition).toBeDefined();
    if (disposition === undefined) throw new Error('review disposition missing');
    disposition.finding_ids = ['F-ORPHAN'];
    const header = { ...review, type: 'header' } as Record<string, unknown>;
    delete header.dispositions;
    delete header.findings;
    delete header.terminal;
    const terminal = { type: 'terminal', ...(review.terminal as Record<string, unknown>) };
    const lines = [
      JSON.stringify(header),
      JSON.stringify({ type: 'disposition', ...disposition }),
      JSON.stringify(terminal),
      JSON.stringify(header),
    ];
    put(current.root, 'review.jsonl', `${lines.join('\n')}\n`);
    const checked = run(current, 'review-check', [
      '--candidate',
      candidate,
      '--cycle',
      '1',
      '--review-result',
      'review.jsonl',
    ]);
    expect(checked.status).toBe(1);
    expect(findingCodes(checked)).toEqual(
      expect.arrayContaining(['REVIEW_JSONL_NON_CANONICAL', 'REVIEW_FINDING_LINK_INVALID']),
    );
  });

  it('F-007 refuses unordered cycle 2 for an unfrozen replacement candidate', () => {
    const current = fixture();
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    freezeCandidate(current, candidate);
    const scoped = scope(current, 2, candidate);
    expect(scoped.status).toBe(0);
    putJson(
      current.root,
      'review.json',
      passingReview(scoped.value.manifest as Record<string, unknown>),
    );
    const unordered = run(current, 'review-check', [
      '--candidate',
      candidate,
      '--cycle',
      '2',
      '--review-result',
      'review.json',
    ]);
    expect(unordered.status).toBe(1);
    expect(findingCodes(unordered)).toContain('REVIEW_STATE_TRANSITION_INVALID');
  });

  it('F-007 binds every malformed transport allowance to candidate, manifest, and cycle', () => {
    const current = fixture();
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    freezeCandidate(current, candidate);
    const scoped = scope(current, 1, candidate);
    expect(scoped.status).toBe(0);
    put(current.root, 'malformed.jsonl', '{not-json}\n');
    const malformed = run(current, 'review-check', [
      '--candidate',
      candidate,
      '--cycle',
      '1',
      '--review-result',
      'malformed.jsonl',
    ]);
    expect(malformed.status).toBe(1);
    const transport = JSON.parse(
      readFileSync(
        join(current.root, `.devai/state/round-runs/${ROUND}/close/review-transport-1.json`),
        'utf8',
      ),
    ) as Record<string, unknown>;
    expect(transport).toMatchObject({ candidate, cycle: 1 });
    expect(transport.manifest_digest).toBe(
      (scoped.value.manifest as Record<string, unknown>).manifest_digest_sha256,
    );
  });

  it('F-008 deterministically recomputes claim source and extracted value digests', () => {
    const current = fixture();
    const candidate = git(current.root, ['rev-parse', 'HEAD']);
    const ledgerPath = `work/rounds/${ROUND}/current-claims.json`;
    const ledger = JSON.parse(readFileSync(join(current.root, ledgerPath), 'utf8')) as Record<
      string,
      unknown
    >;
    ledger.mode = 'materialized';
    ledger.candidate = candidate;
    const [claim] = ledger.claims as Array<Record<string, unknown>>;
    expect(claim).toBeDefined();
    if (claim === undefined) throw new Error('claim fixture missing');
    claim.source_digest = 'a'.repeat(64);
    claim.value_digest = 'b'.repeat(64);
    putJson(current.root, ledgerPath, ledger);
    const result = run(current, 'claims-check', ['--candidate', candidate]);
    expect(result.status).toBe(1);
    expect(findingCodes(result)).toEqual(
      expect.arrayContaining(['CLAIM_SOURCE_DIGEST_INVALID', 'CLAIM_VALUE_DIGEST_INVALID']),
    );
  });
});
