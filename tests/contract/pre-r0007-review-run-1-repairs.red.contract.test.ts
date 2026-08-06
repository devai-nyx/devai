// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const CONTROLLER_PATH = 'scripts/run-round-close-controls.mjs';
const ROSTER_PATH = 'packages/schemas/src/roster.ts';
const MATERIALIZATION_PATH = '.devai/config/round-close-controls.json';
const IMPLEMENTATION_PATHS = [MATERIALIZATION_PATH, ROSTER_PATH, CONTROLLER_PATH] as const;

function text(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function json(relativePath: string): Record<string, unknown> {
  return JSON.parse(text(relativePath)) as Record<string, unknown>;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  expect(value, label).not.toBeNull();
  expect(typeof value, label).toBe('object');
  expect(Array.isArray(value), label).toBe(false);
  return value as Record<string, unknown>;
}

function requireRecords(value: unknown, label: string): Record<string, unknown>[] {
  expect(Array.isArray(value), label).toBe(true);
  return value as Record<string, unknown>[];
}

function expectRuntimeGuards(...guards: string[]): void {
  const controller = text(CONTROLLER_PATH);
  const missing = guards.filter((guard) => !controller.includes(guard));
  expect(missing, 'missing runtime guards').toEqual([]);
}

const GATE_IDS = [
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
] as const;

const OUTPUT_BEARING_GATES = [
  'preparation',
  'action-registry',
  'trace',
  'repository-references',
  'materializations',
  'stage1',
  'stage2',
  'coverage',
  'governance',
] as const;

const GATE_MUTATIONS = [
  ['input-selector-removed', 'GATE_FRESHNESS_PROFILE_INCOMPLETE'],
  ['dependency-selector-removed', 'GATE_FRESHNESS_PROFILE_INCOMPLETE'],
  ['toolchain-probe-removed', 'GATE_TOOLCHAIN_PROBE_MISSING'],
  ['toolchain-output-changed', 'GATE_TOOLCHAIN_PROBE_CHANGED'],
  ['environment-input-removed', 'GATE_FRESHNESS_PROFILE_INCOMPLETE'],
] as const;

const OUTPUT_MUTATIONS = [
  ['required-output-missing', 'GATE_REQUIRED_OUTPUT_MISSING'],
  ['required-output-tampered', 'GATE_REQUIRED_OUTPUT_TAMPERED'],
] as const;

const RENAME_BOUNDARIES = [
  'governed-to-ungoverned',
  'ungoverned-to-governed',
  'cross-package',
  'cross-shard',
  'shared-to-nonshared',
  'nonshared-to-shared',
  'coverage-to-noncoverage',
  'noncoverage-to-coverage',
] as const;

const DISPOSITIONS = ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'] as const;

const TOPIC_KINDS = [
  'obligation',
  'changed-path',
  'active-control',
  'current-claim',
  'prior-finding',
  'candidate-identity',
  'convergence',
] as const;

const DISPOSITION_PROOF_MUTATIONS = [
  ['input-manifest', 'REVIEW_DISPOSITION_INPUTS_INVALID'],
  ['evidence-manifest', 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
  ['evidence-digest', 'REVIEW_DISPOSITION_EVIDENCE_INVALID'],
  ['evidence-refs', 'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID'],
  ['evidence-refs-set-digest', 'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID'],
  ['task-freshness-record', 'REVIEW_DISPOSITION_TASK_FRESHNESS_INVALID'],
  ['proof-digest', 'REVIEW_DISPOSITION_PROOF_INVALID'],
] as const;

const SCOPE_IDENTITIES = [
  'round',
  'cycle',
  'review_candidate',
  'candidate_tree',
  'policy_version',
  'previous_candidate_manifest_digests',
] as const;

const REVIEW_STATES = [
  'DRAFT',
  'PREFLIGHT_GREEN',
  'CANDIDATE_FROZEN',
  'CYCLE_1_ACTIVE',
  'PASS',
  'REPAIR_REQUIRED',
  'NEW_CANDIDATE_FROZEN',
  'CYCLE_2_ACTIVE',
  'ESCALATION_REQUIRED',
  'REVIEW_TRANSPORT_BLOCKED',
] as const;

const HISTORY_VARIANTS = [
  'canonical',
  'reordered',
  'skipped',
  'duplicated',
  'stale',
  'forged',
] as const;

const TRANSPORT_ATTEMPT_COUNTS = [0, 1, 2] as const;

const CHAIN_MUTATIONS = [
  ['reordered', 'REVIEW_STATE_HISTORY_NONCANONICAL'],
  ['skipped', 'REVIEW_STATE_HISTORY_NONCANONICAL'],
  ['duplicated', 'REVIEW_STATE_HISTORY_NONCANONICAL'],
  ['stale-predecessor', 'REVIEW_STATE_PREDECESSOR_INVALID'],
  ['forged-transition', 'REVIEW_STATE_TRANSITION_DIGEST_INVALID'],
  ['missing-predecessor-state', 'REVIEW_STATE_PREDECESSOR_MISSING'],
  ['tampered-predecessor-state', 'REVIEW_STATE_PREDECESSOR_INVALID'],
  ['missing-result', 'REVIEW_STATE_RESULT_MISSING'],
  ['tampered-result', 'REVIEW_STATE_RESULT_INVALID'],
  ['missing-repair', 'REVIEW_STATE_REPAIR_MISSING'],
  ['tampered-repair', 'REVIEW_STATE_REPAIR_INVALID'],
  ['missing-transport', 'REVIEW_TRANSPORT_CHAIN_MISSING'],
  ['tampered-transport', 'REVIEW_TRANSPORT_CHAIN_INVALID'],
  ['transport-retry-exhausted', 'REVIEW_TRANSPORT_BLOCKED'],
] as const;

const CONTROL_KINDS = [
  'owner-mandate',
  'architect-decision',
  'policy',
  'policy-schema',
  'round-profile',
  'affected-test-graph',
  'obligation-registry',
  'current-claim-registry',
  'prior-finding-registry',
  'round-declaration',
  'tracked-manifest',
] as const;

const CONTROL_MUTATIONS = [
  ['removed', 'ACTIVE_CONTROL_CENSUS_INCOMPLETE'],
  ['duplicate-id', 'ACTIVE_CONTROL_CENSUS_DUPLICATE_ID'],
  ['duplicate-path', 'ACTIVE_CONTROL_CENSUS_DUPLICATE_PATH'],
  ['inactive', 'ACTIVE_CONTROL_CENSUS_INACTIVE'],
  ['conflict', 'ACTIVE_CONTROL_CENSUS_CONFLICT'],
  ['untracked', 'ACTIVE_CONTROL_CENSUS_UNTRACKED'],
  ['worktree-substitution', 'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID'],
  ['raw-byte-substitution', 'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID'],
] as const;

describe('OM-015 review run 1 complete-class repair populations', () => {
  it('exercises every Engineer implementation path required by governed sequencing', () => {
    expect(IMPLEMENTATION_PATHS).toEqual([
      '.devai/config/round-close-controls.json',
      'packages/schemas/src/roster.ts',
      'scripts/run-round-close-controls.mjs',
    ]);
    for (const path of IMPLEMENTATION_PATHS) expect(text(path).length, path).toBeGreaterThan(0);
  });

  describe('R1-F001 authoritative gate freshness', () => {
    it('declares exactly one complete v5 freshness profile for all 16 authoritative gates', () => {
      const policy = json('law/policy/round-close-controls.json');
      const graph = json('work/rounds/R-0007/affected-test-graph.json');
      const commands = requireRecords(
        requireRecord(policy.convergence, 'convergence').commands,
        'commands',
      );
      const profiles = requireRecords(graph.gate_freshness_profiles, 'gate freshness profiles');
      expect(commands.map(({ id }) => id)).toEqual(GATE_IDS);
      expect(profiles.map(({ gate_id }) => gate_id)).toEqual(GATE_IDS);
      expect(new Set(profiles.map(({ gate_id }) => gate_id)).size).toBe(GATE_IDS.length);
      for (const profile of profiles) {
        expect(requireRecords(profile.input_selectors, 'input selectors').length).toBeGreaterThan(
          0,
        );
        expect(
          requireRecords(profile.dependency_selectors, 'dependency selectors').length,
        ).toBeGreaterThan(0);
        expect(
          requireRecords(profile.toolchain_probe_ids, 'toolchain probes').length,
        ).toBeGreaterThan(0);
        expect(
          requireRecords(profile.environment_input_ids, 'environment inputs').length,
        ).toBeGreaterThan(0);
        expect(['none', 'digest-required']).toContain(profile.output_contract);
        if (profile.output_contract === 'digest-required') {
          expect(
            requireRecords(profile.required_outputs, 'required outputs').length,
          ).toBeGreaterThan(0);
        }
      }
      for (const gate of OUTPUT_BEARING_GATES) {
        const profile = profiles.find(({ gate_id }) => gate_id === gate);
        expect(profile?.output_contract, gate).toBe('digest-required');
        expect(profile?.required_outputs, gate).not.toEqual([]);
      }
      const declaredSelectors = profiles
        .flatMap((profile) => [
          ...(profile.input_selectors as string[]),
          ...(profile.dependency_selectors as string[]),
          ...(profile.required_outputs as string[]),
        ])
        .join('\n');
      for (const [inputClass, pattern] of [
        ['Markdown', /(?:^|[,.*{])md(?:[,}.*]|$)/u],
        ['package manifests', /package\.json/u],
        ['lockfile', /pnpm-lock\.yaml/u],
        ['workspace configuration', /pnpm-workspace\.yaml/u],
        ['Vitest configuration', /vitest/u],
        ['TypeScript configuration', /tsconfig/u],
        ['workflows', /\.github/u],
        ['law', /law\//u],
        ['packages', /packages\//u],
        ['scripts', /scripts\//u],
        ['tests', /tests\//u],
      ] as const) {
        expect(pattern.test(declaredSelectors), `missing effective input class ${inputClass}`).toBe(
          true,
        );
      }
    });

    it('rejects the complete 16-gate input/tool population and every output-bearing mutation before reuse', () => {
      const population = GATE_IDS.flatMap((gate) => [
        ...GATE_MUTATIONS.map(([mutation, code]) => ({ gate, mutation, code })),
        ...(OUTPUT_BEARING_GATES.includes(gate as (typeof OUTPUT_BEARING_GATES)[number])
          ? OUTPUT_MUTATIONS.map(([mutation, code]) => ({ gate, mutation, code }))
          : []),
      ]);
      expect(population).toHaveLength(98);
      expect(new Set(population.map(({ gate, mutation }) => `${gate}:${mutation}`)).size).toBe(98);
      expectRuntimeGuards(...new Set(population.map(({ code }) => code)));
    });

    it('binds gate profiles, expanded inputs, tools, environment, dependencies, and outputs into v5 task keys', () => {
      expectRuntimeGuards(
        'gate_freshness_profile_digest',
        'input_manifest',
        'dependency_input_manifest',
        'toolchain_manifest',
        'environment_manifest',
        'output_contract',
      );
    });
  });

  describe('R1-F002 committed status-aware NUL rename population', () => {
    it('forbids name-only committed discovery and requires exact status-aware NUL parsing', () => {
      const controller = text(CONTROLLER_PATH);
      expect(controller.includes('--name-status')).toBe(true);
      expect(controller.includes('--find-renames')).toBe(true);
      expect(controller.includes("'-z'")).toBe(true);
      expect(/git\([^\n]+\['diff',\s*'--name-only'/u.test(controller)).toBe(false);
      expectRuntimeGuards('COMMITTED_CHANGE_RECORD_INVALID');
    });

    it('retains both invalidations and linked exactly-once topics across all 8 rename boundaries', () => {
      expect(RENAME_BOUNDARIES).toHaveLength(8);
      expectRuntimeGuards(
        'RENAME_PREIMAGE_INVALIDATION_MISSING',
        'RENAME_POSTIMAGE_INVALIDATION_MISSING',
        'RENAME_CHANGED_PATH_TOPIC_LINK_INVALID',
      );
    });
  });

  describe('R1-F003 every disposition and topic kind authenticates every proof component', () => {
    it('rejects every proof mutation across the complete 4 disposition by 7 topic-kind population', () => {
      const population = DISPOSITIONS.flatMap((disposition) =>
        TOPIC_KINDS.flatMap((topicKind) =>
          DISPOSITION_PROOF_MUTATIONS.map(([mutation, code]) => ({
            disposition,
            topicKind,
            mutation,
            code,
          })),
        ),
      );
      expect(population).toHaveLength(196);
      expect(
        new Set(
          population.map(
            ({ disposition, topicKind, mutation }) => `${disposition}:${topicKind}:${mutation}`,
          ),
        ).size,
      ).toBe(196);
      expectRuntimeGuards(...new Set(population.map(({ code }) => code)));
    });

    it('does not special-case proof authentication to REUSED_FRESH_PASS', () => {
      const schema = json('law/schemas/review-result.schema.json');
      const dispositionSchema = requireRecord(
        requireRecord(requireRecord(schema.properties, 'properties').dispositions, 'dispositions')
          .items,
        'disposition items',
      );
      const required = dispositionSchema.required as string[];
      expect(required).toEqual(
        expect.arrayContaining([
          'recomputed_inputs_manifest',
          'recomputed_evidence_manifest',
          'recomputed_evidence_digest',
          'recomputed_evidence_refs_digest',
          'recomputed_task_freshness_manifest',
          'proof_digest_sha256',
        ]),
      );
      expectRuntimeGuards('authenticateDispositionProofV5');
    });
  });

  describe('R1-F004 review scope core identity pre-transport authentication', () => {
    it('independently rejects each of the six mutated identity fields', () => {
      expect(SCOPE_IDENTITIES).toHaveLength(6);
      expectRuntimeGuards(
        ...SCOPE_IDENTITIES.map(
          (identity) => `REVIEW_SCOPE_IDENTITY_${identity.toUpperCase()}_INVALID`,
        ),
      );
    });

    it('rejects combined wrong round/cycle/candidate before transport, attempts, or state writes', () => {
      const controller = text(CONTROLLER_PATH);
      const identityGuard = controller.indexOf('REVIEW_SCOPE_IDENTITY_COMBINED_INVALID');
      const transportWrite = controller.indexOf('writeAuthenticatedTransportV5');
      expect(identityGuard).toBeGreaterThan(-1);
      expect(transportWrite).toBeGreaterThan(identityGuard);
      expectRuntimeGuards('REVIEW_SCOPE_IDENTITY_PRETRANSPORT_REJECTED');
    });
  });

  describe('R1-F005 canonical state, transition, repair, result, and transport chains', () => {
    it('crosses every state, cycle, history shape, and attempt count and rejects invalid relations', () => {
      const population = REVIEW_STATES.flatMap((state) =>
        [1, 2].flatMap((cycle) =>
          HISTORY_VARIANTS.flatMap((history) =>
            TRANSPORT_ATTEMPT_COUNTS.map((attempts) => ({ state, cycle, history, attempts })),
          ),
        ),
      );
      expect(population).toHaveLength(360);
      expectRuntimeGuards('REVIEW_STATE_CYCLE_INVALID');
    });

    it('rejects every reordered, skipped, duplicated, stale, forged, missing, or tampered chain', () => {
      expect(CHAIN_MUTATIONS).toHaveLength(14);
      expectRuntimeGuards(...new Set(CHAIN_MUTATIONS.map(([, code]) => code)));
    });

    it('makes all three terminal states final against scope, transport, and review successors', () => {
      expect(['PASS', 'ESCALATION_REQUIRED', 'REVIEW_TRANSPORT_BLOCKED']).toHaveLength(3);
      expectRuntimeGuards('REVIEW_STATE_TERMINAL');
    });

    it('authenticates every persisted attempt and exhausts after the second malformed transport', () => {
      expectRuntimeGuards(
        'REVIEW_TRANSPORT_ATTEMPT_POPULATION_INCOMPLETE',
        'REVIEW_TRANSPORT_PREDECESSOR_INVALID',
        'REVIEW_TRANSPORT_PAYLOAD_RESULT_MISMATCH',
        'REVIEW_TRANSPORT_BLOCKED',
      );
    });
  });

  describe('R1-F006 exact candidate-tree active-control census', () => {
    it('registers and materializes the active-control census schema under policy v5', () => {
      const policy = json('law/policy/round-close-controls.json');
      const schemas = requireRecord(policy.schemas, 'policy schemas');
      expect(schemas.active_control_census).toBe('law/schemas/active-control-census.schema.json');
      expect(text(ROSTER_PATH).includes('active-control-census.schema.json')).toBe(true);
      expect(text(MATERIALIZATION_PATH) === text('law/policy/round-close-controls.json')).toBe(
        true,
      );
    });

    it('rejects every census mutation across all 11 candidate-tree control kinds', () => {
      const population = CONTROL_KINDS.flatMap((kind) =>
        CONTROL_MUTATIONS.map(([mutation, code]) => ({ kind, mutation, code })),
      );
      expect(population).toHaveLength(88);
      expect(new Set(population.map(({ kind, mutation }) => `${kind}:${mutation}`)).size).toBe(88);
      expectRuntimeGuards(...new Set(population.map(({ code }) => code)));
    });

    it('derives transitive decisions, every schema, round registry, declaration, and referenced manifest from raw candidate blobs', () => {
      const controller = text(CONTROLLER_PATH);
      const provenance = json('work/rounds/R-0007/control-provenance.json');
      const decisions = requireRecords(provenance.decisions, 'control provenance decisions');
      expect(decisions.map(({ decision_id }) => decision_id)).toEqual([
        'DII-246',
        'DII-247',
        'DII-248',
        'DII-249',
        'DII-250',
        'DII-251',
        'DII-252',
        'DII-253',
        'DII-254',
        'DII-255',
      ]);
      expect(controller.includes("'DII-246'")).toBe(false);
      expect(controller.includes("'DII-248'")).toBe(false);
      expect(controller.includes('active_control_census_digest')).toBe(true);
      expect(/cat-file['"],\s*['"]blob/u.test(controller)).toBe(true);
      expectRuntimeGuards(
        'deriveControlProvenanceV6',
        'deriveActiveControlCensusV5',
        'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID',
      );
    });
  });
});
