// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R7-B5-TIER-PLAN-INSPECTOR-001: canonical tier-climb planning is a read-only
// init-upgrade mode and must reach the live handler without mutation authority.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');

function targetSnapshot(root: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const relativePath = join(entry.parentPath.slice(root.length + 1), entry.name);
        return [relativePath, readFileSync(join(root, relativePath), 'utf8')];
      }),
  );
}

describe('R-0007 B5 canonical tier-plan pre-dispatch contract', () => {
  it('R7-B5-TIER-PLAN-INSPECTOR-001 reaches the checklist handler without authority or writes', () => {
    const target = mkdtempSync(join(tmpdir(), 'devai-r7-b5-tier-plan-'));
    try {
      mkdirSync(join(target, '.devai/config'), { recursive: true });
      mkdirSync(join(target, '.devai/pin'), { recursive: true });
      writeFileSync(
        join(target, '.devai/config/project.json'),
        `${JSON.stringify({ profile: 'tier1' }, null, 2)}\n`,
      );
      writeFileSync(
        join(target, '.devai/pin/constitution.md'),
        readFileSync(join(ROOT, 'law/constitution.md')),
      );
      const before = targetSnapshot(target);
      const invocation = [
        'init',
        'upgrade',
        '--tier',
        'tier2',
        '--target',
        target,
        '--format',
        'json',
      ];
      expect(invocation).not.toContain('--as-role');
      expect(invocation).not.toContain('--write');

      const result = spawnSync(process.execPath, [BIN, ...invocation], {
        cwd: ROOT,
        encoding: 'utf8',
        env: subprocessCoverageEnvironment(),
        timeout: 15_000,
      });

      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stderr).toBe('');
      expect(targetSnapshot(target)).toEqual(before);
      expect(JSON.parse(result.stdout)).toEqual({
        schemaVersion: '1.0.0',
        action_id: 'init upgrade',
        ok: true,
        result: {
          media_type: 'application/json',
          value: {
            from: 'tier1',
            to: 'tier2',
            steps: [
              expect.objectContaining({ step: 'Author your first invariants' }),
              expect.objectContaining({ step: 'Create trace.json' }),
              expect.objectContaining({ step: 'Turn on spec validation' }),
              expect.objectContaining({ step: 'Enable test-weakening checks' }),
              expect.objectContaining({ step: 'Run the deterministic sensor battery' }),
            ],
          },
        },
      });
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});
