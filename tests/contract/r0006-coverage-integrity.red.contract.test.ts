// Invariants: INV-DEVAI-001, INV-DEVAI-014, INV-DEVAI-017
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');
const FILE = '/fixture/source.ts';

interface Position {
  readonly line: number;
  readonly column: number;
}

interface Location {
  readonly start: Position;
  readonly end: Position;
}

interface CoverageData {
  readonly path: string;
  readonly statementMap: Record<string, Location>;
  readonly fnMap: Record<string, { decl: Location; loc: Location }>;
  readonly branchMap: Record<string, { locations: Location[] }>;
  readonly s: Record<string, number>;
  readonly f: Record<string, number>;
  readonly b: Record<string, number[]>;
}

class FixtureCoverageMap {
  readonly #entries: Map<string, CoverageData>;

  constructor(data: CoverageData) {
    this.#entries = new Map([[data.path, structuredClone(data)]]);
  }

  files(): string[] {
    return [...this.#entries.keys()];
  }

  fileCoverageFor(filename: string): { toJSON(): CoverageData } {
    const coverage = this.#entries.get(filename);
    if (coverage === undefined) throw new Error(`missing fixture coverage for ${filename}`);
    return { toJSON: () => structuredClone(coverage) };
  }

  addFileCoverage(coverage: CoverageData): void {
    this.#entries.set(coverage.path, structuredClone(coverage));
  }

  filter(callback: (filename: string) => boolean): void {
    for (const filename of this.files()) {
      if (!callback(filename)) this.#entries.delete(filename);
    }
  }

  data(): CoverageData {
    return this.fileCoverageFor(FILE).toJSON();
  }
}

const outer: Location = {
  start: { line: 1, column: 0 },
  end: { line: 12, column: 1 },
};
const inner: Location = {
  start: { line: 4, column: 2 },
  end: { line: 6, column: 3 },
};

function fixtureCoverage(outerHit: number, innerHit: number): CoverageData {
  return {
    path: FILE,
    statementMap: { outer, inner },
    fnMap: {
      outer: { decl: outer, loc: outer },
      inner: { decl: inner, loc: inner },
    },
    branchMap: {},
    s: { outer: outerHit, inner: innerHit },
    f: { outer: outerHit, inner: innerHit },
    b: {},
  };
}

describe('R-0006 coverage measurement integrity', () => {
  it('does not project an enclosing hit onto an exact zero-hit statement or function', async () => {
    const provider = (await import('../config/subprocess-v8-coverage-provider.js')) as unknown as {
      mergeCanonicalHits?: (current: FixtureCoverageMap, subprocess: FixtureCoverageMap) => void;
    };
    expect(
      provider.mergeCanonicalHits,
      'the merge is an independently testable contract',
    ).toBeTypeOf('function');

    const current = new FixtureCoverageMap(fixtureCoverage(0, 0));
    const subprocess = new FixtureCoverageMap(fixtureCoverage(1, 0));
    provider.mergeCanonicalHits?.(current, subprocess);

    expect(current.data().s).toEqual({ outer: 1, inner: 0 });
    expect(current.data().f).toEqual({ outer: 1, inner: 0 });
  });

  it('configures an auditable statement-level coverage artifact', () => {
    const config = readFileSync(join(ROOT, 'tests/config/t1-t3.coverage.config.ts'), 'utf8');
    const reporter = config.match(/reporter:\s*\[([^\]]+)\]/u)?.[1] ?? '';
    expect(reporter).toMatch(/['"]json['"]/u);
  });

  it('retains the raw subprocess inputs beside the final coverage artifact', () => {
    const provider = readFileSync(
      join(ROOT, 'tests/config/subprocess-v8-coverage-provider.ts'),
      'utf8',
    );
    expect(provider).toContain("resolve('scratch/coverage/t1-t3/subprocess-v8')");
    expect(provider).toMatch(
      /promises\.(?:cp|rename)\(subprocessCoverageDirectory,\s*subprocessCoverageEvidenceDirectory/u,
    );
  });
});
