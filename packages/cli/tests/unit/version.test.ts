import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveCliProvenance, resolveCliVersion } from '../../src/version.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(dirname(dirname(HERE)));

describe('resolveCliVersion', () => {
  it('returns a semver-shaped string', () => {
    expect(resolveCliVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('resolveCliProvenance', () => {
  // D-122 (item 2a): vitest transforms and runs directly against
  // packages/cli/src/version.ts inside this monorepo checkout, so
  // import.meta.url has no node_modules segment — this test suite
  // IS a real sibling-checkout environment, giving a deterministic,
  // non-mocked exercise of the detection logic.
  it('detects sibling-checkout when run from within this monorepo checkout', () => {
    const provenance = resolveCliProvenance();
    expect(provenance.source).toBe('sibling-checkout');
    expect(provenance.resolvedPath).not.toMatch(/node_modules/);
  });

  it('reports the actual HEAD SHA of this repo', () => {
    const provenance = resolveCliProvenance();
    expect(provenance.gitSha).toMatch(/^[a-f0-9]{40}$/);
    const actual = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(provenance.gitSha).toBe(actual.stdout.trim());
  });

  it('is cached across calls (same object identity is not required, but the value is stable)', () => {
    const first = resolveCliProvenance();
    const second = resolveCliProvenance();
    expect(second).toEqual(first);
  });
});
// Invariants: INV-DEVAI-001
