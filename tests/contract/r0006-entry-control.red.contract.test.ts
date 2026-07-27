// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/run-round-close-controls.mjs');
// E1 exercised implementation paths: scripts/run-round-close-controls.mjs,
// .devai/config/round-close-controls.json, and packages/schemas/src/roster.ts.
const roots: string[] = [];

interface Fixture {
  readonly root: string;
  readonly base: string;
  readonly candidate: string;
}

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function git(root: string, args: readonly string[], input?: string): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', input }).trim();
}

function commit(root: string, author: string, subject: string, paths: readonly string[]): string {
  git(root, ['add', ...paths]);
  git(root, [
    '-c',
    `user.name=${author}`,
    '-c',
    'user.email=role@example.test',
    'commit',
    '-qm',
    subject,
  ]);
  return git(root, ['rev-parse', 'HEAD']);
}

function policy(overrides: Record<string, unknown> = {}): string {
  return `${JSON.stringify(
    {
      schemaVersion: '1.0.0',
      declaration: {
        decision_id: 'DII-207',
        base_pattern: 'exact successor base `([0-9a-f]{40})`',
      },
      identities: {
        fields: ['implementation_subject', 'review_candidate', 'published_head'],
        required_kind: 'commit',
        publishability: 'candidate-only-no-alternates',
        historical_classification: 'exact-sha-kind-reason-paths',
      },
      governed_range: { mode: 'exact-base-to-published-head', fixed_windows_forbidden: true },
      governed_identity_sources: ['law/register/DECISIONS.md', 'work/audit/**/*.md'],
      role_paths: {
        Architect: ['law/**', 'work/rounds/**', 'docs/**'],
        Owner: ['product/**'],
        Engineer: ['packages/**', 'scripts/**', 'package.json'],
        Inspector: ['tests/**'],
        Auditor: ['work/audit/**'],
        Machine: ['record/**'],
      },
      projections: [
        {
          id: 'fixture-projection',
          command: ['node', 'fixture/projection.mjs', '--check'],
          sources: ['work/audit/R-0006/review.md'],
          outputs: ['docs/generated/review.md'],
        },
      ],
      convergence: {
        commands: [
          { id: 'formatting', argv: ['node', 'fixture/gate.mjs', 'formatting'] },
          { id: 'preparation', argv: ['node', 'fixture/gate.mjs', 'preparation'] },
          { id: 'trace', argv: ['node', 'fixture/gate.mjs', 'trace'] },
          {
            id: 'repository-references',
            argv: ['node', 'fixture/gate.mjs', 'repository-references'],
          },
          { id: 'generated-views', argv: ['node', 'fixture/gate.mjs', 'generated-views'] },
          { id: 'materializations', argv: ['node', 'fixture/gate.mjs', 'materializations'] },
          { id: 'lint', argv: ['node', 'fixture/gate.mjs', 'lint'] },
          { id: 'typecheck', argv: ['node', 'fixture/gate.mjs', 'typecheck'] },
        ],
        passes: 2,
        second_pass: 'no-write-clean',
      },
      review: {
        frozen_paths: [
          'law/**',
          'product/**',
          'packages/**',
          'tests/**',
          'docs/**',
          'work/rounds/**',
          'work/audit/R-0006/as-built.md',
        ],
        record: 'work/audit/R-0006/review.md',
        record_author: 'DEVAI Auditor',
        projection_only: true,
      },
      rehearsal: {
        schema_path: 'law/schemas/phase-closure.schema.json',
        verb_path: 'packages/cli/src/commands/govern/phase-close.ts',
        closure_path: 'record/proofs/compliance/closures/PC-9999.json',
      },
      semantic_assertions: {
        population_sources: ['law/**/*.json', 'packages/**/*.ts', 'tests/**/*.ts'],
        fixed_counts_forbidden: true,
        self_comparisons_forbidden: true,
        named_file_only_forbidden: true,
        mirror_pairs: [
          {
            source: 'law/policy/round-close-controls.json',
            mirror: '.devai/config/round-close-controls.json',
          },
        ],
      },
      ...overrides,
    },
    null,
    2,
  )}\n`;
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r0006-controls-'));
  roots.push(root);
  git(root, ['init', '-q']);
  git(root, ['config', 'core.logAllRefUpdates', 'true']);
  put(root, 'README.md', 'fixture seed\n');
  commit(root, 'DEVAI Architect', 'chore: seed fixture history', ['README.md']);
  put(root, '.gitignore', '.devai/state/**\n!.devai/state/.gitkeep\n');
  put(root, '.devai/state/.gitkeep', '');
  put(root, 'law/policy/round-close-controls.json', policy());
  put(root, '.devai/config/round-close-controls.json', policy());
  put(
    root,
    'law/policy/governed-sha-reference-exceptions.json',
    '{"schemaVersion":"1.0.0","entries":[]}\n',
  );
  put(root, 'law/schemas/phase-closure.schema.json', '{}\n');
  put(root, 'packages/cli/src/commands/govern/phase-close.ts', 'export const phaseClose = true;\n');
  put(root, 'fixture/gate.mjs', 'process.exit(0);\n');
  put(root, 'fixture/projection.mjs', 'process.exit(0);\n');
  const base = commit(root, 'DEVAI Architect', 'chore: establish fixture base', [
    '.gitignore',
    '.devai/state/.gitkeep',
    'law/policy/round-close-controls.json',
    '.devai/config/round-close-controls.json',
    'law/policy/governed-sha-reference-exceptions.json',
    'law/schemas/phase-closure.schema.json',
    'packages/cli/src/commands/govern/phase-close.ts',
    'fixture/gate.mjs',
    'fixture/projection.mjs',
  ]);
  put(
    root,
    'law/register/DECISIONS.md',
    `### DII-207 — fixture\nexact successor base \`${base}\`\n`,
  );
  const candidate = commit(root, 'DEVAI Architect', 'law(r0006): declare fixture', [
    'law/register/DECISIONS.md',
  ]);
  return { root, base, candidate };
}

function run(root: string, args: readonly string[]) {
  return spawnSync(process.execPath, [SCRIPT, ...args, '--repo-root', root, '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
}

function findings(
  result: ReturnType<typeof run>,
): { code: string; path?: string; gate?: string }[] {
  try {
    return (
      (JSON.parse(result.stdout as string) as { findings?: { code: string }[] }).findings ?? []
    );
  } catch {
    return [];
  }
}

function manifestArgs(candidate: string): string[] {
  return [
    'manifest',
    '--round',
    'R-0006',
    '--implementation-subject',
    candidate,
    '--review-candidate',
    candidate,
    '--published-head',
    candidate,
  ];
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('R-0006 E1 entry-control red contracts', () => {
  it('rejects identities available only from another branch, reflog, stash, or ambient objects', () => {
    const { root, candidate } = fixture();
    const tree = git(root, ['rev-parse', `${candidate}^{tree}`]);
    const localOnly: string[] = [];
    for (const ref of ['refs/heads/other', 'refs/heads/reflog-source', 'refs/stash']) {
      const sha = git(root, ['commit-tree', tree, '-p', candidate, '-m', `local only ${ref}`]);
      git(root, ['update-ref', ref, sha]);
      localOnly.push(sha);
    }
    const dangling = git(root, ['commit-tree', tree, '-p', candidate, '-m', 'shared object only']);
    localOnly.push(dangling);
    put(
      root,
      'law/register/DECISIONS.md',
      `${readFileSync(join(root, 'law/register/DECISIONS.md'), 'utf8')}\n${localOnly.map((sha) => `governed_git_identity: ${sha}`).join('\n')}\n`,
    );
    commit(root, 'DEVAI Architect', 'law(r0006): cite local-only identities', [
      'law/register/DECISIONS.md',
    ]);
    const head = git(root, ['rev-parse', 'HEAD']);
    const result = run(root, manifestArgs(head));
    expect(result.status).not.toBe(0);
    expect(
      findings(result).filter(({ code }) => code === 'GIT_IDENTITY_NOT_PUBLISHABLE'),
    ).toHaveLength(4);
  });

  it('rejects abbreviated, invented, wrong-kind, unresolved, and unclassified identities', () => {
    const { root, base, candidate } = fixture();
    const tree = git(root, ['rev-parse', `${candidate}^{tree}`]);
    const localOnly = git(root, ['commit-tree', tree, '-p', candidate, '-m', 'unclassified']);
    const cases = [
      { value: candidate.slice(0, 12), code: 'GIT_IDENTITY_NOT_FULL' },
      { value: '1'.repeat(40), code: 'GIT_IDENTITY_UNRESOLVED' },
      { value: tree, code: 'GIT_IDENTITY_WRONG_KIND' },
      { value: '2'.repeat(40), code: 'GIT_IDENTITY_UNRESOLVED' },
      { value: localOnly, code: 'GIT_IDENTITY_NOT_PUBLISHABLE' },
    ];
    for (const testCase of cases) {
      const result = run(root, [
        'manifest',
        '--round',
        'R-0006',
        '--base',
        base,
        '--implementation-subject',
        testCase.value,
        '--review-candidate',
        candidate,
        '--published-head',
        candidate,
      ]);
      expect(findings(result), `${testCase.value}: ${result.stderr}`).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: testCase.code })]),
      );
    }
  });

  it('uses the declared exact base and rejects fixed windows or overbroad pre-round history', () => {
    const { root, base, candidate } = fixture();
    const parent = git(root, ['rev-parse', `${base}^`]);
    for (const args of [
      [...manifestArgs(candidate), '--history-window', '3'],
      [...manifestArgs(candidate), '--base', parent],
    ]) {
      const result = run(root, args);
      expect(result.status).not.toBe(0);
      expect(findings(result)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: args.includes('--history-window')
              ? 'FIXED_HISTORY_WINDOW_FORBIDDEN'
              : 'CANDIDATE_RANGE_MISMATCH',
          }),
        ]),
      );
    }
  });

  it('blocks the second convergence pass on every stale projection/gate and on dirtiness', () => {
    const { root, base } = fixture();
    put(
      root,
      'fixture/gate.mjs',
      `const gate = process.argv[2];\nif (gate !== 'preparation') { console.error('stale ' + gate); process.exitCode = 1; }\n`,
    );
    commit(root, 'DEVAI Engineer', 'build(r0006): make fixture gates stale', ['fixture/gate.mjs']);
    const result = run(root, [
      'converge',
      '--round',
      'R-0006',
      '--base',
      base,
      '--head',
      git(root, ['rev-parse', 'HEAD']),
    ]);
    expect(result.status).not.toBe(0);
    expect(findings(result).filter(({ code }) => code === 'CONVERGENCE_GATE_FAILED')).toEqual(
      expect.arrayContaining(
        [
          'formatting',
          'trace',
          'repository-references',
          'generated-views',
          'materializations',
          'lint',
          'typecheck',
        ].map((gate) => expect.objectContaining({ gate })),
      ),
    );

    put(root, 'fixture/gate.mjs', "writeFileSync('README.md', 'dirty\\n');\n");
    put(
      root,
      'fixture/gate.mjs',
      "import { writeFileSync } from 'node:fs';\nwriteFileSync('README.md', 'dirty\\n');\n",
    );
    commit(root, 'DEVAI Engineer', 'build(r0006): make fixture convergence dirty', [
      'fixture/gate.mjs',
    ]);
    const dirty = run(root, [
      'converge',
      '--round',
      'R-0006',
      '--base',
      base,
      '--head',
      git(root, ['rev-parse', 'HEAD']),
    ]);
    expect(findings(dirty)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'CONVERGENCE_DIRTY_TREE' })]),
    );
  });

  it('invalidates PASS after every frozen semantic and current close-artifact class', () => {
    const { root, candidate } = fixture();
    const paths = [
      'law/policy/changed.json',
      'product/changed.md',
      'packages/fixture/changed.ts',
      'tests/fixture/changed.test.ts',
      'docs/current.md',
      'work/audit/R-0006/as-built.md',
      'work/rounds/R-0006/source-close.md',
      'work/rounds/R-0006/closing-decision.md',
    ];
    for (const path of paths) {
      put(root, path, `${path}\n`);
      commit(
        root,
        path.startsWith('work/audit/') ? 'DEVAI Auditor' : 'DEVAI Architect',
        `chore: mutate ${path}`,
        [path],
      );
    }
    const result = run(root, [
      'envelope',
      '--reviewed-sha',
      candidate,
      '--head',
      git(root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(result.status).not.toBe(0);
    const frozenPaths = findings(result)
      .filter(({ code }) => code === 'REVIEW_FREEZE_VIOLATION')
      .map(({ path }) => path);
    expect(frozenPaths).toEqual(expect.arrayContaining(paths));
  });

  it('admits only one exact Auditor review and solely caused deterministic projections', () => {
    const { root, candidate } = fixture();
    put(root, 'work/audit/R-0006/review.md', 'PASS\n');
    commit(root, 'DEVAI Auditor', 'audit(r0006): record independent review', [
      'work/audit/R-0006/review.md',
    ]);
    put(root, 'work/audit/R-0006/extra.md', 'extra\n');
    commit(root, 'DEVAI Auditor', 'audit(r0006): add a second review record', [
      'work/audit/R-0006/extra.md',
    ]);
    put(root, 'docs/generated/review.md', 'not reproducible\n');
    commit(root, 'DEVAI Architect', 'docs(r0006): write uncaused projection', [
      'docs/generated/review.md',
    ]);
    put(root, 'scripts/projection-generator.mjs', 'export const changed = true;\n');
    commit(root, 'DEVAI Engineer', 'build(r0006): mutate projection generator', [
      'scripts/projection-generator.mjs',
    ]);
    const result = run(root, [
      'envelope',
      '--reviewed-sha',
      candidate,
      '--head',
      git(root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(findings(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REVIEW_ENVELOPE_EXTRA_AUDIT' }),
        expect.objectContaining({ code: 'REVIEW_ENVELOPE_PROJECTION_DRIFT' }),
        expect.objectContaining({ code: 'REVIEW_ENVELOPE_SOURCE_MUTATION' }),
      ]),
    );
  });

  it('rehearses closure-only ancestry and fails when either prerequisite is absent', () => {
    const valid = fixture();
    const accepted = run(valid.root, [
      'rehearse',
      '--round',
      'R-0006',
      '--base',
      valid.base,
      '--candidate',
      valid.candidate,
    ]);
    expect(accepted.status, accepted.stderr).toBe(0);

    for (const missing of [
      'law/schemas/phase-closure.schema.json',
      'packages/cli/src/commands/govern/phase-close.ts',
    ]) {
      const current = fixture();
      git(current.root, ['rm', missing]);
      commit(
        current.root,
        missing.startsWith('law/') ? 'DEVAI Architect' : 'DEVAI Engineer',
        `chore: omit ${missing}`,
        [missing],
      );
      const result = run(current.root, [
        'rehearse',
        '--round',
        'R-0006',
        '--base',
        current.base,
        '--candidate',
        git(current.root, ['rev-parse', 'HEAD']),
      ]);
      expect(findings(result)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'CLOSURE_PREREQUISITE_MISSING', path: missing }),
        ]),
      );
    }
  });

  it('rejects fixed counts, self-comparison, narrow named scans, and policy mirror drift', () => {
    const { root } = fixture();
    expect(readFileSync(join(ROOT, 'packages/schemas/src/roster.ts'), 'utf8')).toContain(
      "'round-close-manifest.schema.json'",
    );
    const invalidPolicies = [
      { semantic_assertions: { fixed_count: 56 } },
      { semantic_assertions: { compare: ['law/trace.json', 'law/trace.json'] } },
      { semantic_assertions: { population_sources: ['tests/one.test.ts'] } },
    ];
    for (const invalid of invalidPolicies) {
      put(root, 'law/policy/round-close-controls.json', policy(invalid));
      const result = run(root, ['policy-check']);
      expect(findings(result)).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'SEMANTIC_ASSERTION_VACUOUS' })]),
      );
    }
    put(root, 'law/policy/round-close-controls.json', policy());
    put(root, '.devai/config/round-close-controls.json', `${policy()} `);
    const mirror = run(root, ['policy-check']);
    expect(findings(mirror)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'POLICY_MIRROR_DRIFT' })]),
    );
  });
});
