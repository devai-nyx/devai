// R20.W1 matrix row 1 — API-surface parity (D-137 v2; W1 correction
// contract item 1). The export inventory comes from the TypeScript
// checker's re-export-following symbol enumeration, so it remains correct
// after W2 slice 8 turns index.ts into `export { X } from ...` /
// `export type { Y } from ...` façade statements. Red-proofed against a
// synthetic re-export fixture before trusting it on the real module.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as skills from '../../src/skills/index.js';
import { BASELINE_DIR, HERE, baseline, canonical } from './r20-harness.js';

interface ExportRecord {
  readonly name: string;
  readonly kind: 'value' | 'type';
}

export function exportInventory(entryFile: string): ExportRecord[] {
  const program = ts.createProgram([entryFile], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: false,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(entryFile);
  if (sf === undefined) throw new Error(`no source file: ${entryFile}`);
  const moduleSymbol = checker.getSymbolAtLocation(sf);
  if (moduleSymbol === undefined) throw new Error('module has no symbol (no exports?)');
  return (
    checker
      .getExportsOfModule(moduleSymbol)
      .map((sym) => {
        const resolved = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
        const isValue =
          (resolved.flags &
            (ts.SymbolFlags.Value |
              ts.SymbolFlags.Function |
              ts.SymbolFlags.Variable |
              ts.SymbolFlags.Class)) !==
          0;
        return { name: sym.getName(), kind: isValue ? ('value' as const) : ('type' as const) };
      })
      // ASCII ordering, deliberately not localeCompare: the red-proof caught
      // locale-dependent ordering ('fn' before 'Shape'), a portability hazard
      // for a committed fixture.
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  );
}

let synth = '';

beforeEach(() => {
  synth = mkdtempSync(join(tmpdir(), 'r20-api-'));
});

afterEach(() => {
  rmSync(synth, { recursive: true, force: true });
});

describe('R20 baseline: skills module API surface (checker-based)', () => {
  it('records the exact R-0004 bounded-build fixture delta', () => {
    const disposition = JSON.parse(
      readFileSync(join(BASELINE_DIR, 'r0004-disposition.json'), 'utf8'),
    ) as {
      round: string;
      changed_fixtures: Record<
        string,
        { implementation_commit: string; reason: string; changed_fields: string[] }
      >;
    };
    expect(disposition.round).toBe('R-0004');
    expect(Object.keys(disposition.changed_fixtures)).toEqual(['fingerprint-behavior.json']);
    expect(disposition.changed_fixtures['fingerprint-behavior.json']).toEqual({
      implementation_commit: '2938b14e5d6ef3c4e5190af48e180dc4776c34f2',
      reason:
        'SKILL-build-project now observes the fixed non-recursive pnpm -r build argv required by BL-031.',
      changed_fields: [
        'SKILL-build-project.behavior.evidence.command',
        'SKILL-build-project.behavior.evidence.command_hash',
      ],
    });
  });

  it('records only the three explained post-fork fixture deltas', () => {
    const disposition = JSON.parse(
      readFileSync(join(BASELINE_DIR, 'rebase-disposition.json'), 'utf8'),
    ) as {
      changed_fixtures: Record<string, { upstream_commits: string[] }>;
      unchanged_fixtures: string[];
    };
    expect(Object.keys(disposition.changed_fixtures).sort()).toEqual([
      'api-surface.json',
      'fingerprint-behavior.json',
      'manifest-corpus.json',
    ]);
    expect(disposition.changed_fixtures['api-surface.json']?.upstream_commits).toEqual([
      'ab7d92395f28386fa48e176cdb0ec3e1acc733c7',
    ]);
    expect(disposition.changed_fixtures['manifest-corpus.json']?.upstream_commits).toEqual([
      '0a36785bfc2386b6bc3f12694d6de5aaa4106518',
      '52b9f5acbdaada9f8a66a42e1d34fb9d00d3227e',
    ]);
    expect(disposition.changed_fixtures['fingerprint-behavior.json']?.upstream_commits).toEqual([
      'c2225b635b94683282d63c9faf599c76e74e315c',
    ]);
    expect(disposition.unchanged_fixtures).toEqual([
      'bounded-writer-corpus.json',
      'ledger-corpus.json',
      'ledger-verdict-table.json',
      'prompt-inventory.json',
      'rendered-prompts/**',
      'round-corpus-backlog-audit.json',
      'round-corpus-orchestrate.json',
    ]);
  });

  it('red-proof: the inventory follows re-exports and distinguishes type vs value kinds', () => {
    writeFileSync(
      join(synth, 'impl.ts'),
      'export interface Shape { x: number }\nexport type Alias = string;\nexport const val = 1;\nexport function fn(): void {}\n',
    );
    writeFileSync(
      join(synth, 'index.ts'),
      "export type { Shape, Alias } from './impl.js';\nexport { val, fn } from './impl.js';\n",
    );
    const inv = exportInventory(join(synth, 'index.ts'));
    expect(inv).toEqual([
      { name: 'Alias', kind: 'type' },
      { name: 'Shape', kind: 'type' },
      { name: 'fn', kind: 'value' },
      { name: 'val', kind: 'value' },
    ]);
  }, 600_000);

  it('checker export inventory of skills/index.ts matches the baseline exactly', () => {
    const inv = exportInventory(resolve(HERE, '../../src/skills/index.ts'));
    const current = canonical({ exports: inv });
    const { expected } = baseline('api-surface.json', current);
    expect(current).toBe(expected);
  }, 600_000);

  it('runtime export names agree with the checker inventory (belt and braces)', () => {
    const inv = exportInventory(resolve(HERE, '../../src/skills/index.ts'));
    const runtimeNames = Object.keys(skills).sort();
    const valueNames = inv
      .filter((e) => e.kind === 'value')
      .map((e) => e.name)
      .sort();
    expect(runtimeNames).toEqual(valueNames);
  }, 600_000);
});

// Invariants: INV-DEVAI-001
