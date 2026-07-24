import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T3 integration',
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    passWithNoTests: false,
  },
});
