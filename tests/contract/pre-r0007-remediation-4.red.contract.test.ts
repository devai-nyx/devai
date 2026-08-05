// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import {
  constants,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
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
  digestCanonical,
  digestBytes,
  materializeTerminal,
  passingResult,
  refreshDispositionProof,
  selfDigest,
  redigestState,
  stateChain,
  transition,
  repairEvidence,
  withAuthenticReuse,
} from './helpers/r0007-review-harness.js';

vi.setConfig({ testTimeout: 300_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const POLICY_PATH = 'law/policy/round-close-controls.json';
const PROFILE_PATH = 'work/rounds/R-0007/close-control-profile.json';
const REGISTRY_PATH = 'work/rounds/R-0007/prior-finding-registry.json';
const disposable: string[] = [];
let offlineStoreParent: string | null = null;
let offlineStore: string | null = null;

afterEach(() => {
  for (const root of disposable.splice(0)) rmSync(root, { recursive: true, force: true });
  disposeHarness();
}, 120_000);

afterAll(() => {
  if (offlineStoreParent !== null) rmSync(offlineStoreParent, { recursive: true, force: true });
}, 120_000);

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

/**
 * Copy the active install's content-addressed cache once, then require every disposable
 * candidate to prove that a real frozen install succeeds without network access.
 */
function hermeticOfflineStore(): string {
  if (offlineStore !== null) return offlineStore;
  const modulesManifest = parseYaml(
    readFileSync(join(ROOT, 'node_modules/.modules.yaml'), 'utf8'),
  ) as { storeDir?: unknown };
  const source = modulesManifest.storeDir;
  if (typeof source !== 'string' || source.length === 0)
    throw new Error('active pnpm install does not declare storeDir');
  if (!existsSync(source)) throw new Error(`active pnpm store does not exist: ${source}`);

  offlineStoreParent = mkdtempSync(join(tmpdir(), 'devai-r7-offline-store-'));
  const fixtureClone = join(offlineStoreParent, 'repo');
  execFileSync('git', ['clone', '--quiet', '--shared', ROOT, fixtureClone]);
  offlineStore = join(fixtureClone, '.pnpm-store');
  mkdirSync(offlineStore, { recursive: true });
  cpSync(source, join(offlineStore, basename(source)), {
    recursive: true,
    mode: constants.COPYFILE_FICLONE,
  });
  return offlineStore;
}

/** A disposable, independently installed clone of the repository's exact current commit. */
function clone(): { root: string; candidate: string } {
  const parent = mkdtempSync(join(tmpdir(), 'devai-r7-remediation4-'));
  disposable.push(parent);
  const root = join(parent, 'repo');
  execFileSync('git', ['clone', '--quiet', '--shared', ROOT, root]);
  execFileSync(
    'pnpm',
    ['install', '--offline', '--frozen-lockfile', '--store-dir', hermeticOfflineStore()],
    {
      cwd: root,
      env: { ...process.env, CI: '1' },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: 300_000,
    },
  );
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
    env: { ...process.env, CI: '', GITHUB_ACTIONS: '' },
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

function createSubstitutedStateBeforeAttempt(attempt: 1 | 2): {
  outcome: ReturnType<typeof harnessRun>;
} {
  const current = harnessFixture(true);
  const frozen = harnessFreeze(current);
  const scoped = harnessRun(current, 'review-scope', [
    '--base',
    current.base,
    '--candidate',
    frozen.candidate,
  ]);
  expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);

  for (let ordinal = 1; ordinal <= attempt; ordinal += 1) {
    const resultPath = `fixture/invalid-review-${String(ordinal)}.json`;
    harnessPut(current.root, resultPath, '{\n');
    const invalid = harnessRun(current, 'review-check', [
      '--candidate',
      frozen.candidate,
      '--cycle',
      '1',
      '--review-result',
      resultPath,
    ]);
    expect(invalid.status, JSON.stringify(invalid.value, null, 2)).toBe(1);
  }

  const transportPath = `${HARNESS_STATE}/review-transports/attempt-${String(attempt)}.json`;
  const transport = harnessReadJson(current.root, transportPath);
  transport.state_before_digest = 'e'.repeat(64);
  const substitutedTransport = selfDigest(transport, 'transport_digest_sha256');
  harnessPutJson(current.root, transportPath, substitutedTransport);
  harnessPutJson(current.root, `${HARNESS_STATE}/review-transport.json`, substitutedTransport);

  const state = harnessReadJson(current.root, `${HARNESS_STATE}/review-state.json`);
  const transportDigests = [...(state.transport_history_digests as string[])];
  transportDigests[attempt - 1] = substitutedTransport.transport_digest_sha256 as string;
  state.transport_history_digests = transportDigests;
  state.current_transport_digest = substitutedTransport.transport_digest_sha256;
  const substitutedState = redigestState(state);
  harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, substitutedState);
  harnessPutJson(
    current.root,
    `${HARNESS_STATE}/review-states/${String(substitutedState.state_digest_sha256)}.json`,
    substitutedState,
  );

  return {
    outcome: harnessRun(current, 'review-check', ['--candidate', frozen.candidate]),
  };
}

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
      expect(gate, 'materializations must remain an authoritative literal gate').toBeTruthy();
      // Remove the exact profile from a committed, otherwise-clean candidate. Requiring
      // the profile-specific finding proves that the literal gate consumed the profile;
      // expecting an all-green exit here would instead conflate this contract with
      // unrelated closure-materialization findings.
      rmSync(join(root, PROFILE_PATH));
      commitAll(root, 'test: remove the profile consumed by materializations');
      const [program, ...args] = gate?.argv ?? [];
      const result = spawnSync(program ?? '', args, { cwd: root, encoding: 'utf8' });
      const output = `${result.stdout}\n${result.stderr}`;
      expect(result.status, output).toBe(1);
      expect(output).toContain('ROUND_PROFILE_INVALID');
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
      // Force every row through the candidate-derived comparison. Reading the declared
      // graph directly would only test an Architect materialization, not the controller
      // fixpoint this case names.
      for (const entry of graph.command_closure) entry.closure_digest = 'f'.repeat(64);
      putJson(root, 'work/rounds/R-0007/affected-test-graph.json', graph);
      commitAll(root, 'test: force every gate through closure derivation');
      const candidate = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['policy-check', '--round', 'R-0007', '--candidate', candidate]);
      const derivations = (
        (outcome.value?.findings ?? []) as Array<{
          code?: string;
          derived?: Record<string, unknown>;
        }>
      )
        .filter(({ code }) => code === 'GATE_COMMAND_CLOSURE_DERIVATION_INVALID')
        .map(({ derived }) => derived)
        .filter((entry): entry is Record<string, unknown> => entry !== undefined);
      expect(
        derivations,
        `every forced gate must expose its candidate-derived closure\n${detail(outcome)}`,
      ).toHaveLength(graph.command_closure.length);
      const union = new Set<string>();
      for (const entry of derivations)
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
      const policy = json<{
        convergence: { commands: Array<{ id: string; argv: string[] }> };
      }>(root, POLICY_PATH);
      const graph = json<{ command_closure: Array<Record<string, unknown>> }>(
        root,
        'work/rounds/R-0007/affected-test-graph.json',
      );
      const probes = ['eslint', 'changeset'];
      probes.forEach((program, index) => {
        const command = policy.convergence.commands[index];
        const closure = graph.command_closure[index];
        if (command === undefined || closure === undefined)
          throw new Error(`fixture closure entry ${String(index)} is absent`);
        command.argv = ['pnpm', 'exec', program, '--version'];
        closure.closure_digest = 'e'.repeat(64);
      });
      putJson(root, POLICY_PATH, policy);
      putJson(root, 'work/rounds/R-0007/affected-test-graph.json', graph);
      commitAll(root, 'test: introduce generic delegated program probes');
      const candidate = git(root, ['rev-parse', 'HEAD']);
      const outcome = run(root, ['policy-check', '--round', 'R-0007', '--candidate', candidate]);
      const findings = (outcome.value?.findings ?? []) as Array<{
        code?: string;
        gate_id?: string;
        derived?: { programs?: string[] };
      }>;
      const missing = probes.filter((program, index) => {
        const command = policy.convergence.commands[index];
        if (command === undefined) throw new Error(`fixture command ${String(index)} is absent`);
        const gateId = command.id;
        return !findings.some(
          (finding) =>
            finding.code === 'GATE_COMMAND_CLOSURE_DERIVATION_INVALID' &&
            finding.gate_id === gateId &&
            finding.derived?.programs?.includes(program),
        );
      });
      expect(
        missing,
        `${detail(outcome)}\nprograms not parsed generically: ${missing.join(', ')}`,
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
      const firstClosure = graph.command_closure[0];
      if (firstClosure === undefined) throw new Error('fixture command closure is empty');
      firstClosure.closure_digest = 'f'.repeat(64);
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
      const evidenceCommits = git(ROOT, ['log', '--diff-filter=A', '--format=%H', '--', EVIDENCE])
        .split('\n')
        .filter(Boolean);
      expect(evidenceCommits, 'red evidence must have one immutable creation commit').toHaveLength(
        1,
      );
      const red = evidenceCommits[0];
      if (red === undefined) throw new Error('red evidence creation commit is absent');
      expect(
        git(ROOT, ['rev-parse', `${red}^`]),
        'the evidence payload must identify the exact rejected Inspector candidate',
      ).toBe(evidence.inspector_candidate_sha);
      const profile = json<{ sources: { remediation_closure_matrix: string } }>(ROOT, PROFILE_PATH);
      const matrix = json<{ classes: Array<{ implementation_surfaces: string[] }> }>(
        ROOT,
        profile.sources.remediation_closure_matrix,
      );
      const surfaces = [...new Set(matrix.classes.flatMap((c) => c.implementation_surfaces))];
      const offenders: string[] = [];
      for (const surface of surfaces) {
        const touching = git(ROOT, ['log', '--format=%H', `${red}..HEAD`, '--', surface])
          .split('\n')
          .filter(Boolean);
        for (const commitSha of touching) {
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
      const evidenceCommit = git(ROOT, ['log', '--diff-filter=A', '--format=%H', '--', EVIDENCE]);
      expect(evidenceCommit).toMatch(/^[a-f0-9]{40}$/u);
      const profile = json<{ sources: { remediation_closure_matrix: string } }>(ROOT, PROFILE_PATH);
      const matrix = json<{ classes: Array<{ implementation_surfaces: string[] }> }>(
        ROOT,
        profile.sources.remediation_closure_matrix,
      );
      const surfaces = [...new Set(matrix.classes.flatMap((c) => c.implementation_surfaces))];
      const implementations = git(ROOT, [
        'log',
        '--reverse',
        '--format=%H',
        `${evidenceCommit}..HEAD`,
        '--',
        ...surfaces,
      ])
        .split('\n')
        .filter(Boolean);
      expect(implementations.length, 'red evidence must precede an implementation').toBeGreaterThan(
        0,
      );
      const touching = git(ROOT, [
        'log',
        '--format=%H',
        `${implementations[0]}~1..HEAD`,
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

      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const scopeDigest = (scoped.value.manifest as { manifest_digest_sha256: string })
        .manifest_digest_sha256;
      const unproved: string[] = [];
      for (const [from, to] of edges) {
        const queue: Array<{ state: string; path: ReadonlyArray<readonly [string, string]> }> = [
          { state: 'DRAFT', path: [] },
        ];
        const visited = new Set<string>();
        let prefix: ReadonlyArray<readonly [string, string]> | null = null;
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined || visited.has(next.state)) continue;
          if (next.state === from) {
            prefix = next.path;
            break;
          }
          visited.add(next.state);
          for (const target of policy.review_state_machine.allowed_transitions[next.state] ?? [])
            queue.push({ state: target, path: [...next.path, [next.state, target] as const] });
        }
        expect(prefix, `no declared path reaches ${from}`).not.toBeNull();
        const path = [...(prefix ?? []), [from, to] as const];
        const history = path.map(([edgeFrom, edgeTo]) =>
          transition(edgeFrom, edgeTo, frozen, { review_scope_digest: scopeDigest }),
        );
        const cycle = Number(history.at(-1)?.cycle) as 1 | 2;
        const state = stateChain(current, frozen, to, cycle, scopeDigest, history);
        harnessPutJson(current.root, STATE_PATH, state);

        const baseline = harnessRun(current, 'review-check', ['--candidate', frozen.candidate]);
        const baselineEdges = (
          (baseline.value.findings ?? []) as Array<{ code?: string; ordinal?: number }>
        ).filter(({ code }) => code === 'REVIEW_STATE_TRANSITION_EDGE_INVALID');
        if (baselineEdges.length > 0) {
          unproved.push(`${from}->${to}: declared edge rejected`);
          continue;
        }

        // Keep the artifact internally self-consistent while changing the exercised edge
        // to a schema-valid but undeclared target. A digest-only failure would not prove
        // that the controller consumes the policy edge population.
        const mutated = structuredClone(state) as Record<string, unknown>;
        const entries = mutated.transition_history as Array<Record<string, unknown>>;
        const lastEntry = entries.at(-1);
        expect(lastEntry, 'mutated transition history must have a terminal edge').toBeDefined();
        if (lastEntry === undefined) throw new Error('transition history is empty');
        lastEntry.to = 'DRAFT';
        mutated.state = 'DRAFT';
        mutated.cycle = 1;
        const redigested = redigestState(mutated);
        harnessPutJson(current.root, STATE_PATH, redigested);
        const outcome = harnessRun(current, 'review-check', ['--candidate', frozen.candidate]);
        const detected = (
          (outcome.value.findings ?? []) as Array<{ code?: string; ordinal?: number }>
        ).some(
          ({ code, ordinal }) =>
            code === 'REVIEW_STATE_TRANSITION_EDGE_INVALID' && ordinal === path.length,
        );
        if (!detected) unproved.push(`${from}->${to}: substituted edge accepted`);
      }
      expect(
        unproved,
        `declared edges not discriminated at runtime: ${unproved.join(', ')}`,
      ).toEqual([]);
    });

    it('R7-002-THREE-TERMINALS-RUNTIME refuses re-entry from every terminal state', () => {
      const policyFixture = harnessFixture(true);
      const policy = harnessReadJson(
        policyFixture.root,
        'law/policy/round-close-controls.json',
      ) as {
        review_state_machine: { terminal_states: string[] };
      };
      const terminals = policy.review_state_machine.terminal_states;
      expect([...terminals].sort()).toEqual(
        ['ESCALATION_REQUIRED', 'PASS', 'REVIEW_TRANSPORT_BLOCKED'].sort(),
      );

      const cases = [
        {
          terminal: 'PASS',
          predecessor: 'CYCLE_1_ACTIVE',
          cycle: 1,
        },
        {
          terminal: 'ESCALATION_REQUIRED',
          predecessor: 'CYCLE_2_ACTIVE',
          cycle: 2,
        },
        {
          terminal: 'REVIEW_TRANSPORT_BLOCKED',
          predecessor: 'CYCLE_1_ACTIVE',
          cycle: 1,
        },
      ] as const;
      for (const { terminal, predecessor, cycle } of cases) {
        const { current, frozen } = materializeTerminal(terminal, predecessor, cycle);
        const scope = harnessReadJson(current.root, `${HARNESS_STATE}/review-scope-manifest.json`);
        const state = harnessReadJson(current.root, STATE_PATH);
        const lastTransition = (state.transition_history as Array<Record<string, unknown>>).at(-1);
        expect(state).toMatchObject({
          state: terminal,
          cycle,
          candidate_sha: frozen.candidate,
          review_scope_digest: scope.manifest_digest_sha256,
        });
        expect(lastTransition).toMatchObject({
          from: predecessor,
          to: terminal,
          cycle,
          candidate_sha: frozen.candidate,
          review_scope_digest: scope.manifest_digest_sha256,
        });

        const outcome = harnessRun(current, 'review-check', [
          '--candidate',
          frozen.candidate,
          '--cycle',
          String(cycle),
        ]);
        expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
        expect(outcome.value).toMatchObject({
          command: 'review-check',
          candidate: frozen.candidate,
          cycle,
          state: terminal,
          findings: expect.arrayContaining([
            expect.objectContaining({
              code: 'REVIEW_STATE_TERMINAL',
              message: 'terminal review state has no successor',
            }),
          ]),
        });
      }
    });

    it('R7-002-ATTEMPTS-ZERO-ONE-TWO authenticates every transport attempt ordinal', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const unproved: string[] = [];
      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const zeroState = harnessReadJson(current.root, STATE_PATH);
      expect(zeroState.transport_attempts).toBe(0);
      expect(zeroState.transport_history_digests).toEqual([]);
      const zero = harnessRun(current, 'review-check', ['--candidate', frozen.candidate]);
      if (
        harnessCodes(zero).some((code) =>
          [
            'REVIEW_TRANSPORT_ATTEMPT_POPULATION_INCOMPLETE',
            'REVIEW_TRANSPORT_CHAIN_MISSING',
            'REVIEW_TRANSPORT_CHAIN_INVALID',
          ].includes(code),
        )
      )
        unproved.push('attempt-0: empty population rejected');

      for (const attempt of [1, 2] as const) {
        const { outcome } = createSubstitutedStateBeforeAttempt(attempt);
        const expectedCode =
          attempt === 1 ? 'REVIEW_TRANSPORT_CHAIN_INVALID' : 'REVIEW_TRANSPORT_PREDECESSOR_INVALID';
        const detected = (
          (outcome.value.findings ?? []) as Array<{ code?: string; attempt?: number }>
        ).some(({ code, attempt: observedAttempt }) => {
          return code === expectedCode && observedAttempt === attempt;
        });
        if (!detected) unproved.push(`attempt-${String(attempt)}: substituted state accepted`);
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
      // The expected repaired-class population is derived from the authenticated prior
      // failure result, so that result must exist and be retrievable by its digest.
      const priorResult = selfDigest(
        {
          schemaVersion: '1.0.0',
          round: HARNESS_ROUND,
          candidate_sha: frozen.candidate,
          findings: [
            {
              finding_id: 'FIXTURE-FAILURE',
              defect_class_id: 'FIXTURE_CLASS',
              severity: 'P1',
            },
            {
              finding_id: 'FIXTURE-FAILURE-B',
              defect_class_id: 'FIXTURE_CLASS_B',
              severity: 'P1',
            },
          ],
        },
        'result_digest_sha256',
      );
      const priorResultDigest = priorResult.result_digest_sha256 as string;
      harnessPutJson(
        current.root,
        `${HARNESS_STATE}/review-results/${priorResultDigest}.json`,
        priorResult,
      );

      const repair = repairEvidence(
        frozen,
        scopeDigest,
        priorResultDigest,
        'b'.repeat(64),
        frozen.candidate,
      ) as Record<string, unknown>;

      // Delete one repaired class and re-digest, so the artifact is internally
      // consistent. The state then binds the MUTATED digest: if it bound the original,
      // the controller would reject on the evidence-digest check and the case would pass
      // without ever exercising the derived class population it names.
      const seeded = (repair.repaired_classes ?? []) as Array<Record<string, unknown>>;
      expect(seeded.length, 'repair evidence must carry a class population').toBeGreaterThan(0);
      repair.repaired_classes = [...seeded, { ...seeded[0], defect_class_id: 'FIXTURE_CLASS_B' }];
      const repaired = repair.repaired_classes as unknown[];
      // Delete one of two, so the artifact stays schema-valid and only the derived
      // population disagrees. Emptying the array would fail schema minItems instead.
      repair.repaired_classes = repaired.slice(1);
      const mutatedRepair = selfDigest(repair, 'repair_evidence_digest_sha256');
      harnessPutJson(current.root, `${HARNESS_STATE}/review-repair-evidence.json`, mutatedRepair);

      const state = stateChain(current, frozen, 'PREFLIGHT_GREEN', 1, scopeDigest, history, {
        repair_evidence_digest: mutatedRepair.repair_evidence_digest_sha256,
        prior_failure_result_digest: mutatedRepair.prior_review_result_digest,
        prior_failure_state_digest: mutatedRepair.prior_failure_state_digest,
        prior_failure_transport_digest: mutatedRepair.prior_failure_transport_digest,
        previous_candidate_sha: mutatedRepair.prior_candidate_sha,
      });
      harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, state);
      const outcome = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      const linkFinding = (
        (outcome.value.findings ?? []) as Array<{ code?: string; failed_checks?: string[] }>
      ).find(({ code }) => code === 'REVIEW_STATE_REPAIR_LINK_INVALID');
      expect(linkFinding, JSON.stringify(outcome.value, null, 2)).toBeTruthy();
      // The finding must name the population check. Any other failed check would mean the
      // case passed on artifact bookkeeping rather than on the derived class population.
      expect(
        linkFinding?.failed_checks,
        `expected the repaired-class population check to fail, got ${JSON.stringify(linkFinding?.failed_checks)}`,
      ).toEqual(['repaired_class_population']);
    });

    it('R7-001-NO-SELF-COMPARED-EXPECTATION detects a substituted state-before artifact', () => {
      const { outcome } = createSubstitutedStateBeforeAttempt(1);
      const finding = (
        (outcome.value.findings ?? []) as Array<{ code?: string; attempt?: number }>
      ).find(({ code, attempt }) => code === 'REVIEW_TRANSPORT_CHAIN_INVALID' && attempt === 1);
      expect(finding, JSON.stringify(outcome.value, null, 2)).toBeTruthy();
    });

    it('R7-001-PREDECESSOR-ARTIFACT-END-TO-END binds the complete predecessor artifact', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const scopeDigest = (scoped.value.manifest as { manifest_digest_sha256: string })
        .manifest_digest_sha256;
      const history = [
        transition('DRAFT', 'PREFLIGHT_GREEN', frozen, { review_scope_digest: scopeDigest }),
        transition('PREFLIGHT_GREEN', 'CANDIDATE_FROZEN', frozen, {
          review_scope_digest: scopeDigest,
        }),
        transition('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', frozen, {
          review_scope_digest: scopeDigest,
        }),
        transition('CYCLE_1_ACTIVE', 'REPAIR_REQUIRED', frozen, {
          review_scope_digest: scopeDigest,
        }),
      ];
      const state = stateChain(
        current,
        frozen,
        'REPAIR_REQUIRED',
        1,
        scopeDigest,
        history,
      ) as Record<string, unknown>;
      const entries = state.transition_history as Array<Record<string, unknown>>;
      const predecessor = entries.at(-1)?.previous_state_artifact as Record<string, unknown>;
      expect(
        predecessor,
        'a production writer must persist the predecessor artifact reference',
      ).toBeTruthy();
      // Substitute only the persisted reference and re-digest the complete state. The
      // retained predecessor bytes still corroborate previous_state_digest, so a reader
      // that ignores previous_state_artifact would accept this mutation.
      predecessor.artifact_digest_sha256 = 'c'.repeat(64);
      const substituted = redigestState(state);
      harnessPutJson(current.root, `${HARNESS_STATE}/review-state.json`, substituted);
      const outcome = harnessRun(current, 'review-check', ['--candidate', frozen.candidate]);
      const finding = (
        (outcome.value.findings ?? []) as Array<{ code?: string; ordinal?: number }>
      ).find(
        ({ code, ordinal }) =>
          code === 'REVIEW_STATE_PREDECESSOR_STATE_INVALID' && ordinal === history.length,
      );
      expect(finding, JSON.stringify(outcome.value, null, 2)).toBeTruthy();
    });
  });

  describe('R7-F011 no authoritative consumer terminates without a structured result', () => {
    it('R7-021-REVIEW-SCOPE-BASE-BLOCKS refuses an omitted base with a finding', () => {
      const { root, candidate } = clone();
      const outcome = run(root, ['review-scope', '--round', 'R-0007', '--candidate', candidate]);
      // The controller must emit a structured result. Terminating on an uncaught throw
      // gives a caller silence, which is indistinguishable from finding nothing wrong.
      expect(outcome.value, detail(outcome)).not.toBeNull();
      expect(outcome.status, detail(outcome)).toBe(1);
      expect(codes(outcome), detail(outcome)).not.toEqual([]);
    });

    it('R7-021-NO-SILENT-TERMINATION holds for every authoritative consumer', () => {
      const { root, candidate } = clone();
      const offenders: string[] = [];
      for (const command of AUTHORITATIVE_COMMANDS) {
        // Supply the candidate but omit every other revision argument.
        const outcome = run(root, [command, '--round', 'R-0007', '--candidate', candidate]);
        if (outcome.value === null)
          offenders.push(`${command}: no structured result (status ${String(outcome.status)})`);
      }
      expect(
        offenders,
        `consumers terminating without a structured result:\n${offenders.join('\n')}`,
      ).toEqual([]);
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
      for (const [failingOrdinal, failing] of gateIds.entries()) {
        const cacheRoot = join(current.root, `${HARNESS_STATE}/freshness/tasks/gate-${failing}`);
        rmSync(cacheRoot, { recursive: true, force: true });
        expect(
          existsSync(cacheRoot),
          `${failing}: failing gate cache must be absent so the mutation is executed`,
        ).toBe(false);
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
        const complete = first.every((record) => {
          return typeof record.gate_id === 'string' && Number.isInteger(record.exit_code as number);
        });
        if (!complete) offenders.push(`${failing}: record missing gate_id or exit_code`);
        const ordered = first.map((record) => String(record.gate_id));
        if (JSON.stringify(ordered) !== JSON.stringify(gateIds))
          offenders.push(`${failing}: population reordered or incomplete`);
        const failedRecord = first[failingOrdinal];
        if (
          failedRecord?.gate_id !== failing ||
          failedRecord.outcome !== 'EXECUTE' ||
          failedRecord.result !== 'EXECUTED_FAIL' ||
          failedRecord.exit_code !== 19
        )
          offenders.push(
            `${failing}: ordinal ${String(failingOrdinal + 1)} did not retain its exact executed failure`,
          );
        const exactFinding = (
          (converged.value.findings ?? []) as Array<Record<string, unknown>>
        ).some(
          (finding) =>
            finding.code === 'CONVERGENCE_GATE_FAILED' &&
            finding.task_id === failing &&
            finding.exit_code === 19,
        );
        if (!exactFinding) offenders.push(`${failing}: exact gate failure finding is absent`);
      }
      expect(
        offenders,
        `failure ordinals losing the complete ordered population:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });
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
      const candidate = harnessGit(current.root, ['rev-parse', 'HEAD']);
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(0);
      expect(outcome.value).toMatchObject({
        command: 'policy-check',
        round: HARNESS_ROUND,
        entry_ready: true,
        diagnostics: [],
        findings: [],
      });

      // A clean result alone does not prove that a census occurred. Remove the only
      // structured marker while retaining the active mandate container and provenance,
      // so the exact zero-binding branch must be reached.
      harnessPut(
        current.root,
        'product/owner-mandates/OM-900.md',
        '---\nid: OM-900\nstatus: active\nauthority: Owner\n---\n\n# No structured binding\n',
      );
      const unboundCandidate = harnessCommit(current.root, 'test: remove exact reviewer binding');
      const unbound = harnessRun(current, 'policy-check', ['--candidate', unboundCandidate]);
      expect(unbound.status, JSON.stringify(unbound.value, null, 2)).toBe(1);
      expect(unbound.value.findings).toEqual([
        {
          code: 'ENTRY_BLOCKED_REVIEWER_UNBOUND',
          message: 'round reviewer has no tracked complete active binding',
        },
      ]);
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
      const candidate = harnessCommit(current.root, 'test: second active reviewer binding');
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
          message: 'more than one complete active binding selects the round',
          mandate_ids: ['OM-900', 'OM-901'],
        },
      ]);
    });

    it('R7-012-NO-GATE-OMITTED converges over the complete declared population', () => {
      const current = harnessFixture(true);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        convergence: { commands: Array<{ id: string }> };
      };
      const expectedIds = policy.convergence.commands.map(({ id }) => id);
      const converged = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        harnessGit(current.root, ['rev-parse', 'HEAD']),
      ]);
      expect(converged.status, JSON.stringify(converged.value, null, 2)).toBe(0);
      const passes = (converged.value.passes ?? []) as Array<{
        pass?: number;
        results?: Array<{ gate_id?: string }>;
      }>;
      expect(
        passes.map(({ pass, results }) => ({
          pass,
          gate_ids: (results ?? []).map(({ gate_id }) => gate_id),
        })),
      ).toEqual([
        { pass: 1, gate_ids: expectedIds },
        { pass: 2, gate_ids: expectedIds },
      ]);
      expect(expectedIds).toHaveLength(16);
    });

    it('R7-012-ROSTER-DELETION-FAILS rejects a shortened authoritative roster', () => {
      const current = harnessFixture(true);
      const policy = harnessReadJson(current.root, 'law/policy/round-close-controls.json') as {
        convergence: { commands: Array<{ id: string }> };
      };
      policy.convergence.commands = policy.convergence.commands.slice(0, 15);
      harnessPutJson(current.root, 'law/policy/round-close-controls.json', policy);
      harnessPutJson(current.root, '.devai/config/round-close-controls.json', policy);
      const candidate = harnessCommit(current.root, 'test: delete one authoritative gate');
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'GATE_COMMAND_CLOSURE_INCOMPLETE',
          message:
            'every authoritative gate requires one ordered nonempty script and program closure',
        },
        {
          code: 'GATE_FRESHNESS_PROFILE_INCOMPLETE',
          message: 'freshness profile population differs from authoritative commands',
        },
      ]);
    });

    it('R7-013-CACHE-RECORD-IDENTITY binds each freshness record to its task key', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const converged = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        frozen.candidate,
      ]);
      expect(converged.status, JSON.stringify(converged.value, null, 2)).toBe(0);
      const firstPass = (
        (converged.value.passes ?? []) as Array<{
          results?: Array<{ task_key?: string; node_id?: string }>;
        }>
      )[0]?.results;
      expect(firstPass, 'convergence must expose the complete gate population').toHaveLength(16);
      const expectedTaskIds: string[] = [];
      for (const result of firstPass ?? []) {
        const taskId = `gate-${String(result.node_id)}`;
        const taskKey = String(result.task_key);
        expectedTaskIds.push(taskId);
        const cachePath = `${HARNESS_STATE}/freshness/tasks/${taskId}/${taskKey}.json`;
        const record = harnessReadJson(current.root, cachePath);
        const { result_digest: claimedDigest, ...recordBody } = record;
        expect(record).toMatchObject({
          task_id: taskId,
          task_key: taskKey,
          producing_candidate: frozen.candidate,
          result: 'EXECUTED_PASS',
        });
        expect(claimedDigest).toBe(digestCanonical(recordBody));
        record.task_key = '0'.repeat(64);
        harnessPutJson(current.root, cachePath, selfDigest(record, 'result_digest'));
      }

      const replay = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        frozen.candidate,
      ]);
      expect(replay.status, JSON.stringify(replay.value, null, 2)).toBe(0);
      expect(replay.value.findings).toEqual(
        expectedTaskIds.map((task_id) => ({
          code: 'CACHE_RECORD_IDENTITY_INVALID',
          message: 'cached PASS does not bind exact task identity',
          task_id,
          detail: 'Error: cache field task_key does not match the planned task',
        })),
      );
      const replayFirstPass = (
        (replay.value.passes ?? []) as Array<{
          results?: Array<{ gate_id?: string; outcome?: string; result?: string }>;
        }>
      )[0]?.results;
      expect(
        (replayFirstPass ?? []).map(({ gate_id, outcome, result }) => ({
          gate_id,
          outcome,
          result,
        })),
      ).toEqual(
        expectedTaskIds.map((taskId) => ({
          gate_id: taskId.slice('gate-'.length),
          outcome: 'EXECUTE',
          result: 'EXECUTED_PASS',
        })),
      );
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
      record.producing_candidate = 'f'.repeat(40);
      harnessPutJson(current.root, cachePath, selfDigest(record, 'result_digest'));
      const again = harnessRun(current, 'smart-converge', [
        '--base',
        current.base,
        '--head',
        frozen.candidate,
      ]);
      expect(again.status, JSON.stringify(again.value, null, 2)).toBe(0);
      expect(again.value.findings).toEqual([
        {
          code: 'CACHE_RECORD_IDENTITY_INVALID',
          message: 'cached PASS does not bind exact task identity',
          task_id: `gate-${String(sample?.node_id)}`,
          detail: 'Error: cache field producing_candidate does not match the planned task',
        },
      ]);
      const replaySample = (
        (again.value.passes ?? []) as Array<{
          results?: Array<{ node_id?: string; outcome?: string; result?: string }>;
        }>
      )[0]?.results?.find(({ node_id }) => node_id === sample?.node_id);
      expect(replaySample).toMatchObject({
        node_id: sample?.node_id,
        outcome: 'EXECUTE',
        result: 'EXECUTED_PASS',
      });
    });

    it('R7-014-CENSUS-COMPLETE emits the complete review topic census', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'review-topic-count', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(0);
      expect(outcome.value).toMatchObject({
        command: 'review-topic-count',
        base: current.base,
        candidate: frozen.candidate,
        topic_count: 9,
        findings: [],
      });

      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const topics = (scoped.value.manifest as { topics: Array<{ topic_kind: string }> }).topics;
      expect(topics.map(({ topic_kind }) => topic_kind).sort()).toEqual([
        'active-control',
        'candidate-identity',
        'changed-path',
        'changed-path',
        'convergence-evidence',
        'current-claim',
        'previous-finding-class',
        'previous-finding-class',
        'semantic-obligation',
      ]);
      expect(scoped.value.manifest).toMatchObject({ topic_count: outcome.value.topic_count });
    });

    it('R7-014-CANDIDATE-PROOF-EXACT rejects a substituted candidate manifest', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const manifest = harnessReadJson(current.root, `${HARNESS_STATE}/candidate-manifest.json`);
      manifest.tree_sha = '0'.repeat(40);
      harnessPutJson(
        current.root,
        `${HARNESS_STATE}/candidate-manifest.json`,
        selfDigest(manifest, 'manifest_digest_sha256'),
      );
      const outcome = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value).toMatchObject({
        command: 'review-scope',
        cycle: 1,
        manifest: null,
        findings: [
          {
            code: 'CANDIDATE_MANIFEST_IDENTITY_INVALID',
            message: 'candidate manifest does not bind the exact invocation',
            failed_checks: ['tree_sha'],
          },
        ],
      });
    });

    it('R7-015-REUSE-REJECTED refuses unauthenticated disposition reuse', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const manifest = scoped.value.manifest as Record<string, unknown>;
      const result = withAuthenticReuse(current, manifest, frozen);
      const disposition = (result.dispositions as Array<Record<string, unknown>>).find(
        ({ disposition: value }) => value === 'REUSED_FRESH_PASS',
      );
      expect(disposition, 'fixture must reach one reuse-eligible disposition').toBeDefined();
      if (disposition === undefined) throw new Error('reuse-eligible disposition is absent');
      const topicId = disposition?.topic_id;
      const topic = (manifest.topics as Array<Record<string, unknown>>).find(
        ({ topic_id: id }) => id === topicId,
      );
      expect(topic?.allowed_dispositions).toContain('REUSED_FRESH_PASS');
      const inputs = disposition?.recomputed_inputs_manifest as Array<Record<string, unknown>>;
      expect(inputs.length, 'reused disposition must carry authenticated inputs').toBeGreaterThan(
        0,
      );
      expect(inputs[0]?.digest).not.toBe('0'.repeat(64));
      const substitutedInput = inputs[0];
      if (substitutedInput === undefined) throw new Error('reuse input manifest is empty');
      substitutedInput.digest = '0'.repeat(64);
      refreshDispositionProof(disposition);
      const unauthenticated = selfDigest(result, 'result_digest_sha256');
      harnessPutJson(current.root, 'fixture/unauthenticated-reuse.json', unauthenticated);

      const outcome = harnessRun(current, 'review-check', [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/unauthenticated-reuse.json',
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REVIEW_DISPOSITION_INPUTS_INVALID',
            topic_id: topicId,
          }),
        ]),
      );
    });

    it('R7-015-STREAM-CANONICAL rejects a non-canonical review result stream', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const manifest = scoped.value.manifest as Record<string, unknown>;
      const review = passingResult(manifest, frozen);
      const { dispositions, findings, terminal, ...header } = review;
      const headerRecord = { type: 'header', ...header };
      const lines = [
        headerRecord,
        ...(dispositions as Array<Record<string, unknown>>).map((entry) => ({
          type: 'disposition',
          ...entry,
        })),
        ...(findings as Array<Record<string, unknown>>).map((entry) => ({
          type: 'finding',
          ...entry,
        })),
        { type: 'terminal', ...(terminal as Record<string, unknown>) },
        headerRecord,
      ].map((entry) => JSON.stringify(entry));
      expect(lines.map((line) => JSON.parse(line).type)).toEqual([
        'header',
        ...Array((dispositions as unknown[]).length).fill('disposition'),
        ...Array((findings as unknown[]).length).fill('finding'),
        'terminal',
        'header',
      ]);
      const stream = `${lines.join('\n')}\n`;
      harnessPut(current.root, 'fixture/noncanonical-review.jsonl', stream);

      const outcome = harnessRun(current, 'review-check', [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
        '--review-result',
        'fixture/noncanonical-review.jsonl',
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value).toMatchObject({
        command: 'review-check',
        candidate: frozen.candidate,
        cycle: 1,
        state: 'CYCLE_1_ACTIVE',
        findings: [
          {
            code: 'REVIEW_JSONL_NON_CANONICAL',
            message: 'malformed or truncated review result: Error: non-canonical JSONL stream',
          },
        ],
      });
      const transport = harnessReadJson(current.root, `${HARNESS_STATE}/review-transport.json`);
      expect(transport).toMatchObject({
        attempt: 1,
        candidate_sha: frozen.candidate,
        review_scope_digest: manifest.manifest_digest_sha256,
        payload_digest: digestBytes(stream),
        validation: 'INVALID_TRANSPORT',
      });
    });

    it('R7-016-NO-PLACEHOLDER-DIGEST rejects placeholder residue in claims', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const claims = harnessReadJson(current.root, `${HARNESS_STATE}/current-claims.json`);
      const list = (claims.claims ?? []) as Array<Record<string, unknown>>;
      expect(list, 'fixture must materialize one runtime claim').toHaveLength(1);
      const claim = list[0];
      if (claim === undefined) throw new Error('materialized claim is absent');
      const location = (claim.rendered_locations as string[])[0];
      expect(location, 'materialized claim must declare one rendered location').toBe(
        `work/audit/${HARNESS_ROUND}/as-built.md`,
      );
      if (location === undefined) throw new Error('materialized claim location is absent');
      harnessPut(
        current.root,
        location,
        `${readFileSync(join(current.root, location), 'utf8')}TODO\n`,
      );
      const outcome = harnessRun(current, 'claims-check', ['--candidate', frozen.candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual(
        expect.arrayContaining([
          {
            code: 'CLAIM_PLACEHOLDER_RESIDUE',
            message: 'rendered claim location contains unresolved placeholder residue',
            claim_id: claim.claim_id,
            location,
          },
        ]),
      );
    });

    it('R7-016-CLAIM-DIGEST-EXACT binds each claim to its exact source bytes', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const claimsPath = `${HARNESS_STATE}/current-claims.json`;
      const claims = harnessReadJson(current.root, claimsPath);
      const list = claims.claims as Array<Record<string, unknown>>;
      expect(list, 'fixture must materialize one runtime claim').toHaveLength(1);
      const claim = list[0];
      if (claim === undefined) throw new Error('materialized claim is absent');
      claim.value_digest = '0'.repeat(64);
      harnessPutJson(current.root, claimsPath, selfDigest(claims, 'claims_digest_sha256'));
      const outcome = harnessRun(current, 'claims-check', ['--candidate', frozen.candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'CLAIM_VALUE_DIGEST_INVALID',
          message: 'extracted value digest is invalid',
          claim_id: claim.claim_id,
        },
      ]);
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
      const cli = (
        (outcome.value?.nodes ?? []) as Array<{
          node_id?: string;
          outcome?: string;
          reason_codes?: string[];
          changed_inputs?: string[];
        }>
      ).find(({ node_id }) => node_id === 'cli-tests');
      expect(cli, JSON.stringify(outcome.value, null, 2)).toMatchObject({
        node_id: 'cli-tests',
        outcome: 'EXECUTE',
        reason_codes: expect.arrayContaining(['AFFECTED_INPUT_CHANGED']),
        changed_inputs: [from, to],
      });
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
      const cli = (
        (outcome.value?.nodes ?? []) as Array<{
          node_id?: string;
          outcome?: string;
          reason_codes?: string[];
          changed_inputs?: string[];
        }>
      ).find(({ node_id }) => node_id === 'cli-tests');
      expect(cli, JSON.stringify(outcome.value, null, 2)).toMatchObject({
        node_id: 'cli-tests',
        outcome: 'EXECUTE',
        reason_codes: expect.arrayContaining(['AFFECTED_INPUT_CHANGED']),
        changed_inputs: [source, copy],
      });
      expect(candidate).not.toBe(after);
    });

    it('R7-018-SCOPE-IDENTITY-RECOMPUTED recomputes the core scope identity', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const outcome = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(0);
      const scopePath = `${HARNESS_STATE}/review-scope-manifest.json`;
      const manifest = harnessReadJson(current.root, scopePath);
      manifest.candidate_tree = '0'.repeat(40);
      const substitutedManifest = selfDigest(manifest, 'manifest_digest_sha256');
      harnessPutJson(current.root, scopePath, substitutedManifest);

      const statePath = `${HARNESS_STATE}/review-state.json`;
      const state = harnessReadJson(current.root, statePath);
      state.review_scope_digest = substitutedManifest.manifest_digest_sha256;
      for (const entry of state.transition_history as Array<Record<string, unknown>>)
        entry.review_scope_digest = substitutedManifest.manifest_digest_sha256;
      harnessPutJson(current.root, statePath, redigestState(state));
      expect(existsSync(join(current.root, `${HARNESS_STATE}/review-transport.json`))).toBe(false);

      const checked = harnessRun(current, 'review-check', [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
      ]);
      expect(checked.status, JSON.stringify(checked.value, null, 2)).toBe(1);
      expect(checked.value.findings).toEqual(
        expect.arrayContaining([
          {
            code: 'REVIEW_SCOPE_IDENTITY_CANDIDATE_TREE_INVALID',
            message:
              'review scope core identity differs from independently derived invocation state',
            field: 'candidate_tree',
            expected: frozen.tree,
            actual: '0'.repeat(40),
          },
        ]),
      );
      expect(existsSync(join(current.root, `${HARNESS_STATE}/review-transport.json`))).toBe(false);
    });

    it('R7-018-SCOPE-IDENTITY-SUBSTITUTION-FAILS rejects a substituted scope identity', () => {
      const current = harnessFixture(true);
      const frozen = harnessFreeze(current);
      const scoped = harnessRun(current, 'review-scope', [
        '--base',
        current.base,
        '--candidate',
        frozen.candidate,
      ]);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const scopePath = `${HARNESS_STATE}/review-scope-manifest.json`;
      const manifest = harnessReadJson(current.root, scopePath);
      const proof = (manifest.identity_proof ?? {}) as Record<string, unknown>;
      expect(proof.identity_digest_sha256).not.toBe('a'.repeat(64));
      proof.identity_digest_sha256 = 'a'.repeat(64);
      manifest.identity_proof = proof;
      const substitutedManifest = selfDigest(manifest, 'manifest_digest_sha256');
      harnessPutJson(current.root, scopePath, substitutedManifest);

      const statePath = `${HARNESS_STATE}/review-state.json`;
      const state = harnessReadJson(current.root, statePath);
      state.review_scope_digest = substitutedManifest.manifest_digest_sha256;
      for (const entry of state.transition_history as Array<Record<string, unknown>>)
        entry.review_scope_digest = substitutedManifest.manifest_digest_sha256;
      const reboundState = redigestState(state);
      harnessPutJson(current.root, statePath, reboundState);
      expect(reboundState).toMatchObject({
        candidate_sha: frozen.candidate,
        review_scope_digest: substitutedManifest.manifest_digest_sha256,
      });

      const outcome = harnessRun(current, 'review-check', [
        '--candidate',
        frozen.candidate,
        '--cycle',
        '1',
      ]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'REVIEW_SCOPE_IDENTITY_PRETRANSPORT_REJECTED',
          message: 'scope identity proof does not match independent pre-transport recomputation',
        },
      ]);
    });

    it('R7-019-CENSUS-TRANSITIVE derives the control census transitively', () => {
      const current = harnessFixture(true);
      const registerPath = 'law/register/DECISIONS.md';
      const register = readFileSync(join(current.root, registerPath), 'utf8');
      harnessPut(
        current.root,
        registerPath,
        `${register.replace(
          'provenance: fixture`',
          'provenance: fixture · depends-on: DII-899`',
        )}\n### DII-899 — Transitive fixture dependency\n\`type: decision · status: active · authority: Architect · provenance: fixture\`\n`,
      );
      const candidate = harnessCommit(current.root, 'test: add undeclared transitive decision');
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
          message: 'declared decision edges differ from exact-register dependencies',
          decision_id: 'DII-900',
          declared: [],
          derived: ['DII-899'],
        },
      ]);
    });

    it('R7-019-CENSUS-NO-ALLOWLIST rejects an unregistered active control', () => {
      const current = harnessFixture(true);
      const planPath = `work/rounds/${HARNESS_ROUND}/plan.md`;
      harnessPut(current.root, planPath, '# plan\n\nActive Owner controls: OM-900, OM-902.\n');
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
      const obligationsPath = `work/rounds/${HARNESS_ROUND}/review-obligations.json`;
      const obligations = harnessReadJson(current.root, obligationsPath);
      const normativeSources = obligations.normative_sources as Array<Record<string, unknown>>;
      const planSource = normativeSources.find(({ path }) => path === planPath);
      expect(planSource, 'fixture plan must be registered as a normative source').toBeDefined();
      if (planSource === undefined) throw new Error('fixture plan source is absent');
      planSource.source_digest_sha256 = digestBytes(readFileSync(join(current.root, planPath)));
      harnessPutJson(current.root, obligationsPath, obligations);

      const provenancePath = `work/rounds/${HARNESS_ROUND}/control-provenance.json`;
      const provenance = harnessReadJson(current.root, provenancePath);
      provenance.discovery_mode = {
        decisions: 'exact-register-transitive-from-root',
        owner_mandates: 'exact-candidate-transitive-references',
        manifest_roots: 'profile-and-round-authority-derived',
        normative_sources: 'independent-obligation-baseline',
      };
      harnessPutJson(current.root, provenancePath, provenance);
      const candidate = harnessCommit(current.root, 'test: unregistered active control');
      expect(harnessGit(current.root, ['show', `${candidate}:${planPath}`])).toContain('OM-902');

      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual(
        expect.arrayContaining([
          {
            code: 'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
            message:
              'declared Owner mandates differ from exact-candidate transitive authority references',
            declared: ['OM-900'],
            derived: ['OM-900', 'OM-902'],
          },
        ]),
      );
    });

    it('R7-020-OBLIGATIONS-COMPLETE covers every declared obligation source', () => {
      const current = harnessFixture(true);
      const obligationsPath = `work/rounds/${HARNESS_ROUND}/review-obligations.json`;
      const baselinePath = `work/rounds/${HARNESS_ROUND}/review-obligation-baseline.json`;
      const obligations = harnessReadJson(current.root, obligationsPath);
      const baseline = harnessReadJson(current.root, baselinePath);
      const rows = obligations.obligations as Array<Record<string, unknown>>;
      const source = rows[0];
      if (source === undefined) throw new Error('fixture obligation is absent');
      const obligationId = 'R9000-P1-UNMAPPED';
      rows.push({
        ...source,
        obligation_id: obligationId,
        claim: 'This intentionally lacks a normative source mapping.',
      });
      (baseline.obligation_ids as string[]).push(obligationId);
      harnessPutJson(current.root, obligationsPath, obligations);
      harnessPutJson(current.root, baselinePath, baseline);
      const candidate = harnessCommit(current.root, 'test: add uncovered semantic obligation');
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'SEMANTIC_OBLIGATION_ID_UNCOVERED',
          message: 'registered obligations lack a normative source mapping',
          obligation_ids: [obligationId],
        },
      ]);
    });

    it('R7-020-OBLIGATION-SOURCE-DRIFT rejects a drifted obligation source digest', () => {
      const current = harnessFixture(true);
      const obligationsPath = `work/rounds/${HARNESS_ROUND}/review-obligations.json`;
      const obligations = harnessReadJson(current.root, obligationsPath) as Record<string, unknown>;
      const sources = (obligations.normative_sources ?? []) as Array<Record<string, unknown>>;
      expect(sources.length, 'fixture must bind at least one normative source').toBeGreaterThan(0);
      const source = sources[0];
      if (source === undefined) throw new Error('normative source fixture is absent');
      source.source_digest_sha256 = 'b'.repeat(64);
      harnessPutJson(current.root, obligationsPath, obligations);
      harnessCommit(current.root, 'test: drift an obligation source digest');
      const candidate = harnessGit(current.root, ['rev-parse', 'HEAD']);
      const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
      expect(outcome.status, JSON.stringify(outcome.value, null, 2)).toBe(1);
      expect(outcome.value.findings).toEqual([
        {
          code: 'SEMANTIC_OBLIGATION_SOURCE_DIGEST_INVALID',
          message: 'normative source digest differs from exact candidate bytes',
          path: source.path,
        },
      ]);
    });
  });
});
