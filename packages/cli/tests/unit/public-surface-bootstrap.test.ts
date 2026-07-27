// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import { afterEach, describe, expect, it } from 'vitest';

const originalArgv = [...process.argv];
const originalExitCode = process.exitCode;
const originalWrite = process.stdout.write;

afterEach(() => {
  process.argv = [...originalArgv];
  process.exitCode = originalExitCode;
  process.stdout.write = originalWrite;
});

describe('public CLI bootstrap', () => {
  it('registers the complete governed surface and renders root help in process', async () => {
    let stdout = '';
    process.argv = ['node', 'devai', '--help'];
    process.exitCode = undefined;
    process.stdout.write = ((chunk: unknown) => {
      stdout += typeof chunk === 'string' ? chunk : String(chunk);
      return true;
    }) as typeof process.stdout.write;

    await import('../../src/bin.js');

    expect(process.exitCode).toBe(0);
    expect(stdout).toContain('Usage: devai <command> [options]');
    expect(stdout).toContain('Domains:');
    expect(stdout).toContain('catalog');
    expect(stdout).toContain('govern');
    expect(stdout).toContain('work');
  });
});
