import { isAbsolute, relative, resolve, sep } from 'node:path';

export const MODEL_RUNTIME_REGISTRY_PATH = 'law/policy/model-runtime-registry.json';

export type AgentClass = 'coding-agent' | 'review-agent' | 'ops-agent';
export type ModelIdentifierKind = 'exact' | 'governed-alias';
export type RuntimeTransport = 'provider-api' | 'host-cli';

export interface ModelRuntimeEntry {
  readonly id: string;
  readonly runtime_id: string;
  readonly vendor: string;
  readonly family: string;
  readonly adapter_id: string;
  readonly provider_identifier: string;
  readonly identifier_kind: ModelIdentifierKind;
  readonly supported_efforts: readonly string[];
  readonly capabilities: readonly string[];
  readonly eligible_agent_classes: readonly AgentClass[];
  readonly available: boolean;
  readonly availability_basis: string;
  readonly replacement: {
    readonly state: 'none' | 'deprecated' | 'replaced';
    readonly model_id: string | null;
    readonly reason: string | null;
  };
}

export interface RuntimeRegistryEntry {
  readonly id: string;
  readonly vendor: string;
  readonly family: string;
  readonly adapter_id: string;
  readonly adapter_module: string;
  readonly transport: RuntimeTransport;
  readonly executable?: string;
  readonly credential_binding?: string | null;
  readonly capabilities: readonly string[];
  readonly available: boolean;
  readonly availability_basis: string;
}

export interface ModelRuntimeRegistry {
  readonly schemaVersion: '1.0.0';
  readonly id: 'model-runtime-registry';
  readonly status: 'active';
  readonly authority: 'Architect';
  readonly decision: 'ADR-022';
  readonly availability_semantics: Readonly<Record<string, unknown>>;
  readonly runtimes: readonly RuntimeRegistryEntry[];
  readonly models: readonly ModelRuntimeEntry[];
}

export class ModelRuntimeRegistryError extends Error {
  public readonly code: string;

  public constructor(code: string, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'ModelRuntimeRegistryError';
    this.code = code;
  }
}

export interface RegistryCandidateReader {
  (
    repoRoot: string,
    candidate: unknown,
    repositoryPath: typeof MODEL_RUNTIME_REGISTRY_PATH,
  ): string;
}

export interface LoadModelRuntimeRegistryOptions {
  /** Explicit repository identity; there is deliberately no process-cwd fallback. */
  readonly repoRoot: string;
  /** Parsed document, JSON bytes/text, or an opaque candidate consumed by readCandidate. */
  readonly candidate: unknown;
  readonly readCandidate?: RegistryCandidateReader;
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown, code: string, detail: string): JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ModelRuntimeRegistryError(code, detail);
  }
  return value as JsonRecord;
}

function nonemptyString(value: unknown, code: string, detail: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ModelRuntimeRegistryError(code, detail);
  }
  return value;
}

function stringList(value: unknown, code: string, detail: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== 'string' || entry.length === 0) ||
    new Set(value).size !== value.length
  ) {
    throw new ModelRuntimeRegistryError(code, detail);
  }
  return value as readonly string[];
}

function boolean(value: unknown, code: string, detail: string): boolean {
  if (typeof value !== 'boolean') throw new ModelRuntimeRegistryError(code, detail);
  return value;
}

function containedRepositoryPath(repoRoot: string, repositoryPath: string): boolean {
  if (repoRoot.length === 0 || repositoryPath.length === 0 || isAbsolute(repositoryPath)) {
    return false;
  }
  const root = resolve(repoRoot);
  const target = resolve(root, repositoryPath);
  const fromRoot = relative(root, target).split(sep).join('/');
  return fromRoot !== '..' && !fromRoot.startsWith('../') && !repositoryPath.includes('\\');
}

function parseCandidate(options: LoadModelRuntimeRegistryOptions): unknown {
  if (options.repoRoot.length === 0) {
    throw new ModelRuntimeRegistryError(
      'TASK_MODEL_REGISTRY_SOURCE_INVALID',
      'repoRoot must be explicit',
    );
  }
  let candidate = options.candidate;
  if (options.readCandidate !== undefined) {
    candidate = options.readCandidate(
      resolve(options.repoRoot),
      options.candidate,
      MODEL_RUNTIME_REGISTRY_PATH,
    );
  }
  if (candidate instanceof Uint8Array) candidate = Buffer.from(candidate).toString('utf8');
  if (typeof candidate === 'string') {
    try {
      return JSON.parse(candidate) as unknown;
    } catch (error) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `candidate is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return candidate;
}

/**
 * Validate a candidate-tree registry without consulting ambient cwd, environment, or
 * provider aliases. The returned value is the caller's document, typed only after every
 * cross-entry identity invariant has been checked.
 */
export function validateModelRuntimeRegistry(candidate: unknown): ModelRuntimeRegistry {
  const root = record(candidate, 'TASK_MODEL_REGISTRY_INVALID', 'registry must be an object');
  if (
    root['$schema'] !== '../schemas/model-runtime-registry.schema.json' ||
    root['schemaVersion'] !== '1.0.0' ||
    root['id'] !== 'model-runtime-registry' ||
    root['status'] !== 'active' ||
    root['authority'] !== 'Architect' ||
    root['decision'] !== 'ADR-022'
  ) {
    throw new ModelRuntimeRegistryError(
      'TASK_MODEL_REGISTRY_IDENTITY_MISMATCH',
      'registry identity does not match the active ADR-022 contract',
    );
  }
  const availability = record(
    root['availability_semantics'],
    'TASK_MODEL_REGISTRY_INVALID',
    'availability_semantics must be an object',
  );
  if (
    availability['host_preflight_required'] !== true ||
    availability['authority_from_capability'] !== 'forbidden' ||
    availability['unavailable_behavior'] !== 'fail-or-consider-next-explicitly-authorized-entry'
  ) {
    throw new ModelRuntimeRegistryError(
      'TASK_MODEL_REGISTRY_IDENTITY_MISMATCH',
      'availability semantics would permit implicit execution or authority',
    );
  }
  if (!Array.isArray(root['runtimes']) || root['runtimes'].length === 0) {
    throw new ModelRuntimeRegistryError('TASK_MODEL_REGISTRY_INVALID', 'runtimes must be nonempty');
  }
  if (!Array.isArray(root['models']) || root['models'].length === 0) {
    throw new ModelRuntimeRegistryError('TASK_MODEL_REGISTRY_INVALID', 'models must be nonempty');
  }

  const runtimeIds = new Set<string>();
  const runtimes = new Map<string, RuntimeRegistryEntry>();
  for (const raw of root['runtimes']) {
    const entry = record(raw, 'TASK_MODEL_REGISTRY_INVALID', 'runtime entry must be an object');
    const id = nonemptyString(entry['id'], 'TASK_MODEL_REGISTRY_INVALID', 'runtime id is required');
    if (runtimeIds.has(id)) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_DUPLICATE',
        `duplicate runtime ${id}`,
      );
    }
    runtimeIds.add(id);
    const adapterModule = nonemptyString(
      entry['adapter_module'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} adapter_module is required`,
    );
    if (!containedRepositoryPath('.', adapterModule) || !adapterModule.endsWith('.ts')) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `runtime ${id} adapter_module is not a contained TypeScript path`,
      );
    }
    const transport = entry['transport'];
    if (transport !== 'provider-api' && transport !== 'host-cli') {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `runtime ${id} transport is invalid`,
      );
    }
    if (transport === 'host-cli') {
      nonemptyString(
        entry['executable'],
        'TASK_MODEL_REGISTRY_INVALID',
        `host runtime ${id} executable is required`,
      );
    }
    nonemptyString(
      entry['vendor'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} vendor is required`,
    );
    nonemptyString(
      entry['family'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} family is required`,
    );
    nonemptyString(
      entry['adapter_id'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} adapter_id is required`,
    );
    stringList(
      entry['capabilities'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} capabilities are invalid`,
    );
    boolean(
      entry['available'],
      'TASK_MODEL_REGISTRY_INVALID',
      `runtime ${id} availability is invalid`,
    );
    runtimes.set(id, entry as unknown as RuntimeRegistryEntry);
  }

  const modelIds = new Set<string>();
  for (const raw of root['models']) {
    const entry = record(raw, 'TASK_MODEL_REGISTRY_INVALID', 'model entry must be an object');
    const id = nonemptyString(entry['id'], 'TASK_MODEL_REGISTRY_INVALID', 'model id is required');
    if (modelIds.has(id)) {
      throw new ModelRuntimeRegistryError('TASK_MODEL_REGISTRY_DUPLICATE', `duplicate model ${id}`);
    }
    modelIds.add(id);
    const runtimeId = nonemptyString(
      entry['runtime_id'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} runtime_id is required`,
    );
    const runtime = runtimes.get(runtimeId);
    if (runtime === undefined) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_IDENTITY_MISMATCH',
        `model ${id} references unknown runtime ${runtimeId}`,
      );
    }
    const adapterId = nonemptyString(
      entry['adapter_id'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} adapter_id is required`,
    );
    const vendor = nonemptyString(
      entry['vendor'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} vendor is required`,
    );
    const family = nonemptyString(
      entry['family'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} family is required`,
    );
    if (
      adapterId !== runtime.adapter_id ||
      vendor !== runtime.vendor ||
      family !== runtime.family
    ) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_IDENTITY_MISMATCH',
        `model ${id} does not match runtime ${runtimeId}`,
      );
    }
    nonemptyString(
      entry['provider_identifier'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} provider_identifier is required`,
    );
    if (entry['identifier_kind'] !== 'exact' && entry['identifier_kind'] !== 'governed-alias') {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `model ${id} identifier_kind is invalid`,
      );
    }
    stringList(
      entry['supported_efforts'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} efforts are invalid`,
    );
    stringList(
      entry['capabilities'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} capabilities are invalid`,
    );
    const classes = stringList(
      entry['eligible_agent_classes'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} agent classes are invalid`,
    );
    if (classes.some((value) => !['coding-agent', 'review-agent', 'ops-agent'].includes(value))) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `model ${id} has an unknown agent class`,
      );
    }
    boolean(
      entry['available'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} availability is invalid`,
    );
    const replacement = record(
      entry['replacement'],
      'TASK_MODEL_REGISTRY_INVALID',
      `model ${id} replacement is required`,
    );
    if (!['none', 'deprecated', 'replaced'].includes(String(replacement['state']))) {
      throw new ModelRuntimeRegistryError(
        'TASK_MODEL_REGISTRY_INVALID',
        `model ${id} replacement state is invalid`,
      );
    }
  }

  return root as unknown as ModelRuntimeRegistry;
}

export function loadModelRuntimeRegistry(
  options: LoadModelRuntimeRegistryOptions,
): ModelRuntimeRegistry {
  return validateModelRuntimeRegistry(parseCandidate(options));
}
