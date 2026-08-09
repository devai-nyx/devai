// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-020
// R-0007 B4 Inspector acceptance: the exact bound migration denominator must
// agree across the active registry, active ADR/map, and the acceptance prompt.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

interface RegistryEntry {
  readonly action_id: string;
  readonly disposition: 'keep' | 'fold' | 'tombstone';
}

interface Registry {
  readonly counts: Readonly<Record<RegistryEntry['disposition'], number>>;
  readonly entries: readonly RegistryEntry[];
}

function migrationRows(): readonly string[] {
  const commandSection = readFileSync(
    resolve(ROOT, 'work/rounds/R-0007/inventory/old-to-new-command-map.md'),
    'utf8',
  ).split('## Global vocabulary and consent migration')[0];
  if (commandSection === undefined) throw new Error('R7_B4_MIGRATION_COMMAND_SECTION_MISSING');
  return [...commandSection.matchAll(/^\| `([^`]+)`\s+\|/gmu)].map((match) => match[1] ?? '');
}

function fourCounts(source: string, pattern: RegExp, label: string) {
  const match = source.match(pattern);
  if (match === null) throw new Error(`${label}_COUNT_DECLARATION_MISSING`);
  return {
    keep: Number(match[1]),
    fold: Number(match[2]),
    tombstone: Number(match[3]),
    total: Number(match[4]),
  };
}

describe('R-0007 B4 population migration registry denominator', () => {
  it('R7-B4-POPULATION-MIGRATION-001 proves exact bound fixture count agreement', () => {
    const registry = JSON.parse(
      readFileSync(resolve(ROOT, 'law/policy/action-registry.json'), 'utf8'),
    ) as Registry;
    const activeRegistry = {
      keep: registry.entries.filter((entry) => entry.disposition === 'keep').length,
      fold: registry.entries.filter((entry) => entry.disposition === 'fold').length,
      tombstone: registry.entries.filter((entry) => entry.disposition === 'tombstone').length,
      total: registry.entries.length,
    };
    const activeAdr = fourCounts(
      readFileSync(resolve(ROOT, 'law/adr/ADR-021-r0007-cli-contract.md'), 'utf8'),
      /exactly (\d+) runnable actions, (\d+) folds, and (\d+) tombstones\s+across (\d+) never-reminted identities/u,
      'R7_B4_ACTIVE_ADR',
    );
    const activeMap = fourCounts(
      readFileSync(resolve(ROOT, 'work/rounds/R-0007/inventory/old-to-new-command-map.md'), 'utf8'),
      /produces (\d+)\s+runnable workflow actions, (\d+) folded historical identities, and (\d+) tombstones across\s+(\d+) never-reminted identities/u,
      'R7_B4_ACTIVE_MAP',
    );
    const acceptancePrompt = fourCounts(
      readFileSync(resolve(ROOT, 'work/rounds/R-0007/prompts/06-inspector-acceptance.md'), 'utf8'),
      /exact (\d+)\/(\d+)\/(\d+)\/(\d+) registry counts/u,
      'R7_B4_ACCEPTANCE_PROMPT',
    );

    expect(migrationRows()).toHaveLength(147);
    expect(new Set(migrationRows()).size).toBe(147);
    expect(registry.counts).toEqual({
      keep: activeRegistry.keep,
      fold: activeRegistry.fold,
      tombstone: activeRegistry.tombstone,
    });
    expect(activeAdr).toEqual(activeRegistry);
    expect(activeMap).toEqual(activeRegistry);
    expect(acceptancePrompt).toEqual(activeRegistry);
  });
});
