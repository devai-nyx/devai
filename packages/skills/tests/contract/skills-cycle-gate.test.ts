// R20.W1 matrix row 7 — import-cycle gate over packages/core/src/skills/**.
// TypeScript compiler API (steward correction 3): static imports, re-exports
// with module specifiers, dynamic import() call expressions; type-only edges
// included in the graph and flagged. Red-proofed against a synthetic cycle.
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HERE } from './r20-harness.js';

interface Edge {
  readonly from: string;
  readonly to: string;
  readonly typeOnly: boolean;
  readonly dynamic: boolean;
}

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) tsFiles(full, out);
    else if (/\.ts$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function resolveSpec(fromFile: string, spec: string, root: string): string | null {
  if (!spec.startsWith('.')) return null; // external module — not a graph node
  const base = resolve(dirname(fromFile), spec.replace(/\.js$/, ''));
  for (const cand of [base + '.ts', join(base, 'index.ts')]) {
    if (cand.startsWith(root)) {
      try {
        statSync(cand);
        return cand;
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

export function buildGraph(root: string): { nodes: string[]; edges: Edge[] } {
  const files = tsFiles(root);
  const edges: Edge[] = [];
  for (const file of files) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      let spec: string | null = null;
      let typeOnly = false;
      let dynamic = false;
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        spec = node.moduleSpecifier.text;
        typeOnly = node.importClause?.isTypeOnly === true;
      } else if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier !== undefined &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        spec = node.moduleSpecifier.text;
        typeOnly = node.isTypeOnly;
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] !== undefined &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        spec = node.arguments[0].text;
        dynamic = true;
      }
      if (spec !== null) {
        const to = resolveSpec(file, spec, root);
        if (to !== null) edges.push({ from: file, to, typeOnly, dynamic });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { nodes: files, edges };
}

export function findCycle(graph: { nodes: string[]; edges: Edge[] }): string[] | null {
  const adj = new Map<string, string[]>();
  for (const e of graph.edges) {
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
  }
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const dfs = (n: string): string[] | null => {
    state.set(n, 'visiting');
    stack.push(n);
    for (const next of adj.get(n) ?? []) {
      if (state.get(next) === 'visiting') return [...stack.slice(stack.indexOf(next)), next];
      if (state.get(next) === undefined) {
        const found = dfs(next);
        if (found !== null) return found;
      }
    }
    state.set(n, 'done');
    stack.pop();
    return null;
  };
  for (const n of graph.nodes) {
    if (state.get(n) === undefined) {
      const found = dfs(n);
      if (found !== null) return found;
    }
  }
  return null;
}

let synthDir = '';

beforeEach(() => {
  synthDir = mkdtempSync(join(tmpdir(), 'r20-cycle-'));
});

afterEach(() => {
  rmSync(synthDir, { recursive: true, force: true });
});

describe('R20 structural gate: zero import cycles in skills/**', () => {
  it('red-proof: detects a synthetic 2-node cycle (incl. multiline + dynamic import syntax)', () => {
    writeFileSync(
      join(synthDir, 'a.ts'),
      "import {\n  b,\n} from './b.js';\nexport const a = 1;\n",
    );
    writeFileSync(
      join(synthDir, 'b.ts'),
      "export const b = async () => (await import('./a.js')).a;\n",
    );
    const cycle = findCycle(buildGraph(synthDir));
    expect(cycle, 'the checker must be able to fail').not.toBeNull();
  });

  it('the real skills/ tree has zero cycles (type-only edges included)', () => {
    const root = resolve(HERE, '../../src/skills');
    const graph = buildGraph(root);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(5);
    const cycle = findCycle(graph);
    expect(cycle === null ? 'acyclic' : `CYCLE: ${cycle.join(' -> ')}`).toBe('acyclic');
  });
});

// Invariants: INV-DEVAI-001
