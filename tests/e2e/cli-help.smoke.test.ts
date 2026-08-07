import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ACTION_REGISTRY } from '../../packages/cli/src/generated/action-registry.js';
import { listSkills } from '../../packages/skills/src/skills/index.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

/**
 * Smoke tests (Phase 16.H). Post-build sanity that the binary
 * answers basic questions in <1s each. Fails fast if anything
 * structural is broken (binary missing, --help crashes, action
 * registry empty).
 *
 * Individual commands are expected to return promptly. The all-domain test
 * intentionally starts one process per domain and has a larger bounded timeout
 * for instrumented, contended CI runners.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = join(HERE, '..', '..', 'packages', 'cli', 'dist', 'bin.js');
const keptActionIds = ACTION_REGISTRY.filter((entry) => entry.disposition === 'keep').map(
  (entry) => entry.action_id,
);

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync('node', [BIN, ...args], {
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function catalogValue(stdout: string): Array<{ name: string; path: string[] }> {
  const envelope = JSON.parse(stdout) as {
    result: { media_type: string; value: Array<{ name: string; path: string[] }> };
  };
  expect(envelope.result.media_type).toBe('application/json');
  return envelope.result.value;
}

describe('CLI binary smoke', () => {
  it('`--help` succeeds and prints a non-empty list of commands', () => {
    const r = run(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout.length).toBeGreaterThan(100);
    expect(r.stdout).toContain('Domains:');
    expect(r.stdout.split('\n').length).toBeLessThan(80);
  });

  it('`--version` prints a version string containing semver', () => {
    const r = run(['--version']);
    expect(r.status).toBe(0);
    // cac prefixes with binary name + platform: "devai/0.0.0 darwin-arm64 node-v24.15.0"
    expect(r.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it('`catalog actions` produces the exact 42-action registry projection in order', () => {
    const r = run(['catalog', 'actions', '--format', 'json']);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
    const parsed = catalogValue(r.stdout);
    expect(parsed).toHaveLength(42);
    expect(parsed.map((action) => action.name)).toEqual(keptActionIds);
    expect(parsed.every((a) => typeof a.name === 'string')).toBe(true);
  });

  it('the direct skill registry census produces 52 unique manifests', () => {
    // DEVAI R2 bumped 37 → 42 (added 5 round-execute composers).
    // DEVAI R3-W3 bumped 42 → 52 (added 10 SKILL-fix-<gate-id> catalog-fill skills:
    // typecheck, coverage, mutation, spec-validate, action-coverage, docs-links,
    // prompt-overlays, forbidden-actions, adrs, overrides).
    const manifests = listSkills();
    expect(manifests).toHaveLength(52);
    expect(new Set(manifests.map((manifest) => manifest.id)).size).toBe(manifests.length);
  });

  it('an unknown command fails closed with a suggestion', () => {
    const r = run(['nonexistent-action-xyz']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/unknown or incomplete command/i);
  });

  it('domain help narrows the surface and each catalog domain has help', () => {
    const domain = run(['sense', '--help']);
    expect(domain.status).toBe(0);
    expect(domain.stdout).toContain('Usage: devai sense <command>');
    expect(domain.stdout).not.toContain('Adopt DEVAI in a repository.');

    const catalog = catalogValue(run(['catalog', 'actions', '--format', 'json']).stdout);
    const domains = new Set(
      catalog
        .map((action) => action.path[0])
        .filter((domainName): domainName is string => domainName !== undefined),
    );
    for (const domainName of domains) {
      const help = run([domainName, '--help-all']);
      expect(help.status, domainName).toBe(0);
      expect(help.stdout, domainName).toContain(`Usage: devai ${domainName}`);
    }
  }, 90_000);

  it('0.4 command names and flags fail closed', () => {
    for (const args of [
      ['actions-list'],
      ['actions', 'list'],
      ['init', '--execute'],
      ['doctor', '--human'],
    ]) {
      const r = run(args);
      expect(r.status, args.join(' ')).toBe(2);
      expect(r.stderr, args.join(' ')).toBeTruthy();
    }
  }, 30_000);
});
// Invariants: INV-DEVAI-001
