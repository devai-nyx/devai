import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
    expect(JSON.parse(result.stdout)).toEqual(['pnpm@9.15.0', 'pnpm@10.0.0']);
  });

  it('prewarms before the first pnpm invocation in every package-using CI job', () => {
    const workflow = readFileSync(WORKFLOW, 'utf8');
    const jobs = ['static', 'fast', 'changesets', 'merged-coverage'];
    for (const job of jobs) {
      const start = workflow.indexOf(`  ${job}:`);
      expect(start, `${job} job exists`).toBeGreaterThanOrEqual(0);
      const next = workflow.indexOf('\n  ', start + 3);
      const body = workflow.slice(start, next < 0 ? undefined : next);
      const prewarm = body.indexOf('node scripts/prewarm-package-managers.mjs');
      const pnpm = body.indexOf('pnpm install --frozen-lockfile');
      expect(prewarm, `${job} prewarms Corepack`).toBeGreaterThanOrEqual(0);
      expect(pnpm, `${job} installs dependencies`).toBeGreaterThan(prewarm);
    }
  });
});
