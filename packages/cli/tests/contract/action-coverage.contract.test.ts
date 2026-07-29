import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../../../../tests/helpers/subprocess-coverage.js';

/**
 * Contract tests (Phase 16.H). Schema-vs-implementation drift
 * detection — every action in the catalog has a registered
 * handler; every emitted record validates against its schema;
 * every CLI flag matches its description.
 *
 * Distinct from unit tests (which exercise behaviour) and
 * integration tests (which exercise flows): contract tests
 * inspect static surfaces — the catalog, the schema set, the
 * docs/reference/cli/ byte-identity.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(HERE, '..', '..');
const REPO_ROOT = join(PKG_ROOT, '..', '..');
const BIN = join(PKG_ROOT, 'dist/bin.js');
const DRIVER = join(PKG_ROOT, 'tests', 'fixtures', 'authorized-cli-test-driver.mjs');
const skipIfNotBuilt = existsSync(BIN) ? it : it.skip;
const RELEASE_WORKFLOW = join(REPO_ROOT, '.github/workflows/release.yml');
const itReleaseWorkflow = existsSync(RELEASE_WORKFLOW) ? it : it.skip;

function run(args: readonly string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync('node', [DRIVER, ...args], {
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('Catalog contracts', () => {
  skipIfNotBuilt('every action has a non-empty description', () => {
    const r = run(['catalog', 'actions']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as Array<{ name: string; description: string }>;
    for (const a of parsed) {
      expect(a.description, `action '${a.name}' description`).toBeTruthy();
      expect(a.description.length).toBeGreaterThan(10);
    }
  });

  skipIfNotBuilt('every action carries an authority tag (Phase 11.G)', () => {
    const r = run(['catalog', 'actions']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as Array<{ name: string; authority?: string }>;
    for (const a of parsed) {
      expect(a.authority, `action '${a.name}' authority`).toBeTruthy();
    }
  });

  skipIfNotBuilt('every action carries the complete 0.5 routing contract', () => {
    const r = run(['catalog', 'actions']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as Array<Record<string, unknown>>;
    for (const action of parsed) {
      expect(action, String(action.name)).toMatchObject({
        name: expect.any(String),
        previous_name: expect.any(String),
        path: expect.any(Array),
        lifecycle: expect.stringMatching(/^(supported|experimental|retired)$/),
        lifecycle_reason: expect.any(String),
        promotion_criteria: expect.any(Array),
        visibility: expect.stringMatching(/^(common|standard|advanced|maintainer)$/),
        profiles: expect.any(Array),
        effects: expect.stringMatching(/^(read|harness-write|local-write|remote-write)$/),
      });
    }
  });

  skipIfNotBuilt('validates action coverage through the materialized domains policy', () => {
    const r = run(['spec', 'validate', 'action', 'coverage', '--repo-root', REPO_ROOT]);
    expect(r.status, r.stderr).toBe(0);
    const parsed = JSON.parse(r.stdout) as {
      ok: boolean;
      in_scope_count: number;
      claimed_count: number;
      unclaimed: string[];
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.in_scope_count).toBeGreaterThan(0);
    expect(parsed.claimed_count).toBe(parsed.in_scope_count);
    expect(parsed.unclaimed).toEqual([]);
  });

  skipIfNotBuilt('pins the absent generated CLI reference pages without relabeling drift', () => {
    const r = run(['docs', 'cli', '--check', '--repo-root', REPO_ROOT]);
    expect(r.status).toBe(2);
    const parsed = JSON.parse(r.stdout) as { ok: boolean; drift: string[] };
    expect(parsed.ok).toBe(false);
    expect(parsed.drift).toEqual([
      'README.md: missing',
      'catalog.md: missing',
      'spec.md: missing',
      'govern.md: missing',
      'release.md: missing',
      'sense.md: missing',
      'docs.md: missing',
      'round.md: missing',
      'evidence.md: missing',
      'policy.md: missing',
      'doctor.md: missing',
      'init.md: missing',
      'adopt.md: missing',
      'agent.md: missing',
      'work.md: missing',
      'inventory.md: missing',
      'experimental.md: missing',
      'verify.md: missing',
    ]);
  });

  skipIfNotBuilt('every documented internal cross-reference resolves', () => {
    const r = run(['docs', 'links', '--repo-root', REPO_ROOT]);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as { broken_count: number };
    expect(parsed.broken_count).toBe(0);
  });

  it('current documentation contains no obsolete pre-0.5 CLI invocation', () => {
    const files = execFileSync('git', ['ls-files', 'README.md', 'AGENTS.md', 'docs/**'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter((file) => file.length > 0 && /\.(?:md|json|ya?ml|txt|tpl)$/.test(file));
    const obsolete = /\bdevai (?:actions-list|actions list)\b|--(?:execute|apply|human)\b/;
    const findings = files.filter((file) =>
      obsolete.test(readFileSync(join(REPO_ROOT, file), 'utf8')),
    );
    expect(findings).toEqual([]);
  });

  itReleaseWorkflow(
    'privileged release workflow actions are pinned to immutable commit SHAs',
    () => {
      const workflow = readFileSync(RELEASE_WORKFLOW, 'utf8');
      const uses = [...workflow.matchAll(/^\s*- uses:\s*([^\s#]+)/gm)].map(
        (match) => match[1] ?? '',
      );
      expect(uses.length).toBeGreaterThan(0);
      for (const action of uses) {
        expect(action, `${action} must be SHA-pinned`).toMatch(/@[a-f0-9]{40}$/);
      }
    },
  );
});

describe('Skill manifest contracts', () => {
  skipIfNotBuilt('every skill manifest validates against skill-manifest.schema.json', () => {
    // `skill list` already runs the validator-or-exit gate; reaching
    // exit 0 here is the contract being asserted.
    const r = run(['agent', 'skill', 'list']);
    expect(r.status).toBe(0);
  });

  skipIfNotBuilt('every skill has agent_class + permission_tier declared (Phase 10.G)', () => {
    const r = run(['agent', 'skill', 'list']);
    const parsed = JSON.parse(r.stdout) as {
      skills: Array<{ id: string; agent_class?: string; permission_tier?: string }>;
    };
    for (const s of parsed.skills) {
      expect(s.agent_class, `skill '${s.id}' agent_class`).toBeTruthy();
      expect(s.permission_tier, `skill '${s.id}' permission_tier`).toBeTruthy();
    }
  });

  skipIfNotBuilt('keeps the bounded prompt-overlay policy green', () => {
    const r = run(['policy', 'check', 'prompt', 'overlays']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout) as {
      ok: boolean;
      manifests_checked: number;
      findings: Array<{ code: string }>;
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.manifests_checked).toBe(52);
    expect(parsed.findings).toEqual([]);
  });
});
// Invariants: INV-DEVAI-001
