import { lstatSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vitest-cache',
  '.devai',
  'generated',
  'examples',
  // R13 W05: docs/site/ is the canonical Docusaurus scaffold location per
  // ADR-DOCS-GOVERNANCE Decision 5. Its TypeScript files (docusaurus.config.ts,
  // sidebars.ts, src/pages/*) are scaffold/config, not framework surfaces, and
  // wouldn't be claimed by any invariant.code_areas. Bare-name match because
  // the inventory walker traverses by directory name and the rest of
  // DEFAULT_IGNORE (e.g. examples, generated) uses the same convention.
  'site',
]);

export interface WalkOptions {
  readonly extensions?: readonly string[];
  /**
   * When supplied, this set REPLACES the walker's DEFAULT_IGNORE entirely.
   * Callers (typically the CLI's `buildIgnoreDirs` helper) compose the
   * effective set from DEFAULT_IGNORE + `--ignore-dir` (add) -
   * `--include-ignored` (remove), so the walker doesn't union here.
   * When omitted, DEFAULT_IGNORE is used as-is.
   */
  readonly ignoreDirs?: ReadonlySet<string>;
}

/**
 * Recursively walk a directory, returning paths to files matching the given
 * extensions. Sorted output for determinism. Skips a default ignore list
 * (node_modules, dist, coverage, .devai, examples, etc.) unless `ignoreDirs`
 * is supplied, in which case `ignoreDirs` is used verbatim.
 *
 * Symlinks are skipped (lstat-based) to avoid double-counting via symlinked
 * paths such as `packages/schemas/src/schemas → docs/schemas`.
 */
export function walkFiles(root: string, opts: WalkOptions = {}): string[] {
  const ignore = opts.ignoreDirs ?? DEFAULT_IGNORE;
  const exts = opts.extensions;
  const results: string[] = [];
  walk(root, ignore, exts, results);
  return results.sort();
}

/** Exposed so CLI callers can compose the effective ignore set without duplicating the default list. */
export const WALKER_DEFAULT_IGNORE: ReadonlySet<string> = DEFAULT_IGNORE;

function walk(
  dir: string,
  ignore: ReadonlySet<string>,
  exts: readonly string[] | undefined,
  out: string[],
): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (ignore.has(name)) continue;
    const full = join(dir, name);
    let s;
    try {
      // lstat (not stat) so symlinks are reported as symlinks; we skip them
      // to avoid double-counting (e.g. `packages/schemas/src/schemas` symlinks
      // to `docs/schemas`).
      s = lstatSync(full);
    } catch {
      continue;
    }
    if (s.isSymbolicLink()) continue;
    if (s.isDirectory()) {
      walk(full, ignore, exts, out);
    } else if (s.isFile()) {
      if (exts === undefined || exts.some((e) => name.endsWith(e))) {
        out.push(full);
      }
    }
  }
}

export function relativizeAll(paths: readonly string[], repoRoot: string): string[] {
  return paths.map((p) => relative(repoRoot, p)).sort();
}
