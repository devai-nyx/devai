// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R-0007 B6 enumeration/parity acceptance: generated reference markers must be
// an exact ordered projection of every canonical IA population and migration row.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const DOCS_ROOT = join(ROOT, 'docs/reference/cli');
const RENDERER = join(DOCS_ROOT, 'render-generated-reference.mjs');

type JsonObject = Record<string, unknown>;

interface ArchitectureCategory {
  readonly category_id: string;
  readonly page_id: string;
  readonly canonical_source: string;
  readonly population_contract: string;
  readonly ordering: string;
  readonly rendering: string;
}

interface ArchitecturePage {
  readonly page_id: string;
  readonly planned_path: string;
  readonly category_ids: readonly string[];
}

interface GeneratedEntry {
  readonly id: string;
  readonly body: string;
}

const SEMANTIC_LABELS = {
  stable_id: 'Stable ID',
  user_facing_label: 'User-facing label',
  plain_language_purpose: 'Purpose',
  population_or_projection: 'Population or projection',
  prerequisites: 'Prerequisites',
  required_external_tools: 'Required external tools',
  accepted_inputs: 'Accepted inputs',
  defaults: 'Defaults',
  output_contract: 'Output contract',
  verdict_semantics: 'Verdict semantics',
  declared_effect: 'Declared effect',
  consent_flags: 'Consent flags',
  cost_class: 'Cost class',
  when_to_use: 'When to use',
  when_not_to_use: 'When not to use',
  failure_unknown_review_skipped_na_semantics: 'Non-pass semantics',
  new_grammar_example: 'New-grammar example',
  canonical_source_link: 'Canonical source',
  related_workflow: 'Related workflow',
} as const;

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

function objects(value: unknown, diagnostic: string): readonly JsonObject[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => item === null || typeof item !== 'object' || Array.isArray(item))
  ) {
    throw new Error(`${diagnostic}: expected object array`);
  }
  return value as readonly JsonObject[];
}

function strings(value: unknown, diagnostic: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${diagnostic}: expected string array`);
  }
  return value as readonly string[];
}

function names(value: unknown, diagnostic: string): readonly string[] {
  return objects(value, diagnostic).map((entry, index) => {
    const name = entry['name'];
    if (typeof name !== 'string') throw new Error(`${diagnostic}:${String(index)}`);
    return name;
  });
}

function utf8(values: readonly string[]): readonly string[] {
  return [...values].sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
}

function schemaEnums(): {
  readonly roles: readonly string[];
  readonly effects: readonly string[];
  readonly lifecycles: readonly string[];
  readonly tiers: readonly string[];
} {
  const schema = json('law/schemas/action-registry.schema.json');
  const defs = object(schema['$defs'], 'R7-B6-ACTION-SCHEMA-DEFS');
  const authority = object(defs['authorityContract'], 'R7-B6-AUTHORITY-CONTRACT');
  const authorityProperties = object(authority['properties'], 'R7-B6-AUTHORITY-PROPERTIES');
  const subject = object(authorityProperties['subject'], 'R7-B6-AUTHORITY-SUBJECT');
  const human = objects(subject['oneOf'], 'R7-B6-AUTHORITY-SUBJECT-BRANCHES')[1];
  if (human === undefined) throw new Error('R7-B6-AUTHORITY-HUMAN-BRANCH-MISSING');
  const humanProperties = object(human['properties'], 'R7-B6-AUTHORITY-HUMAN-PROPERTIES');
  const allowedRoles = object(humanProperties['allowed_roles'], 'R7-B6-ALLOWED-ROLES');
  const roleItems = object(allowedRoles['items'], 'R7-B6-ROLE-ITEMS');
  const entries = object(
    object(schema['properties'], 'R7-B6-ACTION-PROPERTIES')['entries'],
    'R7-B6-ACTION-ENTRIES',
  );
  const entryItems = object(entries['items'], 'R7-B6-ACTION-ENTRY-ITEMS');
  const entryProperties = object(entryItems['properties'], 'R7-B6-ACTION-ENTRY-PROPERTIES');
  return {
    roles: strings(roleItems['enum'], 'R7-B6-ROLE-ENUM'),
    effects: strings(
      object(entryProperties['effect'], 'R7-B6-EFFECT')['enum'],
      'R7-B6-EFFECT-ENUM',
    ),
    lifecycles: strings(
      object(entryProperties['lifecycle'], 'R7-B6-LIFECYCLE')['enum'],
      'R7-B6-LIFECYCLE-ENUM',
    ),
    tiers: strings(object(entryProperties['tier'], 'R7-B6-TIER')['enum'], 'R7-B6-TIER-ENUM'),
  };
}

function taskSchemaPopulation(): {
  readonly executorKinds: readonly string[];
  readonly selectionModes: readonly string[];
} {
  const schema = json('law/schemas/task.schema.json');
  const defs = object(schema['$defs'], 'R7-B6-TASK-DEFS');
  const executor = object(
    object(schema['properties'], 'R7-B6-TASK-PROPERTIES')['executor'],
    'R7-B6-EXECUTOR',
  );
  const executorKinds = objects(executor['oneOf'], 'R7-B6-EXECUTOR-BRANCHES').map(
    (branch, index) => {
      const definition =
        typeof branch['$ref'] === 'string'
          ? object(
              defs[branch['$ref'].split('/').at(-1) ?? ''],
              `R7-B6-EXECUTOR-REF:${String(index)}`,
            )
          : branch;
      const properties = object(
        definition['properties'],
        `R7-B6-EXECUTOR-PROPERTIES:${String(index)}`,
      );
      const kind = object(properties['kind'], `R7-B6-EXECUTOR-KIND:${String(index)}`)['const'];
      if (typeof kind !== 'string') throw new Error(`R7-B6-EXECUTOR-KIND:${String(index)}`);
      return kind;
    },
  );
  const selection = object(defs['agentSelection'], 'R7-B6-AGENT-SELECTION');
  const selectionProperties = object(selection['properties'], 'R7-B6-AGENT-SELECTION-PROPERTIES');
  return {
    executorKinds,
    selectionModes: strings(
      object(selectionProperties['mode'], 'R7-B6-AGENT-SELECTION-MODE')['enum'],
      'R7-B6-AGENT-SELECTION-MODE-ENUM',
    ),
  };
}

function canonicalPopulation(categoryId: string): readonly string[] {
  const round = json('law/policy/round-execution.json');
  const vocabularies = object(round['vocabularies'], 'R7-B6-ROUND-VOCABULARIES');
  const modelRuntime = json('law/policy/model-runtime-registry.json');
  const schema = schemaEnums();
  const task = taskSchemaPopulation();
  switch (categoryId) {
    case 'check-suites':
      return names(json('law/policy/check-suites.json')['suites'], 'R7-B6-CHECK-SUITES');
    case 'sense-presets':
      return names(json('law/policy/sense-presets.json')['presets'], 'R7-B6-SENSE-PRESETS');
    case 'inventory-slices':
      return names(vocabularies['inventory_slices'], 'R7-B6-INVENTORY-SLICES');
    case 'adoption-tiers':
      return names(vocabularies['adoption_tiers'], 'R7-B6-ADOPTION-TIERS');
    case 'executor-kinds':
      return task.executorKinds;
    case 'agent-selection-modes':
      return task.selectionModes;
    case 'roles':
      return schema.roles;
    case 'effects':
      return schema.effects;
    case 'verdicts':
      return strings(vocabularies['verdicts'], 'R7-B6-VERDICTS');
    case 'action-lifecycles':
      return schema.lifecycles;
    case 'surface-tiers': {
      const tiers = names(vocabularies['surface_tiers'], 'R7-B6-SURFACE-TIERS');
      expect(schema.tiers, 'R7-B6-SURFACE-TIER-SCHEMA-PARITY').toEqual(tiers);
      return tiers;
    }
    case 'sensor-kinds':
      return objects(json('law/policy/sensor-registry.json')['entries'], 'R7-B6-SENSOR-KINDS').map(
        (entry, index) => {
          const kind = entry['kind'];
          if (typeof kind !== 'string') throw new Error(`R7-B6-SENSOR-KIND:${String(index)}`);
          return kind;
        },
      );
    case 'runtimes':
      return utf8(
        objects(modelRuntime['runtimes'], 'R7-B6-RUNTIMES').map((entry, index) => {
          const id = entry['id'];
          if (typeof id !== 'string') throw new Error(`R7-B6-RUNTIME:${String(index)}`);
          return id;
        }),
      );
    case 'rostered-models':
      return utf8(
        objects(modelRuntime['models'], 'R7-B6-MODELS').map((entry, index) => {
          const id = entry['id'];
          if (typeof id !== 'string') throw new Error(`R7-B6-MODEL:${String(index)}`);
          return id;
        }),
      );
    case 'supported-efforts':
      return utf8([
        ...new Set(
          objects(modelRuntime['models'], 'R7-B6-MODEL-EFFORTS').flatMap((entry) =>
            strings(entry['supported_efforts'], 'R7-B6-MODEL-EFFORTS'),
          ),
        ),
      ]);
    default:
      throw new Error(`R7-B6-CATEGORY-UNKNOWN:${categoryId}`);
  }
}

function vocabularyMigrationId(line: string): string {
  const plain = line.replaceAll('`', '').replace(/\s+/gu, ' ').trim();
  if (plain.startsWith('| check --profile ')) return 'vocabulary:check-profile';
  if (plain.startsWith('| sense --set ')) {
    const value = plain.slice('| sense --set '.length).split(/[ |]/u)[0];
    if (value === undefined || value.length === 0) {
      throw new Error('R7-B6-MIGRATION-VOCABULARY-VALUE-MISSING');
    }
    return `vocabulary:sense-set-${value}`;
  }
  if (plain.startsWith('| adoption --profile ')) return 'vocabulary:adoption-profile';
  if (plain.startsWith('| --allow-publish ')) return 'vocabulary:allow-publish';
  throw new Error(`R7-B6-MIGRATION-VOCABULARY-UNKNOWN:${line}`);
}

function migrationPopulation(): readonly string[] {
  const sections = read('work/rounds/R-0007/inventory/old-to-new-command-map.md').split(
    '## Global vocabulary and consent migration',
  );
  expect(sections, 'R7-B6-MIGRATION-SECTIONS').toHaveLength(2);
  const actionSource = sections[0] ?? '';
  const vocabularySource = sections[1] ?? '';
  const actionIds = [...actionSource.matchAll(/^\| `([^`]+)`\s*\|\s*(.*?)\s*\|$/gmu)].map(
    (match) => `action:${match[1] ?? ''}`,
  );
  const vocabularyIds = vocabularySource
    .split('\n')
    .filter((line) => /^\| .+`.+\|/u.test(line) && !/^\| [- ]+\|/u.test(line))
    .map(vocabularyMigrationId);
  expect(actionIds, 'R7-B6-MIGRATION-OPENING-POPULATION').toHaveLength(147);
  expect(vocabularyIds, 'R7-B6-MIGRATION-VOCABULARY-POPULATION').toHaveLength(9);
  const population = [...actionIds, ...vocabularyIds];
  expect(new Set(population).size, 'R7-B6-MIGRATION-SOURCE-DUPLICATE').toBe(population.length);
  return population;
}

function markerCount(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

function generatedEntries(source: string, categoryId: string): readonly GeneratedEntry[] {
  const start = `<!-- devai:generated-reference:start category="${categoryId}" -->`;
  const end = `<!-- devai:generated-reference:end category="${categoryId}" -->`;
  expect(markerCount(source, start), `${categoryId}: generated start marker count`).toBe(1);
  expect(markerCount(source, end), `${categoryId}: generated end marker count`).toBe(1);
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  expect(endIndex, `${categoryId}: end marker must follow start marker`).toBeGreaterThan(
    startIndex,
  );
  const region = source.slice(startIndex + start.length, endIndex);
  expect(
    region.match(/devai:generated-reference:(?:start|end)/gu) ?? [],
    `${categoryId}: nested generated regions are forbidden`,
  ).toEqual([]);
  const marker = new RegExp(
    `<!-- devai:generated-entry category="${categoryId}" id="([^"]+)" -->`,
    'gu',
  );
  const matches = [...region.matchAll(marker)];
  return matches.map((match, index) => {
    const id = match[1];
    if (id === undefined) throw new Error(`R7-B6-GENERATED-ID-MISSING:${categoryId}`);
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? region.length;
    return { id, body: region.slice(bodyStart, bodyEnd) };
  });
}

function generatedField(entry: GeneratedEntry, label: string): string {
  const prefix = `- **${label}:** `;
  const lines = entry.body.split('\n').filter((line) => line.startsWith(prefix));
  expect(lines, `${entry.id}: ${label} must occur exactly once`).toHaveLength(1);
  const value = lines[0]?.slice(prefix.length).trim() ?? '';
  expect(value.length, `${entry.id}: ${label} must be nonempty`).toBeGreaterThan(0);
  return value;
}

function architecture(): {
  readonly source: JsonObject;
  readonly categories: readonly ArchitectureCategory[];
  readonly pages: readonly ArchitecturePage[];
} {
  const source = json('law/policy/documentation-information-architecture.json');
  return {
    source,
    categories: objects(
      source['categories'],
      'R7-B6-IA-CATEGORIES',
    ) as unknown as readonly ArchitectureCategory[],
    pages: objects(source['pages'], 'R7-B6-IA-PAGES') as unknown as readonly ArchitecturePage[],
  };
}

function referenceSnapshot(): Readonly<Record<string, string>> {
  return Object.fromEntries(
    readdirSync(DOCS_ROOT)
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => [
        name,
        createHash('sha256')
          .update(readFileSync(join(DOCS_ROOT, name)))
          .digest('hex'),
      ]),
  );
}

function allReferenceMarkdown(): string {
  return readdirSync(DOCS_ROOT)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => readFileSync(join(DOCS_ROOT, name), 'utf8'))
    .join('\n');
}

function allGeneratedIds(source: string, categoryId: string): readonly string[] {
  const marker = new RegExp(
    `<!-- devai:generated-entry category="${categoryId}" id="([^"]+)" -->`,
    'gu',
  );
  return [...source.matchAll(marker)].map((match) => match[1] ?? '');
}

describe('R-0007 B6 canonical reference enumeration parity', () => {
  it('R7-B6-ENUMERATION-PARITY-001 bijects all 15 IA categories and migration exactly once', () => {
    const { categories, pages } = architecture();
    expect(categories, 'R7-B6-IA-CATEGORY-COUNT').toHaveLength(15);
    expect(new Set(categories.map((category) => category.category_id)).size).toBe(15);
    const pageById = new Map(pages.map((page) => [page.page_id, page]));
    const routedCategories = pages.flatMap((page) => page.category_ids);
    expect([...routedCategories].sort(), 'R7-B6-IA-PAGE-ROUTING').toEqual(
      categories.map((category) => category.category_id).sort(),
    );
    expect(new Set(routedCategories).size, 'R7-B6-IA-PAGE-ROUTING-DUPLICATE').toBe(
      routedCategories.length,
    );
    const allMarkdown = allReferenceMarkdown();

    for (const category of categories) {
      expect(category.population_contract, `${category.category_id}: population contract`).toBe(
        'source-derived-exact-ordered-bijection-no-copied-list',
      );
      expect(category.rendering, `${category.category_id}: rendering`).toBe('generated-reference');
      expect(read(category.canonical_source).length).toBeGreaterThan(0);
      const page = pageById.get(category.page_id);
      if (page === undefined) throw new Error(`R7-B6-IA-PAGE-MISSING:${category.page_id}`);
      const source = read(page.planned_path);
      const entries = generatedEntries(source, category.category_id);
      const expected = canonicalPopulation(category.category_id);
      const start = `<!-- devai:generated-reference:start category="${category.category_id}" -->`;
      const end = `<!-- devai:generated-reference:end category="${category.category_id}" -->`;
      expect(markerCount(allMarkdown, start), `${category.category_id}: global start marker`).toBe(
        1,
      );
      expect(markerCount(allMarkdown, end), `${category.category_id}: global end marker`).toBe(1);
      expect(
        allGeneratedIds(allMarkdown, category.category_id),
        `${category.category_id}: generated entries must exist only in the routed page`,
      ).toEqual(expected);
      expect(
        entries.map((entry) => entry.id),
        `${category.category_id}: documented/source order, missing, extra, or duplicate drift`,
      ).toEqual(expected);
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    }

    const migrationPage = pageById.get('migration');
    if (migrationPage === undefined) throw new Error('R7-B6-MIGRATION-PAGE-MISSING');
    const migration = generatedEntries(read(migrationPage.planned_path), 'migration');
    const migrationExpected = migrationPopulation();
    expect(
      markerCount(allMarkdown, '<!-- devai:generated-reference:start category="migration" -->'),
      'migration: global start marker',
    ).toBe(1);
    expect(
      markerCount(allMarkdown, '<!-- devai:generated-reference:end category="migration" -->'),
      'migration: global end marker',
    ).toBe(1);
    expect(
      allGeneratedIds(allMarkdown, 'migration'),
      'migration: generated entries must exist only in the routed page',
    ).toEqual(migrationExpected);
    expect(
      migration.map((entry) => entry.id),
      'migration: every source row must be documented once in source order',
    ).toEqual(migrationExpected);
    expect(new Set(migration.map((entry) => entry.id)).size).toBe(migration.length);
  });

  it('R7-B6-ENUMERATION-PARITY-002 gives every generated entry the complete semantic field contract', () => {
    const { source, categories, pages } = architecture();
    expect(Object.keys(SEMANTIC_LABELS), 'R7-B6-SEMANTIC-FIELD-CENSUS').toEqual(
      strings(source['semantic_fields'], 'R7-B6-SEMANTIC-FIELDS'),
    );
    const pageById = new Map(pages.map((page) => [page.page_id, page]));
    const routes = [
      ...categories.map((category) => ({ id: category.category_id, pageId: category.page_id })),
      { id: 'migration', pageId: 'migration' },
    ];
    for (const route of routes) {
      const page = pageById.get(route.pageId);
      if (page === undefined) throw new Error(`R7-B6-SEMANTIC-PAGE-MISSING:${route.pageId}`);
      for (const entry of generatedEntries(read(page.planned_path), route.id)) {
        for (const label of Object.values(SEMANTIC_LABELS)) generatedField(entry, label);
        expect(generatedField(entry, 'Stable ID'), `${entry.id}: marker/field identity`).toBe(
          entry.id,
        );
        expect(entry.body, `${entry.id}: heading identity`).toContain(`### \`${entry.id}\``);
        expect(
          generatedField(entry, 'New-grammar example'),
          `${entry.id}: executable grammar`,
        ).toContain('devai ');
        expect(generatedField(entry, 'Canonical source'), `${entry.id}: source link`).toMatch(
          /\[[^\]]+\]\([^)]+\)/u,
        );
      }
    }
  });

  it('R7-B6-ENUMERATION-PARITY-003 checks deterministic generated bytes twice without writes', () => {
    const before = referenceSnapshot();
    const first = spawnSync(process.execPath, [RENDERER, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(first.error).toBeUndefined();
    expect(first.status, `${first.stderr}\n${first.stdout}`).toBe(0);
    expect(referenceSnapshot(), 'R7-B6-GENERATED-CHECK-WROTE-BYTES').toEqual(before);

    const second = spawnSync(process.execPath, [RENDERER, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(second.error).toBeUndefined();
    expect(second.status, `${second.stderr}\n${second.stdout}`).toBe(0);
    expect(second.stdout, 'R7-B6-GENERATED-CHECK-NONDETERMINISTIC-OUTPUT').toBe(first.stdout);
    expect(second.stderr, 'R7-B6-GENERATED-CHECK-NONDETERMINISTIC-DIAGNOSTIC').toBe(first.stderr);
    expect(referenceSnapshot(), 'R7-B6-GENERATED-SECOND-CHECK-WROTE-BYTES').toEqual(before);
  });
});
