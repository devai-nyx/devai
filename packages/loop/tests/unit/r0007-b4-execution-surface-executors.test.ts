// Invariants: INV-DEVAI-001, INV-DEVAI-017, INV-DEVAI-019, INV-DEVAI-020
// R-0007 B4 execution-surface acceptance: complete the fourth executor adapter
// and prove exact/policy routing cannot substitute an unrequested candidate.
import { describe, expect, it } from 'vitest';
import {
  resolveAgentExecutor,
  type AgentExecutorRequest,
  type AgentRoutingPolicyRegistry,
  type SimpleAgentRegistryEntry,
} from '../../src/loop/agent-routing.js';
import { completeHumanTask, type HumanCompletionOptions } from '../../src/loop/human-executor.js';

const HUMAN: HumanCompletionOptions = {
  task_id: 'TASK-8401',
  round_id: 'R-0007',
  executor: {
    kind: 'human',
    role: 'inspector',
    completion_evidence: ['EV-ACCEPTANCE', 'EV-REVIEW'],
  },
  evidence: ['EV-ACCEPTANCE', 'EV-REVIEW'],
  task: { id: 'TASK-8401', round_id: 'R-0007' },
  completion: { task_id: 'TASK-8401', round_id: 'R-0007', role: 'inspector' },
  completed_by_role: 'inspector',
};

const ROUTING_REGISTRY: readonly SimpleAgentRegistryEntry[] = [
  {
    id: 'requested-exact',
    runtime: 'codex-cli',
    model: 'gpt-requested',
    efforts: ['high'],
    available: true,
    capabilities: ['repository-context'],
    eligible_agent_classes: ['coding-agent'],
    adapter_id: 'codex-adapter',
  },
  {
    id: 'wrong-runtime',
    runtime: 'other-runtime',
    model: 'gpt-requested',
    efforts: ['high'],
    available: true,
  },
  {
    id: 'wrong-model',
    runtime: 'codex-cli',
    model: 'gpt-other',
    efforts: ['high'],
    available: true,
  },
  {
    id: 'wrong-effort',
    runtime: 'codex-cli',
    model: 'gpt-requested',
    efforts: ['low'],
    available: true,
  },
] as const;

function exact(registryId: string): AgentExecutorRequest {
  return {
    kind: 'agent',
    runtime: 'codex-cli',
    model: 'gpt-requested',
    effort: 'high',
    selection: { mode: 'exact', registry_id: registryId },
    capabilities: ['repository-context'],
    agent_class: 'coding-agent',
  };
}

describe('R-0007 B4 execution-surface human executor', () => {
  it('completes the fourth executor kind only with the exact task, round, role, and evidence', () => {
    expect(completeHumanTask(HUMAN)).toEqual({
      ok: true,
      task_id: 'TASK-8401',
      round_id: 'R-0007',
      role: 'inspector',
      evidence: ['EV-ACCEPTANCE', 'EV-REVIEW'],
    });
  });

  it('returns one exact refusal for every human identity and evidence mismatch', () => {
    const cases = [
      [
        { ...HUMAN, executor: { kind: 'routine', role: 'inspector' } as never },
        'TASK_HUMAN_EXECUTOR_REQUIRED',
      ],
      [{ ...HUMAN, task: { id: 'TASK-X', round_id: 'R-0007' } }, 'TASK_HUMAN_TASK_MISMATCH'],
      [{ ...HUMAN, task: { id: 'TASK-8401', round_id: 'R-0008' } }, 'TASK_HUMAN_ROUND_MISMATCH'],
      [
        {
          ...HUMAN,
          completion: { task_id: 'TASK-X', round_id: 'R-0007', role: 'inspector' },
        },
        'TASK_HUMAN_TASK_MISMATCH',
      ],
      [
        {
          ...HUMAN,
          completion: { task_id: 'TASK-8401', round_id: 'R-0008', role: 'inspector' },
        },
        'TASK_HUMAN_ROUND_MISMATCH',
      ],
      [
        {
          ...HUMAN,
          completion: { task_id: 'TASK-8401', round_id: 'R-0007', role: 'engineer' },
        },
        'TASK_HUMAN_ROLE_MISMATCH',
      ],
      [{ ...HUMAN, completed_by_role: 'engineer' }, 'TASK_HUMAN_ROLE_MISMATCH'],
      [{ ...HUMAN, evidence: [] }, 'TASK_HUMAN_EVIDENCE_REQUIRED'],
      [{ ...HUMAN, evidence: ['EV-ACCEPTANCE', 'EV-ACCEPTANCE'] }, 'TASK_HUMAN_EVIDENCE_REQUIRED'],
      [{ ...HUMAN, evidence: ['EV-ACCEPTANCE'] }, 'TASK_HUMAN_EVIDENCE_REQUIRED'],
    ] as const satisfies ReadonlyArray<readonly [HumanCompletionOptions, string]>;

    for (const [options, code] of cases) {
      expect(completeHumanTask(options)).toEqual({ ok: false, code });
    }
  });
});

describe('R-0007 B4 execution-surface exact and policy routing', () => {
  it('never substitutes a matching alternative for an exact runtime, model, or effort mismatch', () => {
    const cases = [
      ['wrong-runtime', 'TASK_REGISTRY_IDENTITY_MISMATCH'],
      ['wrong-model', 'TASK_REGISTRY_IDENTITY_MISMATCH'],
      ['wrong-effort', 'TASK_EFFORT_UNSUPPORTED'],
    ] as const;

    for (const [registryId, code] of cases) {
      const request = exact(registryId);
      const result = resolveAgentExecutor({ request, registry: ROUTING_REGISTRY });
      expect(result, registryId).toMatchObject({
        ok: false,
        code,
        requested: request,
        selection: {
          mode: 'exact',
          considered_registry_ids: [registryId],
          fallback_used: false,
          fallback_reason: null,
        },
      });
      expect(result).not.toHaveProperty('resolved');
      expect(result).not.toHaveProperty('selection.selected_registry_id');
      expect(JSON.stringify(result)).not.toContain('requested-exact');
    }
  });

  it('does not advance a named policy whose canonical fallback rule is forbidden', () => {
    const requestedExact = ROUTING_REGISTRY.find((entry) => entry.id === 'requested-exact');
    if (requestedExact === undefined) throw new Error('requested exact fixture is missing');
    const registry: readonly SimpleAgentRegistryEntry[] = [
      { ...requestedExact, id: 'offline-first', available: false },
      requestedExact,
    ];
    const policies = {
      policies: [
        {
          policy_id: 'no-fallback',
          policy_version: '1.0.0',
          status: 'active',
          eligible_agent_classes: ['coding-agent'],
          registry_ids: ['offline-first', 'requested-exact'],
          allowed_efforts: ['high'],
          fallback: 'forbidden',
          rationale: 'The first exact governed candidate is the only authorized candidate.',
        },
      ],
    } as unknown as AgentRoutingPolicyRegistry;
    const request: AgentExecutorRequest = {
      ...exact('requested-exact'),
      selection: {
        mode: 'policy',
        policy_id: 'no-fallback',
        policy_version: '1.0.0',
      },
    };

    const result = resolveAgentExecutor({ request, registry, policies });
    expect(result).toMatchObject({
      ok: false,
      code: 'TASK_MODEL_UNAVAILABLE',
      selection: {
        mode: 'policy',
        considered_registry_ids: ['offline-first'],
        rejection_codes: ['TASK_MODEL_UNAVAILABLE'],
        fallback_used: false,
        fallback_reason: null,
      },
    });
    expect(result).not.toHaveProperty('resolved');
  });
});
