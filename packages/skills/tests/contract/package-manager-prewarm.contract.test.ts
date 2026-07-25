import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const PREWARM = join(ROOT, 'scripts', 'prewarm-package-managers.mjs');
const WORKFLOW_DIR = join(ROOT, '.github', 'workflows');
const PNPM_10 =
  'pnpm@10.0.0+sha512.b8fef5494bd3fe4cbd4edabd0745df2ee5be3e4b0b8b08fa643aa3e4c6702ccc0f00d68fa8a8c9858a735a0032485a44990ed2810526c875e416f001b17df12b';

describe('cold-Corepack determinism', () => {
  it('derives every workspace and characterized-fixture package-manager pin', () => {
    expect(existsSync(PREWARM), 'BL-046 requires a package-manager prewarm verb').toBe(true);
    if (!existsSync(PREWARM)) return;

    const result = spawnSync(process.execPath, [PREWARM, '--repo-root', ROOT, '--list'], {
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([
      'pnpm@9.15.0+sha512.76e2379760a4328ec4415815bcd6628dee727af3779aaa4c914e3944156c4299921a89f976381ee107d41f12cfa4b66681ca9c718f0668fa0831ed4c6d8ba56c',
      PNPM_10,
    ]);
  });

  it('locally prepares every integrity-bound identity through the verification path', () => {
    const result = spawnSync(process.execPath, [PREWARM, '--repo-root', ROOT, '--verify'], {
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      verified: [
        'pnpm@9.15.0+sha512.76e2379760a4328ec4415815bcd6628dee727af3779aaa4c914e3944156c4299921a89f976381ee107d41f12cfa4b66681ca9c718f0668fa0831ed4c6d8ba56c',
        PNPM_10,
      ],
    });
  });

  it('prewarms before Corepack enable and install in every package-using workflow job', () => {
    for (const file of readdirSync(WORKFLOW_DIR).filter((name) => /\.ya?ml$/u.test(name))) {
      const workflow = parse(readFileSync(join(WORKFLOW_DIR, file), 'utf8')) as {
        jobs: Record<string, { steps?: Array<{ run?: string }> }>;
      };
      for (const [job, definition] of Object.entries(workflow.jobs)) {
        const commands = (definition.steps ?? []).flatMap((step) =>
          step.run === undefined ? [] : [step.run],
        );
        const install = commands.indexOf('pnpm install --frozen-lockfile');
        if (install < 0) continue;
        const prewarm = commands.indexOf('node scripts/prewarm-package-managers.mjs');
        const enable = commands.indexOf('corepack enable');
        expect(prewarm, `${file}:${job} prewarms Corepack`).toBeGreaterThanOrEqual(0);
        expect(enable, `${file}:${job} enables after prewarm`).toBeGreaterThan(prewarm);
        expect(install, `${file}:${job} installs after prewarm`).toBeGreaterThan(enable);
      }
    }
  });
});
// Invariants: INV-DEVAI-001, INV-DEVAI-008
