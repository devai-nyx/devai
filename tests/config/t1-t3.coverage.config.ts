import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

interface ThresholdPolicy {
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}

const policy = JSON.parse(
  readFileSync(resolve('law/policy/thresholds.json'), 'utf8'),
) as ThresholdPolicy;

export default defineConfig({
  test: {
    name: 'T1 + T3 merged coverage',
    environment: 'node',
    include: ['packages/*/tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      enabled: true,
      reportsDirectory: 'coverage/t1-t3',
      reporter: ['text', 'json-summary'],
      exclude: ['**/dist/**', '**/tests/**', '**/*.config.ts', '**/generated/**'],
      thresholds: {
        lines: policy.coverage.lines,
        branches: policy.coverage.branches,
        functions: policy.coverage.functions,
        statements: policy.coverage.statements,
      },
    },
  },
});
