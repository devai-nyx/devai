import { describe, expect, it } from 'vitest';
import { processIsReadOnlyForTest } from './authority-host-test-scope.js';

// Invariants: INV-DEVAI-001, INV-DEVAI-017, INV-DEVAI-020

const processRequest = (args: readonly string[]) => ({
  kind: 'process' as const,
  symbol: 'spawnSync',
  arguments: ['pnpm', args],
});

describe('authority test host read-only pnpm boundary', () => {
  it('accepts the two governed fixed Vitest argv shapes', () => {
    expect(processIsReadOnlyForTest(processRequest(['vitest', 'run']))).toBe(true);
    expect(
      processIsReadOnlyForTest(
        processRequest(['vitest', 'run', '--config', 'tests/config/t2.contract.config.ts']),
      ),
    ).toBe(true);
  });

  it.each([
    ['vitest', 'run', '--config', '../vitest.config.ts'],
    ['vitest', 'run', '--config', 'tests/config/nested/t2.ts'],
    ['vitest', 'run', '--watch'],
    ['vitest', 'run', '--config', 'tests/config/t2.contract.config.ts', '--update'],
    ['run', 'arbitrary'],
    ['exec', 'sh', '-c', 'echo unsafe'],
  ])('rejects non-governed pnpm argv %j', (...args) => {
    expect(processIsReadOnlyForTest(processRequest(args))).toBe(false);
  });
});
