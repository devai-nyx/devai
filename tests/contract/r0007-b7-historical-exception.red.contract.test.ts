// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective red for the OM-022 exact historical sequencing disposition. The exception is
// deliberately narrower than a manifest: it admits that the parent-tree rule was not met and
// names only immutable commits whose defect has already been preserved by the B7 Auditor.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const GATE = join(ROOT, 'scripts/check-implementation-path-manifest.mjs');
const roots: string[] = [];
const EXPECTED_OM022_COMMITS = [
  '4a2f8a448db576957ece984c9611a19383525be1',
  'e173023f275614ad25001c84b70886ff3e85e7b1',
  '036edf4e9d4031d8e44eb72ef33dfeaf9e944d4a',
  '60b29f8d2442176592c136cc5e5720532304bc16',
  '952b33ef7eeb28b00b54d07be860b8e17cb95200',
  'a1860416252aee63830321025b966471f1c36380',
  '3104ac789f00058e842fad2fac56646fa4f83664',
  'e0ea48e456ba4b8f2121cf0841e1480c94584298',
  '6cd45d09b4f09b4d566013e05cd521455100ddb2',
  '3aac8173b9be76e94cfb7efedecd36adf116b62e',
  'c0621d31c16ca59b388984d896c6fd196ea2ba4f',
  '9fb02c3da078fd3af312482590d6da1c803a5b3d',
  'ff076d203338c3d6b40108342e3ef25d9a4e785e',
  '0763eb3c1bb393761f0e6fb9149d76252586a740',
  '3ac6fc6f3d9069915326c3778c96318d23c51ab4',
  '9717369fb0533a5c65380ff37dce420128bf2782',
  '5c741cd5f3a8ecf6019cf61d34dee9e1d9e7de68',
  'c951ccf1b88e85fd8cd3ca8b2c465208083336a7',
] as const;

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function write(root: string, path: string, contents: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents);
}

function commitAs(root: string, author: string, subject: string): string {
  git(root, ['add', '-A']);
  git(root, [
    '-c',
    `user.name=${author}`,
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '-qm',
    subject,
  ]);
  return git(root, ['rev-parse', 'HEAD']);
}

interface ExceptionEntry {
  readonly round: string;
  readonly implementation_commits: readonly string[];
  readonly reason: string;
}

interface NormalBinding {
  readonly round: string;
  readonly implementation_commits: readonly string[];
}

interface Fixture {
  readonly root: string;
  readonly engineer: string;
  readonly boundary: string;
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'devai-r7-historical-exception-'));
  roots.push(root);
  git(root, ['init', '-q']);
  write(root, 'seed.txt', 'seed\n');
  const boundary = commitAs(root, 'DEVAI Architect', 'seed');
  writePolicy(root, boundary, []);
  commitAs(root, 'DEVAI Architect', 'declare manifest gate');
  write(root, 'packages/subject.ts', 'export const subject = true;\n');
  const engineer = commitAs(root, 'DEVAI Engineer', 'implement without a prior manifest');
  return { root, engineer, boundary };
}

function writePolicy(
  root: string,
  boundary: string,
  exceptions: readonly ExceptionEntry[],
  roundExceptions: readonly unknown[] = [],
  bindings: readonly NormalBinding[] = [],
): void {
  write(
    root,
    'law/policy/governed-sequencing.json',
    `${JSON.stringify(
      {
        implementation_surfaces: { prefixes: ['packages/', 'scripts/'], root_globs: [] },
        implementation_path_manifests: {
          required_after_commit: boundary,
          manifest_suffix: '.implementation-paths.json',
        },
        historical_commit_exceptions: exceptions,
        ...(roundExceptions.length > 0 ? { historical_exceptions: roundExceptions } : {}),
        bindings,
      },
      null,
      2,
    )}\n`,
  );
}

function disposition(root: string, boundary: string, exceptions: readonly ExceptionEntry[]): void {
  writePolicy(root, boundary, exceptions);
  commitAs(root, 'DEVAI Architect', 'record exact historical disposition');
}

function run(root: string): { readonly status: number; readonly output: string } {
  try {
    const output = execFileSync('node', [GATE, '--repo-root', root], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
    };
  }
}

function exactException(commit: string): ExceptionEntry {
  return {
    round: 'R-0007',
    implementation_commits: [commit],
    reason: 'OM-022 exact immutable historical disposition; no prospective exception.',
  };
}

describe('R-0007 B7 exact historical manifest exceptions', () => {
  it('R7-B7-HISTORICAL-000 binds the exact OM-022 population once and no wider', () => {
    const policy = JSON.parse(
      readFileSync(join(ROOT, 'law/policy/governed-sequencing.json'), 'utf8'),
    ) as { historical_commit_exceptions?: ExceptionEntry[] };
    const observed = (policy.historical_commit_exceptions ?? [])
      .filter(({ round, reason }) => round === 'R-0007' && reason.includes('OM-022'))
      .flatMap(({ implementation_commits }) => implementation_commits);
    expect(observed).toEqual(EXPECTED_OM022_COMMITS);
    expect(new Set(observed).size).toBe(EXPECTED_OM022_COMMITS.length);
  });

  it('R7-B7-HISTORICAL-001 accepts only the exact disclosed Engineer commit', () => {
    const { root, engineer, boundary } = fixture();
    disposition(root, boundary, [exactException(engineer)]);
    const outcome = run(root);
    expect(outcome.status, outcome.output).toBe(0);
  });

  it('R7-B7-HISTORICAL-002 does not let one exact exception authorize a later Engineer commit', () => {
    const { root, engineer, boundary } = fixture();
    disposition(root, boundary, [exactException(engineer)]);
    write(root, 'packages/later.ts', 'export const later = true;\n');
    commitAs(root, 'DEVAI Engineer', 'later implementation remains prospective');
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('packages/later.ts');
  });

  it('R7-B7-HISTORICAL-003 rejects duplicate exception ownership', () => {
    const { root, engineer, boundary } = fixture();
    disposition(root, boundary, [exactException(engineer), exactException(engineer)]);
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('duplicate');
  });

  it('R7-B7-HISTORICAL-004 rejects an exception naming a non-Engineer commit', () => {
    const { root, boundary } = fixture();
    disposition(root, boundary, [exactException(boundary)]);
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('substantive Engineer commit');
  });

  it('R7-B7-HISTORICAL-005 refuses a round-wide historical bypass', () => {
    const { root, boundary } = fixture();
    writePolicy(root, boundary, [], [{ round: 'R-0007', reason: 'forbidden round bypass' }]);
    commitAs(root, 'DEVAI Architect', 'attempt a round-wide bypass');
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('round-wide historical exceptions');
  });

  it.each([
    [
      'non-SHA commit identity',
      { round: 'R-0007', implementation_commits: ['not-a-commit'], reason: 'invalid' },
    ],
    ['empty reason', { round: 'R-0007', implementation_commits: ['0'.repeat(40)], reason: '' }],
    ['missing round', { implementation_commits: ['0'.repeat(40)], reason: 'invalid' }],
  ])('R7-B7-HISTORICAL-006 rejects malformed entries: %s', (_label, malformed) => {
    const { root, boundary } = fixture();
    writePolicy(root, boundary, [malformed as ExceptionEntry]);
    commitAs(root, 'DEVAI Architect', 'attempt malformed historical disposition');
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('malformed historical commit exception');
  });

  it('R7-B7-HISTORICAL-007 rejects exception ownership when a different round normally binds the commit', () => {
    const { root, engineer, boundary } = fixture();
    writePolicy(
      root,
      boundary,
      [exactException(engineer)],
      [],
      [{ round: 'R-0008', implementation_commits: [engineer] }],
    );
    commitAs(root, 'DEVAI Architect', 'attempt conflicting wrong-round ownership');
    const outcome = run(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('already has normal governed-sequencing ownership');
  });
});
