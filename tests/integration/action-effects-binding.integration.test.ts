import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Invariants: INV-DEVAI-020

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const BIN = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
const DRIVER = resolve(REPO_ROOT, 'packages/cli/tests/fixtures/authorized-cli-test-driver.mjs');
const runIfBuilt = existsSync(BIN) ? it : it.skip;

describe('binding action-effect CLI', () => {
  runIfBuilt('pins the collapsed-catalog extractor mismatch as a known-red', () => {
    const result = spawnSync(
      'node',
      [
        DRIVER,
        'policy',
        'check',
        'action',
        'effects',
        '--repo-root',
        REPO_ROOT,
        '--tsconfig',
        'tests/config/tsconfig.effects.json',
        '--format',
        'json',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('EFFECT_EXTRACTOR_CATALOG_MISMATCH missing=[]');
    const extras = result.stderr.match(/extra=\[(backlog compact,[^\]]+)\]/)?.[1]?.split(',') ?? [];
    expect(extras).toHaveLength(39);
    expect(extras).toContain('backlog compact');
    expect(extras).toContain('sense test-weakening');
  });
});
