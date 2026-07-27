import { existsSync, promises } from 'node:fs';
import { resolve } from 'node:path';
import v8Module from '@vitest/coverage-v8';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';
import { mergeProcessCovs } from '@bcoe/v8-coverage';
import type { Profiler } from 'node:inspector';
import type { CoverageProviderModule, ReportContext } from 'vitest/node';

const subprocessCoverageDirectory = resolve('scratch/coverage/t1-t6-child-v8');

interface ProcessCoverage {
  readonly result: Array<Profiler.ScriptCoverage & { startOffset?: number }>;
}

interface Position {
  readonly line: number;
  readonly column: number;
}

interface Location {
  readonly start: Position;
  readonly end: Position;
}

interface FunctionMapping {
  readonly decl: Location;
  readonly loc: Location;
}

interface BranchMapping {
  readonly locations: readonly Location[];
}

interface FileCoverageData {
  readonly statementMap: Readonly<Record<string, Location>>;
  readonly fnMap: Readonly<Record<string, FunctionMapping>>;
  readonly branchMap: Readonly<Record<string, BranchMapping>>;
  readonly s: Record<string, number>;
  readonly f: Record<string, number>;
  readonly b: Record<string, number[]>;
}

interface MutableCoverageMap {
  files(): string[];
  fileCoverageFor(filename: string): { toJSON(): object };
  addFileCoverage(coverage: FileCoverageData): void;
  filter(callback: (filename: string) => boolean): void;
}

function positionKey(location: Location): string {
  return `${String(location.start.line)}:${String(location.start.column)}`;
}

function contains(location: Location, position: Position): boolean {
  if (position.line < location.start.line || position.line > location.end.line) return false;
  if (position.line === location.start.line && position.column < location.start.column)
    return false;
  if (position.line === location.end.line && position.column > location.end.column) return false;
  return true;
}

function projectedHit(
  exactHits: ReadonlyMap<string, number>,
  ranges: ReadonlyArray<Readonly<{ location: Location; count: number }>>,
  location: Location,
): number | undefined {
  return (
    exactHits.get(positionKey(location)) ??
    ranges.find((candidate) => contains(candidate.location, location.start))?.count
  );
}

function mergeCanonicalHits(
  coverageMap: MutableCoverageMap,
  subprocessMap: MutableCoverageMap,
): void {
  for (const filename of subprocessMap.files()) {
    if (!coverageMap.files().includes(filename)) continue;
    const candidate = subprocessMap.fileCoverageFor(filename).toJSON() as FileCoverageData;
    const current = coverageMap.fileCoverageFor(filename).toJSON() as FileCoverageData;

    const statementHits = new Map<string, number>();
    const statementRanges: Array<{ location: Location; count: number }> = [];
    for (const [id, location] of Object.entries(candidate.statementMap)) {
      const count = candidate.s[id] ?? 0;
      if (count > 0) {
        statementHits.set(positionKey(location), count);
        statementRanges.push({ location, count });
      }
    }
    for (const [id, location] of Object.entries(current.statementMap)) {
      const count = projectedHit(statementHits, statementRanges, location);
      if (count !== undefined) current.s[id] = (current.s[id] ?? 0) + count;
    }

    const functionHits = new Map<string, number>();
    const functionRanges: Array<{ location: Location; count: number }> = [];
    for (const [id, definition] of Object.entries(candidate.fnMap)) {
      const count = candidate.f[id] ?? 0;
      if (count > 0) {
        functionHits.set(positionKey(definition.decl), count);
        functionRanges.push({ location: definition.loc, count });
      }
    }
    for (const [id, definition] of Object.entries(current.fnMap)) {
      const count = projectedHit(functionHits, functionRanges, definition.decl);
      if (count !== undefined) current.f[id] = (current.f[id] ?? 0) + count;
    }

    const branchHits = new Map<string, number>();
    const branchRanges: Array<{ location: Location; count: number }> = [];
    for (const [id, definition] of Object.entries(candidate.branchMap)) {
      for (const [index, location] of definition.locations.entries()) {
        const count = candidate.b[id]?.[index] ?? 0;
        if (count > 0) {
          branchHits.set(positionKey(location), count);
          branchRanges.push({ location, count });
        }
      }
    }
    for (const [id, definition] of Object.entries(current.branchMap)) {
      for (const [index, location] of definition.locations.entries()) {
        const count = projectedHit(branchHits, branchRanges, location);
        if (count !== undefined && current.b[id] !== undefined) {
          current.b[id][index] = (current.b[id][index] ?? 0) + count;
        }
      }
    }

    coverageMap.addFileCoverage(current);
  }
}

/**
 * Vitest's worker profiler does not observe CLI processes spawned by the T2-T6
 * suites. NODE_V8_COVERAGE records those exact executions. This provider folds
 * the resulting V8 process records into the same source-mapped coverage map so
 * the merged gate measures every lane it runs, rather than only parent workers.
 */
class SubprocessV8CoverageProvider extends V8CoverageProvider {
  override async clean(clean = true): Promise<void> {
    await super.clean(clean);
    await promises.rm(subprocessCoverageDirectory, { recursive: true, force: true });
    await promises.mkdir(subprocessCoverageDirectory, { recursive: true });
  }

  override isIncluded(filename: string, root?: string): boolean {
    if (/\/packages\/[^/]+\/dist\/.*\.js$/u.test(filename)) return true;
    return super.isIncluded(filename, root);
  }

  override generateCoverage(
    ...args: Parameters<V8CoverageProvider['generateCoverage']>
  ): ReturnType<V8CoverageProvider['generateCoverage']> {
    return this.generateMergedCoverage(...args) as ReturnType<
      V8CoverageProvider['generateCoverage']
    >;
  }

  private async generateMergedCoverage(context: ReportContext): Promise<unknown> {
    const coverageMap = (await super.generateCoverage(context)) as unknown as MutableCoverageMap;
    try {
      if (!existsSync(subprocessCoverageDirectory)) return coverageMap;

      const subprocessCoverages: ProcessCoverage[] = [];
      for (const name of await promises.readdir(subprocessCoverageDirectory)) {
        if (!name.endsWith('.json')) continue;
        let raw: ProcessCoverage;
        try {
          raw = JSON.parse(
            await promises.readFile(resolve(subprocessCoverageDirectory, name), 'utf8'),
          ) as ProcessCoverage;
        } catch {
          continue;
        }
        if (!Array.isArray(raw.result)) continue;
        subprocessCoverages.push(raw);
      }
      if (subprocessCoverages.length === 0) return coverageMap;

      const provider = this as unknown as {
        convertCoverage(
          coverage: ProcessCoverage,
          project?: unknown,
          environment?: string,
        ): Promise<unknown>;
      };
      const merged = mergeProcessCovs(subprocessCoverages) as ProcessCoverage;
      merged.result.splice(
        0,
        merged.result.length,
        ...merged.result.filter((result) => result.url.startsWith('file://')),
      );
      for (const result of merged.result) result.startOffset ??= 0;
      const subprocessMap = (await provider.convertCoverage(merged)) as MutableCoverageMap;
      mergeCanonicalHits(coverageMap, subprocessMap);
      coverageMap.filter((filename) => super.isIncluded(filename));
      return coverageMap;
    } finally {
      await promises.rm(subprocessCoverageDirectory, { recursive: true, force: true });
    }
  }
}

// pnpm exposes the provider's bundled Vitest type instance separately from the
// workspace Vitest type instance. The runtime interface is the same module contract.
const providerModule = {
  ...v8Module,
  getProvider: () => new SubprocessV8CoverageProvider(),
} as unknown as CoverageProviderModule;

export default providerModule;
