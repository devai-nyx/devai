// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';

const mocks = vi.hoisted(() => ({
  emitRgr: vi.fn(),
  listRgrs: vi.fn(),
  readRgr: vi.fn(),
  resolveRgr: vi.fn(),
  spawnSync: vi.fn(),
}));
vi.mock('#core-compat', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  emitRgr: mocks.emitRgr,
  listRgrs: mocks.listRgrs,
  readRgr: mocks.readRgr,
  resolveRgr: mocks.resolveRgr,
}));
vi.mock('@devai-nyx/authority', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  spawnSync: mocks.spawnSync,
}));

import { recordRun } from '../../src/commands/record/run.js';
import { rgrEmit, rgrList, rgrResolve, rgrShow } from '../../src/commands/rgr/index.js';

const root = mkdtempSync(join(tmpdir(), 'devai-rgr-record-depth-'));
const originalExit = process.exit;
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;
const invokes = new Map<string, (...args: never[]) => unknown>();

interface CommandCapture {
  option(): CommandCapture;
  action(callback: (...args: never[]) => unknown): CommandCapture;
}

beforeAll(() => {
  for (const entry of [rgrEmit, rgrList, rgrShow, rgrResolve, recordRun]) {
    const command: CommandCapture = {
      option: () => command,
      action(callback) {
        invokes.set(entry.name, callback);
        return command;
      },
    };
    entry.register({ command: () => command } as unknown as CAC);
  }
});

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.emitRgr.mockReturnValue({
    id: 'RGR-0001',
    emitting_task_id: 'TASK-1',
    emitting_discipline: 'engineer',
    status: 'open',
    problem: { summary: 'gap' },
  });
  mocks.resolveRgr.mockReturnValue({ id: 'RGR-0001', status: 'resolved' });
  mocks.listRgrs.mockReturnValue([]);
});

afterEach(() => {
  process.exit = originalExit;
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

async function run(name: string, ...args: unknown[]) {
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
  const invoke = invokes.get(name);
  if (invoke === undefined) throw new Error(`missing ${name}`);
  await withAuthorityHostTestScope(() => invoke(...(args as never[])));
  return { stdout, stderr, exit: process.exitCode ?? 0 };
}

describe('RGR command branch depth', () => {
  it('covers every emit usage guard', async () => {
    const base = {
      repoRoot: root,
      taskId: 'TASK-1',
      discipline: 'engineer',
      summary: 'gap',
      ambiguity: 'unclear',
      evidence: 'EV-1',
    };
    for (const options of [
      { ...base, taskId: 'bad' },
      { ...base, discipline: 'owner' },
      { ...base, summary: '' },
      { ...base, ambiguity: '' },
      { ...base, evidence: undefined },
      { ...base, riskClass: 'invented' },
      { ...base, targetAuthority: 'engineer' },
    ]) {
      expect((await run('rgr emit', options)).stderr.length).toBeGreaterThan(0);
    }
  });

  it('emits complete optional arrays and handles human output and errors', async () => {
    const options = {
      repoRoot: root,
      taskId: 'TASK-1',
      discipline: 'auditor',
      summary: 'gap',
      ambiguity: 'unclear',
      evidence: ['EV-1', 'EV-2'],
      question: ['one?', 'two?'],
      invariant: ['INV-1'],
      journey: ['JNY-1'],
      surface: ['cli'],
      riskClass: 'correctness',
      targetAuthority: 'architect',
      proposedResolution: 'clarify',
      human: true,
    };
    expect((await run('rgr emit', options)).stdout).toContain('RGR-0001');
    expect(mocks.emitRgr).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          { qid: 'Q1', question: 'one?' },
          { qid: 'Q2', question: 'two?' },
        ],
      }),
    );
    mocks.emitRgr.mockImplementationOnce(() => {
      throw new Error('emit failed');
    });
    expect((await run('rgr emit', { ...options, human: false })).stderr).toContain('emit failed');
  });

  it('lists, filters, shows, resolves, and catches malformed resolutions', async () => {
    const records = [
      {
        id: 'RGR-0001',
        status: 'open',
        emitting_discipline: 'engineer',
        emitting_task_id: 'TASK-1',
        problem: { summary: 'gap' },
      },
      {
        id: 'RGR-0002',
        status: 'resolved',
        emitting_discipline: 'auditor',
        emitting_task_id: 'TASK-2',
        problem: { summary: 'done' },
      },
    ];
    mocks.listRgrs.mockReturnValueOnce(records);
    expect(
      (await run('rgr list', { repoRoot: root, status: 'open', human: true })).stdout,
    ).toContain('1 RGR(s)');
    mocks.listRgrs.mockImplementationOnce(() => {
      throw 'list failed';
    });
    expect((await run('rgr list', { repoRoot: root })).stderr).toContain('list failed');

    mocks.readRgr.mockReturnValueOnce(null);
    expect((await run('rgr show', 'RGR-missing', { repoRoot: root })).stderr).toContain(
      'not found',
    );
    mocks.readRgr.mockReturnValueOnce(records[0]);
    expect((await run('rgr show', 'RGR-0001', { repoRoot: root })).stdout).toContain('RGR-0001');

    expect((await run('rgr resolve', 'RGR-0001', { repoRoot: root })).stderr).toContain(
      '--resolver',
    );
    expect(
      (await run('rgr resolve', 'RGR-0001', { repoRoot: root, resolver: 'owner', status: 'open' }))
        .stderr,
    ).toContain('--status');
    expect(
      (await run('rgr resolve', 'RGR-0001', { repoRoot: root, resolver: 'owner', answer: 'bad' }))
        .stderr,
    ).toContain("expects 'Qn=text'");
    expect(
      (
        await run('rgr resolve', 'RGR-0001', {
          repoRoot: root,
          resolver: 'owner',
          status: 'superseded',
          answer: ['Q1=yes'],
          resultingCommit: ['a'.repeat(40)],
          resumedTaskId: 'TASK-2',
          human: true,
        })
      ).stdout,
    ).toContain('resolved');
  });
});

describe('test record command branch depth', () => {
  it('covers usage and retired-chain guards', async () => {
    expect(
      (await run('record run', { repoRoot: root, tier: 'bad', cmd: 'true' })).stderr,
    ).toContain('--tier');
    expect((await run('record run', { repoRoot: root, tier: 'unit' })).stderr).toContain('--cmd');
    expect(
      (await run('record run', { repoRoot: root, tier: 'unit', cmd: 'true', chain: true })).stderr,
    ).toContain('LEGACY_EVIDENCE_WRITER_RETIRED');
  });

  it('records pass, fail, and error child outcomes with Git fallbacks', async () => {
    for (const [status, expected] of [
      [0, 'pass'],
      [1, 'fail'],
      [9, 'error'],
    ] as const) {
      mocks.spawnSync.mockImplementation((executable?: string, args?: readonly string[]) => {
        if (executable === 'sh') {
          return { status, signal: status === 9 ? 'SIGTERM' : null, stdout: 'out', stderr: 'err' };
        }
        if (args?.includes('--abbrev-ref'))
          return { status: 0, signal: null, stdout: 'branch\n', stderr: '' };
        return { status: status === 9 ? 1 : 0, signal: null, stdout: 'a'.repeat(40), stderr: '' };
      });
      const result = await run('record run', {
        repoRoot: root,
        tier: 'unit',
        cmd: 'fixture',
        scope: 'scope / unsafe',
        repo: 'Repo Unsafe!',
        out: `records/${expected}.json`,
        timestamp: '2026-07-27T00:00:00.000Z',
        human: status === 0,
      });
      expect(status === 0 ? result.stdout : JSON.parse(result.stdout).status).toEqual(
        status === 0 ? expect.stringContaining('PASS') : expected,
      );
      mocks.spawnSync.mockReset();
    }
  });
});
