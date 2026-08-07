// Invariants: INV-DEVAI-001, INV-DEVAI-008, INV-DEVAI-017
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const CLASSIFIER = join(ROOT, 'scripts/derive-commit-validation-plan.mjs');
const POLICY = 'law/policy/round-close-controls.json';
const GRAPH = 'work/rounds/R-0007/affected-test-graph.json';
const temporaryRoots: string[] = [];

type ValidationClass =
  'governance-text' | 'law-and-schema' | 'runtime-and-tests' | 'candidate-and-close';

interface Fixture {
  readonly root: string;
  readonly base: string;
}

interface CommandResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function copy(root: string, relativePath: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  copyFileSync(join(ROOT, relativePath), path);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, subject: string): string {
  git(root, ['add', '-A']);
  git(root, [
    '-c',
    'user.name=DEVAI Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '-qm',
    subject,
  ]);
  return git(root, ['rev-parse', 'HEAD']);
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-classifier-'));
  temporaryRoots.push(root);
  git(root, ['init', '-q']);
  put(root, '.gitignore', '.devai/state/\n');
  copy(root, POLICY);
  copy(root, GRAPH);
  put(root, 'product/owner-mandates/OM-900.md', '---\nid: OM-900\nstatus: active\n---\n');
  put(root, 'docs/guide.md', '# Guide\n');
  put(root, 'law/policy/example.json', '{"enabled":true}\n');
  put(root, 'law/policy/action-registry.json', '{"entries":[]}\n');
  put(root, 'law/schemas/example.schema.json', '{"type":"object"}\n');
  put(root, 'packages/demo/src/runtime.ts', 'export const runtime = 1;\n');
  put(root, 'packages/demo/src/deleted.ts', 'export const deleted = true;\n');
  put(root, 'packages/demo/src/old-name.ts', 'export const renamed = true;\n');
  put(root, 'packages/demo/src/target.ts', 'export const target = true;\n');
  symlinkSync('target.ts', join(root, 'packages/demo/src/current-link.ts'));
  put(root, 'scripts/helper.mjs', 'export const helper = true;\n');
  put(root, 'scripts/derive-commit-validation-plan.mjs', 'export const fixture = true;\n');
  put(root, 'tests/contract/example.test.ts', 'export const contract = true;\n');
  put(
    root,
    'package.json',
    `${JSON.stringify(
      {
        name: 'classifier-fixture',
        private: true,
        type: 'module',
        scripts: { verify: 'node scripts/helper.mjs' },
      },
      null,
      2,
    )}\n`,
  );
  put(
    root,
    '.github/workflows/ci.yml',
    [
      'name: Fixture',
      'on: [pull_request, push]',
      'permissions:',
      '  contents: read',
      'jobs:',
      '  verify:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - run: pnpm run verify',
      '',
    ].join('\n'),
  );
  put(
    root,
    'packages/cli/src/generated/action-registry.ts',
    'export const generated = [] as const;\n',
  );
  put(
    root,
    'packages/effects-check/src/generated/action-catalog.ts',
    'export const generated = [];\n',
  );
  put(root, 'packages/sensors/src/generated/action-kinds.ts', 'export const generated = [];\n');
  return { root, base: commit(root, 'fixture base') };
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function runClassifier(
  fixtureRoot: string,
  base: string,
  candidate: string,
  additionalArgs: readonly string[] = [],
): CommandResult {
  if (!existsSync(CLASSIFIER)) {
    return {
      status: 1,
      stdout: '',
      stderr:
        'COMMIT_VALIDATION_CLASSIFIER_ABSENT: scripts/derive-commit-validation-plan.mjs is absent',
    };
  }
  const result = spawnSync(
    process.execPath,
    [
      CLASSIFIER,
      '--repo-root',
      fixtureRoot,
      '--round',
      'R-0007',
      '--base',
      base,
      '--candidate',
      candidate,
      '--json',
      ...additionalArgs,
    ],
    { cwd: fixtureRoot, encoding: 'utf8' },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function planFrom(result: CommandResult, context: string): Record<string, unknown> {
  expect(
    result.status,
    `COMMIT_VALIDATION_CLASS_UNDERBOUND: ${context}\n${result.stderr}\n${result.stdout}`,
  ).toBe(0);
  expect(result.stdout.trim(), `${context}: classifier emitted no machine plan`).not.toBe('');
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function expectCommandRecords(value: unknown, label: string): void {
  expect(value, `${label} must be an array`).toBeInstanceOf(Array);
  if (!Array.isArray(value)) return;
  for (const command of value as Array<Record<string, unknown>>) {
    expect(command).toMatchObject({
      id: expect.any(String),
      argv: expect.any(Array),
      cwd: expect.any(String),
      reason: expect.any(String),
    });
    expect(
      Object.hasOwn(command, 'exit_code'),
      `${label}.${String(command.id)} must bind its observed or pending exit`,
    ).toBe(true);
  }
}

function expectCompletePlan(
  plan: Record<string, unknown>,
  fixtureRoot: string,
  base: string,
  candidate: string,
  expectedClass: ValidationClass,
): void {
  expect(plan).toMatchObject({
    schemaVersion: expect.any(String),
    classifier_version: expect.any(String),
    base_sha: base,
    candidate_sha: candidate,
    validation_class: expectedClass,
    changed_paths: expect.any(Array),
    derived_dependencies: expect.any(Array),
    selected_commands: expect.any(Array),
    omitted_commands: expect.any(Array),
    diagnostics: expect.any(Array),
    policy_identity: {
      path: POLICY,
      digest_sha256: sha256File(join(fixtureRoot, POLICY)),
    },
    graph_identity: {
      path: GRAPH,
      digest_sha256: sha256File(join(fixtureRoot, GRAPH)),
    },
  });
  const changedPaths = plan.changed_paths as Array<Record<string, unknown>>;
  for (const change of changedPaths) {
    expect(change).toMatchObject({
      status: expect.any(String),
      path: expect.any(String),
      entry_type: expect.any(String),
      reason: expect.any(String),
    });
  }
  const dependencies = plan.derived_dependencies as Array<Record<string, unknown>>;
  for (const dependency of dependencies) {
    expect(dependency).toMatchObject({
      source_path: expect.any(String),
      target: expect.any(String),
      kind: expect.any(String),
      reason: expect.any(String),
    });
  }
  expectCommandRecords(plan.selected_commands, 'selected_commands');
  expectCommandRecords(plan.omitted_commands, 'omitted_commands');
  expect(
    (plan.selected_commands as Array<Record<string, unknown>>).some(
      (command) => command.id === 'diff-check',
    ),
    'every class retains git diff --check',
  ).toBe(true);
}

function changed(
  mutate: (root: string) => void,
  subject: string,
): Fixture & { readonly candidate: string } {
  const current = fixture();
  mutate(current.root);
  return { ...current, candidate: commit(current.root, subject) };
}

function commandIds(plan: Record<string, unknown>): string[] {
  return (plan.selected_commands as Array<Record<string, unknown>>).map((entry) =>
    String(entry.id),
  );
}

function sentinelSpecimen(): {
  readonly current: Fixture & { readonly candidate: string };
  readonly path: string;
} {
  const current = changed(
    (root) => put(root, 'docs/sentinel-input.md', '# Narrow governance change\n'),
    'governance candidate',
  );
  const path = join(current.root, 'sentinel-observation.json');
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        exact_base: current.base,
        exact_candidate: current.candidate,
        predicted: {
          result: 'PASS',
          commands: [{ id: 'diff-check', exit_code: 0 }],
        },
        cold_observed: {
          result: 'FAIL',
          commands: [
            { id: 'diff-check', exit_code: 0 },
            { id: 'ordinary', exit_code: 1 },
          ],
        },
      },
      null,
      2,
    )}\n`,
  );
  return { current, path };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('R-0007 fail-closed commit validation classifier red contracts', () => {
  it('R7-026-FOUR-CLASS-CROSS-PRODUCT derives all classes and complete status/dependency records', () => {
    const classCases: Array<{
      readonly expected: ValidationClass;
      readonly label: string;
      readonly mutate: (root: string) => void;
    }> = [
      {
        expected: 'governance-text',
        label: 'governance documentation addition',
        mutate: (root) => put(root, 'docs/new-guide.md', '# New guide\n'),
      },
      {
        expected: 'law-and-schema',
        label: 'law policy modification',
        mutate: (root) => put(root, 'law/policy/example.json', '{"enabled":false}\n'),
      },
      {
        expected: 'runtime-and-tests',
        label: 'runtime modification',
        mutate: (root) => put(root, 'packages/demo/src/runtime.ts', 'export const runtime = 2;\n'),
      },
      {
        expected: 'candidate-and-close',
        label: 'classifier-owning modification',
        mutate: (root) =>
          put(root, 'scripts/derive-commit-validation-plan.mjs', 'export const fixture = false;\n'),
      },
    ];

    for (const specimen of classCases) {
      const current = changed(specimen.mutate, specimen.label);
      const plan = planFrom(
        runClassifier(current.root, current.base, current.candidate),
        specimen.label,
      );
      expectCompletePlan(plan, current.root, current.base, current.candidate, specimen.expected);
    }

    const statuses = changed((root) => {
      put(root, 'packages/demo/src/runtime.ts', 'export const runtime = 3;\n');
      unlinkSync(join(root, 'packages/demo/src/deleted.ts'));
      git(root, ['mv', 'packages/demo/src/old-name.ts', 'packages/demo/src/new-name.ts']);
      put(root, 'packages/demo/src/added.ts', 'export const added = true;\n');
      symlinkSync('target.ts', join(root, 'packages/demo/src/added-link.ts'));
      put(root, 'law/policy/action-registry.json', '{"entries":[{"action_id":"fixture"}]}\n');
    }, 'status and generated-edge population');
    const statusPlan = planFrom(
      runClassifier(statuses.root, statuses.base, statuses.candidate),
      'add/modify/delete/rename/symlink/generated-source population',
    );
    expectCompletePlan(
      statusPlan,
      statuses.root,
      statuses.base,
      statuses.candidate,
      'runtime-and-tests',
    );
    const records = statusPlan.changed_paths as Array<Record<string, unknown>>;
    expect(new Set(records.map((entry) => entry.status))).toEqual(new Set(['A', 'D', 'M', 'R100']));
    expect(
      records.some(
        (entry) =>
          entry.path === 'packages/demo/src/added-link.ts' && entry.entry_type === 'symlink',
      ),
      'symlink identity must not be flattened into ordinary file content',
    ).toBe(true);
    expect(
      records.some(
        (entry) =>
          entry.status === 'R100' &&
          entry.old_path === 'packages/demo/src/old-name.ts' &&
          entry.path === 'packages/demo/src/new-name.ts',
      ),
      'exact rename retains preimage and postimage',
    ).toBe(true);
    const targets = (statusPlan.derived_dependencies as Array<Record<string, unknown>>).map(
      (entry) => entry.target,
    );
    expect(targets).toEqual(
      expect.arrayContaining([
        'packages/cli/src/generated/action-registry.ts',
        'packages/effects-check/src/generated/action-catalog.ts',
        'packages/sensors/src/generated/action-kinds.ts',
      ]),
    );
  });

  it('R7-026-STRICTEST-CLASS-WINS selects the highest class in every mixed commit', () => {
    const runtimeMixed = changed((root) => {
      put(root, 'docs/mixed.md', '# Mixed\n');
      put(root, 'law/schemas/example.schema.json', '{"type":"string"}\n');
      put(root, 'tests/contract/example.test.ts', 'export const contract = false;\n');
    }, 'mixed governance law runtime');
    const runtimePlan = planFrom(
      runClassifier(runtimeMixed.root, runtimeMixed.base, runtimeMixed.candidate),
      'governance+law+runtime mixed commit',
    );
    expectCompletePlan(
      runtimePlan,
      runtimeMixed.root,
      runtimeMixed.base,
      runtimeMixed.candidate,
      'runtime-and-tests',
    );

    const candidateMixed = changed((root) => {
      put(root, 'docs/mixed.md', '# Mixed\n');
      put(root, 'packages/demo/src/runtime.ts', 'export const runtime = 4;\n');
      put(root, GRAPH, `${readFileSync(join(root, GRAPH), 'utf8')}\n`);
    }, 'mixed candidate boundary');
    const candidatePlan = planFrom(
      runClassifier(candidateMixed.root, candidateMixed.base, candidateMixed.candidate),
      'graph-owning mixed commit',
    );
    expectCompletePlan(
      candidatePlan,
      candidateMixed.root,
      candidateMixed.base,
      candidateMixed.candidate,
      'candidate-and-close',
    );
  });

  it('R7-026-UNKNOWN-WIDENS follows script/YAML indirection and widens dynamic ambiguity', () => {
    const current = changed((root) => {
      put(
        root,
        'scripts/dynamic-loader.mjs',
        [
          "const binding = globalThis['require'];",
          'const target = process.argv[2];',
          'binding(target);',
          '',
        ].join('\n'),
      );
      put(
        root,
        'package.json',
        `${JSON.stringify(
          {
            name: 'classifier-fixture',
            private: true,
            type: 'module',
            scripts: { dynamic: 'node scripts/dynamic-loader.mjs runtime-selected' },
          },
          null,
          2,
        )}\n`,
      );
      put(
        root,
        '.github/workflows/ci.yml',
        [
          'name: Fixture',
          'on: [pull_request, push]',
          'permissions:',
          '  contents: read',
          'jobs:',
          '  verify:',
          '    runs-on: ubuntu-latest',
          '    steps:',
          '      - run: pnpm run dynamic',
          '',
        ].join('\n'),
      );
    }, 'dynamic package-script workflow indirection');
    const plan = planFrom(
      runClassifier(current.root, current.base, current.candidate),
      'dynamic package-script and workflow dependency',
    );
    expectCompletePlan(plan, current.root, current.base, current.candidate, 'runtime-and-tests');
    expect(plan).toMatchObject({ widened: true });
    expect(JSON.stringify(plan.diagnostics)).toContain('DYNAMIC_DEPENDENCY_AMBIGUOUS');
    expect(JSON.stringify(plan.diagnostics)).toContain('COMMIT_VALIDATION_CLASS_UNDERBOUND');
    expect(commandIds(plan)).toEqual(expect.arrayContaining(['ordinary', 'coverage']));
  });

  it('R7-026-NO-AUTHOR-OVERRIDE rejects an author-selected lower class', () => {
    const current = changed(
      (root) => put(root, 'packages/demo/src/runtime.ts', 'export const runtime = 5;\n'),
      'runtime change with attempted author lowering',
    );
    const result = runClassifier(current.root, current.base, current.candidate, [
      '--class',
      'governance-text',
    ]);
    expect(
      result.status,
      `COMMIT_VALIDATION_CLASS_UNDERBOUND: an author-provided class must be refused\n${result.stderr}\n${result.stdout}`,
    ).toBe(1);
    expect(`${result.stderr}\n${result.stdout}`).toContain('COMMIT_VALIDATION_CLASS_UNDERBOUND');
  });

  it('R7-027-COLD-SENTINEL-DETECTS names a seeded narrowed-green/cold-red mismatch', () => {
    const specimen = sentinelSpecimen();
    const result = runClassifier(
      specimen.current.root,
      specimen.current.base,
      specimen.current.candidate,
      ['--sentinel-observation', specimen.path],
    );
    const output = `${result.stderr}\n${result.stdout}`;
    expect(
      result.status,
      `CLASSIFIER_FALSE_NEGATIVE: seeded omission must fail the sentinel\n${output}`,
    ).toBe(1);
    expect(output).toContain('CLASSIFIER_FALSE_NEGATIVE');
    const report = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(report).toMatchObject({
      ok: false,
      diagnostic: 'CLASSIFIER_FALSE_NEGATIVE',
      exact_base: specimen.current.base,
      exact_candidate: specimen.current.candidate,
      narrowing_enabled: false,
      mismatches: expect.arrayContaining([
        expect.objectContaining({ command_id: 'ordinary', predicted: 'OMITTED', observed_exit: 1 }),
      ]),
    });
  });

  it('R7-027-AUTOMATIC-FULL-FLOOR restores the exact active cold command population', () => {
    const specimen = sentinelSpecimen();
    const result = runClassifier(
      specimen.current.root,
      specimen.current.base,
      specimen.current.candidate,
      ['--sentinel-observation', specimen.path],
    );
    expect(
      result.status,
      `CLASSIFIER_FALSE_NEGATIVE: the mismatch must return a blocking full-floor plan\n${result.stderr}\n${result.stdout}`,
    ).toBe(1);
    expect(`${result.stderr}\n${result.stdout}`).toContain('CLASSIFIER_FALSE_NEGATIVE');
    expect(
      result.stdout.trim(),
      'CLASSIFIER_FALSE_NEGATIVE: sentinel must emit its machine-readable fallback plan',
    ).not.toBe('');
    const report = JSON.parse(result.stdout) as Record<string, unknown>;
    const fallback = report.fallback_plan as Record<string, unknown>;
    expect(fallback).toMatchObject({
      validation_class: 'candidate-and-close',
      narrowing_enabled: false,
      disablement: {
        diagnostic: 'CLASSIFIER_FALSE_NEGATIVE',
        until: 'governed-repair',
      },
    });
    const policy = JSON.parse(readFileSync(join(specimen.current.root, POLICY), 'utf8')) as {
      convergence: { commands: Array<{ id: string }> };
    };
    expect(commandIds(fallback)).toEqual(policy.convergence.commands.map((command) => command.id));
  });
});
