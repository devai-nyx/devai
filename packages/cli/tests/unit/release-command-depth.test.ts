// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runReleaseGate: vi.fn(),
  runPostdeployVerify: vi.fn(),
  runPostdeployVerifyFromCharter: vi.fn(),
  runRuntimeDrift: vi.fn(),
  runRuntimeDriftFromCharter: vi.fn(),
  listReleases: vi.fn(),
  executeRuntimeProbe: vi.fn(),
}));

vi.mock('#core-compat', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  runReleaseGate: mocks.runReleaseGate,
  runPostdeployVerify: mocks.runPostdeployVerify,
  runPostdeployVerifyFromCharter: mocks.runPostdeployVerifyFromCharter,
  runRuntimeDrift: mocks.runRuntimeDrift,
  runRuntimeDriftFromCharter: mocks.runRuntimeDriftFromCharter,
  listReleases: mocks.listReleases,
}));
vi.mock('@devai-nyx/sensors', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  executeRuntimeProbe: mocks.executeRuntimeProbe,
}));

import {
  releaseGate,
  releaseList,
  releasePostdeployVerify,
  releaseRuntimeDrift,
} from '../../src/commands/release/index.js';

const root = mkdtempSync(join(tmpdir(), 'devai-release-depth-'));
const originalExit = process.exit;
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

type Invoke = (options: Record<string, unknown>) => void | Promise<void>;
const invocations = new Map<string, Invoke>();

interface CommandCapture {
  option(): CommandCapture;
  action(callback: Invoke): CommandCapture;
}

beforeAll(() => {
  for (const entry of [releaseGate, releasePostdeployVerify, releaseRuntimeDrift, releaseList]) {
    const command: CommandCapture = {
      option: () => command,
      action(callback) {
        invocations.set(entry.name, callback);
        return command;
      },
    };
    entry.register({ command: () => command } as unknown as CAC);
  }
});

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
});

afterEach(() => {
  process.exit = originalExit;
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

async function run(name: string, options: Record<string, unknown>) {
  let stdout = '';
  let stderr = '';
  process.exitCode = undefined;
  process.exit = ((code?: number) => {
    process.exitCode = code ?? 0;
    return undefined as never;
  }) as typeof process.exit;
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  const invoke = invocations.get(name);
  if (invoke === undefined) throw new Error(`missing ${name}`);
  await invoke({ repoRoot: root, ...options });
  return { stdout, stderr, exit: process.exitCode ?? 0 };
}

function releaseRecord(overrides: Record<string, unknown> = {}) {
  return { id: 'REL-0001', verdict: 'pass', reasons: [], decided_at: '2026-07-27', ...overrides };
}

function probeSummary() {
  return {
    verdict: 'fail',
    pass: 0,
    fail: 1,
    error: 0,
    review: 0,
    skipped: 0,
    outcomes: [
      { pid: 'P1', name: 'probe', verdict: 'fail', failed_expectations: ['expected 200'] },
      { pid: 'P2', name: 'error probe', verdict: 'error', failed_expectations: ['network'] },
    ],
  };
}

function charterValue(kind: 'api' | 'auth' | 'data') {
  return {
    schemaVersion: '1.0.0',
    id: `RPC-${kind}`,
    kind,
    mission: 'Exercise release command detector depth.',
    target: { base_url: 'https://example.invalid' },
    probes: [{ pid: 'P1', name: 'fixture', path: '/health', expect: { status: 200 } }],
  };
}

describe('release command branch depth', () => {
  it('validates release-gate environment and renders strict human decisions and failures', async () => {
    expect((await run('release gate', { environment: 'invalid' })).stderr).toContain(
      '--environment',
    );
    mocks.runReleaseGate.mockReturnValueOnce(releaseRecord({ verdict: 'block', reasons: ['red'] }));
    const blocked = await run('release gate', {
      environment: 'staging',
      scorecard: 'score.json',
      artifact: 'sha256:x',
      auditChainHead: 'a'.repeat(64),
      strict: true,
      human: true,
    });
    expect(blocked.exit).toBe(2);
    expect(blocked.stdout).toContain('reasons:');
    mocks.runReleaseGate.mockImplementationOnce(() => {
      throw new Error('gate failure');
    });
    expect((await run('release gate', {})).stderr).toContain('gate failure');
  });

  it('covers postdeploy usage, record, detector, charter, and rollback branches', async () => {
    expect((await run('release postdeploy-verify', {})).stderr).toContain('--artifact is required');
    expect(
      (
        await run('release postdeploy-verify', {
          artifact: 'x',
          environment: 'invalid',
          auditChainHead: 'a',
        })
      ).stderr,
    ).toContain('--environment');
    expect(
      (
        await run('release postdeploy-verify', {
          artifact: 'x',
          runtimeCharter: 'x',
          auditChainHead: 'a',
        })
      ).stderr,
    ).toContain('mutually exclusive');
    expect((await run('release postdeploy-verify', { artifact: 'x' })).stderr).toContain(
      'either --runtime-charter',
    );
    expect(
      (await run('release postdeploy-verify', { artifact: 'x', auditChainHead: 'a' })).stderr,
    ).toContain('--artifact-chain-head');

    mocks.runPostdeployVerify.mockReturnValueOnce(
      releaseRecord({ verdict: 'block', rollback_recommended: true }),
    );
    const record = await run('release postdeploy-verify', {
      artifact: 'x',
      artifactChainHead: 'a',
      auditChainHead: 'b',
      environment: 'prod',
      strict: true,
      human: true,
    });
    expect(record.stdout).toContain('rollback recommended');

    const charter = join(root, 'charter.json');
    writeFileSync(charter, JSON.stringify(charterValue('api')));
    mocks.executeRuntimeProbe.mockResolvedValueOnce({ summary: probeSummary() });
    mocks.runPostdeployVerifyFromCharter.mockReturnValueOnce(releaseRecord({ verdict: 'pass' }));
    expect(
      (await run('release postdeploy-verify', { artifact: 'x', runtimeCharter: charter })).stdout,
    ).toContain('REL-0001');

    writeFileSync(charter, JSON.stringify(charterValue('auth')));
    expect(
      (await run('release postdeploy-verify', { artifact: 'x', runtimeCharter: charter })).stderr,
    ).toContain("does not match expected 'api'");
  });

  it('covers runtime-drift usage, record parsing, detector kinds, and strict output', async () => {
    expect((await run('release runtime-drift', { environment: 'invalid' })).stderr).toContain(
      '--environment',
    );
    expect(
      (
        await run('release runtime-drift', {
          observation: 'api=changed',
          runtimeCharter: 'x',
        })
      ).stderr,
    ).toContain('mutually exclusive');
    expect((await run('release runtime-drift', { observation: 'invalid' })).stderr).toContain(
      "expects 'surface=delta'",
    );
    mocks.runRuntimeDrift.mockReturnValueOnce(
      releaseRecord({ verdict: 'block', drift_observations: [{ surface: 'api' }] }),
    );
    const record = await run('release runtime-drift', {
      observation: ['api=changed', 'auth=changed'],
      artifact: 'x',
      environment: 'preview',
      strict: true,
      human: true,
    });
    expect(record.exit).toBe(2);
    expect(record.stdout).toContain('1 observation(s)');

    const charter = join(root, 'drift-charter.json');
    writeFileSync(charter, JSON.stringify(charterValue('data')));
    expect((await run('release runtime-drift', { runtimeCharter: charter })).stderr).toContain(
      'must be api or auth',
    );
    writeFileSync(charter, JSON.stringify(charterValue('auth')));
    mocks.executeRuntimeProbe.mockResolvedValueOnce({ summary: probeSummary() });
    mocks.runRuntimeDriftFromCharter.mockReturnValueOnce(
      releaseRecord({ verdict: 'pass', drift_observations: [] }),
    );
    expect(
      (await run('release runtime-drift', { runtimeCharter: charter, human: true })).stdout,
    ).toContain('detector:');
  });

  it('filters, renders, and fails closed while listing release records', async () => {
    mocks.listReleases.mockReturnValueOnce([
      { id: 'REL-1', kind: 'gate', verdict: 'pass', environment: 'prod', decided_at: 'now' },
      { id: 'REL-2', kind: 'runtime-drift', verdict: 'block', decided_at: 'later' },
    ]);
    const listed = await run('release list', { kind: 'gate', human: true });
    expect(listed.stdout).toContain('1 record(s)');
    mocks.listReleases.mockImplementationOnce(() => {
      throw 'list failure';
    });
    expect((await run('release list', {})).stderr).toContain('list failure');
  });
});
