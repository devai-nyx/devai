// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 15_000 });

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
        Engineer: ['.devai/config/**', 'packages/**', 'scripts/**', 'package.json'],
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
          { id: 'ordinary', argv: ['node', 'fixture/gate.mjs', 'ordinary'] },
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
        command: ['node', 'fixture/phase-close.mjs'],
        range_check: ['node', 'fixture/range-check.mjs'],
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
  put(
    root,
    'fixture/gate.mjs',
    "import { mkdirSync, writeFileSync } from 'node:fs';\nif (process.argv[2] === 'ordinary') { mkdirSync('scratch/coverage/t1-t3', { recursive: true }); writeFileSync('scratch/coverage/t1-t3/coverage-summary.json', JSON.stringify({ total: Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((key) => [key, { pct: 100 }])) }) + '\\n'); }\n",
  );
  put(root, 'fixture/projection.mjs', 'process.exit(0);\n');
  put(
    root,
    'fixture/phase-close.mjs',
    "import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';\nconst draft = JSON.parse(readFileSync(0, 'utf8'));\nconst path = 'record/proofs/compliance/closures/PC-9999.json';\nconst record = { ...draft, schemaVersion: '1.0.0', id: 'PC-9999' };\nmkdirSync('record/proofs/compliance/closures', { recursive: true });\nwriteFileSync(path, JSON.stringify(record) + '\\n');\nprocess.stdout.write(JSON.stringify({ ok: true, path, record }) + '\\n');\n",
  );
  put(
    root,
    'fixture/range-check.mjs',
    "const value = (name) => process.argv[process.argv.indexOf(name) + 1];\nprocess.stdout.write(JSON.stringify({ ok: true, base: value('--base'), head: value('--head'), commits_checked: 1, findings: [] }) + '\\n');\n",
  );
  put(root, 'product/fixture.json', '{}\n');
  put(root, 'packages/fixture/index.ts', 'export const fixture = true;\n');
  put(root, 'tests/fixture.test.ts', 'export const fixtureTest = true;\n');
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
    'fixture/phase-close.mjs',
    'fixture/range-check.mjs',
    'product/fixture.json',
    'packages/fixture/index.ts',
    'tests/fixture.test.ts',
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

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonicalValue((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function digestBody(value: unknown): string {
  return createHash('sha256')
    .update(`${JSON.stringify(canonicalValue(value))}\n`)
    .digest('hex');
}

function putReviewManifest(root: string, candidate: string): string {
  const body = { review_candidate: candidate, published_head: candidate };
  const digest = digestBody(body);
  put(
    root,
    '.devai/state/round-runs/R-0006/close/candidate-manifest.json',
    `${JSON.stringify({ ...body, manifest_digest_sha256: digest })}\n`,
  );
  return digest;
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
  }, 15_000);

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

  it('refuses to label convergence with a head other than the checked-out candidate', () => {
    const current = fixture();
    put(current.root, 'law/policy/after-candidate.json', '{}\n');
    commit(current.root, 'DEVAI Architect', 'law(r0006): advance fixture head', [
      'law/policy/after-candidate.json',
    ]);
    const result = run(current.root, [
      'converge',
      '--round',
      'R-0006',
      '--base',
      current.base,
      '--head',
      current.candidate,
    ]);
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'CONVERGENCE_HEAD_MISMATCH' })]),
    );
  });

  it('requires the ordinary full Vitest floor in each convergence pass', () => {
    const canonical = JSON.parse(
      readFileSync(join(ROOT, 'law/policy/round-close-controls.json'), 'utf8'),
    ) as { convergence: { commands: Array<{ id: string; argv: string[] }> } };
    expect(canonical.convergence.commands).toContainEqual({
      id: 'ordinary',
      argv: ['pnpm', 'vitest', 'run'],
    });
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
    expect(rehearsal.result).toMatchObject({
      production_verb_exercised: true,
      record_schema_valid: true,
      exact_range_valid: true,
    });

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
    const validAssertions = {
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
    };
    const invalidPolicies = [
      { semantic_assertions: { ...validAssertions, fixed_count: 56 } },
      {
        semantic_assertions: {
          ...validAssertions,
          compare: ['law/trace.json', 'law/trace.json'],
        },
      },
      { semantic_assertions: { ...validAssertions, population_sources: ['tests/one.test.ts'] } },
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
  }, 15_000);

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
  }, 15_000);

  it('accepts only an exact decision-bound historical role-path exception', () => {
    const current = fixture();
    put(current.root, 'tests/config/historical-provider.ts', 'export const provider = true;\n');
    const historical = commit(
      current.root,
      'DEVAI Engineer',
      'test(r0006): preserve historical ownership mismatch',
      ['tests/config/historical-provider.ts'],
    );
    const configured = policy({
      role_path_exceptions: [
        {
          commit: historical,
          role: 'Engineer',
          paths: ['tests/config/historical-provider.ts'],
          decision_id: 'DII-207',
          reason: 'Exact immutable fixture history; tests remains Inspector-owned.',
        },
      ],
    });
    put(current.root, 'law/policy/round-close-controls.json', configured);
    commit(current.root, 'DEVAI Architect', 'law(r0006): classify fixture mismatch', [
      'law/policy/round-close-controls.json',
    ]);
    put(current.root, '.devai/config/round-close-controls.json', configured);
    const candidate = commit(current.root, 'DEVAI Engineer', 'build(r0006): materialize policy', [
      '.devai/config/round-close-controls.json',
    ]);
    prepareCloseState(current.root, current.base, candidate);
    const result = run(current.root, manifestArgs(candidate));
    expect(result.status, result.stderr).toBe(0);
  }, 15_000);

  it('rejects a historical role-path exception with an unused extra path', () => {
    const current = fixture();
    put(current.root, 'tests/config/historical-provider.ts', 'export const provider = true;\n');
    const historical = commit(
      current.root,
      'DEVAI Engineer',
      'test(r0006): preserve historical ownership mismatch',
      ['tests/config/historical-provider.ts'],
    );
    const configured = policy({
      role_path_exceptions: [
        {
          commit: historical,
          role: 'Engineer',
          paths: ['tests/config/historical-provider.ts', 'tests/config/not-changed.ts'],
          decision_id: 'DII-207',
          reason: 'This extra path must fail closed.',
        },
      ],
    });
    put(current.root, 'law/policy/round-close-controls.json', configured);
    commit(current.root, 'DEVAI Architect', 'law(r0006): classify fixture mismatch', [
      'law/policy/round-close-controls.json',
    ]);
    put(current.root, '.devai/config/round-close-controls.json', configured);
    const candidate = commit(current.root, 'DEVAI Engineer', 'build(r0006): materialize policy', [
      '.devai/config/round-close-controls.json',
    ]);
    prepareCloseState(current.root, current.base, candidate);
    const result = run(current.root, manifestArgs(candidate));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ROLE_PATH_EXCEPTION_PATH_MISMATCH' }),
      ]),
    );
  }, 15_000);

  it('fails closed on malformed manifest state instead of crashing or accepting it', () => {
    const { root, candidate } = fixture();
    put(root, '.devai/state/round-runs/R-0006/close/convergence.json', '{not-json\n');
    const result = run(root, manifestArgs(candidate));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'MANIFEST_STATE_MALFORMED' })]),
    );
  });

  it('rejects well-formed but forged convergence and rehearsal state', () => {
    const current = fixture();
    const fakeResult = {
      id: 'stage2',
      argv: ['pnpm', 'run', 'ci:stage2'],
      exit_code: 0,
      outcome: 'pass',
      stdout_sha256: '1'.repeat(64),
      stderr_sha256: '2'.repeat(64),
    };
    put(
      current.root,
      '.devai/state/round-runs/R-0006/close/convergence.json',
      `${JSON.stringify({
        ok: true,
        base: current.base,
        head: current.candidate,
        passes: [
          {
            pass: 1,
            results: [fakeResult],
            clean_before: true,
            clean_after: true,
          },
        ],
        findings: [],
      })}\n`,
    );
    put(
      current.root,
      '.devai/state/round-runs/R-0006/close/closure-rehearsal.json',
      `${JSON.stringify({
        ok: true,
        base: current.base,
        candidate: current.candidate,
        result: {
          source_merge: '1'.repeat(40),
          closure_head: '2'.repeat(40),
          schema_ancestor: '3'.repeat(40),
          verb_ancestor: '4'.repeat(40),
          ok: true,
        },
      })}\n`,
    );
    put(
      current.root,
      'scratch/coverage/t1-t3/coverage-summary.json',
      `${JSON.stringify({
        total: Object.fromEntries(
          ['statements', 'branches', 'functions', 'lines'].map((key) => [key, { pct: 100 }]),
        ),
      })}\n`,
    );
    const result = run(current.root, manifestArgs(current.candidate));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CONVERGENCE_STATE_INVALID' }),
        expect.objectContaining({ code: 'CLOSURE_REHEARSAL_INVALID' }),
      ]),
    );
  });

  it('rejects convergence and closure evidence from a prior candidate head', () => {
    const current = fixture();
    prepareCloseState(current.root, current.base, current.candidate);
    put(
      current.root,
      'law/register/DECISIONS.md',
      `${readFileSync(join(current.root, 'law/register/DECISIONS.md'), 'utf8')}\nsemantic change\n`,
    );
    const changed = commit(current.root, 'DEVAI Architect', 'law(r0006): change candidate', [
      'law/register/DECISIONS.md',
    ]);
    const result = run(current.root, manifestArgs(changed));
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CONVERGENCE_RESULT_STALE' }),
        expect.objectContaining({ code: 'CLOSURE_REHEARSAL_STALE' }),
      ]),
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
    const manifestDigest = putReviewManifest(current.root, reviewed);
    const reviewRecord = `---\nverdict: PASS\nreviewer_model: claude-opus-5\nreview_candidate: ${reviewed}\nmanifest_digest_sha256: ${manifestDigest}\n---\n\n# Independent review\n`;
    put(current.root, 'work/audit/R-0006/review.md', reviewRecord);
    commit(current.root, 'DEVAI Auditor', 'audit(r0006): record independent review', [
      'work/audit/R-0006/review.md',
    ]);
    put(current.root, 'docs/generated/review.md', reviewRecord);
    commit(current.root, 'DEVAI Architect', 'docs(r0006): reproduce review projection', [
      'docs/generated/review.md',
    ]);
    const result = run(current.root, [
      'envelope',
      '--head',
      git(current.root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(result.status, result.stderr).toBe(0);
  });

  it('derives the frozen candidate from an exact PASS review record and manifest', () => {
    const current = fixture();
    const digest = putReviewManifest(current.root, current.candidate);
    put(
      current.root,
      'work/audit/R-0006/review.md',
      `---\nverdict: PASS\nreviewer_model: claude-opus-5\nreview_candidate: ${current.candidate}\nmanifest_digest_sha256: ${digest}\n---\n\n# Independent review\n`,
    );
    commit(current.root, 'DEVAI Auditor', 'audit(r0006): record independent review', [
      'work/audit/R-0006/review.md',
    ]);
    const result = run(current.root, [
      'envelope',
      '--head',
      git(current.root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(result.status, result.stderr).toBe(0);
  });

  it('rejects FAIL, malformed, wrong-candidate, and wrong-digest review records', () => {
    for (const review of [
      'verdict: FAIL\n',
      'not front matter\n',
      `---\nverdict: PASS\nreviewer_model: claude-opus-5\nreview_candidate: ${'1'.repeat(40)}\nmanifest_digest_sha256: ${'2'.repeat(64)}\n---\n`,
    ]) {
      const current = fixture();
      putReviewManifest(current.root, current.candidate);
      put(current.root, 'work/audit/R-0006/review.md', review);
      commit(current.root, 'DEVAI Auditor', 'audit(r0006): record invalid review', [
        'work/audit/R-0006/review.md',
      ]);
      const result = run(current.root, [
        'envelope',
        '--reviewed-sha',
        current.candidate,
        '--head',
        git(current.root, ['rev-parse', 'HEAD']),
        '--review-record',
        'work/audit/R-0006/review.md',
      ]);
      expect(result.status).not.toBe(0);
      expect(findings(result)).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'REVIEW_RECORD_INVALID' })]),
      );
    }
  });

  it('rejects empty wildcard populations and drift in every governed mirror pair', () => {
    const current = fixture();
    const validAssertions = {
      population_sources: ['missing/**/*.json'],
      fixed_counts_forbidden: true,
      self_comparisons_forbidden: true,
      named_file_only_forbidden: true,
      mirror_pairs: [
        {
          source: 'law/policy/round-close-controls.json',
          mirror: '.devai/config/round-close-controls.json',
        },
      ],
    };
    const emptyPolicy = policy({ semantic_assertions: validAssertions });
    put(current.root, 'law/policy/round-close-controls.json', emptyPolicy);
    put(current.root, '.devai/config/round-close-controls.json', emptyPolicy);
    const empty = run(current.root, ['policy-check']);
    expect(findings(empty)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'SEMANTIC_POPULATION_EMPTY' })]),
    );

    const pairs = [
      validAssertions.mirror_pairs[0],
      { source: 'law/policy/second.json', mirror: '.devai/config/second.json' },
    ];
    const pairPolicy = policy({
      semantic_assertions: {
        ...validAssertions,
        population_sources: ['law/**/*.json'],
        mirror_pairs: pairs,
      },
    });
    put(current.root, 'law/policy/round-close-controls.json', pairPolicy);
    put(current.root, '.devai/config/round-close-controls.json', pairPolicy);
    put(current.root, 'law/policy/second.json', '{"value":1}\n');
    put(current.root, '.devai/config/second.json', '{"value":2}\n');
    const drift = run(current.root, ['policy-check']);
    expect(findings(drift)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'POLICY_MIRROR_DRIFT' })]),
    );
  });

  it('rejects second-pass workspace, coverage-byte, and command-outcome drift', () => {
    const current = fixture();
    put(
      current.root,
      'fixture/gate.mjs',
      "import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';\nconst gate = process.argv[2];\nconst counterPath = 'scratch/pass-counter';\nif (gate === 'formatting') { mkdirSync('scratch', { recursive: true }); const pass = existsSync(counterPath) ? Number(readFileSync(counterPath, 'utf8')) + 1 : 1; writeFileSync(counterPath, String(pass)); if (pass === 2) process.exitCode = 1; }\nif (gate === 'ordinary') { const pass = Number(readFileSync(counterPath, 'utf8')); mkdirSync('scratch/coverage/t1-t3', { recursive: true }); writeFileSync('scratch/coverage/t1-t3/coverage-summary.json', JSON.stringify({ total: Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map((key) => [key, { pct: pass === 1 ? 100 : 99 }])) }) + '\\n'); }\n",
    );
    const head = commit(current.root, 'DEVAI Engineer', 'test: introduce pass-two drift', [
      'fixture/gate.mjs',
    ]);
    const result = run(current.root, [
      'converge',
      '--round',
      'R-0006',
      '--base',
      current.base,
      '--head',
      head,
    ]);
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining(
        [
          'CONVERGENCE_WRITE_DETECTED',
          'CONVERGENCE_COVERAGE_DRIFT',
          'CONVERGENCE_RESULT_DRIFT',
        ].map((code) => expect.objectContaining({ code })),
      ),
    );
  });

  it('rejects a caller-selected reviewed SHA even when the review record is valid', () => {
    const current = fixture();
    const digest = putReviewManifest(current.root, current.candidate);
    put(
      current.root,
      'work/audit/R-0006/review.md',
      `---\nverdict: PASS\nreviewer_model: claude-opus-5\nreview_candidate: ${current.candidate}\nmanifest_digest_sha256: ${digest}\n---\n`,
    );
    commit(current.root, 'DEVAI Auditor', 'audit(r0006): record independent review', [
      'work/audit/R-0006/review.md',
    ]);
    const result = run(current.root, [
      'envelope',
      '--reviewed-sha',
      current.candidate,
      '--head',
      git(current.root, ['rev-parse', 'HEAD']),
      '--review-record',
      'work/audit/R-0006/review.md',
    ]);
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'REVIEWED_SHA_CALLER_FORBIDDEN' })]),
    );
  });

  it('rejects a closure rehearsal when the configured exact-range checker rejects', () => {
    const current = fixture();
    put(
      current.root,
      'fixture/range-check.mjs',
      "process.stdout.write(JSON.stringify({ ok: false, commits_checked: 1, findings: [{ rule: 'fixture-reject' }] }) + '\\n');\nprocess.exitCode = 1;\n",
    );
    const candidate = commit(current.root, 'DEVAI Engineer', 'test: reject fixture range', [
      'fixture/range-check.mjs',
    ]);
    const result = run(current.root, [
      'rehearse',
      '--round',
      'R-0006',
      '--base',
      current.base,
      '--candidate',
      candidate,
    ]);
    expect(result.status).not.toBe(0);
    expect(findings(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CLOSURE_REHEARSAL_RANGE_INVALID' }),
        expect.objectContaining({ code: 'CLOSURE_REHEARSAL_NOT_PC_ONLY' }),
      ]),
    );
  });
});
