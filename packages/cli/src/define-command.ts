import type { CAC } from 'cac';
import {
  metadataFor,
  registryActionFor,
  type AuthorityActionContract,
  type ActionEffect,
  type ActionLifecycle,
  type ActionTier,
  type ActionVisibility,
  type AdoptionProfile,
} from './command-manifest.js';

/**
 * Authority owner of a CLI action (Phase 11.G, absorbed from the
 * sibling-exploration draft's ActionAuthority taxonomy, D-39).
 * Used to filter the action catalog by owner.
 */
export type ActionAuthority =
  | 'mesh_controller'
  | 'specifier'
  | 'constructor'
  | 'sensor'
  | 'policy_firewall'
  | 'release_controller'
  | 'agent_runtime'
  | 'host_tooling';

export interface CommandSpec {
  readonly name: string;
  readonly previous_name: string;
  readonly path: readonly string[];
  readonly description: string;
  readonly authority: ActionAuthority;
  readonly lifecycle: ActionLifecycle;
  readonly lifecycle_reason: string;
  readonly promotion_criteria: readonly string[];
  readonly visibility: ActionVisibility;
  readonly tier: ActionTier;
  readonly profiles: readonly AdoptionProfile[];
  readonly effects: ActionEffect;
  readonly authority_contract_version: '1.0.0';
}

/**
 * Full definition for a CLI command. `extended_doc` is only used by the
 * `docs cli` generator to append rich sections to the noun page; it is
 * intentionally excluded from the public action catalog (CommandSpec) so
 * that the catalog schema remains stable.
 */
export interface CommandDefinition extends Omit<
  CommandSpec,
  | 'path'
  | 'previous_name'
  | 'authority'
  | 'lifecycle'
  | 'lifecycle_reason'
  | 'promotion_criteria'
  | 'visibility'
  | 'tier'
  | 'profiles'
  | 'effects'
  | 'authority_contract_version'
> {
  readonly authority?: ActionAuthority;
  readonly lifecycle?: ActionLifecycle;
  readonly lifecycle_reason?: string;
  readonly promotion_criteria?: readonly string[];
  /**
   * Optional extended documentation appended to the auto-generated noun page
   * in docs/reference/cli/<noun>.md. May contain Markdown sections for flags, examples,
   * config file descriptions, etc. Preserved verbatim (no wrapping).
   */
  readonly extended_doc?: string;
  register(cli: CAC): void;
}

/** Extended registry entry that carries extended_doc for the docs generator. */
export interface RegistryEntry extends CommandSpec {
  readonly internal_name: string;
  readonly disposition: 'keep' | 'fold' | 'tombstone';
  readonly migration: string | null;
  readonly authority_contract: AuthorityActionContract;
  runtime_args?: string;
  runtime_options?: readonly { readonly flags: string; readonly description: string }[];
  runtime_supports_human?: boolean;
  readonly extended_doc?: string;
}

const registry: RegistryEntry[] = [];

function publicRegistry(): RegistryEntry[] {
  return registry.filter((entry) => entry.disposition === 'keep');
}

function publicText(value: string): string {
  return value
    .replaceAll(process.cwd(), '<repo-root>')
    .replaceAll('--execute', '--write')
    .replaceAll('--apply', '--write')
    .replaceAll('--human', '--format human');
}

export function defineCommand(definition: CommandDefinition): CommandDefinition {
  const canonical = registryActionFor(definition.name);
  const metadata = metadataFor(
    definition.name,
    definition.authority,
    definition.lifecycle,
    definition.lifecycle_reason,
    definition.promotion_criteria,
  );
  const entry: RegistryEntry = {
    name: metadata.path.join(' '),
    previous_name: definition.name,
    internal_name: definition.name.replaceAll(' ', '-'),
    disposition: canonical.disposition,
    migration: canonical.migration,
    ...metadata,
    description: publicText(canonical.description),
    authority: canonical.authority ?? definition.authority ?? 'mesh_controller',
    ...(definition.extended_doc !== undefined && {
      extended_doc: publicText(definition.extended_doc),
    }),
  };
  registry.push(entry);
  return definition;
}

export function getActionsList(opts: { authority?: ActionAuthority } = {}): readonly CommandSpec[] {
  let all: RegistryEntry[] = publicRegistry();
  if (opts.authority !== undefined) all = all.filter((c) => c.authority === opts.authority);
  // Strip extended_doc: it is not part of the public CommandSpec surface and
  // the action catalog schema (action-catalog.schema.json) disallows it.
  return all.map(
    ({
      extended_doc: _omit,
      internal_name: _internal,
      runtime_args: _args,
      runtime_options: _options,
      runtime_supports_human: _human,
      authority_contract: _authorityContract,
      disposition: _disposition,
      migration: _migration,
      ...spec
    }) => spec,
  );
}

/**
 * Internal accessor used by `docs cli` to obtain the full registry including
 * extended_doc fields for doc generation. Not exported as part of the public
 * action catalog.
 */
export function getFullRegistry(): readonly RegistryEntry[] {
  return publicRegistry();
}

/** Mechanical W05.e surface guard over the post-collapse public catalog. */
export function validateActionSurface(entries: readonly RegistryEntry[]): void {
  const ACTION_FLOOR = 147;
  const ACTION_CEILING = 147;
  if (entries.length < ACTION_FLOOR || entries.length > ACTION_CEILING) {
    throw new Error(
      `ACTION_COUNT_GUARD: expected ${String(ACTION_FLOOR)}..${String(ACTION_CEILING)}, received ${String(entries.length)}`,
    );
  }
  const paths = entries.map((entry) => entry.path.join(' '));
  if (new Set(paths).size !== paths.length) {
    throw new Error('ACTION_PATH_DUPLICATE');
  }
  if (entries.some((entry) => entry.tier !== 'porcelain' && entry.tier !== 'plumbing')) {
    throw new Error('ACTION_TIER_MISSING');
  }
}

export function attachRuntimeContracts(
  commands: readonly {
    readonly name: string;
    readonly rawName: string;
    readonly options: readonly { readonly rawName: string; readonly description: string }[];
  }[],
): void {
  for (const entry of registry) {
    const command = commands.find((candidate) => candidate.name === entry.internal_name);
    if (command === undefined) throw new Error(`ACTION_HANDLER_MISSING: ${entry.name}`);
    entry.runtime_args = command.rawName.slice(command.name.length).trim();
    entry.runtime_supports_human = command.options.some((option) => option.rawName === '--human');
    const options = command.options
      .filter((option) => !['--human', '--execute', '--apply'].includes(option.rawName))
      // D-139 supersedes implicit observation persistence. Keep the old CAC
      // spelling as a harmless compatibility input, but do not advertise a
      // switch whose behavior is now the unconditional default.
      .filter((option) => option.rawName !== '--no-emit-reading')
      .filter(
        (option) =>
          entry.previous_name !== 'inv contracts' ||
          !['--regen', '--regen-config <path>'].includes(option.rawName),
      )
      .map((option) => ({
        flags: option.rawName,
        description: publicText(option.description),
      }));
    if (entry.effects !== 'read' && entry.name !== 'govern auditor post-merge') {
      options.push({
        flags: '--as-role <role>',
        description: 'Declare the initiating human role for this invocation.',
      });
      options.push({
        flags: '--authority-session <id>',
        description: 'Use a live repository-bound authority session instead of --as-role.',
      });
      options.push({ flags: '--write', description: 'Authorize local mutation.' });
    }
    if (entry.effects === 'remote-write') {
      options.push({
        flags: '--allow-publish',
        description: 'Authorize remote publication in addition to --write.',
      });
    }
    options.push({
      flags: '--format <format>',
      description: 'Output format when supported: json or human.',
    });
    entry.runtime_options = options;
  }
}
