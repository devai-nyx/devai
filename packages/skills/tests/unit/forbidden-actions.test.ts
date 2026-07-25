import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CANONICAL_FORBIDDEN_ACTIONS,
  checkForbiddenRegistryCoverage,
  loadForbiddenWaivers,
  scanForbiddenActions,
} from '../../src/forbidden-actions/index.js';
import { withAuthorityHostTestScope } from './authority-host-test-scope.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

let dir = '';
let registryPath = '';

function writeRegistry(body: Record<string, unknown>): void {
  writeFileSync(registryPath, JSON.stringify(body, null, 2));
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'devai-forbidden-'));
  registryPath = join(dir, 'forbidden-actions.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('checkForbiddenRegistryCoverage', () => {
  it('reports full coverage when the registry carries every canonical entry', () => {
    writeRegistry({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS });
    const result = checkForbiddenRegistryCoverage(registryPath);
    expect(result.ok).toBe(true);
    expect(result.unwaived_missing).toEqual([]);
    expect(result.present).toHaveLength(CANONICAL_FORBIDDEN_ACTIONS.length);
    expect(result.canonical_total).toBe(CANONICAL_FORBIDDEN_ACTIONS.length);
  });

  it('reports an unwaived gap when a canonical entry is silently dropped', () => {
    const trimmed = CANONICAL_FORBIDDEN_ACTIONS.filter((e) => e.id !== 'FORBID-RM-RF');
    writeRegistry({ schemaVersion: '1.0.0', actions: trimmed });
    const result = checkForbiddenRegistryCoverage(registryPath);
    expect(result.ok).toBe(false);
    expect(result.unwaived_missing).toEqual(['FORBID-RM-RF']);
  });

  it('treats a waived entry as covered, not a gap', () => {
    const trimmed = CANONICAL_FORBIDDEN_ACTIONS.filter((e) => e.id !== 'FORBID-RM-RF');
    writeRegistry({
      schemaVersion: '1.0.0',
      actions: trimmed,
      waivers: [{ id: 'FORBID-RM-RF', reason: 'repo has no shell execution surface at all' }],
    });
    const result = checkForbiddenRegistryCoverage(registryPath);
    expect(result.ok).toBe(true);
    expect(result.unwaived_missing).toEqual([]);
    expect(result.waived).toEqual([
      { id: 'FORBID-RM-RF', reason: 'repo has no shell execution surface at all' },
    ]);
  });

  it('ignores waivers for non-canonical ids', () => {
    writeRegistry({
      schemaVersion: '1.0.0',
      actions: CANONICAL_FORBIDDEN_ACTIONS,
      waivers: [{ id: 'FORBID-NOT-REAL', reason: 'made up id, should be dropped from output' }],
    });
    const result = checkForbiddenRegistryCoverage(registryPath);
    expect(result.ok).toBe(true);
    expect(result.waived).toEqual([]);
  });

  it('treats client-added entries as additive and irrelevant to canonical coverage', () => {
    writeRegistry({
      schemaVersion: '1.0.0',
      actions: [
        ...CANONICAL_FORBIDDEN_ACTIONS,
        {
          id: 'FORBID-CLIENT-CUSTOM',
          action: 'Something this repo specifically forbids',
          rationale: 'local policy',
          severity: 'medium',
        },
      ],
    });
    const result = checkForbiddenRegistryCoverage(registryPath);
    expect(result.ok).toBe(true);
    expect(result.present).not.toContain('FORBID-CLIENT-CUSTOM');
  });

  it('treats a missing registry file as full non-coverage', () => {
    const result = checkForbiddenRegistryCoverage(join(dir, 'does-not-exist.json'));
    expect(result.ok).toBe(false);
    expect(result.unwaived_missing).toHaveLength(CANONICAL_FORBIDDEN_ACTIONS.length);
  });
});

describe('loadForbiddenWaivers', () => {
  it('returns an empty array when the file has no waivers field', () => {
    writeRegistry({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS });
    expect(loadForbiddenWaivers(registryPath)).toEqual([]);
  });

  it('returns an empty array for an unparseable file rather than throwing', () => {
    writeFileSync(registryPath, '{ not valid json');
    expect(loadForbiddenWaivers(registryPath)).toEqual([]);
  });
});

describe('scanForbiddenActions', () => {
  it('fails closed when the registry is missing or has no executable patterns', () => {
    expect(
      scanForbiddenActions({ repoRoot: dir, registryPath: join(dir, 'missing.json') }).findings,
    ).toContainEqual(expect.objectContaining({ forbidden_id: 'FORBIDDEN-REGISTRY-INVALID' }));

    writeRegistry({
      schemaVersion: '1.0.0',
      actions: CANONICAL_FORBIDDEN_ACTIONS.map(({ detect_patterns: _patterns, ...entry }) => entry),
    });
    expect(
      scanForbiddenActions({ repoRoot: dir, registryPath, maxCommits: 1 }).findings,
    ).toContainEqual(expect.objectContaining({ forbidden_id: 'FORBIDDEN-REGISTRY-INVALID' }));
    expect(checkForbiddenRegistryCoverage(registryPath).ok).toBe(false);
  });

  it('fails closed when the registry bytes are malformed', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    writeFileSync(join(dir, '.devai/config/forbidden-actions.json'), '{ malformed');
    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({ forbidden_id: 'FORBIDDEN-REGISTRY-INVALID' }),
    );
  });

  it('fails closed when committed history cannot be inspected', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({
        forbidden_id: 'FORBIDDEN-SCAN-UNAVAILABLE',
        source: 'commit-change',
      }),
    );
  });

  it('detects a forbidden law deletion hidden behind a neutral commit message', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    mkdirSync(join(dir, 'law'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, 'law/constitution.md'), 'governed\n');
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    rmSync(join(dir, 'law/constitution.md'));
    execFileSync('git', ['add', '-A'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'chore: tidy',
      ],
      { cwd: dir },
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({ forbidden_id: 'FORBID-DELETE-AUTHORITY-DOCS' }),
    );
  });

  it('does not vacuously suppress protected-path message evidence on an unrelated change', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    mkdirSync(join(dir, 'packages/demo'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, 'packages/demo/index.ts'), 'export {};\n');
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    writeFileSync(join(dir, 'packages/demo/index.ts'), 'export const changed = true;\n');
    execFileSync('git', ['add', 'packages/demo/index.ts'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'git add .devai/config/forbidden-actions.json',
      ],
      { cwd: dir },
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({
        forbidden_id: 'FORBID-MUTATE-INVARIANTS',
        source: 'commit-message',
      }),
    );
  });

  it.each([
    ['law/constitution.md', 'governed\n', 'changed\n'],
    ['law/trace.json', '{}\n', '{"changed":true}\n'],
    ['record/proofs/compliance/closures/PC-0001.json', '{}\n', '{"changed":true}\n'],
  ])('detects a neutral in-place mutation of %s', (path, initial, changed) => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    mkdirSync(join(dir, path.slice(0, path.lastIndexOf('/'))), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, path), initial);
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    writeFileSync(join(dir, path), changed);
    execFileSync('git', ['add', path], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'chore: tidy',
      ],
      { cwd: dir },
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({ source: 'commit-change' }),
    );
  });

  it('detects a protected file renamed out of the governed tree', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    mkdirSync(join(dir, 'law'), { recursive: true });
    mkdirSync(join(dir, 'scratch'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, 'law/constitution.md'), 'governed\n');
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    execFileSync('git', ['mv', 'law/constitution.md', 'scratch/constitution.md'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'chore: reorganize',
      ],
      { cwd: dir },
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({
        forbidden_id: 'FORBID-DELETE-AUTHORITY-DOCS',
        source: 'commit-change',
      }),
    );
  });

  it('detects a protected deletion introduced by a merge commit', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    mkdirSync(join(dir, 'law'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, 'law/constitution.md'), 'governed\n');
    writeFileSync(join(dir, 'README.md'), 'seed\n');
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    const initialBranch = execFileSync('git', ['branch', '--show-current'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    execFileSync('git', ['checkout', '-qb', 'remove-law'], { cwd: dir });
    rmSync(join(dir, 'law/constitution.md'));
    writeFileSync(join(dir, 'large-merge-fixture.txt'), 'x'.repeat(1_100_000));
    execFileSync('git', ['add', '-A'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'remove',
      ],
      { cwd: dir },
    );
    execFileSync('git', ['checkout', '-q', initialBranch], { cwd: dir });
    writeFileSync(join(dir, 'README.md'), 'main\n');
    execFileSync('git', ['add', 'README.md'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'main'],
      { cwd: dir },
    );
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'merge',
        '--no-ff',
        '-qm',
        'merge',
        'remove-law',
      ],
      { cwd: dir },
    );

    expect(scanForbiddenActions({ repoRoot: dir, maxCommits: 1 }).findings).toContainEqual(
      expect.objectContaining({
        forbidden_id: 'FORBID-DELETE-AUTHORITY-DOCS',
        source: 'commit-change',
      }),
    );
  });

  it('does not duplicate constituent evidence on a tree-identical synthetic merge', () => {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/forbidden-actions.json'),
      JSON.stringify({ schemaVersion: '1.0.0', actions: CANONICAL_FORBIDDEN_ACTIONS }),
    );
    writeFileSync(join(dir, 'README.md'), 'seed\n');
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync(
      'git',
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'seed'],
      { cwd: dir },
    );
    const initialBranch = execFileSync('git', ['branch', '--show-current'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    execFileSync('git', ['checkout', '-qb', 'feature'], { cwd: dir });
    writeFileSync(join(dir, 'README.md'), 'git push --force example\n');
    execFileSync('git', ['add', 'README.md'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'commit',
        '-qm',
        'feature',
      ],
      { cwd: dir },
    );
    const featureCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim();
    execFileSync('git', ['checkout', '-q', initialBranch], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        'merge',
        '--no-ff',
        '-qm',
        'synthetic merge',
        'feature',
      ],
      { cwd: dir },
    );

    const findings = scanForbiddenActions({ repoRoot: dir, maxCommits: 3 }).findings.filter(
      (finding) => finding.forbidden_id === 'FORBID-FORCE-PUSH',
    );
    expect(findings).toEqual([
      expect.objectContaining({ ref: featureCommit, source: 'commit-change' }),
    ]);
  });
});
// Invariants: INV-DEVAI-001
