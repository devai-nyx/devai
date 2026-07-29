// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
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
  args: readonly string[],
  env: NodeJS.ProcessEnv = {},
): Record<string, unknown> {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', fixture.root, '--round', 'R-9000', ...args, '--json'],
    { cwd: fixture.root, encoding: 'utf8', env: { ...process.env, ...env } },
  );
  const value = JSON.parse(result.stdout) as Record<string, unknown>;
  expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(value.ok ? 0 : 1);
  return value;
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-impact-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/\n');
  for (const name of [
    'affected-test-graph.schema.json',
    'common-defs.schema.json',
    'current-claims.schema.json',
    'review-obligations.schema.json',
    'review-result.schema.json',
    'review-scope-manifest.schema.json',
    'round-close-profile.schema.json',
    'task-freshness.schema.json',
  ]) {
    copy(root, `law/schemas/${name}`);
  }
  put(
    root,
    'law/policy/round-close-controls.json',
    `${JSON.stringify(
      {
        schemaVersion: '3.0.0',
        policy_id: 'fixture',
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
          review_scope: 'law/schemas/review-scope-manifest.schema.json',
          review_result: 'law/schemas/review-result.schema.json',
        },
        freshness: {
          policy_version: 'fixture-freshness-v2',
          remote_environment_indicators: ['CI', 'GITHUB_ACTIONS'],
          environment_allowlist: [],
          toolchain: [],
        },
        review_scope: { policy_version: 'fixture-review-v2' },
      },
      null,
      2,
    )}\n`,
  );
  put(
    root,
    'work/rounds/R-9000/close-control-profile.json',
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        round: 'R-9000',
        policy_version: 'fixture-v3',
        decision_id: 'DII-900',
        phase: 'pre-entry-preparation',
        sources: {
          authorization: 'work/rounds/R-9000/AUTHORIZATION.md',
          plan: 'work/rounds/R-9000/plan.md',
          orchestrator: 'work/rounds/R-9000/prompts/00-orchestrator.md',
          affected_test_graph: 'work/rounds/R-9000/affected-test-graph.json',
          obligations: 'work/rounds/R-9000/review-obligations.json',
          current_claims: 'work/rounds/R-9000/current-claims.json',
        },
        runtime: {
          state_root: '.devai/state/round-runs/R-9000/close',
          candidate_manifest: '.devai/state/round-runs/R-9000/close/candidate-manifest.json',
          review_scope: '.devai/state/round-runs/R-9000/close/review-scope-manifest.json',
          review_result: '.devai/state/round-runs/R-9000/close/review-result.json',
        },
        reviewer: {
          binding: 'owner-mandate-required',
          mandate_id: null,
          model_selector: null,
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
      },
      null,
      2,
    )}\n`,
  );
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
    outputs: id === 'unit-a' ? ['.devai/state/output-a.txt'] : [],
    coverage_mode,
  });
  put(
    root,
    'work/rounds/R-9000/affected-test-graph.json',
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        graph_version: 'fixture-v1',
        round: 'R-9000',
        population: {
          production: ['packages/*/src/**/*.ts'],
          tests: ['tests/**/*.test.ts'],
          classification: 'complete-or-full-suite-fallback',
        },
        shared_inputs: [
          {
            id: 'workspace',
            selectors: ['package.json'],
            invalidates: ['full-suite', 'full-coverage'],
          },
        ],
        nodes: [
          node('unit-a', ['packages/a/src/**/*.ts', 'tests/a.test.ts']),
          node(
            'unit-b',
            ['packages/b/src/**/*.ts', 'packages/a/src/**/*.ts', 'tests/b.test.ts'],
            ['unit-a'],
          ),
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
      },
      null,
      2,
    )}\n`,
  );
  put(
    root,
    'work/rounds/R-9000/review-obligations.json',
    '{"schemaVersion":"1.0.0","registry_version":"fixture","round":"R-9000","obligations":[{"obligation_id":"R9000-P0-IDENTITY","claim":"Exact identity","risk":"P0","source_refs":["plan"],"governing_paths":["packages/**"],"required_evidence":["manifest"],"required_adversaries":["wrong-sha"],"reuse_policy":"always-recheck","finding_classes":[]}]}\n',
  );
  put(
    root,
    'work/rounds/R-9000/current-claims.json',
    '{"schemaVersion":"1.0.0","ledger_version":"fixture","round":"R-9000","mode":"registry","candidate":null,"claims":[{"claim_id":"suite.population","volatility":"tree","producer":["node","fixture/gate.mjs"],"extractor":"$","source_paths":["tests/**"],"rendered_locations":[],"source_digest":null,"value_digest":null}]}\n',
  );
  put(
    root,
    'fixture/gate.mjs',
    "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('.devai/state', { recursive: true });\nappendFileSync('.devai/state/gate.log', `${process.argv[2]}\\n`);\nif (process.argv[2] === 'unit-a') writeFileSync('.devai/state/output-a.txt', 'stable-output\\n');\n",
  );
  put(root, 'package.json', '{"name":"fixture","private":true}\n');
  put(root, 'packages/a/src/index.ts', 'export const a = 1;\n');
  put(root, 'packages/b/src/index.ts', 'export const b = 1;\n');
  put(root, 'tests/a.test.ts', 'export const testA = true;\n');
  put(root, 'tests/b.test.ts', 'export const testB = true;\n');
  const base = commit(root, 'fixture base');
  return { root, base };
}

function executed(value: Record<string, unknown>): string[] {
  return nodes(value)
    .filter(({ outcome }: { outcome: string }) => outcome === 'EXECUTE')
    .map(({ node_id }: { node_id: string }) => node_id)
    .sort();
}

function nodes(
  value: Record<string, unknown>,
): Array<{ node_id: string; outcome: string; reason_codes: string[] }> {
  return value.nodes as Array<{ node_id: string; outcome: string; reason_codes: string[] }>;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('pre-R-0007 affected-test DAG adversaries', () => {
  it('runs a changed test without unrelated test shards', () => {
    const current = fixture();
    put(current.root, 'tests/a.test.ts', 'export const testA = "changed";\n');
    const candidate = commit(current.root, 'change test a');
    const value = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['unit-a']);
  });

  it('runs every declared transitive dependent after a source change', () => {
    const current = fixture();
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'change source a');
    const value = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['unit-a', 'unit-b']);
  });

  it('widens an unclassified governed source to the full-suite fallback', () => {
    const current = fixture();
    put(current.root, 'packages/c/src/index.ts', 'export const c = 1;\n');
    const candidate = commit(current.root, 'add unknown source');
    const value = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['full-suite']);
    expect(nodes(value).find(({ node_id }) => node_id === 'full-suite')).toEqual(
      expect.objectContaining({
        reason_codes: expect.arrayContaining(['UNKNOWN_DEPENDENCY']),
        fallback_population: 'full-suite',
      }),
    );
  });

  it('invalidates the full suite and whole coverage for a shared input', () => {
    const current = fixture();
    put(current.root, 'package.json', '{"name":"fixture","private":true,"version":"1.0.0"}\n');
    const candidate = commit(current.root, 'change workspace manifest');
    const value = run(current, 'impact-plan', ['--base', current.base, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['full-coverage', 'full-suite']);
  });

  it('forces every graph node and distrusts cache in remote mode', () => {
    const current = fixture();
    const value = run(current, 'impact-plan', ['--base', current.base, '--head', current.base], {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    });
    expect(value.ok).toBe(true);
    expect(value).toMatchObject({ remote: true, cache_trusted: false });
    expect(executed(value)).toEqual(['full-coverage', 'full-suite', 'unit-a', 'unit-b']);
    expect(nodes(value).every(({ reason_codes }) => reason_codes.includes('REMOTE_FULL'))).toBe(
      true,
    );
  });

  it('executes affected nodes once, then reuses byte-identical PASS results', () => {
    const current = fixture();
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'change source a');
    const first = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(first).toMatchObject({ ok: true, executed_test_nodes: 2 });
    expect(readFileSync(join(current.root, '.devai/state/output-a.txt'), 'utf8')).toBe(
      'stable-output\n',
    );
    const firstExecutions = readFileSync(join(current.root, '.devai/state/gate.log'), 'utf8')
      .trim()
      .split('\n');
    expect(firstExecutions).toEqual(['unit-a', 'unit-b']);

    const second = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(second).toMatchObject({ ok: true, executed_test_nodes: 0 });
    expect(
      readFileSync(join(current.root, '.devai/state/gate.log'), 'utf8').trim().split('\n'),
    ).toEqual(firstExecutions);
  });
});
