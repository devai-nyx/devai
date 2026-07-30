// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { afterAll, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 120_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
const TEST_PATH = 'tests/contract/pre-r0007-remediation-3.red.contract.test.ts';
const MATRIX_PATH = 'work/rounds/R-0007/remediation-3-closure-matrix.json';
const POLICY_PATH = 'law/policy/round-close-controls.json';
const roots: string[] = [];

interface CommandResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly value: Record<string, unknown> | null;
}

function json<T>(root: string, path: string): T {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as T;
}

function put(root: string, path: string, contents: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents);
}

function putJson(root: string, path: string, value: unknown): void {
  put(root, path, `${JSON.stringify(value, null, 2)}\n`);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, message: string): string {
  git(root, ['add', '-A']);
  execFileSync(
    'git',
    ['-c', 'user.name=DEVAI Inspector', '-c', 'user.email=inspector@test', 'commit', '-m', message],
    {
      cwd: root,
      stdio: 'ignore',
    },
  );
  return git(root, ['rev-parse', 'HEAD']);
}

function fixture(): string {
  const parent = mkdtempSync(join(tmpdir(), 'devai-r7-remediation3-'));
  const root = join(parent, 'repo');
  roots.push(parent);
  execFileSync('git', ['clone', '--quiet', '--shared', ROOT, root]);
  const mirror = '.devai/config/round-close-controls.json';
  if (readFileSync(join(root, mirror), 'utf8') !== readFileSync(join(ROOT, mirror), 'utf8')) {
    copyFileSync(join(ROOT, mirror), join(root, mirror));
    commit(root, 'test: materialize current policy mirror');
  }
  return root;
}

function run(root: string, command: string, args: readonly string[]): CommandResult {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', root, '--round', 'R-0007', ...args, '--json'],
    { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  let value: Record<string, unknown> | null = null;
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = null;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, value };
}

function findings(result: CommandResult): Array<Record<string, unknown>> {
  return (result.value?.findings ?? []) as Array<Record<string, unknown>>;
}

function expectCode(result: CommandResult, code: string): void {
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
  expect(findings(result)).toEqual(expect.arrayContaining([expect.objectContaining({ code })]));
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function controllerFunction<T>(name: string, dependencies: Record<string, unknown>): T {
  const source = readFileSync(SCRIPT, 'utf8');
  const file = ts.createSourceFile('controller.mjs', source, ts.ScriptTarget.Latest, true);
  const declaration = file.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
  if (declaration === undefined) throw new Error(`controller function ${name} is missing`);
  const names = Object.keys(dependencies);
  const factory = new Function(...names, `${declaration.getText(file)}; return ${name};`);
  return factory(...names.map((key) => dependencies[key])) as T;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe('OM-017 / DII-251 remediation campaign 3 complete populations', () => {
  it('binds every R3 class to unique executable Inspector IDs', () => {
    const matrix = json<{
      classes: Array<{ finding_id: string; test_ids: string[]; closure_state: string }>;
    }>(ROOT, MATRIX_PATH);
    expect(matrix.classes.map(({ finding_id }) => finding_id)).toEqual([
      'R3-F001',
      'R3-F002',
      'R3-F003',
      'R3-F004',
      'R3-F005',
    ]);
    const source = readFileSync(join(ROOT, TEST_PATH), 'utf8');
    const ids = matrix.classes.flatMap(({ test_ids }) => test_ids);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(source, id).toContain(id);
    expect(matrix.classes.every(({ closure_state }) => closure_state === 'RED_REQUIRED')).toBe(
      true,
    );
  });

  describe('R3-F001 literal authoritative roster', () => {
    it('R3-001-LITERAL-ROSTER executes every declared argv without hidden repair', () => {
      const policy = json<{ convergence: { commands: Array<{ id: string; argv: string[] }> } }>(
        ROOT,
        POLICY_PATH,
      );
      expect(policy.convergence.commands).toHaveLength(16);
      const materializations = policy.convergence.commands.find(
        ({ id }) => id === 'materializations',
      );
      expect(materializations).toBeDefined();
      const [program, ...args] = materializations?.argv ?? [];
      const result = spawnSync(program ?? '', args, { cwd: ROOT, encoding: 'utf8' });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    });

    it('R3-001-ALL-FAILURE-ORDINALS retains all sixteen results after each injected failure', () => {
      const execute = controllerFunction<
        (
          gates: Array<{ id: string }>,
          runner: (gate: { id: string }, ordinal: number) => { exit_code: number },
        ) => Array<{ gate_id: string; exit_code: number }>
      >('executeCompleteGatePopulationV8', {});
      const gates = Array.from({ length: 16 }, (_, index) => ({ id: `gate-${String(index + 1)}` }));
      for (let failed = 0; failed < gates.length; failed += 1) {
        const results = execute(gates, (_gate, ordinal) => ({
          exit_code: ordinal === failed ? 23 : 0,
        }));
        expect(results).toHaveLength(16);
        expect(results.map(({ gate_id }) => gate_id)).toEqual(gates.map(({ id }) => id));
        expect(results[failed]?.exit_code).toBe(23);
      }
    });
  });

  describe('R3-F002 recursively derived command closure', () => {
    it('R3-002-WORKSPACE-SCRIPT-CLOSURE rejects an undeclared nested workspace script edge', () => {
      const root = fixture();
      const packagePath = 'packages/schemas/package.json';
      const packageJson = json<Record<string, unknown>>(root, packagePath);
      const scripts = packageJson.scripts as Record<string, string>;
      scripts.build = `${scripts.build} && pnpm run r3:nested`;
      scripts['r3:nested'] = 'node scripts/r3-nested.mjs';
      putJson(root, packagePath, packageJson);
      put(root, 'packages/schemas/scripts/r3-nested.mjs', 'process.stdout.write("nested\\n");\n');
      const candidate = commit(root, 'test: mutate nested workspace script');
      const result = run(root, 'policy-check', [
        '--phase',
        'pre-entry-preparation',
        '--candidate',
        candidate,
      ]);
      expectCode(result, 'GATE_COMMAND_CLOSURE_DERIVATION_INVALID');
    });

    it('R3-002-PROJECT-REFERENCE-CLOSURE rejects an untracked TypeScript project edge', () => {
      const root = fixture();
      const path = 'packages/cli/tsconfig.json';
      const config = json<Record<string, unknown>>(root, path);
      const references = (config.references ?? []) as Array<{ path: string }>;
      config.references = [...references, { path: '../loop' }];
      putJson(root, path, config);
      const candidate = commit(root, 'test: mutate TypeScript project reference');
      const result = run(root, 'policy-check', [
        '--phase',
        'pre-entry-preparation',
        '--candidate',
        candidate,
      ]);
      expectCode(result, 'GATE_COMMAND_CLOSURE_DERIVATION_INVALID');
    });

    it('R3-002-EXECUTABLE-CLOSURE rejects an undeclared executable reached through a workspace script', () => {
      const root = fixture();
      const path = 'packages/schemas/package.json';
      const packageJson = json<Record<string, unknown>>(root, path);
      const scripts = packageJson.scripts as Record<string, string>;
      scripts.build = `${scripts.build} && node scripts/r3-executable.mjs`;
      putJson(root, path, packageJson);
      put(root, 'packages/schemas/scripts/r3-executable.mjs', 'process.stdout.write("exec\\n");\n');
      const candidate = commit(root, 'test: mutate workspace executable closure');
      const result = run(root, 'policy-check', [
        '--phase',
        'pre-entry-preparation',
        '--candidate',
        candidate,
      ]);
      expectCode(result, 'GATE_COMMAND_CLOSURE_DERIVATION_INVALID');
    });
  });

  describe('R3-F003 candidate and preimage loader analysis', () => {
    it('R3-003-DELETED-PREIMAGE widens from deleted base-object loader bytes', () => {
      const root = fixture();
      const path = 'packages/cli/src/r3-deleted-loader.ts';
      put(root, path, 'const { require: load } = module; load(runtimeName);\n');
      const base = commit(root, 'test: add ambiguous loader preimage');
      unlinkSync(join(root, path));
      const candidate = commit(root, 'test: delete ambiguous loader preimage');
      const result = run(root, 'impact-plan', [
        '--base',
        base,
        '--head',
        candidate,
        '--candidate',
        candidate,
      ]);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      const nodes = result.value?.nodes as Array<Record<string, unknown>>;
      expect(nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            node_id: 'full-suite',
            reason_codes: expect.arrayContaining(['DYNAMIC_DEPENDENCY_AMBIGUOUS']),
          }),
          expect.objectContaining({
            node_id: 'full-coverage',
            reason_codes: expect.arrayContaining(['DYNAMIC_DEPENDENCY_AMBIGUOUS']),
          }),
        ]),
      );
    });

    it('R3-003-RENAMED-PREIMAGE widens from a renamed base-object loader', () => {
      const root = fixture();
      const before = 'packages/cli/src/r3-renamed-loader.ts';
      const after = 'packages/cli/src/r3-renamed-safe.ts';
      put(root, before, '(0, require)(runtimeName);\n');
      const base = commit(root, 'test: add renamed loader preimage');
      git(root, ['mv', before, after]);
      put(root, after, 'export const safe = true;\n');
      const candidate = commit(root, 'test: rename loader to safe postimage');
      const result = run(root, 'impact-plan', [
        '--base',
        base,
        '--head',
        candidate,
        '--candidate',
        candidate,
      ]);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      const nodes = result.value?.nodes as Array<Record<string, unknown>>;
      expect(nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            node_id: 'full-suite',
            reason_codes: expect.arrayContaining(['DYNAMIC_DEPENDENCY_AMBIGUOUS']),
          }),
        ]),
      );
    });

    it('R3-003-INDIRECT-LOADER-FAMILIES widens every unproved indirect family', () => {
      const forms = [
        'const { require: load } = module; load(runtimeName);',
        '(0, require)(runtimeName);',
        'module.require.apply(module, [runtimeName]);',
        'require.call(module, runtimeName);',
        'module[loaderName](runtimeName);',
      ];
      for (const [index, form] of forms.entries()) {
        const root = fixture();
        const base = git(root, ['rev-parse', 'HEAD']);
        put(root, `packages/cli/src/r3-loader-${String(index)}.ts`, `${form}\n`);
        const candidate = commit(root, `test: add indirect loader family ${String(index)}`);
        const result = run(root, 'impact-plan', [
          '--base',
          base,
          '--head',
          candidate,
          '--candidate',
          candidate,
        ]);
        expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
        const nodes = result.value?.nodes as Array<Record<string, unknown>>;
        expect(nodes, form).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              node_id: 'full-suite',
              reason_codes: expect.arrayContaining(['DYNAMIC_DEPENDENCY_AMBIGUOUS']),
            }),
            expect.objectContaining({
              node_id: 'full-coverage',
              reason_codes: expect.arrayContaining(['DYNAMIC_DEPENDENCY_AMBIGUOUS']),
            }),
          ]),
        );
      }
    });
  });

  describe('R3-F004 exact state, transport, and repair authentication', () => {
    it('R3-004-EXACT-PREDECESSOR-ARTIFACT binds every predecessor artifact byte', () => {
      const reconstruct = controllerFunction<
        (transition: Record<string, unknown>, prior: string) => string
      >('reconstructStateIdentityV6', { sha256, canonical });
      const transition = {
        from: 'CYCLE_1_ACTIVE',
        cycle: 1,
        candidate_sha: '1'.repeat(40),
        candidate_manifest_digest: '2'.repeat(64),
        review_scope_digest: '3'.repeat(64),
        previous_state_digest: '4'.repeat(64),
        previous_state_artifact: { state: 'CYCLE_1_ACTIVE', unselected: 'alpha' },
      };
      const changed = {
        ...transition,
        previous_state_artifact: { state: 'CYCLE_1_ACTIVE', unselected: 'beta' },
      };
      expect(reconstruct(transition, '5'.repeat(64))).not.toBe(
        reconstruct(changed, '5'.repeat(64)),
      );
    });

    it('R3-004-TRANSPORT-BYTE-AUTH rejects payload, validation, and state-before substitution', () => {
      const reauthenticate = controllerFunction<(...args: unknown[]) => boolean>(
        'reauthenticateTransportV6',
        {
          validateDocument: () => true,
          selfDigestValid: () => true,
          SHA256: /^[a-f0-9]{64}$/u,
          finding: (code: string, message: string) => ({ code, message }),
        },
      );
      const digest = (value: string): string => value.repeat(64);
      const state = {
        round: 'R-0007',
        cycle: 1,
        candidate_sha: '1'.repeat(40),
        tree_sha: '2'.repeat(40),
        policy_digest: digest('a'),
        profile_digest: digest('b'),
        candidate_manifest_digest: digest('c'),
        review_scope_digest: digest('d'),
        reviewer_binding_digest: digest('e'),
        active_control_census_digest: digest('f'),
      };
      const scope = { identity_proof: { identity_digest_sha256: digest('1') } };
      const transport = {
        ...state,
        candidate_tree: state.tree_sha,
        scope_identity_digest: scope.identity_proof.identity_digest_sha256,
        attempt: 1,
        payload_digest: digest('2'),
        validation: 'INVALID_TRANSPORT',
        state_before_digest: digest('3'),
        previous_transport_digest: null,
      };
      const localFindings: unknown[] = [];
      const valid = reauthenticate(
        { policy: { schemas: { review_transport: 'fixture' } } },
        state,
        scope,
        transport,
        1,
        null,
        localFindings,
        {
          payload_digest: digest('4'),
          validation: 'VALID',
          state_before_digest: digest('5'),
        },
      );
      expect(valid).toBe(false);
      expect(localFindings.length).toBeGreaterThan(0);
    });

    it('R3-004-REPAIR-POPULATION-REAUTH rejects a coordinated repaired-class deletion', () => {
      const reauthenticate = controllerFunction<(...args: unknown[]) => void>(
        'reauthenticateRepairEvidenceV6',
        {
          validateDocument: () => true,
          selfDigestValid: () => true,
          finding: (code: string, message: string) => ({ code, message }),
        },
      );
      const digest = (value: string): string => value.repeat(64);
      const state = {
        repair_evidence_digest: digest('a'),
        prior_failure_result_digest: digest('b'),
        prior_failure_state_digest: digest('c'),
        prior_failure_transport_digest: digest('d'),
        previous_candidate_sha: '1'.repeat(40),
        candidate_sha: '2'.repeat(40),
      };
      const repair = {
        repair_evidence_digest_sha256: digest('a'),
        prior_review_result_digest: digest('b'),
        prior_failure_state_digest: digest('c'),
        prior_failure_transport_digest: digest('d'),
        prior_candidate_sha: '1'.repeat(40),
        new_candidate_sha: '2'.repeat(40),
        repaired_classes: [{ defect_class_id: 'CLASS_A' }],
      };
      const localFindings: unknown[] = [];
      reauthenticate(
        { policy: { schemas: { review_repair_evidence: 'fixture' } } },
        state,
        repair,
        localFindings,
        ['CLASS_A', 'CLASS_B'],
      );
      expect(localFindings.length).toBeGreaterThan(0);
    });

    it('R3-004-ALL-EDGES-AND-TERMINALS retains the complete declared runtime population', () => {
      const policy = json<{
        review_state_machine: {
          allowed_transitions: Record<string, string[]>;
          terminal_states: string[];
        };
      }>(ROOT, POLICY_PATH);
      const edges = Object.values(policy.review_state_machine.allowed_transitions).flat();
      expect(edges).toHaveLength(12);
      expect(policy.review_state_machine.terminal_states.sort()).toEqual(
        ['ESCALATION_REQUIRED', 'PASS', 'REVIEW_TRANSPORT_BLOCKED'].sort(),
      );
    });
  });

  describe('R3-F005 exact-candidate bootstrap and dispatch', () => {
    it('R3-005-CANDIDATE-BOUND-DISPATCH ignores dirty worktree policy dispatch bytes', () => {
      const root = fixture();
      const candidate = git(root, ['rev-parse', 'HEAD']);
      const policy = json<Record<string, unknown>>(root, POLICY_PATH);
      policy.schemaVersion = '3.0.0';
      putJson(root, POLICY_PATH, policy);
      const result = run(root, 'policy-check', [
        '--phase',
        'pre-entry-preparation',
        '--candidate',
        candidate,
      ]);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(result.value).toMatchObject({ command: 'policy-check', round: 'R-0007' });
      expect(result.value?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'ENTRY_BLOCKED_DECLARATION_UNBOUND' }),
        ]),
      );
    });

    it('R3-005-CANDIDATE-BOUND-POLICY-SCHEMA ignores dirty schema substitution', () => {
      const root = fixture();
      const candidate = git(root, ['rev-parse', 'HEAD']);
      put(root, 'law/schemas/reviewer-binding.schema.json', '{"type":"null"}\n');
      const result = run(root, 'policy-check', [
        '--phase',
        'pre-entry-preparation',
        '--candidate',
        candidate,
      ]);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(findings(result)).toEqual([]);
    });

    it('R3-005-ALL-CONSUMERS-LITERAL-SHA rejects missing and nonliteral candidate inputs', () => {
      const root = fixture();
      const candidate = git(root, ['rev-parse', 'HEAD']);
      const abbreviated = candidate.slice(0, 12);
      for (const [command, args] of [
        ['policy-check', ['--phase', 'pre-entry-preparation']],
        ['entry-check', []],
        ['status', []],
        ['policy-check', ['--phase', 'pre-entry-preparation', '--candidate', abbreviated]],
        ['entry-check', ['--candidate', 'HEAD']],
        ['status', ['--candidate', abbreviated]],
      ] as const) {
        const result = run(root, command, args);
        expectCode(result, 'REVIEWER_BINDING_CANDIDATE_REQUIRED');
      }
    });
  });
});
