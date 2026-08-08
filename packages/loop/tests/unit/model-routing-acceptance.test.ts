// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// Inspector acceptance: model/runtime and routing inputs remain exact,
// candidate-bound, closed, and fail-closed across every selection mode.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadAgentRoutingPolicies,
  resolveAgentExecutor,
  validateAgentRoutingPolicies,
  type AgentExecutorRequest,
} from '../../src/loop/agent-routing.js';
import {
  loadModelRuntimeRegistry,
  validateModelRuntimeRegistry,
} from '../../src/loop/model-runtime.js';

const ROOT = resolve(import.meta.dirname, '../../../..');
const modelSource = readFileSync(resolve(ROOT, 'law/policy/model-runtime-registry.json'), 'utf8');
const policySource = readFileSync(resolve(ROOT, 'law/policy/agent-routing-policies.json'), 'utf8');
const modelDocument = JSON.parse(modelSource) as Record<string, unknown>;
const policyDocument = JSON.parse(policySource) as Record<string, unknown>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function invalidModel(mutator: (candidate: Record<string, unknown>) => void): unknown {
  const candidate = clone(modelDocument);
  mutator(candidate);
  return candidate;
}

describe('model/runtime registry acceptance', () => {
  it('loads the exact candidate from objects, bytes, text, and an explicit reader', () => {
    const validated = validateModelRuntimeRegistry(modelDocument);
    expect(validated.models).toHaveLength(5);
    expect(validated.runtimes).toHaveLength(4);
    expect(loadModelRuntimeRegistry({ repoRoot: ROOT, candidate: modelSource })).toEqual(validated);
    expect(
      loadModelRuntimeRegistry({ repoRoot: ROOT, candidate: Buffer.from(modelSource) }),
    ).toEqual(validated);
    expect(
      loadModelRuntimeRegistry({
        repoRoot: ROOT,
        candidate: 'opaque',
        readCandidate: (repoRoot, candidate, path) => {
          expect(repoRoot).toBe(ROOT);
          expect(candidate).toBe('opaque');
          expect(path).toBe('law/policy/model-runtime-registry.json');
          return modelSource;
        },
      }),
    ).toEqual(validated);
  });

  it('rejects every malformed identity, runtime, model, and replacement seam', () => {
    const mutations: Array<(candidate: Record<string, unknown>) => void> = [
      (candidate) => {
        candidate['$schema'] = 'wrong';
      },
      (candidate) => {
        (candidate['availability_semantics'] as Record<string, unknown>)[
          'host_preflight_required'
        ] = false;
      },
      (candidate) => {
        candidate['runtimes'] = [];
      },
      (candidate) => {
        candidate['models'] = [];
      },
      (candidate) => {
        (candidate['runtimes'] as unknown[])[0] = null;
      },
      (candidate) => {
        (candidate['runtimes'] as unknown[]).push(clone((candidate['runtimes'] as unknown[])[0]));
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'adapter_module'
        ] = '/absolute/adapter.ts';
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'transport'
        ] = 'shell';
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[2] as Record<string, unknown>)[
          'executable'
        ] = '';
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'vendor'
        ] = '';
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'capabilities'
        ] = [];
      },
      (candidate) => {
        ((candidate['runtimes'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'available'
        ] = 'yes';
      },
      (candidate) => {
        (candidate['models'] as unknown[])[0] = null;
      },
      (candidate) => {
        (candidate['models'] as unknown[]).push(clone((candidate['models'] as unknown[])[0]));
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'runtime_id'
        ] = 'missing-runtime';
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'adapter_id'
        ] = 'wrong-adapter';
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'provider_identifier'
        ] = '';
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'identifier_kind'
        ] = 'latest';
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'supported_efforts'
        ] = [];
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'eligible_agent_classes'
        ] = ['unknown-agent'];
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'available'
        ] = 1;
      },
      (candidate) => {
        ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
          'replacement'
        ] = null;
      },
      (candidate) => {
        (
          ((candidate['models'] as Record<string, unknown>[])[0] as Record<string, unknown>)[
            'replacement'
          ] as Record<string, unknown>
        )['state'] = 'implicit-latest';
      },
    ];

    expect(() => validateModelRuntimeRegistry(null)).toThrow('TASK_MODEL_REGISTRY_INVALID');
    expect(() => loadModelRuntimeRegistry({ repoRoot: '', candidate: modelDocument })).toThrow(
      'TASK_MODEL_REGISTRY_SOURCE_INVALID',
    );
    expect(() => loadModelRuntimeRegistry({ repoRoot: ROOT, candidate: '{' })).toThrow(
      'TASK_MODEL_REGISTRY_INVALID',
    );
    for (const mutate of mutations) {
      expect(() => validateModelRuntimeRegistry(invalidModel(mutate))).toThrow();
    }
  });
});

describe('agent routing acceptance', () => {
  const registry = validateModelRuntimeRegistry(modelDocument);
  const policies = validateAgentRoutingPolicies(policyDocument);
  const base = {
    kind: 'agent',
    runtime: 'codex-cli',
    model: 'gpt-5.6-sol',
    effort: 'high',
  } as const;

  it('loads exact policies and rejects malformed or duplicate policy registries', () => {
    expect(loadAgentRoutingPolicies({ repoRoot: ROOT, candidate: policySource })).toEqual(policies);
    expect(
      loadAgentRoutingPolicies({ repoRoot: ROOT, candidate: Buffer.from(policySource) }),
    ).toEqual(policies);
    expect(
      loadAgentRoutingPolicies({
        repoRoot: ROOT,
        candidate: 'opaque',
        readCandidate: (_root, _candidate, path) => {
          expect(path).toBe('law/policy/agent-routing-policies.json');
          return policySource;
        },
      }),
    ).toEqual(policies);
    expect(() => validateAgentRoutingPolicies(null)).toThrow(
      'TASK_ROUTING_POLICY_REGISTRY_INVALID',
    );
    const identity = clone(policyDocument);
    identity['decision'] = 'wrong';
    expect(() => validateAgentRoutingPolicies(identity)).toThrow(
      'TASK_ROUTING_POLICY_REGISTRY_IDENTITY_MISMATCH',
    );
    const malformed = clone(policyDocument);
    (malformed['policies'] as Record<string, unknown>[])[0] = { policy_id: 'Bad' };
    expect(() => validateAgentRoutingPolicies(malformed)).toThrow(
      'TASK_ROUTING_POLICY_REGISTRY_INVALID',
    );
    const duplicate = clone(policyDocument);
    (duplicate['policies'] as unknown[]).push(clone((duplicate['policies'] as unknown[])[0]));
    expect(() => validateAgentRoutingPolicies(duplicate)).toThrow('TASK_ROUTING_POLICY_DUPLICATE');
    expect(() => loadAgentRoutingPolicies({ repoRoot: '', candidate: policyDocument })).toThrow(
      'TASK_ROUTING_POLICY_SOURCE_INVALID',
    );
    expect(() => loadAgentRoutingPolicies({ repoRoot: ROOT, candidate: '{' })).toThrow(
      'TASK_ROUTING_POLICY_REGISTRY_INVALID',
    );
  });

  it('resolves exact, preferred, and policy selections without implicit substitution', () => {
    const exact: AgentExecutorRequest = {
      ...base,
      selection: { mode: 'exact', registry_id: 'codex-cli:gpt-5.6-sol' },
      capabilities: ['repository-context'],
      agent_class: 'coding-agent',
    };
    expect(resolveAgentExecutor({ request: exact, registry })).toMatchObject({
      ok: true,
      resolved: { registry_id: 'codex-cli:gpt-5.6-sol', adapter_id: 'codex-cli-adapter' },
      selection: { considered_registry_ids: ['codex-cli:gpt-5.6-sol'], fallback_used: false },
    });

    const preferred: AgentExecutorRequest = {
      ...base,
      selection: {
        mode: 'preferred',
        registry_ids: ['missing-entry', 'codex-cli:gpt-5.6-sol'],
      },
    };
    expect(resolveAgentExecutor({ request: preferred, registry })).toMatchObject({
      ok: true,
      selection: {
        considered_registry_ids: ['missing-entry', 'codex-cli:gpt-5.6-sol'],
        rejection_codes: ['TASK_MODEL_UNKNOWN'],
        fallback_used: true,
      },
    });

    const policy: AgentExecutorRequest = {
      ...base,
      effort: 'xhigh',
      selection: {
        mode: 'policy',
        policy_id: 'governed-coding',
        policy_version: '1.0.0',
      },
    };
    expect(
      resolveAgentExecutor({ request: policy, registry, policies, agentClass: 'coding-agent' }),
    ).toMatchObject({ ok: true, resolved: { registry_id: 'codex-cli:gpt-5.6-sol' } });
  });

  it('returns exact refusal codes for identity, effort, availability, class, capability, and reports', () => {
    const simple = [
      {
        id: 'offline',
        runtime: 'codex-cli',
        model: 'gpt-5.6-sol',
        efforts: ['high'],
        available: false,
        capabilities: ['text-generation'],
        eligible_agent_classes: ['coding-agent'],
        adapter_id: 'codex-cli-adapter',
      },
    ] as const;
    const cases: ReadonlyArray<readonly [AgentExecutorRequest, string]> = [
      [
        { ...base, runtime: 'missing', selection: { mode: 'exact', registry_id: 'offline' } },
        'TASK_RUNTIME_UNKNOWN',
      ],
      [
        { ...base, model: 'missing', selection: { mode: 'exact', registry_id: 'offline' } },
        'TASK_MODEL_UNKNOWN',
      ],
      [
        { ...base, effort: 'ultra', selection: { mode: 'exact', registry_id: 'offline' } },
        'TASK_EFFORT_UNSUPPORTED',
      ],
      [{ ...base, selection: { mode: 'exact', registry_id: 'offline' } }, 'TASK_MODEL_UNAVAILABLE'],
      [{ ...base, selection: { mode: 'exact', registry_id: 'missing' } }, 'TASK_MODEL_UNKNOWN'],
      [
        { ...base, selection: { mode: 'policy', policy_id: 'missing', policy_version: '1.0.0' } },
        'TASK_ROUTING_POLICY_UNAVAILABLE',
      ],
    ];
    for (const [request, code] of cases) {
      expect(resolveAgentExecutor({ request, registry: simple })).toMatchObject({
        ok: false,
        code,
      });
    }

    const exact: AgentExecutorRequest = {
      ...base,
      selection: { mode: 'exact', registry_id: 'codex-cli:gpt-5.6-sol' },
    };
    expect(
      resolveAgentExecutor({
        ...({ request: exact, registry } as const),
        agentClass: 'review-agent',
      }),
    ).toMatchObject({ ok: true });
    expect(
      resolveAgentExecutor({
        request: { ...exact, capabilities: ['missing-capability'] },
        registry,
      }),
    ).toMatchObject({ ok: false, code: 'TASK_MODEL_CAPABILITY_UNSUPPORTED' });
    expect(
      resolveAgentExecutor({
        request: exact,
        registry,
        reportedIdentity: {
          registry_id: 'codex-cli:gpt-5.6-sol',
          runtime: 'codex-cli',
          model: 'wrong-model',
          effort: 'high',
          adapter_id: 'codex-cli-adapter',
        },
      }),
    ).toMatchObject({ ok: false, code: 'TASK_RESOLVED_IDENTITY_MISMATCH' });
    expect(
      resolveAgentExecutor({
        request: exact,
        registry: [...registry.models, registry.models[0]] as never,
      }),
    ).toMatchObject({ ok: false });
  });
});
