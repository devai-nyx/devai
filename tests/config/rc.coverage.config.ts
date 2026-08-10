import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { LOCAL_INCLUDE, RC_ONLY } from './local.config.js';

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

process.env['DEVAI_V8_SUBPROCESS_COVERAGE_DIR'] = resolve('scratch/coverage/rc-child-v8');

export default defineConfig({
  resolve: {
    alias: { '#core-compat': resolve('packages/cli/src/core-compat.ts') },
  },
  test: {
    name: 'RC coverage',
    environment: 'node',
    testTimeout: 15_000,
    include: [...LOCAL_INCLUDE],
    exclude: ['**/node_modules/**', '**/dist/**', ...RC_ONLY],
    passWithNoTests: false,
    coverage: {
      provider: 'custom',
      customProviderModule: resolve('tests/config/subprocess-v8-coverage-provider.ts'),
      enabled: true,
      reportsDirectory: 'scratch/coverage/rc',
      reporter: ['text', 'json-summary', 'json'],
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
