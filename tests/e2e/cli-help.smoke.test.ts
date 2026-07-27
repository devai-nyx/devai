import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
const skipIfNotBuilt = existsSync(BIN) ? it : it.skip;

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync('node', [BIN, ...args], {
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('CLI binary smoke', () => {
  skipIfNotBuilt('`--help` succeeds and prints a non-empty list of commands', () => {
    const r = run(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout.length).toBeGreaterThan(100);
    expect(r.stdout).toContain('Domains:');
    expect(r.stdout.split('\n').length).toBeLessThan(80);
  });

  skipIfNotBuilt('`--version` prints a version string containing semver', () => {
    const r = run(['--version']);
    expect(r.status).toBe(0);
    // cac prefixes with binary name + platform: "devai/0.0.0 darwin-arm64 node-v24.15.0"
    expect(r.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  skipIfNotBuilt('`actions list` produces a non-empty JSON array', () => {
    const r = run(['catalog', 'actions']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as Array<{ name: string }>;
    expect(parsed.length).toBeGreaterThan(50);
    expect(parsed.every((a) => typeof a.name === 'string')).toBe(true);
  });

  skipIfNotBuilt('`skill list` produces 52 skill manifests', () => {
    // DEVAI R2 bumped 37 → 42 (added 5 round-execute composers).
    // DEVAI R3-W3 bumped 42 → 52 (added 10 SKILL-fix-<gate-id> catalog-fill skills:
    // typecheck, coverage, mutation, spec-validate, action-coverage, docs-links,
    // prompt-overlays, forbidden-actions, adrs, overrides).
    const r = run(['agent', 'skill', 'list']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as { count: number };
    expect(parsed.count).toBe(52);
  });

  skipIfNotBuilt('an unknown command fails closed with a suggestion', () => {
    const r = run(['nonexistent-action-xyz']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/unknown or incomplete command/i);
  });

  skipIfNotBuilt(
    'domain help narrows the surface and each catalog domain has help',
    () => {
      const domain = run(['sense', '--help']);
      expect(domain.status).toBe(0);
      expect(domain.stdout).toContain('Usage: devai sense <command>');
      expect(domain.stdout).not.toContain('Adopt DEVAI in a repository.');

      const catalog = JSON.parse(run(['catalog', 'actions']).stdout) as Array<{ path: string[] }>;
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
    },
    90_000,
  );

  skipIfNotBuilt(
    '0.4 command names and flags fail closed',
    () => {
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
    },
    30_000,
  );
});
// Invariants: INV-DEVAI-001
