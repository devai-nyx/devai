import { existsSync, promises } from 'node:fs';
import { resolve } from 'node:path';
import v8Module from '@vitest/coverage-v8';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';
import { mergeProcessCovs } from '@bcoe/v8-coverage';
import type { Profiler } from 'node:inspector';
import type { CoverageProviderModule, ReportContext } from 'vitest/node';

const subprocessCoverageDirectory = resolve('scratch/coverage/t1-t6-child-v8');
const subprocessCoverageEvidenceDirectory = resolve('scratch/coverage/t1-t3/subprocess-v8');

interface ProcessCoverage {
  readonly result: Array<Profiler.ScriptCoverage & { startOffset?: number }>;
}

interface Position {
  readonly line?: number;
  readonly column?: number;
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

function locationKey(location: Location): string | undefined {
  const positions = [
    location.start.line,
    location.start.column,
    location.end.line,
    location.end.column,
  ];
  if (!positions.every((position) => Number.isInteger(position))) return undefined;
  return positions.join(':');
}

export function mergeCanonicalHits(
  coverageMap: MutableCoverageMap,
  subprocessMap: MutableCoverageMap,
): void {
  for (const filename of subprocessMap.files()) {
    if (!coverageMap.files().includes(filename)) continue;
    const candidate = subprocessMap.fileCoverageFor(filename).toJSON() as FileCoverageData;
    const current = coverageMap.fileCoverageFor(filename).toJSON() as FileCoverageData;

    const statementHits = new Map<string, number>();
    for (const [id, location] of Object.entries(candidate.statementMap)) {
      const count = candidate.s[id] ?? 0;
      const key = locationKey(location);
      if (key !== undefined) statementHits.set(key, count);
    }
    for (const [id, location] of Object.entries(current.statementMap)) {
      const key = locationKey(location);
      const count = key === undefined ? undefined : statementHits.get(key);
      if (count !== undefined) current.s[id] = (current.s[id] ?? 0) + count;
    }

    const functionHits = new Map<string, number>();
    for (const [id, definition] of Object.entries(candidate.fnMap)) {
      const count = candidate.f[id] ?? 0;
      const key = locationKey(definition.decl);
      if (key !== undefined) functionHits.set(key, count);
    }
    for (const [id, definition] of Object.entries(current.fnMap)) {
      const key = locationKey(definition.decl);
      const count = key === undefined ? undefined : functionHits.get(key);
      if (count !== undefined) current.f[id] = (current.f[id] ?? 0) + count;
    }

    const branchHits = new Map<string, number>();
    for (const [id, definition] of Object.entries(candidate.branchMap)) {
      for (const [index, location] of definition.locations.entries()) {
        const count = candidate.b[id]?.[index] ?? 0;
        const key = locationKey(location);
        if (key !== undefined) branchHits.set(key, count);
      }
    }
    for (const [id, definition] of Object.entries(current.branchMap)) {
      for (const [index, location] of definition.locations.entries()) {
        const key = locationKey(location);
        const count = key === undefined ? undefined : branchHits.get(key);
        if (count !== undefined && current.b[id] !== undefined) {
          current.b[id][index] = (current.b[id][index] ?? 0) + count;
        }
      }
    }
  }
}

export async function retainSubprocessCoverageInputs(
  sourceDirectory = subprocessCoverageDirectory,
  evidenceDirectory = subprocessCoverageEvidenceDirectory,
): Promise<number> {
  await promises.rm(evidenceDirectory, { recursive: true, force: true });
  if (!existsSync(sourceDirectory)) return 0;
  await promises.cp(sourceDirectory, evidenceDirectory, { recursive: true });
  return (await promises.readdir(evidenceDirectory)).filter((name) => name.endsWith('.json'))
    .length;
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
    if (clean) {
      await promises.rm(subprocessCoverageDirectory, { recursive: true, force: true });
    }
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
        } catch (error) {
          throw new Error(`malformed subprocess coverage input ${name}: ${String(error)}`);
        }
        if (!Array.isArray(raw.result)) {
          throw new Error(`malformed subprocess coverage input ${name}: result is not an array`);
        }
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
      return coverageMap;
    } finally {
      coverageMap.filter((filename) => super.isIncluded(filename));
      await retainSubprocessCoverageInputs();
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
