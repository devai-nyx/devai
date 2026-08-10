// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective structural red for DII-258. Behavioral equivalence is intentionally delegated
// to the existing complete controller adversary population and the literal close roster; this
// contract proves that the deferred decomposition actually exists and leaves only bootstrap
// and dispatch in the public entrypoint.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const ENTRYPOINT = join(ROOT, 'scripts/run-round-close-controls.mjs');

const CONCERNS = [
  ['runtime', 'scripts/round-close-controls/runtime.mjs'],
  ['legacy', 'scripts/round-close-controls/legacy.mjs'],
  ['impact', 'scripts/round-close-controls/impact.mjs'],
  ['governed', 'scripts/round-close-controls/governed.mjs'],
  ['review-lifecycle', 'scripts/round-close-controls/review-lifecycle.mjs'],
] as const;

describe('R-0007 B7 close-controller decomposition', () => {
  it('R7-B7-DECOMPOSITION-001 loads every DII-258 concern as a real module', async () => {
    const observed: string[] = [];
    for (const [expected, path] of CONCERNS) {
      try {
        const module = (await import(join(ROOT, path))) as { CONTROL_CONCERN?: unknown };
        if (module.CONTROL_CONCERN === expected) observed.push(expected);
      } catch {
        // A missing, malformed, or transitively broken concern remains absent from the census.
      }
    }
    expect(observed).toEqual(CONCERNS.map(([concern]) => concern));
  });

  it('R7-B7-DECOMPOSITION-002 leaves the public entrypoint as bootstrap and dispatch only', () => {
    const source = readFileSync(ENTRYPOINT, 'utf8');
    const lines = source.split('\n').length;
    expect(
      lines,
      'controller entrypoint still contains implementation concerns',
    ).toBeLessThanOrEqual(500);
    expect(source).not.toMatch(/\beval\s*\(|\bnew Function\s*\(|readFileSync\([^)]*\.mjs/gu);
    for (const [, path] of CONCERNS) expect(source).toContain(`./${path.replace('scripts/', '')}`);
  });

  it('R7-B7-DECOMPOSITION-003 assigns every top-level controller function to one real concern', () => {
    const owners = new Map<string, string>();
    for (const [concern, path] of CONCERNS) {
      const source = readFileSync(join(ROOT, path), 'utf8');
      expect(source, `${concern} delegates back into the former monolith`).not.toContain(
        'run-round-close-controls.mjs',
      );
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      const functions = file.statements
        .filter(ts.isFunctionDeclaration)
        .map((statement) => statement.name?.text)
        .filter((name): name is string => name !== undefined);
      expect(functions.length, `${concern} is only a marker or stub`).toBeGreaterThan(0);
      for (const name of functions) {
        expect(owners.has(name), `${name} is duplicated across controller concerns`).toBe(false);
        owners.set(name, concern);
      }
    }
    expect(owners.size).toBeGreaterThan(CONCERNS.length);
  });
});
