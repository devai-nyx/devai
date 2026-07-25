import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const PREWARM = join(ROOT, 'scripts', 'prewarm-package-managers.mjs');
const WORKFLOW = join(ROOT, '.github', 'workflows', 'ci.yml');

describe('cold-Corepack determinism', () => {
  it('derives every workspace and characterized-fixture package-manager pin', () => {
    expect(existsSync(PREWARM), 'BL-046 requires a package-manager prewarm verb').toBe(true);
    if (!existsSync(PREWARM)) return;

    const result = spawnSync(process.execPath, [PREWARM, '--repo-root', ROOT, '--list'], {
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([
      'pnpm@9.15.0+sha512.duI3l2CkMo7EQVgVvNZije5yevN3mqpMkU45RBVsQpmSGon5djge4QfUHxLPpLZmgcqccY8GaPoIMe1MbYulbA==',
      'pnpm@10.0.0',
    ]);
  });

  it('prewarms before the first pnpm invocation in every package-using CI job', () => {
    const workflow = parse(readFileSync(WORKFLOW, 'utf8')) as {
      jobs: Record<string, { steps: Array<{ run?: string }> }>;
    };
    const jobs = ['static', 'fast', 'changesets', 'merged-coverage'];
    for (const job of jobs) {
      const steps = workflow.jobs[job]?.steps ?? [];
      const commands = steps.flatMap((step) => (step.run === undefined ? [] : [step.run]));
      const prewarm = commands.indexOf('node scripts/prewarm-package-managers.mjs');
      const pnpm = commands.indexOf('pnpm install --frozen-lockfile');
      expect(prewarm, `${job} prewarms Corepack`).toBeGreaterThanOrEqual(0);
      expect(pnpm, `${job} installs dependencies`).toBeGreaterThan(prewarm);
    }
  });
});
// Invariants: INV-DEVAI-001, INV-DEVAI-008
