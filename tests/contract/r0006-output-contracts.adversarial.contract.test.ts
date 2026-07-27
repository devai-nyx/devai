// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validators } from '../../packages/schemas/src/index.js';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = resolve(ROOT, 'packages/cli/dist/bin.js');

function run(args: readonly string[]) {
  return spawnSync('node', [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: subprocessCoverageEnvironment(),
    timeout: 15_000,
  });
}

function parsed(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>;
}

describe('R-0006 action-result adversaries', () => {
  it('validates the common envelope and the catalog-specific payload contract', () => {
    const result = run(['catalog', 'actions', '--format', 'json']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    const envelope = parsed(result.stdout);
    expect(validators.actionResult(envelope), validators.actionResult.errors).toBe(true);
    expect(envelope).toMatchObject({ action_id: 'catalog actions', ok: true });
    const payload = (envelope['result'] as Record<string, unknown>)['value'];
    expect(validators.actionsListOutput(payload), validators.actionsListOutput.errors).toBe(true);
  });

  it('normalizes an in-handler usage failure onto stderr only', () => {
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
    const envelope = parsed(result.stderr);
    expect(validators.actionResult(envelope), validators.actionResult.errors).toBe(true);
    expect(envelope).toMatchObject({
      action_id: 'catalog actions',
      ok: false,
      error: { class: 'routing-authority', exit: 2 },
    });
  });

  it('normalizes a pre-dispatch authority refusal with the routed action identity', () => {
    const result = run(['adopt', 'ci', 'scaffold', '--write', '--format', 'json']);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    const envelope = parsed(result.stderr);
    expect(validators.actionResult(envelope), validators.actionResult.errors).toBe(true);
    expect(envelope).toMatchObject({ action_id: 'adopt ci scaffold', ok: false });
  });

  it('preserves the human presentation outside the machine contract', () => {
    const result = run(['catalog', 'actions', '--format', 'human']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/^COMMAND/u);
    expect(() => JSON.parse(result.stdout)).toThrow();
  });

  it('rejects missing, contradictory, and extra envelope fields', () => {
    const valid = {
      schemaVersion: '1.0.0',
      action_id: 'catalog actions',
      ok: true,
      result: { media_type: 'application/json', value: [] },
    };
    expect(validators.actionResult(valid)).toBe(true);
    expect(validators.actionResult({ ...valid, result: undefined })).toBe(false);
    expect(
      validators.actionResult({
        ...valid,
        error: {
          schemaVersion: '1.0.0',
          code: 'INVALID',
          class: 'invalid-input',
          exit: 4,
          message: 'invalid',
        },
      }),
    ).toBe(false);
    expect(validators.actionResult({ ...valid, caller_action_id: 'catalog actions' })).toBe(false);
  });

  it('keeps domain payload validation independent from the common transport envelope', () => {
    const wrongPayload = {
      schemaVersion: '1.0.0',
      action_id: 'catalog actions',
      ok: true,
      result: { media_type: 'application/json', value: { not: 'an action list' } },
    };
    expect(validators.actionResult(wrongPayload)).toBe(true);
    expect(validators.actionsListOutput(wrongPayload.result.value)).toBe(false);
  });
});
