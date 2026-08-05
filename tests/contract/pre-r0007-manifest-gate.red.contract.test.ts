// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective red for R7-F013 (IMPLEMENTATION_PATH_MANIFEST_UNENFORCED), recorded under
// DII-253. The implementation-path manifest existed only as an Auditor procedure and was
// checked after the Engineer commit for R7-F012, so it disclosed an unnamed path rather
// than preventing it. A control that runs after the act it governs is a report, not a gate.
//
// The exact implementation surfaces this repair may touch are enumerated in
// tests/contract/pre-r0007-manifest-gate.implementation-paths.json.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 120_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const GATE = 'scripts/check-implementation-path-manifest.mjs';
const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function git(root: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function write(root: string, relativePath: string, contents: string): void {
  const absolute = join(root, relativePath);
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

/**
 * A miniature governed history: the gate is generic over any repository carrying the
 * declaration, so the contract does not need the full DEVAI fixture to exercise it.
 */
function history(manifestPaths: readonly string[], engineerPaths: readonly string[]) {
  const root = mkdtempSync(join(tmpdir(), 'devai-manifest-gate-'));
  roots.push(root);
  git(root, ['init', '-q']);
  write(root, 'seed.txt', 'seed\n');
  const boundary = commitAs(root, 'DEVAI Architect', 'seed');
  write(
    root,
    'law/policy/governed-sequencing.json',
    `${JSON.stringify(
      {
        implementation_surfaces: {
          prefixes: ['packages/', 'scripts/', '.devai/config/'],
          root_globs: ['package.json'],
        },
        implementation_path_manifests: {
          required_after_commit: boundary,
          manifest_suffix: '.implementation-paths.json',
        },
      },
      null,
      2,
    )}\n`,
  );
  commitAs(root, 'DEVAI Architect', 'declare the gate');
  write(
    root,
    'tests/contract/subject.implementation-paths.json',
    `${JSON.stringify({ allowed_paths: manifestPaths }, null, 2)}\n`,
  );
  commitAs(root, 'DEVAI Inspector', 'declare the allowed implementation paths');
  for (const path of engineerPaths) write(root, path, 'implementation\n');
  const engineer = commitAs(root, 'DEVAI Engineer', 'implement');
  return { root, engineer };
}

function runGate(root: string): { status: number; output: string } {
  const result = execFileSync(
    'node',
    [join(ROOT, GATE), '--repo-root', root],
    { encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as unknown as string;
  return { status: 0, output: result };
}

function runGateAllowingFailure(root: string): { status: number; output: string } {
  try {
    return runGate(root);
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
    };
  }
}

describe('R7-F013 implementation-path manifest is unenforced', () => {
  it('R7-023-MANIFEST-GATE-EXISTS ships the gate and wires it into governance', () => {
    expect(
      existsSync(join(ROOT, GATE)),
      'scripts/check-implementation-path-manifest.mjs must exist',
    ).toBe(true);
    const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    // Wired into the existing chain rather than added to the roster: the sixteen literal
    // convergence commands are authoritative and are not altered to accommodate a control.
    expect(
      manifest.scripts['ci:governance'],
      'package.json must run the manifest gate inside ci:governance',
    ).toContain('check-implementation-path-manifest.mjs');
  });

  it('R7-023-MANIFEST-GATE-REJECTS-UNNAMED-PATH blocks a diff outside the manifest', () => {
    const { root } = history(
      ['packages/named.ts'],
      ['packages/named.ts', 'scripts/unnamed-by-the-manifest.mjs'],
    );
    const outcome = runGateAllowingFailure(root);
    expect(outcome.status, outcome.output).not.toBe(0);
    expect(outcome.output).toContain('scripts/unnamed-by-the-manifest.mjs');
  });

  it('R7-023-MANIFEST-GATE-ACCEPTS-NAMED-PATH passes when every path is declared', () => {
    const { root } = history(
      ['packages/named.ts', 'scripts/also-named.mjs'],
      ['packages/named.ts', 'scripts/also-named.mjs'],
    );
    const outcome = runGateAllowingFailure(root);
    expect(outcome.status, outcome.output).toBe(0);
  });

  it('R7-023-MANIFEST-GATE-IGNORES-NON-IMPLEMENTATION blocks nothing for a docs-only diff', () => {
    const { root } = history(['packages/named.ts'], ['docs/note.md']);
    const outcome = runGateAllowingFailure(root);
    expect(outcome.status, outcome.output).toBe(0);
  });

  it('R7-023-MANIFEST-GATE-UNREACHABLE-BOUNDARY-IS-NOT-APPLICABLE leaves a foreign history alone', () => {
    // Every contract fixture is a fresh history that copies the real governed-sequencing
    // policy, so it carries a boundary commit it cannot contain. A declaration bound to a
    // commit outside a history does not govern that history: it is not applicable, and
    // treating it as a violation made the gate fail closed inside every fixture that runs
    // the literal ci:governance command.
    const root = mkdtempSync(join(tmpdir(), 'devai-manifest-gate-foreign-'));
    roots.push(root);
    git(root, ['init', '-q']);
    write(
      root,
      'law/policy/governed-sequencing.json',
      `${JSON.stringify(
        {
          implementation_surfaces: { prefixes: ['scripts/'], root_globs: [] },
          implementation_path_manifests: {
            required_after_commit: '0'.repeat(40),
            manifest_suffix: '.implementation-paths.json',
          },
        },
        null,
        2,
      )}\n`,
    );
    commitAs(root, 'DEVAI Architect', 'seed a history the boundary cannot reach');
    const outcome = runGateAllowingFailure(root);
    expect(outcome.status, outcome.output).toBe(0);
    expect(outcome.output).toContain('not applicable');
  });
});
