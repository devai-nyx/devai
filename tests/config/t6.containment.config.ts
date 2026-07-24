import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'T6 containment',
    environment: 'node',
    include: ['tests/containment/**/*.test.ts'],
    passWithNoTests: false,
  },
});
