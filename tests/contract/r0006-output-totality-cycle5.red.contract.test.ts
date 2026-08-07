// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// Governed implementation paths:
// - packages/cli/src/action-output.ts
// - packages/cli/src/command-router.ts
// - packages/cli/src/bin.ts
// - packages/cli/src/authority/index.ts
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SENSOR_DESCRIPTORS,
  SENSOR_READING_KINDS,
  type SensorEffect,
} from '../../packages/sensors/src/index.js';
import { validators } from '../../packages/schemas/src/index.js';
import { emitPreDispatchActionResult } from '../../packages/cli/src/action-output.js';
import { resolveInvocationEntry } from '../../packages/cli/src/authority/sense-selection.js';
import { routeArgv } from '../../packages/cli/src/command-router.js';
import type { RegistryEntry } from '../../packages/cli/src/define-command.js';
import { ACTION_REGISTRY } from '../../packages/cli/src/generated/action-registry.js';
import { resolveCliVersion } from '../../packages/cli/src/version.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = resolve(ROOT, 'packages/cli/dist/bin.js');
const NONCANONICAL_EXIT_STATUSES = [1, 50, 65, 126] as const;

function run(args: readonly string[]) {
  return spawnSync('node', [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 120_000,
  });
}

function envelope(text: string): Record<string, unknown> {
  const value = JSON.parse(text) as Record<string, unknown>;
  expect(validators.actionResult(value), JSON.stringify(validators.actionResult.errors)).toBe(true);
  return value;
}

function errorEnvelope(text: string): Record<string, unknown> {
  const value = JSON.parse(text) as Record<string, unknown>;
  expect(validators.error(value), JSON.stringify(validators.error.errors)).toBe(true);
  return value;
}

function withoutSensorTimestamp(value: Record<string, unknown>): {
  readonly stable: Record<string, unknown>;
  readonly timestamp: string;
} {
  const result = value['result'];
  expect(result).toBeTypeOf('object');
  expect(result).not.toBeNull();
  expect(Array.isArray(result)).toBe(false);
  const resultRecord = result as Record<string, unknown>;
  expect(resultRecord['media_type']).toBe('application/json');
  const reading = resultRecord['value'];
  expect(reading).toBeTypeOf('object');
  expect(reading).not.toBeNull();
  expect(Array.isArray(reading)).toBe(false);
  expect(validators.sensorReading(reading), JSON.stringify(validators.sensorReading.errors)).toBe(
    true,
  );
  const { timestamp, ...stableReading } = reading as Record<string, unknown>;
  expect(timestamp).toBeTypeOf('string');
  expect(Number.isNaN(Date.parse(timestamp as string))).toBe(false);
  return {
    stable: { ...value, result: { ...resultRecord, value: stableReading } },
    timestamp: timestamp as string,
  };
}

function runtimeEntry(entry: (typeof ACTION_REGISTRY)[number]): RegistryEntry {
  return {
    name: entry.action_id,
    previous_name: entry.internal_binding,
    internal_name: entry.internal_binding.replaceAll(' ', '-'),
    path: entry.path,
    disposition: entry.disposition,
    migration: entry.migration,
    lifecycle: entry.lifecycle,
    lifecycle_reason: entry.lifecycle_reason,
    promotion_criteria: entry.promotion_criteria,
    visibility: entry.visibility,
    tier: entry.tier,
    profiles: entry.profiles,
    effects: entry.effect,
    authority: entry.authority ?? 'mesh_controller',
    description: entry.description,
    authority_contract_version: entry.authority_contract_version,
    authority_contract: entry.authority_contract,
    output_contract: entry.output_contract,
    error_contract: entry.error_contract,
  } as RegistryEntry;
}

function consentFor(effect: SensorEffect): readonly string[] {
  if (effect === 'remote-write') return ['--write', '--publish'];
  if (effect === 'local-write' || effect === 'harness-write') return ['--write'];
  return [];
}

const fullRegistry = ACTION_REGISTRY.map(runtimeEntry);
const registry = fullRegistry.filter((entry) => entry.disposition === 'keep');
const version = resolveCliVersion();

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('R-0006 output-totality contracts migrated to the R-0007 surface', () => {
  it('canonicalizes every noncanonical producer status for every one of the 42 live actions', () => {
    expect(registry).toHaveLength(42);
    expect(NONCANONICAL_EXIT_STATUSES).toHaveLength(4);
    let assertions = 0;
    for (const entry of registry) {
      for (const status of NONCANONICAL_EXIT_STATUSES) {
        let rendered = '';
        vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
          rendered += String(chunk);
          return true;
        });
        const domain = JSON.stringify({ action_id: entry.name, verdict: 'REVIEW', status });
        expect(
          emitPreDispatchActionResult(entry, { exit: status, stdout: domain, stderr: '' }),
        ).toBe(true);
        expect(envelope(rendered)).toMatchObject({
          action_id: entry.name,
          ok: false,
          error: { exit: 7, message: domain },
        });
        expect(process.exitCode).toBe(7);
        vi.restoreAllMocks();
        process.exitCode = undefined;
        assertions += 1;
      }
    }
    expect(assertions).toBe(168);
  });

  it('keeps human and both machine spellings total for the live canonical catalog', () => {
    const human = run(['catalog', 'actions', '--format', 'human']);
    const json = run(['catalog', 'actions', '--json']);
    const format = run(['catalog', 'actions', '--format', 'json']);
    expect(human.status, human.stderr).toBe(0);
    expect(json.status, json.stderr).toBe(0);
    expect(format.status, format.stderr).toBe(0);
    expect(human.stderr).toBe('');
    expect(json.stderr).toBe('');
    expect(format.stderr).toBe('');
    expect(human.stdout.trim().split('\n')).toHaveLength(43);
    const jsonEnvelope = envelope(json.stdout);
    const formatEnvelope = envelope(format.stdout);
    expect(formatEnvelope).toEqual(jsonEnvelope);
    expect(jsonEnvelope).toMatchObject({ action_id: 'catalog actions', ok: true });
    const result = jsonEnvelope['result'] as Record<string, unknown>;
    expect(result['value']).toHaveLength(42);
  });

  it('refuses retired adopt pack resolve before dispatch with its exact migration', () => {
    const human = run(['adopt', 'pack', 'resolve', '--repo-root', '.']);
    const machine = run(['adopt', 'pack', 'resolve', '--repo-root', '.', '--json']);
    expect(human.status).toBe(2);
    expect(machine.status).toBe(2);
    expect(human.stdout).toBe('');
    expect(machine.stdout).toBe('');
    expect(human.stderr).toBe(
      "devai: Action 'adopt pack resolve' is retired. Remediation: sense inventory --slice pack\n",
    );
    expect(errorEnvelope(machine.stderr)).toMatchObject({
      code: 'ACTION_FOLDED',
      class: 'routing-authority',
      exit: 2,
      remediation: 'sense inventory --slice pack',
      context: {
        action: 'adopt pack resolve',
        disposition: 'fold',
        migration: 'sense inventory --slice pack',
      },
    });
  });

  it('keeps exactly 42 live actions while all 169 folds and 11 tombstones stay router-only', () => {
    const counts = {
      keep: fullRegistry.filter((entry) => entry.disposition === 'keep').length,
      fold: fullRegistry.filter((entry) => entry.disposition === 'fold').length,
      tombstone: fullRegistry.filter((entry) => entry.disposition === 'tombstone').length,
      porcelain: registry.filter((entry) => entry.tier === 'porcelain').length,
      plumbing: registry.filter((entry) => entry.tier === 'plumbing').length,
    };
    expect(fullRegistry).toHaveLength(222);
    expect(counts).toEqual({
      keep: 42,
      fold: 169,
      tombstone: 11,
      porcelain: 31,
      plumbing: 11,
    });

    const historicalViolations: string[] = [];
    for (const entry of fullRegistry.filter((candidate) => candidate.disposition !== 'keep')) {
      if (
        entry.output_contract.mode !== 'router-only' ||
        entry.error_contract.mode !== 'router-only'
      ) {
        historicalViolations.push(`${entry.name}:non-router-contract`);
      }
      const route = routeArgv(['node', 'devai', ...entry.path], registry, version);
      if (
        route.kind !== 'output' ||
        route.exitCode !== 2 ||
        !route.text.includes(entry.migration ?? '')
      ) {
        historicalViolations.push(`${entry.name}:not-refused-with-migration`);
      }
    }
    expect(historicalViolations).toEqual([]);

    const invalid: string[] = [];
    let taskRoutes = 0;
    for (const entry of registry) {
      const args =
        entry.name === 'sense run'
          ? [...entry.path, 'inventory_determinism']
          : entry.path[0] === 'task'
            ? [...entry.path, '--round', 'R-0007']
            : [...entry.path];
      if (entry.path[0] === 'task') taskRoutes += 1;
      const consent = entry.name === 'sense run' ? [] : consentFor(entry.effects);
      for (const machine of [['--json'], ['--format', 'json']] as const) {
        const route = routeArgv(
          ['node', 'devai', ...args, ...consent, ...machine],
          registry,
          version,
        );
        if (
          route.kind !== 'dispatch' ||
          route.argv.includes('--json') ||
          route.argv.includes('--format') ||
          route.argv.includes('json')
        ) {
          invalid.push(`${entry.name}:${machine.join(' ')}`);
        }
      }
    }
    expect(taskRoutes).toBe(10);
    expect(invalid).toEqual([]);
  });

  it('resolves all 59 sensor kinds to their actual effects and independent consent contracts', () => {
    expect(SENSOR_DESCRIPTORS).toHaveLength(59);
    expect(
      Object.fromEntries(
        (['read', 'harness-write', 'local-write', 'remote-write'] as const).map((effect) => [
          effect,
          SENSOR_DESCRIPTORS.filter((descriptor) => descriptor.effect === effect).length,
        ]),
      ),
    ).toEqual({ read: 49, 'harness-write': 4, 'local-write': 2, 'remote-write': 4 });
    const senseRun = registry.find((entry) => entry.name === 'sense run');
    expect(senseRun).toBeDefined();
    if (senseRun === undefined) throw new Error('sense run is not registered');

    const violations: string[] = [];
    let consentRefusals = 0;
    for (const descriptor of SENSOR_DESCRIPTORS) {
      const base = ['node', 'devai', 'sense', 'run', descriptor.kind];
      const resolved = resolveInvocationEntry(senseRun, base);
      if (
        resolved.effects !== descriptor.effect ||
        resolved.authority_contract.effect !== descriptor.effect ||
        JSON.stringify(resolved.authority_contract.capabilities) !==
          JSON.stringify(descriptor.capabilities) ||
        resolved.authority_contract.consent.write !== (descriptor.effect !== 'read') ||
        resolved.authority_contract.consent.allow_publish !== (descriptor.effect === 'remote-write')
      ) {
        violations.push(`${descriptor.kind}:resolved-contract-drift`);
      }

      for (const machine of [['--json'], ['--format', 'json']] as const) {
        const route = routeArgv(
          [...base, ...consentFor(descriptor.effect), ...machine],
          registry,
          version,
        );
        if (
          route.kind !== 'dispatch' ||
          route.argv.includes('--json') ||
          route.argv.includes('--format') ||
          route.argv.includes('json')
        ) {
          violations.push(`${descriptor.kind}:${machine.join(' ')}:canonical-dispatch`);
        }
      }

      if (descriptor.effect === 'harness-write' || descriptor.effect === 'local-write') {
        const refusal = routeArgv([...base, '--json'], registry, version);
        if (
          refusal.kind !== 'output' ||
          refusal.exitCode !== 2 ||
          !refusal.text.includes('--write')
        ) {
          violations.push(`${descriptor.kind}:missing-write-not-refused`);
        }
        consentRefusals += 1;
      }
      if (descriptor.effect === 'remote-write') {
        for (const partial of [[], ['--write'], ['--publish']] as const) {
          const refusal = routeArgv([...base, ...partial, '--json'], registry, version);
          if (
            refusal.kind !== 'output' ||
            refusal.exitCode !== 2 ||
            !refusal.text.includes('--write --publish')
          ) {
            violations.push(
              `${descriptor.kind}:${partial.join('+') || 'none'}:consent-not-independent`,
            );
          }
          consentRefusals += 1;
        }
      }
    }
    expect(consentRefusals).toBe(18);
    expect(violations).toEqual([]);
  });

  it('censuses sensors through the canonical descriptors and envelopes a registered kind', () => {
    expect(SENSOR_READING_KINDS).toEqual(SENSOR_DESCRIPTORS.map((descriptor) => descriptor.kind));
    expect(new Set(SENSOR_READING_KINDS).size).toBe(59);
    expect(SENSOR_DESCRIPTORS.map((descriptor) => descriptor.command)).toEqual(
      SENSOR_READING_KINDS.map((kind) => `sense run ${kind}`),
    );

    const json = run(['sense', 'run', 'inventory_determinism', '--json']);
    const format = run(['sense', 'run', 'inventory_determinism', '--format', 'json']);
    expect(json.status, json.stderr).toBe(0);
    expect(format.status, format.stderr).toBe(0);
    expect(json.stderr).toBe('');
    expect(format.stderr).toBe('');
    const jsonEnvelope = envelope(json.stdout);
    const formatEnvelope = envelope(format.stdout);
    const jsonProjection = withoutSensorTimestamp(jsonEnvelope);
    const formatProjection = withoutSensorTimestamp(formatEnvelope);
    expect(formatProjection.stable).toEqual(jsonProjection.stable);
    expect([jsonProjection.timestamp, formatProjection.timestamp]).toHaveLength(2);
    expect(jsonEnvelope).toMatchObject({ action_id: 'sense run', ok: true });
  }, 360_000);

  it('lets retired-route refusal win before any missing-infrastructure inspection', () => {
    const missing = `/tmp/devai-r0007-cycle5-missing-${String(process.pid)}`;
    const result = run(['adopt', 'pack', 'resolve', '--repo-root', missing, '--format', 'json']);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(errorEnvelope(result.stderr)).toMatchObject({
      code: 'ACTION_FOLDED',
      class: 'routing-authority',
      exit: 2,
      remediation: 'sense inventory --slice pack',
    });
    expect(result.stderr).not.toContain('infrastructure');
    expect(result.stderr).not.toContain('node:fs:');
    expect(result.stderr).not.toContain(missing);
  });
});
