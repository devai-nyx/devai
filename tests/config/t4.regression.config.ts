import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T4 regression',
    environment: 'node',
    include: ['tests/regression/**/*.test.ts'],
    passWithNoTests: false,
  },
});
