// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// Inspector executable: retired mocked producers must be unreachable behind the router.
import { describe, expect, it, vi } from 'vitest';
import { validators } from '../../packages/schemas/src/index.js';
import { routeArgv } from '../../packages/cli/src/command-router.js';
import type { RegistryEntry } from '../../packages/cli/src/define-command.js';
import { ACTION_REGISTRY } from '../../packages/cli/src/generated/action-registry.js';
import { resolveCliVersion } from '../../packages/cli/src/version.js';

interface RetiredProducerFixture {
  readonly id: string;
  readonly args: readonly string[];
  readonly migration: string;
}

const RETIRED_PRODUCERS: readonly RetiredProducerFixture[] = [
  {
    id: 'docs synthesize',
    args: ['docs', 'synthesize', 'overview'],
    migration: 'round plan --documents <id>',
  },
  {
    id: 'docs synthesize all',
    args: ['docs', 'synthesize', 'all'],
    migration: 'round plan --documents all',
  },
  {
    id: 'agent skill run',
    args: ['agent', 'skill', 'run', 'SKILL-round-execute', '--strict-exit'],
    migration:
      'normally round run; hidden task start --round R-NNNN --task TASK-NNNN after the task declares an agent executor and registered skill ID',
  },
] as const;

function runtimeEntry(entry: (typeof ACTION_REGISTRY)[number]): RegistryEntry {
  return {
    name: entry.action_id,
    previous_name: entry.internal_binding,
    internal_name: entry.internal_binding.replaceAll(' ', '-'),
    path: entry.path,
    disposition: entry.disposition,
    migration: entry.migration,
    lifecycle: entry.lifecycle,
    lifecycle_reason: entry.lifecycle_reason,
    promotion_criteria: entry.promotion_criteria,
    visibility: entry.visibility,
    tier: entry.tier,
    profiles: entry.profiles,
    effects: entry.effect,
    authority: entry.authority ?? 'mesh_controller',
    description: entry.description,
    authority_contract_version: entry.authority_contract_version,
    authority_contract: entry.authority_contract,
    output_contract: entry.output_contract,
    error_contract: entry.error_contract,
  } as RegistryEntry;
}

function errorEnvelope(text: string): Record<string, unknown> {
  const value = JSON.parse(text) as Record<string, unknown>;
  expect(validators.error(value), JSON.stringify(validators.error.errors)).toBe(true);
  return value;
}

const registry = ACTION_REGISTRY.filter((entry) => entry.disposition === 'keep').map(runtimeEntry);
const version = resolveCliVersion();

describe('R-0006 mocked producers migrated to R-0007 router-only refusals', () => {
  it('keeps all three retired producers unregistered and refuses all nine output spellings', () => {
    expect(RETIRED_PRODUCERS).toHaveLength(3);
    expect(registry).toHaveLength(42);
    expect(
      RETIRED_PRODUCERS.filter((fixture) => registry.some((entry) => entry.name === fixture.id)),
    ).toEqual([]);

    const producer = vi.fn();
    let refusals = 0;
    for (const fixture of RETIRED_PRODUCERS) {
      const historical = ACTION_REGISTRY.filter((entry) => entry.action_id === fixture.id);
      expect(historical).toHaveLength(1);
      expect(historical[0]).toMatchObject({
        disposition: 'fold',
        lifecycle: 'retired',
        migration: fixture.migration,
        output_contract: { mode: 'router-only' },
        error_contract: { mode: 'router-only' },
      });

      for (const machine of [[], ['--json'], ['--format', 'json']] as const) {
        const route = routeArgv(['node', 'devai', ...fixture.args, ...machine], registry, version);
        if (route.kind === 'dispatch') producer(fixture.id);
        expect(route.kind).toBe('output');
        if (route.kind !== 'output') continue;
        expect(route.exitCode).toBe(2);
        if (machine.length === 0) {
          expect(route.text).toBe(
            `devai: Action '${fixture.id}' is retired. Remediation: ${fixture.migration}\n`,
          );
        } else {
          expect(errorEnvelope(route.text)).toMatchObject({
            code: 'ACTION_FOLDED',
            class: 'routing-authority',
            exit: 2,
            remediation: fixture.migration,
            context: {
              action: fixture.id,
              disposition: 'fold',
              migration: fixture.migration,
            },
          });
        }
        refusals += 1;
      }
    }

    expect(refusals).toBe(9);
    expect(producer).not.toHaveBeenCalled();
  });
});
