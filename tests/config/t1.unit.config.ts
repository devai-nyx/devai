import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T1 unit',
    environment: 'node',
    include: ['packages/*/tests/unit/**/*.test.ts'],
    passWithNoTests: false,
  },
});
