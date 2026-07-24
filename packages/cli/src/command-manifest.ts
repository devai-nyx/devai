import type { ActionAuthority } from './define-command.js';

export type ActionLifecycle = 'supported' | 'experimental' | 'retired';
export type ActionTier = 'porcelain' | 'plumbing';
export type ActionVisibility = 'common' | 'standard' | 'advanced' | 'maintainer';
export type ActionEffect = 'read' | 'harness-write' | 'local-write' | 'remote-write';
export type ActionCapability =
  | 'fs:f5-config'
  | 'fs:f5-state'
  | 'fs:f4-inventory'
  | 'fs:worktree-admin'
  | 'fs:workspace'
  | 'fs:unknown-write'
  | 'db:read'
  | 'db:write'
  | 'db:unclassified'
  | 'host-cache:write'
  | `proc:${string}`
  | `net:${string}`;
export type AdoptionProfile = 'tier1' | 'tier2' | 'tier3';

export interface CommandMetadata {
  readonly path: readonly string[];
  readonly lifecycle: ActionLifecycle;
  readonly lifecycle_reason: string;
  readonly promotion_criteria: readonly string[];
  readonly visibility: ActionVisibility;
  readonly tier: ActionTier;
  readonly profiles: readonly AdoptionProfile[];
  readonly effects: ActionEffect;
  readonly authority_contract_version: '1.0.0';
  readonly authority_contract: AuthorityActionContract;
}

export type HumanRole = 'owner' | 'architect' | 'inspector' | 'engineer' | 'auditor';
export type AuthorityTargetKind = 'fs' | 'git-ref' | 'db' | 'remote';

export interface AuthorityActionContract {
  readonly schemaVersion: '1.0.0';
  readonly action_id: string;
  readonly effect: ActionEffect;
  readonly capabilities: readonly ActionCapability[];
  readonly subject:
    | Readonly<{ kind: 'none' }>
    | Readonly<{ kind: 'human'; allowed_roles: readonly HumanRole[] }>
    | Readonly<{
        kind: 'derived-machine';
        actor: 'harness' | 'upgrade' | 'release';
        transition: 'harness-write' | 'upgrade' | 'release';
        initiator:
          'none' | Readonly<{ allowed_roles: readonly HumanRole[]; preserve_in_context: true }>;
      }>;
  readonly consent: Readonly<{
    write: boolean;
    allow_publish: boolean;
    experimental: boolean;
  }>;
  readonly planner:
    | Readonly<{ kind: 'none' }>
    | Readonly<{
        kind: 'exact-plan';
        planner_id: string;
        target_kinds: readonly AuthorityTargetKind[];
        atomicity: 'whole-plan';
      }>
    | Readonly<{
        kind: 'bounded-batches';
        planner_id: string;
        target_kinds: readonly AuthorityTargetKind[];
        bounds: Readonly<{
          max_batches: number;
          max_targets_per_batch: number;
          max_total_targets: number;
        }>;
        recovery: 'preserve-and-report';
      }>;
  readonly boundary:
    | Readonly<{ kind: 'none' }>
    | Readonly<{
        kind: 'mutation-adapters';
        adapter_ids: readonly string[];
        final_reverification: true;
      }>;
  readonly readiness: Readonly<{
    requires_binding: boolean;
    independent_acceptance_required: true;
  }>;
}

const ALL_PROFILES: readonly AdoptionProfile[] = ['tier1', 'tier2', 'tier3'];

const F5_CONFIG_ACTIONS = new Set(['hooks install', 'init apply-f5', 'upgrade']);

const SUBPROCESS_CAPABILITIES: Readonly<Record<string, readonly ActionCapability[]>> = {
  'check dependencies': ['proc:pnpm'],
  'check docs-governance': ['proc:git', 'proc:dynamic'],
  'docs publish': ['proc:git', 'proc:dynamic'],
  doctor: ['proc:sh', 'proc:dynamic', 'proc:git', 'proc:npx', 'proc:gh'],
  'evidence actions-verify': ['proc:git'],
  'evidence verify-local': ['proc:git'],
  'inv regen': ['proc:git'],
  'record run': ['proc:git', 'proc:sh'],
  'round archive': ['proc:git'],
  'sense run': ['proc:dynamic'],
  'skill run': ['proc:git', 'proc:npx', 'proc:pnpm', 'proc:node'],
  'verify translation': ['proc:docker', 'proc:git', 'proc:psql', 'proc:sandbox-exec'],
};

function capabilitiesFor(name: string, effect: ActionEffect): readonly ActionCapability[] {
  const subprocesses = SUBPROCESS_CAPABILITIES[name] ?? [];
  if (name === 'verify translation') {
    return ['fs:f5-state', 'fs:worktree-admin', 'db:read', 'db:write', ...subprocesses];
  }
  if (effect === 'read') return subprocesses;
  if (effect === 'remote-write') {
    // `docs publish` mutates locally before and after the push: the build
    // stage writes docs/site/build (fs:workspace), the publish stage stages
    // the orphan commit in a temporary worktree (fs:worktree-admin), and the
    // success path persists .devai/state/docs-publish-baseline.txt
    // (fs:f5-state). Without these grants the R25 path-domain seam rejects
    // the verb stage by stage and it cannot run at all.
    return name === 'docs publish'
      ? ['net:github-pages', 'fs:workspace', 'fs:worktree-admin', 'fs:f5-state', ...subprocesses]
      : ['net:github-pages', ...subprocesses];
  }
  if (name === 'state prune') return ['fs:f5-state', 'fs:workspace', ...subprocesses];
  if (effect === 'harness-write') {
    if (name.startsWith('worktree ')) {
      return ['fs:worktree-admin', 'fs:f5-state', ...subprocesses];
    }
    if (['task spawn', 'task complete'].includes(name)) {
      return ['fs:f5-state', 'fs:worktree-admin', ...subprocesses];
    }
    return ['fs:f5-state', ...subprocesses];
  }
  if (F5_CONFIG_ACTIONS.has(name)) {
    return name === 'hooks install'
      ? ['fs:f5-config', 'fs:workspace', ...subprocesses]
      : ['fs:f5-config', ...subprocesses];
  }
  if (name.startsWith('db ')) return ['db:write', ...subprocesses];
  if (name === 'loop run') {
    return ['fs:workspace', 'fs:f5-state', 'fs:worktree-admin', 'db:write', ...subprocesses];
  }
  return ['fs:workspace', ...subprocesses];
}

export function deriveActionEffectFromCapabilities(
  capabilities: readonly ActionCapability[],
): ActionEffect {
  if (capabilities.some((capability) => capability.startsWith('net:'))) {
    return 'remote-write';
  }
  // R24 shadow subprocess capabilities are evidence annotations. Their
  // registry effect is checked independently; R25 binds that effect at the
  // runtime seam. They do not alter the pre-existing public scalar in R24.
  if (
    capabilities.some((capability) =>
      [
        'fs:f5-config',
        'fs:workspace',
        'fs:unknown-write',
        'db:write',
        'db:unclassified',
        'host-cache:write',
      ].includes(capability),
    )
  ) {
    return 'local-write';
  }
  if (
    capabilities.some((capability) =>
      ['fs:f5-state', 'fs:f4-inventory', 'fs:worktree-admin'].includes(capability),
    )
  ) {
    return 'harness-write';
  }
  return 'read';
}

export function validateDeclaredCapabilityConsistency(
  entries: readonly Readonly<{
    name: string;
    effects: ActionEffect;
    authority_contract: Readonly<{
      action_id: string;
      capabilities?: readonly ActionCapability[];
    }>;
  }>[],
): void {
  for (const entry of entries) {
    const capabilities = entry.authority_contract.capabilities;
    if (capabilities === undefined) {
      throw new Error(`${entry.name}: EFFECT_CAPABILITIES_MISSING`);
    }
    // Compatibility boundary: state prune historically uses harness-write
    // consent while pruning both F5 state and generated workspace coverage.
    // Its domain set remains explicit and binding; changing the public scalar
    // requires a separate Owner consent decision.
    const derived = entry.name.endsWith('state prune')
      ? 'harness-write'
      : deriveActionEffectFromCapabilities(capabilities);
    if (entry.authority_contract.action_id !== entry.name || derived !== entry.effects) {
      throw new Error(`${entry.name}: EFFECT_CAPABILITIES_CATALOG_MISMATCH`);
    }
  }
}

/**
 * Complete live action-effect table. This intentionally enumerates reads too:
 * a newly registered action cannot inherit a permissive read classification.
 */
const ACTION_EFFECTS: Readonly<Record<string, ActionEffect>> = {
  'actions list': 'read',
  'backlog add': 'harness-write',
  'backlog compact': 'harness-write',
  'backlog complete': 'harness-write',
  'backlog list': 'read',
  'backlog next': 'read',
  'blueprint diff': 'read',
  'blueprint plan': 'read',
  'blueprint validate': 'read',
  'check adrs': 'read',
  'check action-effects': 'read',
  'check ci-economy': 'read',
  'check docs-governance': 'read',
  'check dependencies': 'read',
  'check forbidden-actions': 'read',
  'check glob-guards': 'read',
  'check overrides': 'read',
  'check pr-compliance': 'read',
  'check prompt-overlays': 'read',
  'check sensor-integrity': 'read',
  'ci scaffold': 'local-write',
  'coverage aggregate': 'harness-write',
  'db drop': 'local-write',
  'db provision': 'local-write',
  'db rebuild-template': 'local-write',
  'db start-shared': 'local-write',
  'db status': 'read',
  'db stop-shared': 'local-write',
  'decision close': 'harness-write',
  'docs cli': 'local-write',
  'docs decisions render': 'read',
  'docs links': 'read',
  'docs publish': 'remote-write',
  'docs render-mermaid': 'local-write',
  'docs rounds render': 'read',
  'docs synthesize': 'local-write',
  'docs synthesize-all': 'local-write',
  doctor: 'read',
  'evidence chain-head': 'harness-write',
  'evidence actions-verify': 'harness-write',
  'evidence collect-local': 'harness-write',
  'evidence emit': 'harness-write',
  'evidence redact': 'harness-write',
  'evidence verify': 'read',
  'evidence verify-local': 'read',
  'hooks install': 'local-write',
  'govern auditor-post-merge': 'harness-write',
  'init apply-architect': 'local-write',
  'init apply-f5': 'local-write',
  'init apply-owner': 'local-write',
  'init plan': 'read',
  'inv adherence-reverse': 'read',
  'inv components': 'read',
  'inv contracts': 'read',
  'inv coverage': 'read',
  'inv dependencies': 'read',
  'inv glossary': 'read',
  'inv modules': 'read',
  'inv regen': 'read',
  'inv routes': 'read',
  'inv schemas': 'read',
  'inv suggest': 'harness-write',
  'inv tests': 'read',
  'llm probe': 'read',
  'lock acquire': 'harness-write',
  'lock list': 'read',
  'lock reap': 'harness-write',
  'lock release': 'harness-write',
  'loop run': 'local-write',
  'mutation run': 'harness-write',
  'mutation verify': 'local-write',
  'pack graduate-invariants': 'local-write',
  'pack resolve': 'read',
  'phase close': 'harness-write',
  'phase ledger': 'read',
  'prompts compose': 'read',
  'prompts diff': 'read',
  'prompts freeze': 'read',
  'record run': 'harness-write',
  'release gate': 'harness-write',
  'release list': 'harness-write',
  'release postdeploy-verify': 'harness-write',
  'release runtime-drift': 'harness-write',
  'render matrix': 'harness-write',
  'rgr emit': 'harness-write',
  'rgr list': 'read',
  'rgr resolve': 'harness-write',
  'rgr show': 'read',
  'rtd bundle': 'harness-write',
  'round declare': 'local-write',
  'round archive': 'local-write',
  'round scaffold': 'local-write',
  'round status': 'read',
  'score assess': 'read',
  'score backlog-refresh': 'read',
  'score compute': 'read',
  'score view': 'read',
  'sense api': 'read',
  'sense build': 'read',
  'sense coverage': 'read',
  'sense data-handling': 'read',
  'sense data-model': 'read',
  'sense decision-citation-resolution': 'read',
  'sense decision-record-integrity': 'read',
  'sense dep-graph': 'read',
  'sense docs-drift': 'read',
  'sense archive-immutability': 'read',
  'sense site-drift': 'read',
  'sense harness-coherence': 'read',
  'sense harness-coverage': 'read',
  'sense harness-depth': 'read',
  'sense harness-green-main': 'read',
  'sense harness-idiomaticity': 'read',
  'sense harness-invariant-alignment': 'read',
  'sense harness-performance': 'read',
  'sense harness-robustness': 'read',
  'sense harness-security': 'read',
  'sense inventory-adherence': 'read',
  'sense inventory-determinism': 'read',
  'sense inventory-performance': 'read',
  'sense judge': 'read',
  'sense lint': 'read',
  'sense migrate-check': 'read',
  'sense perf-test': 'read',
  'sense plant-coherence': 'read',
  'sense plant-coverage': 'read',
  'sense plant-depth': 'read',
  'sense rbac': 'read',
  'sense readings-record': 'harness-write',
  'sense readings-rebuild': 'harness-write',
  'sense routes': 'read',
  'sense round-record-integrity': 'read',
  'sense run': 'read',
  'sense runtime-api': 'read',
  'sense runtime-auth': 'read',
  'sense runtime-data': 'read',
  'sense security-scan': 'read',
  'sense spec-alignment': 'read',
  'sense spec-depth': 'read',
  'sense spec-freshness': 'read',
  'sense spec-idiomaticity': 'read',
  'sense spec-performance-targets': 'read',
  'sense spec-robustness-targets': 'read',
  'sense spec-security-coverage': 'read',
  'sense test': 'read',
  'sense test-coherence': 'read',
  'sense test-coverage-depth': 'read',
  'sense test-idiomaticity': 'read',
  'sense test-invariant-alignment': 'read',
  'sense test-performance-coverage': 'read',
  'sense test-robustness-coverage': 'read',
  'sense test-security-coverage': 'read',
  'sense test-weakening': 'read',
  'sense trace-resolve': 'read',
  'sense type-check': 'read',
  'skill list': 'read',
  'skill run': 'local-write',
  'spec validate-action-coverage': 'read',
  'spec validate-all': 'read',
  'spec validate-glossary': 'read',
  'spec validate-invariants': 'read',
  'spec validate-invariant-strategies': 'read',
  'spec validate-journeys': 'read',
  'spec validate-schema': 'read',
  'spec validate-test-trace': 'read',
  'spec validate-trace': 'read',
  'state prune': 'harness-write',
  'task complete': 'harness-write',
  'task escalate': 'harness-write',
  'task list': 'read',
  'task pause-rgr': 'harness-write',
  'task resume-rgr': 'harness-write',
  'task spawn': 'harness-write',
  'triage classify': 'read',
  'triage dispatch': 'read',
  'triage tie-break': 'read',
  upgrade: 'local-write',
  'verify translation': 'local-write',
  'worktree adopt': 'harness-write',
  'worktree create': 'harness-write',
  'worktree destroy': 'harness-write',
  'worktree list': 'read',
  'worktree reap': 'harness-write',
  'work session start': 'harness-write',
  'work session end': 'harness-write',
};

function suffix(name: string, prefix: string): string[] {
  return name.slice(prefix.length).split('-');
}

/** Canonical public path for every pre-0.5 registry action. */
export function canonicalPath(name: string): readonly string[] {
  if (name === 'doctor') return [name];
  if (name.startsWith('init ')) return name.split(' ');
  if (name === 'actions list') return ['catalog', 'actions'];
  if (name === 'upgrade') return ['adopt', 'upgrade'];
  if (name === 'ci scaffold') return ['adopt', 'ci', 'scaffold'];
  if (name === 'hooks install') return ['adopt', 'hooks', 'install'];
  if (name === 'pack resolve') return ['adopt', 'pack', 'resolve'];
  if (name === 'pack graduate-invariants') return ['adopt', 'pack', 'graduate'];
  if (name.startsWith('blueprint ')) return ['spec', 'blueprint', ...suffix(name, 'blueprint ')];
  if (name.startsWith('spec validate-'))
    return ['spec', 'validate', ...suffix(name, 'spec validate-')];
  if (name.startsWith('verify ')) return name.split(' ');
  if (name === 'rtd bundle') return ['spec', 'rtd', 'bundle'];
  if (name === 'decision close') return ['spec', 'decision', 'close'];
  if (name.startsWith('inv ')) {
    const action = suffix(name, 'inv ');
    return ['inventory', ...(action.join('-') === 'adherence-reverse' ? ['adherence'] : action)];
  }
  if (name.startsWith('check ')) return ['policy', 'check', ...suffix(name, 'check ')];
  if (name.startsWith('score ')) return ['govern', 'score', ...suffix(name, 'score ')];
  if (name.startsWith('triage ')) return ['govern', 'triage', ...suffix(name, 'triage ')];
  if (name.startsWith('rgr ')) return ['govern', 'rgr', ...suffix(name, 'rgr ')];
  if (name.startsWith('phase ')) return ['govern', 'phase', ...suffix(name, 'phase ')];
  if (name === 'govern auditor-post-merge') return ['govern', 'auditor', 'post-merge'];
  for (const noun of ['backlog', 'task', 'worktree', 'lock', 'db', 'state']) {
    if (name.startsWith(`${noun} `)) return ['work', noun, ...suffix(name, `${noun} `)];
  }
  if (name === 'evidence chain-head') return ['evidence', 'chain', 'head'];
  if (name === 'evidence verify') return ['evidence', 'chain', 'verify'];
  if (name === 'evidence collect-local') return ['evidence', 'local', 'collect'];
  if (name === 'evidence verify-local') return ['evidence', 'local', 'verify'];
  if (name.startsWith('evidence ')) return ['evidence', ...suffix(name, 'evidence ')];
  if (name === 'record run') return ['evidence', 'test', 'record'];
  if (name === 'render matrix') return ['evidence', 'test', 'matrix'];
  if (name === 'coverage aggregate') return ['evidence', 'coverage', 'aggregate'];
  if (name.startsWith('mutation ')) return ['sense', 'mutation', ...suffix(name, 'mutation ')];
  if (name.startsWith('skill ')) return ['agent', 'skill', ...suffix(name, 'skill ')];
  if (name.startsWith('prompts ')) return ['agent', 'prompt', ...suffix(name, 'prompts ')];
  if (name === 'llm probe') return ['agent', 'llm', 'probe'];
  if (name.startsWith('release ')) return ['release', ...suffix(name, 'release ')];
  if (name === 'docs decisions render' || name === 'docs rounds render') return name.split(' ');
  if (name.startsWith('round ')) return name.split(' ');
  if (name.startsWith('docs ')) return ['docs', ...suffix(name, 'docs ')];
  if (name === 'loop run') return ['experimental', 'loop', 'run'];
  if (name.startsWith('sense runtime-'))
    return ['sense', 'runtime', ...suffix(name, 'sense runtime-')];
  for (const substrate of ['spec', 'plant', 'test', 'inventory', 'harness']) {
    if (name.startsWith(`sense ${substrate}-`)) {
      return ['sense', substrate, ...suffix(name, `sense ${substrate}-`)];
    }
  }
  for (const observation of [
    'api',
    'coverage',
    'data-handling',
    'data-model',
    'dep-graph',
    'rbac',
    'routes',
  ]) {
    if (name === `sense ${observation}`) return ['sense', 'inventory', ...observation.split('-')];
  }
  if (name === 'sense readings-record') return ['sense', 'readings', 'record'];
  if (name === 'sense readings-rebuild') return ['sense', 'readings', 'rebuild'];
  if (name.startsWith('sense ')) return ['sense', ...suffix(name, 'sense ')];
  return name.split(' ').flatMap((part) => part.split('-'));
}

function visibilityFor(path: readonly string[]): ActionVisibility {
  if (path.length === 1 || path[0] === 'catalog') return 'common';
  if (path[0] === 'agent' || path.includes('phase')) return 'maintainer';
  // R17.C.5 (DEC-2, D-131): `docs` is referenced by the brownfield
  // walkthrough (docs synthesize, docs links), so it must be discoverable
  // without --help-all; `agent` stays maintainer-only.
  if (['docs', 'work', 'inventory'].includes(path[0] ?? '') || path.length > 3) return 'advanced';
  return 'standard';
}

const PORCELAIN_PATHS = new Set([
  'adopt upgrade',
  'agent skill run',
  'catalog actions',
  'docs publish',
  'doctor',
  'evidence chain verify',
  'evidence local verify',
  'govern phase close',
  'govern phase ledger',
  'govern score compute',
  'init plan',
  'sense build',
  'sense docs drift',
  'sense inventory api',
  'sense inventory data model',
  'sense inventory performance',
  'sense inventory rbac',
  'sense lint',
  'sense run',
  'sense spec idiomaticity',
  'sense test',
  'sense type check',
  'spec validate all',
  'work db start shared',
  'work db status',
  'work db stop shared',
  'work lock acquire',
  'work lock list',
  'work lock release',
  'work session end',
  'work session start',
  'work task complete',
  'work task list',
  'work task spawn',
]);

function tierFor(path: readonly string[]): ActionTier {
  return PORCELAIN_PATHS.has(path.join(' ')) ? 'porcelain' : 'plumbing';
}

function effectsFor(name: string): ActionEffect {
  const effect = ACTION_EFFECTS[name];
  if (effect === undefined) {
    throw new Error(
      `action '${name}' has no explicit effect declaration; update ACTION_EFFECTS before registration`,
    );
  }
  return effect;
}

const ALL_ROLES: readonly HumanRole[] = ['owner', 'architect', 'inspector', 'engineer', 'auditor'];

function allowedRolesFor(
  name: string,
  authority: ActionAuthority | undefined,
  effect: ActionEffect,
): readonly HumanRole[] {
  if (name === 'hooks install') return ['architect'];
  if (name === 'evidence actions-verify') return ['auditor'];
  if (
    name.startsWith('backlog ') ||
    name.startsWith('lock ') ||
    name.startsWith('task ') ||
    name.startsWith('worktree ') ||
    name === 'state prune'
  ) {
    return ['engineer'];
  }
  if (effect === 'harness-write') return ALL_ROLES;
  if (name === 'skill run') return ALL_ROLES;
  if (effect === 'remote-write' || name === 'upgrade') return ['architect'];
  if (name === 'init apply-owner') return ['owner'];
  if (name === 'init apply-architect' || name === 'init apply-f5') return ['architect'];
  if (name === 'mutation verify') return ['inspector'];
  if (name === 'verify translation') return ['inspector'];
  if (name.startsWith('docs ') || name === 'decision close' || name === 'rgr resolve') {
    return ['architect'];
  }
  switch (authority) {
    case 'specifier':
    case 'policy_firewall':
    case 'release_controller':
      return ['architect'];
    case 'sensor':
      return ['inspector'];
    case 'constructor':
    case 'host_tooling':
    case 'agent_runtime':
      return ['engineer'];
    case 'mesh_controller':
    case undefined:
      return ['engineer'];
  }
}

function targetKindsFor(name: string): readonly AuthorityTargetKind[] {
  if (name.startsWith('db ')) return ['db'];
  if (name.startsWith('worktree ')) return ['fs', 'git-ref'];
  if (name === 'task spawn') return ['fs', 'git-ref', 'db'];
  if (name === 'task complete') return ['fs', 'git-ref'];
  if (name === 'docs publish') return ['fs', 'git-ref', 'remote'];
  if (name === 'round archive') return ['fs', 'git-ref'];
  if (name === 'skill run') return ['fs', 'git-ref', 'remote'];
  if (name === 'loop run') return ['fs', 'git-ref', 'db', 'remote'];
  if (name === 'record run') return ['fs', 'remote'];
  if (name === 'verify translation') return ['fs', 'git-ref', 'db'];
  return ['fs'];
}

const EXACT_PLANNER_ACTIONS = new Set([
  'init apply-architect',
  'init apply-f5',
  'init apply-owner',
  'upgrade',
]);

/**
 * Actions whose complete target set is discovered by their runtime operation.
 * Enumeration is intentional: adding a mutator without classifying its planner
 * fails registry construction instead of inheriting an exactness claim.
 */
const BOUNDED_PLANNER_ACTIONS = new Set([
  'backlog add',
  'backlog compact',
  'backlog complete',
  'ci scaffold',
  'coverage aggregate',
  'db drop',
  'db provision',
  'db rebuild-template',
  'db start-shared',
  'db stop-shared',
  'decision close',
  'docs cli',
  'docs publish',
  'docs render-mermaid',
  'docs synthesize',
  'docs synthesize-all',
  'evidence chain-head',
  'evidence actions-verify',
  'evidence collect-local',
  'evidence emit',
  'evidence redact',
  'evidence verify',
  'evidence verify-local',
  'hooks install',
  'govern auditor-post-merge',
  'inv contracts',
  'inv suggest',
  'lock acquire',
  'lock reap',
  'lock release',
  'loop run',
  'mutation run',
  'mutation verify',
  'pack graduate-invariants',
  'phase close',
  'record run',
  'render matrix',
  'round declare',
  'round archive',
  'round scaffold',
  'rtd bundle',
  'release gate',
  'release list',
  'release postdeploy-verify',
  'release runtime-drift',
  'rgr emit',
  'rgr resolve',
  'sense api',
  'sense build',
  'sense coverage',
  'sense data-handling',
  'sense data-model',
  'sense decision-citation-resolution',
  'sense decision-record-integrity',
  'sense dep-graph',
  'sense docs-drift',
  'sense archive-immutability',
  'sense harness-coherence',
  'sense harness-coverage',
  'sense harness-depth',
  'sense harness-green-main',
  'sense harness-idiomaticity',
  'sense harness-invariant-alignment',
  'sense harness-performance',
  'sense harness-robustness',
  'sense harness-security',
  'sense inventory-adherence',
  'sense inventory-determinism',
  'sense inventory-performance',
  'sense judge',
  'sense lint',
  'sense migrate-check',
  'sense perf-test',
  'sense plant-coherence',
  'sense plant-coverage',
  'sense plant-depth',
  'sense rbac',
  'sense readings-record',
  'sense readings-rebuild',
  'sense routes',
  'sense round-record-integrity',
  'sense run',
  'sense runtime-api',
  'sense runtime-auth',
  'sense runtime-data',
  'sense security-scan',
  'sense spec-alignment',
  'sense spec-depth',
  'sense spec-freshness',
  'sense spec-idiomaticity',
  'sense spec-performance-targets',
  'sense spec-robustness-targets',
  'sense spec-security-coverage',
  'sense test',
  'sense test-coherence',
  'sense test-coverage-depth',
  'sense test-idiomaticity',
  'sense test-invariant-alignment',
  'sense test-performance-coverage',
  'sense test-robustness-coverage',
  'sense test-security-coverage',
  'sense test-weakening',
  'sense trace-resolve',
  'sense type-check',
  'skill run',
  'state prune',
  'task complete',
  'task escalate',
  'task pause-rgr',
  'task resume-rgr',
  'task spawn',
  'worktree adopt',
  'worktree create',
  'worktree destroy',
  'worktree reap',
  'work session start',
  'work session end',
  'verify translation',
]);

function boundedPlannerBounds(name: string): Readonly<{
  max_batches: number;
  max_targets_per_batch: number;
  max_total_targets: number;
}> {
  if (name === 'loop run' || name === 'skill run') {
    return { max_batches: 500, max_targets_per_batch: 100, max_total_targets: 500 };
  }
  if (name === 'state prune') {
    return { max_batches: 1000, max_targets_per_batch: 100, max_total_targets: 100_000 };
  }
  if (name === 'docs synthesize-all' || name === 'sense run') {
    return { max_batches: 256, max_targets_per_batch: 64, max_total_targets: 16_384 };
  }
  return { max_batches: 128, max_targets_per_batch: 64, max_total_targets: 8192 };
}

function authorityContractFor(
  name: string,
  authority: ActionAuthority | undefined,
  effect: ActionEffect,
): AuthorityActionContract {
  const capabilities = capabilitiesFor(name, effect);
  if (effect === 'read') {
    return {
      schemaVersion: '1.0.0',
      action_id: canonicalPath(name).join(' '),
      effect,
      capabilities,
      subject: { kind: 'none' },
      consent: { write: false, allow_publish: false, experimental: false },
      planner: { kind: 'none' },
      boundary: { kind: 'none' },
      readiness: { requires_binding: false, independent_acceptance_required: true },
    };
  }
  const targetKinds = targetKindsFor(name);
  if (EXACT_PLANNER_ACTIONS.has(name) === BOUNDED_PLANNER_ACTIONS.has(name)) {
    throw new Error(`${name}: mutation planner classification is missing or ambiguous`);
  }
  const planner = EXACT_PLANNER_ACTIONS.has(name)
    ? {
        kind: 'exact-plan' as const,
        planner_id: `${name.replaceAll(' ', '-')}-exact-plan`,
        target_kinds: targetKinds,
        atomicity: 'whole-plan' as const,
      }
    : {
        kind: 'bounded-batches' as const,
        planner_id: `${name.replaceAll(' ', '-')}-bounded-plan`,
        target_kinds: targetKinds,
        bounds: boundedPlannerBounds(name),
        recovery: 'preserve-and-report' as const,
      };
  return {
    schemaVersion: '1.0.0',
    action_id: canonicalPath(name).join(' '),
    effect,
    capabilities,
    subject:
      name === 'govern auditor-post-merge'
        ? {
            kind: 'derived-machine',
            actor: 'harness',
            transition: 'harness-write',
            initiator: 'none',
          }
        : name === 'verify translation'
          ? {
              kind: 'derived-machine',
              actor: 'harness',
              transition: 'harness-write',
              initiator: { allowed_roles: ['inspector'], preserve_in_context: true },
            }
          : name === 'loop run'
            ? {
                kind: 'derived-machine',
                actor: 'harness',
                transition: 'harness-write',
                initiator: { allowed_roles: ['engineer'], preserve_in_context: true },
              }
            : effect === 'harness-write'
              ? {
                  kind: 'derived-machine',
                  actor: 'harness',
                  transition: 'harness-write',
                  initiator: {
                    allowed_roles: allowedRolesFor(name, authority, effect),
                    preserve_in_context: true,
                  },
                }
              : name === 'upgrade' || name === 'init apply-f5'
                ? {
                    kind: 'derived-machine',
                    actor: 'upgrade',
                    transition: 'upgrade',
                    initiator: { allowed_roles: ['architect'], preserve_in_context: true },
                  }
                : name === 'docs publish'
                  ? {
                      kind: 'derived-machine',
                      actor: 'release',
                      transition: 'release',
                      initiator: { allowed_roles: ['architect'], preserve_in_context: true },
                    }
                  : { kind: 'human', allowed_roles: allowedRolesFor(name, authority, effect) },
    consent: {
      write: true,
      allow_publish: effect === 'remote-write',
      experimental: name === 'loop run',
    },
    planner,
    boundary: {
      kind: 'mutation-adapters',
      adapter_ids: targetKinds.map((kind) => `${kind}-authority-boundary`),
      final_reverification: true,
    },
    readiness: { requires_binding: true, independent_acceptance_required: true },
  };
}

export function metadataFor(
  name: string,
  authority: ActionAuthority | undefined,
  declaredLifecycle?: ActionLifecycle,
  declaredReason?: string,
  declaredPromotion?: readonly string[],
): CommandMetadata {
  const path = canonicalPath(name);
  const lifecycle = declaredLifecycle ?? 'supported';
  const effects = effectsFor(name);
  const authorityContract = authorityContractFor(name, authority, effects);
  return {
    path,
    lifecycle,
    lifecycle_reason:
      declaredReason ??
      (lifecycle === 'supported'
        ? `Supported ${authority ?? 'DEVAI'} action in the 0.5 command contract.`
        : 'Lifecycle classification declared by the action owner.'),
    promotion_criteria: declaredPromotion ?? [],
    visibility: lifecycle === 'experimental' ? 'advanced' : visibilityFor(path),
    tier: tierFor(path),
    profiles: ALL_PROFILES,
    effects,
    authority_contract_version: '1.0.0',
    authority_contract: authorityContract,
  };
}
