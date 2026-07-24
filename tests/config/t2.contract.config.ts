import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T2 contract',
    environment: 'node',
    include: ['packages/*/tests/contract/**/*.test.ts'],
    passWithNoTests: false,
  },
});
