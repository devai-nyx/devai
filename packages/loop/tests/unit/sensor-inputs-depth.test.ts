// Invariants: INV-DEVAI-001, INV-DEVAI-012, INV-DEVAI-017
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../skills/tests/unit/authority-host-test-scope.js';
import {
  computeSensorInputDigest,
  evaluateSensorInputIntegrity,
  type SensorInputRegistry,
  type SensorInputSpec,
} from '../../src/sensor-inputs/index.js';

const repository = mkdtempSync(join(tmpdir(), 'devai-sensor-inputs-'));

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: repository, encoding: 'utf8' });
}

const spec: SensorInputSpec = {
  kind: 'fixture',
  spec_version: 2,
  file_inputs: [
    { pattern: 'src/**/*.ts' },
    { pattern: 'config/*.json', min_matches: 0, reason: 'optional adopter configuration' },
  ],
  tool_inputs: ['node', 'pnpm'],
  env_inputs: ['MODE'],
  hermetic: true,
};

beforeAll(() => {
  git('init', '-q');
  git('config', 'user.name', 'DEVAI Inspector');
  git('config', 'user.email', 'aarusso@nyxk.com.br');
  execFileSync('mkdir', ['-p', join(repository, 'src')]);
  writeFileSync(join(repository, 'src/a.ts'), 'export const a = 1;\n');
  writeFileSync(join(repository, 'src/b.ts'), 'export const b = 2;\n');
  git('add', '.');
  git('commit', '-qm', 'fixture');
});

afterAll(() => rmSync(repository, { recursive: true, force: true }));

describe('sensor-input integrity and digest depth', () => {
  it('accepts live required inputs and documented optional inputs', async () => {
    const registry: SensorInputRegistry = {
      schemaVersion: '1.0.0',
      id: 'sensor-inputs',
      source_authority: 'F1-architect',
      materialization: {},
      specs: [spec],
    };
    expect(
      await withAuthorityHostTestScope(() => evaluateSensorInputIntegrity(repository, registry)),
    ).toEqual({
      ok: true,
      issues: [],
    });
  });

  it('reports ineligible, undocumented optional, dead, and dead-alternative inputs', async () => {
    const registry = {
      schemaVersion: '1.0.0',
      id: 'sensor-inputs',
      source_authority: 'F1-architect',
      materialization: {},
      specs: [
        { ...spec, kind: 'ineligible', hermetic: false },
        {
          ...spec,
          kind: 'broken',
          file_inputs: [
            { pattern: 'missing/**', min_matches: 2 },
            { pattern: 'optional/**', min_matches: 0 },
            { group_id: 'source-choice', any_of: ['none-a/**', 'none-b/**'] },
          ],
        },
      ],
    } as unknown as SensorInputRegistry;
    const report = await withAuthorityHostTestScope(() =>
      evaluateSensorInputIntegrity(repository, registry),
    );
    expect(report.ok).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      'SENSOR_INPUT_KIND_INELIGIBLE',
      'SENSOR_INPUT_DEAD_GLOB',
      'SENSOR_INPUT_OPTIONAL_REASON_REQUIRED',
      'SENSOR_INPUT_ALTERNATIVES_DEAD',
    ]);
  });

  it('binds clean indexed inputs to HEAD and changes the digest for dirty and deleted inputs', async () => {
    const context = {
      sensor_version: '1.2.3',
      command_hash: 'command-sha',
      tool_versions: { node: '24.0.0', pnpm: '10.0.0', ignored: 'x' },
      env_values: { MODE: 'test', IGNORED: 'x' },
    };
    const clean = await withAuthorityHostTestScope(() =>
      computeSensorInputDigest(repository, spec, context),
    );
    expect(clean.subject).toEqual({ kind: 'git_sha', git_sha: git('rev-parse', 'HEAD').trim() });

    writeFileSync(join(repository, 'src/a.ts'), 'export const a = 3;\n');
    writeFileSync(join(repository, 'src/new.ts'), 'export const value = 4;\n');
    const dirty = await withAuthorityHostTestScope(() =>
      computeSensorInputDigest(repository, spec, context),
    );
    expect(dirty.subject).toMatchObject({ kind: 'dirty' });
    if (dirty.subject.kind !== 'dirty') throw new Error('expected dirty subject');
    expect(dirty.subject.dirty_files).toEqual(['src/a.ts', 'src/new.ts']);
    expect(dirty.input_digest_sha256).not.toBe(clean.input_digest_sha256);

    unlinkSync(join(repository, 'src/b.ts'));
    const deleted = await withAuthorityHostTestScope(() =>
      computeSensorInputDigest(repository, spec, context),
    );
    if (deleted.subject.kind !== 'dirty') throw new Error('expected dirty subject');
    expect(deleted.subject.dirty_files).toEqual(['src/a.ts', 'src/b.ts', 'src/new.ts']);
  });

  it('fails closed when a declared tool or environment value is absent', async () => {
    await expect(
      withAuthorityHostTestScope(() =>
        computeSensorInputDigest(repository, spec, {
          sensor_version: '1',
          command_hash: 'x',
          tool_versions: { node: '24' },
          env_values: { MODE: 'test' },
        }),
      ),
    ).rejects.toThrow('SENSOR_INPUT_TOOL_VERSION_MISSING: pnpm');
    await expect(
      withAuthorityHostTestScope(() =>
        computeSensorInputDigest(repository, spec, {
          sensor_version: '1',
          command_hash: 'x',
          tool_versions: { node: '24', pnpm: '10' },
          env_values: {},
        }),
      ),
    ).rejects.toThrow('SENSOR_INPUT_ENV_VALUE_MISSING: MODE');
  });
});
