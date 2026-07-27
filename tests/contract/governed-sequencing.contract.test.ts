// Invariants: INV-DEVAI-002, INV-DEVAI-003
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const script = join(repositoryRoot, 'scripts/check-governed-sequencing.mjs');
const policy = join(repositoryRoot, 'law/policy/governed-sequencing.json');
const canonicalAuthorityPolicy = join(repositoryRoot, 'packages/cli/src/authority/policy.ts');
const roots: string[] = [];

function put(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, author: string, subject: string, path: string): string {
  put(root, path, `${subject}\n`);
  git(root, ['add', path]);
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

interface BindingSpec {
  readonly round: string;
  readonly implementation_commits: string[];
  readonly law_commits: string[];
  readonly red_evidence: {
    readonly commit: string;
    readonly observed_exit: number;
    readonly command: string;
    readonly tests: string[];
    readonly exercised_implementation_paths: string[];
  };
}

interface CommitException {
  readonly round: string;
  readonly implementation_commits: string[];
  readonly reason: string;
}

function configureBindings(
  root: string,
  bindings: readonly BindingSpec[],
  historicalCommitExceptions: readonly CommitException[] = [],
  legacyRoundExceptions: readonly { readonly round: string; readonly reason: string }[] = [],
): void {
  const evidencePath = 'work/audit/fixture/red-evidence.json';
  const evidence = `${JSON.stringify(
    {
      observations: bindings.map(({ red_evidence: red }) => ({
        commit: red.commit,
        command: red.command,
        exit_code: red.observed_exit,
        tests: red.tests,
        exercised_implementation_paths: red.exercised_implementation_paths,
      })),
    },
    null,
    2,
  )}\n`;
  put(root, evidencePath, evidence);
  const document = JSON.parse(readFileSync(policy, 'utf8')) as Record<string, unknown>;
  document['bindings'] = bindings.map((binding) => ({
    ...binding,
    red_evidence: {
      ...binding.red_evidence,
      evidence_path: evidencePath,
      evidence_sha256: createHash('sha256').update(evidence).digest('hex'),
    },
  }));
  document['historical_commit_exceptions'] = historicalCommitExceptions;
  document['historical_exceptions'] = legacyRoundExceptions;
  put(root, 'law/policy/governed-sequencing.json', `${JSON.stringify(document, null, 2)}\n`);
}

function fixture(): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), 'devai-sequencing-'));
  roots.push(root);
  git(root, ['init', '-q']);
  put(root, 'law/policy/governed-sequencing.json', readFileSync(policy, 'utf8'));
  put(root, 'packages/cli/src/authority/policy.ts', readFileSync(canonicalAuthorityPolicy, 'utf8'));
  commit(root, 'DEVAI Architect', 'chore: establish fixture', 'README.md');
  return { root, base: git(root, ['rev-parse', 'HEAD']) };
}

function check(root: string, base: string): ReturnType<typeof spawnSync> {
  return spawnSync(
    process.execPath,
    [script, '--repo-root', root, '--base', base, '--head', 'HEAD', '--json'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('governed sequencing', () => {
  it('accepts law, red contract, then implementation for one attributed round', () => {
    const { root, base } = fixture();
    const law = commit(
      root,
      'DEVAI Architect',
      'law(r0006): declare fixture',
      'law/decisions/D-999.md',
    );
    const red = commit(
      root,
      'DEVAI Inspector',
      'test(r0006): packages/fixture/index.ts',
      'tests/fixture.test.ts',
    );
    const implementation = commit(
      root,
      'DEVAI Engineer',
      'feat(r0006): repair fixture',
      'packages/fixture/index.ts',
    );
    configureBindings(root, [
      {
        round: 'R-0006',
        implementation_commits: [implementation],
        law_commits: [law],
        red_evidence: {
          commit: red,
          observed_exit: 1,
          command: 'pnpm vitest run tests/fixture.test.ts',
          tests: ['tests/fixture.test.ts'],
          exercised_implementation_paths: ['packages/fixture/index.ts'],
        },
      },
    ]);

    const result = check(root, base);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout as string)).toMatchObject({ ok: true, commits_checked: 3 });
  });

  it('rejects implementation before both governing law and red contract', () => {
    const { root, base } = fixture();
    const implementation = commit(
      root,
      'DEVAI Engineer',
      'feat(r0006): skip the gates',
      'packages/fixture/index.ts',
    );
    const law = commit(root, 'DEVAI Architect', 'law(r0006): too late', 'law/decisions/D-999.md');
    const red = commit(root, 'DEVAI Inspector', 'test(r0006): too late', 'tests/fixture.test.ts');
    configureBindings(root, [
      {
        round: 'R-0006',
        implementation_commits: [implementation],
        law_commits: [law],
        red_evidence: {
          commit: red,
          observed_exit: 1,
          command: 'pnpm vitest run tests/fixture.test.ts',
          tests: ['tests/fixture.test.ts'],
          exercised_implementation_paths: ['packages/fixture/index.ts'],
        },
      },
    ]);

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ rule: 'law-before-implementation' }),
        expect.objectContaining({ rule: 'red-before-repair' }),
      ]),
    });
  });

  it('rejects unrelated, already-green, hash-mismatched, and duplicate bindings', () => {
    const { root, base } = fixture();
    const law = commit(
      root,
      'DEVAI Architect',
      'law(r0006): declare fixture',
      'law/decisions/D-999.md',
    );
    const red = commit(
      root,
      'DEVAI Inspector',
      'test(r0006): packages/fixture/index.ts',
      'tests/fixture.test.ts',
    );
    const implementation = commit(
      root,
      'DEVAI Engineer',
      'feat(r0006): repair fixture',
      'packages/fixture/index.ts',
    );
    const binding: BindingSpec = {
      round: 'R-0006',
      implementation_commits: [implementation],
      law_commits: [law],
      red_evidence: {
        commit: red,
        observed_exit: 0,
        command: 'pnpm vitest run tests/fixture.test.ts',
        tests: ['tests/unrelated.test.ts'],
        exercised_implementation_paths: ['packages/fixture/index.ts'],
      },
    };
    configureBindings(root, [binding, binding]);
    const documentPath = join(root, 'law/policy/governed-sequencing.json');
    const document = JSON.parse(readFileSync(documentPath, 'utf8')) as {
      bindings: Array<{ red_evidence: { evidence_sha256: string } }>;
    };
    const firstBinding = document.bindings[0];
    expect(firstBinding).toBeDefined();
    if (firstBinding === undefined) throw new Error('fixture binding missing');
    firstBinding.red_evidence.evidence_sha256 = 'f'.repeat(64);
    writeFileSync(documentPath, `${JSON.stringify(document, null, 2)}\n`);

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ rule: 'red-before-repair' }),
        expect.objectContaining({ rule: 'red-evidence-artifact' }),
        expect.objectContaining({ rule: 'implementation-binding' }),
      ]),
    });
  });

  it('rejects red evidence that does not exercise the exact implementation paths', () => {
    const { root, base } = fixture();
    const law = commit(
      root,
      'DEVAI Architect',
      'law(r0006): declare fixture',
      'law/decisions/D-999.md',
    );
    const red = commit(
      root,
      'DEVAI Inspector',
      'test(r0006): packages/unrelated/index.ts',
      'tests/fixture.test.ts',
    );
    const implementation = commit(
      root,
      'DEVAI Engineer',
      'feat(r0006): repair fixture',
      'packages/fixture/index.ts',
    );
    configureBindings(root, [
      {
        round: 'R-0006',
        implementation_commits: [implementation],
        law_commits: [law],
        red_evidence: {
          commit: red,
          observed_exit: 1,
          command: 'pnpm vitest run tests/fixture.test.ts',
          tests: ['tests/fixture.test.ts'],
          exercised_implementation_paths: ['packages/unrelated/index.ts'],
        },
      },
    ]);

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([expect.objectContaining({ rule: 'red-semantic-scope' })]),
    });
  });

  it('admits only an exact disclosed historical implementation exception', () => {
    const { root, base } = fixture();
    const implementation = commit(
      root,
      'DEVAI Engineer',
      'fix(r0006): disclose historical inversion',
      'packages/fixture/index.ts',
    );
    configureBindings(
      root,
      [],
      [
        {
          round: 'R-0006',
          implementation_commits: [implementation],
          reason: 'An independent review disclosed this exact historical inversion.',
        },
      ],
    );

    const result = check(root, base);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout as string)).toMatchObject({ ok: true, commits_checked: 1 });
  });

  it.each([
    'apps/fixture/index.ts',
    'pnpm-workspace.yaml',
    '.prettierignore',
    'eslint.config.mjs',
    'vitest.workspace.ts',
    '.devai/config/fixture.json',
    '.devai/pin/fixture.json',
  ])(
    'rejects unbound Engineer work on governed implementation surface %s',
    (implementationPath) => {
      const { root, base } = fixture();
      commit(root, 'DEVAI Engineer', 'feat(r0006): bypass narrow classifier', implementationPath);
      configureBindings(root, []);

      const result = check(root, base);
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout as string)).toMatchObject({
        ok: false,
        findings: expect.arrayContaining([
          expect.objectContaining({ rule: 'implementation-binding' }),
        ]),
      });
    },
  );

  it('rejects root-glob policy divergence from canonical Engineer authority', () => {
    const { root, base } = fixture();
    configureBindings(root, []);
    const documentPath = join(root, 'law/policy/governed-sequencing.json');
    const document = JSON.parse(readFileSync(documentPath, 'utf8')) as {
      implementation_surfaces: { root_globs: string[] };
    };
    document.implementation_surfaces.root_globs =
      document.implementation_surfaces.root_globs.filter((glob) => glob !== '.prettier*');
    writeFileSync(documentPath, `${JSON.stringify(document, null, 2)}\n`);

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ rule: 'implementation-surface-parity' }),
      ]),
    });
  });

  it('rejects a prospective round-wide historical exception', () => {
    const { root, base } = fixture();
    commit(
      root,
      'DEVAI Engineer',
      'feat(r0006): request round-wide bypass',
      'packages/fixture/index.ts',
    );
    configureBindings(
      root,
      [],
      [],
      [{ round: 'R-0006', reason: 'Prospective rounds must never receive this bypass.' }],
    );

    const result = check(root, base);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout as string)).toMatchObject({
      ok: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ rule: 'round-exception-bypass' }),
      ]),
    });
  });
});
