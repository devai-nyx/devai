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
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { expect } from 'vitest';

// This module lives at tests/contract/helpers, one level deeper than the contract files
// it was extracted from, so the repository root is three levels up rather than two.
export const ROOT = resolve(import.meta.dirname, '../../..');
export const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
export const ROUND = 'R-9000';
export const STATE = `.devai/state/round-runs/${ROUND}/close`;
export const roots: string[] = [];
export let convergedTemplate: Fixture | null = null;

export interface Fixture {
  readonly root: string;
  readonly base: string;
}

export interface Result {
  readonly status: number | null;
  readonly value: Record<string, unknown>;
  readonly stderr: string;
}

export interface Frozen {
  readonly root: string;
  readonly candidate: string;
  readonly tree: string;
  readonly convergence: Record<string, unknown>;
  readonly candidateManifest: Record<string, unknown>;
}

export function stable(value: unknown): unknown {
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

export function canonical(value: unknown): string {
  return `${JSON.stringify(stable(value))}\n`;
}

export function digestCanonical(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

export function digestBytes(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function required<T>(value: T | null | undefined, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}

export function selfDigest(value: Record<string, unknown>, field: string): Record<string, unknown> {
  const { [field]: _omitted, ...body } = value;
  return { ...body, [field]: digestCanonical(body) };
}

export function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

export function putBytes(root: string, relativePath: string, contents: Buffer): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

export function putJson(root: string, relativePath: string, value: unknown): void {
  put(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readJson(root: string, relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as Record<string, unknown>;
}

export function sourceJson(relativePath: string): Record<string, unknown> {
  return readJson(ROOT, relativePath);
}

export function v5GraphControls(gateIds: readonly string[]): Record<string, unknown> {
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
    // Fixture gates are `node fixture/gate.mjs <id>`, so the derivation yields one
    // direct script, the node program, and fixture/gate.mjs as the scanned executable.
    // The closure digest is declared explicitly: the controller now compares it under a
    // generic capability rather than only for one profile decision id, so a fixture that
    // omits it is genuinely incomplete.
    command_closure: gateIds.map((gate_id) => ({
      gate_id,
      derivation: 'recursive-policy-command-v1',
      scripts: [`direct:${gate_id}`],
      programs: ['node'],
      closure_digest: digestCanonical({
        scripts: [`direct:${gate_id}`],
        programs: ['node'],
        executables: ['fixture/gate.mjs'],
        project_references: [],
      }),
    })),
  };
}

export function copy(root: string, relativePath: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, relativePath), target);
}

export function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

export function gitBytes(root: string, args: readonly string[]): Buffer {
  return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
}

export function commit(root: string, subject: string): string {
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

export function run(fixtureValue: Fixture, command: string, args: readonly string[] = []): Result {
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

export function codes(result: Result): string[] {
  return ((result.value.findings ?? []) as Array<{ code: string }>).map(({ code }) => code);
}

export function bindingMarker(model = 'reviewer-exact-v1'): Record<string, unknown> {
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

export function mandate(
  marker: Record<string, unknown>,
  container: { id: string; status: string; authority: string } = {
    id: 'OM-900',
    status: 'active',
    authority: 'Owner',
  },
): string {
  return `---\nid: ${container.id}\nstatus: ${container.status}\nauthority: ${container.authority}\n---\n\n# Fixture Owner mandate\n\n\`\`\`json\n${JSON.stringify(marker, null, 2)}\n\`\`\`\n`;
}

export function validates(root: string, schemaPath: string, value: unknown): boolean {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const commonPath = join(root, 'law/schemas/common-defs.schema.json');
  if (existsSync(commonPath)) ajv.addSchema(readJson(root, 'law/schemas/common-defs.schema.json'));
  return ajv.compile(readJson(root, schemaPath))(value) as boolean;
}

export function buildFixture(bound = true, register = true): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-remediation1-'));
  if (register) roots.push(root);
  git(root, ['init', '-q']);
  put(
    root,
    '.gitignore',
    '.devai/state/\nfixture/out/**\nfixture/gate-log.txt\nfixture/fail-gate.txt\n',
  );

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
      obligation_baseline: `work/rounds/${ROUND}/review-obligation-baseline.json`,
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
  putJson(root, `work/rounds/${ROUND}/review-obligation-baseline.json`, {
    schemaVersion: '1.0.0',
    round: ROUND,
    authority_decision: 'DII-900',
    derivation: 'independent-policy-baseline',
    obligation_ids: ['R9000-P0-IDENTITY'],
    normative_source_paths: [`work/rounds/${ROUND}/plan.md`],
    required_checks: [
      'exact-source-population',
      'exact-obligation-population',
      'unique-source-paths',
      'unique-obligation-identities',
      'source-byte-digests',
      'every-source-mapped',
      'every-obligation-mapped',
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
  put(
    root,
    'fixture/gate.mjs',
    `import { appendFileSync, existsSync, readFileSync } from 'node:fs';
export const gate = process.argv[2] ?? '';
appendFileSync('fixture/gate-log.txt', \`${'${gate}'}\\n\`);
export const fail = existsSync('fixture/fail-gate.txt')
  ? readFileSync('fixture/fail-gate.txt', 'utf8').trim()
  : '';
if (gate === fail) process.exitCode = 19;
else process.stdout.write('PASS\\n');
`,
  );
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

export function fixture(bound = true): Fixture {
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

export function freeze(fixtureValue: Fixture, candidate = 'HEAD'): Frozen {
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
export function transition(
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

export function stateChain(
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
    const entryCycle = /CYCLE_2|NEW_CANDIDATE/u.test(`${String(body.from)}:${String(body.to)}`)
      ? 2
      : 1;
    // Per DII-252 the predecessor identity is the predecessor artifact self-digest, so a
    // fixture must retain an artifact rather than assert a bare value. Patching the field
    // alone would satisfy the corroboration check only because no artifact existed to
    // contradict it, which is not what the contract asks for.
    let retainedPredecessorDigest: string | null = null;
    if (index > 0) {
      const predecessor = selfDigest(
        {
          schemaVersion: '3.0.0',
          round: ROUND,
          state: String(body.from),
          cycle: entryCycle,
          candidate_sha: frozen.candidate,
          tree_sha: frozen.tree,
        },
        'state_digest_sha256',
      );
      retainedPredecessorDigest = predecessor.state_digest_sha256 as string;
      putJson(
        fixtureValue.root,
        `${STATE}/review-states/${retainedPredecessorDigest}.json`,
        predecessor,
      );
    }
    const normalized = selfDigest(
      {
        ...body,
        ordinal: index + 1,
        cycle: entryCycle,
        previous_state_digest: retainedPredecessorDigest,
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

export function transportEvidence(
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

export function repairEvidence(
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

export function scope(fixtureValue: Fixture, frozen: Frozen, cycle: 1 | 2 = 1): Result {
  return run(fixtureValue, 'review-scope', [
    '--base',
    fixtureValue.base,
    '--candidate',
    frozen.candidate,
    '--cycle',
    String(cycle),
  ]);
}

export function passingResult(
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

export function refreshDispositionProof(disposition: Record<string, unknown>): void {
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

export function failingResult(
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

export function prepareRepairCandidate(current: Fixture): {
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

export function enterCycleTwo(current: Fixture): {
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

export function redigestState(state: Record<string, unknown>): Record<string, unknown> {
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

export function materializeTerminal(
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

export function withAuthenticReuse(
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

export function reusableTopic(manifest: Record<string, unknown>): Record<string, unknown> {
  return required(
    (manifest.topics as Array<Record<string, unknown>>).find((topic) =>
      (topic.allowed_dispositions as string[]).includes('REUSED_FRESH_PASS'),
    ),
    'fixture has no reuse-eligible topic',
  );
}

export function topicEvidenceRef(
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
        const [rawStatus, rawFirst, second] = line.split('\t');
        const status = required(rawStatus, 'exact range status is missing');
        const first = required(rawFirst, 'exact range path is missing');
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

export function completeTopicEvidence(
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

export function withCompleteTopicReuse(
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

export function expectCode(result: Result, code: string): void {
  expect(codes(result), `${result.stderr}\n${JSON.stringify(result.value, null, 2)}`).toContain(
    code,
  );
}

export function disposeHarness(): void {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  if (convergedTemplate !== null) {
    rmSync(convergedTemplate.root, { recursive: true, force: true });
    convergedTemplate = null;
  }
}
