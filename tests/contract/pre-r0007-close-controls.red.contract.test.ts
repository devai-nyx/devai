// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = resolve(ROOT, 'scripts/run-round-close-controls.mjs');
const BASE = '722e8a3438f3534260ac4f24c3eecc59e76f905b';
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
): CommandResult {
  const result = spawnSync(
    'node',
    [SCRIPT, command, '--repo-root', ROOT, '--round', 'R-0007', ...args, '--json'],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } },
  );
  let value: Record<string, unknown> | null = null;
  try {
    value = JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    value = null;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, value };
}

function json(relativePath: string): Record<string, any> {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8')) as Record<string, any>;
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

  it('accepts the generic policy during pre-entry preparation and reports the unbound diagnostic', () => {
    const result = run('policy-check', ['--phase', 'pre-entry-preparation']);
    expect(result.status).toBe(0);
    expect(result.value).toMatchObject({
      ok: true,
      command: 'policy-check',
      round: 'R-0007',
      phase: 'pre-entry-preparation',
      entry_ready: false,
    });
    expect(result.value?.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'ENTRY_BLOCKED_REVIEWER_UNBOUND' })]),
    );
  });

  it('fails entry closed while the reviewer slot is unbound', () => {
    const result = run('entry-check');
    expect(result.status).toBe(1);
    expect(result.value).toMatchObject({ ok: false, command: 'entry-check', entry_ready: false });
    expect(result.value?.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'ENTRY_BLOCKED_REVIEWER_UNBOUND' })]),
    );
  });

  it('emits an auditable impact plan with conservative fallback for this control range', () => {
    const result = run('impact-plan', ['--base', BASE, '--head', 'HEAD']);
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
    const result = run('impact-plan', ['--base', 'HEAD', '--head', 'HEAD'], {
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
    expect(policy.freshness.partial_coverage_merge).toBe('forbidden');
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
    expect(policy.review_scope.topic_sources).toContain('semantic-obligation');
    expect(policy.review_scope.markdown_requirement_scan).toBe('unregistered-obligation-lint-only');
    expect(policy.review_scope.exactly_once).toBe(true);
  });

  it('generates a scope containing every registered semantic obligation', () => {
    const result = run('review-scope', ['--base', BASE, '--candidate', 'HEAD', '--cycle', '1']);
    expect(result.status).toBe(0);
    const obligations = json('work/rounds/R-0007/review-obligations.json').obligations as Array<{
      obligation_id: string;
    }>;
    const topics = (result.value?.manifest as Record<string, any>).topics as Array<{
      obligation_id?: string;
    }>;
    expect(new Set(topics.map((topic) => topic.obligation_id).filter(Boolean))).toEqual(
      new Set(obligations.map(({ obligation_id }) => obligation_id)),
    );
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
      'HEAD',
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
    const result = run('claims-check', ['--candidate', 'HEAD']);
    expect(result.status).toBe(1);
    expect(result.value).toMatchObject({ ok: false, command: 'claims-check', round: 'R-0007' });
    expect(result.value?.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'CLAIM_UNRESOLVED' })]),
    );
  });

  it('reports the bounded state and transport budget without mutating the candidate', () => {
    const result = run('status');
    expect(result.status).toBe(0);
    expect(result.value).toMatchObject({
      ok: true,
      command: 'status',
      round: 'R-0007',
      state: 'DRAFT',
      substantive_cycles: { used: 0, maximum: 2 },
      transport_retries_per_cycle: { used: 0, maximum: 1 },
      entry_ready: false,
    });
  });
});
