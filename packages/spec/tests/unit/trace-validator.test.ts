// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateTrace } from '../../src/spec/trace-validator.js';

const roots: string[] = [];
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('ordinary trace validation target boundary', () => {
  it.each(['../../outside.test.ts', 'tests', 'tests/not-a-test.ts'])(
    'rejects a non-contained executable-test target: %s',
    (target) => {
      const repo = mkdtempSync(join(tmpdir(), 'devai-trace-validator-'));
      roots.push(repo);
      mkdirSync(join(repo, 'law'), { recursive: true });
      mkdirSync(join(repo, 'tests'), { recursive: true });
      const trace = JSON.parse(readFileSync(join(ROOT, 'law/trace.json'), 'utf8')) as {
        invariants: Array<{ id: string; tests: Array<{ path: string }> }>;
      };
      const first = trace.invariants[0];
      if (first === undefined || first.tests[0] === undefined) throw new Error('trace fixture empty');
      first.tests[0].path = target;
      const tracePath = join(repo, 'law/trace.json');
      writeFileSync(tracePath, `${JSON.stringify(trace)}\n`);

      const result = validateTrace({
        tracePath,
        invariantIds: new Set(trace.invariants.map((entry) => entry.id)),
      });
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('contained executable test') }),
      );
    },
  );
});
