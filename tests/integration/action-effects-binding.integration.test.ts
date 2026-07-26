import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import './effects-check-cases.js';

// Invariants: INV-DEVAI-020

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const BIN = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
const DRIVER = resolve(REPO_ROOT, 'packages/cli/tests/fixtures/authorized-cli-test-driver.mjs');
const runIfBuilt = existsSync(BIN) ? it : it.skip;

describe('binding action-effect CLI', () => {
  runIfBuilt(
    'binds every kept, folded, and tombstoned action to the canonical effect registry',
    () => {
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
      expect(result.status, result.stderr).toBe(0);
      const output = JSON.parse(result.stdout) as {
        reading: { status: string };
        report: {
          findings: unknown[];
          metrics: {
            catalog_actions: number;
            extracted_actions: number;
            unresolved_edges: number;
          };
        };
      };
      expect(output.reading.status).toBe('pass');
      expect(output.report.findings).toEqual([]);
      expect(output.report.metrics).toMatchObject({
        catalog_actions: 186,
        extracted_actions: 186,
        unresolved_edges: 0,
      });
    },
    30_000,
  );
});
