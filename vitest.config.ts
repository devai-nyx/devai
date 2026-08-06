import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import { evidencePreservingProjects } from './vitest.scheduler.js';

// Vitest evaluates its root configuration once in the coordinator process, before it
// creates any workers. Keep the authoritative literal `pnpm vitest run` independently
// executable by preparing the generated schemas and CLI synchronously at that boundary.
// `tsc -b` is incremental, so an already-prepared checkout takes the cheap no-op path.
execFileSync('pnpm', ['run', 'devai:prepare'], {
  cwd: import.meta.dirname,
  stdio: 'inherit',
});

export default defineConfig({
  test: {
    projects: evidencePreservingProjects({
      ordinaryName: 'ordinary-parallel',
      serializedName: 'detached-candidate-serial',
    }),
  },
});
