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

process.env['DEVAI_V8_SUBPROCESS_COVERAGE_DIR'] = resolve(
  'scratch/coverage/t1-t6-child-v8',
);

export default defineConfig({
  test: {
    name: 'T1 + T3 merged coverage',
    environment: 'node',
    testTimeout: 15_000,
    include: [
      'packages/*/tests/unit/**/*.test.ts',
      'packages/*/tests/contract/**/*.test.ts',
      'tests/contract/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/regression/**/*.test.ts',
      'tests/e2e/**/*.test.ts',
      'tests/containment/**/*.test.ts',
    ],
    passWithNoTests: false,
    coverage: {
      provider: 'custom',
      customProviderModule: resolve('tests/config/subprocess-v8-coverage-provider.ts'),
      enabled: true,
      reportsDirectory: 'coverage/t1-t3',
      reporter: ['text', 'json-summary'],
      include: ['packages/*/src/**/*.{ts,tsx,js,mjs,cjs}'],
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
