import {
  type AgentClass,
  type ModelRuntimeEntry,
  type ModelRuntimeRegistry,
  type RuntimeRegistryEntry,
} from './model-runtime.js';

export const AGENT_ROUTING_POLICIES_PATH = 'law/policy/agent-routing-policies.json';

export type AgentSelection =
  | { readonly mode: 'exact'; readonly registry_id: string }
  | { readonly mode: 'preferred'; readonly registry_ids: readonly string[] }
  | {
      readonly mode: 'policy';
      readonly policy_id: string;
      readonly policy_version: string;
    };

export interface AgentExecutorRequest {
  readonly kind: 'agent';
  readonly runtime: string;
  readonly model: string;
  readonly effort: string;
  readonly selection: AgentSelection;
  readonly capabilities?: readonly string[];
  readonly agent_class?: AgentClass;
  readonly [key: string]: unknown;
}

export interface SimpleAgentRegistryEntry {
  readonly id: string;
  readonly runtime: string;
  readonly model: string;
  readonly efforts: readonly string[];
  readonly available: boolean;
  readonly capabilities?: readonly string[];
  readonly eligible_agent_classes?: readonly string[];
  readonly adapter_id?: string;
}

export interface AgentRoutingPolicy {
  readonly policy_id: string;
  readonly policy_version: string;
  readonly status: 'active';
  readonly eligible_agent_classes: readonly string[];
  readonly registry_ids: readonly string[];
  readonly allowed_efforts: readonly string[];
  readonly fallback: 'only-next-listed-entry' | 'forbidden';
  readonly rationale: string;
}

export interface AgentRoutingPolicyRegistry {
  readonly schemaVersion: '1.0.0';
  readonly id: 'agent-routing-policies';
  readonly status: 'active';
  readonly authority: 'Architect';
  readonly decision: 'ADR-022';
  readonly registry: typeof import('./model-runtime.js').MODEL_RUNTIME_REGISTRY_PATH;
  readonly identity: Readonly<Record<string, unknown>>;
  readonly resolution: Readonly<Record<string, unknown>>;
  readonly policies: readonly AgentRoutingPolicy[];
}

export interface AgentResolvedExecutor {
  readonly registry_id: string;
  readonly runtime?: string;
  readonly model?: string;
  readonly effort?: string;
  readonly adapter_id?: string;
}

export interface AgentSelectionEvidence {
  readonly mode: AgentSelection['mode'];
  readonly considered: readonly string[];
  readonly considered_registry_ids: readonly string[];
  readonly selected_registry_id?: string;
  readonly rejection_codes: readonly string[];
  readonly fallback_used: boolean;
  readonly fallback_reason: string | null;
}

export type AgentResolution =
  | {
      readonly ok: true;
      readonly requested: AgentExecutorRequest;
      readonly resolved: AgentResolvedExecutor;
      readonly selection: AgentSelectionEvidence;
    }
  | {
      readonly ok: false;
      readonly code: string;
      readonly requested: AgentExecutorRequest;
      readonly selection: AgentSelectionEvidence;
    };

export interface ResolveAgentExecutorOptions {
  readonly request: AgentExecutorRequest;
  readonly registry: readonly SimpleAgentRegistryEntry[] | ModelRuntimeRegistry;
  readonly policies?:
    | AgentRoutingPolicyRegistry
    | Readonly<Record<string, readonly string[]>>;
  readonly agentClass?: AgentClass;
  /** Optional exact adapter report. Supplying it makes a mismatch fail closed. */
  readonly reportedIdentity?: Readonly<{
    registry_id: string;
    runtime: string;
    model: string;
    effort: string;
    adapter_id?: string;
  }>;
}

type JsonRecord = Record<string, unknown>;

interface NormalizedEntry {
  readonly id: string;
  readonly runtime: string;
  readonly model: string;
  readonly efforts: readonly string[];
  readonly available: boolean;
  readonly runtimeAvailable: boolean;
  readonly capabilities: readonly string[];
  readonly eligibleAgentClasses: readonly string[];
  readonly adapterId?: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function uniqueNonemptyStrings(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && entry.length > 0) &&
    new Set(value).size === value.length
  );
}

export function validateAgentRoutingPolicies(candidate: unknown): AgentRoutingPolicyRegistry {
  if (!isRecord(candidate)) throw new Error('TASK_ROUTING_POLICY_REGISTRY_INVALID');
  if (
    candidate['$schema'] !== '../schemas/agent-routing-policies.schema.json' ||
    candidate['schemaVersion'] !== '1.0.0' ||
    candidate['id'] !== 'agent-routing-policies' ||
    candidate['status'] !== 'active' ||
    candidate['authority'] !== 'Architect' ||
    candidate['decision'] !== 'ADR-022' ||
    candidate['registry'] !== 'law/policy/model-runtime-registry.json' ||
    !isRecord(candidate['identity']) ||
    !isRecord(candidate['resolution']) ||
    !Array.isArray(candidate['policies']) ||
    candidate['policies'].length === 0
  ) {
    throw new Error('TASK_ROUTING_POLICY_REGISTRY_IDENTITY_MISMATCH');
  }
  const identity = candidate['identity'];
  const resolution = candidate['resolution'];
  if (
    identity['implicit_latest'] !== 'forbidden' ||
    identity['alias_resolution'] !== 'forbidden' ||
    resolution['authority_source'] !== 'task.discipline' ||
    resolution['executor_or_model_authority'] !== 'none'
  ) {
    throw new Error('TASK_ROUTING_POLICY_REGISTRY_IDENTITY_MISMATCH');
  }
  const identities = new Set<string>();
  for (const raw of candidate['policies']) {
    if (!isRecord(raw)) throw new Error('TASK_ROUTING_POLICY_REGISTRY_INVALID');
    const policyId = raw['policy_id'];
    const version = raw['policy_version'];
    if (
      typeof policyId !== 'string' ||
      !/^[a-z][a-z0-9-]*$/u.test(policyId) ||
      typeof version !== 'string' ||
      !/^[0-9]+\.[0-9]+\.[0-9]+$/u.test(version) ||
      raw['status'] !== 'active' ||
      !uniqueNonemptyStrings(raw['eligible_agent_classes']) ||
      !uniqueNonemptyStrings(raw['registry_ids']) ||
      !uniqueNonemptyStrings(raw['allowed_efforts']) ||
      (raw['fallback'] !== 'forbidden' && raw['fallback'] !== 'only-next-listed-entry') ||
      typeof raw['rationale'] !== 'string' ||
      raw['rationale'].length < 20
    ) {
      throw new Error('TASK_ROUTING_POLICY_REGISTRY_INVALID');
    }
    const identity = `${policyId}@${version}`;
    if (identities.has(identity)) throw new Error('TASK_ROUTING_POLICY_DUPLICATE');
    identities.add(identity);
  }
  return candidate as unknown as AgentRoutingPolicyRegistry;
}

export interface LoadAgentRoutingPoliciesOptions {
  readonly repoRoot: string;
  readonly candidate: unknown;
  readonly readCandidate?: (
    repoRoot: string,
    candidate: unknown,
    repositoryPath: typeof AGENT_ROUTING_POLICIES_PATH,
  ) => string;
}

/** Load only an explicitly supplied candidate; no implicit current-tree or latest policy. */
export function loadAgentRoutingPolicies(
  options: LoadAgentRoutingPoliciesOptions,
): AgentRoutingPolicyRegistry {
  if (options.repoRoot.length === 0) throw new Error('TASK_ROUTING_POLICY_SOURCE_INVALID');
  let candidate = options.candidate;
  if (options.readCandidate !== undefined) {
    candidate = options.readCandidate(
      options.repoRoot,
      options.candidate,
      AGENT_ROUTING_POLICIES_PATH,
    );
  }
  if (candidate instanceof Uint8Array) candidate = Buffer.from(candidate).toString('utf8');
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      throw new Error('TASK_ROUTING_POLICY_REGISTRY_INVALID');
    }
  }
  return validateAgentRoutingPolicies(candidate);
}

function normalizeRegistry(
  registry: readonly SimpleAgentRegistryEntry[] | ModelRuntimeRegistry,
): readonly NormalizedEntry[] {
  if (Array.isArray(registry)) {
    return registry.map((entry) => ({
      id: entry.id,
      runtime: entry.runtime,
      model: entry.model,
      efforts: entry.efforts,
      available: entry.available,
      runtimeAvailable: true,
      capabilities: entry.capabilities ?? [],
      eligibleAgentClasses: entry.eligible_agent_classes ?? [],
      ...(entry.adapter_id !== undefined && { adapterId: entry.adapter_id }),
    }));
  }
  const canonical = registry as ModelRuntimeRegistry;
  const runtimes = new Map<string, RuntimeRegistryEntry>(
    canonical.runtimes.map((runtime) => [runtime.id, runtime]),
  );
  return canonical.models.map((model: ModelRuntimeEntry) => {
    const runtime = runtimes.get(model.runtime_id);
    return {
      id: model.id,
      runtime: model.runtime_id,
      model: model.provider_identifier,
      efforts: model.supported_efforts,
      available: model.available,
      runtimeAvailable: runtime?.available === true,
      capabilities: model.capabilities,
      eligibleAgentClasses: model.eligible_agent_classes,
      adapterId: model.adapter_id,
    };
  });
}

function policySelection(
  selection: Extract<AgentSelection, { readonly mode: 'policy' }>,
  policies: ResolveAgentExecutorOptions['policies'],
): { readonly ids: readonly string[]; readonly policy?: AgentRoutingPolicy } | undefined {
  const identity = `${selection.policy_id}@${selection.policy_version}`;
  if (policies === undefined) return undefined;
  const canonicalPolicies = (policies as Partial<AgentRoutingPolicyRegistry>).policies;
  if (Array.isArray(canonicalPolicies)) {
    const policy = canonicalPolicies.find(
      (entry) =>
        entry.policy_id === selection.policy_id && entry.policy_version === selection.policy_version,
    );
    return policy === undefined ? undefined : { ids: policy.registry_ids, policy };
  }
  const ids = (policies as Readonly<Record<string, readonly string[]>>)[identity];
  return ids === undefined ? undefined : { ids };
}

function fail(
  request: AgentExecutorRequest,
  code: string,
  mode: AgentSelection['mode'],
  considered: readonly string[],
  rejectionCodes: readonly string[],
): AgentResolution {
  const fallbackUsed = mode !== 'exact' && considered.length > 1;
  return {
    ok: false,
    code,
    requested: request,
    selection: {
      mode,
      considered,
      considered_registry_ids: considered,
      rejection_codes: rejectionCodes,
      fallback_used: fallbackUsed,
      fallback_reason: fallbackUsed
        ? rejectionCodes.at(-1) ?? 'explicit-ordered-fallback-exhausted'
        : null,
    },
  };
}

function candidateRejection(
  entry: NormalizedEntry,
  request: AgentExecutorRequest,
  agentClass: AgentClass | undefined,
): string | undefined {
  if (entry.runtime !== request.runtime || entry.model !== request.model) {
    return 'TASK_REGISTRY_IDENTITY_MISMATCH';
  }
  if (!entry.efforts.includes(request.effort)) return 'TASK_EFFORT_UNSUPPORTED';
  if (!entry.runtimeAvailable || !entry.available) return 'TASK_MODEL_UNAVAILABLE';
  if (
    agentClass !== undefined &&
    entry.eligibleAgentClasses.length > 0 &&
    !entry.eligibleAgentClasses.includes(agentClass)
  ) {
    return 'TASK_AGENT_CLASS_INELIGIBLE';
  }
  const requiredCapabilities = request.capabilities ?? [];
  if (requiredCapabilities.some((capability) => !entry.capabilities.includes(capability))) {
    return 'TASK_MODEL_CAPABILITY_UNSUPPORTED';
  }
  return undefined;
}

/**
 * Pure fail-closed selection. It never invokes a provider, mutates the request, widens
 * discipline authority, resolves aliases, or considers an entry outside the requested
 * exact ID, preferred list, or named-and-versioned policy.
 */
export function resolveAgentExecutor(options: ResolveAgentExecutorOptions): AgentResolution {
  const { request } = options;
  const canonicalRegistry = !Array.isArray(options.registry);
  const registry = normalizeRegistry(options.registry);
  const byId = new Map<string, NormalizedEntry>();
  for (const entry of registry) {
    if (byId.has(entry.id)) {
      return fail(request, 'TASK_MODEL_REGISTRY_DUPLICATE', request.selection.mode, [], []);
    }
    byId.set(entry.id, entry);
  }

  if (!registry.some((entry) => entry.runtime === request.runtime)) {
    return fail(request, 'TASK_RUNTIME_UNKNOWN', request.selection.mode, [], []);
  }
  const requestedModels = registry.filter(
    (entry) => entry.runtime === request.runtime && entry.model === request.model,
  );
  if (requestedModels.length === 0) {
    return fail(request, 'TASK_MODEL_UNKNOWN', request.selection.mode, [], []);
  }
  if (!requestedModels.some((entry) => entry.efforts.includes(request.effort))) {
    return fail(request, 'TASK_EFFORT_UNSUPPORTED', request.selection.mode, [], []);
  }

  let ids: readonly string[];
  let policy: AgentRoutingPolicy | undefined;
  if (request.selection.mode === 'exact') {
    ids = [request.selection.registry_id];
  } else if (request.selection.mode === 'preferred') {
    ids = request.selection.registry_ids;
  } else {
    const selectedPolicy = policySelection(request.selection, options.policies);
    if (selectedPolicy === undefined) {
      return fail(
        request,
        'TASK_ROUTING_POLICY_UNAVAILABLE',
        request.selection.mode,
        [],
        [],
      );
    }
    ids = selectedPolicy.ids;
    policy = selectedPolicy.policy;
  }

  const agentClass = options.agentClass ?? request.agent_class;
  if (policy !== undefined) {
    if (agentClass !== undefined && !policy.eligible_agent_classes.includes(agentClass)) {
      return fail(request, 'TASK_AGENT_CLASS_INELIGIBLE', 'policy', [], []);
    }
    if (!policy.allowed_efforts.includes(request.effort)) {
      return fail(request, 'TASK_EFFORT_UNSUPPORTED', 'policy', [], []);
    }
  }

  const considered: string[] = [];
  const rejectionCodes: string[] = [];
  const limit = policy?.fallback === 'forbidden' ? Math.min(ids.length, 1) : ids.length;
  for (let index = 0; index < limit; index += 1) {
    const id = ids[index];
    if (id === undefined) continue;
    considered.push(id);
    const entry = byId.get(id);
    if (entry === undefined) {
      rejectionCodes.push('TASK_MODEL_UNKNOWN');
      if (request.selection.mode === 'exact') {
        return fail(request, 'TASK_MODEL_UNKNOWN', 'exact', considered, rejectionCodes);
      }
      continue;
    }
    const rejection = candidateRejection(entry, request, agentClass);
    if (rejection !== undefined) {
      rejectionCodes.push(rejection);
      if (request.selection.mode === 'exact') {
        return fail(request, rejection, 'exact', considered, rejectionCodes);
      }
      continue;
    }

    const resolved: AgentResolvedExecutor = canonicalRegistry
      ? {
          registry_id: entry.id,
          runtime: entry.runtime,
          model: entry.model,
          effort: request.effort,
          ...(entry.adapterId !== undefined && { adapter_id: entry.adapterId }),
        }
      : { registry_id: entry.id };
    if (options.reportedIdentity !== undefined) {
      const report = options.reportedIdentity;
      if (
        report.registry_id !== resolved.registry_id ||
        report.runtime !== entry.runtime ||
        report.model !== entry.model ||
        report.effort !== request.effort ||
        (entry.adapterId !== undefined && report.adapter_id !== entry.adapterId)
      ) {
        rejectionCodes.push('TASK_RESOLVED_IDENTITY_MISMATCH');
        return fail(
          request,
          'TASK_RESOLVED_IDENTITY_MISMATCH',
          request.selection.mode,
          considered,
          rejectionCodes,
        );
      }
    }
    const fallbackUsed = index > 0;
    return {
      ok: true,
      requested: request,
      resolved,
      selection: {
        mode: request.selection.mode,
        considered,
        considered_registry_ids: considered,
        selected_registry_id: entry.id,
        rejection_codes: rejectionCodes,
        fallback_used: fallbackUsed,
        fallback_reason: fallbackUsed ? rejectionCodes.at(-1) ?? 'explicit-ordered-fallback' : null,
      },
    };
  }

  const code =
    request.selection.mode === 'exact'
      ? rejectionCodes[0] ?? 'TASK_MODEL_UNAVAILABLE'
      : 'TASK_MODEL_UNAVAILABLE';
  return fail(request, code, request.selection.mode, considered, rejectionCodes);
}
