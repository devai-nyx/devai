// Invariants: INV-DEVAI-001, INV-DEVAI-008, INV-DEVAI-017
// R-0007 B4 Inspector acceptance: an unclassified candidate path widens to
// the complete cold floor, and every selected/omitted/derived record explains why.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const CLASSIFIER = join(ROOT, 'scripts/derive-commit-validation-plan.mjs');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'devai-r7-b4-classifier-unknown-'));

function git(cwd: string, args: readonly string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function nonemptyReason(record: unknown, label: string): void {
  expect(record, `${label} must be an object`).toBeTypeOf('object');
  const reason = (record as { readonly reason?: unknown }).reason;
  expect(reason, `${label}.reason must be a string`).toBeTypeOf('string');
  expect(String(reason).trim().length, `${label}.reason must not be blank`).toBeGreaterThan(0);
}

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

describe('R-0007 B4 classifier unknown-path population', () => {
  it('R7-B4-POPULATION-MIGRATION-003 widens an unknown addition and emits total reasons', () => {
    const repo = join(temporaryRoot, 'repo');
    execFileSync('git', ['clone', '--quiet', '--local', '--no-hardlinks', ROOT, repo], {
      encoding: 'utf8',
    });
    const base = git(repo, ['rev-parse', 'HEAD']);
    mkdirSync(join(repo, 'unclassified'), { recursive: true });
    writeFileSync(join(repo, 'unclassified/opaque.fixture'), 'candidate-bound opaque input\n');
    git(repo, ['add', 'unclassified/opaque.fixture']);
    git(repo, [
      '-c',
      'user.name=DEVAI Fixture',
      '-c',
      'user.email=fixture@example.test',
      'commit',
      '-qm',
      'fixture unknown path',
    ]);
    const candidate = git(repo, ['rev-parse', 'HEAD']);

    const result = spawnSync(
      process.execPath,
      [
        CLASSIFIER,
        '--repo-root',
        repo,
        '--round',
        'R-0007',
        '--base',
        base,
        '--candidate',
        candidate,
        '--json',
      ],
      { cwd: repo, encoding: 'utf8' },
    );
    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
    const plan = JSON.parse(result.stdout) as Record<string, unknown>;
    const coldPolicy = JSON.parse(
      readFileSync(join(repo, 'law/policy/round-close-controls.json'), 'utf8'),
    ) as { readonly convergence: { readonly commands: readonly { readonly id: string }[] } };
    const classifierPolicy = JSON.parse(
      readFileSync(join(repo, 'law/policy/commit-validation.json'), 'utf8'),
    ) as { readonly global_commands: readonly { readonly id: string }[] };

    expect(plan).toMatchObject({
      base_sha: base,
      candidate_sha: candidate,
      validation_class: 'candidate-and-close',
      widened: true,
    });
    expect(JSON.stringify(plan.diagnostics)).toContain('COMMIT_VALIDATION_PATH_UNKNOWN');
    expect(plan.changed_paths).toEqual([
      expect.objectContaining({
        status: 'A',
        path: 'unclassified/opaque.fixture',
        path_class: 'unknown',
      }),
    ]);

    const selected = plan.selected_commands as readonly Record<string, unknown>[];
    const omitted = plan.omitted_commands as readonly Record<string, unknown>[];
    expect(selected.map((command) => command.id)).toEqual(
      coldPolicy.convergence.commands.map((command) => command.id),
    );
    const representedGlobalIds = [...selected, ...omitted]
      .map((command) => String(command.id))
      .filter((id) => classifierPolicy.global_commands.some((command) => command.id === id));
    expect(representedGlobalIds.sort()).toEqual(
      classifierPolicy.global_commands.map((command) => command.id).sort(),
    );
    expect(new Set(representedGlobalIds).size).toBe(representedGlobalIds.length);
    for (const [group, records] of Object.entries({
      changed_paths: plan.changed_paths,
      derived_dependencies: plan.derived_dependencies,
      selected_commands: selected,
      omitted_commands: omitted,
    })) {
      expect(records, `${group} must be an array`).toBeInstanceOf(Array);
      for (const [index, record] of (records as readonly unknown[]).entries()) {
        nonemptyReason(record, `${group}[${String(index)}]`);
      }
    }
  });
});
