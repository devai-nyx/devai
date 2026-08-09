// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R-0007 B6 enumeration/parity acceptance: generated descriptor details must
// agree with the executable suite, preset, sensor, and inventory populations.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveCheckPlan } from '../../packages/cli/src/commands/check/contracts.js';
import { resolveSenseSelection } from '../../packages/cli/src/commands/sense/facade.js';
import { executeInventorySlice } from '../../packages/cli/src/commands/sense/inventory.js';
import {
  INVENTORY_SLICES,
  SENSOR_DESCRIPTORS,
  SENSOR_REGISTRY,
  SENSE_PRESET_POLICY,
} from '../../packages/sensors/src/index.js';

const ROOT = resolve(import.meta.dirname, '../..');
type JsonObject = Record<string, unknown>;

interface GeneratedEntry {
  readonly id: string;
  readonly body: string;
}

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function json(relativePath: string): JsonObject {
  return JSON.parse(read(relativePath)) as JsonObject;
}

function object(value: unknown, diagnostic: string): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${diagnostic}: expected object`);
  }
  return value as JsonObject;
}

function generatedEntries(relativePath: string, categoryId: string): readonly GeneratedEntry[] {
  const source = read(relativePath);
  const start = `<!-- devai:generated-reference:start category="${categoryId}" -->`;
  const end = `<!-- devai:generated-reference:end category="${categoryId}" -->`;
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex) {
    throw new Error(`R7-B6-RUNTIME-MARKERS-INVALID:${categoryId}`);
  }
  const region = source.slice(startIndex + start.length, endIndex);
  const marker = new RegExp(
    `<!-- devai:generated-entry category="${categoryId}" id="([^"]+)" -->`,
    'gu',
  );
  const matches = [...region.matchAll(marker)];
  return matches.map((match, index) => ({
    id: match[1] ?? '',
    body: region.slice(
      (match.index ?? 0) + match[0].length,
      matches[index + 1]?.index ?? region.length,
    ),
  }));
}

function field(entry: GeneratedEntry, label: string): string {
  const prefix = `- **${label}:** `;
  const matches = entry.body.split('\n').filter((line) => line.startsWith(prefix));
  expect(matches, `${entry.id}: ${label} cardinality`).toHaveLength(1);
  return matches[0]?.slice(prefix.length).trim() ?? '';
}

function codeValues(value: string): readonly string[] {
  return [...value.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? '');
}

function splitPopulation(value: string): {
  readonly members: readonly string[];
  readonly excluded: readonly string[];
} {
  const [membersSource, excludedSource] = value.split('. Excluded:');
  if (membersSource === undefined || excludedSource === undefined) {
    throw new Error(`R7-B6-POPULATION-FIELD-INVALID:${value}`);
  }
  return { members: codeValues(membersSource), excluded: codeValues(excludedSource) };
}

function codeList(values: readonly string[]): string {
  return values.length === 0
    ? 'Not applicable: the canonical source declares no values'
    : values.map((value) => `\`${value}\``).join(', ');
}

describe('R-0007 B6 runtime/reference enumeration parity', () => {
  it('R7-B6-ENUMERATION-PARITY-004 preserves suite and preset membership plus runtime order', () => {
    const suiteEntries = generatedEntries('docs/reference/cli/check-suites.md', 'check-suites');
    for (const entry of suiteEntries) {
      const runtime = resolveCheckPlan(ROOT, { suite: entry.id });
      const documented = splitPopulation(field(entry, 'Population or projection'));
      expect(documented.members, `${entry.id}: suite documentation/runtime order`).toEqual(
        runtime.members.map((member) => member.id),
      );
      expect(documented.excluded, `${entry.id}: suite exclusions`).toEqual([]);
    }

    const presetEntries = generatedEntries('docs/reference/cli/sense-presets.md', 'sense-presets');
    for (const entry of presetEntries) {
      const runtime = resolveSenseSelection(
        { preset: entry.id },
        entry.id === 'sweep' ? { roundId: 'R-0007' } : {},
      );
      const documented = splitPopulation(field(entry, 'Population or projection'));
      expect(documented.members, `${entry.id}: preset documentation/runtime order`).toEqual(
        runtime.executed,
      );
      expect(documented.excluded, `${entry.id}: preset documented exclusions`).toEqual(
        runtime.excluded.map((excluded) => excluded.kind),
      );
      expect(field(entry, 'Defaults'), `${entry.id}: persistence boundary`).toContain(
        'persistence is forbidden',
      );
    }
  });

  it('R7-B6-ENUMERATION-PARITY-005 reports every runtime sensor prerequisite, standing, preset, and effect', () => {
    const entries = generatedEntries('docs/reference/cli/sensor-kinds.md', 'sensor-kinds');
    expect(entries.map((entry) => entry.id)).toEqual(
      SENSOR_REGISTRY.entries.map((entry) => entry.kind),
    );
    expect(SENSOR_DESCRIPTORS.map((descriptor) => descriptor.kind)).toEqual(
      SENSOR_REGISTRY.entries.map((entry) => entry.kind),
    );

    for (const source of SENSOR_REGISTRY.entries) {
      const entry = entries.find((candidate) => candidate.id === source.kind);
      const runtime = SENSOR_DESCRIPTORS.find((candidate) => candidate.kind === source.kind);
      if (entry === undefined || runtime === undefined) {
        throw new Error(`R7-B6-SENSOR-DESCRIPTOR-MISSING:${source.kind}`);
      }
      expect(existsSync(join(ROOT, source.emitter_module)), `${source.kind}: emitter exists`).toBe(
        true,
      );
      expect(runtime).toMatchObject({
        kind: source.kind,
        emitterModule: source.emitter_module,
        effect: source.effect,
        cells: source.cells ?? [],
        diagnostic: source.diagnostic === true,
      });
      const hasCells = (source.cells?.length ?? 0) > 0;
      expect(
        hasCells !== (source.diagnostic === true),
        `${source.kind}: exactly one scorecard or diagnostic standing`,
      ).toBe(true);

      const purpose = field(entry, 'Purpose');
      expect(purpose, `${source.kind}: runtime emitter`).toContain(`\`${source.emitter_module}\``);
      const population = field(entry, 'Population or projection');
      expect(population, `${source.kind}: emitter projection`).toContain(
        `Emitter \`${source.emitter_module}\``,
      );
      const standing =
        source.diagnostic === true
          ? 'standing diagnostic-only'
          : `standing scorecard cells ${codeList(
              (source.cells ?? []).map((cell) => `${cell.substrate}×${cell.property}`),
            )}`;
      expect(population, `${source.kind}: scorecard/diagnostic standing`).toContain(standing);
      const memberships = SENSE_PRESET_POLICY.presets
        .filter((preset) => preset.members.includes(source.kind))
        .map((preset) => preset.name);
      expect(population, `${source.kind}: preset membership`).toContain(
        `preset membership ${codeList(memberships)}`,
      );

      const prerequisites = field(entry, 'Prerequisites');
      for (const path of source.effect_basis?.source_paths ?? []) {
        expect(prerequisites, `${source.kind}: prerequisite source ${path}`).toContain(
          `\`${path}\``,
        );
      }
      for (const capability of source.effect_basis?.capabilities ?? []) {
        expect(prerequisites, `${source.kind}: prerequisite capability ${capability}`).toContain(
          `\`${capability}\``,
        );
        expect(
          field(entry, 'Required external tools'),
          `${source.kind}: external-tool capability ${capability}`,
        ).toContain(`\`${capability}\``);
      }
      if ((source.effect_basis?.capabilities.length ?? 0) === 0) {
        expect(prerequisites, `${source.kind}: explicit no-capability prerequisite`).toContain(
          'No additional capability is declared by the registry',
        );
      }
      expect(field(entry, 'Declared effect'), `${source.kind}: effect`).toMatch(
        new RegExp('^`' + source.effect + '`'),
      );
      if (source.effect_basis?.rationale !== undefined) {
        expect(field(entry, 'Declared effect'), `${source.kind}: effect rationale`).toContain(
          source.effect_basis.rationale,
        );
      }
    }
  });

  it('R7-B6-ENUMERATION-PARITY-006 executes the complete inventory-member implementation population', async () => {
    const policy = object(
      json('law/policy/round-execution.json')['vocabularies'],
      'R7-B6-VOCABULARIES',
    );
    const policySlices = policy['inventory_slices'] as ReadonlyArray<{
      readonly name: string;
      readonly members: readonly string[];
    }>;
    expect(INVENTORY_SLICES).toEqual(policySlices);
    const expectedMembers = [...new Set(policySlices.flatMap((slice) => slice.members))];
    const implementation = read('packages/cli/src/commands/sense/inventory.ts');
    const implementedMembers = [...implementation.matchAll(/^\s+case '([^']+)': \{$/gmu)].map(
      (match) => match[1] ?? '',
    );
    expect(implementedMembers, 'R7-B6-INVENTORY-IMPLEMENTATION-POPULATION').toEqual(
      expectedMembers,
    );
    expect(implementation, 'R7-B6-INVENTORY-UNSUPPORTED-DIAGNOSTIC').toContain(
      'SENSE_INVENTORY_MEMBER_UNIMPLEMENTED:${member}',
    );

    const all = await executeInventorySlice('all', {
      repoRoot: ROOT,
      adopterRoot: ROOT,
      trace: 'law/trace.json',
      coverage: 'scratch/r0007-b6-enumeration-parity-absent-coverage.json',
    });
    expect(all.members, 'R7-B6-INVENTORY-ALL-RUNTIME-MEMBERS').toEqual(expectedMembers);
    expect(
      all.results.map((result) => result.member),
      'R7-B6-INVENTORY-RUNTIME-RESULTS',
    ).toEqual(expectedMembers);

    const documented = generatedEntries(
      'docs/reference/cli/inventory-slices.md',
      'inventory-slices',
    );
    for (const slice of policySlices) {
      const entry = documented.find((candidate) => candidate.id === slice.name);
      if (entry === undefined) throw new Error(`R7-B6-INVENTORY-DOC-MISSING:${slice.name}`);
      expect(
        codeValues(field(entry, 'Population or projection')).slice(0, slice.members.length),
        `${slice.name}: inventory contents`,
      ).toEqual(slice.members);
      expect(field(entry, 'Output contract'), `${slice.name}: output body`).toContain(
        '{slice, members, status, results, implicit_persistence:false}',
      );
      expect(field(entry, 'When not to use').length, `${slice.name}: limitations`).toBeGreaterThan(
        20,
      );
    }
  });
});
