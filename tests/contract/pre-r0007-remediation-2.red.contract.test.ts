// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const CONTROLLER_PATH = 'scripts/run-round-close-controls.mjs';
const GRAPH_PATH = 'work/rounds/R-0007/affected-test-graph.json';
const POLICY_PATH = 'law/policy/round-close-controls.json';
const PROFILE_PATH = 'work/rounds/R-0007/close-control-profile.json';
const OBLIGATIONS_PATH = 'work/rounds/R-0007/review-obligations.json';
const MATRIX_PATH = 'work/rounds/R-0007/remediation-2-closure-matrix.json';

interface GateProfile {
  readonly gate_id: string;
  readonly input_selectors: readonly string[];
  readonly dependency_selectors: readonly string[];
  readonly toolchain_probe_ids: readonly string[];
  readonly environment_input_ids: readonly string[];
  readonly required_outputs: readonly string[];
  readonly universal_input_proof?: string;
  readonly output_observation?: string;
}

interface ClosureClass {
  readonly finding_id: string;
  readonly expected_complete_population: readonly string[];
  readonly test_ids: readonly string[];
}

function json<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as T;
}

function source(path = CONTROLLER_PATH): string {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function required<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) throw new Error(`${label} is required`);
  return value;
}

const policy = json<{
  decision_id: string;
  schemas: Record<string, string>;
  freshness: {
    toolchain: Array<{ id: string }>;
    environment_allowlist: Array<{ name: string }>;
  };
  convergence: { commands: Array<{ id: string; freshness_profile: string }> };
  active_control_census: Record<string, unknown>;
}>(POLICY_PATH);
const graph = json<{
  population: Record<string, string[]>;
  nodes: Array<{ id: string; input_selectors: string[] }>;
  gate_freshness_profiles: GateProfile[];
  command_closure?: Array<{ gate_id: string; scripts: string[]; programs: string[] }>;
}>(GRAPH_PATH);
const profile = json<{
  decision_id: string;
  sources: Record<string, unknown>;
}>(PROFILE_PATH);
const obligations = json<{
  obligations: Array<{ obligation_id: string }>;
  normative_sources?: Array<{
    path: string;
    source_digest_sha256: string;
    obligation_ids: string[];
  }>;
}>(OBLIGATIONS_PATH);
const matrix = json<{ classes: ClosureClass[] }>(MATRIX_PATH);
const controller = source();
const thisSource = source('tests/contract/pre-r0007-remediation-2.red.contract.test.ts');

describe('OM-016 / DII-249 remediation campaign 2 complete populations', () => {
  it('binds all eight findings to present exact Inspector IDs', () => {
    expect(matrix.classes.map(({ finding_id }) => finding_id)).toEqual([
      'R2-F001',
      'R2-F002',
      'R2-F003',
      'R2-F004',
      'R2-F005',
      'R2-F006',
      'R2-F007',
      'R2-F008',
    ]);
    const ids = matrix.classes.flatMap(({ test_ids }) => test_ids);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(thisSource, id).toContain(id);
  });

  describe('R2-F001 complete authoritative candidate gate', () => {
    it('R2-001-ROSTER-EXACT retains the exact ordered sixteen-gate population', () => {
      const expected = required(
        matrix.classes[0],
        'R2-F001 matrix row',
      ).expected_complete_population;
      expect(policy.convergence.commands.map(({ id }) => id)).toEqual(expected);
      expect(policy.convergence.commands.map(({ freshness_profile }) => freshness_profile)).toEqual(
        expected,
      );
    });

    it('R2-001-FORMATTING-RED makes the exact repository-wide formatting gate terminal', () => {
      const result = spawnSync('pnpm', ['exec', 'prettier', '--check', '.'], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    });
  });

  describe('R2-F002 mechanically complete gate freshness', () => {
    it('R2-002-ALL-GATES-CLOSED requires one universal proof-bearing profile per gate', () => {
      expect(graph.gate_freshness_profiles).toHaveLength(16);
      expect(graph.gate_freshness_profiles.map(({ gate_id }) => gate_id)).toEqual(
        policy.convergence.commands.map(({ id }) => id),
      );
      for (const entry of graph.gate_freshness_profiles)
        expect(entry.universal_input_proof, entry.gate_id).toBe('tracked-candidate-tree');
    });

    it('R2-002-SCRIPT-CLOSURE binds every gate to deterministic recursive scripts and programs', () => {
      expect(graph.command_closure?.map(({ gate_id }) => gate_id)).toEqual(
        policy.convergence.commands.map(({ id }) => id),
      );
      for (const closure of graph.command_closure ?? []) {
        expect(closure.scripts.length, closure.gate_id).toBeGreaterThan(0);
        expect(closure.programs.length, closure.gate_id).toBeGreaterThan(0);
      }
      expect(controller).toContain('validateGateCommandClosureV6');
    });

    it('R2-002-UNIVERSAL-INPUTS proves the complete tracked tree and dependency universe', () => {
      for (const entry of graph.gate_freshness_profiles) {
        expect(entry.input_selectors, entry.gate_id).toContain('**/*');
        expect(entry.dependency_selectors, entry.gate_id).toContain('**/*');
      }
    });

    it('R2-002-ENVIRONMENT-COMPLETE binds every probe and the whole environment digest', () => {
      const probes = policy.freshness.toolchain.map(({ id }) => id).sort();
      for (const entry of graph.gate_freshness_profiles) {
        expect([...entry.toolchain_probe_ids].sort(), entry.gate_id).toEqual(probes);
        expect(entry.environment_input_ids, entry.gate_id).toContain('__ALL_ENVIRONMENT__');
      }
      expect(controller).toContain('completeEnvironmentManifestV6');
    });

    it('R2-002-OUTPUTS-COMPLETE observes declared and actual persistent outputs', () => {
      for (const entry of graph.gate_freshness_profiles)
        expect(entry.output_observation, entry.gate_id).toBe('declared-plus-observed');
      expect(controller).toContain('observedPersistentOutputsV6');
    });
  });

  describe('R2-F003 every tracked asset and ambiguous loader', () => {
    it('R2-003-TRACKED-UNIVERSE starts unknown classification from every tracked path', () => {
      expect(graph.population.all_tracked).toEqual(['**/*']);
    });

    it('R2-003-RUNTIME-ASSETS maps prompts, templates, fixtures, and package configuration', () => {
      const selectors = graph.nodes.flatMap(({ input_selectors }) => input_selectors);
      expect(selectors).toEqual(
        expect.arrayContaining([
          'packages/cli/tests/**/*.json',
          'packages/effects-check/tests/**/tsconfig.json',
          'packages/skills/prompts/**',
          'packages/skills/test-fixtures/**',
        ]),
      );
    });

    it('R2-003-COMPUTED-LOADERS uses one conservative loader classifier', () => {
      expect(controller).toContain('hasAmbiguousLoaderV6');
      for (const family of [
        'import(',
        'require(',
        'require.resolve(',
        'import.meta.resolve(',
        'createRequire(',
        'module.require(',
        'eval(',
      ])
        expect(controller, family).toContain(family);
    });

    it('R2-003-UNKNOWN-FALLBACK never filters unknown paths through a partial population', () => {
      expect(controller).not.toMatch(
        /const unknown = range\.paths\.filter\([\s\S]{0,250}selectorsMatch\(path, population\)/u,
      );
      expect(controller).toContain("'UNKNOWN_DEPENDENCY'");
      expect(controller).toContain("'COVERAGE_RELEVANT_CHANGE'");
    });
  });

  describe('R2-F004 typed byte-backed evidence for every topic', () => {
    it('R2-004-NO-SYNTHETIC-EVIDENCE removes prose-derived evidence digests', () => {
      expect(controller).not.toContain('mechanical-evidence-obligation');
      expect(controller).toContain('UNRESOLVED_TOPIC_EVIDENCE');
    });

    it('R2-004-SEVEN-CLASS-RESOLUTION implements typed resolvers for the full topic census', () => {
      expect(controller).toContain('resolveTopicEvidenceV6');
      for (const kind of [
        'semantic-obligation',
        'changed-path',
        'active-control',
        'current-claim',
        'previous-finding-class',
        'candidate-identity',
        'convergence-evidence',
      ])
        expect(controller, kind).toContain(kind);
    });

    it('R2-004-SUBSTITUTION-REJECTED reauthenticates typed evidence before disposition use', () => {
      expect(controller).toContain('authenticateTypedEvidenceV6');
      expect(controller).toContain('REVIEW_EVIDENCE_IDENTITY_INVALID');
    });
  });

  describe('R2-F005 independently reconstructable state and transport chain', () => {
    it('R2-005-ALL-EDGES validates every edge and edge cycle against policy', () => {
      expect(controller).toContain('validateTransitionEdgeV6');
      expect(controller).toContain('REVIEW_STATE_TRANSITION_EDGE_INVALID');
      expect(controller).toContain('REVIEW_STATE_TRANSITION_CYCLE_INVALID');
    });

    it('R2-005-PREDECESSOR-STATES reconstructs every predecessor state identity', () => {
      expect(controller).toContain('reconstructStateIdentityV6');
      expect(controller).toContain('REVIEW_STATE_PREDECESSOR_STATE_INVALID');
    });

    it('R2-005-TRANSPORT-IDENTITY compares the complete persisted attempt identity', () => {
      expect(controller).toContain('reauthenticateTransportV6');
      for (const field of [
        'round',
        'cycle',
        'candidate_sha',
        'tree_sha',
        'policy_digest',
        'profile_digest',
        'manifest_digest',
        'scope_digest',
        'reviewer_binding_digest',
        'active_control_census_digest',
        'state_before_digest',
      ])
        expect(controller, field).toContain(field);
    });

    it('R2-005-RESULT-REAUTH reruns identity, counts, terminal, topic, and finding validation', () => {
      expect(controller).toContain('reauthenticateReviewResultV6');
      expect(controller).toContain('REVIEW_STATE_RESULT_COUNTS_INVALID');
      expect(controller).toContain('REVIEW_STATE_RESULT_TERMINAL_INVALID');
    });

    it('R2-005-REPAIR-V2-REAUTH reruns schema and every prior-failure repair link', () => {
      expect(controller).toContain('reauthenticateRepairEvidenceV6');
      expect(controller).toContain('REVIEW_STATE_REPAIR_LINK_INVALID');
    });
  });

  describe('R2-F006 structured exact-candidate active-control provenance', () => {
    it('R2-006-TRANSITIVE-PROVENANCE binds policy and profile to the DII-249 graph', () => {
      expect(policy.decision_id).toBe('DII-249');
      expect(profile.decision_id).toBe('DII-249');
      expect(policy.schemas.control_provenance).toBe('law/schemas/control-provenance.schema.json');
      expect(profile.sources.control_provenance).toBe('work/rounds/R-0007/control-provenance.json');
    });

    it('R2-006-NO-ALLOWLIST-AUTHORITY removes hardcoded decisions and profile authority', () => {
      expect(controller).not.toContain("'DII-246',\n    'DII-248'");
      expect(controller).not.toContain('requiredDecisions.join');
      expect(controller).not.toMatch(
        /for \(const path of context\.profile\.sources\.additional_controls[\s\S]{0,1200}add\(/u,
      );
    });

    it('R2-006-RAW-BLOBS parses and digests real decision and mandate sources', () => {
      expect(controller).toContain('deriveControlProvenanceV6');
      expect(controller).toContain('decision_register');
      expect(controller).toContain('raw_digest');
    });

    it('R2-006-EXACT-POPULATION rejects missing, inactive, duplicate, unresolved, and extra rows', () => {
      for (const code of [
        'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
        'ACTIVE_CONTROL_CENSUS_INACTIVE',
        'ACTIVE_CONTROL_CENSUS_DUPLICATE_ID',
        'ACTIVE_CONTROL_CENSUS_DUPLICATE_PATH',
        'ACTIVE_CONTROL_CENSUS_UNTRACKED',
        'ACTIVE_CONTROL_CENSUS_EXTRA',
      ])
        expect(controller, code).toContain(code);
    });
  });

  describe('R2-F007 exact-candidate reviewer binding at every consumer', () => {
    it('R2-007-NO-WORKTREE-DEFAULT removes mutable authority defaults', () => {
      expect(controller).not.toMatch(/function reviewerBindingV4\([^)]*WORKTREE/u);
      expect(controller).not.toContain("revision === 'WORKTREE'");
    });

    it('R2-007-ALL-CONSUMERS-EXACT leaves no one-argument authority call', () => {
      const calls = [...controller.matchAll(/reviewerBindingV4\(([^)]*)\)/gu)].map(
        (match) => match[1],
      );
      expect(calls.length).toBeGreaterThan(6);
      expect(
        calls.filter((args) => !required(args, 'reviewerBindingV4 arguments').includes(',')),
      ).toEqual([]);
      expect(controller).toContain('resolveExactCandidateV6');
    });

    it('R2-007-DIRTY-SUBSTITUTION reads mandate and profile authority only through Git objects', () => {
      expect(controller).toContain('REVIEWER_BINDING_CANDIDATE_REQUIRED');
      expect(controller).not.toMatch(
        /reviewerBindingV4[\s\S]{0,1400}readFileSync\(join\(repoRoot, path\)/u,
      );
    });
  });

  describe('R2-F008 exact normative-source obligation coverage', () => {
    it('R2-008-ALL-SOURCES-COVERED binds every authoritative source to known obligations', () => {
      const paths = new Set((obligations.normative_sources ?? []).map(({ path }) => path));
      expect(paths).toEqual(
        new Set([
          'AGENTS.md',
          'product/owner-mandates/OM-014.md',
          'product/owner-mandates/OM-015.md',
          'product/owner-mandates/OM-016.md',
          'work/rounds/EXECUTION-CONTRACT.md',
          'work/rounds/R-0007/AUTHORIZATION.md',
          'work/rounds/R-0007/plan.md',
          'work/rounds/R-0007/prompts/00-orchestrator.md',
        ]),
      );
    });

    it('R2-008-OBLIGATION-EXACT-ONCE covers every unique obligation from at least one source', () => {
      const ids = obligations.obligations.map(({ obligation_id }) => obligation_id);
      expect(new Set(ids).size).toBe(ids.length);
      const covered = new Set(
        (obligations.normative_sources ?? []).flatMap(({ obligation_ids }) => obligation_ids),
      );
      expect([...covered].sort()).toEqual([...ids].sort());
    });

    it('R2-008-SOURCE-DIGEST-DRIFT requires exact SHA-256 source bindings', () => {
      expect(obligations.normative_sources?.length).toBeGreaterThan(0);
      for (const entry of obligations.normative_sources ?? [])
        expect(entry.source_digest_sha256, entry.path).toMatch(/^[a-f0-9]{64}$/u);
      expect(controller).toContain('validateNormativeSourceCoverageV6');
      expect(controller).toContain('SEMANTIC_OBLIGATION_SOURCE_DIGEST_INVALID');
    });

    it('R2-008-UNREGISTERED-SOURCE fails additions, removals, duplicates, and unknown mappings', () => {
      expect(controller).toContain('SEMANTIC_OBLIGATION_SOURCE_UNREGISTERED');
      expect(controller).toContain('SEMANTIC_OBLIGATION_ID_UNCOVERED');
      expect(controller).toContain('SEMANTIC_OBLIGATION_ID_UNKNOWN');
      expect(controller).toContain('SEMANTIC_OBLIGATION_ID_DUPLICATE');
    });
  });
});
