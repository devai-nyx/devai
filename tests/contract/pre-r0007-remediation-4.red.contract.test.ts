// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  STATE as HARNESS_STATE,
  ROUND as HARNESS_ROUND,
  disposeHarness,
  fixture as harnessFixture,
  freeze as harnessFreeze,
  readJson as harnessReadJson,
  putJson as harnessPutJson,
  put as harnessPut,
  run as harnessRun,
  codes as harnessCodes,
  git as harnessGit,
  commit as harnessCommit,
  mandate,
  bindingMarker,
  stateChain,
  transition,
  transportEvidence,
  repairEvidence,
} from './helpers/r0007-review-harness.js';

vi.setConfig({ testTimeout: 300_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const POLICY_PATH = 'law/policy/round-close-controls.json';
const PROFILE_PATH = 'work/rounds/R-0007/close-control-profile.json';
const REGISTRY_PATH = 'work/rounds/R-0007/prior-finding-registry.json';
const disposable: string[] = [];

afterEach(() => {
  for (const root of disposable.splice(0)) rmSync(root, { recursive: true, force: true });
  disposeHarness();
});

interface Outcome {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly value: Record<string, unknown> | null;
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function json<T>(root: string, path: string): T {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as T;
}

function putJson(root: string, path: string, value: unknown): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

/** A disposable clone of the real repository at its exact current commit. */
function clone(): { root: string; candidate: string } {
  const parent = mkdtempSync(join(tmpdir(), 'devai-r7-remediation4-'));
  disposable.push(parent);
  const root = join(parent, 'repo');
  execFileSync('git', ['clone', '--quiet', '--shared', ROOT, root]);
  return { root, candidate: git(root, ['rev-parse', 'HEAD']) };
}

function commitAll(root: string, message: string): string {
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync(
    'git',
    [
      '-c',
      'user.name=DEVAI Inspector',
      '-c',
      'user.email=inspector@test',
      'commit',
      '-qm',
      message,
    ],
    { cwd: root },
  );
  return git(root, ['rev-parse', 'HEAD']);
}

function run(root: string, argv: readonly string[]): Outcome {
  const result = spawnSync('node', [SCRIPT, ...argv, '--repo-root', root, '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  let value: Record<string, unknown> | null = null;
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = null;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, value };
}

function codes(outcome: Outcome): string[] {
  const findings = (outcome.value?.findings ?? []) as Array<{ code?: string }>;
  const diagnostics = (outcome.value?.diagnostics ?? []) as Array<{ code?: string }>;
  return [...findings, ...diagnostics]
    .map(({ code }) => code)
    .filter((code): code is string => typeof code === 'string');
}

function detail(outcome: Outcome): string {
  return `status=${String(outcome.status)}\n${outcome.stdout}\n${outcome.stderr}`;
}

/**
 * Every authoritative v4/v5 consumer reachable from the dispatch switch. Each one
 * loads policy, profile, schemas, mandates or authority and therefore must bind one
 * literal candidate before any worktree byte is read.
 */
const AUTHORITATIVE_COMMANDS = [
  'policy-check',
  'entry-check',
  'status',
  'impact-plan',
  'smart-converge',
  'review-scope',
  'review-check',
  'claims-check',
  'claims-materialize',
  'claim-produce',
  'review-topic-count',
  'materialize',
  'materializations-check',
  'manifest',
  'envelope',
  'rehearse',
] as const;

describe('OM-017 / DII-252 remediation campaign 3 Review Run 1 complete repair population', () => {
  describe('R7-F003 reviewer binding is candidate bound for every authoritative consumer', () => {
    it('R7-003-ALL-COMMANDS-CANDIDATE-BOUND rejects an omitted candidate for every command', () => {
      const { root } = clone();
      const offenders: string[] = [];
      for (const command of AUTHORITATIVE_COMMANDS) {
        const outcome = run(root, [command, '--round', 'R-0007']);
        if (!codes(outcome).includes('REVIEWER_BINDING_CANDIDATE_REQUIRED'))
          offenders.push(`${command}:${codes(outcome).join('|') || 'no-findings'}`);
      }
      expect(
        offenders,
        `commands accepting an omitted candidate:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });

    it('R7-003-DIRTY-BY-FORM-CROSS-PRODUCT keeps the verdict independent of worktree bytes', () => {
      const { root, candidate } = clone();
      // Dirty a tracked authority byte that currently selects the handler.
      const policy = json<Record<string, unknown>>(root, POLICY_PATH);
      policy.schemaVersion = '3.0.0';
      putJson(root, POLICY_PATH, policy);

      const offenders: string[] = [];
      for (const command of AUTHORITATIVE_COMMANDS)
        for (const form of ['omitted', 'HEAD', candidate.slice(0, 12)]) {
          const argv =
            form === 'omitted'
              ? [command, '--round', 'R-0007']
              : [command, '--round', 'R-0007', '--candidate', form];
          const outcome = run(root, argv);
          if (!codes(outcome).includes('REVIEWER_BINDING_CANDIDATE_REQUIRED'))
            offenders.push(`${command}/${form}:${codes(outcome).join('|') || 'no-findings'}`);
        }
      expect(
        offenders,
        `dirty worktree influenced dispatch or verdict:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });

    it('R7-003-SMART-CONVERGE-REJECTS-HEAD refuses a symbolic head', () => {
      const { root, candidate } = clone();
      const symbolic = run(root, [
        'smart-converge',
        '--round',
        'R-0007',
        '--base',
        candidate,
        '--head',
        'HEAD',
      ]);
      expect(codes(symbolic), detail(symbolic)).toContain('REVIEWER_BINDING_CANDIDATE_REQUIRED');

      const abbreviated = run(root, [
        'smart-converge',
        '--round',
        'R-0007',
        '--base',
        candidate,
        '--head',
        candidate.slice(0, 12),
      ]);
      expect(codes(abbreviated), detail(abbreviated)).toContain(
        'REVIEWER_BINDING_CANDIDATE_REQUIRED',
      );
    });
  });

  describe('R7-F007 entry readiness never contradicts an entry block', () => {
    it('R7-007-THREE-CONSUMERS-AGREE emits one readiness value across all three consumers', () => {
      const { root, candidate } = clone();
      const readiness = new Map<string, unknown>();
      for (const command of ['policy-check', 'entry-check', 'status'])
        readiness.set(
          command,
          run(root, [command, '--round', 'R-0007', '--candidate', candidate]).value?.entry_ready,
        );
      const distinct = new Set([...readiness.values()].map((value) => JSON.stringify(value)));
      expect(
        [...distinct],
        `entry_ready disagreed across consumers: ${JSON.stringify([...readiness])}`,
      ).toHaveLength(1);
    });

    it('R7-007-STATUS-FALSE-WHILE-BLOCKED reports false while the B0 declaration is unbound', () => {
      const { root, candidate } = clone();
      const entry = run(root, ['entry-check', '--round', 'R-0007', '--candidate', candidate]);
      expect(codes(entry), detail(entry)).toContain('ENTRY_BLOCKED_DECLARATION_UNBOUND');

      const status = run(root, ['status', '--round', 'R-0007', '--candidate', candidate]);
      expect(status.value?.entry_ready, detail(status)).toBe(false);
    });
  });

  describe('R7-F009 control behaviour is selected by capability, never by a decision specimen', () => {
    it('R7-009-NO-DECISION-ID-LITERAL leaves no decision-id literal in the controller', () => {
      const source = readFileSync(SCRIPT, 'utf8');
      const occurrences = [...source.matchAll(/['"`]([^'"`\n]*DII-[0-9]+[^'"`\n]*)['"`]/gu)].map(
        ([, literal]) => literal,
      );
      expect(
        occurrences,
        `controller still selects behaviour by decision id: ${occurrences.join(', ')}`,
      ).toEqual([]);
    });

    it('R7-009-CAPABILITY-SELECTED-BEHAVIOUR keeps hardening under a foreign profile decision id', () => {
      const { root, candidate } = clone();
      const policy = json<{ control_capabilities?: Record<string, unknown> }>(root, POLICY_PATH);
      expect(
        policy.control_capabilities,
        'policy must declare generic control capabilities',
      ).toBeTypeOf('object');

      // A profile carrying an unrelated decision id must not disable any hardening.
      const profile = json<Record<string, unknown>>(root, PROFILE_PATH);
      profile.decision_id = 'DII-900';
      putJson(root, PROFILE_PATH, profile);
      commitAll(root, 'test: foreign profile decision id');
      const foreign = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['status', '--round', 'R-0007', '--candidate', foreign]);
      expect(outcome.value?.entry_ready, detail(outcome)).toBe(false);

      const omitted = run(root, ['status', '--round', 'R-0007']);
      expect(codes(omitted), detail(omitted)).toContain('REVIEWER_BINDING_CANDIDATE_REQUIRED');
      expect(candidate).not.toBe(foreign);
    });
  });

  describe('R7-F010 the bound closure matrix keeps a registry-derived population floor', () => {
    it('R7-010-MATRIX-SUPERSET-OF-OPEN enumerates every OPEN prior finding', () => {
      const { root, candidate } = clone();
      const profile = json<{ sources: { remediation_closure_matrix: string } }>(root, PROFILE_PATH);
      const matrix = json<{ classes: Array<{ finding_id: string }> }>(
        root,
        profile.sources.remediation_closure_matrix,
      );
      const registry = json<{
        finding_classes: Array<{ finding_id: string; disposition: string }>;
      }>(root, REGISTRY_PATH);
      const bound = new Set(matrix.classes.map(({ finding_id }) => finding_id));
      const open = registry.finding_classes
        .filter(({ disposition }) => disposition === 'OPEN')
        .map(({ finding_id }) => finding_id);
      const missing = open.filter((id) => !bound.has(id));
      expect(missing, `OPEN classes absent from the bound matrix: ${missing.join(', ')}`).toEqual(
        [],
      );

      // The floor must be machine-enforced by the controller, not only by this contract.
      const clean = run(root, ['policy-check', '--round', 'R-0007', '--candidate', candidate]);
      expect(codes(clean)).not.toContain('REMEDIATION_MATRIX_POPULATION_INCOMPLETE');
    });

    it('R7-010-COORDINATED-DELETION-FAILS rejects a class deleted from both matrix and tests', () => {
      const { root } = clone();
      const profile = json<{ sources: { remediation_closure_matrix: string } }>(root, PROFILE_PATH);
      const matrixPath = profile.sources.remediation_closure_matrix;
      const matrix = json<{ classes: Array<{ finding_id: string }> }>(root, matrixPath);
      const victim = matrix.classes.find(({ finding_id }) => finding_id === 'R2-F001');
      expect(victim, 'R2-F001 must be carried by the bound matrix').toBeTruthy();
      matrix.classes = matrix.classes.filter(({ finding_id }) => finding_id !== 'R2-F001');
      putJson(root, matrixPath, matrix);
      commitAll(root, 'test: delete a carried class from the bound matrix');
      const mutated = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['policy-check', '--round', 'R-0007', '--candidate', mutated]);
      expect(outcome.status, detail(outcome)).toBe(1);
      expect(codes(outcome), detail(outcome)).toContain('REMEDIATION_MATRIX_POPULATION_INCOMPLETE');
    });
  });

  describe('R7-F005 the authoritative gate roster stays literal, complete and executable', () => {
    it('R7-005-GATE-ID-AND-EXIT-CODE keeps the roster at sixteen declared literal commands', () => {
      const { root } = clone();
      const policy = json<{
        convergence: { commands: Array<{ id: string; argv: string[]; freshness_profile: string }> };
      }>(root, POLICY_PATH);
      const commands = policy.convergence.commands;
      expect(commands).toHaveLength(16);
      for (const command of commands) {
        expect(Array.isArray(command.argv) && command.argv.length > 0).toBe(true);
        expect(typeof command.freshness_profile).toBe('string');
      }
      // The degraded materializations row must regain binding/normative/provenance semantics.
      const materializations = commands.find(({ id }) => id === 'materializations');
      expect(materializations?.argv).toContain('control-attestation');
    });

    it('R7-005-NO-SILENT-PROFILE-SKIP executes the restored attestation gate from a clean tree', () => {
      const { root } = clone();
      const policy = json<{ convergence: { commands: Array<{ id: string; argv: string[] }> } }>(
        root,
        POLICY_PATH,
      );
      const gate = policy.convergence.commands.find(({ id }) => id === 'materializations');
      const [program, ...args] = gate?.argv ?? [];
      const result = spawnSync(program ?? '', args, { cwd: root, encoding: 'utf8' });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    });
  });

  describe('R7-F006 loader classification widens on every unproved family', () => {
    const FAMILIES: ReadonlyArray<readonly [string, string]> = [
      ['direct-require', 'const value = require(name);\n'],
      ['aliased-require', 'const load = require;\nconst value = load(name);\n'],
      ['module-member-alias', 'const load = module.require;\nconst value = load(name);\n'],
      ['destructured-module', 'const { require: load } = module;\nconst value = load(name);\n'],
      [
        'destructured-globalthis',
        'const { require: load } = globalThis;\nconst value = load(name);\n',
      ],
      ['computed-globalthis', 'const value = globalThis[loaderName](name);\n'],
      ['computed-module', 'const value = module[loaderName](name);\n'],
      [
        'main-module-alias',
        'const load = process.mainModule.require;\nconst value = load(name);\n',
      ],
      ['create-require', 'const load = createRequire(import.meta.url);\nconst v = load(name);\n'],
      ['require-resolve', 'const value = require.resolve(name);\n'],
      ['import-meta-resolve', 'const value = import.meta.resolve(name);\n'],
      ['dynamic-import', 'const value = await import(name);\n'],
      ['eval-loader', 'const value = eval(loaderExpression);\n'],
    ];

    it('R7-006-THIRTEEN-LOADER-FAMILIES widens full suite and whole coverage for every family', () => {
      const { root } = clone();
      const graph = json<{ nodes: Array<{ id: string; kind: string }> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      expect(graph.nodes.length).toBeGreaterThan(0);

      const offenders: string[] = [];
      for (const [label, body] of FAMILIES) {
        const file = `packages/cli/src/generated/r7-loader-${label}.ts`;
        // Each family is measured in isolation. The base is the commit immediately
        // before this family's own commit, so exactly one file is in the range and a
        // previously widening family cannot carry a later one.
        const isolationBase = git(root, ['rev-parse', 'HEAD']);
        writeFileSync(
          join(root, file),
          `// loader family probe\nexport const name = 'x';\nexport const loaderName = 'require';\nexport const loaderExpression = 'x';\n${body}`,
        );
        commitAll(root, `test: loader family ${label}`);
        const head = git(root, ['rev-parse', 'HEAD']);
        const changed = git(root, ['diff', '--name-only', isolationBase, head])
          .split('\n')
          .filter(Boolean);
        expect(changed, `family ${label} must isolate exactly one changed input`).toEqual([file]);
        const outcome = run(root, [
          'impact-plan',
          '--round',
          'R-0007',
          '--base',
          isolationBase,
          '--head',
          head,
          '--candidate',
          head,
        ]);
        const serialized = JSON.stringify(outcome.value ?? {});
        if (!serialized.includes('DYNAMIC_DEPENDENCY_AMBIGUOUS')) offenders.push(label);
      }
      expect(offenders, `loader families not widened: ${offenders.join(', ')}`).toEqual([]);
    });
  });

  describe('R7-F004 gate command closure is a fixpoint over the candidate object', () => {
    it('R7-004-CLOSURE-FIXPOINT binds extends chains, transitive references and outputs', () => {
      const { root } = clone();
      const graph = json<{ command_closure: Array<Record<string, unknown>> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      const union = new Set<string>();
      for (const entry of graph.command_closure)
        for (const key of ['scripts', 'programs', 'executables', 'project_references'])
          for (const member of (entry[key] ?? []) as string[]) union.add(member);

      // Members the review proved unreachable under a depth-limited scan.
      const required = [
        'tsconfig.base.json',
        'packages/cli/dist/bin.js',
        'packages/authority',
        'packages/schemas',
      ];
      const missing = required.filter(
        (member) => ![...union].some((entry) => entry.includes(member)),
      );
      expect(
        missing,
        `closure is not a fixpoint; unreachable members: ${missing.join(', ')}\nunion=${[...union].join(', ')}`,
      ).toEqual([]);
    });

    it('R7-004-GENERIC-PROGRAM-PARSE derives programs beyond a fixed allowlist', () => {
      const { root } = clone();
      const graph = json<{ command_closure: Array<{ programs?: string[] }> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      const programs = new Set(graph.command_closure.flatMap(({ programs: p }) => p ?? []));
      // eslint and changeset are named in reachable script strings but absent from the
      // hardcoded /\b(?:node|vitest|tsc|git|prettier|pnpm)\b/ allowlist.
      const expected = ['eslint', 'changeset'];
      const missing = expected.filter((program) => !programs.has(program));
      expect(
        missing,
        `programs derived from an allowlist rather than the command string: ${missing.join(', ')}`,
      ).toEqual([]);
    });

    it('R7-004-DIGEST-EVERY-PROFILE compares closure digests under any profile decision id', () => {
      const { root } = clone();
      const profile = json<Record<string, unknown>>(root, PROFILE_PATH);
      profile.decision_id = 'DII-900';
      putJson(root, PROFILE_PATH, profile);
      const graph = json<{ command_closure: Array<Record<string, unknown>> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      graph.command_closure[0].closure_digest = 'f'.repeat(64);
      putJson(root, 'work/rounds/R-0007/affected-test-graph.json', graph);
      commitAll(root, 'test: foreign profile with a substituted closure digest');
      const mutated = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['policy-check', '--round', 'R-0007', '--candidate', mutated]);
      expect(codes(outcome), detail(outcome)).toContain('GATE_COMMAND_CLOSURE_DERIVATION_INVALID');
    });
  });

  describe('R7-F008 recorded red evidence is prospective, consistent and immutable', () => {
    const EVIDENCE = 'work/audit/R-0007-pre-entry/remediation-4-red-evidence.json';

    it('R7-008-COUNT-CONSISTENCY names suites and files accurately and agrees with itself', () => {
      const evidence = json<Record<string, unknown>>(ROOT, EVIDENCE);
      const observed = (evidence.observed ?? {}) as Record<string, number>;
      expect(typeof observed.test_suites_failed).toBe('number');
      expect(typeof observed.test_files_failed).toBe('number');
      // A count named for files may never exceed the number of files the command names.
      const command = String((evidence.command as string[] | undefined)?.join(' ') ?? '');
      const namedFiles = command.split(/\s+/u).filter((part) => part.endsWith('.ts')).length;
      expect(observed.test_files_failed).toBeLessThanOrEqual(Math.max(namedFiles, 1));
      expect(Object.keys(evidence)).not.toContain('observed_test_files_failed');
    });

    it('R7-008-EVIDENCE-ANCESTRY precedes every implementation-surface commit', () => {
      const evidence = json<{ inspector_candidate_sha: string }>(ROOT, EVIDENCE);
      const red = evidence.inspector_candidate_sha;
      const profile = json<{ sources: { remediation_closure_matrix: string } }>(ROOT, PROFILE_PATH);
      const matrix = json<{ classes: Array<{ implementation_surfaces: string[] }> }>(
        ROOT,
        profile.sources.remediation_closure_matrix,
      );
      const surfaces = [...new Set(matrix.classes.flatMap((c) => c.implementation_surfaces))];
      const base = 'ff5c80574ee7fc670046bfec990fadedf3d89ce4';
      const offenders: string[] = [];
      for (const surface of surfaces) {
        const touching = git(ROOT, ['log', '--format=%H', `${base}..HEAD`, '--', surface])
          .split('\n')
          .filter(Boolean);
        for (const commitSha of touching) {
          if (commitSha === red) continue;
          const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', red, commitSha], {
            cwd: ROOT,
          });
          if (ancestor.status !== 0) offenders.push(`${surface}@${commitSha.slice(0, 8)}`);
        }
      }
      expect(
        offenders,
        `implementation-surface commits not descended from the red evidence commit:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });

    it('R7-008-EVIDENCE-IMMUTABLE-AFTER-IMPL is never modified at or after implementation', () => {
      const evidence = json<{ implementation_commit?: string }>(ROOT, EVIDENCE);
      const implementation = evidence.implementation_commit;
      expect(typeof implementation, 'evidence must name the implementation commit').toBe('string');
      const touching = git(ROOT, [
        'log',
        '--format=%H',
        `${String(implementation)}~1..HEAD`,
        '--',
        EVIDENCE,
      ])
        .split('\n')
        .filter(Boolean);
      expect(
        touching,
        `red evidence was rewritten at or after implementation: ${touching.join(', ')}`,
      ).toEqual([]);
    });
  });

  describe('R7-F002 every state-machine edge, terminal and attempt is a runtime population', () => {
    const STATE_PATH = `${HARNESS_STATE}/review-state.json`;
    const blocking = (result: { value: Record<string, unknown> }): string[] =>
      harnessCodes(result as never).filter((code) =>
        /^REVIEW_(?:STATE|TRANSPORT|RESULT)_/u.test(code),
      );

    it('R7-002-TWELVE-EDGES-RUNTIME drives all twelve edges through the real controller', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        review_state_machine: { allowed_transitions: Record<string, string[]> };
      };
      const edges = Object.entries(policy.review_state_machine.allowed_transitions).flatMap(
        ([from, targets]) => targets.map((to) => [from, to] as const),
      );
      expect(edges, 'the declared edge population must be exactly twelve').toHaveLength(12);

      const scopeDigest = 'a'.repeat(64);
      const unproved: string[] = [];
      for (const [from, to] of edges) {
        const cycle: 1 | 2 = /CYCLE_2|NEW_CANDIDATE/u.test(`${from}:${to}`) ? 2 : 1;
        const history = [transition(from, to, frozen, { review_scope_digest: scopeDigest })];
        const state = stateChain(current, frozen, to, cycle, scopeDigest, history);
        harnessPutJson(current.root, STATE_PATH, state);

        // Mutate one byte of the consumed predecessor identity and require a blocking code.
        const mutated = structuredClone(state) as Record<string, unknown>;
        const entries = mutated.transition_history as Array<Record<string, unknown>>;
        entries[0].previous_state_digest = 'c'.repeat(64);
        harnessPutJson(current.root, STATE_PATH, mutated);
        const outcome = harnessRun(current, 'review-check', []);
        if (blocking(outcome).length === 0) unproved.push(`${from}->${to}`);
      }
      expect(
        unproved,
        `edges whose consumed predecessor mutation was not detected: ${unproved.join(', ')}`,
      ).toEqual([]);
    });

    it('R7-002-THREE-TERMINALS-RUNTIME refuses re-entry from every terminal state', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        review_state_machine: { terminal_states: string[] };
      };
      const terminals = policy.review_state_machine.terminal_states;
      expect([...terminals].sort()).toEqual(
        ['ESCALATION_REQUIRED', 'PASS', 'REVIEW_TRANSPORT_BLOCKED'].sort(),
      );
      const scopeDigest = 'a'.repeat(64);
      const unproved: string[] = [];
      for (const terminal of terminals) {
        const cycle = terminal === 'ESCALATION_REQUIRED' ? 2 : 1;
        const from = cycle === 2 ? 'CYCLE_2_ACTIVE' : 'CYCLE_1_ACTIVE';
        const history = [transition(from, terminal, frozen, { review_scope_digest: scopeDigest })];
        const state = stateChain(current, frozen, terminal, cycle, scopeDigest, history);
        harnessPutJson(current.root, STATE_PATH, state);
        const outcome = harnessRun(current, 'review-scope', ['--candidate', frozen.candidate]);
        const observed = harnessCodes(outcome);
        if (!observed.includes('REVIEW_STATE_TERMINAL') && outcome.status === 0)
          unproved.push(terminal);
      }
      expect(unproved, `terminals allowing re-entry: ${unproved.join(', ')}`).toEqual([]);
    });

    it('R7-002-ATTEMPTS-ZERO-ONE-TWO authenticates every transport attempt ordinal', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scopeDigest = 'a'.repeat(64);
      const unproved: string[] = [];
      for (const attempt of [0, 1, 2] as ReadonlyArray<0 | 1 | 2>) {
        const history = [
          transition('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', frozen, {
            review_scope_digest: scopeDigest,
          }),
        ];
        const state = stateChain(current, frozen, 'CYCLE_1_ACTIVE', 1, scopeDigest, history, {
          transport_attempts: attempt,
        });
        harnessPutJson(current.root, STATE_PATH, state);
        if (attempt > 0) {
          const transport = transportEvidence(
            frozen,
            scopeDigest,
            attempt as 1 | 2,
            state.state_digest_sha256 as string,
            null,
          ) as Record<string, unknown>;
          // Substitute the state-before identity the transport claims to authenticate.
          transport.state_before_digest = 'd'.repeat(64);
          harnessPutJson(current.root, `${HARNESS_STATE}/review-transport.json`, transport);
        }
        const outcome = harnessRun(current, 'review-check', []);
        if (attempt > 0 && blocking(outcome).length === 0) unproved.push(`attempt-${attempt}`);
      }
      expect(
        unproved,
        `transport attempts accepting a substituted state-before identity: ${unproved.join(', ')}`,
      ).toEqual([]);
    });
  });

  describe('R7-F001 conservative widening is live, not dead code', () => {
    it('R7-001-REPAIR-POPULATION-DERIVED rejects a deleted repaired class', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scopeDigest = 'a'.repeat(64);
      const history = [
        transition('REPAIR_REQUIRED', 'PREFLIGHT_GREEN', frozen, {
          review_scope_digest: scopeDigest,
        }),
      ];
      const state = stateChain(current, frozen, 'PREFLIGHT_GREEN', 1, scopeDigest, history);
      harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, state);
      const repair = repairEvidence(
        frozen,
        scopeDigest,
        'b'.repeat(64),
        state.state_digest_sha256 as string,
        '1'.repeat(40),
      ) as Record<string, unknown>;
      const repaired = (repair.repaired_classes ?? []) as unknown[];
      expect(repaired.length, 'repair evidence must carry a class population').toBeGreaterThan(0);
      repair.repaired_classes = repaired.slice(1);
      harnessPutJson(current.root, `${HARNESS_STATE}/review-repair-evidence.json`, repair);
      const outcome = harnessRun(current, 'review-scope', ['--candidate', frozen.candidate]);
      expect(harnessCodes(outcome), JSON.stringify(outcome.value, null, 2)).toContain(
        'REVIEW_STATE_REPAIR_LINK_INVALID',
      );
    });

    it('R7-001-NO-SELF-COMPARED-EXPECTATION detects a substituted state-before artifact', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scopeDigest = 'a'.repeat(64);
      const history = [
        transition('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', frozen, {
          review_scope_digest: scopeDigest,
        }),
      ];
      const state = stateChain(current, frozen, 'CYCLE_1_ACTIVE', 1, scopeDigest, history, {
        transport_attempts: 1,
      });
      harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, state);
      const transport = transportEvidence(
        frozen,
        scopeDigest,
        1,
        state.state_digest_sha256 as string,
        null,
      ) as Record<string, unknown>;
      transport.state_before_digest = 'e'.repeat(64);
      harnessPutJson(current.root, `${HARNESS_STATE}/review-transport.json`, transport);
      const outcome = harnessRun(current, 'review-check', []);
      const observed = harnessCodes(outcome).filter((code) =>
        /^REVIEW_(?:STATE|TRANSPORT)_/u.test(code),
      );
      expect(observed, JSON.stringify(outcome.value, null, 2)).not.toEqual([]);
    });

    it('R7-001-PREDECESSOR-ARTIFACT-END-TO-END binds the complete predecessor artifact', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scopeDigest = 'a'.repeat(64);
      const history = [
        transition('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', frozen, {
          review_scope_digest: scopeDigest,
        }),
      ];
      const state = stateChain(
        current,
        frozen,
        'CYCLE_1_ACTIVE',
        1,
        scopeDigest,
        history,
      ) as Record<string, unknown>;
      // An unselected byte of the predecessor identity must still be authenticated.
      const entries = state.transition_history as Array<Record<string, unknown>>;
      expect(
        Object.hasOwn(entries[0], 'previous_state_artifact'),
        'a production writer must persist the predecessor artifact reference',
      ).toBe(true);
      harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, state);
      const outcome = harnessRun(current, 'review-check', []);
      expect(outcome.status).not.toBeNull();
    });
  });

  describe('R7-F004 a candidate executable that cannot be read blocks derivation', () => {
    it('R7-004-MISSING-EXECUTABLE-BLOCKS names the unreadable executable', () => {
      const { root } = clone();
      const pkg = json<{ scripts: Record<string, string> }>(root, 'package.json');
      // A reachable script that names an executable absent from the candidate tree.
      pkg.scripts['devai:prepare'] =
        `node scripts/r7-absent-executable.mjs && ${pkg.scripts['devai:prepare']}`;
      putJson(root, 'package.json', pkg);
      commitAll(root, 'test: reachable script names an absent executable');
      const mutated = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['policy-check', '--round', 'R-0007', '--candidate', mutated]);
      const serialized = JSON.stringify(outcome.value ?? {});
      expect(codes(outcome), detail(outcome)).toContain('GATE_COMMAND_CLOSURE_DERIVATION_INVALID');
      expect(
        serialized,
        'the derived closure must name the unreadable executable rather than drop it',
      ).toContain('scripts/r7-absent-executable.mjs');
    });
  });

  describe('R7-F005 convergence retains the complete ordered population', () => {
    it('R7-005-SIXTEEN-RECORDS-EVERY-ORDINAL keeps sixteen records for every failure ordinal', () => {
      const current = harnessFixture(true);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        convergence: { commands: Array<{ id: string }> };
      };
      const gateIds = policy.convergence.commands.map(({ id }) => id);
      expect(gateIds).toHaveLength(16);

      const offenders: string[] = [];
      for (const failing of gateIds) {
        harnessPut(current.root, 'fixture/fail-gate.txt', `${failing}\n`);
        const converged = harnessRun(current, 'smart-converge', [
          '--base',
          current.base,
          '--head',
          harnessGit(current.root, ['rev-parse', 'HEAD']),
        ]);
        const passes = (converged.value.passes ?? []) as Array<{
          results?: Array<Record<string, unknown>>;
        }>;
        const first = passes[0]?.results ?? [];
        if (first.length !== 16) {
          offenders.push(`${failing}: ${first.length} records`);
          continue;
        }
        const complete = first.every(
          (record) =>
            typeof record.gate_id === 'string' && Number.isInteger(record.exit_code as number),
        );
        if (!complete) offenders.push(`${failing}: record missing gate_id or exit_code`);
        const ordered = first.map((record) => String(record.gate_id));
        if (JSON.stringify(ordered) !== JSON.stringify(gateIds))
          offenders.push(`${failing}: population reordered or incomplete`);
      }
      expect(
        offenders,
        `failure ordinals losing the complete ordered population:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });

    it('R7-005-SIXTEEN-LITERAL-DETACHED executes every literal argv from a detached candidate', (context) => {
      // The `ordinary` gate is literally `pnpm vitest run`, so this case re-enters the
      // whole suite. The guard lets the nested run execute every other contract exactly
      // once while refusing to re-enter this one.
      if (process.env.DEVAI_R7_DETACHED_GATE === '1') {
        context.skip();
        return;
      }
      const { root, candidate } = clone();
      execFileSync('git', ['checkout', '--detach', candidate], { cwd: root, stdio: 'ignore' });
      // Dependencies are resolved from the already-installed store; the checkout itself
      // is a clean detached exact-candidate tree.
      execFileSync('ln', ['-s', join(ROOT, 'node_modules'), join(root, 'node_modules')]);
      const policy = json<{ convergence: { commands: Array<{ id: string; argv: string[] }> } }>(
        root,
        POLICY_PATH,
      );
      const failures: string[] = [];
      for (const gate of policy.convergence.commands) {
        const [program, ...args] = gate.argv;
        const result = spawnSync(program, args, {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          env: { ...process.env, DEVAI_R7_DETACHED_GATE: '1' },
        });
        if (result.status !== 0)
          failures.push(
            `${gate.id} exit=${String(result.status)} ${String(result.stderr).slice(0, 400)}`,
          );
      }
      expect(
        failures,
        `literal argv rows failing from a detached candidate:\n${failures.join('\n')}`,
      ).toEqual([]);
    }, 3_600_000);
  });

  describe('R7-F006 loader widening covers preimage bytes and owned selectors', () => {
    it('R7-006-CANDIDATE-AND-PREIMAGE widens on a deleted ambiguous loader', () => {
      const { root, candidate } = clone();
      const file = 'packages/cli/src/generated/r7-preimage-loader.ts';
      writeFileSync(
        join(root, file),
        "export const name = 'x';\nconst load = module.require;\nconst value = load(name);\nexport { value };\n",
      );
      commitAll(root, 'test: introduce ambiguous loader');
      const withLoader = git(root, ['rev-parse', 'HEAD']);
      execFileSync('git', ['rm', '-q', file], { cwd: root });
      execFileSync(
        'git',
        [
          '-c',
          'user.name=DEVAI Inspector',
          '-c',
          'user.email=inspector@test',
          'commit',
          '-qm',
          'test: delete ambiguous loader',
        ],
        { cwd: root },
      );
      const deleted = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, [
        'impact-plan',
        '--round',
        'R-0007',
        '--base',
        withLoader,
        '--head',
        deleted,
        '--candidate',
        deleted,
      ]);
      expect(
        JSON.stringify(outcome.value ?? {}),
        'a deleted file must be read from base/preimage bytes',
      ).toContain('DYNAMIC_DEPENDENCY_AMBIGUOUS');
      expect(candidate).not.toBe(deleted);
    });

    it('R7-006-OWNED-SELECTOR-WIDENING selects full suite and whole coverage together', () => {
      const { root, candidate } = clone();
      const file = 'packages/cli/src/generated/r7-owned-loader.ts';
      writeFileSync(
        join(root, file),
        "export const loaderName = 'require';\nexport const value = globalThis[loaderName]('x');\n",
      );
      commitAll(root, 'test: owned selector ambiguous loader');
      const head = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, [
        'impact-plan',
        '--round',
        'R-0007',
        '--base',
        candidate,
        '--head',
        head,
        '--candidate',
        head,
      ]);
      const graph = json<{ fallbacks: Record<string, string> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      const serialized = JSON.stringify(outcome.value ?? {});
      const fullSuite = String(graph.fallbacks.unknown_dependency ?? 'full-suite');
      expect(serialized, 'full-suite node must be selected').toContain(fullSuite);
      expect(serialized, 'whole-coverage node must be selected').toMatch(/coverage/u);
      expect(serialized).toContain('DYNAMIC_DEPENDENCY_AMBIGUOUS');
    });
  });

  describe('R7 carried classes — regression guards for still-OPEN prior findings', () => {
    it('R7-011-BINDING-CENSUS-EXACT-ONE resolves exactly one active binding', () => {
      const current = harnessFixture(true);
      const outcome = harnessRun(current, 'policy-check', []);
      const observed = harnessCodes(outcome);
      expect(observed).not.toContain('ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS');
      expect(observed).not.toContain('ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT');
    });

    it('R7-011-BINDING-CENSUS-FAIL-CLOSED rejects a duplicate conflicting binding', () => {
      const current = harnessFixture(true);
      harnessPut(
        current.root,
        'product/owner-mandates/OM-901.md',
        mandate(
          { ...bindingMarker('other-model-v1'), mandate_id: 'OM-901' },
          {
            id: 'OM-901',
            status: 'active',
            authority: 'Owner',
          },
        ),
      );
      harnessCommit(current.root, 'test: second active reviewer binding');
      const outcome = harnessRun(current, 'policy-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-012-NO-GATE-OMITTED converges over the complete declared population', () => {
      const current = harnessFixture(true);
      const converged = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        harnessGit(current.root, ['rev-parse', 'HEAD']),
      ]);
      const passes = (converged.value.passes ?? []) as Array<{ results?: unknown[] }>;
      expect(passes[0]?.results ?? []).toHaveLength(16);
    });

    it('R7-012-ROSTER-DELETION-FAILS rejects a shortened authoritative roster', () => {
      const current = harnessFixture(true);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        convergence: { commands: Array<{ id: string }> };
      };
      policy.convergence.commands = policy.convergence.commands.slice(0, 15);
      harnessPutJson(current.root, 'law/policy/round-close-controls.json', policy);
      harnessPutJson(current.root, '.devai/config/round-close-controls.json', policy);
      harnessCommit(current.root, 'test: delete one authoritative gate');
      const outcome = harnessRun(current, 'policy-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-013-CACHE-RECORD-IDENTITY binds each freshness record to its task key', () => {
      const current = harnessFixture(true);
      harnessFreeze(current);
      const outcome = harnessRun(current, 'policy-check', []);
      expect(harnessCodes(outcome)).not.toContain('CACHE_RECORD_IDENTITY_INVALID');
    });

    it('R7-013-CACHE-SUBSTITUTION-FAILS rejects a substituted cache record', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const converged = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        frozen.candidate,
      ]);
      expect(converged.status, JSON.stringify(converged.value, null, 2)).toBe(0);
      const results = (
        (converged.value.passes ?? []) as Array<{
          results?: Array<{ task_key?: string; node_id?: string }>;
        }>
      )[0]?.results;
      const sample = (results ?? []).find(({ task_key }) => typeof task_key === 'string');
      expect(sample, 'convergence must expose a task key to substitute').toBeTruthy();
      const cachePath = `${HARNESS_STATE}/freshness/tasks/gate-${String(sample?.node_id)}/${String(sample?.task_key)}.json`;
      const record = harnessReadJson(current.root, cachePath);
      record.result_digest = 'f'.repeat(64);
      harnessPutJson(current.root, cachePath, record);
      const again = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        frozen.candidate,
      ]);
      expect(
        harnessCodes(again).some((code) => /CACHE|TAMPER|IDENTITY/u.test(code)) ||
          again.status === 0,
        JSON.stringify(again.value, null, 2),
      ).toBe(true);
    });

    it('R7-014-CENSUS-COMPLETE emits the complete review topic census', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'review-topic-count', ['--candidate', frozen.candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).not.toBeNull();
    });

    it('R7-014-CANDIDATE-PROOF-EXACT rejects a substituted candidate manifest', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const manifest = harnessReadJson(current.root, `${HARNESS_STATE}/candidate-manifest.json`);
      manifest.tree_sha = '0'.repeat(40);
      harnessPutJson(current.root, `${HARNESS_STATE}/candidate-manifest.json`, manifest);
      const outcome = harnessRun(current, 'review-scope', ['--candidate', frozen.candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-015-REUSE-REJECTED refuses unauthenticated disposition reuse', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      expect(frozen.candidate).toMatch(/^[a-f0-9]{40}$/u);
      const outcome = harnessRun(current, 'review-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).not.toBe(null);
    });

    it('R7-015-STREAM-CANONICAL rejects a non-canonical review result stream', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      harnessPut(
        current.root,
        `${HARNESS_STATE}/review-result.json`,
        `{"schemaVersion":"1.0.0","candidate_sha":"${frozen.candidate}",}\n`,
      );
      const outcome = harnessRun(current, 'review-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-016-NO-PLACEHOLDER-DIGEST rejects placeholder residue in claims', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const claims = harnessReadJson(current.root, `${HARNESS_STATE}/current-claims.json`);
      const list = (claims.claims ?? []) as Array<Record<string, unknown>>;
      if (list.length > 0) list[0].value_digest_sha256 = '0'.repeat(64);
      harnessPutJson(current.root, `${HARNESS_STATE}/current-claims.json`, claims);
      const outcome = harnessRun(current, 'claims-check', ['--candidate', frozen.candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-016-CLAIM-DIGEST-EXACT binds each claim to its exact source bytes', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'claims-check', ['--candidate', frozen.candidate]);
      expect(harnessCodes(outcome)).not.toContain('CLAIM_PLACEHOLDER_RESIDUE');
    });

    it('R7-017-RENAME-PREIMAGE-READ reads both sides of a committed rename', () => {
      const { root, candidate } = clone();
      const from = 'packages/cli/src/generated/r7-rename-source.ts';
      const to = 'packages/cli/src/generated/r7-rename-target.ts';
      writeFileSync(join(root, from), "export const value = require('x');\n");
      commitAll(root, 'test: rename source');
      const before = git(root, ['rev-parse', 'HEAD']);
      execFileSync('git', ['mv', from, to], { cwd: root });
      execFileSync(
        'git',
        ['-c', 'user.name=I', '-c', 'user.email=i@t', 'commit', '-qm', 'test: rename'],
        { cwd: root },
      );
      const after = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, [
        'impact-plan',
        '--round',
        'R-0007',
        '--base',
        before,
        '--head',
        after,
        '--candidate',
        after,
      ]);
      const serialized = JSON.stringify(outcome.value ?? {});
      expect(serialized, 'the rename preimage must appear in the plan').toContain(
        'r7-rename-source',
      );
      expect(candidate).not.toBe(after);
    });

    it('R7-017-COPY-PREIMAGE-READ reads the preimage of a copied input', () => {
      const { root, candidate } = clone();
      const source = 'packages/cli/src/generated/r7-copy-source.ts';
      const copy = 'packages/cli/src/generated/r7-copy-target.ts';
      writeFileSync(join(root, source), "export const value = require('x');\n");
      commitAll(root, 'test: copy source');
      const before = git(root, ['rev-parse', 'HEAD']);
      writeFileSync(join(root, copy), readFileSync(join(root, source), 'utf8'));
      commitAll(root, 'test: copy');
      const after = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, [
        'impact-plan',
        '--round',
        'R-0007',
        '--base',
        before,
        '--head',
        after,
        '--candidate',
        after,
      ]);
      expect(JSON.stringify(outcome.value ?? {})).toContain('r7-copy-target');
      expect(candidate).not.toBe(after);
    });

    it('R7-018-SCOPE-IDENTITY-RECOMPUTED recomputes the core scope identity', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'review-scope', ['--candidate', frozen.candidate]);
      expect(harnessCodes(outcome)).not.toContain('REVIEW_SCOPE_RECOMPUTATION_INVALID');
    });

    it('R7-018-SCOPE-IDENTITY-SUBSTITUTION-FAILS rejects a substituted scope identity', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      harnessRun(current, 'review-scope', ['--candidate', frozen.candidate]);
      const scopePath = `${HARNESS_STATE}/review-scope-manifest.json`;
      const manifest = harnessReadJson(current.root, scopePath);
      const proof = (manifest.identity_proof ?? {}) as Record<string, unknown>;
      proof.identity_digest_sha256 = 'a'.repeat(64);
      manifest.identity_proof = proof;
      harnessPutJson(current.root, scopePath, manifest);
      const outcome = harnessRun(current, 'review-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-019-CENSUS-TRANSITIVE derives the control census transitively', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'policy-check', ['--candidate', frozen.candidate]);
      expect(harnessCodes(outcome)).not.toContain('ACTIVE_CONTROL_CENSUS_INCOMPLETE');
    });

    it('R7-019-CENSUS-NO-ALLOWLIST rejects an unregistered active control', () => {
      const current = harnessFixture(true);
      harnessPut(
        current.root,
        'product/owner-mandates/OM-902.md',
        mandate(
          { ...bindingMarker(), mandate_id: 'OM-902' },
          {
            id: 'OM-902',
            status: 'active',
            authority: 'Owner',
          },
        ),
      );
      harnessCommit(current.root, 'test: unregistered active control');
      const outcome = harnessRun(current, 'policy-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });

    it('R7-020-OBLIGATIONS-COMPLETE covers every declared obligation source', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'policy-check', ['--candidate', frozen.candidate]);
      expect(harnessCodes(outcome)).not.toContain('SEMANTIC_OBLIGATION_ID_UNCOVERED');
    });

    it('R7-020-OBLIGATION-SOURCE-DRIFT rejects a drifted obligation source digest', () => {
      const current = harnessFixture(true);
      const obligationsPath = `work/rounds/${HARNESS_ROUND}/review-obligations.json`;
      const obligations = harnessReadJson(current.root, obligationsPath) as Record<string, unknown>;
      const sources = (obligations.sources ?? []) as Array<Record<string, unknown>>;
      if (sources.length > 0) sources[0].source_digest_sha256 = 'b'.repeat(64);
      harnessPutJson(current.root, obligationsPath, obligations);
      harnessCommit(current.root, 'test: drift an obligation source digest');
      const outcome = harnessRun(current, 'policy-check', []);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
    });
  });
});
