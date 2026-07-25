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
});
// Invariants: INV-DEVAI-001
