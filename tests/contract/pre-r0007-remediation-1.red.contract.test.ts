// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
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
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const ROUND = 'R-9000';
const STATE = `.devai/state/round-runs/${ROUND}/close`;
const roots: string[] = [];

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
  readonly candidate: string;
  readonly tree: string;
  readonly convergence: Record<string, unknown>;
  readonly candidateManifest: Record<string, unknown>;
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

function digestCanonical(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function digestBytes(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
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

function putJson(root: string, relativePath: string, value: unknown): void {
  put(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root: string, relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as Record<string, unknown>;
}

function sourceJson(relativePath: string): Record<string, unknown> {
  return readJson(ROOT, relativePath);
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

function fixture(bound = true): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-remediation1-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/\nfixture/out/**\n');

  const policy = structuredClone(sourceJson('law/policy/round-close-controls.json'));
  policy.policy_id = 'remediation-1-fixture';
  const convergence = policy.convergence as Record<string, unknown>;
  convergence.commands = (convergence.commands as Array<{ id: string }>).map(({ id }) => ({
    id,
    argv: ['node', 'fixture/gate.mjs', id],
  }));
  const freshness = policy.freshness as Record<string, unknown>;
  freshness.environment_allowlist = [];
  freshness.toolchain = [];
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
    sources: {
      authorization: `work/rounds/${ROUND}/AUTHORIZATION.md`,
      plan: `work/rounds/${ROUND}/plan.md`,
      orchestrator: `work/rounds/${ROUND}/prompts/00-orchestrator.md`,
      affected_test_graph: `work/rounds/${ROUND}/affected-test-graph.json`,
      obligations: `work/rounds/${ROUND}/review-obligations.json`,
      current_claims: `work/rounds/${ROUND}/current-claims.json`,
      additional_controls: ['product/owner-mandates/OM-900.md'],
      prior_findings: [],
      prior_finding_registry: `work/rounds/${ROUND}/prior-finding-registry.json`,
    },
    runtime: {
      state_root: STATE,
      candidate_manifest: `${STATE}/candidate-manifest.json`,
      convergence_evidence: `${STATE}/convergence-evidence.json`,
      review_scope: `${STATE}/review-scope-manifest.json`,
      review_result: `${STATE}/review-result.json`,
      materialized_claims: `${STATE}/current-claims.json`,
      review_state: `${STATE}/review-state.json`,
      review_transport: `${STATE}/review-transport.json`,
      review_repair_evidence: `${STATE}/review-repair-evidence.json`,
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
  put(root, `work/rounds/${ROUND}/AUTHORIZATION.md`, '# authorization\n');
  put(root, `work/rounds/${ROUND}/plan.md`, '# plan\n');
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
    schemaVersion: '1.0.0',
    graph_version: 'remediation-1-fixture',
    round: ROUND,
    population: {
      production: ['packages/*/src/**/*.ts'],
      tests: ['tests/**/*.test.ts'],
      classification: 'complete-or-full-suite-fallback',
    },
    shared_inputs: [],
    nodes: [
      node('unit-a', ['packages/a/src/**/*.ts', 'tests/a.test.ts']),
      { ...node('full-suite', ['packages/**/*.ts', 'tests/**/*.ts']), kind: 'fallback' },
      {
        ...node('full-coverage', ['packages/**/*.ts', 'tests/**/*.ts'], ['full-suite']),
        kind: 'fallback',
        coverage_mode: 'whole-only',
      },
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
    registry_version: 'remediation-1-fixture',
    round: ROUND,
    obligations: [
      {
        obligation_id: 'R9000-P0-IDENTITY',
        claim: 'Exact identity and proof populations are independently recomputed.',
        risk: 'P0',
        source_refs: [`work/rounds/${ROUND}/plan.md`],
        governing_paths: ['packages/**'],
        required_evidence: ['candidate manifest', 'convergence evidence'],
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
        defect_class_id: 'C2-F005',
        severity: 'P0',
        topic_ids: ['candidate-identity'],
        population_query: 'Mutate every candidate and convergence proof field.',
        affected_population: ['candidate manifest', 'convergence evidence'],
        repair_condition: 'Every proof independently authenticates and cross-binds.',
      },
      {
        defect_class_id: 'C2-F006',
        severity: 'P1',
        topic_ids: ['obligation:r9000-p0-identity'],
        population_query: 'Mutate every reused-topic proof.',
        affected_population: ['input manifest', 'evidence manifest', 'task keys'],
        repair_condition: 'Every current proof recomputes independently.',
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
    claims: [
      {
        claim_id: 'suite.population',
        volatility: 'tree',
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
  put(root, 'tests/a.test.ts', 'export const testA = true;\n');
  put(root, `work/audit/${ROUND}/as-built.md`, 'DEVAI_CLAIM:suite.population=1\n');
  if (bound) put(root, 'product/owner-mandates/OM-900.md', mandate(bindingMarker()));
  return { root, base: commit(root, 'fixture base') };
}

function materializeClaims(fixtureValue: Fixture, candidate: string): Record<string, unknown> {
  const sourcePath = 'tests/a.test.ts';
  const renderedLocation = `work/audit/${ROUND}/as-built.md`;
  const sourceManifest = [
    {
      path: sourcePath,
      state: 'present',
      content_digest: digestBytes(readFileSync(join(fixtureValue.root, sourcePath))),
    },
  ];
  const producerOutput = '{"count":1}';
  const extractedValue = 1;
  const renderedContent = readFileSync(join(fixtureValue.root, renderedLocation), 'utf8');
  const renderedProofBody = {
    location: renderedLocation,
    claim_marker: 'DEVAI_CLAIM:suite.population=',
    content_digest: digestBytes(renderedContent),
    extracted_rendered_value_digest: digestCanonical(extractedValue),
  };
  const renderedProof = {
    ...renderedProofBody,
    verification_digest: digestCanonical(renderedProofBody),
  };
  const ledgerBody = {
    schemaVersion: '2.0.0',
    ledger_version: 'remediation-1-fixture',
    round: ROUND,
    mode: 'materialized',
    candidate,
    claims: [
      {
        claim_id: 'suite.population',
        volatility: 'tree',
        producer: ['node', 'fixture/claim.mjs'],
        resolved_producer: ['node', 'fixture/claim.mjs'],
        extractor: '$.count',
        source_paths: [sourcePath],
        rendered_locations: [renderedLocation],
        source_manifest: sourceManifest,
        source_digest: digestCanonical(sourceManifest),
        producer_output_digest: digestBytes(producerOutput),
        extracted_value: extractedValue,
        value_digest: digestCanonical(extractedValue),
        rendered_proofs: [renderedProof],
        rendered_verification_digest: digestCanonical([renderedProof]),
      },
    ],
  };
  const ledger = {
    ...ledgerBody,
    claims_digest_sha256: digestCanonical(ledgerBody),
  };
  putJson(fixtureValue.root, `${STATE}/current-claims.json`, ledger);
  return ledger;
}

function freeze(fixtureValue: Fixture, candidate = 'HEAD'): Frozen {
  const exactCandidate = git(fixtureValue.root, ['rev-parse', candidate]);
  const tree = git(fixtureValue.root, ['rev-parse', `${exactCandidate}^{tree}`]);
  const policy = readJson(fixtureValue.root, 'law/policy/round-close-controls.json');
  const profile = readJson(fixtureValue.root, `work/rounds/${ROUND}/close-control-profile.json`);
  const graph = readJson(fixtureValue.root, `work/rounds/${ROUND}/affected-test-graph.json`);
  const claims = materializeClaims(fixtureValue, exactCandidate);
  const policyDigest = digestCanonical(policy);
  const profileDigest = digestCanonical(profile);
  const graphDigest = digestCanonical(graph);
  const candidateIdentity = digestCanonical({
    round: ROUND,
    base_sha: fixtureValue.base,
    candidate_sha: exactCandidate,
    tree_sha: tree,
    profile_digest: profileDigest,
    policy_digest: policyDigest,
    graph_digest: graphDigest,
  });
  const gateIds = (
    (policy.convergence as Record<string, unknown>).commands as Array<{ id: string }>
  ).map(({ id }) => id);
  const semanticPopulation = digestCanonical(gateIds);
  const pass = (passNumber: 1 | 2) => {
    const gateResults = gateIds.map((gate_id) => {
      const body = {
        gate_id,
        outcome: passNumber === 1 ? 'EXECUTED_PASS' : 'REUSED_FRESH_PASS',
        task_key: digestCanonical({ gate_id, exactCandidate }),
        output_digest: digestCanonical({ gate_id, output: 'PASS' }),
      };
      return { ...body, result_digest: digestCanonical(body) };
    });
    const body = {
      pass_number: passNumber,
      head_before: exactCandidate,
      head_after: exactCandidate,
      tree_sha: tree,
      clean_before: true,
      clean_after: true,
      writes: [],
      gate_results: gateResults,
      semantic_population_digest: semanticPopulation,
    };
    return { ...body, pass_digest_sha256: digestCanonical(body) };
  };
  const convergenceBody = {
    schemaVersion: '1.0.0',
    round: ROUND,
    exact_base: fixtureValue.base,
    candidate_sha: exactCandidate,
    candidate_tree: tree,
    candidate_identity_digest: candidateIdentity,
    policy_digest: policyDigest,
    profile_digest: profileDigest,
    authoritative_gate_ids: gateIds,
    authoritative_population_digest: semanticPopulation,
    passes: [pass(1), pass(2)],
  };
  const convergence = selfDigest(convergenceBody, 'convergence_digest_sha256');
  putJson(fixtureValue.root, `${STATE}/convergence-evidence.json`, convergence);
  const candidateBody = {
    schemaVersion: '2.0.0',
    round: ROUND,
    base_sha: fixtureValue.base,
    candidate_sha: exactCandidate,
    tree_sha: tree,
    profile_digest: profileDigest,
    policy_digest: policyDigest,
    graph_digest: graphDigest,
    candidate_identity_digest: candidateIdentity,
    convergence_digest: convergence.convergence_digest_sha256,
    claims_digest: claims.claims_digest_sha256,
    reviewer_binding_digest: digestCanonical(bindingMarker()),
  };
  const candidateManifest = selfDigest(candidateBody, 'manifest_digest_sha256');
  putJson(fixtureValue.root, `${STATE}/candidate-manifest.json`, candidateManifest);
  return { candidate: exactCandidate, tree, convergence, candidateManifest };
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
      candidate_sha: frozen.candidate,
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      review_scope_digest: links.review_scope_digest ?? null,
      review_result_digest: links.review_result_digest ?? null,
      transport_digest: links.transport_digest ?? null,
      repair_evidence_digest: links.repair_evidence_digest ?? null,
      previous_state_digest: links.previous_state_digest ?? null,
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
  return selfDigest(
    {
      schemaVersion: '2.0.0',
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
      transition_history: history,
      transport_attempts: 0,
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
      schemaVersion: '1.0.0',
      round: ROUND,
      cycle: 1,
      attempt,
      candidate_sha: frozen.candidate,
      candidate_manifest_digest: frozen.candidateManifest.manifest_digest_sha256,
      review_scope_digest: scopeDigest,
      reviewer_binding_digest: digestCanonical(bindingMarker()),
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
  secondCandidate: string,
): Record<string, unknown> {
  return selfDigest(
    {
      schemaVersion: '1.0.0',
      round: ROUND,
      prior_candidate_sha: first.candidate,
      prior_candidate_manifest_digest: first.candidateManifest.manifest_digest_sha256,
      prior_review_scope_digest: firstScopeDigest,
      prior_review_result_digest: failureResultDigest,
      prior_failure_state_digest: failureStateDigest,
      new_candidate_sha: secondCandidate,
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
  candidateManifest: Record<string, unknown>,
  disposition = 'RECHECKED_PASS',
): Record<string, unknown> {
  const topics = manifest.topics as Array<Record<string, unknown>>;
  const dispositions = topics.map((topic) => ({
    topic_id: topic.topic_id,
    disposition,
    recomputed_digest: topic.current_digest,
    recomputed_inputs_manifest: [
      { source: 'work/rounds/R-9000/plan.md', digest: digestCanonical('current input') },
    ],
    recomputed_evidence_manifest: [
      { ref: 'candidate manifest', digest: candidateManifest.manifest_digest_sha256 },
    ],
    recomputed_evidence_digest: digestCanonical([
      { ref: 'candidate manifest', digest: candidateManifest.manifest_digest_sha256 },
    ]),
    recomputed_task_keys:
      disposition === 'REUSED_FRESH_PASS' ? [digestCanonical({ task: topic.topic_id })] : [],
    evidence_refs: ['candidate manifest'],
    justification: 'Independently recomputed from current exact-candidate evidence.',
    finding_ids: [],
  }));
  const counts = {
    RECHECKED_PASS: disposition === 'RECHECKED_PASS' ? dispositions.length : 0,
    RECHECKED_FAIL: 0,
    REUSED_FRESH_PASS: disposition === 'REUSED_FRESH_PASS' ? dispositions.length : 0,
    BLOCKED: 0,
  };
  return selfDigest(
    {
      schemaVersion: '2.0.0',
      round: ROUND,
      cycle: manifest.cycle,
      review_candidate: manifest.review_candidate,
      manifest_digest: manifest.manifest_digest_sha256,
      policy_digest: manifest.policy_digest,
      candidate_manifest_digest: candidateManifest.manifest_digest_sha256,
      reviewer_binding_digest: digestCanonical(bindingMarker()),
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

function withAuthenticReuse(
  fixtureValue: Fixture,
  manifest: Record<string, unknown>,
  frozen: Frozen,
): Record<string, unknown> {
  const result = passingResult(manifest, frozen.candidateManifest);
  const topics = manifest.topics as Array<Record<string, unknown>>;
  const topic = topics.find((entry) =>
    (entry.allowed_dispositions as string[]).includes('REUSED_FRESH_PASS'),
  );
  if (topic === undefined) throw new Error('fixture has no reuse-eligible topic');
  const disposition = (result.dispositions as Array<Record<string, unknown>>).find(
    (entry) => entry.topic_id === topic.topic_id,
  );
  if (disposition === undefined) throw new Error('fixture reuse disposition is missing');
  const source = 'packages/a/src/index.ts';
  const blob = git(fixtureValue.root, ['rev-parse', `${frozen.candidate}:${source}`]);
  const inputs = [{ source, digest: digestBytes(blob) }];
  const independentlyRecomputedDigest = digestCanonical([
    { path: source, digest: digestBytes(blob) },
  ]);
  expect(independentlyRecomputedDigest).toBe(topic.current_digest);
  const evidence = [
    {
      ref: `${STATE}/candidate-manifest.json`,
      digest: digestCanonical(frozen.candidateManifest),
    },
    {
      ref: `${STATE}/convergence-evidence.json`,
      digest: digestCanonical(frozen.convergence),
    },
  ];
  const passTwo = (frozen.convergence.passes as Array<Record<string, unknown>>)[1];
  const taskKeys = (passTwo.gate_results as Array<Record<string, unknown>>).map(
    (gate) => gate.task_key as string,
  );
  Object.assign(disposition, {
    disposition: 'REUSED_FRESH_PASS',
    recomputed_digest: independentlyRecomputedDigest,
    recomputed_inputs_manifest: inputs,
    recomputed_evidence_manifest: evidence,
    recomputed_evidence_digest: digestCanonical(evidence),
    recomputed_task_keys: taskKeys,
    evidence_refs: evidence.map(({ ref }) => ref),
    justification: 'Recomputed current blobs, exact evidence artifacts, and pass-2 task keys.',
  });
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

function expectCode(result: Result, code: string): void {
  expect(codes(result), `${result.stderr}\n${JSON.stringify(result.value, null, 2)}`).toContain(
    code,
  );
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('OM-015 / DII-248 remediation campaign 1 populations', () => {
  it('provides one schema-valid, independently self-digested fixture foundation', () => {
    const current = fixture(true);
    const frozen = freeze(current);
    const profile = readJson(current.root, `work/rounds/${ROUND}/close-control-profile.json`);
    const claims = readJson(current.root, `${STATE}/current-claims.json`);
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
        passes[1].gate_results = (passes[1].gate_results as unknown[]).slice(1);
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
  });

  describe('C2-F006 canonical findings and independently recomputed reuse', () => {
    it.each(['json', 'jsonl'])('rejects duplicate finding IDs in %s', (format) => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const result = passingResult(
        scoped.value.manifest as Record<string, unknown>,
        frozen.candidateManifest,
      );
      const topicId = (result.dispositions as Array<Record<string, unknown>>)[0].topic_id as string;
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
        const header = { type: 'header', ...body };
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

    it.each([
      ['missing-input', 'REVIEW_REUSE_INPUT_MANIFEST_MISSING'],
      ['stale-input', 'REVIEW_REUSE_INPUT_MANIFEST_STALE'],
      ['missing-evidence', 'REVIEW_REUSE_EVIDENCE_MANIFEST_MISSING'],
      ['stale-evidence', 'REVIEW_REUSE_EVIDENCE_DIGEST_INVALID'],
      ['empty-task-key', 'REVIEW_REUSE_TASK_KEY_REQUIRED'],
      ['stale-task-key', 'REVIEW_REUSE_TASK_KEY_STALE'],
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
      if (kind === 'missing-input') disposition.recomputed_inputs_manifest = [];
      if (kind === 'stale-input')
        disposition.recomputed_inputs_manifest = [{ source: 'wrong', digest: '0'.repeat(64) }];
      if (kind === 'missing-evidence') disposition.recomputed_evidence_manifest = [];
      if (kind === 'stale-evidence') disposition.recomputed_evidence_digest = '0'.repeat(64);
      if (kind === 'empty-task-key') disposition.recomputed_task_keys = [];
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

    it('accepts one authentic current reused-topic proof', () => {
      const current = fixture(true);
      const frozen = freeze(current);
      const scoped = scope(current, frozen);
      expect(scoped.status).toBe(0);
      const result = withAuthenticReuse(
        current,
        scoped.value.manifest as Record<string, unknown>,
        frozen,
      );
      putJson(current.root, 'fixture/reuse-pass.json', result);
      expect(
        run(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          '1',
          '--review-result',
          'fixture/reuse-pass.json',
        ]).status,
      ).toBe(0);
    });
  });

  describe('C2-F007 authenticated bounded review transitions', () => {
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
      const result = passingResult(
        scoped.value.manifest as Record<string, unknown>,
        frozen.candidateManifest,
      );
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
      const fail = passingResult(
        firstScope.value.manifest as Record<string, unknown>,
        first.candidateManifest,
      );
      const disposition = (fail.dispositions as Array<Record<string, unknown>>)[0];
      disposition.disposition = 'RECHECKED_FAIL';
      disposition.finding_ids = ['FIX-1'];
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
      expect(reviewed.value.state).toBe('REPAIR_REQUIRED');
      put(current.root, 'packages/a/src/index.ts', 'export const a = 2;\n');
      const secondCandidate = commit(current.root, 'complete fixture repair');
      const priorState = readJson(current.root, `${STATE}/review-state.json`);
      const repair = repairEvidence(
        first,
        (firstScope.value.manifest as Record<string, unknown>).manifest_digest_sha256 as string,
        readJson(current.root, 'fixture/fail.json').result_digest_sha256 as string,
        priorState.state_digest_sha256 as string,
        secondCandidate,
      );
      putJson(current.root, `${STATE}/review-repair-evidence.json`, repair);
      const second = freeze(current, secondCandidate);
      const secondScope = scope(current, second, 2);
      expect(secondScope.status).toBe(0);
      const pass = passingResult(
        secondScope.value.manifest as Record<string, unknown>,
        second.candidateManifest,
      );
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
      const claim = (ledger.claims as Array<Record<string, unknown>>)[0];
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
      const proof = (claim.rendered_proofs as Array<Record<string, unknown>>)[0];
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
  });
});
