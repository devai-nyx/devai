// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const ROUND = 'R-9000';
const STATE = `.devai/state/round-runs/${ROUND}/close`;
const roots: string[] = [];
let convergedTemplate: Fixture | null = null;

interface Fixture {
  readonly root: string;
  readonly base: string;
}

interface Result {
  readonly status: number | null;
  readonly value: Record<string, unknown>;
  readonly stderr: string;
}

interface Frozen {
  readonly root: string;
  readonly candidate: string;
  readonly tree: string;
  readonly convergence: Record<string, unknown>;
  readonly candidateManifest: Record<string, unknown>;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stable(record[key])]),
    );
  }
  return value;
}

function canonical(value: unknown): string {
  return `${JSON.stringify(stable(value))}\n`;
}

function digestCanonical(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function digestBytes(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}

function selfDigest(value: Record<string, unknown>, field: string): Record<string, unknown> {
  const { [field]: _omitted, ...body } = value;
  return { ...body, [field]: digestCanonical(body) };
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function putBytes(root: string, relativePath: string, contents: Buffer): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function putJson(root: string, relativePath: string, value: unknown): void {
  put(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root: string, relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as Record<string, unknown>;
}

function sourceJson(relativePath: string): Record<string, unknown> {
  return readJson(ROOT, relativePath);
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

function copy(root: string, relativePath: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, relativePath), target);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function gitBytes(root: string, args: readonly string[]): Buffer {
  return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
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

function run(fixtureValue: Fixture, command: string, args: readonly string[] = []): Result {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', fixtureValue.root, '--round', ROUND, ...args, '--json'],
    { cwd: fixtureValue.root, encoding: 'utf8', env: { ...process.env } },
  );
  let value: Record<string, unknown> = {};
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = { stdout: result.stdout };
  }
  return { status: result.status, value, stderr: result.stderr };
}

function codes(result: Result): string[] {
  return ((result.value.findings ?? []) as Array<{ code: string }>).map(({ code }) => code);
}

function bindingMarker(model = 'reviewer-exact-v1'): Record<string, unknown> {
  return {
    schemaVersion: '2.0.0',
    devai_reviewer_binding: true,
    mandate_id: 'OM-900',
    mandate_status: 'active',
    round: ROUND,
    model_selector: model,
    role: 'independent-read-only',
    semantic_census: 'complete',
    substantive_cycles: 2,
    transport_retries: 1,
    fallback: 'forbidden',
  };
}

function mandate(
  marker: Record<string, unknown>,
  container: { id: string; status: string; authority: string } = {
    id: 'OM-900',
    status: 'active',
    authority: 'Owner',
  },
): string {
  return `---\nid: ${container.id}\nstatus: ${container.status}\nauthority: ${container.authority}\n---\n\n# Fixture Owner mandate\n\n\`\`\`json\n${JSON.stringify(marker, null, 2)}\n\`\`\`\n`;
}

function validates(root: string, schemaPath: string, value: unknown): boolean {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const commonPath = join(root, 'law/schemas/common-defs.schema.json');
  if (existsSync(commonPath)) ajv.addSchema(readJson(root, 'law/schemas/common-defs.schema.json'));
  return ajv.compile(readJson(root, schemaPath))(value) as boolean;
}

function buildFixture(bound = true, register = true): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-remediation1-'));
  if (register) roots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/\nfixture/out/**\n');

  const policy = structuredClone(sourceJson('law/policy/round-close-controls.json'));
  policy.policy_id = 'remediation-1-fixture';
  policy.decision_id = 'DII-900';
  const convergence = policy.convergence as Record<string, unknown>;
  convergence.commands = (convergence.commands as Array<{ id: string }>).map(({ id }) => ({
    id,
    argv: ['node', 'fixture/gate.mjs', id],
    freshness_profile: id,
  }));
  const freshness = policy.freshness as Record<string, unknown>;
  freshness.environment_allowlist = [{ name: 'CI', mode: 'value-sha256' }];
  freshness.toolchain = [{ id: 'node', argv: ['node', '--version'] }];
  for (const relativePath of new Set<string>([
    'law/schemas/common-defs.schema.json',
    ...Object.values(policy.schemas as Record<string, string>),
  ]))
    copy(root, relativePath);
  putJson(root, 'law/policy/round-close-controls.json', policy);
  putJson(root, '.devai/config/round-close-controls.json', policy);

  const profile = structuredClone(sourceJson('work/rounds/R-0007/close-control-profile.json'));
  Object.assign(profile, {
    round: ROUND,
    decision_id: 'DII-900',
    declaration: {
      binding: 'b0-decision-required',
      decision_id: null,
      exact_base: null,
    },
    sources: {
      authorization: `work/rounds/${ROUND}/AUTHORIZATION.md`,
      plan: `work/rounds/${ROUND}/plan.md`,
      orchestrator: `work/rounds/${ROUND}/prompts/00-orchestrator.md`,
      affected_test_graph: `work/rounds/${ROUND}/affected-test-graph.json`,
      obligations: `work/rounds/${ROUND}/review-obligations.json`,
      current_claims: `work/rounds/${ROUND}/current-claims.json`,
      control_provenance: `work/rounds/${ROUND}/control-provenance.json`,
      additional_controls: ['product/owner-mandates/OM-900.md'],
      prior_findings: [],
      prior_finding_registry: `work/rounds/${ROUND}/prior-finding-registry.json`,
    },
    runtime: {
      state_root: STATE,
      candidate_manifest: `${STATE}/candidate-manifest.json`,
      convergence_evidence: `${STATE}/convergence-evidence.json`,
      impact_execution: `${STATE}/affected-test-execution.json`,
      review_scope: `${STATE}/review-scope-manifest.json`,
      review_result: `${STATE}/review-result.json`,
      materialized_claims: `${STATE}/current-claims.json`,
      post_publication_claims: `${STATE}/current-claims-post-publication.json`,
      pre_review_claim_inputs: `${STATE}/claim-inputs-pre-review.json`,
      post_publication_claim_inputs: `${STATE}/claim-inputs-post-publication.json`,
      review_state: `${STATE}/review-state.json`,
      review_transport: `${STATE}/review-transport.json`,
      review_transport_root: `${STATE}/review-transports`,
      review_repair_evidence: `${STATE}/review-repair-evidence.json`,
      active_control_census: `${STATE}/active-control-census.json`,
    },
    reviewer: {
      binding: 'owner-mandate-required',
      mandate_id: bound ? 'OM-900' : null,
      model_selector: bound ? 'reviewer-exact-v1' : null,
      role: 'independent-read-only',
      fallback: 'forbidden',
    },
  });
  putJson(root, `work/rounds/${ROUND}/close-control-profile.json`, profile);
  put(root, `work/rounds/${ROUND}/AUTHORIZATION.md`, '# authorization');
  put(root, `work/rounds/${ROUND}/plan.md`, '# plan');
  put(root, `work/rounds/${ROUND}/prompts/00-orchestrator.md`, '# orchestrator\n');

  const node = (id: string, selectors: string[], depends_on: string[] = []) => ({
    id,
    kind: 'test-shard',
    input_selectors: [...selectors, 'fixture/gate.mjs'],
    depends_on,
    command: ['node', 'fixture/gate.mjs', id],
    cwd: '.',
    outputs: [],
    coverage_mode: 'none',
  });
  putJson(root, `work/rounds/${ROUND}/affected-test-graph.json`, {
    schemaVersion: '2.0.0',
    graph_version: 'remediation-1-fixture',
    round: ROUND,
    population: {
      all_tracked: ['**/*'],
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
      { ...node('full-suite', ['packages/**/*.ts', 'tests/**/*.ts']), kind: 'fallback' },
      {
        ...node('full-coverage', ['packages/**/*.ts', 'tests/**/*.ts'], ['full-suite']),
        kind: 'fallback',
        coverage_mode: 'whole-only',
      },
    ],
    ...v5GraphControls((convergence.commands as Array<{ id: string }>).map(({ id }) => id)),
    fallbacks: {
      unknown_dependency: 'full-suite',
      dynamic_import: 'full-suite',
      incomplete_population: 'full-suite',
    },
    coverage: { node: 'full-coverage', mode: 'whole-only', partial_merge: 'forbidden' },
  });
  putJson(root, `work/rounds/${ROUND}/review-obligations.json`, {
    schemaVersion: '1.0.0',
    registry_version: 'remediation-1-fixture',
    round: ROUND,
    normative_sources: [
      {
        path: `work/rounds/${ROUND}/plan.md`,
        source_digest_sha256: digestBytes(readFileSync(join(root, `work/rounds/${ROUND}/plan.md`))),
        obligation_ids: ['R9000-P0-IDENTITY'],
      },
    ],
    obligations: [
      {
        obligation_id: 'R9000-P0-IDENTITY',
        claim: 'Exact identity and proof populations are independently recomputed.',
        risk: 'P0',
        source_refs: [`work/rounds/${ROUND}/plan.md`],
        governing_paths: ['packages/**'],
        required_evidence: [
          'candidate manifest',
          'convergence evidence',
          `work/rounds/${ROUND}/AUTHORIZATION.md`,
          'gate:stage1',
          'gate:governance',
        ],
        required_adversaries: ['cross identity', 'copied digest'],
        reuse_policy: 'digest-and-evidence-recheck',
        finding_classes: ['C2-F005', 'C2-F006'],
      },
    ],
  });
  putJson(root, `work/rounds/${ROUND}/prior-finding-registry.json`, {
    schemaVersion: '1.0.0',
    round: ROUND,
    registry_version: 'remediation-1-fixture',
    finding_classes: [
      {
        finding_id: 'F005',
        defect_class_id: 'C2-F005',
        severity: 'P0',
        origin_cycle: 1,
        origin_evidence: `work/audit/${ROUND}/prior-review.md`,
        topic_ids: ['candidate-identity'],
        population_query: 'Mutate every candidate and convergence proof field.',
        affected_population: ['candidate manifest', 'convergence evidence'],
        repair_condition: 'Every proof independently authenticates and cross-binds.',
        disposition: 'REPAIRED_PENDING_REVIEW',
      },
      {
        finding_id: 'F006',
        defect_class_id: 'C2-F006',
        severity: 'P1',
        origin_cycle: 1,
        origin_evidence: `work/audit/${ROUND}/prior-review.md`,
        topic_ids: ['obligation:r9000-p0-identity'],
        population_query: 'Mutate every reused-topic proof.',
        affected_population: ['input manifest', 'evidence manifest', 'task keys'],
        repair_condition: 'Every current proof recomputes independently.',
        disposition: 'REPAIRED_PENDING_REVIEW',
      },
    ],
  });
  putJson(root, `work/rounds/${ROUND}/current-claims.json`, {
    schemaVersion: '2.0.0',
    ledger_version: 'remediation-1-fixture',
    round: ROUND,
    mode: 'registry',
    candidate: null,
    claims_digest_sha256: null,
    pre_review_claims_digest: null,
    claims: [
      {
        claim_id: 'suite.population',
        volatility: 'tree',
        availability: 'pre-review',
        producer: ['node', 'fixture/claim.mjs'],
        extractor: '$.count',
        source_paths: ['tests/a.test.ts'],
        rendered_locations: [`work/audit/${ROUND}/as-built.md`],
        source_digest: null,
        value_digest: null,
      },
    ],
  });
  put(root, 'fixture/gate.mjs', 'process.stdout.write("PASS\\n");\n');
  put(root, 'fixture/claim.mjs', 'process.stdout.write(JSON.stringify({count: 1}));\n');
  put(root, 'package.json', '{"name":"fixture","private":true}\n');
  put(root, 'packages/a/src/index.ts', 'export const a = 1;\n');
  put(root, 'packages/a/src/secondary.ts', 'export const secondary = 1;\n');
  put(root, 'tests/a.test.ts', 'export const testA = true;\n');
  put(root, `work/audit/${ROUND}/as-built.md`, 'DEVAI_CLAIM:suite.population=1\n');
  put(root, `work/audit/${ROUND}/prior-review.md`, '# prior review\n');
  if (bound) put(root, 'product/owner-mandates/OM-900.md', mandate(bindingMarker()));
  putJson(root, `work/rounds/${ROUND}/control-provenance.json`, {
    schemaVersion: '1.0.0',
    round: ROUND,
    root_decision: 'DII-900',
    decision_register: 'law/register/DECISIONS.md',
    decisions: [{ decision_id: 'DII-900', status: 'active', depends_on: [] }],
    owner_mandates: bound
      ? [
          {
            mandate_id: 'OM-900',
            path: 'product/owner-mandates/OM-900.md',
            required_status: 'active',
          },
        ]
      : [],
    manifest_roots: [
      `work/rounds/${ROUND}/AUTHORIZATION.md`,
      `work/rounds/${ROUND}/plan.md`,
      `work/rounds/${ROUND}/prompts/00-orchestrator.md`,
    ],
    normative_source_roots: [`work/rounds/${ROUND}/plan.md`],
    derived_sources: [
      'policy-schema-map',
      'round-profile-sources',
      'round-declaration-when-bound',
      'prior-finding-origin-evidence',
      'obligation-source-references',
    ],
  });
  const base = commit(root, 'fixture opening base');
  profile.declaration = {
    binding: 'b0-decision-required',
    decision_id: 'DII-900',
    exact_base: base,
  };
  putJson(root, `work/rounds/${ROUND}/close-control-profile.json`, profile);
  put(
    root,
    'law/register/DECISIONS.md',
    `# Fixture decisions\n\n### DII-900 — Fixture round declaration\n\`type: decision · status: active · authority: Architect · provenance: fixture\`\n\n\`\`\`json\n${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        devai_round_declaration: true,
        round: ROUND,
        decision_id: 'DII-900',
        authority: 'Architect',
        exact_base: base,
        base_source: 'origin/main-at-b0',
      },
      null,
      2,
    )}\n\`\`\`\n`,
  );
  commit(root, 'fixture B0 declaration');
  return { root, base };
}

function fixture(bound = true): Fixture {
  if (!bound) return buildFixture(false);
  if (convergedTemplate === null) {
    convergedTemplate = buildFixture(true, false);
    freeze(convergedTemplate);
  }
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-remediation1-'));
  roots.push(root);
  cpSync(convergedTemplate.root, root, { recursive: true, force: true });
  return { root, base: convergedTemplate.base };
}

function freeze(fixtureValue: Fixture, candidate = 'HEAD'): Frozen {
  const exactCandidate = git(fixtureValue.root, ['rev-parse', candidate]);
  const tree = git(fixtureValue.root, ['rev-parse', `${exactCandidate}^{tree}`]);
  const convergencePath = `${STATE}/convergence-evidence.json`;
  const candidatePath = `${STATE}/candidate-manifest.json`;
  if (
    existsSync(join(fixtureValue.root, convergencePath)) &&
    existsSync(join(fixtureValue.root, candidatePath))
  ) {
    const convergence = readJson(fixtureValue.root, convergencePath);
    const candidateManifest = readJson(fixtureValue.root, candidatePath);
    if (
      convergence.candidate_sha === exactCandidate &&
      convergence.candidate_tree === tree &&
      candidateManifest.candidate_sha === exactCandidate &&
      candidateManifest.tree_sha === tree
    ) {
      return {
        root: fixtureValue.root,
        candidate: exactCandidate,
        tree,
        convergence,
        candidateManifest,
      };
    }
  }
  const converged = run(fixtureValue, 'smart-converge', [
    '--base',
    fixtureValue.base,
    '--head',
    exactCandidate,
  ]);
  expect(converged.status, JSON.stringify(converged.value, null, 2)).toBe(0);
  const convergence = readJson(fixtureValue.root, convergencePath);
  const candidateManifest = readJson(fixtureValue.root, candidatePath);
  return {
    root: fixtureValue.root,
    candidate: exactCandidate,
    tree,
    convergence,
    candidateManifest,
  };
}
function transition(
  from: string,
  to: string,
  frozen: Frozen,
  links: Partial<Record<string, string | null>> = {},
): Record<string, unknown> {
  return selfDigest(
    {
      from,
      to,
      ordinal: 1,
      cycle: /CYCLE_2|NEW_CANDIDATE/u.test(`${from}:${to}`) ? 2 : 1,
      candidate_sha: frozen.candidate,
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      review_scope_digest: links.review_scope_digest ?? null,
      review_result_digest: links.review_result_digest ?? null,
      transport_digest: links.transport_digest ?? null,
      repair_evidence_digest: links.repair_evidence_digest ?? null,
      previous_state_digest: links.previous_state_digest ?? null,
      previous_transition_digest: null,
    },
    'transition_digest_sha256',
  );
}

function stateChain(
  fixtureValue: Fixture,
  frozen: Frozen,
  state: string,
  cycle: 1 | 2,
  scopeDigest: string,
  history: Record<string, unknown>[],
  extra: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  const profile = readJson(fixtureValue.root, `work/rounds/${ROUND}/close-control-profile.json`);
  const policy = readJson(fixtureValue.root, 'law/policy/round-close-controls.json');
  let previousTransitionDigest: string | null = null;
  const normalizedHistory = history.map((entry, index) => {
    const { transition_digest_sha256: _oldDigest, ...body } = entry;
    const normalized = selfDigest(
      {
        ...body,
        ordinal: index + 1,
        cycle: /CYCLE_2|NEW_CANDIDATE/u.test(`${String(body.from)}:${String(body.to)}`) ? 2 : 1,
        previous_transition_digest: previousTransitionDigest,
      },
      'transition_digest_sha256',
    );
    previousTransitionDigest = normalized.transition_digest_sha256 as string;
    return normalized;
  });
  return selfDigest(
    {
      schemaVersion: '3.0.0',
      round: ROUND,
      state,
      cycle,
      base_sha: fixtureValue.base,
      candidate_sha: frozen.candidate,
      tree_sha: frozen.tree,
      profile_digest: digestCanonical(profile),
      policy_digest: digestCanonical(policy),
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      review_scope_digest: scopeDigest,
      reviewer_binding_digest: digestCanonical(bindingMarker()),
      active_control_census_digest: frozen.candidateManifest.active_control_census_digest,
      previous_candidate_sha: null,
      prior_failure_result_digest: null,
      prior_failure_state_digest: null,
      prior_failure_transport_digest: null,
      repair_evidence_digest: null,
      transition_history: normalizedHistory,
      history_digest: digestCanonical(normalizedHistory),
      latest_transition_digest: previousTransitionDigest,
      previous_state_digest: null,
      transport_attempts: 0,
      transport_history_digests: [],
      current_transport_digest: null,
      current_review_result_digest: null,
      ...extra,
    },
    'state_digest_sha256',
  );
}

function transportEvidence(
  frozen: Frozen,
  scopeDigest: string,
  attempt: 1 | 2,
  stateBeforeDigest: string,
  previousTransportDigest: string | null,
): Record<string, unknown> {
  return selfDigest(
    {
      schemaVersion: '2.0.0',
      round: ROUND,
      cycle: 1,
      attempt,
      candidate_sha: frozen.candidate,
      candidate_tree: frozen.tree,
      policy_digest: frozen.candidateManifest.policy_digest,
      profile_digest: frozen.candidateManifest.profile_digest,
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      review_scope_digest: scopeDigest,
      scope_identity_digest: digestCanonical({ scope_digest: scopeDigest }),
      reviewer_binding_digest: digestCanonical(bindingMarker()),
      active_control_census_digest: frozen.candidateManifest.active_control_census_digest,
      payload_digest: digestCanonical('fixture transport payload'),
      validation: 'INVALID_TRANSPORT',
      state_before_digest: stateBeforeDigest,
      previous_transport_digest: previousTransportDigest,
    },
    'transport_digest_sha256',
  );
}

function repairEvidence(
  first: Frozen,
  firstScopeDigest: string,
  failureResultDigest: string,
  failureStateDigest: string,
  second: Frozen | string,
): Record<string, unknown> {
  const authenticatedState = existsSync(join(first.root, `${STATE}/review-state.json`))
    ? readJson(first.root, `${STATE}/review-state.json`)
    : null;
  const secondCandidate = typeof second === 'string' ? second : second.candidate;
  return selfDigest(
    {
      schemaVersion: '2.0.0',
      round: ROUND,
      prior_candidate_sha: first.candidate,
      prior_candidate_manifest_digest: first.candidateManifest.manifest_digest_sha256,
      prior_review_scope_digest: firstScopeDigest,
      prior_review_result_digest: failureResultDigest,
      prior_failure_state_digest: failureStateDigest,
      prior_failure_transition_digest:
        authenticatedState?.latest_transition_digest ?? '2'.repeat(64),
      prior_failure_transport_digest:
        authenticatedState?.current_transport_digest ?? '3'.repeat(64),
      new_candidate_sha: secondCandidate,
      new_candidate_manifest_digest:
        typeof second === 'string'
          ? '4'.repeat(64)
          : second.candidateManifest.manifest_digest_sha256,
      repair_state_before_digest: authenticatedState?.state_digest_sha256 ?? failureStateDigest,
      repaired_classes: [
        {
          defect_class_id: 'FIXTURE_CLASS',
          population_query: 'Enumerate fixture instances.',
          affected_instances: ['instance-a'],
          repaired_instances: ['instance-a'],
          changed_paths: ['packages/a/src/index.ts'],
          verification_refs: ['tests/a.test.ts'],
        },
      ],
    },
    'repair_evidence_digest_sha256',
  );
}

function scope(fixtureValue: Fixture, frozen: Frozen, cycle: 1 | 2 = 1): Result {
  return run(fixtureValue, 'review-scope', [
    '--base',
    fixtureValue.base,
    '--candidate',
    frozen.candidate,
    '--cycle',
    String(cycle),
  ]);
}

function passingResult(
  manifest: Record<string, unknown>,
  frozen: Frozen,
  disposition = 'RECHECKED_PASS',
): Record<string, unknown> {
  const topics = manifest.topics as Array<Record<string, unknown>>;
  const candidatePaths = git(frozen.root, ['ls-tree', '-r', '--name-only', frozen.candidate])
    .split('\n')
    .filter(Boolean);
  const dispositions = topics.map((topic) => {
    const governingPaths = topic.governing_paths as string[];
    const matched = candidatePaths.filter((path) =>
      governingPaths.some((selector) =>
        selector.endsWith('/**') ? path.startsWith(selector.slice(0, -2)) : path === selector,
      ),
    );
    const inputs = (
      matched.length > 0
        ? matched.map((source) => ({
            source,
            digest: digestBytes(gitBytes(frozen.root, ['show', `${frozen.candidate}:${source}`])),
          }))
        : governingPaths.map((source) => ({
            source,
            digest: digestCanonical({
              source,
              state: 'absent',
              candidate: frozen.candidate,
            }),
          }))
    ).sort((left, right) => left.source.localeCompare(right.source));
    const evidenceRefs = [
      ...new Set([
        'candidate manifest',
        'convergence evidence',
        ...(topic.source_refs as string[]),
        ...(topic.required_evidence as string[]),
      ]),
    ];
    const evidence = evidenceRefs.map((ref) =>
      required(topicEvidenceRef(frozen, frozen, ref), `typed topic evidence is unresolved: ${ref}`),
    );
    const resolvedEvidenceRefs = evidence.map(({ ref }) => ref);
    const requiredGateIds = (topic.required_evidence as string[])
      .filter((ref) => ref.startsWith('gate:'))
      .map((ref) => ref.slice('gate:'.length));
    const passTwo = required(
      (frozen.convergence.passes as Array<Record<string, unknown>>)[1],
      'fixture convergence has no pass 2',
    );
    const taskFreshness = (passTwo.gate_results as Array<Record<string, unknown>>)
      .filter((gate) => requiredGateIds.includes(gate.gate_id as string))
      .map((gate) => {
        const taskId = `gate-${String(gate.gate_id)}`;
        const taskKey = gate.task_key as string;
        const cache = readJson(frozen.root, `${STATE}/freshness/tasks/${taskId}/${taskKey}.json`);
        return {
          task_id: taskId,
          task_key: taskKey,
          result_digest: cache.result_digest,
          evidence_ref: `gate:${String(gate.gate_id)}`,
        };
      });
    const taskKeys = taskFreshness.map(({ task_key }) => task_key);
    const proofBody = {
      topic_id: topic.topic_id,
      disposition,
      recomputed_digest: topic.current_digest,
      recomputed_inputs_manifest: inputs,
      recomputed_evidence_manifest: evidence,
      recomputed_evidence_digest: digestCanonical(evidence),
      recomputed_evidence_refs_digest: digestCanonical(resolvedEvidenceRefs),
      recomputed_task_keys: taskKeys,
      recomputed_task_freshness_manifest: taskFreshness,
      evidence_refs: resolvedEvidenceRefs,
    };
    return {
      ...proofBody,
      proof_digest_sha256: digestCanonical(proofBody),
      justification: 'Independently recomputed from current exact-candidate evidence.',
      finding_ids: [],
    };
  });
  const counts = {
    RECHECKED_PASS: disposition === 'RECHECKED_PASS' ? dispositions.length : 0,
    RECHECKED_FAIL: 0,
    REUSED_FRESH_PASS: disposition === 'REUSED_FRESH_PASS' ? dispositions.length : 0,
    BLOCKED: 0,
  };
  return selfDigest(
    {
      schemaVersion: '3.0.0',
      round: ROUND,
      cycle: manifest.cycle,
      review_candidate: manifest.review_candidate,
      manifest_digest: manifest.manifest_digest_sha256,
      scope_identity_digest: (manifest.identity_proof as Record<string, unknown>)
        .identity_digest_sha256,
      policy_digest: manifest.policy_digest,
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      reviewer_binding_digest: digestCanonical(bindingMarker()),
      active_control_census_digest: frozen.candidateManifest.active_control_census_digest,
      state_before_digest: readJson(frozen.root, `${STATE}/review-state.json`).state_digest_sha256,
      dispositions,
      findings: [],
      terminal: {
        verdict: 'PASS',
        topic_count: dispositions.length,
        disposition_counts: counts,
        finding_count: 0,
        complete: true,
      },
    },
    'result_digest_sha256',
  );
}

function refreshDispositionProof(disposition: Record<string, unknown>): void {
  disposition.proof_digest_sha256 = digestCanonical({
    topic_id: disposition.topic_id,
    disposition: disposition.disposition,
    recomputed_digest: disposition.recomputed_digest,
    recomputed_inputs_manifest: disposition.recomputed_inputs_manifest,
    recomputed_evidence_manifest: disposition.recomputed_evidence_manifest,
    recomputed_evidence_digest: disposition.recomputed_evidence_digest,
    recomputed_evidence_refs_digest: disposition.recomputed_evidence_refs_digest,
    recomputed_task_keys: disposition.recomputed_task_keys,
    recomputed_task_freshness_manifest: disposition.recomputed_task_freshness_manifest,
    evidence_refs: disposition.evidence_refs,
  });
}

function failingResult(
  manifest: Record<string, unknown>,
  frozen: Frozen,
  defectClassId = 'FIXTURE_CLASS',
): Record<string, unknown> {
  const result = passingResult(manifest, frozen);
  const dispositions = result.dispositions as Array<Record<string, unknown>>;
  const disposition = required(dispositions[0], 'fixture review result has no dispositions');
  disposition.disposition = 'RECHECKED_FAIL';
  disposition.finding_ids = ['FIXTURE-FAILURE'];
  refreshDispositionProof(disposition);
  result.findings = [
    {
      finding_id: 'FIXTURE-FAILURE',
      defect_class_id: defectClassId,
      severity: 'P1',
      topic_ids: [disposition.topic_id],
      evidence: 'authenticated fixture failure',
      population_query: 'Enumerate fixture instances.',
      affected_instances: ['instance-a'],
      repair_acceptance: 'Repair instance-a.',
    },
  ];
  result.terminal = {
    verdict: 'FAIL',
    topic_count: dispositions.length,
    disposition_counts: {
      RECHECKED_PASS: dispositions.length - 1,
      RECHECKED_FAIL: 1,
      REUSED_FRESH_PASS: 0,
      BLOCKED: 0,
    },
    finding_count: 1,
    complete: true,
  };
  return selfDigest(result, 'result_digest_sha256');
}

function prepareRepairCandidate(current: Fixture): {
  first: Frozen;
  firstScope: Record<string, unknown>;
  priorState: Record<string, unknown>;
  second: Frozen;
  repair: Record<string, unknown>;
} {
  const first = freeze(current);
  const firstScoped = scope(current, first);
  expect(firstScoped.status, JSON.stringify(firstScoped.value, null, 2)).toBe(0);
  const firstScope = firstScoped.value.manifest as Record<string, unknown>;
  const failure = failingResult(firstScope, first);
  putJson(current.root, 'fixture/cycle1-failure.json', failure);
  const failed = run(current, 'review-check', [
    '--candidate',
    first.candidate,
    '--cycle',
    '1',
    '--review-result',
    'fixture/cycle1-failure.json',
  ]);
  expect(failed.value.state, JSON.stringify(failed.value, null, 2)).toBe('REPAIR_REQUIRED');
  const priorState = readJson(current.root, `${STATE}/review-state.json`);
  put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
  const secondCandidate = commit(current.root, 'complete authenticated fixture repair');
  const second = freeze(current, secondCandidate);
  const repair = repairEvidence(
    first,
    firstScope.manifest_digest_sha256 as string,
    failure.result_digest_sha256 as string,
    priorState.state_digest_sha256 as string,
    second,
  );
  return { first, firstScope, priorState, second, repair };
}

function enterCycleTwo(current: Fixture): {
  first: Frozen;
  firstScope: Record<string, unknown>;
  priorState: Record<string, unknown>;
  second: Frozen;
  secondScope: Record<string, unknown>;
} {
  const prepared = prepareRepairCandidate(current);
  putJson(current.root, `${STATE}/review-repair-evidence.json`, prepared.repair);
  const secondScoped = scope(current, prepared.second, 2);
  expect(secondScoped.status, JSON.stringify(secondScoped.value, null, 2)).toBe(0);
  return {
    first: prepared.first,
    firstScope: prepared.firstScope,
    priorState: prepared.priorState,
    second: prepared.second,
    secondScope: secondScoped.value.manifest as Record<string, unknown>,
  };
}

function redigestState(state: Record<string, unknown>): Record<string, unknown> {
  let previousTransitionDigest: string | null = null;
  const transitionHistory = (state.transition_history as Array<Record<string, unknown>>).map(
    (transition, index) => {
      const { transition_digest_sha256: _oldDigest, ...body } = transition;
      const authenticated = selfDigest(
        {
          ...body,
          ordinal: index + 1,
          previous_transition_digest: previousTransitionDigest,
        },
        'transition_digest_sha256',
      );
      previousTransitionDigest = authenticated.transition_digest_sha256 as string;
      return authenticated;
    },
  );
  return selfDigest(
    {
      ...state,
      transition_history: transitionHistory,
      history_digest: digestCanonical(transitionHistory),
      latest_transition_digest: previousTransitionDigest,
    },
    'state_digest_sha256',
  );
}

function materializeTerminal(
  terminal: 'PASS' | 'ESCALATION_REQUIRED' | 'REVIEW_TRANSPORT_BLOCKED',
  predecessor: 'CYCLE_1_ACTIVE' | 'CYCLE_2_ACTIVE',
  requestedCycle: 1 | 2,
): { current: Fixture; frozen: Frozen } {
  const current = fixture(true);
  let frozen: Frozen;
  let manifest: Record<string, unknown>;
  if (predecessor === 'CYCLE_1_ACTIVE') {
    frozen = freeze(current);
    const scoped = scope(current, frozen);
    expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
    manifest = scoped.value.manifest as Record<string, unknown>;
  } else {
    const cycleTwo = enterCycleTwo(current);
    frozen = cycleTwo.second;
    manifest = cycleTwo.secondScope;
  }
  if (terminal === 'REVIEW_TRANSPORT_BLOCKED') {
    put(current.root, 'fixture/terminal-malformed.jsonl', '{');
    const args = [
      '--candidate',
      frozen.candidate,
      '--cycle',
      predecessor === 'CYCLE_1_ACTIVE' ? '1' : '2',
      '--review-result',
      'fixture/terminal-malformed.jsonl',
    ];
    expect(run(current, 'review-check', args).status).toBe(1);
    expectCode(run(current, 'review-check', args), 'REVIEW_TRANSPORT_BLOCKED');
  } else {
    const result =
      terminal === 'PASS' ? passingResult(manifest, frozen) : failingResult(manifest, frozen);
    putJson(current.root, 'fixture/terminal-result.json', result);
    const checked = run(current, 'review-check', [
      '--candidate',
      frozen.candidate,
      '--cycle',
      predecessor === 'CYCLE_1_ACTIVE' ? '1' : '2',
      '--review-result',
      'fixture/terminal-result.json',
    ]);
    expect(checked.value.state, JSON.stringify(checked.value, null, 2)).toBe(
      terminal === 'PASS'
        ? 'PASS'
        : predecessor === 'CYCLE_1_ACTIVE'
          ? 'REPAIR_REQUIRED'
          : 'ESCALATION_REQUIRED',
    );
  }
  const statePath = `${STATE}/review-state.json`;
  const state = readJson(current.root, statePath);
  if (terminal === 'ESCALATION_REQUIRED' && predecessor === 'CYCLE_1_ACTIVE') {
    state.state = terminal;
    const finalTransition = required(
      (state.transition_history as Array<Record<string, unknown>>).at(-1),
      'fixture terminal transition is missing',
    );
    finalTransition.to = terminal;
    finalTransition.cycle = 2;
  }
  state.cycle = requestedCycle;
  putJson(current.root, statePath, redigestState(state));
  return { current, frozen };
}

function withAuthenticReuse(
  _fixtureValue: Fixture,
  manifest: Record<string, unknown>,
  frozen: Frozen,
): Record<string, unknown> {
  const result = passingResult(manifest, frozen);
  const topics = manifest.topics as Array<Record<string, unknown>>;
  const topic = topics.find((entry) =>
    (entry.allowed_dispositions as string[]).includes('REUSED_FRESH_PASS'),
  );
  if (topic === undefined) throw new Error('fixture has no reuse-eligible topic');
  const disposition = (result.dispositions as Array<Record<string, unknown>>).find(
    (entry) => entry.topic_id === topic.topic_id,
  );
  if (disposition === undefined) throw new Error('fixture reuse disposition is missing');
  Object.assign(disposition, {
    disposition: 'REUSED_FRESH_PASS',
    justification:
      'Recomputed current blobs, exact evidence artifacts, and the current pass-2 task population.',
  });
  refreshDispositionProof(disposition);
  const count = (result.dispositions as unknown[]).length;
  result.terminal = {
    verdict: 'PASS',
    topic_count: count,
    disposition_counts: {
      RECHECKED_PASS: count - 1,
      RECHECKED_FAIL: 0,
      REUSED_FRESH_PASS: 1,
      BLOCKED: 0,
    },
    finding_count: 0,
    complete: true,
  };
  return selfDigest(result, 'result_digest_sha256');
}

function reusableTopic(manifest: Record<string, unknown>): Record<string, unknown> {
  return required(
    (manifest.topics as Array<Record<string, unknown>>).find((topic) =>
      (topic.allowed_dispositions as string[]).includes('REUSED_FRESH_PASS'),
    ),
    'fixture has no reuse-eligible topic',
  );
}

function topicEvidenceRef(
  fixtureValue: Pick<Fixture, 'root'>,
  frozen: Frozen,
  ref: string,
): { ref: string; digest: string } | null {
  const runtimeAliases = new Map<string, string>([
    ['candidate manifest', `${STATE}/candidate-manifest.json`],
    ['candidate-manifest', `${STATE}/candidate-manifest.json`],
    ['convergence evidence', `${STATE}/convergence-evidence.json`],
    ['convergence-evidence', `${STATE}/convergence-evidence.json`],
    ['impact-execution', `${STATE}/affected-test-execution.json`],
    ['active-control-census', `${STATE}/active-control-census.json`],
    ['current-claims', `${STATE}/current-claims.json`],
    ['claim-runtime-inputs', `${STATE}/claim-inputs-pre-review.json`],
    ['review-scope', `${STATE}/review-scope-manifest.json`],
    ['review-state', `${STATE}/review-state.json`],
    ['review-transport', `${STATE}/review-transport.json`],
  ]);
  const runtimePath =
    runtimeAliases.get(ref) ??
    [...runtimeAliases.values()].find((configuredPath) => configuredPath === ref);
  if (runtimePath !== undefined) {
    const absolute = join(fixtureValue.root, runtimePath);
    return existsSync(absolute) ? { ref, digest: digestBytes(readFileSync(absolute)) } : null;
  }
  if (ref === 'reviewer-binding') return { ref, digest: digestCanonical(bindingMarker()) };
  if (ref === 'prior-finding-registry') {
    const path = `work/rounds/${ROUND}/prior-finding-registry.json`;
    return {
      ref,
      digest: digestBytes(gitBytes(fixtureValue.root, ['show', `${frozen.candidate}:${path}`])),
    };
  }
  if (ref === 'git:exact-range') {
    const base = frozen.convergence.exact_base as string;
    const records = git(fixtureValue.root, [
      'diff',
      '--name-status',
      '-M',
      '--find-renames',
      base,
      frozen.candidate,
    ])
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [status, first, second] = line.split('\t');
        const preimage = status === 'A' ? null : first;
        const postimage = status === 'D' ? null : (second ?? first);
        const paths = [...new Set([preimage, postimage].filter((path) => path !== null))];
        return {
          record_id: digestCanonical(
            /^[RC]/u.test(status) ? { status, preimage, postimage } : { status, path: first },
          ),
          status,
          preimage,
          postimage,
          paths,
        };
      });
    return { ref, digest: digestCanonical(records) };
  }
  if (ref.startsWith('gate:')) {
    const gateId = ref.slice('gate:'.length);
    const passTwo = required(
      (frozen.convergence.passes as Array<Record<string, unknown>>)[1],
      'fixture convergence has no pass 2',
    );
    const gate = (passTwo.gate_results as Array<Record<string, unknown>>).find(
      (entry) => entry.gate_id === gateId,
    );
    if (gate === undefined) return null;
    return { ref, digest: gate.result_digest as string };
  }
  if (ref.startsWith('claim:')) {
    const ledger = readJson(fixtureValue.root, `${STATE}/current-claims.json`);
    const claim = (ledger.claims as Array<Record<string, unknown>>).find(
      ({ claim_id }) => `claim:${String(claim_id)}` === ref,
    );
    return claim === undefined ? null : { ref, digest: digestCanonical(claim) };
  }
  const normalizedRef = ref.startsWith('path:') ? ref.slice('path:'.length) : ref;
  const path = normalizedRef.split('#', 1)[0];
  if (path === undefined || path === '') return null;
  let revision = frozen.candidate;
  try {
    return {
      ref,
      digest: digestCanonical({
        revision,
        blob: digestBytes(gitBytes(fixtureValue.root, ['show', `${revision}:${path}`])),
      }),
    };
  } catch {
    revision = frozen.convergence.exact_base as string;
    try {
      return {
        ref,
        digest: digestCanonical({
          revision,
          blob: digestBytes(gitBytes(fixtureValue.root, ['show', `${revision}:${path}`])),
        }),
      };
    } catch {
      return null;
    }
  }
}

function completeTopicEvidence(
  fixtureValue: Fixture,
  frozen: Frozen,
  topic: Record<string, unknown>,
): Array<{ ref: string; digest: string }> {
  const refs = [
    'candidate manifest',
    'convergence evidence',
    ...(topic.source_refs as string[]),
    ...(topic.required_evidence as string[]),
  ];
  return [
    ...new Map(
      refs.map((ref) => {
        const evidence = required(
          topicEvidenceRef(fixtureValue, frozen, ref),
          `typed topic evidence is unresolved: ${ref}`,
        );
        return [evidence.ref, evidence];
      }),
    ).values(),
  ];
}

function withCompleteTopicReuse(
  fixtureValue: Fixture,
  manifest: Record<string, unknown>,
  frozen: Frozen,
): {
  result: Record<string, unknown>;
  topic: Record<string, unknown>;
  disposition: Record<string, unknown>;
} {
  const result = withAuthenticReuse(fixtureValue, manifest, frozen);
  const topic = reusableTopic(manifest);
  const disposition = required(
    (result.dispositions as Array<Record<string, unknown>>).find(
      (entry) => entry.topic_id === topic.topic_id,
    ),
    'fixture reuse disposition is missing',
  );
  const evidence = completeTopicEvidence(fixtureValue, frozen, topic);
  disposition.recomputed_evidence_manifest = evidence;
  disposition.recomputed_evidence_digest = digestCanonical(evidence);
  disposition.recomputed_evidence_refs_digest = digestCanonical(evidence.map(({ ref }) => ref));
  const requiredGateIds = (topic.required_evidence as string[])
    .filter((ref) => ref.startsWith('gate:'))
    .map((ref) => ref.slice('gate:'.length));
  const passTwo = required(
    (frozen.convergence.passes as Array<Record<string, unknown>>)[1],
    'fixture convergence has no pass 2',
  );
  const gates = (passTwo.gate_results as Array<Record<string, unknown>>).filter((gate) =>
    requiredGateIds.includes(gate.gate_id as string),
  );
  disposition.recomputed_task_keys = gates.map((gate) => gate.task_key as string);
  disposition.recomputed_task_freshness_manifest = gates.map((gate) => {
    const taskId = `gate-${String(gate.gate_id)}`;
    const taskKey = gate.task_key as string;
    const cache = readJson(frozen.root, `${STATE}/freshness/tasks/${taskId}/${taskKey}.json`);
    return {
      task_id: taskId,
      task_key: taskKey,
      result_digest: cache.result_digest,
      evidence_ref: `gate:${String(gate.gate_id)}`,
    };
  });
  disposition.evidence_refs = evidence.map(({ ref }) => ref);
  refreshDispositionProof(disposition);
  return { result: selfDigest(result, 'result_digest_sha256'), topic, disposition };
}

function expectCode(result: Result, code: string): void {
  expect(codes(result), `${result.stderr}\n${JSON.stringify(result.value, null, 2)}`).toContain(
    code,
  );
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

afterAll(() => {
  if (convergedTemplate !== null) rmSync(convergedTemplate.root, { recursive: true, force: true });
});

describe('OM-015 / DII-248 remediation campaign 1 populations', () => {
  it('keeps production close controls free of fixture-specific branches', () => {
    const production = readFileSync(SCRIPT, 'utf8');
    expect(production).not.toMatch(/\bfixtureOnly\b|R-9000|remediation-1-fixture|fixture\/gate/u);
  });

  it('uses normalized suite and exact-head CI claim producers in the live R-0007 registry', () => {
    const registry = sourceJson('work/rounds/R-0007/current-claims.json');
    const claims = new Map(
      (registry.claims as Array<Record<string, unknown>>).map((claim) => [claim.claim_id, claim]),
    );
    expect(claims.get('suite.population')?.producer).toEqual([
      'node',
      'scripts/run-round-close-controls.mjs',
      'claim-produce',
      '--kind',
      'vitest-list',
    ]);
    expect(claims.get('ci.exact-head')?.producer).toEqual([
      'node',
      'scripts/run-round-close-controls.mjs',
      'claim-produce',
      '--kind',
      'github-pr-exact-head',
      '--pr',
      '{source_pr_number}',
      '--candidate',
      '{candidate_sha}',
    ]);
    expect(claims.get('ci.exact-head')?.source_paths).toEqual(['producer-output:ci.exact-head']);
  });

  it('provides one schema-valid, independently self-digested fixture foundation', () => {
    const current = fixture(true);
    const frozen = freeze(current);
    const profile = readJson(current.root, `work/rounds/${ROUND}/close-control-profile.json`);
    const claims = readJson(current.root, `${STATE}/current-claims.json`);
    const impactExecution = readJson(current.root, `${STATE}/affected-test-execution.json`);
    const scopeDigest = 'a'.repeat(64);
    const history = [
      transition('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', frozen, {
        review_scope_digest: scopeDigest,
      }),
    ];
    const state = stateChain(current, frozen, 'CYCLE_1_ACTIVE', 1, scopeDigest, history);
    const transport = transportEvidence(
      frozen,
      scopeDigest,
      1,
      state.state_digest_sha256 as string,
      null,
    );
    const repair = repairEvidence(
      frozen,
      scopeDigest,
      'b'.repeat(64),
      state.state_digest_sha256 as string,
      '1'.repeat(40),
    );
    expect(validates(current.root, 'law/schemas/round-close-profile.schema.json', profile)).toBe(
      true,
    );
    expect(
      validates(current.root, 'law/schemas/round-convergence.schema.json', frozen.convergence),
    ).toBe(true);
    expect(
      validates(
        current.root,
        'law/schemas/candidate-manifest.schema.json',
        frozen.candidateManifest,
      ),
    ).toBe(true);
    expect(validates(current.root, 'law/schemas/current-claims.schema.json', claims)).toBe(true);
    expect(
      validates(current.root, 'law/schemas/affected-test-execution.schema.json', impactExecution),
    ).toBe(true);
    expect(
      validates(current.root, 'law/schemas/reviewer-binding.schema.json', bindingMarker()),
    ).toBe(true);
    expect(validates(current.root, 'law/schemas/review-state.schema.json', state)).toBe(true);
    expect(validates(current.root, 'law/schemas/review-transport.schema.json', transport)).toBe(
      true,
    );
    expect(validates(current.root, 'law/schemas/review-repair-evidence.schema.json', repair)).toBe(
      true,
    );
    expect(selfDigest(frozen.convergence, 'convergence_digest_sha256')).toEqual(frozen.convergence);
    expect(selfDigest(frozen.candidateManifest, 'manifest_digest_sha256')).toEqual(
      frozen.candidateManifest,
    );
    expect(selfDigest(claims, 'claims_digest_sha256')).toEqual(claims);
    expect(frozen.candidateManifest.convergence_digest).toBe(
      frozen.convergence.convergence_digest_sha256,
    );
    expect(frozen.candidateManifest.candidate_identity_digest).toBe(
      frozen.convergence.candidate_identity_digest,
    );
  });

  describe('C2-F001 tracked structured reviewer-binding census', () => {
    it('accepts exactly one tracked schema-valid binding across policy, entry, and status', () => {
      const current = fixture(true);
      for (const [command, args] of [
        ['policy-check', ['--phase', 'pre-entry-preparation']],
        ['entry-check', []],
        ['status', []],
      ] as const) {
        const result = run(current, command, args);
        expect(result.status, `${command}: ${JSON.stringify(result.value)}`).toBe(0);
        expect(result.value.entry_ready, command).toBe(true);
      }
    });

    it.each([
      ['untracked', 'ENTRY_BLOCKED_REVIEWER_UNBOUND'],
      ['partial', 'ENTRY_BLOCKED_REVIEWER_UNBOUND'],
      ['malformed', 'ENTRY_BLOCKED_REVIEWER_BINDING_SCHEMA_INVALID'],
      ['container-mismatch', 'ENTRY_BLOCKED_REVIEWER_BINDING_CONTAINER_MISMATCH'],
      ['duplicate', 'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS'],
    ])('rejects the %s binding census population', (kind, code) => {
      const current = fixture(false);
      if (kind === 'untracked') {
        put(current.root, 'product/owner-mandates/OM-900.md', mandate(bindingMarker()));
      } else if (kind === 'partial') {
        put(
          current.root,
          'product/owner-mandates/OM-900.md',
          '# prose devai_reviewer_binding R-9000\n',
        );
        commit(current.root, 'track partial prose');
      } else if (kind === 'malformed') {
        put(
          current.root,
          'product/owner-mandates/OM-900.md',
          '```json\n{"devai_reviewer_binding":true}\n```\n',
        );
        commit(current.root, 'track malformed marker');
      } else if (kind === 'container-mismatch') {
        put(
          current.root,
          'product/owner-mandates/OM-901.md',
          mandate(bindingMarker(), { id: 'OM-901', status: 'active', authority: 'Owner' }),
        );
        commit(current.root, 'track mismatched container');
      } else {
        put(current.root, 'product/owner-mandates/OM-900.md', mandate(bindingMarker()));
        const second = { ...bindingMarker('reviewer-exact-v2'), mandate_id: 'OM-901' };
        put(
          current.root,
          'product/owner-mandates/OM-901.md',
          mandate(second, { id: 'OM-901', status: 'active', authority: 'Owner' }),
        );
        commit(current.root, 'track competing markers');
      }
      const profile = readJson(current.root, `work/rounds/${ROUND}/close-control-profile.json`);
      profile.reviewer = {
        binding: 'owner-mandate-required',
        mandate_id: 'OM-900',
        model_selector: 'reviewer-exact-v1',
        role: 'independent-read-only',
        fallback: 'forbidden',
      };
      putJson(current.root, `work/rounds/${ROUND}/close-control-profile.json`, profile);
      for (const command of ['policy-check', 'entry-check', 'status']) {
        expectCode(
          run(
            current,
            command,
            command === 'policy-check' ? ['--phase', 'pre-entry-preparation'] : [],
          ),
          code,
        );
      }
    });
  });

  describe('C2-F005 candidate and convergence authentication', () => {
    it.each([
      ['missing-candidate', 'CANDIDATE_MANIFEST_MISSING'],
      ['malformed-candidate', 'CANDIDATE_MANIFEST_MALFORMED'],
      ['stale-candidate', 'CANDIDATE_MANIFEST_IDENTITY_INVALID'],
      ['tampered-candidate', 'CANDIDATE_MANIFEST_SELF_DIGEST_INVALID'],
      ['missing-convergence', 'CONVERGENCE_EVIDENCE_MISSING'],
      ['malformed-convergence', 'CONVERGENCE_EVIDENCE_MALFORMED'],
      ['partial-convergence', 'CONVERGENCE_GATE_POPULATION_INCOMPLETE'],
      ['tampered-convergence', 'CONVERGENCE_SELF_DIGEST_INVALID'],
      ['cross-mismatch', 'CONVERGENCE_CANDIDATE_CROSS_DIGEST_INVALID'],
    ])('atomically rejects %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const candidatePath = `${STATE}/candidate-manifest.json`;
      const convergencePath = `${STATE}/convergence-evidence.json`;
      if (kind === 'missing-candidate') unlinkSync(join(current.root, candidatePath));
      if (kind === 'malformed-candidate') put(current.root, candidatePath, '{');
      if (kind === 'stale-candidate') {
        const value = readJson(current.root, candidatePath);
        value.candidate_sha = '0'.repeat(40);
        putJson(current.root, candidatePath, selfDigest(value, 'manifest_digest_sha256'));
      }
      if (kind === 'tampered-candidate') {
        const value = readJson(current.root, candidatePath);
        value.claims_digest = '0'.repeat(64);
        putJson(current.root, candidatePath, value);
      }
      if (kind === 'missing-convergence') unlinkSync(join(current.root, convergencePath));
      if (kind === 'malformed-convergence') put(current.root, convergencePath, '{');
      if (kind === 'partial-convergence') {
        const value = readJson(current.root, convergencePath);
        const passes = value.passes as Array<Record<string, unknown>>;
        const passTwo = required(passes[1], 'fixture convergence has no pass 2');
        passTwo.gate_results = (passTwo.gate_results as unknown[]).slice(1);
        value.passes = passes.map((pass) => selfDigest(pass, 'pass_digest_sha256'));
        putJson(current.root, convergencePath, selfDigest(value, 'convergence_digest_sha256'));
      }
      if (kind === 'tampered-convergence') {
        const value = readJson(current.root, convergencePath);
        value.authoritative_population_digest = '0'.repeat(64);
        putJson(current.root, convergencePath, value);
      }
      if (kind === 'cross-mismatch') {
        const value = readJson(current.root, candidatePath);
        value.convergence_digest = '0'.repeat(64);
        putJson(current.root, candidatePath, selfDigest(value, 'manifest_digest_sha256'));
      }
      const result = scope(current, frozen);
      expectCode(result, code);
      expect(existsSync(join(current.root, `${STATE}/review-scope-manifest.json`))).toBe(false);
    });

    it.each([
      ['schema', 'REVIEW_SCOPE_SCHEMA_INVALID'],
      ['self-digest', 'REVIEW_SCOPE_SELF_DIGEST_INVALID'],
      ['recomputation', 'REVIEW_SCOPE_RECOMPUTATION_INVALID'],
    ])('review-check independently rejects a %s-invalid stored scope', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const scopePath = `${STATE}/review-scope-manifest.json`;
      const manifest = readJson(current.root, scopePath);
      if (kind === 'schema') {
        delete manifest.topic_count;
        putJson(current.root, scopePath, selfDigest(manifest, 'manifest_digest_sha256'));
      } else if (kind === 'self-digest') {
        manifest.topic_count = Number(manifest.topic_count) + 1;
        putJson(current.root, scopePath, manifest);
      } else {
        const topic = required(
          (manifest.topics as Array<Record<string, unknown>>)[0],
          'fixture review scope has no topics',
        );
        topic.current_digest = '0'.repeat(64);
        putJson(current.root, scopePath, selfDigest(manifest, 'manifest_digest_sha256'));
      }
      const stored = readJson(current.root, scopePath);
      const review = passingResult(stored, frozen);
      putJson(current.root, 'fixture/scope-check.json', review);
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/scope-check.json',
        ]),
        code,
      );
    });

    it('preserves authenticated review state when scope regeneration fails', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      expect(scope(current, frozen).status).toBe(0);
      const statePath = `${STATE}/review-state.json`;
      const scopePath = `${STATE}/review-scope-manifest.json`;
      const stateBefore = readFileSync(join(current.root, statePath), 'utf8');
      const candidate = readJson(current.root, `${STATE}/candidate-manifest.json`);
      candidate.claims_digest = '0'.repeat(64);
      putJson(
        current.root,
        `${STATE}/candidate-manifest.json`,
        selfDigest(candidate, 'manifest_digest_sha256'),
      );
      expect(scope(current, frozen).status).toBe(1);
      expect(existsSync(join(current.root, scopePath))).toBe(false);
      expect(readFileSync(join(current.root, statePath), 'utf8')).toBe(stateBefore);
    });

    it.each(['PASS', 'REVIEW_TRANSPORT_BLOCKED'] as const)(
      'does not overwrite terminal %s state during a fresh cycle-1 scope request',
      (terminal) => {
        const { current, frozen } = materializeTerminal(terminal, 'CYCLE_1_ACTIVE', 1);
        const statePath = `${STATE}/review-state.json`;
        const before = readFileSync(join(current.root, statePath), 'utf8');
        expectCode(scope(current, frozen), 'REVIEW_STATE_TERMINAL');
        expect(readFileSync(join(current.root, statePath), 'utf8')).toBe(before);
      },
    );

    it('rejects cycle-1 escalation without overwriting state or consuming a cycle', () => {
      const { current, frozen } = materializeTerminal('ESCALATION_REQUIRED', 'CYCLE_1_ACTIVE', 2);
      const statePath = `${STATE}/review-state.json`;
      const before = readFileSync(join(current.root, statePath), 'utf8');
      const rejected = scope(current, frozen);
      expectCode(rejected, 'REVIEW_STATE_TRANSITION_INVALID');
      expect(codes(rejected)).not.toContain('REVIEW_STATE_TERMINAL');
      expect(readFileSync(join(current.root, statePath), 'utf8')).toBe(before);
      const status = run(current, 'status');
      expect(status.value).toMatchObject({
        state: 'DRAFT',
        substantive_cycles: { used: 0, maximum: 2 },
      });
    });
  });

  describe('C2-F006 canonical findings and independently recomputed reuse', () => {
    it.each(['json', 'jsonl'])('rejects duplicate finding IDs in %s', (format) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const result = passingResult(scoped.value.manifest as Record<string, unknown>, frozen);
      const topicId = required(
        (result.dispositions as Array<Record<string, unknown>>)[0],
        'fixture review result has no dispositions',
      ).topic_id as string;
      const duplicate = {
        finding_id: 'DUP-1',
        defect_class_id: 'DUPLICATE_ID',
        severity: 'P1',
        topic_ids: [topicId],
        evidence: 'duplicate fixture',
        population_query: 'Enumerate duplicates.',
        affected_instances: ['one'],
        repair_acceptance: 'All identifiers are unique.',
      };
      result.findings = [duplicate, duplicate];
      const path = `fixture/review.${format}`;
      if (format === 'json')
        putJson(current.root, path, selfDigest(result, 'result_digest_sha256'));
      else {
        const body = selfDigest(result, 'result_digest_sha256');
        const header: Record<string, unknown> = { type: 'header', ...body };
        delete header.dispositions;
        delete header.findings;
        delete header.terminal;
        const dispositionRecords = (body.dispositions as Array<Record<string, unknown>>)
          .map((entry) => canonical({ type: 'disposition', ...entry }))
          .join('');
        put(
          current.root,
          path,
          `${canonical(header)}${dispositionRecords}${canonical({ type: 'finding', ...duplicate })}${canonical({ type: 'finding', ...duplicate })}${canonical({ type: 'terminal', ...(body.terminal as Record<string, unknown>) })}`,
        );
      }
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          path,
        ]),
        'REVIEW_FINDING_ID_DUPLICATE',
      );
    });

    // Policy v5 authenticates every disposition, so the former reuse-only diagnostics map to
    // the same-or-stricter proof-population guards regardless of the selected PASS disposition.
    it.each([
      ['missing-input', 'REVIEW_DISPOSITION_INPUTS_INVALID'],
      ['stale-input', 'REVIEW_DISPOSITION_INPUTS_INVALID'],
      ['missing-evidence', 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
      ['stale-evidence', 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
      ['empty-task-key', 'REVIEW_DISPOSITION_TASK_FRESHNESS_INVALID'],
      ['stale-task-key', 'REVIEW_DISPOSITION_TASK_FRESHNESS_INVALID'],
    ])('rejects reused-topic proof: %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const result = withAuthenticReuse(
        current,
        scoped.value.manifest as Record<string, unknown>,
        frozen,
      );
      const disposition = (result.dispositions as Array<Record<string, unknown>>).find(
        (entry) => entry.disposition === 'REUSED_FRESH_PASS',
      );
      if (disposition === undefined) throw new Error('authentic reuse disposition is missing');
      if (kind === 'missing-input')
        disposition.recomputed_inputs_manifest = (
          disposition.recomputed_inputs_manifest as unknown[]
        ).slice(1);
      if (kind === 'stale-input')
        disposition.recomputed_inputs_manifest = [{ source: 'wrong', digest: '0'.repeat(64) }];
      if (kind === 'missing-evidence')
        disposition.recomputed_evidence_manifest = (
          disposition.recomputed_evidence_manifest as unknown[]
        ).slice(1);
      if (kind === 'stale-evidence') disposition.recomputed_evidence_digest = '0'.repeat(64);
      if (kind === 'empty-task-key')
        disposition.recomputed_task_keys = (disposition.recomputed_task_keys as unknown[]).slice(1);
      if (kind === 'stale-task-key') disposition.recomputed_task_keys = ['0'.repeat(64)];
      const path = 'fixture/reuse.json';
      putJson(current.root, path, selfDigest(result, 'result_digest_sha256'));
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          path,
        ]),
        code,
      );
    });

    it('accepts one authentic current per-topic reused-topic proof', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const { result } = withCompleteTopicReuse(
        current,
        scoped.value.manifest as Record<string, unknown>,
        frozen,
      );
      putJson(current.root, 'fixture/reuse-pass.json', result);
      const reviewed = run(current, 'review-check', [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/reuse-pass.json',
      ]);
      expect(reviewed.status, JSON.stringify(reviewed.value, null, 2)).toBe(0);
    });

    it('accepts an exact per-topic evidence population for every reuse-eligible topic', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const manifest = scoped.value.manifest as Record<string, unknown>;
      const eligible = (manifest.topics as Array<Record<string, unknown>>).filter((topic) =>
        (topic.allowed_dispositions as string[]).includes('REUSED_FRESH_PASS'),
      );
      expect(eligible).toHaveLength(1);
      const { result } = withCompleteTopicReuse(current, manifest, frozen);
      putJson(current.root, 'fixture/complete-topic-reuse.json', result);
      expect(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/complete-topic-reuse.json',
        ]).status,
      ).toBe(0);
    });

    it.each([
      [
        'remove-source-ref',
        `work/rounds/${ROUND}/plan.md`,
        'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID',
      ],
      ['mutate-source-ref', `work/rounds/${ROUND}/plan.md`, 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
      [
        'remove-required-evidence',
        `work/rounds/${ROUND}/AUTHORIZATION.md`,
        'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID',
      ],
      [
        'mutate-required-evidence',
        `work/rounds/${ROUND}/AUTHORIZATION.md`,
        'REVIEW_DISPOSITION_EVIDENCE_INVALID',
      ],
      ['remove-task-evidence', 'gate:governance', 'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID'],
      ['mutate-task-evidence', 'gate:governance', 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
    ])('rejects a reused topic when its per-topic evidence population is %s', (kind, ref, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const { result, disposition } = withCompleteTopicReuse(
        current,
        scoped.value.manifest as Record<string, unknown>,
        frozen,
      );
      const evidence = disposition.recomputed_evidence_manifest as Array<{
        ref: string;
        digest: string;
      }>;
      const index = evidence.findIndex((entry) => entry.ref === ref);
      expect(index).toBeGreaterThanOrEqual(0);
      if (kind.startsWith('remove-')) evidence.splice(index, 1);
      else required(evidence[index], 'target evidence ref is absent').digest = '0'.repeat(64);
      disposition.recomputed_evidence_manifest = evidence;
      disposition.recomputed_evidence_digest = digestCanonical(evidence);
      disposition.evidence_refs = evidence.map((entry) => entry.ref);
      putJson(
        current.root,
        'fixture/incomplete-topic-reuse.json',
        selfDigest(result, 'result_digest_sha256'),
      );
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/incomplete-topic-reuse.json',
        ]),
        code,
      );
    });

    it.each([
      ['lf', Buffer.from('# plan'), Buffer.from('# plan\n'), false],
      ['crlf', Buffer.from('# plan'), Buffer.from('# plan\r\n'), false],
      ['trailing-space', Buffer.from('# plan'), Buffer.from('# plan '), false],
      ['tab', Buffer.from('# plan'), Buffer.from('# plan\t'), false],
      ['repeated-blank-line', Buffer.from('# plan'), Buffer.from('# plan\n\n'), false],
      ['empty', Buffer.from('\n'), Buffer.alloc(0), false],
      ['whitespace-only', Buffer.alloc(0), Buffer.from(' \t\r\n'), false],
      ['binary-non-utf8', Buffer.from([0xef, 0xbf, 0xbd]), Buffer.from([0xff]), true],
    ])(
      'rejects stale predecessor evidence after exact-byte %s mutation',
      (kind, predecessorBytes, candidateBytes, binary) => {
        const current = fixture(true);
        const ref = `work/rounds/${ROUND}/plan.md`;
        putBytes(current.root, ref, predecessorBytes);
        let predecessor = git(current.root, ['rev-parse', 'HEAD']);
        if (git(current.root, ['status', '--porcelain', '--untracked-files=all']) !== '') {
          predecessor = commit(current.root, `set ${kind} predecessor bytes`);
        }
        const predecessorDigest = digestBytes(
          gitBytes(current.root, ['show', `${predecessor}:${ref}`]),
        );
        putBytes(current.root, ref, candidateBytes);
        const candidate = commit(current.root, `mutate exact ${kind} bytes`);
        const candidateDigest = digestBytes(
          gitBytes(current.root, ['show', `${candidate}:${ref}`]),
        );
        expect(candidateDigest).not.toBe(predecessorDigest);

        const frozen = freeze(current, candidate);
        const scoped = scope(current, frozen);
        expect(scoped.status).toBe(0);
        const manifest = scoped.value.manifest as Record<string, unknown>;
        const topic = required(
          (manifest.topics as Array<Record<string, unknown>>).find(
            (entry) => entry.topic_id === 'obligation:r9000-p0-identity',
          ),
          'fixture identity obligation topic is absent',
        );
        const dispositions = topic.allowed_dispositions as string[];
        if (binary && !dispositions.includes('REUSED_FRESH_PASS')) {
          expect((topic.freshness_proof as Record<string, unknown>).method).toBe(
            'recheck-required',
          );
          return;
        }
        expect(dispositions).toContain('REUSED_FRESH_PASS');

        const { result, disposition } = withCompleteTopicReuse(current, manifest, frozen);
        const evidence = disposition.recomputed_evidence_manifest as Array<{
          ref: string;
          digest: string;
        }>;
        const target = required(
          evidence.find((entry) => entry.ref === ref),
          'candidate-tree evidence ref is absent',
        );
        expect(target.digest).toBe(candidateDigest);
        target.digest = predecessorDigest;
        disposition.recomputed_evidence_digest = digestCanonical(evidence);
        expect(disposition.recomputed_task_keys).toEqual(
          (topic.freshness_proof as Record<string, unknown>).task_keys,
        );
        putJson(
          current.root,
          'fixture/stale-byte-proof.json',
          selfDigest(result, 'result_digest_sha256'),
        );
        expectCode(
          run(current, 'review-check', [
            '--candidate',
            frozen.candidate,
            '--cycle',
            '1',
            '--review-result',
            'fixture/stale-byte-proof.json',
          ]),
          'REVIEW_DISPOSITION_EVIDENCE_INVALID',
        );
      },
    );

    it('forbids reuse when any declared topic evidence cannot be mechanically resolved', () => {
      const current = fixture(true);
      const registryPath = `work/rounds/${ROUND}/review-obligations.json`;
      const registry = readJson(current.root, registryPath);
      const obligation = required(
        (registry.obligations as Array<Record<string, unknown>>)[0],
        'fixture obligation registry is empty',
      );
      obligation.required_evidence = [
        ...(obligation.required_evidence as string[]),
        'unresolved external attestation',
      ];
      putJson(current.root, registryPath, registry);
      const candidate = commit(current.root, 'declare unresolved review evidence');
      const frozen = freeze(current, candidate);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const topic = required(
        (
          (scoped.value.manifest as Record<string, unknown>).topics as Array<
            Record<string, unknown>
          >
        ).find((entry) => entry.topic_id === 'obligation:r9000-p0-identity'),
        'fixture identity obligation topic is absent',
      );
      expect(topic.allowed_dispositions).not.toContain('REUSED_FRESH_PASS');
      expect((topic.freshness_proof as Record<string, unknown>).method).toBe('recheck-required');
    });

    it.each([
      ['fail-disposition', 'REVIEW_TOPIC_NOT_PASSING'],
      ['blocked-disposition', 'REVIEW_TOPIC_NOT_PASSING'],
      ['unresolved-p1', 'REVIEW_PASS_INVALID'],
    ])('forbids PASS with %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const review = passingResult(scoped.value.manifest as Record<string, unknown>, frozen);
      const dispositions = review.dispositions as Array<Record<string, unknown>>;
      const disposition = required(dispositions[0], 'fixture review result has no dispositions');
      if (kind === 'fail-disposition') disposition.disposition = 'RECHECKED_FAIL';
      if (kind === 'blocked-disposition') disposition.disposition = 'BLOCKED';
      if (kind === 'unresolved-p1') {
        review.findings = [
          {
            finding_id: 'OPEN-1',
            defect_class_id: 'OPEN_CLASS',
            severity: 'P1',
            topic_ids: [disposition.topic_id],
            evidence: 'unresolved fixture evidence',
            population_query: 'Enumerate the unresolved fixture population.',
            affected_instances: ['instance-a'],
            repair_acceptance: 'Repair instance-a.',
          },
        ];
      }
      const dispositionCounts = {
        RECHECKED_PASS: dispositions.filter(({ disposition }) => disposition === 'RECHECKED_PASS')
          .length,
        RECHECKED_FAIL: dispositions.filter(({ disposition }) => disposition === 'RECHECKED_FAIL')
          .length,
        REUSED_FRESH_PASS: 0,
        BLOCKED: dispositions.filter(({ disposition }) => disposition === 'BLOCKED').length,
      };
      review.terminal = {
        verdict: 'PASS',
        topic_count: dispositions.length,
        disposition_counts: dispositionCounts,
        finding_count: (review.findings as unknown[]).length,
        complete: true,
      };
      putJson(
        current.root,
        'fixture/invalid-pass.json',
        selfDigest(review, 'result_digest_sha256'),
      );
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/invalid-pass.json',
        ]),
        code,
      );
    });

    it('consumes a transport attempt for parseable schema-invalid JSON', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      expect(scope(current, frozen).status).toBe(0);
      putJson(current.root, 'fixture/schema-invalid.json', { schemaVersion: '2.0.0' });
      const args = [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/schema-invalid.json',
      ];
      expectCode(run(current, 'review-check', args), 'REVIEW_RESULT_INVALID');
      expectCode(run(current, 'review-check', args), 'REVIEW_TRANSPORT_BLOCKED');
    });

    it('rejects an otherwise parseable JSONL stream containing an unknown record type', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const review = passingResult(scoped.value.manifest as Record<string, unknown>, frozen);
      const header: Record<string, unknown> = { type: 'header', ...review };
      delete header.dispositions;
      delete header.findings;
      delete header.terminal;
      const lines = [
        header,
        ...(review.dispositions as Array<Record<string, unknown>>).map((entry) => ({
          type: 'disposition',
          ...entry,
        })),
        { type: 'unknown-record', payload: 'must not be ignored' },
        { type: 'terminal', ...(review.terminal as Record<string, unknown>) },
      ];
      put(current.root, 'fixture/unknown-record.jsonl', lines.map(canonical).join(''));
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/unknown-record.jsonl',
        ]),
        'REVIEW_JSONL_NON_CANONICAL',
      );
    });
  });

  describe('C2-F007 authenticated bounded review transitions', () => {
    it.each([
      ['PASS', 'CYCLE_1_ACTIVE', 1, true],
      ['PASS', 'CYCLE_1_ACTIVE', 2, false],
      ['PASS', 'CYCLE_2_ACTIVE', 1, false],
      ['PASS', 'CYCLE_2_ACTIVE', 2, true],
      ['ESCALATION_REQUIRED', 'CYCLE_1_ACTIVE', 1, false],
      ['ESCALATION_REQUIRED', 'CYCLE_1_ACTIVE', 2, false],
      ['ESCALATION_REQUIRED', 'CYCLE_2_ACTIVE', 1, false],
      ['ESCALATION_REQUIRED', 'CYCLE_2_ACTIVE', 2, true],
      ['REVIEW_TRANSPORT_BLOCKED', 'CYCLE_1_ACTIVE', 1, true],
      ['REVIEW_TRANSPORT_BLOCKED', 'CYCLE_1_ACTIVE', 2, false],
      ['REVIEW_TRANSPORT_BLOCKED', 'CYCLE_2_ACTIVE', 1, false],
      ['REVIEW_TRANSPORT_BLOCKED', 'CYCLE_2_ACTIVE', 2, true],
    ] as const)(
      'authenticates terminal %s only from %s in cycle %i (authorized=%s)',
      (terminal, predecessor, cycle, authorized) => {
        const { current, frozen } = materializeTerminal(terminal, predecessor, cycle);
        const statePath = `${STATE}/review-state.json`;
        const before = readFileSync(join(current.root, statePath), 'utf8');
        const result = scope(current, frozen, 1);
        expect(result.status).toBe(1);
        expect(readFileSync(join(current.root, statePath), 'utf8')).toBe(before);
        const resultCodes = codes(result);
        const status = run(current, 'status');
        if (authorized) {
          expect(resultCodes).toContain('REVIEW_STATE_TERMINAL');
          expect(resultCodes).not.toContain('REVIEW_STATE_TRANSITION_INVALID');
          expect(status.value).toMatchObject({
            state: terminal,
            substantive_cycles: { used: cycle, maximum: 2 },
          });
        } else {
          expect(resultCodes).toContain(
            terminal === 'ESCALATION_REQUIRED' && cycle === 1
              ? 'REVIEW_STATE_CYCLE_INVALID'
              : 'REVIEW_STATE_TRANSITION_INVALID',
          );
          expect(resultCodes).not.toContain('REVIEW_STATE_TERMINAL');
          expect(status.value).toMatchObject({
            state: 'DRAFT',
            substantive_cycles: { used: 0, maximum: 2 },
          });
        }
      },
    );

    it.each([
      ['malformed-state', 'REVIEW_STATE_MALFORMED'],
      ['forged-state', 'REVIEW_STATE_SELF_DIGEST_INVALID'],
      ['cross-identity-state', 'REVIEW_STATE_IDENTITY_INVALID'],
    ])('rejects %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const statePath = `${STATE}/review-state.json`;
      const result = passingResult(scoped.value.manifest as Record<string, unknown>, frozen);
      if (kind === 'malformed-state') put(current.root, statePath, '{');
      else {
        const state = readJson(current.root, statePath);
        state.candidate_sha = '0'.repeat(40);
        putJson(
          current.root,
          statePath,
          kind === 'forged-state' ? state : selfDigest(state, 'state_digest_sha256'),
        );
      }
      putJson(current.root, 'fixture/pass.json', result);
      expectCode(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/pass.json',
        ]),
        code,
      );
    });

    it('blocks the second invalid transport and every successor from the terminal state', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      expect(scope(current, frozen).status).toBe(0);
      put(current.root, 'fixture/malformed.jsonl', '{');
      const args = [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/malformed.jsonl',
      ];
      expect(run(current, 'review-check', args).status).toBe(1);
      expectCode(run(current, 'review-check', args), 'REVIEW_TRANSPORT_BLOCKED');
      expectCode(run(current, 'review-check', args), 'REVIEW_STATE_TERMINAL');
    });

    it('accepts the full failure, complete repair, distinct candidate, and cycle-2 path', () => {
      const current = fixture(true);
      const first = freeze(current);
      const firstScope = scope(current, first);
      expect(firstScope.status).toBe(0);
      const fail = passingResult(firstScope.value.manifest as Record<string, unknown>, first);
      const disposition = required(
        (fail.dispositions as Array<Record<string, unknown>>)[0],
        'fixture review result has no dispositions',
      );
      disposition.disposition = 'RECHECKED_FAIL';
      disposition.finding_ids = ['FIX-1'];
      refreshDispositionProof(disposition);
      fail.findings = [
        {
          finding_id: 'FIX-1',
          defect_class_id: 'FIXTURE_CLASS',
          severity: 'P1',
          topic_ids: [disposition.topic_id],
          evidence: 'fixture failure',
          population_query: 'Enumerate fixture instances.',
          affected_instances: ['instance-a'],
          repair_acceptance: 'Repair instance-a.',
        },
      ];
      fail.terminal = {
        verdict: 'FAIL',
        topic_count: (fail.dispositions as unknown[]).length,
        disposition_counts: {
          RECHECKED_PASS: (fail.dispositions as unknown[]).length - 1,
          RECHECKED_FAIL: 1,
          REUSED_FRESH_PASS: 0,
          BLOCKED: 0,
        },
        finding_count: 1,
        complete: true,
      };
      putJson(current.root, 'fixture/fail.json', selfDigest(fail, 'result_digest_sha256'));
      const reviewed = run(current, 'review-check', [
        '--candidate',
        first.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/fail.json',
      ]);
      expect(reviewed.status).toBe(1);
      expect(reviewed.value.state, JSON.stringify(reviewed.value, null, 2)).toBe('REPAIR_REQUIRED');
      put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
      const secondCandidate = commit(current.root, 'complete fixture repair');
      const priorState = readJson(current.root, `${STATE}/review-state.json`);
      const second = freeze(current, secondCandidate);
      const repair = repairEvidence(
        first,
        (firstScope.value.manifest as Record<string, unknown>).manifest_digest_sha256 as string,
        readJson(current.root, 'fixture/fail.json').result_digest_sha256 as string,
        priorState.state_digest_sha256 as string,
        second,
      );
      putJson(current.root, `${STATE}/review-repair-evidence.json`, repair);
      const secondScope = scope(current, second, 2);
      expect(secondScope.status).toBe(0);
      const pass = passingResult(secondScope.value.manifest as Record<string, unknown>, second);
      putJson(current.root, 'fixture/cycle2-pass.json', pass);
      expect(
        run(current, 'review-check', [
          '--candidate',
          secondCandidate,
          '--cycle',
          '2',
          '--review-result',
          'fixture/cycle2-pass.json',
        ]).status,
      ).toBe(0);
    });

    it.each([
      'prior_failure_transition_digest',
      'prior_failure_transport_digest',
      'new_candidate_manifest_digest',
      'repair_state_before_digest',
    ])('rejects a forged v2 repair identity link: %s', (field) => {
      const current = fixture(true);
      const prepared = prepareRepairCandidate(current);
      prepared.repair[field] = '0'.repeat(64);
      putJson(
        current.root,
        `${STATE}/review-repair-evidence.json`,
        selfDigest(prepared.repair, 'repair_evidence_digest_sha256'),
      );
      expectCode(scope(current, prepared.second, 2), 'REVIEW_REPAIR_EVIDENCE_INCOMPLETE');
    });

    it.each(['prior-review', 'multi-finding', 'ancestry', 'diff', 'verification'])(
      'rejects unauthenticated or incomplete repair proof: %s',
      (kind) => {
        const current = fixture(true);
        const first = freeze(current);
        const firstScope = scope(current, first);
        expect(firstScope.status).toBe(0);
        const failure = passingResult(firstScope.value.manifest as Record<string, unknown>, first);
        const dispositions = failure.dispositions as Array<Record<string, unknown>>;
        const disposition = required(dispositions[0], 'fixture review result has no dispositions');
        disposition.disposition = 'RECHECKED_FAIL';
        disposition.finding_ids = ['REPAIR-1', 'REPAIR-2'];
        refreshDispositionProof(disposition);
        failure.findings = [
          {
            finding_id: 'REPAIR-1',
            defect_class_id: 'REPAIR_CLASS',
            severity: 'P1',
            topic_ids: [disposition.topic_id],
            evidence: 'first affected instance',
            population_query: 'Enumerate both repair instances.',
            affected_instances: ['instance-a'],
            repair_acceptance: 'Repair both instances.',
          },
          {
            finding_id: 'REPAIR-2',
            defect_class_id: 'REPAIR_CLASS',
            severity: 'P1',
            topic_ids: [disposition.topic_id],
            evidence: 'second affected instance',
            population_query: 'Enumerate both repair instances.',
            affected_instances: ['instance-b'],
            repair_acceptance: 'Repair both instances.',
          },
        ];
        failure.terminal = {
          verdict: 'FAIL',
          topic_count: dispositions.length,
          disposition_counts: {
            RECHECKED_PASS: dispositions.length - 1,
            RECHECKED_FAIL: 1,
            REUSED_FRESH_PASS: 0,
            BLOCKED: 0,
          },
          finding_count: 2,
          complete: true,
        };
        const failureRecord = selfDigest(failure, 'result_digest_sha256');
        putJson(current.root, 'fixture/repair-failure.json', failureRecord);
        expect(
          run(current, 'review-check', [
            '--candidate',
            first.candidate,
            '--cycle',
            '1',
            '--review-result',
            'fixture/repair-failure.json',
          ]).status,
        ).toBe(1);
        const priorState = readJson(current.root, `${STATE}/review-state.json`);
        put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
        const secondCandidate = commit(current.root, 'repair both affected instances');
        const second = freeze(current, secondCandidate);
        const repairBody = {
          schemaVersion: '2.0.0',
          round: ROUND,
          prior_candidate_sha: first.candidate,
          prior_candidate_manifest_digest: first.candidateManifest.manifest_digest_sha256,
          prior_review_scope_digest: (firstScope.value.manifest as Record<string, unknown>)
            .manifest_digest_sha256,
          prior_review_result_digest: failureRecord.result_digest_sha256,
          prior_failure_state_digest: priorState.state_digest_sha256,
          prior_failure_transition_digest: priorState.latest_transition_digest,
          prior_failure_transport_digest: priorState.current_transport_digest,
          new_candidate_sha: secondCandidate,
          new_candidate_manifest_digest: second.candidateManifest.manifest_digest_sha256,
          repair_state_before_digest: priorState.state_digest_sha256,
          repaired_classes: [
            {
              defect_class_id: 'REPAIR_CLASS',
              population_query: 'Enumerate both repair instances.',
              affected_instances: ['instance-a', 'instance-b'],
              repaired_instances: ['instance-a', 'instance-b'],
              changed_paths: ['packages/a/src/index.ts'],
              verification_refs: ['tests/a.test.ts'],
            },
          ],
        };
        if (kind === 'prior-review') repairBody.prior_review_result_digest = '0'.repeat(64);
        const repairedClass = required(
          repairBody.repaired_classes[0],
          'fixture repair evidence has no repaired classes',
        );
        if (kind === 'multi-finding') {
          repairedClass.affected_instances = ['instance-a'];
          repairedClass.repaired_instances = ['instance-a'];
        }
        if (kind === 'ancestry') repairBody.new_candidate_sha = first.candidate;
        if (kind === 'diff') repairedClass.changed_paths = ['package.json'];
        if (kind === 'verification') {
          repairedClass.verification_refs = ['tests/missing.test.ts'];
        }
        putJson(
          current.root,
          `${STATE}/review-repair-evidence.json`,
          selfDigest(repairBody, 'repair_evidence_digest_sha256'),
        );
        expectCode(scope(current, second, 2), 'REVIEW_REPAIR_EVIDENCE_INCOMPLETE');
      },
    );
  });

  describe('C2-F008 exact runtime materialized current claims', () => {
    it.each([
      ['registry-runtime', 'CLAIM_MATERIALIZATION_REQUIRED'],
      ['candidate', 'CLAIM_CANDIDATE_INVALID'],
      ['producer', 'CLAIM_RESOLVED_PRODUCER_INVALID'],
      ['producer-output', 'CLAIM_PRODUCER_OUTPUT_DIGEST_INVALID'],
      ['source-manifest', 'CLAIM_SOURCE_MANIFEST_INVALID'],
      ['source-digest', 'CLAIM_SOURCE_DIGEST_INVALID'],
      ['extracted-value', 'CLAIM_EXTRACTED_VALUE_INVALID'],
      ['value-digest', 'CLAIM_VALUE_DIGEST_INVALID'],
      ['rendered-marker', 'CLAIM_RENDERED_MARKER_INVALID'],
      ['rendered-content', 'CLAIM_RENDERED_CONTENT_DIGEST_INVALID'],
      ['rendered-value', 'CLAIM_RENDERED_VALUE_DIGEST_INVALID'],
      ['rendered-location-set', 'CLAIM_RENDERED_LOCATION_SET_INVALID'],
      ['rendered-verification', 'CLAIM_RENDERED_VERIFICATION_DIGEST_INVALID'],
      ['ledger-digest', 'CLAIM_LEDGER_SELF_DIGEST_INVALID'],
    ])('rejects independently mutated claim proof: %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const path = `${STATE}/current-claims.json`;
      const ledger = readJson(current.root, path);
      const claim = required(
        (ledger.claims as Array<Record<string, unknown>>)[0],
        'fixture claim ledger has no claims',
      );
      if (kind === 'registry-runtime') ledger.mode = 'registry';
      if (kind === 'candidate') ledger.candidate = '0'.repeat(40);
      if (kind === 'producer') claim.resolved_producer = ['node', 'fixture/other.mjs'];
      if (kind === 'producer-output') claim.producer_output_digest = '0'.repeat(64);
      if (kind === 'source-manifest')
        claim.source_manifest = [
          { path: 'tests/other.test.ts', state: 'absent', content_digest: null },
        ];
      if (kind === 'source-digest') claim.source_digest = '0'.repeat(64);
      if (kind === 'extracted-value') claim.extracted_value = 2;
      if (kind === 'value-digest') claim.value_digest = '0'.repeat(64);
      const proof = required(
        (claim.rendered_proofs as Array<Record<string, unknown>>)[0],
        'fixture claim has no rendered proof',
      );
      if (kind === 'rendered-marker') proof.claim_marker = 'DEVAI_CLAIM:other=';
      if (kind === 'rendered-content') proof.content_digest = '0'.repeat(64);
      if (kind === 'rendered-value') proof.extracted_rendered_value_digest = '0'.repeat(64);
      if (kind === 'rendered-location-set') claim.rendered_proofs = [];
      if (kind === 'rendered-verification') claim.rendered_verification_digest = '0'.repeat(64);
      if (kind === 'registry-runtime') ledger.claims_digest_sha256 = null;
      else if (kind !== 'ledger-digest') {
        const { claims_digest_sha256: _old, ...body } = ledger;
        ledger.claims_digest_sha256 = digestCanonical(body);
      } else ledger.claims_digest_sha256 = '0'.repeat(64);
      putJson(current.root, path, ledger);
      expectCode(run(current, 'claims-check', ['--candidate', frozen.candidate]), code);
    });

    it('accepts one fully authentic runtime ledger and ignores the declaration registry as evidence', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const result = run(current, 'claims-check', ['--candidate', frozen.candidate]);
      expect(result.status, JSON.stringify(result.value, null, 2)).toBe(0);
      expect(result.value.materialized_path).toBe(`${STATE}/current-claims.json`);
    });

    it.each([
      ['missing', 'CLAIM_POPULATION_INVALID'],
      ['unknown', 'CLAIM_UNKNOWN'],
      ['duplicate', 'CLAIM_POPULATION_INVALID'],
      ['placeholder', 'CLAIM_PLACEHOLDER_RESIDUE'],
    ])('rejects claim census or placeholder bypass: %s', (kind, code) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const path = `${STATE}/current-claims.json`;
      const ledger = readJson(current.root, path);
      const claims = ledger.claims as Array<Record<string, unknown>>;
      if (kind === 'missing') claims.splice(0, 1);
      if (kind === 'unknown')
        claims.push({
          ...required(claims[0], 'fixture claim ledger has no claims'),
          claim_id: 'unknown.claim',
        });
      if (kind === 'duplicate')
        claims.push(structuredClone(required(claims[0], 'fixture claim ledger has no claims')));
      if (kind === 'placeholder') {
        const renderedLocation = `work/audit/${ROUND}/as-built.md`;
        const rendered = 'TBD: replace placeholder before review\nDEVAI_CLAIM:suite.population=1\n';
        put(current.root, renderedLocation, rendered);
        const claim = required(claims[0], 'fixture claim ledger has no claims');
        const proof = required(
          (claim.rendered_proofs as Array<Record<string, unknown>>)[0],
          'fixture claim has no rendered proof',
        );
        const proofBody = {
          location: renderedLocation,
          claim_marker: 'DEVAI_CLAIM:suite.population=',
          content_digest: digestBytes(rendered),
          extracted_rendered_value_digest: digestCanonical(1),
        };
        claim.rendered_proofs = [
          { ...proof, ...proofBody, verification_digest: digestCanonical(proofBody) },
        ];
        claim.rendered_verification_digest = digestCanonical(claim.rendered_proofs);
      }
      const { claims_digest_sha256: _old, ...body } = ledger;
      ledger.claims_digest_sha256 = digestCanonical(body);
      putJson(current.root, path, ledger);
      expectCode(run(current, 'claims-check', ['--candidate', frozen.candidate]), code);
    });

    it('recomputes deferred post-publication declaration digests', () => {
      const current = fixture(true);
      const registryPath = `work/rounds/${ROUND}/current-claims.json`;
      const registry = readJson(current.root, registryPath);
      const declaration = required(
        (registry.claims as Array<Record<string, unknown>>)[0],
        'fixture claim registry has no declarations',
      );
      declaration.availability = 'post-publication';
      putJson(current.root, registryPath, registry);
      const candidate = commit(current.root, 'declare deferred post-publication claim');
      const frozen = freeze(current, candidate);
      const path = `${STATE}/current-claims.json`;
      const ledger = readJson(current.root, path);
      const claim = required(
        (ledger.claims as Array<Record<string, unknown>>)[0],
        'fixture claim ledger has no claims',
      );
      claim.proof_status = 'DEFERRED_POST_PUBLICATION';
      claim.source_digest = null;
      claim.value_digest = null;
      claim.deferred_proof = {
        required_at: 'post-publication',
        declaration_digest: '0'.repeat(64),
      };
      const {
        resolved_producer: _resolvedProducer,
        source_manifest: _sourceManifest,
        producer_output_digest: _producerOutputDigest,
        extracted_value: _extractedValue,
        rendered_proofs: _renderedProofs,
        rendered_verification_digest: _renderedVerificationDigest,
        ...deferredClaim
      } = claim;
      (ledger.claims as Array<Record<string, unknown>>)[0] = deferredClaim;
      const { claims_digest_sha256: _old, ...body } = ledger;
      ledger.claims_digest_sha256 = digestCanonical(body);
      putJson(current.root, path, ledger);
      expectCode(
        run(current, 'claims-check', ['--candidate', frozen.candidate]),
        'CLAIM_DEFERRED_INVALID',
      );
    });

    it('reads post-publication mode only from its dedicated path and binds the pre-review digest', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const preReview = readJson(current.root, `${STATE}/current-claims.json`);
      const postBody: Record<string, unknown> = {
        ...preReview,
        mode: 'post-publication',
        pre_review_claims_digest: preReview.claims_digest_sha256,
      };
      delete postBody.claims_digest_sha256;
      const post = { ...postBody, claims_digest_sha256: digestCanonical(postBody) };
      putJson(current.root, `${STATE}/current-claims-post-publication.json`, post);
      const result = run(current, 'claims-check', [
        '--candidate',
        frozen.candidate,
        '--phase',
        'post-publication',
      ]);
      expect(result.status).toBe(0);
      expect(result.value.materialized_path).toBe(`${STATE}/current-claims-post-publication.json`);
      expect(result.value.pre_review_claims_digest).toBe(preReview.claims_digest_sha256);
    });

    it('rejects a post-publication receipt that alters a copied pre-review claim', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const preReview = readJson(current.root, `${STATE}/current-claims.json`);
      const postBody: Record<string, unknown> = {
        ...structuredClone(preReview),
        mode: 'post-publication',
        pre_review_claims_digest: preReview.claims_digest_sha256,
      };
      delete postBody.claims_digest_sha256;
      const copiedClaim = required(
        (postBody.claims as Array<Record<string, unknown>>)[0],
        'post-publication fixture has no copied claim',
      );
      copiedClaim.extracted_value = 2;
      copiedClaim.value_digest = digestCanonical(2);
      const post = { ...postBody, claims_digest_sha256: digestCanonical(postBody) };
      putJson(current.root, `${STATE}/current-claims-post-publication.json`, post);
      expectCode(
        run(current, 'claims-check', [
          '--candidate',
          frozen.candidate,
          '--phase',
          'post-publication',
        ]),
        'CLAIM_PRE_REVIEW_CLAIM_INVALID',
      );
    });

    it('requires authenticated resolution for site_artifact_path rather than trusting ledger substitution', () => {
      const current = fixture(true);
      const registryPath = `work/rounds/${ROUND}/current-claims.json`;
      const registry = readJson(current.root, registryPath);
      const declaration = required(
        (registry.claims as Array<Record<string, unknown>>)[0],
        'fixture claim registry has no declarations',
      );
      declaration.producer = ['sha256sum', '{site_artifact_path}'];
      declaration.runtime_parameters = {
        site_artifact_path: { source: 'authenticated B8 artifact', required_at: 'materialization' },
      };
      declaration.source_paths = ['{site_artifact_path}'];
      putJson(current.root, registryPath, registry);
      const candidate = commit(current.root, 'declare site artifact parameter');
      expectCode(
        run(current, 'smart-converge', ['--base', current.base, '--head', candidate]),
        'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
      );
    });

    it('requires a nonempty authenticated special Git identity manifest for .git', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const ledger = readJson(current.root, `${STATE}/current-claims.json`);
      const claim = required(
        (ledger.claims as Array<Record<string, unknown>>)[0],
        'fixture claim ledger has no claims',
      );
      claim.source_paths = ['.git'];
      claim.source_manifest = [];
      const { claims_digest_sha256: _old, ...body } = ledger;
      ledger.claims_digest_sha256 = digestCanonical(body);
      putJson(current.root, `${STATE}/current-claims.json`, ledger);
      expectCode(
        run(current, 'claims-check', ['--candidate', frozen.candidate]),
        'CLAIM_GIT_IDENTITY_MANIFEST_INVALID',
      );
    });
  });

  it('smart-converge uses the v4 authenticated convergence and candidate artifact writer', () => {
    const current = fixture(true);
    put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
    const candidate = commit(current.root, 'exercise v4 artifact writer');
    const converged = run(current, 'smart-converge', ['--base', current.base, '--head', candidate]);
    expect(converged.status).toBe(0);
    const convergence = readJson(current.root, `${STATE}/convergence-evidence.json`);
    const candidateManifest = readJson(current.root, `${STATE}/candidate-manifest.json`);
    expect(validates(current.root, 'law/schemas/round-convergence.schema.json', convergence)).toBe(
      true,
    );
    expect(
      validates(current.root, 'law/schemas/candidate-manifest.schema.json', candidateManifest),
    ).toBe(true);
    expect(candidateManifest.convergence_digest).toBe(convergence.convergence_digest_sha256);
  });
});
