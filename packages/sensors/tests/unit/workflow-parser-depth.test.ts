// Invariants: INV-DEVAI-001, INV-DEVAI-012, INV-DEVAI-017
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  listWorkflowFiles,
  loadWorkflows,
  parseWorkflow,
} from '../../src/harness/workflow-parser.js';

let root = '';

function write(path: string, contents: string): string {
  const target = join(root, path);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, contents);
  return target;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'devai-workflow-parser-depth-'));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('workflow parser behavioral depth', () => {
  it('lists only sorted YAML workflow files from relative and absolute directories', () => {
    expect(listWorkflowFiles(root)).toEqual([]);
    write('.github/workflows', 'not a directory');
    expect(listWorkflowFiles(root)).toEqual([]);
    rmSync(join(root, '.github/workflows'));
    const yaml = write('.github/workflows/a.yaml', 'name: a\n');
    const yml = write('.github/workflows/b.yml', 'name: b\n');
    write('.github/workflows/ignored.json', '{}');

    expect(listWorkflowFiles(root)).toEqual([yaml, yml]);
    expect(listWorkflowFiles(root, join(root, '.github/workflows'))).toEqual([yaml, yml]);
  });

  it('parses paths, jobs, matrices, actions, caches, and inline and block runs', () => {
    const file = join(root, '.github/workflows/complex.yml');
    const parsed = parseWorkflow(
      file,
      `name: complex
on:
  push:
    paths:
      - "packages/**"
      - "feature#one"
      - "packages/**"
    paths-ignore:
      - 'docs/**'
permissions:
  contents: read
concurrency:
  group: fixture
jobs:
  build:
    strategy:
      matrix:
        node: [20, 22]
        os:
          - ubuntu
          - macos
    steps:
      - uses: actions/cache@v4
      - uses: actions/setup-node@v4
        with:
          cache: pnpm
      - uses: ./.github/actions/local
      - uses: owner/repo/.github/workflows/reuse.yml@main
      - uses: incomplete
      - run: echo inline
      - run: |
          echo multi
          echo second
  verify:
    steps:
      - run: >-
          echo folded
`,
      root,
    );

    expect(parsed).toMatchObject({
      relativeFile: '.github/workflows/complex.yml',
      onPaths: ['packages/**', 'feature#one'],
      onPathsIgnore: ['docs/**'],
      hasPermissionsBlock: true,
      hasConcurrencyBlock: true,
      hasCache: true,
      runStepCount: 3,
      compositeActionUses: ['./.github/actions/local'],
      reusableWorkflowUses: ['repo/.github/workflows/reuse.yml'],
    });
    expect(parsed.actionUses).toEqual([
      { owner: 'actions', repo: 'cache', ref: 'v4', line: 23 },
      { owner: 'actions', repo: 'setup-node', ref: 'v4', line: 24 },
      { owner: '', repo: './.github/actions/local', ref: '', line: 27 },
      { owner: 'owner', repo: 'repo/.github/workflows/reuse.yml', ref: 'main', line: 28 },
    ]);
    expect(parsed.jobs).toEqual([
      { name: 'build', stepCount: 7, matrixDimensions: 2, matrixCombinations: 4 },
      { name: 'verify', stepCount: 1, matrixDimensions: 0, matrixCombinations: 0 },
    ]);
    expect(parsed.runScripts).toEqual([
      'echo inline',
      '  echo multi\n  echo second',
      '  echo folded',
    ]);
  });

  it('does not infer setup-action caching across a new step boundary', () => {
    const parsed = parseWorkflow(
      '/outside/workflow.yml',
      `on: push
jobs:
  test:
    steps:
      - uses: actions/setup-node@v4
      - name: next step
        run: echo no-cache
`,
      root,
    );

    expect(parsed.relativeFile).toBe('/outside/workflow.yml');
    expect(parsed.hasCache).toBe(false);
    expect(parsed.runScripts).toEqual(['echo no-cache']);
  });

  it('expands yml and yaml composite actions while tolerating missing composites', () => {
    write(
      '.github/workflows/ci.yml',
      `name: ci
on: push
jobs:
  test:
    steps:
      - uses: ./.github/actions/cache-yml
      - uses: ./.github/actions/run-yaml
      - uses: ./.github/actions/missing
      - run: echo workflow
`,
    );
    write(
      '.github/actions/cache-yml/action.yml',
      `name: cache
runs:
  using: composite
  steps:
    - uses: actions/cache@v4
`,
    );
    write(
      '.github/actions/run-yaml/action.yaml',
      `name: run
runs:
  using: composite
  steps:
    - uses: owner/tool@v2
    - run: echo composite
`,
    );

    const [workflow] = loadWorkflows(root);

    expect(workflow?.hasCache).toBe(true);
    expect(workflow?.actionUses.map(({ owner, repo, ref }) => ({ owner, repo, ref }))).toEqual([
      { owner: '', repo: './.github/actions/cache-yml', ref: '' },
      { owner: '', repo: './.github/actions/run-yaml', ref: '' },
      { owner: '', repo: './.github/actions/missing', ref: '' },
      { owner: 'actions', repo: 'cache', ref: 'v4' },
      { owner: 'owner', repo: 'tool', ref: 'v2' },
    ]);
    expect(workflow?.runScripts).toEqual(['echo workflow', 'echo composite']);
  });

  it('loads workflows without composites and ignores non-workflow files', () => {
    write('.github/workflows/plain.yml', 'name: plain\non: push\n');
    write('.github/workflows/readme.txt', 'ignored');

    expect(loadWorkflows(root)).toEqual([
      expect.objectContaining({
        relativeFile: '.github/workflows/plain.yml',
        actionUses: [],
        jobs: [],
        runScripts: [],
      }),
    ]);
  });
});
