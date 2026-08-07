// Invariants: INV-DEVAI-001, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-019, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as loopRuntime from '../../packages/loop/src/index.js';
import * as taskRuntime from '../../packages/loop/src/loop/tasks.js';
import { withAuthorityHostTestScope } from '../../packages/skills/tests/unit/authority-host-test-scope.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

vi.setConfig({ testTimeout: 30_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');
const roots: string[] = [];

type JsonObject = Record<string, unknown>;

interface ActionRegistryEntry {
  readonly action_id: string;
  readonly disposition: 'keep' | 'fold' | 'tombstone';
  readonly effect: 'read' | 'harness-write' | 'local-write' | 'remote-write';
  readonly authority_contract: {
    readonly capabilities?: readonly string[];
    readonly consent: {
      readonly write: boolean;
      readonly allow_publish: boolean;
    };
  };
}

interface ActionRegistry {
  readonly entries: readonly ActionRegistryEntry[];
}

interface SensorRegistry {
  readonly entries: readonly {
    readonly kind: string;
    readonly effect?: unknown;
  }[];
}

interface NamedCollection {
  readonly name: string;
  readonly members: readonly string[];
  readonly excluded: readonly string[];
}

interface AgentRegistryEntry {
  readonly id: string;
  readonly runtime: string;
  readonly model: string;
  readonly efforts: readonly string[];
  readonly available: boolean;
}

interface AgentRequest {
  readonly kind: 'agent';
  readonly runtime: string;
  readonly model: string;
  readonly effort: string;
  readonly selection:
    | { readonly mode: 'exact'; readonly registry_id: string }
    | { readonly mode: 'preferred'; readonly registry_ids: readonly string[] }
    | { readonly mode: 'policy'; readonly policy_id: string; readonly policy_version: string };
}

interface AgentResolution {
  readonly ok: boolean;
  readonly code?: string;
  readonly requested?: AgentRequest;
  readonly resolved?: { readonly registry_id: string };
  readonly selection?: {
    readonly mode: 'exact' | 'preferred' | 'policy';
    readonly considered: readonly string[];
  };
}

const EXPECTED_PRESETS = {
  baseline: ['build', 'lint', 'type_check', 'unit_test'],
  structural: [
    'build',
    'lint',
    'type_check',
    'unit_test',
    'inventory_api',
    'inventory_routes',
    'inventory_data_model',
    'inventory_rbac',
    'inventory_data_handling',
    'inventory_dep_graph',
    'spec_depth',
    'spec_alignment',
  ],
  governed: [
    'build',
    'lint',
    'type_check',
    'unit_test',
    'inventory_api',
    'inventory_routes',
    'inventory_data_model',
    'inventory_rbac',
    'inventory_data_handling',
    'inventory_dep_graph',
    'spec_depth',
    'spec_alignment',
    'spec_freshness',
    'spec_idiomaticity',
    'test_invariant_alignment',
    'harness_coverage',
    'harness_depth',
    'harness_coherence',
    'harness_invariant_alignment',
    'docs_drift',
  ],
} as const;

const AGENT_REGISTRY: readonly AgentRegistryEntry[] = [
  {
    id: 'primary',
    runtime: 'codex-cli',
    model: 'model-primary',
    efforts: ['high', 'xhigh'],
    available: true,
  },
  {
    id: 'secondary',
    runtime: 'codex-cli',
    model: 'model-secondary',
    efforts: ['high'],
    available: true,
  },
  {
    id: 'offline',
    runtime: 'claude-cli',
    model: 'model-offline',
    efforts: ['high'],
    available: false,
  },
];

function readJson(relativePath: string): JsonObject {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8')) as JsonObject;
}

function canonicalPolicyDocuments(): readonly {
  readonly path: string;
  readonly value: JsonObject;
}[] {
  const root = join(ROOT, 'law/policy');
  return readdirSync(root)
    .filter((name) => name.endsWith('.json') && statSync(join(root, name)).isFile())
    .sort()
    .flatMap((name) => {
      try {
        return [{ path: `law/policy/${name}`, value: readJson(`law/policy/${name}`) }];
      } catch {
        return [];
      }
    });
}

function normalizeNamedCollection(value: unknown): readonly NamedCollection[] {
  const normalize = (name: string, raw: unknown): NamedCollection | null => {
    if (Array.isArray(raw)) {
      return {
        name,
        members: raw.filter((item): item is string => typeof item === 'string'),
        excluded: [],
      };
    }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const object = raw as JsonObject;
    const members = object['members'] ?? object['actions'] ?? object['kinds'];
    const excluded = object['excluded'];
    if (!Array.isArray(members)) return null;
    return {
      name,
      members: members.filter((item): item is string => typeof item === 'string'),
      excluded: Array.isArray(excluded)
        ? excluded.filter((item): item is string => typeof item === 'string')
        : [],
    };
  };

  if (Array.isArray(value)) {
    return value.flatMap((raw) => {
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return [];
      const object = raw as JsonObject;
      const name = object['name'] ?? object['id'];
      if (typeof name !== 'string') return [];
      const entry = normalize(name, object);
      return entry === null ? [] : [entry];
    });
  }
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as JsonObject).flatMap(([name, raw]) => {
    const entry = normalize(name, raw);
    return entry === null ? [] : [entry];
  });
}

function locateCanonicalCollection(key: 'suites' | 'presets'): {
  readonly path: string;
  readonly entries: readonly NamedCollection[];
} | null {
  const matches = canonicalPolicyDocuments().flatMap(({ path, value }) => {
    if (!(key in value)) return [];
    const entries = normalizeNamedCollection(value[key]);
    return entries.length === 0 ? [] : [{ path, entries }];
  });
  expect(
    matches,
    `B1-SEM-CANONICAL-${key.toUpperCase()}: exactly one Architect policy must own ${key}`,
  ).toHaveLength(1);
  return matches[0] ?? null;
}

function sorted(values: readonly string[]): readonly string[] {
  return [...values].sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
}

function propertyObject(schema: JsonObject, name: string): JsonObject | undefined {
  const properties = schema['properties'];
  if (properties === null || typeof properties !== 'object' || Array.isArray(properties)) {
    return undefined;
  }
  const property = (properties as JsonObject)[name];
  return property !== null && typeof property === 'object' && !Array.isArray(property)
    ? (property as JsonObject)
    : undefined;
}

function discriminatedKinds(node: unknown): readonly string[] {
  const found = new Set<string>();
  const visit = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current === null || typeof current !== 'object') return;
    const object = current as JsonObject;
    const properties = object['properties'];
    if (properties !== null && typeof properties === 'object' && !Array.isArray(properties)) {
      const kind = (properties as JsonObject)['kind'];
      if (kind !== null && typeof kind === 'object' && !Array.isArray(kind)) {
        const constant = (kind as JsonObject)['const'];
        if (typeof constant === 'string') found.add(constant);
      }
    }
    Object.values(object).forEach(visit);
  };
  visit(node);
  return [...found];
}

function propertyNames(node: unknown): ReadonlySet<string> {
  const names = new Set<string>();
  const visit = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current === null || typeof current !== 'object') return;
    const object = current as JsonObject;
    const properties = object['properties'];
    if (properties !== null && typeof properties === 'object' && !Array.isArray(properties)) {
      Object.keys(properties as JsonObject).forEach((name) => names.add(name));
    }
    Object.values(object).forEach(visit);
  };
  visit(node);
  return names;
}

function enumValues(node: unknown): readonly (readonly unknown[])[] {
  const values: unknown[][] = [];
  const visit = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current === null || typeof current !== 'object') return;
    const object = current as JsonObject;
    if (Array.isArray(object['enum'])) values.push(object['enum']);
    Object.values(object).forEach(visit);
  };
  visit(node);
  return values;
}

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-r0007-b1-executor-'));
  roots.push(root);
  return root;
}

function runCli(args: readonly string[]): {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
} {
  const result = spawnSync('node', [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 15_000,
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function resolver():
  | ((options: {
      readonly request: AgentRequest;
      readonly registry: readonly AgentRegistryEntry[];
      readonly policies?: Readonly<Record<string, readonly string[]>>;
    }) => AgentResolution)
  | undefined {
  const candidate = (loopRuntime as unknown as { readonly resolveAgentExecutor?: unknown })
    .resolveAgentExecutor;
  expect(
    candidate,
    'B1-EXEC-ROUTER: @devai-nyx/loop must export a pure fail-closed agent resolver',
  ).toBeTypeOf('function');
  return typeof candidate === 'function'
    ? (candidate as (options: {
        readonly request: AgentRequest;
        readonly registry: readonly AgentRegistryEntry[];
        readonly policies?: Readonly<Record<string, readonly string[]>>;
      }) => AgentResolution)
    : undefined;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('R-0007 B1 canonical suite and preset semantics', () => {
  it('B1-SEM-001 has one canonical cumulative check-suite vocabulary', () => {
    const policy = locateCanonicalCollection('suites');
    if (policy === null) return;
    expect(policy.entries.map((entry) => entry.name)).toEqual([
      'quick',
      'standard',
      'full',
      'release',
    ]);
    const byName = new Map(policy.entries.map((entry) => [entry.name, entry.members]));
    for (const [parent, child] of [
      ['quick', 'standard'],
      ['standard', 'full'],
      ['full', 'release'],
    ] as const) {
      const parentMembers = byName.get(parent) ?? [];
      const childMembers = new Set(byName.get(child) ?? []);
      expect(
        parentMembers.length,
        `${parent} suite must be executable and nonempty`,
      ).toBeGreaterThan(0);
      expect(
        parentMembers.filter((member) => !childMembers.has(member)),
        `${child} must retain every ordered ${parent} member`,
      ).toEqual([]);
    }
    for (const suite of policy.entries) {
      expect(new Set(suite.members).size, `${suite.name} has duplicate members`).toBe(
        suite.members.length,
      );
    }
  });

  it('B1-SEM-002 freezes baseline/structural/governed membership in canonical sensor kinds', () => {
    const policy = locateCanonicalCollection('presets');
    if (policy === null) return;
    expect(policy.entries.map((entry) => entry.name)).toEqual([
      'baseline',
      'structural',
      'governed',
      'sweep',
    ]);
    const byName = new Map(policy.entries.map((entry) => [entry.name, entry.members]));
    for (const [name, members] of Object.entries(EXPECTED_PRESETS)) {
      expect(byName.get(name), `preset ${name} membership drifted`).toEqual(members);
    }
  });

  it('B1-SEM-003 derives sweep from read-only sensors and reports every write-capable exclusion', () => {
    const sensors = readJson('law/policy/sensor-registry.json') as unknown as SensorRegistry;
    const allowedEffects = new Set<ActionRegistryEntry['effect']>([
      'read',
      'harness-write',
      'local-write',
      'remote-write',
    ]);
    const invalidEffects = sensors.entries.flatMap((entry) =>
      typeof entry.effect === 'string' &&
      allowedEffects.has(entry.effect as ActionRegistryEntry['effect'])
        ? []
        : [`${entry.kind}:${JSON.stringify(entry.effect)}`],
    );
    expect(
      invalidEffects,
      'every live sensor kind needs one allowed effect in the sensor registry',
    ).toEqual([]);

    const policy = locateCanonicalCollection('presets');
    if (policy === null) return;
    const sweep = policy.entries.find((entry) => entry.name === 'sweep');
    expect(sweep, 'sweep preset is absent').toBeDefined();
    if (sweep === undefined) return;

    const readOnly = sensors.entries
      .filter((entry) => entry.effect === 'read')
      .map((entry) => entry.kind);
    const excluded = sensors.entries
      .filter((entry) => entry.effect !== 'read')
      .map((entry) => entry.kind);
    expect(sweep.members).toEqual(readOnly);
    expect(sweep.excluded).toEqual(excluded);
    expect(sweep.excluded).toContain('migration_check');
  });
});

describe('R-0007 B1 round-subordinate task schema', () => {
  const schema = readJson('law/schemas/task.schema.json');

  it('B1-EXEC-001 requires round_id and one executor on every new task record', () => {
    const required = schema['required'];
    expect(required).toEqual(expect.arrayContaining(['round_id', 'executor']));
    expect(propertyObject(schema, 'round_id'), 'round_id has no schema').toMatchObject({
      type: 'string',
      pattern: '^R-[0-9]{4}$',
    });
    expect(propertyObject(schema, 'executor'), 'executor has no closed schema').toBeDefined();
  });

  it('B1-EXEC-002 closes the executor discriminant to routine/agent/human/composite', () => {
    const executor = propertyObject(schema, 'executor');
    expect(executor, 'task executor schema is absent').toBeDefined();
    expect(sorted(discriminatedKinds(executor))).toEqual([
      'agent',
      'composite',
      'human',
      'routine',
    ]);
  });

  it('B1-EXEC-003 encodes shell-free routine and fail-closed agent-selection vocabulary', () => {
    const executor = propertyObject(schema, 'executor');
    expect(executor, 'task executor schema is absent').toBeDefined();
    if (executor === undefined) return;
    const names = propertyNames(executor);
    for (const field of [
      'argv',
      'cwd',
      'inputs',
      'outputs',
      'effects',
      'timeout_ms',
      'runtime',
      'model',
      'effort',
      'selection',
      'child_task_ids',
      'dependencies',
    ]) {
      expect(names.has(field), `executor contract omits ${field}`).toBe(true);
    }
    expect(names.has('shell'), 'routine execution must not expose a shell toggle').toBe(false);
    expect(
      enumValues(executor).some(
        (values) => JSON.stringify(values) === JSON.stringify(['exact', 'preferred', 'policy']),
      ),
      'agent selection must be the exact/preferred/policy closed vocabulary',
    ).toBe(true);
  });
});

describe('R-0007 B1 task operation and legacy boundaries', () => {
  it('B1-EXEC-004 refuses a new spawn before acquiring resources when round_id/executor are absent', async () => {
    const repoRoot = tempRoot();
    await withAuthorityHostTestScope(async () => {
      expect(() =>
        taskRuntime.spawnTask({
          repoRoot,
          task: {
            id: 'TASK-7001',
            discipline: 'engineer',
            title: 'Roundless task must be refused',
            target_modules: [],
            target_substrates: ['F2'],
            db_isolation: 'database',
          },
        }),
      ).toThrow(/TASK_(?:ROUND_ID|EXECUTOR)_REQUIRED/u);
    });
  });

  it.each([
    ['queue add', ['queue', 'add', '--title', 'fixture']],
    ['queue complete', ['queue', 'complete', '--task', 'TASK-7001']],
    ['queue list', ['queue', 'list']],
    ['queue next', ['queue', 'next']],
    ['start', ['start', '--task', 'TASK-7001']],
    ['finish', ['finish', '--task', 'TASK-7001']],
    ['escalate', ['escalate', '--task', 'TASK-7001']],
    ['pause', ['pause', '--task', 'TASK-7001', '--gap', 'RGR-7001']],
    ['resume', ['resume', '--task', 'TASK-7001', '--gap', 'RGR-7001']],
    ['status', ['status', '--task', 'TASK-7001']],
  ])('B1-EXEC-005 requires an active --round before task %s', (_name, args) => {
    const result = runCli(['task', ...args, '--format', 'json']);
    expect(result.status, result.stderr).toBe(64);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('TASK_ROUND_REQUIRED');
  });

  it.each([
    [undefined, 'R-0007', ['R-0007'], 'TASK_ROUND_REQUIRED'],
    ['R-9999', 'R-9999', ['R-0007'], 'TASK_ROUND_INACTIVE'],
    ['R-0008', 'R-0007', ['R-0007', 'R-0008'], 'TASK_ROUND_MISMATCH'],
  ])(
    'B1-EXEC-005A refuses missing, inactive, or mismatched task-round binding %#',
    (requestedRoundId, taskRoundId, activeRoundIds, code) => {
      const validate = (loopRuntime as unknown as { readonly validateTaskRound?: unknown })
        .validateTaskRound;
      expect(validate, 'active task-round validator is missing').toBeTypeOf('function');
      if (typeof validate !== 'function') return;
      expect(
        (
          validate as (options: {
            readonly operation: string;
            readonly requested_round_id?: string;
            readonly task_round_id: string;
            readonly active_round_ids: readonly string[];
          }) => JsonObject
        )({
          operation: 'start',
          ...(requestedRoundId !== undefined && { requested_round_id: requestedRoundId }),
          task_round_id: taskRoundId,
          active_round_ids: activeRoundIds,
        }),
      ).toMatchObject({ ok: false, code });
    },
  );

  it('B1-EXEC-006 classifies legacy records as non-executable without inferred fields', () => {
    const classify = (loopRuntime as unknown as { readonly classifyTaskRecord?: unknown })
      .classifyTaskRecord;
    expect(
      classify,
      'legacy task classifier is missing; loading through the new execution path must fail closed',
    ).toBeTypeOf('function');
    if (typeof classify !== 'function') return;
    const legacy = Object.freeze({
      schemaVersion: '1.0.0',
      id: 'TASK-0001',
      status: 'queued',
      discipline: 'engineer',
      title: 'Historical task',
      target_modules: [],
      target_substrates: ['F2'],
      created_at: '2026-07-24T00:00:00.000Z',
      db_isolation: 'database',
      iteration_count: 0,
      model_tier: 'bumped',
      tags: ['round:R-9999', 'model:model-primary'],
    });
    const before = JSON.stringify(legacy);
    const result = (classify as (value: unknown) => JsonObject)(legacy);
    expect(result).toMatchObject({ kind: 'legacy', executable: false });
    expect(result).not.toHaveProperty('round_id');
    expect(result).not.toHaveProperty('executor');
    expect(JSON.stringify(legacy)).toBe(before);
  });
});

describe('R-0007 B1 agent routing and requested/resolved evidence', () => {
  it('B1-EXEC-007 keeps exact exact, and preferred inside its explicit ordered allowlist', () => {
    const resolveAgent = resolver();
    if (resolveAgent === undefined) return;
    const exact: AgentRequest = {
      kind: 'agent',
      runtime: 'codex-cli',
      model: 'model-primary',
      effort: 'xhigh',
      selection: { mode: 'exact', registry_id: 'primary' },
    };
    expect(resolveAgent({ request: exact, registry: AGENT_REGISTRY })).toMatchObject({
      ok: true,
      requested: exact,
      resolved: { registry_id: 'primary' },
      selection: { mode: 'exact', considered: ['primary'] },
    });

    const preferred: AgentRequest = {
      kind: 'agent',
      runtime: 'codex-cli',
      model: 'model-secondary',
      effort: 'high',
      selection: { mode: 'preferred', registry_ids: ['offline', 'secondary'] },
    };
    expect(resolveAgent({ request: preferred, registry: AGENT_REGISTRY })).toMatchObject({
      ok: true,
      requested: preferred,
      resolved: { registry_id: 'secondary' },
      selection: { mode: 'preferred', considered: ['offline', 'secondary'] },
    });
  });

  it('B1-EXEC-008 requires a named/versioned policy and never invents fallback', () => {
    const resolveAgent = resolver();
    if (resolveAgent === undefined) return;
    const request: AgentRequest = {
      kind: 'agent',
      runtime: 'codex-cli',
      model: 'model-primary',
      effort: 'high',
      selection: { mode: 'policy', policy_id: 'review-routing', policy_version: '7' },
    };
    expect(resolveAgent({ request, registry: AGENT_REGISTRY })).toMatchObject({
      ok: false,
      code: 'TASK_ROUTING_POLICY_UNAVAILABLE',
    });
    expect(
      resolveAgent({
        request,
        registry: AGENT_REGISTRY,
        policies: { 'review-routing@7': ['offline', 'primary'] },
      }),
    ).toMatchObject({
      ok: true,
      resolved: { registry_id: 'primary' },
      selection: { mode: 'policy', considered: ['offline', 'primary'] },
    });
  });

  it.each([
    ['runtime', 'unknown-runtime', 'model-primary', 'high', 'TASK_RUNTIME_UNKNOWN'],
    ['model', 'codex-cli', 'unknown-model', 'high', 'TASK_MODEL_UNKNOWN'],
    ['effort', 'codex-cli', 'model-primary', 'ultra', 'TASK_EFFORT_UNSUPPORTED'],
    ['availability', 'claude-cli', 'model-offline', 'high', 'TASK_MODEL_UNAVAILABLE'],
  ])(
    'B1-EXEC-009 refuses unknown or unavailable %s without substitution',
    (_case, runtime, model, effort, code) => {
      const resolveAgent = resolver();
      if (resolveAgent === undefined) return;
      const request: AgentRequest = {
        kind: 'agent',
        runtime,
        model,
        effort,
        selection: {
          mode: 'exact',
          registry_id: model === 'model-offline' ? 'offline' : 'primary',
        },
      };
      const result = resolveAgent({ request, registry: AGENT_REGISTRY });
      expect(result).toMatchObject({ ok: false, code });
      expect(result.resolved).toBeUndefined();
    },
  );

  it('B1-EXEC-010 preserves the immutable request and emits separate resolved evidence', () => {
    const resolveAgent = resolver();
    if (resolveAgent === undefined) return;
    const request: AgentRequest = Object.freeze({
      kind: 'agent',
      runtime: 'codex-cli',
      model: 'model-secondary',
      effort: 'high',
      selection: Object.freeze({
        mode: 'preferred',
        registry_ids: Object.freeze(['offline', 'secondary']),
      }),
    });
    const before = JSON.stringify(request);
    const result = resolveAgent({ request, registry: AGENT_REGISTRY });
    expect(JSON.stringify(request)).toBe(before);
    expect(result.requested).toEqual(request);
    expect(result.resolved).toEqual({ registry_id: 'secondary' });
    expect(result.requested).not.toBe(result.resolved);
  });
});

describe('R-0007 B1 executor adapters', () => {
  it('B1-EXEC-011 executes a routine as literal argv without a shell or LLM', async () => {
    const execute = (loopRuntime as unknown as { readonly executeRoutineExecutor?: unknown })
      .executeRoutineExecutor;
    expect(execute, 'shell-free routine adapter is missing').toBeTypeOf('function');
    if (typeof execute !== 'function') return;
    const runArgv = vi.fn(() => ({ exit_code: 0, stdout: 'ok', stderr: '' }));
    const invokeLlm = vi.fn(() => {
      throw new Error('routine executor invoked an LLM');
    });
    const result = await (
      execute as (options: {
        readonly executor: JsonObject;
        readonly runArgv: typeof runArgv;
        readonly invokeLlm: typeof invokeLlm;
      }) => Promise<JsonObject>
    )({
      executor: {
        kind: 'routine',
        argv: ['node', 'fixture.mjs', 'literal argument'],
        cwd: '.',
        inputs: [],
        outputs: [],
        effects: ['read'],
        timeout_ms: 1000,
      },
      runArgv,
      invokeLlm,
    });
    expect(runArgv).toHaveBeenCalledWith(
      ['node', 'fixture.mjs', 'literal argument'],
      expect.objectContaining({ cwd: '.', shell: false }),
    );
    expect(invokeLlm).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      resolved: { argv: ['node', 'fixture.mjs', 'literal argument'] },
    });
  });

  it('B1-EXEC-012 refuses human completion without evidence', () => {
    const complete = (loopRuntime as unknown as { readonly completeHumanTask?: unknown })
      .completeHumanTask;
    expect(complete, 'human completion boundary is missing').toBeTypeOf('function');
    if (typeof complete !== 'function') return;
    const base = {
      task_id: 'TASK-7002',
      round_id: 'R-0007',
      executor: { kind: 'human', role: 'inspector' },
    };
    expect(
      (complete as (options: JsonObject) => JsonObject)({ ...base, evidence: [] }),
    ).toMatchObject({
      ok: false,
      code: 'TASK_HUMAN_EVIDENCE_REQUIRED',
    });
    expect(
      (complete as (options: JsonObject) => JsonObject)({ ...base, evidence: ['EV-7002'] }),
    ).toMatchObject({ ok: true, evidence: ['EV-7002'] });
  });

  it('B1-EXEC-013 rejects composite cycles and cross-round children before dispatch', () => {
    const validate = (loopRuntime as unknown as { readonly validateCompositeExecutor?: unknown })
      .validateCompositeExecutor;
    expect(validate, 'composite pre-dispatch validator is missing').toBeTypeOf('function');
    if (typeof validate !== 'function') return;
    const invoke = validate as (options: JsonObject) => JsonObject;
    expect(
      invoke({
        parent: { id: 'TASK-7003', round_id: 'R-0007' },
        children: [
          { id: 'TASK-7004', round_id: 'R-0007', dependencies: ['TASK-7005'] },
          { id: 'TASK-7005', round_id: 'R-0007', dependencies: ['TASK-7004'] },
        ],
      }),
    ).toMatchObject({ ok: false, code: 'TASK_COMPOSITE_CYCLE' });
    expect(
      invoke({
        parent: { id: 'TASK-7003', round_id: 'R-0007' },
        children: [{ id: 'TASK-8001', round_id: 'R-0008', dependencies: [] }],
      }),
    ).toMatchObject({ ok: false, code: 'TASK_COMPOSITE_CROSS_ROUND' });
  });
});

describe('R-0007 B1 normal advancement, effects, and consent', () => {
  const registry = readJson('law/policy/action-registry.json') as unknown as ActionRegistry;
  const entry = (actionId: string): ActionRegistryEntry | undefined =>
    registry.entries.find(
      (candidate) => candidate.action_id === actionId && candidate.disposition === 'keep',
    );

  it('B1-EXEC-014 makes round run the normal advancement path and task operations plumbing', () => {
    expect(entry('round run'), 'round run is not a runnable canonical action').toMatchObject({
      effect: 'harness-write',
      authority_contract: { consent: { write: true, allow_publish: false } },
    });
    for (const actionId of [
      'task queue add',
      'task queue complete',
      'task queue list',
      'task queue next',
      'task start',
      'task finish',
      'task escalate',
      'task pause',
      'task resume',
      'task status',
    ]) {
      const action = entry(actionId);
      expect(action, `${actionId} is missing from hidden plumbing`).toBeDefined();
    }
  });

  it('B1-EXEC-015 declares real write effects and requires --write plus --publish consent', () => {
    expect(entry('sense migrate'), 'sense migrate DB-write action is missing').toMatchObject({
      effect: expect.stringMatching(/^(?:harness-write|local-write)$/u),
      authority_contract: {
        capabilities: expect.arrayContaining(['db:write']),
        consent: { write: true, allow_publish: false },
      },
    });
    const releasePublish = registry.entries.find(
      (candidate) =>
        candidate.disposition === 'keep' && candidate.action_id.startsWith('release publish'),
    );
    expect(releasePublish, 'release publish action is missing').toMatchObject({
      effect: 'remote-write',
      authority_contract: { consent: { write: true, allow_publish: true } },
    });
    const remoteWithoutDualConsent = registry.entries
      .filter(
        (candidate) => candidate.disposition === 'keep' && candidate.effect === 'remote-write',
      )
      .filter(
        (candidate) =>
          candidate.authority_contract.consent.write !== true ||
          candidate.authority_contract.consent.allow_publish !== true,
      )
      .map((candidate) => candidate.action_id);
    expect(remoteWithoutDualConsent).toEqual([]);
  });
});
