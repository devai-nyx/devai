// R20.W2.8 — binding façade gate promoted from the W1 standalone red script.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

describe('R20 skills public façade', () => {
  it('contains only imports and module re-exports', () => {
    const entryFile = resolve(import.meta.dirname, '../../src/skills/index.ts');
    const source = ts.createSourceFile(
      entryFile,
      readFileSync(entryFile, 'utf8'),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TS,
    );

    const offenders = source.statements
      .filter((statement) => {
        if (ts.isImportDeclaration(statement)) return false;
        return !ts.isExportDeclaration(statement) || statement.moduleSpecifier === undefined;
      })
      .map((statement) => statement.getText(source));

    expect(offenders).toEqual([]);
  });
});

// Invariants: INV-DEVAI-001
