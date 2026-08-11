import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validators } from '../../src/index.js';

const ROOT = resolve(import.meta.dirname, '../../../..');

interface RegistryEntry {
  readonly action_id: string;
  readonly authority_contract: {
    subject: {
      kind: string;
      actor?: string;
      transition?: string;
    };
  };
}

interface ActionRegistry {
  readonly entries: RegistryEntry[];
}

const registry = JSON.parse(
  readFileSync(resolve(ROOT, 'law/policy/action-registry.json'), 'utf8'),
) as ActionRegistry;

describe('action registry schema', () => {
  it('accepts the current registry and rejects the removed upgrade machine identity', () => {
    expect(
      validators.actionRegistry(registry),
      JSON.stringify(validators.actionRegistry.errors),
    ).toBe(true);

    const removedIdentity = structuredClone(registry);
    const binding = removedIdentity.entries.find(
      (entry) => entry.authority_contract.subject.actor === 'binding',
    );
    expect(binding, 'current registry must contain a binding machine subject').toBeDefined();
    if (binding === undefined) return;

    binding.authority_contract.subject.actor = 'upgrade';
    binding.authority_contract.subject.transition = 'upgrade';

    expect(validators.actionRegistry(removedIdentity)).toBe(false);
  });
});
