// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// Governed implementation paths:
// - packages/cli/src/action-output.ts
// - packages/cli/src/command-router.ts
// - packages/cli/src/bin.ts
// - packages/cli/src/authority/index.ts
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SENSOR_READING_KINDS } from '../../packages/sensors/src/index.js';
import { validators } from '../../packages/schemas/src/index.js';
import { emitPreDispatchActionResult } from '../../packages/cli/src/action-output.js';
import { invocationIsNonMutating, routeArgv } from '../../packages/cli/src/command-router.js';
import { getFullRegistry, type RegistryEntry } from '../../packages/cli/src/define-command.js';
import { resolveCliVersion } from '../../packages/cli/src/version.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = resolve(ROOT, 'packages/cli/dist/bin.js');

function run(args: readonly string[]) {
  return spawnSync('node', [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 30_000,
  });
}

function envelope(text: string): Record<string, unknown> {
  const value = JSON.parse(text) as Record<string, unknown>;
  expect(validators.actionResult(value), JSON.stringify(validators.actionResult.errors)).toBe(true);
  return value;
}

const NONCANONICAL_EXIT_PRODUCERS = [
  ['spec blueprint diff', 1],
  ['policy check dependencies', 1],
  ['policy check sensor integrity', 1],
  ['docs render mermaid', 1],
  ['docs synthesize all', 1],
  ['docs synthesize', 1],
  ['inventory suggest', 1],
  ['adopt pack graduate', 1],
  ['adopt pack resolve', 1],
  ['sense run', 1],
  ['sense mutation run', 65],
  ['agent skill run', 50],
  ['evidence test record', 126],
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('R-0006 Codex cycle-5 output-totality red', () => {
  const registry = getFullRegistry();
  const version = resolveCliVersion();

  it('canonicalizes every noncanonical producer status and preserves its domain output', () => {
    expect(NONCANONICAL_EXIT_PRODUCERS).toHaveLength(13);
    for (const [actionId, status] of NONCANONICAL_EXIT_PRODUCERS) {
      let rendered = '';
      vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        rendered += String(chunk);
        return true;
      });
      const entry = { name: actionId } as RegistryEntry;
      const domain = JSON.stringify({ action_id: actionId, verdict: 'REVIEW', status });
      expect(emitPreDispatchActionResult(entry, { exit: status, stdout: domain, stderr: '' })).toBe(
        true,
      );
      const result = envelope(rendered);
      expect(result).toMatchObject({
        action_id: actionId,
        ok: false,
        error: { exit: 7, message: domain },
      });
      expect(process.exitCode).toBe(7);
      vi.restoreAllMocks();
      process.exitCode = undefined;
    }
  });

  it('keeps human and machine REVIEW meaning equivalent for a retained producer', () => {
    const human = run(['adopt', 'pack', 'resolve', '--repo-root', '.']);
    const machine = run(['adopt', 'pack', 'resolve', '--repo-root', '.', '--json']);
    expect(human.status).toBe(1);
    expect(machine.status).toBe(7);
    expect(machine.stdout).toBe('');
    const result = envelope(machine.stderr);
    const error = result['error'] as Record<string, unknown>;
    expect(error['exit']).toBe(machine.status);
    expect(error['message']).toContain(human.stdout.trim());
  });

  it('consumes bare --json for every retained public action outside parameterized sense run', () => {
    const invalid: string[] = [];
    for (const entry of registry.filter((candidate) => candidate.name !== 'sense run')) {
      const consent =
        entry.effects === 'remote-write'
          ? ['--write', '--allow-publish']
          : entry.effects === 'local-write' || entry.effects === 'harness-write'
            ? ['--write']
            : [];
      const route = routeArgv(
        ['node', 'devai', ...entry.path, ...consent, '--json'],
        registry,
        version,
      );
      if (route.kind !== 'dispatch' || route.argv.includes('--json')) invalid.push(entry.name);
    }
    expect(invalid).toEqual([]);
  });

  it('routes both machine spellings for all 59 sensor kinds through read-only sense run', () => {
    expect(SENSOR_READING_KINDS).toHaveLength(59);
    const invalid: string[] = [];
    for (const kind of SENSOR_READING_KINDS) {
      for (const machine of [['--json'], ['--format', 'json']] as const) {
        const argv = ['node', 'devai', 'sense', 'run', kind, ...machine];
        const route = routeArgv(argv, registry, version);
        if (
          !invocationIsNonMutating('sense-run', argv) ||
          route.kind !== 'dispatch' ||
          route.argv.includes('--json') ||
          route.argv.includes('--format') ||
          route.argv.includes('json')
        ) {
          invalid.push(`${kind}:${machine.join(' ')}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('action-envelopes the parameterized sensor and list paths', () => {
    for (const args of [
      ['sense', 'run', 'inventory_determinism', '--json'],
      ['sense', 'run', '--list', '--json'],
      ['sense', 'run', '--list', '--format', 'json'],
    ]) {
      const result = run(args);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toBe('');
      expect(envelope(result.stdout)).toMatchObject({ action_id: 'sense run', ok: true });
    }
  });

  it('normalizes a non-allowlisted pre-dispatch exception into the action envelope', () => {
    const missing = `/tmp/devai-r0006-cycle5-missing-${String(process.pid)}`;
    const result = run(['adopt', 'pack', 'resolve', '--repo-root', missing, '--format', 'json']);
    expect(result.status).toBe(6);
    expect(result.stdout).toBe('');
    const output = envelope(result.stderr);
    expect(output).toMatchObject({
      action_id: 'adopt pack resolve',
      ok: false,
      error: { class: 'infrastructure', exit: 6 },
    });
    expect((output['error'] as Record<string, unknown>)['exit']).toBe(result.status);
    expect(result.stderr).not.toContain('node:fs:');
  });
});
