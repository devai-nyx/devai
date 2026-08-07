// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = resolve(ROOT, 'scripts/run-round-close-controls.mjs');
const BASE = '722e8a3438f3534260ac4f24c3eecc59e76f905b';
const HEAD = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const APPROVED_ENGINEER_SURFACE = [
  '.devai/config/round-close-controls.json',
  'package.json',
  'packages/schemas/src/roster.ts',
  'scripts/run-round-close-controls.mjs',
] as const;

interface CommandResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly value: Record<string, unknown> | null;
}

function run(
  command: string,
  args: readonly string[] = [],
  env: NodeJS.ProcessEnv = {},
  repoRoot = ROOT,
): CommandResult {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', repoRoot, '--round', 'R-0007', ...args, '--json'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, CI: '', GITHUB_ACTIONS: '', ...env },
      // The authenticated v5 impact population is intentionally larger than Node's 1 MiB
      // spawnSync default; retain the complete JSON rather than accepting a truncated plan.
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  let value: Record<string, unknown> | null = null;
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = null;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, value };
}

function json(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8')) as Record<string, unknown>;
}

function cleanClone(): { root: string; candidate: string; dispose: () => void } {
  const temporary = mkdtempSync(join(tmpdir(), 'devai-r0007-entry-'));
  const root = join(temporary, 'repo');
  const cloned = spawnSync('git', ['clone', '--quiet', '--local', '--no-hardlinks', ROOT, root], {
    encoding: 'utf8',
  });
  if (cloned.status !== 0) {
    rmSync(temporary, { recursive: true, force: true });
    throw new Error(`fixture clone failed: ${cloned.stderr}`);
  }
  const candidate = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).stdout.trim();
  return {
    root,
    candidate,
    dispose: () => rmSync(temporary, { recursive: true, force: true }),
  };
}

describe('pre-R-0007 generic close-control red contracts', () => {
  it('exposes the complete governed command surface', () => {
    expect(APPROVED_ENGINEER_SURFACE).toHaveLength(4);
    const scripts = json('package.json').scripts as Record<string, string>;
    expect(
      Object.keys(scripts)
        .filter((name) => name.startsWith('round-close:'))
        .sort(),
    ).toEqual([
      'round-close:claims-check',
      'round-close:entry-check',
      'round-close:impact-plan',
      'round-close:policy',
      'round-close:review-check',
      'round-close:review-scope',
      'round-close:smart-converge',
      'round-close:status',
    ]);
  });

  it('has no production R-0006, OM-012, unbounded-cycle, or fixed-model binding', () => {
    const source = readFileSync(SCRIPT, 'utf8');
    expect(source).not.toMatch(
      /R-0006|OM-01[123]|owner-authorized-unbounded|gpt-5\.6-sol|claude-opus-5/u,
    );
  });

  it('accepts the Owner-bound reviewer and exact DII-257 declaration during preparation', () => {
    expect(json('work/rounds/R-0007/close-control-profile.json').declaration).toEqual({
      binding: 'b0-decision-required',
      decision_id: 'DII-257',
      exact_base: '9b435e5ca479a837baffe2b597c8ba582fec08f4',
    });
    const result = run('policy-check', ['--phase', 'pre-entry-preparation', '--candidate', HEAD]);
    expect(result.status, JSON.stringify(result.value, null, 2)).toBe(0);
    expect(result.value).toMatchObject({
      ok: true,
      command: 'policy-check',
      round: 'R-0007',
      phase: 'pre-entry-preparation',
      entry_ready: true,
      diagnostics: [],
      findings: [],
    });
  });

  it('passes entry only for a clean exact DII-257-bound candidate', () => {
    const fixture = cleanClone();
    try {
      const result = run('entry-check', ['--candidate', fixture.candidate], {}, fixture.root);
      expect(result.status, JSON.stringify(result.value, null, 2)).toBe(0);
      expect(result.value).toMatchObject({
        ok: true,
        command: 'entry-check',
        entry_ready: true,
        diagnostics: [],
        findings: [],
      });

      appendFileSync(join(fixture.root, 'README.md'), '\nhermetic dirty-candidate marker\n');
      const dirty = run('entry-check', ['--candidate', fixture.candidate], {}, fixture.root);
      expect(dirty.status, JSON.stringify(dirty.value, null, 2)).toBe(1);
      expect(dirty.value).toMatchObject({
        ok: false,
        command: 'entry-check',
        entry_ready: false,
        findings: expect.arrayContaining([
          expect.objectContaining({ code: 'ENTRY_BLOCKED_DIRTY_WORKTREE' }),
        ]),
      });
    } finally {
      fixture.dispose();
    }
  });

  it('emits an auditable impact plan with conservative fallback for this control range', () => {
    const result = run('impact-plan', ['--base', BASE, '--head', HEAD, '--candidate', HEAD]);
    expect(result.status).toBe(0);
    expect(result.value).toMatchObject({ ok: true, command: 'impact-plan', round: 'R-0007' });
    const nodes = result.value?.nodes as Array<Record<string, unknown>>;
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          node_id: 'full-suite',
          outcome: 'EXECUTE',
          reason_codes: expect.arrayContaining(['SHARED_INPUT_CHANGED']),
        }),
      ]),
    );
    for (const node of nodes) {
      expect(node).toEqual(
        expect.objectContaining({
          node_id: expect.any(String),
          outcome: expect.stringMatching(/^(?:EXECUTE|REUSE_FRESH|BLOCKED)$/u),
          reason_codes: expect.any(Array),
          changed_inputs: expect.any(Array),
          task_key: expect.stringMatching(/^[a-f0-9]{64}$/u),
          dependency_keys: expect.any(Object),
        }),
      );
    }
  });

  it('forces the complete authoritative population in remote mode', () => {
    const result = run('impact-plan', ['--base', HEAD, '--head', HEAD, '--candidate', HEAD], {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    });
    expect(result.status).toBe(0);
    expect(result.value).toMatchObject({ remote: true, cache_trusted: false });
    const nodes = result.value?.nodes as Array<Record<string, unknown>>;
    expect(nodes.every((node) => node.outcome === 'EXECUTE')).toBe(true);
    expect(nodes.every((node) => (node.reason_codes as string[]).includes('REMOTE_FULL'))).toBe(
      true,
    );
  });

  it('keeps coverage whole-only and graph fallback explicit', () => {
    const policy = json('law/policy/round-close-controls.json');
    const graph = json('work/rounds/R-0007/affected-test-graph.json');
    const freshness = policy.freshness as Record<string, unknown>;
    expect(freshness.partial_coverage_merge).toBe('forbidden');
    expect(graph.coverage).toEqual({
      node: 'full-coverage',
      mode: 'whole-only',
      partial_merge: 'forbidden',
    });
    expect(graph.fallbacks).toEqual({
      unknown_dependency: 'full-suite',
      dynamic_import: 'full-suite',
      incomplete_population: 'full-suite',
    });
  });

  it('uses semantic obligations rather than markdown requirements as authoritative topics', () => {
    const policy = json('law/policy/round-close-controls.json');
    const reviewScope = policy.review_scope as Record<string, unknown>;
    expect(reviewScope.topic_sources).toContain('semantic-obligation');
    expect(reviewScope.markdown_requirement_scan).toBe('unregistered-obligation-lint-only');
    expect(reviewScope.exactly_once).toBe(true);
  });

  it('registers every semantic obligation with a stable unique authoritative identity', () => {
    const obligations = json('work/rounds/R-0007/review-obligations.json').obligations as Array<
      Record<string, unknown>
    >;
    const obligationIds = obligations.map(({ obligation_id }) => obligation_id);
    expect(new Set(obligationIds).size).toBe(obligations.length);
    for (const obligation of obligations) {
      expect(obligation).toEqual(
        expect.objectContaining({
          obligation_id: expect.stringMatching(/^R7-P[0-3]-[A-Z0-9-]+$/u),
          risk: expect.stringMatching(/^P[0-3]$/u),
          source_refs: expect.arrayContaining([expect.any(String)]),
          governing_paths: expect.arrayContaining([expect.any(String)]),
          required_evidence: expect.arrayContaining([expect.any(String)]),
          required_adversaries: expect.arrayContaining([expect.any(String)]),
          reuse_policy: expect.stringMatching(/^(?:always-recheck|fresh-pass-eligible)$/u),
          finding_classes: expect.any(Array),
        }),
      );
    }
  });

  it('requires structured exact-once results, terminal counts, and complete finding classes', () => {
    const schema = json('law/schemas/review-result.schema.json');
    const required = schema.required as string[];
    expect(required).toEqual(
      expect.arrayContaining([
        'round',
        'review_candidate',
        'manifest_digest',
        'cycle',
        'dispositions',
        'findings',
        'terminal',
      ]),
    );
    expect(JSON.stringify(schema)).toMatch(/population_query/u);
    expect(JSON.stringify(schema)).toMatch(/affected_instances/u);
    expect(JSON.stringify(schema)).toMatch(/repair_acceptance/u);
  });

  it('refuses a nonexistent cycle 3 before reading a review result', () => {
    const result = run('review-check', [
      '--candidate',
      HEAD,
      '--cycle',
      '3',
      '--review-result',
      '/definitely/missing/review.jsonl',
    ]);
    expect(result.status).toBe(1);
    expect(result.value?.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'REVIEW_CYCLE_BUDGET_EXHAUSTED' })]),
    );
  });

  it('rejects unresolved and stale claim ledgers for an exact candidate', () => {
    const result = run('claims-check', ['--candidate', HEAD]);
    expect(result.status).toBe(1);
    expect(result.value).toMatchObject({ ok: false, command: 'claims-check', round: 'R-0007' });
    expect(result.value?.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'CLAIM_MATERIALIZATION_REQUIRED' })]),
    );
  });

  it('reports the bounded state and transport budget without mutating the candidate', () => {
    const result = run('status', ['--candidate', HEAD]);
    expect(result.status).toBe(0);
    expect(result.value).toMatchObject({
      ok: true,
      command: 'status',
      round: 'R-0007',
      state: 'DRAFT',
      substantive_cycles: { used: 0, maximum: 2 },
      transport_retries_per_cycle: { used: 0, maximum: 1 },
      entry_ready: true,
      diagnostics: [],
      findings: [],
    });
  });
});
