// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R-0007 B1 Output/documentation-contract Inspector reds.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachActionOutputBoundaries } from '../../packages/cli/src/action-output.js';
import { aggregateSensorRunResults } from '../../packages/cli/src/commands/sense/run-set.js';
import type { RegistryEntry } from '../../packages/cli/src/define-command.js';
import { ACTION_REGISTRY } from '../../packages/cli/src/generated/action-registry.js';
import { validators } from '../../packages/schemas/src/index.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');
const ORIGINAL_ARGV = [...process.argv];

type JsonObject = Record<string, unknown>;

interface SourceAction {
  readonly action_id: string;
  readonly internal_binding: string;
  readonly path: readonly string[];
  readonly disposition: 'keep' | 'fold' | 'tombstone';
  readonly lifecycle: string;
  readonly lifecycle_reason: string;
  readonly promotion_criteria: readonly string[];
  readonly visibility: string;
  readonly tier: string;
  readonly profiles: readonly string[];
  readonly effect: string;
  readonly authority_contract_version: string;
  readonly description: string;
  readonly authority: string | null;
}

interface DocumentationCategoryResult {
  readonly canonical_source: string;
  readonly expected_ids: readonly string[];
  readonly documented_ids: readonly string[];
  readonly missing: readonly string[];
  readonly extra: readonly string[];
  readonly duplicates: readonly string[];
}

interface DocumentationCheckReport {
  readonly scope: string;
  readonly narrative_documentation_complete: boolean;
  readonly deploy_ready_site: boolean;
  readonly categories: Readonly<Record<string, DocumentationCategoryResult>>;
  readonly migration: DocumentationCategoryResult;
}

const FIXED_DOCUMENTATION_POPULATIONS = {
  'check-suites': ['quick', 'standard', 'full', 'release'],
  'sense-presets': ['baseline', 'structural', 'governed', 'sweep'],
  'inventory-slices': [
    'pack',
    'adherence',
    'components',
    'contracts',
    'coverage',
    'dependencies',
    'glossary',
    'modules',
    'routes',
    'schemas',
    'tests',
    'all',
  ],
  'adoption-tiers': ['tier1', 'tier2', 'tier3'],
  'executor-kinds': ['routine', 'agent', 'human', 'composite'],
  'agent-selection-modes': ['exact', 'preferred', 'policy'],
  roles: ['owner', 'architect', 'inspector', 'engineer', 'auditor'],
  effects: ['read', 'harness-write', 'local-write', 'remote-write'],
  verdicts: ['pass', 'review', 'fail', 'unknown', 'na', 'skipped', 'error', 'killed'],
  'action-lifecycles': ['supported', 'experimental', 'retired'],
  'surface-tiers': ['porcelain', 'plumbing'],
} as const;

const VOCABULARY_MIGRATION_ROWS = [
  'vocabulary:check-profile',
  'vocabulary:sense-set-baseline',
  'vocabulary:sense-set-tier1',
  'vocabulary:sense-set-tier2',
  'vocabulary:sense-set-tier3',
  'vocabulary:sense-set-all',
  'vocabulary:sense-set-sweep',
  'vocabulary:adoption-profile',
  'vocabulary:allow-publish',
] as const;

function json(path: string): JsonObject {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as JsonObject;
}

function record(value: unknown, diagnostic: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${diagnostic}: expected an object`);
  }
  return value as JsonObject;
}

function stringArray(value: unknown, diagnostic: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${diagnostic}: expected a string array`);
  }
  return value as string[];
}

function runBuilt(args: readonly string[]) {
  if (!existsSync(BIN)) {
    throw new Error(
      'R7-B1-CAT-001: built CLI is absent; run pnpm run devai:prepare (this contract never skips)',
    );
  }
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 30_000,
  });
}

function actionEnvelope(text: string, diagnostic: string): JsonObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${diagnostic}: expected one JSON action envelope, received ${text}`);
  }
  expect(
    validators.actionResult(parsed),
    `${diagnostic}: ${JSON.stringify(validators.actionResult.errors)}`,
  ).toBe(true);
  return record(parsed, diagnostic);
}

function aggregate(status: string, processStatus: number, na = false) {
  return aggregateSensorRunResults([
    {
      command: `fixture ${status}`,
      processStatus,
      stdout: JSON.stringify({ status }),
      stderr: '',
      ...(na ? { na: true } : {}),
    },
  ]);
}

function sourceActions(): SourceAction[] {
  const registry = json('law/policy/action-registry.json');
  return (registry['entries'] as SourceAction[]).filter((entry) => entry.disposition === 'keep');
}

function builtProjection(entry: SourceAction): JsonObject {
  return {
    name: entry.action_id,
    previous_name: entry.internal_binding,
    path: entry.path,
    lifecycle: entry.lifecycle,
    lifecycle_reason: entry.lifecycle_reason,
    promotion_criteria: entry.promotion_criteria,
    visibility: entry.visibility,
    tier: entry.tier,
    profiles: entry.profiles,
    effects: entry.effect,
    authority_contract_version: entry.authority_contract_version,
    description: entry.description,
    authority: entry.authority,
  };
}

function firstDifferentIndex(left: readonly unknown[], right: readonly unknown[]): number {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (JSON.stringify(left[index]) !== JSON.stringify(right[index])) return index;
  }
  return -1;
}

function modelRuntimePopulations(): {
  readonly runtimes: string[];
  readonly models: string[];
  readonly efforts: string[];
} {
  const path = join(ROOT, 'law/policy/model-runtime-registry.json');
  if (!existsSync(path)) {
    throw new Error(
      'R7-B1-DOC-001: law/policy/model-runtime-registry.json is missing, so runtime/model/effort documentation has no canonical population',
    );
  }
  const registry = JSON.parse(readFileSync(path, 'utf8')) as JsonObject;
  const runtimes = (registry['runtimes'] as Array<JsonObject> | undefined) ?? [];
  const models = (registry['models'] as Array<JsonObject> | undefined) ?? [];
  const entries = (registry['entries'] as Array<JsonObject> | undefined) ?? [];
  const runtimeIds = [
    ...runtimes.map((item) => item['id']),
    ...entries.map((item) => item['runtime_id']),
  ].filter((item): item is string => typeof item === 'string');
  const modelIds = [
    ...models.map((item) => item['id']),
    ...entries.map((item) => item['model_id'] ?? item['id']),
  ].filter((item): item is string => typeof item === 'string');
  const effortIds = [...models, ...entries].flatMap((item) =>
    Array.isArray(item['supported_efforts']) ? item['supported_efforts'] : [],
  );
  const unique = (values: readonly string[]) => [...new Set(values)].sort();
  const populations = {
    runtimes: unique(runtimeIds),
    models: unique(modelIds),
    efforts: unique(effortIds.filter((item): item is string => typeof item === 'string')),
  };
  for (const [category, values] of Object.entries(populations)) {
    if (values.length === 0) {
      throw new Error(`R7-B1-DOC-001: model/runtime registry has an empty ${category} population`);
    }
  }
  return populations;
}

function documentationReport(testId: string): DocumentationCheckReport {
  const result = runBuilt(['check', '--only', 'cli-reference', '--format', 'json']);
  if (result.status !== 0) {
    throw new Error(
      `${testId}: canonical descriptor check exited ${String(result.status)}: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  if (result.stderr !== '') {
    throw new Error(`${testId}: successful machine check wrote to stderr: ${result.stderr.trim()}`);
  }
  const envelope = actionEnvelope(result.stdout, testId);
  expect(envelope, `${testId}: check result must be action-bound`).toMatchObject({
    action_id: 'check',
    ok: true,
  });
  const resultFrame = record(envelope['result'], `${testId}: result frame`);
  expect(resultFrame['media_type'], `${testId}: report must be JSON`).toBe('application/json');
  return record(resultFrame['value'], `${testId}: report`) as unknown as DocumentationCheckReport;
}

function oldActionMigrationRows(): string[] {
  const source = readFileSync(
    join(ROOT, 'work/rounds/R-0007/inventory/old-to-new-command-map.md'),
    'utf8',
  ).split('## Global vocabulary and consent migration')[0];
  const rows = [...(source ?? '').matchAll(/^\| `([^`]+)`\s*\|/gmu)].map(
    (match) => `action:${match[1] ?? ''}`,
  );
  if (rows.length !== 147 || new Set(rows).size !== rows.length) {
    throw new Error(
      `R7-B1-DOC-002: expected 147 unique old-command migration rows, received ${String(rows.length)}`,
    );
  }
  return rows;
}

function assertBijection(
  id: string,
  actual: DocumentationCategoryResult | undefined,
  expected: readonly string[],
): void {
  if (actual === undefined) throw new Error(`R7-B1-DOC-001: missing documentation category ${id}`);
  expect(actual.canonical_source, `${id}: canonical source is missing`).toMatch(
    /^(?:law|work\/rounds\/R-0007)\//u,
  );
  expect(actual.expected_ids, `${id}: checker/source population drift`).toEqual(expected);
  expect(actual.documented_ids, `${id}: documentation is not an exact ordered bijection`).toEqual(
    expected,
  );
  expect(actual.missing, `${id}: undocumented canonical values`).toEqual([]);
  expect(actual.extra, `${id}: documented nonexistent values`).toEqual([]);
  expect(actual.duplicates, `${id}: values documented more than once`).toEqual([]);
}

afterEach(() => {
  process.argv = [...ORIGINAL_ARGV];
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe('R-0007 B1 action output and aggregate exit totality', () => {
  it('R7-B1-OUT-001 preserves an empty successful action as an action-bound none result', () => {
    let stdout = '';
    let stderr = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
    process.argv = [process.execPath, BIN, 'fixture', 'empty', '--format', 'json'];
    const command = { commandAction: () => undefined } as unknown as Parameters<
      typeof attachActionOutputBoundaries
    >[0][number];
    const entry = {
      name: 'fixture empty',
      path: ['fixture', 'empty'],
      output_contract: { payload_schema: null },
    } as unknown as RegistryEntry;

    attachActionOutputBoundaries([command], [entry]);
    command.commandAction?.call(command);

    expect(stderr, 'R7-B1-OUT-001: exit-0/empty-output was misclassified as failure').toBe('');
    expect(actionEnvelope(stdout, 'R7-B1-OUT-001')).toMatchObject({
      action_id: 'fixture empty',
      ok: true,
      result: { media_type: 'none', value: null },
    });
    expect(process.exitCode).toBe(0);
  });

  it('R7-B1-OUT-002 gives every aggregate outcome an explicit conservative exit', () => {
    const outcomes = [
      aggregate('pass', 0),
      aggregate('review', 1),
      aggregate('fail', 2),
      aggregate('unknown', 0),
      aggregate('pass', 0, true),
      aggregate('error', 0),
    ];
    expect(
      outcomes.map((outcome) => ({
        execution_status: outcome.execution_status,
        readiness_status: outcome.readiness_status,
        exit_code: (outcome as typeof outcome & { readonly exit_code?: number }).exit_code,
      })),
      'R7-B1-OUT-002: aggregate exits must be total and UNKNOWN must not exit as PASS',
    ).toEqual([
      { execution_status: 'pass', readiness_status: 'pass', exit_code: 0 },
      { execution_status: 'pass', readiness_status: 'review', exit_code: 1 },
      { execution_status: 'pass', readiness_status: 'fail', exit_code: 2 },
      { execution_status: 'pass', readiness_status: 'unknown', exit_code: 1 },
      { execution_status: 'pass', readiness_status: 'na', exit_code: 0 },
      { execution_status: 'error', readiness_status: 'unknown', exit_code: 2 },
    ]);
  });

  it('R7-B1-OUT-003 refuses mixed success and error channels as one structured error', () => {
    let stdout = '';
    let stderr = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
    process.argv = [process.execPath, BIN, 'fixture', 'mixed', '--format', 'json'];
    const command = {
      commandAction: () => {
        process.stdout.write('{"partial":true}\n');
        process.stderr.write('unexpected diagnostic\n');
      },
    } as unknown as Parameters<typeof attachActionOutputBoundaries>[0][number];
    const entry = {
      name: 'fixture mixed',
      path: ['fixture', 'mixed'],
      output_contract: { payload_schema: null },
    } as unknown as RegistryEntry;

    attachActionOutputBoundaries([command], [entry]);
    command.commandAction?.call(command);

    expect(stdout, 'R7-B1-OUT-003: mixed channels silently discarded the error channel').toBe('');
    expect(actionEnvelope(stderr, 'R7-B1-OUT-003')).toMatchObject({
      action_id: 'fixture mixed',
      ok: false,
      error: { class: 'contract-violation', exit: 7 },
    });
    expect(process.exitCode).toBe(7);
  });
});

describe('R-0007 B1 requested and resolved task execution evidence', () => {
  it('R7-B1-EXEC-001 keeps the immutable requested executor on a round-bound task', () => {
    const schema = json('law/schemas/task.schema.json');
    const required = stringArray(schema['required'], 'R7-B1-EXEC-001 task required');
    const properties = record(schema['properties'], 'R7-B1-EXEC-001 task properties');
    expect(required, 'R7-B1-EXEC-001: new tasks must require round_id and executor').toEqual(
      expect.arrayContaining(['round_id', 'executor']),
    );
    expect(
      properties['model_tier'],
      'R7-B1-EXEC-001: legacy model_tier cannot select execution',
    ).toBeUndefined();
    const executor = JSON.stringify(properties['executor']);
    for (const kind of ['routine', 'agent', 'human', 'composite']) {
      expect(executor, `R7-B1-EXEC-001: missing closed ${kind} executor branch`).toContain(
        JSON.stringify(kind),
      );
    }
  });

  it('R7-B1-EXEC-002 records resolved execution separately and completely', () => {
    const path = join(ROOT, 'law/schemas/task-execution-evidence.schema.json');
    if (!existsSync(path)) {
      throw new Error('R7-B1-EXEC-002: law/schemas/task-execution-evidence.schema.json is missing');
    }
    const schema = JSON.parse(readFileSync(path, 'utf8')) as JsonObject;
    const required = stringArray(schema['required'], 'R7-B1-EXEC-002 evidence required');
    const properties = record(schema['properties'], 'R7-B1-EXEC-002 evidence properties');
    expect(required, 'R7-B1-EXEC-002: resolved evidence omits mandatory provenance').toEqual(
      expect.arrayContaining([
        'schemaVersion',
        'id',
        'task_id',
        'round_id',
        'requested_executor_digest_sha256',
        'resolved_executor',
        'adapter_versions',
        'tool_versions',
        'input_digests',
        'output_digests',
        'selection',
        'started_at',
        'completed_at',
        'verdict',
        'evidence_refs',
      ]),
    );
    expect(
      properties['requested_executor'],
      'R7-B1-EXEC-002: evidence must bind the immutable request by digest, not copy/mutate it',
    ).toBeUndefined();
    const resolved = JSON.stringify(properties['resolved_executor']);
    for (const field of ['runtime', 'model', 'effort', 'argv']) {
      expect(resolved, `R7-B1-EXEC-002: resolved executor cannot represent ${field}`).toContain(
        field,
      );
    }
    const schemaText = JSON.stringify(schema);
    for (const field of ['prompt', 'usage', 'cost', 'fallback']) {
      expect(schemaText, `R7-B1-EXEC-002: evidence omits ${field} semantics`).toContain(field);
    }
  });
});

describe('R-0007 B1 source/generated/built catalog parity', () => {
  it('R7-B1-CAT-001 compares the complete canonical order and never skips an absent build', () => {
    const source = sourceActions();
    expect(
      ACTION_REGISTRY,
      'R7-B1-CAT-001: generated TypeScript view differs from the complete source registry',
    ).toEqual(json('law/policy/action-registry.json')['entries'] as SourceAction[]);

    const result = runBuilt(['catalog', 'actions', '--format', 'json']);
    expect(result.status, `R7-B1-CAT-001: built catalog failed: ${result.stderr}`).toBe(0);
    expect(result.stderr).toBe('');
    const envelope = actionEnvelope(result.stdout, 'R7-B1-CAT-001');
    const frame = record(envelope['result'], 'R7-B1-CAT-001 result frame');
    const built = frame['value'] as JsonObject[];
    const expected = source.map(builtProjection);
    const mismatch = firstDifferentIndex(expected, built);
    expect(
      built.map((entry) => entry['name']),
      `R7-B1-CAT-001: built/source canonical ordering first differs at index ${String(mismatch)}`,
    ).toEqual(expected.map((entry) => entry['name']));
    expect(built, 'R7-B1-CAT-001: built/source catalog field parity').toEqual(expected);
  });
});

describe('R-0007 B1 canonical descriptor handoff completeness', () => {
  it('R7-B1-DOC-001 bijects every canonical enumeration without claiming R-0009 narrative/site completion', () => {
    const report = documentationReport('R7-B1-DOC-001');
    expect(report).toMatchObject({
      scope: 'r0007-canonical-descriptor-handoff',
      narrative_documentation_complete: false,
      deploy_ready_site: false,
    });
    const sensors = json('law/policy/sensor-registry.json')['entries'] as Array<{
      readonly kind: string;
    }>;
    const modelRuntime = modelRuntimePopulations();
    const expected: Readonly<Record<string, readonly string[]>> = {
      ...FIXED_DOCUMENTATION_POPULATIONS,
      'sensor-kinds': sensors.map((entry) => entry.kind),
      runtimes: modelRuntime.runtimes,
      'rostered-models': modelRuntime.models,
      'supported-efforts': modelRuntime.efforts,
    };
    expect(Object.keys(report.categories).sort(), 'R7-B1-DOC-001: category census drift').toEqual(
      Object.keys(expected).sort(),
    );
    for (const [id, population] of Object.entries(expected)) {
      assertBijection(id, report.categories[id], population);
    }
  });

  it('R7-B1-DOC-002 documents every old action and vocabulary migration row exactly once', () => {
    const report = documentationReport('R7-B1-DOC-002');
    const expected = [...oldActionMigrationRows(), ...VOCABULARY_MIGRATION_ROWS];
    expect(expected).toHaveLength(156);
    assertBijection('migration', report.migration, expected);
  });
});
