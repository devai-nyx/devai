// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
  readonly impactBase: string;
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

function sourceJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8')) as Record<string, unknown>;
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function v5GraphControls(gateIds: readonly string[]): Record<string, unknown> {
  return {
    change_detection: {
      committed_command: 'git diff --name-status -z -M --find-renames <exact-base> <candidate>',
      record_format: 'status-aware-nul',
      rename_paths: 'retain-preimage-and-postimage',
      selector_population: 'union-of-preimage-and-postimage',
      review_topics: 'exactly-once-per-path-linked-by-change-record',
    },
    gate_freshness_profiles: gateIds.map((gate_id) => ({
      gate_id,
      input_selectors: ['**/*'],
      dependency_selectors: ['**/*'],
      toolchain_probe_ids: ['node'],
      environment_input_ids: ['__ALL_ENVIRONMENT__'],
      output_contract: 'none',
      required_outputs: [],
      universal_input_proof: 'tracked-candidate-tree',
      output_observation: 'declared-plus-observed',
    })),
    command_closure: gateIds.map((gate_id) => ({
      gate_id,
      scripts: [`fixture:${gate_id}`],
      programs: ['node'],
    })),
  };
}

function reviewerBindingMarker(): Record<string, unknown> {
  return {
    schemaVersion: '2.0.0',
    devai_reviewer_binding: true,
    mandate_id: 'OM-900',
    mandate_status: 'active',
    round: 'R-9000',
    model_selector: 'reviewer-exact-v1',
    role: 'independent-read-only',
    semantic_census: 'complete',
    substantive_cycles: 2,
    transport_retries: 1,
    fallback: 'forbidden',
  };
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
  put(root, '.gitignore', '.devai/state/\nfixture/output-a.txt\n');
  const policy = sourceJson('law/policy/round-close-controls.json');
  policy.policy_id = 'impact-fixture';
  policy.decision_id = 'DII-900';
  const convergencePolicy = policy.convergence as Record<string, unknown>;
  convergencePolicy.commands = (convergencePolicy.commands as Array<{ id: string }>).map(
    (command) => ({
      id: command.id,
      argv: ['node', 'fixture/gate.mjs', command.id],
      freshness_profile: command.id,
    }),
  );
  const freshnessPolicy = policy.freshness as Record<string, unknown>;
  freshnessPolicy.environment_allowlist = [{ name: 'CI', mode: 'value-sha256' }];
  freshnessPolicy.toolchain = [{ id: 'node', argv: ['node', '--version'] }];
  for (const relativePath of new Set<string>([
    'law/schemas/common-defs.schema.json',
    ...Object.values(policy.schemas as Record<string, string>),
  ]))
    copy(root, relativePath);
  put(root, 'law/policy/round-close-controls.json', `${JSON.stringify(policy, null, 2)}\n`);
  put(root, '.devai/config/round-close-controls.json', `${JSON.stringify(policy, null, 2)}\n`);
  const profile = sourceJson('work/rounds/R-0007/close-control-profile.json');
  Object.assign(profile, {
    round: 'R-9000',
    decision_id: 'DII-900',
    declaration: {
      binding: 'b0-decision-required',
      decision_id: null,
      exact_base: null,
    },
    sources: {
      authorization: 'work/rounds/R-9000/AUTHORIZATION.md',
      plan: 'work/rounds/R-9000/plan.md',
      orchestrator: 'work/rounds/R-9000/prompts/00-orchestrator.md',
      affected_test_graph: 'work/rounds/R-9000/affected-test-graph.json',
      obligations: 'work/rounds/R-9000/review-obligations.json',
      current_claims: 'work/rounds/R-9000/current-claims.json',
      control_provenance: 'work/rounds/R-9000/control-provenance.json',
      additional_controls: ['product/owner-mandates/OM-900.md'],
      prior_finding_registry: 'work/rounds/R-9000/prior-finding-registry.json',
    },
    runtime: {
      state_root: '.devai/state/round-runs/R-9000/close',
      candidate_manifest: '.devai/state/round-runs/R-9000/close/candidate-manifest.json',
      convergence_evidence: '.devai/state/round-runs/R-9000/close/convergence-evidence.json',
      impact_execution: '.devai/state/round-runs/R-9000/close/affected-test-execution.json',
      review_scope: '.devai/state/round-runs/R-9000/close/review-scope-manifest.json',
      review_result: '.devai/state/round-runs/R-9000/close/review-result.json',
      materialized_claims: '.devai/state/round-runs/R-9000/close/current-claims.json',
      post_publication_claims:
        '.devai/state/round-runs/R-9000/close/current-claims-post-publication.json',
      pre_review_claim_inputs: '.devai/state/round-runs/R-9000/close/claim-inputs-pre-review.json',
      post_publication_claim_inputs:
        '.devai/state/round-runs/R-9000/close/claim-inputs-post-publication.json',
      review_state: '.devai/state/round-runs/R-9000/close/review-state.json',
      review_transport: '.devai/state/round-runs/R-9000/close/review-transport.json',
      review_transport_root: '.devai/state/round-runs/R-9000/close/review-transports',
      review_repair_evidence: '.devai/state/round-runs/R-9000/close/review-repair-evidence.json',
      active_control_census: '.devai/state/round-runs/R-9000/close/active-control-census.json',
    },
    reviewer: {
      binding: 'owner-mandate-required',
      mandate_id: 'OM-900',
      model_selector: 'reviewer-exact-v1',
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
  });
  put(
    root,
    'work/rounds/R-9000/close-control-profile.json',
    `${JSON.stringify(profile, null, 2)}\n`,
  );
  put(root, 'work/rounds/R-9000/AUTHORIZATION.md', '# authorization\n');
  put(root, 'work/rounds/R-9000/plan.md', '# plan\n');
  put(root, 'work/rounds/R-9000/prompts/00-orchestrator.md', '# orchestrator\n');
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
    outputs: id === 'unit-a' ? ['fixture/output-a.txt'] : [],
    coverage_mode,
  });
  put(
    root,
    'work/rounds/R-9000/affected-test-graph.json',
    `${JSON.stringify(
      {
        schemaVersion: '2.0.0',
        graph_version: 'fixture-v1',
        round: 'R-9000',
        population: {
          all_tracked: ['**/*'],
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
        ...v5GraphControls(
          (convergencePolicy.commands as Array<{ id: string }>).map(({ id }) => id),
        ),
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
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      registry_version: 'fixture',
      round: 'R-9000',
      normative_sources: [
        {
          path: 'work/rounds/R-9000/plan.md',
          source_digest_sha256: digest(readFileSync(join(root, 'work/rounds/R-9000/plan.md'))),
          obligation_ids: ['R9000-P0-IDENTITY'],
        },
      ],
      obligations: [
        {
          obligation_id: 'R9000-P0-IDENTITY',
          claim: 'Exact identity',
          risk: 'P0',
          source_refs: ['work/rounds/R-9000/plan.md'],
          governing_paths: ['packages/**'],
          required_evidence: ['candidate manifest'],
          required_adversaries: ['wrong-sha'],
          reuse_policy: 'always-recheck',
          finding_classes: [],
        },
      ],
    })}\n`,
  );
  put(
    root,
    'work/rounds/R-9000/current-claims.json',
    '{"schemaVersion":"2.0.0","ledger_version":"fixture","round":"R-9000","mode":"registry","candidate":null,"claims":[{"claim_id":"suite.population","volatility":"tree","availability":"pre-review","producer":["node","fixture/gate.mjs"],"extractor":"$","source_paths":["tests/**"],"rendered_locations":[],"source_digest":null,"value_digest":null}],"claims_digest_sha256":null,"pre_review_claims_digest":null}\n',
  );
  put(
    root,
    'work/rounds/R-9000/prior-finding-registry.json',
    '{"schemaVersion":"1.0.0","round":"R-9000","registry_version":"fixture","finding_classes":[{"finding_id":"F001","defect_class_id":"IMPACT_PRECISION","severity":"P1","origin_cycle":1,"origin_evidence":"work/audit/R-9000/prior-review.md","topic_ids":["impact-planning"],"population_query":"Exercise every affected-test edge.","affected_population":["fixture graph"],"repair_condition":"Every declared edge is planned exactly.","disposition":"REPAIRED_PENDING_REVIEW"}]}\n',
  );
  put(
    root,
    'fixture/gate.mjs',
    "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('.devai/state', { recursive: true });\nappendFileSync('.devai/state/gate.log', `${process.argv[2]}\\n`);\nif (process.argv[2] === 'unit-a') writeFileSync('fixture/output-a.txt', 'stable-output\\n');\n",
  );
  put(root, 'package.json', '{"name":"fixture","private":true}\n');
  put(root, 'packages/a/src/index.ts', 'export const a = 1;\n');
  put(root, 'packages/b/src/index.ts', 'export const b = 1;\n');
  put(root, 'tests/a.test.ts', 'export const testA = true;\n');
  put(root, 'tests/b.test.ts', 'export const testB = true;\n');
  put(root, 'work/audit/R-9000/prior-review.md', '# prior review\n');
  put(
    root,
    'product/owner-mandates/OM-900.md',
    `---\nid: OM-900\nstatus: active\nauthority: Owner\n---\n\n\`\`\`json\n${JSON.stringify(reviewerBindingMarker(), null, 2)}\n\`\`\`\n`,
  );
  put(
    root,
    'work/rounds/R-9000/control-provenance.json',
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        round: 'R-9000',
        root_decision: 'DII-900',
        decision_register: 'law/register/DECISIONS.md',
        decisions: [{ decision_id: 'DII-900', status: 'active', depends_on: [] }],
        owner_mandates: [
          {
            mandate_id: 'OM-900',
            path: 'product/owner-mandates/OM-900.md',
            required_status: 'active',
          },
        ],
        manifest_roots: [
          'work/rounds/R-9000/AUTHORIZATION.md',
          'work/rounds/R-9000/plan.md',
          'work/rounds/R-9000/prompts/00-orchestrator.md',
        ],
        normative_source_roots: ['work/rounds/R-9000/plan.md'],
        derived_sources: [
          'policy-schema-map',
          'round-profile-sources',
          'round-declaration-when-bound',
          'prior-finding-origin-evidence',
          'obligation-source-references',
        ],
      },
      null,
      2,
    )}\n`,
  );
  const base = commit(root, 'fixture opening base');
  profile.declaration = {
    binding: 'b0-decision-required',
    decision_id: 'DII-900',
    exact_base: base,
  };
  put(
    root,
    'work/rounds/R-9000/close-control-profile.json',
    `${JSON.stringify(profile, null, 2)}\n`,
  );
  put(
    root,
    'law/register/DECISIONS.md',
    `# Fixture decisions\n\n### DII-900 — Fixture round declaration\n\`type: decision · status: active · authority: Architect · provenance: fixture\`\n\n\`\`\`json\n${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        devai_round_declaration: true,
        round: 'R-9000',
        decision_id: 'DII-900',
        authority: 'Architect',
        exact_base: base,
        base_source: 'origin/main-at-b0',
      },
      null,
      2,
    )}\n\`\`\`\n`,
  );
  const impactBase = commit(root, 'fixture B0 declaration');
  return { root, base, impactBase };
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
    const value = run(current, 'impact-plan', ['--base', current.impactBase, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['unit-a']);
  });

  it('runs every declared transitive dependent after a source change', () => {
    const current = fixture();
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'change source a');
    const value = run(current, 'impact-plan', ['--base', current.impactBase, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['unit-a', 'unit-b']);
  });

  it('widens an unclassified governed source to the full-suite fallback', () => {
    const current = fixture();
    put(current.root, 'packages/c/src/index.ts', 'export const c = 1;\n');
    const candidate = commit(current.root, 'add unknown source');
    const value = run(current, 'impact-plan', ['--base', current.impactBase, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['full-coverage', 'full-suite']);
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
    const value = run(current, 'impact-plan', ['--base', current.impactBase, '--head', candidate]);
    expect(value.ok).toBe(true);
    expect(executed(value)).toEqual(['full-coverage', 'full-suite']);
  });

  it('forces every graph node and distrusts cache in remote mode', () => {
    const current = fixture();
    const value = run(
      current,
      'impact-plan',
      ['--base', current.impactBase, '--head', current.impactBase],
      {
        CI: 'true',
        GITHUB_ACTIONS: 'true',
      },
    );
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
    expect(first).toMatchObject({ ok: true, executed_test_nodes: 3 });
    expect(readFileSync(join(current.root, 'fixture/output-a.txt'), 'utf8')).toBe(
      'stable-output\n',
    );
    const firstExecutions = readFileSync(join(current.root, '.devai/state/gate.log'), 'utf8')
      .trim()
      .split('\n')
      .filter((id) => id.startsWith('unit-'));
    expect(firstExecutions).toEqual(['unit-a', 'unit-b']);

    const second = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(second).toMatchObject({ ok: true, executed_test_nodes: 0 });
    expect(
      readFileSync(join(current.root, '.devai/state/gate.log'), 'utf8')
        .trim()
        .split('\n')
        .filter((id) => id.startsWith('unit-')),
    ).toEqual(firstExecutions);
  });
});
