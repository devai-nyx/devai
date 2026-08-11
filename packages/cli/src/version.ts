import { existsSync, readFileSync } from '@devai-nyx/authority';
import { readProcessSync } from '@devai-nyx/authority';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * D-118: the running CLI's own package version, resolved once and
 * cached. Shared by `bin.ts` (cac's `--version`) and initialization
 * (machine-managed `devai_version` stamping — never hand-edited),
 * and `doctor`'s `devai-version-match` check.
 */
let cached: string | undefined;

function resolvePkgRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return dirname(here);
}

export function resolveCliVersion(): string {
  if (cached !== undefined) return cached;
  const pkgRoot = resolvePkgRoot();
  const pkgText = readFileSync(join(pkgRoot, 'package.json'), 'utf8');
  cached = (JSON.parse(pkgText) as { version?: string }).version ?? '0.0.0';
  return cached;
}

/**
 * D-122 (item 2a): how the running `devai` CLI was actually resolved.
 * Node's module loader realpaths symlinks by default, so a package
 * consumed via a `pnpm link --global` (the sibling-checkout dev
 * convenience, D-118) resolves to the real monorepo checkout path —
 * no `node_modules` segment — while a real npm/GitHub-Packages
 * install always lands inside one (`node_modules/@devai-nyx/cli`,
 * hoisted or nested). That single structural difference is the
 * detection signal; no environment variable or explicit flag needed.
 */
export interface CliProvenance {
  readonly source: 'npm-package' | 'sibling-checkout';
  readonly resolvedPath: string;
  /** HEAD SHA of the sibling checkout, when source is 'sibling-checkout' and git is available. */
  readonly gitSha?: string;
}

let cachedProvenance: CliProvenance | undefined;

function findGitRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 12; i += 1) {
    if (existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function resolveGitSha(repoRoot: string): string | undefined {
  const result = readProcessSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) return undefined;
  const sha = result.stdout.trim();
  return /^[a-f0-9]{40}$/u.test(sha) ? sha : undefined;
}

export function resolveCliProvenance(): CliProvenance {
  if (cachedProvenance !== undefined) return cachedProvenance;
  const pkgRoot = resolvePkgRoot();
  const isNpmPackage = pkgRoot.split(sep).includes('node_modules');
  if (isNpmPackage) {
    cachedProvenance = { source: 'npm-package', resolvedPath: pkgRoot };
    return cachedProvenance;
  }
  const gitRoot = findGitRoot(pkgRoot);
  cachedProvenance = {
    source: 'sibling-checkout',
    resolvedPath: pkgRoot,
    ...(gitRoot !== null && { gitSha: resolveGitSha(gitRoot) }),
  };
  return cachedProvenance;
}
