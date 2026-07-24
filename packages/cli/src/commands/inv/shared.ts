import { WALKER_DEFAULT_IGNORE } from '#core-compat';

export const DEFAULT_REPO_ROOT = '.';
export const DEFAULT_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export interface CommonInvOptions {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly ignoreDir?: string | string[];
  readonly includeIgnored?: string | string[];
}

function toArray<T>(v: T | readonly T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? [...v] : [v as T];
}

/**
 * Build the effective ignoreDirs set from --ignore-dir (additive) and
 * --include-ignored (subtractive) flags. Returns undefined when no
 * overrides are supplied so the walker uses its own DEFAULT_IGNORE
 * unchanged.
 */
export function buildIgnoreDirs(options: CommonInvOptions): ReadonlySet<string> | undefined {
  const adds = toArray(options.ignoreDir);
  const removes = toArray(options.includeIgnored);
  if (adds.length === 0 && removes.length === 0) return undefined;

  const set = new Set<string>(WALKER_DEFAULT_IGNORE);
  for (const d of adds) set.add(d);
  for (const d of removes) set.delete(d);
  return set;
}

export function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) {
    process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  } else {
    process.stdout.write(JSON.stringify(json) + '\n');
  }
}
