// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const staged = new Set(
    git(root, ['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
  );
  const unstaged = paths.filter((path) => !staged.has(path));
  if (unstaged.length > 0) git(root, ['add', '--', ...unstaged]);
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
      manifest_schema: 'law/schemas/round-close-manifest.schema.json',
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
  put(root, '.gitignore', '.devai/state/**\n!.devai/state/.gitkeep\nscratch/**\n');
  put(root, '.devai/state/.gitkeep', '');
  put(root, 'law/policy/round-close-controls.json', policy());
  put(root, '.devai/config/round-close-controls.json', policy());
  put(
    root,
    'law/policy/governed-sha-reference-exceptions.json',
    '{"schemaVersion":"1.0.0","entries":[]}\n',
  );
  put(root, 'law/schemas/phase-closure.schema.json', '{}\n');
  put(root, 'law/schemas/round-close-manifest.schema.json', '{}\n');
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
    'law/schemas/round-close-manifest.schema.json',
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

function prepareCloseState(root: string, base: string, candidate: string): void {
  const convergence = run(root, [
    'converge',
    '--round',
    'R-0006',
    '--base',
    base,
    '--head',
    candidate,
  ]);
  expect(convergence.status, convergence.stderr).toBe(0);
  const rehearsal = run(root, [
    'rehearse',
    '--round',
    'R-0006',
    '--base',
    base,
    '--candidate',
    candidate,
  ]);
  expect(rehearsal.status, rehearsal.stderr).toBe(0);
  put(
    root,
    'scratch/coverage/t1-t3/coverage-summary.json',
    `${JSON.stringify({
      total: Object.fromEntries(
        ['statements', 'branches', 'functions', 'lines'].map((key) => [key, { pct: 100 }]),
      ),
    })}\n`,
  );
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
    const rehearsal = JSON.parse(accepted.stdout as string) as {
      result: { source_merge: string; closure_head: string; ok: boolean };
    };
    expect(rehearsal.result.ok).toBe(true);
    expect(rehearsal.result.source_merge).toMatch(/^[0-9a-f]{40}$/u);
    expect(rehearsal.result.closure_head).toMatch(/^[0-9a-f]{40}$/u);
    expect(rehearsal.result.closure_head).not.toBe(rehearsal.result.source_merge);

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

describe('R-0006 E4 entry-control acceptance and adversaries', () => {
  it('binds closure N-to-N+1 rehearsal to tracked canonical prerequisites', () => {
    const canonical = JSON.parse(
      readFileSync(join(ROOT, 'law/policy/round-close-controls.json'), 'utf8'),
    ) as { rehearsal: { schema_path: string; verb_path: string } };
    const mirror = JSON.parse(
      readFileSync(join(ROOT, '.devai/config/round-close-controls.json'), 'utf8'),
    ) as { rehearsal: { schema_path: string; verb_path: string } };
    expect(mirror.rehearsal).toEqual(canonical.rehearsal);
    for (const path of [canonical.rehearsal.schema_path, canonical.rehearsal.verb_path]) {
      expect(existsSync(join(ROOT, path)), path).toBe(true);
      expect(git(ROOT, ['ls-files', '--error-unmatch', path]), path).toBe(path);
    }
  });

  it('emits a deterministic exact-range manifest from a candidate-only fresh clone', () => {
    const { root, base, candidate } = fixture();
    prepareCloseState(root, base, candidate);
    const first = run(root, manifestArgs(candidate));
    const second = run(root, manifestArgs(candidate));
    expect(first.status, first.stderr).toBe(0);
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toBe(first.stdout);
    const output = JSON.parse(first.stdout as string) as {
      manifest: {
        exact_base: string;
        governed_range: { commits: string[] };
        clean_clone: { alternates: boolean; refs: string[] };
        manifest_digest_sha256: string;
      };
    };
    expect(output.manifest.exact_base).toBe(base);
    expect(output.manifest.governed_range.commits).toEqual([candidate]);
    expect(output.manifest.clean_clone.alternates).toBe(false);
    expect(output.manifest.clean_clone.refs).toEqual([
      'refs/heads/candidate',
      'refs/remotes/origin/candidate',
    ]);
    expect(output.manifest.manifest_digest_sha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('rejects omitted role paths and prefix-like glob variants', () => {
    const { root, base } = fixture();
    put(root, 'packages2/escape.ts', 'export const escaped = true;\n');
    const candidate = commit(root, 'DEVAI Engineer', 'build(r0006): try prefix escape', [
      'packages2/escape.ts',
    ]);
    prepareCloseState(root, base, candidate);
    const result = run(root, manifestArgs(candidate));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'ROLE_PATH_VIOLATION' })]),
    );
  });

  it('fails closed on malformed manifest state instead of crashing or accepting it', () => {
    const { root, candidate } = fixture();
    put(root, '.devai/state/round-runs/R-0006/close/convergence.json', '{not-json\n');
    const result = run(root, manifestArgs(candidate));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'MANIFEST_STATE_MALFORMED' })]),
    );
  });

  it('admits one exact Auditor record and only a reproducible Architect projection', () => {
    const current = fixture();
    const admittedPolicy = policy({
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
        allowed_projection_ids: ['fixture-projection'],
      },
    });
    put(current.root, 'law/policy/round-close-controls.json', admittedPolicy);
    put(current.root, '.devai/config/round-close-controls.json', admittedPolicy);
    put(
      current.root,
      'fixture/projection.mjs',
      "import { readFileSync } from 'node:fs';\nconst source = readFileSync('work/audit/R-0006/review.md', 'utf8');\nconst output = readFileSync('docs/generated/review.md', 'utf8');\nprocess.exitCode = source === output ? 0 : 1;\n",
    );
    const reviewed = commit(
      current.root,
      'DEVAI Architect',
      'law(r0006): admit fixture projection',
      [
        'law/policy/round-close-controls.json',
        '.devai/config/round-close-controls.json',
        'fixture/projection.mjs',
      ],
    );
    put(current.root, 'work/audit/R-0006/review.md', 'PASS\n');
    commit(current.root, 'DEVAI Auditor', 'audit(r0006): record independent review', [
      'work/audit/R-0006/review.md',
    ]);
    put(current.root, 'docs/generated/review.md', 'PASS\n');
    commit(current.root, 'DEVAI Architect', 'docs(r0006): reproduce review projection', [
      'docs/generated/review.md',
    ]);
    const result = run(current.root, [
      'envelope',
      '--reviewed-sha',
      reviewed,
      '--head',
      git(current.root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(result.status, result.stderr).toBe(0);
  });
});
