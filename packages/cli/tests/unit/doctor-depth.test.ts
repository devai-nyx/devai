// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';
import { detectPosture, doctor } from '../../src/commands/doctor.js';

const ROOT = resolve(import.meta.dirname, '../../../..');
const originalExit = process.exit;
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${String(code)}`);
  }
}

interface DoctorInvocation {
  readonly repoRoot: string;
  readonly chain?: string;
  readonly self?: boolean;
  readonly adopter?: boolean;
  readonly auto?: boolean;
  readonly human?: boolean;
  readonly skip?: string;
}

let invokeDoctor: (options: DoctorInvocation) => void;

interface CommandCapture {
  option(): CommandCapture;
  action(callback: (options: DoctorInvocation) => void): CommandCapture;
}

beforeAll(() => {
  const command: CommandCapture = {
    option(): CommandCapture {
      return command;
    },
    action(callback: (options: DoctorInvocation) => void): CommandCapture {
      invokeDoctor = callback;
      return command;
    },
  };
  doctor.register({ command: () => command } as unknown as CAC);
});

afterEach(() => {
  process.exit = originalExit;
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
});

async function run(options: DoctorInvocation): Promise<{
  readonly exit: number;
  readonly stdout: string;
  readonly stderr: string;
}> {
  let stdout = '';
  let stderr = '';
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  process.exit = ((code?: number) => {
    throw new ExitSignal(code ?? 0);
  }) as typeof process.exit;

  try {
    await withAuthorityHostTestScope(() => invokeDoctor(options));
    throw new Error('doctor returned without an exit');
  } catch (error) {
    if (!(error instanceof ExitSignal)) throw error;
    return { exit: error.code, stdout, stderr };
  }
}

describe('doctor posture and report depth', () => {
  const adopter = mkdtempSync(join(tmpdir(), 'devai-doctor-adopter-'));
  const selfShape = mkdtempSync(join(tmpdir(), 'devai-doctor-self-'));

  beforeAll(() => {
    for (const path of [
      'product',
      'law/invariants',
      'law/schemas',
      'law/adr',
      'law/glossary',
      'docs/dev/operations',
      'docs/dev/security',
      '.devai/config',
    ]) {
      mkdirSync(join(adopter, path), { recursive: true });
    }
    writeFileSync(
      join(adopter, '.devai/config/project.json'),
      `${JSON.stringify({ schemaVersion: '1.0.0', adoption_profile: 'tier1' }, null, 2)}\n`,
    );
    mkdirSync(join(selfShape, 'packages/cli/src'), { recursive: true });
    mkdirSync(join(selfShape, 'examples/redox-pack-fixture'), { recursive: true });
    writeFileSync(join(selfShape, 'packages/cli/src/bin.ts'), 'export {};\n');
  });

  afterAll(() => {
    rmSync(adopter, { recursive: true, force: true });
    rmSync(selfShape, { recursive: true, force: true });
  });

  it('detects self and adopter repositories from their actual filesystem shape', () => {
    expect(detectPosture(selfShape)).toBe('self');
    expect(detectPosture(adopter)).toBe('adopter');
  });

  it('runs the complete self posture and emits a structured failing health report', async () => {
    const result = await run({ repoRoot: ROOT, self: true, skip: 'docs-governance' });
    expect(result.exit).toBe(2);
    expect(result.stderr).toBe('');
    const report = JSON.parse(result.stdout) as {
      posture: string;
      posture_source: string;
      checks: Array<{ name: string }>;
    };
    expect(report).toMatchObject({ posture: 'self', posture_source: 'flag' });
    expect(report.checks.length).toBeGreaterThanOrEqual(12);
    expect(report.checks.map((check) => check.name)).toContain('authority-enforcement');
  });

  it('runs the adopter posture and renders its advisory health report for humans', async () => {
    const result = await run({ repoRoot: adopter, auto: true, human: true });
    expect(result.exit).toBe(2);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('devai doctor [posture=adopter (auto), profile=tier3]: FAIL');
    expect(result.stdout).toContain('f1-paths-present');
  });

  it('rejects conflicting posture flags before running checks', async () => {
    const result = await run({ repoRoot: ROOT, self: true, adopter: true });
    expect(result.exit).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('--self, --adopter, and --auto are mutually exclusive');
  });
});
