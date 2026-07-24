import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T5 smoke / E2E',
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    passWithNoTests: false,
  },
});
