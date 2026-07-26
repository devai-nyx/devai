import type { ActionAuthority } from './define-command.js';
import { ACTION_REGISTRY_BY_BINDING } from './generated/action-registry.js';

export type ActionLifecycle = 'supported' | 'experimental' | 'retired';
export type ActionTier = 'porcelain' | 'plumbing';
export type ActionVisibility = 'common' | 'standard' | 'advanced' | 'maintainer';
export type ActionEffect = 'read' | 'harness-write' | 'local-write' | 'remote-write';
export type ActionCapability =
  | 'fs:f5-config'
  | 'fs:f5-state'
  | 'fs:f4-inventory'
  | 'fs:proofs'
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

export interface RegistryActionRecord {
  readonly action_id: string;
  readonly internal_binding: string;
  readonly path: readonly string[];
  readonly disposition: 'keep' | 'fold' | 'tombstone';
  readonly lifecycle: ActionLifecycle;
  readonly lifecycle_reason: string;
  readonly migration: string | null;
  readonly never_remint: true;
  readonly visibility: ActionVisibility;
  readonly tier: ActionTier;
  readonly profiles: readonly AdoptionProfile[];
  readonly effect: ActionEffect;
  readonly authority: ActionAuthority | null;
  readonly description: string;
  readonly promotion_criteria: readonly string[];
  readonly authority_contract_version: '1.0.0';
  readonly authority_contract: AuthorityActionContract;
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
      ['fs:f5-state', 'fs:f4-inventory', 'fs:proofs', 'fs:worktree-admin'].includes(capability),
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

export function registryActionFor(name: string): RegistryActionRecord {
  const entry = ACTION_REGISTRY_BY_BINDING.get(name);
  if (entry === undefined) {
    throw new Error("action '" + name + "' is absent from law/policy/action-registry.json");
  }
  return entry;
}

export function metadataFor(
  name: string,
  authority: ActionAuthority | undefined,
  declaredLifecycle?: ActionLifecycle,
  _declaredReason?: string,
  _declaredPromotion?: readonly string[],
): CommandMetadata {
  const entry = registryActionFor(name);
  if (entry.disposition === 'keep') {
    if (entry.authority !== authority) {
      throw new Error("action '" + name + "' authority differs from the canonical registry");
    }
    if (declaredLifecycle !== undefined && entry.lifecycle !== declaredLifecycle) {
      throw new Error("action '" + name + "' lifecycle differs from the canonical registry");
    }
  }
  return {
    path: entry.path,
    lifecycle: entry.lifecycle,
    lifecycle_reason: entry.lifecycle_reason,
    promotion_criteria: entry.promotion_criteria,
    visibility: entry.visibility,
    tier: entry.tier,
    profiles: entry.profiles,
    effects: entry.effect,
    authority_contract_version: entry.authority_contract_version,
    authority_contract: entry.authority_contract,
  };
}
