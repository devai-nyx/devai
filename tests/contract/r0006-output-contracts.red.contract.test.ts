// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');

interface ActionEntry {
  readonly action_id: string;
  readonly disposition: 'keep' | 'fold' | 'tombstone';
  readonly output_contract?: unknown;
  readonly error_contract?: unknown;
}

interface Registry {
  readonly entries: readonly ActionEntry[];
}

interface TraceEntry {
  readonly path: string;
  readonly assertion_count?: number;
  readonly assertion_digest_sha256?: string;
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as Record<string, unknown>;
}

function run(args: readonly string[]): {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
} {
  expect(existsSync(BIN), 'pnpm run devai:prepare must build the CLI').toBe(true);
  const result = spawnSync('node', [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 15_000,
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function parseSingleJson(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as unknown;
  expect(parsed).not.toBeNull();
  expect(Array.isArray(parsed)).toBe(false);
  expect(typeof parsed).toBe('object');
  return parsed as Record<string, unknown>;
}

describe('R-0006 BL-026 per-action contracts', () => {
  const registry = json('law/policy/action-registry.json') as unknown as Registry;

  it('every runnable action declares a closed success-output contract', () => {
    const missing = registry.entries
      .filter((entry) => entry.disposition === 'keep' && entry.output_contract === undefined)
      .map((entry) => entry.action_id);
    expect(missing).toEqual([]);
  });

  it('every runnable action declares its structured error contract', () => {
    const missing = registry.entries
      .filter((entry) => entry.disposition === 'keep' && entry.error_contract === undefined)
      .map((entry) => entry.action_id);
    expect(missing).toEqual([]);
  });

  it('retired identities declare router-only output and error behavior', () => {
    const invalid = registry.entries
      .filter((entry) => entry.disposition !== 'keep')
      .filter((entry) => entry.output_contract === undefined || entry.error_contract === undefined)
      .map((entry) => entry.action_id);
    expect(invalid).toEqual([]);
  });

  it('the action-registry schema requires both contracts on every row', () => {
    const schema = json('law/schemas/action-registry.schema.json');
    const entries = schema['properties'] as Record<string, unknown>;
    const entryItems = (entries['entries'] as Record<string, unknown>)['items'] as Record<
      string,
      unknown
    >;
    expect(entryItems['required']).toEqual(
      expect.arrayContaining(['output_contract', 'error_contract']),
    );
  });

  it('the closed common action-result envelope exists', () => {
    expect(existsSync(join(ROOT, 'law/schemas/action-result.schema.json'))).toBe(true);
  });

  it('a successful public action emits one validated action-bound JSON envelope', () => {
    const result = run(['catalog', 'actions', '--format', 'json']);
    expect(result.status, result.stderr).toBe(0);
    const payload = parseSingleJson(result.stdout);
    expect(payload).toMatchObject({
      schemaVersion: '1.0.0',
      action_id: 'catalog actions',
      ok: true,
    });
    expect(payload).toHaveProperty('result');
  });

  it('a usage failure emits one action-bound structured error and no prose dependency', () => {
    const result = run([
      'catalog',
      'actions',
      '--authority',
      'not-an-authority',
      '--format',
      'json',
    ]);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    const payload = parseSingleJson(result.stderr);
    expect(payload).toMatchObject({
      schemaVersion: '1.0.0',
      action_id: 'catalog actions',
      ok: false,
      error: {
        schemaVersion: '1.0.0',
        class: 'routing-authority',
        exit: 2,
      },
    });
  });
});

describe('R-0006 BL-081 assertion-bearing trace depth', () => {
  const trace = json('law/trace.json') as unknown as { readonly test_corpus: TraceEntry[] };

  it('every traced executable carries a positive assertion count and source digest', () => {
    const invalid = trace.test_corpus
      .filter(
        (entry) =>
          !Number.isInteger(entry.assertion_count) ||
          (entry.assertion_count ?? 0) < 1 ||
          !/^[a-f0-9]{64}$/u.test(entry.assertion_digest_sha256 ?? ''),
      )
      .map((entry) => entry.path);
    expect(invalid).toEqual([]);
  });

  it('the trace schema makes assertion evidence mandatory rather than documentary', () => {
    const schema = json('law/schemas/trace.schema.json');
    const properties = schema['properties'] as Record<string, unknown>;
    const corpus = properties['test_corpus'] as Record<string, unknown>;
    const items = corpus['items'] as Record<string, unknown>;
    expect(items['required']).toEqual(
      expect.arrayContaining(['assertion_count', 'assertion_digest_sha256']),
    );
  });
});
