import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findDevaiPacksRoot } from '../pack-resolver/index.js';

/**
 * Constitution binding mechanics (D-119): canonize the shape TEAT's
 * adoption converged on independently of the pointer-only prototypes
 * — a vendored `.devai/pin/constitution.md` copy, a `.devai/
 * constitution.md` stub pointing at it, and a `{version, sha256}`
 * pin in `.devai/config/project.json` that `devai doctor` verifies
 * against the vendored copy. Pointer-only binding (no vendored copy,
 * no pin) remains valid for a sibling-checkout dev convenience but
 * is not the canonical shape `devai init`/`devai adopt upgrade --constitution`
 * produce for adopters going forward.
 */

export interface ConstitutionPin {
  readonly version: string;
  readonly sha256: string;
}

export type ConstitutionSource = 'bundled' | 'workspace' | 'sibling-checkout';

export interface ResolvedConstitution {
  readonly text: string;
  readonly version: string | null;
  readonly sha256: string;
  readonly source: ConstitutionSource;
  readonly path: string;
}

const VERSION_PATTERN =
  /^\*\*(?:Candidate version|Version):\*\*\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/mu;

export function parseConstitutionVersion(text: string): string | null {
  return VERSION_PATTERN.exec(text)?.[1] ?? null;
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function findWorkspaceRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 12; i += 1) {
    if (
      existsSync(join(dir, 'law/constitution.md')) &&
      existsSync(join(dir, 'pnpm-workspace.yaml'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/**
 * Has this target already been bound as a D-119 adopter (root
 * `.devai/pin/constitution.md` vendored + `constitution` pin recorded)? Used to
 * disambiguate "self" from "an adopter that already vendored its own
 * copy" — both have a constitution on disk, but only DEVAI's
 * own true-self repo has one with no corresponding pin (DEVAI never
 * pins a binding to its own source text). Reading purely local state
 * (no dependency on where the running package physically lives) keeps
 * this correct for a versioned-package install with no monorepo on
 * disk, and keeps the plain "targetRoot has its own root
 * law/constitution.md" rule as the
 * default for a target with neither signal yet.
 */
function hasAdopterConstitutionPin(targetRoot: string): boolean {
  const configPath = join(targetRoot, '.devai/config/project.json');
  if (!existsSync(configPath)) return false;
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      constitution?: { version?: string };
    };
    return typeof parsed.constitution?.version === 'string';
  } catch {
    return false;
  }
}

/**
 * Resolve the canonical constitution text the running `@devai-nyx/skills`
 * knows about, in priority order:
 *
 *   1. bundled  — `<pkg>/dist/law/constitution.md`, materialized at build
 *      time (`scripts/copy-constitution.mjs`) so a versioned-package
 *      install (the canonical consumption model, D-118) carries its
 *      own copy without needing the monorepo checkout on disk.
 *   2. workspace — the DEVAI monorepo root's own `law/constitution.md`,
 *      found by walking up from this module (dev-in-place case:
 *      running DEVAI's own uncompiled/locally-linked source).
 *   3. sibling-checkout — a sibling DEVAI checkout found via
 *      `findDevaiPacksRoot()`. Dev-only convenience (D-118); not
 *      relied on for the canonical binding shape.
 *
 * Returns null when none resolve (no network fetch is attempted).
 */
export function resolveCanonicalConstitution(): ResolvedConstitution | null {
  let here: string;
  try {
    here = dirname(fileURLToPath(import.meta.url));
  } catch {
    here = process.cwd();
  }

  const bundled = join(here, '..', 'law/constitution.md');
  if (existsSync(bundled)) {
    const text = readFileSync(bundled, 'utf8');
    return {
      text,
      version: parseConstitutionVersion(text),
      sha256: sha256Text(text),
      source: 'bundled',
      path: bundled,
    };
  }

  const workspaceRoot = findWorkspaceRoot(here);
  if (workspaceRoot !== null) {
    const p = join(workspaceRoot, 'law/constitution.md');
    const text = readFileSync(p, 'utf8');
    return {
      text,
      version: parseConstitutionVersion(text),
      sha256: sha256Text(text),
      source: 'workspace',
      path: p,
    };
  }

  const packsRoot = findDevaiPacksRoot();
  if (packsRoot !== null) {
    const p = join(packsRoot, 'law/constitution.md');
    if (existsSync(p)) {
      const text = readFileSync(p, 'utf8');
      return {
        text,
        version: parseConstitutionVersion(text),
        sha256: sha256Text(text),
        source: 'sibling-checkout',
        path: p,
      };
    }
  }

  return null;
}

export function computeConstitutionPin(text: string): ConstitutionPin | null {
  const version = parseConstitutionVersion(text);
  if (version === null) return null;
  return { version, sha256: sha256Text(text) };
}

/**
 * `devai doctor`-facing binding status for an adopter repo. Reads
 * `.devai/config/project.json`'s `constitution` pin and the
 * `.devai/pin/constitution.md` vendored copy, and cross-checks against
 * whatever canonical text the running core package can resolve (for
 * an upstream-drift note only — a lagging pin is reported, not
 * failed, since adopters may deliberately hold a version).
 */
export interface ConstitutionBindingStatus {
  readonly hasPin: boolean;
  readonly hasVendoredCopy: boolean;
  readonly pin?: ConstitutionPin;
  readonly vendoredVersion?: string | null;
  readonly vendoredSha256?: string;
  readonly versionMatches?: boolean;
  readonly shaMatches?: boolean;
  readonly upstreamVersion?: string | null;
  readonly upstreamAhead?: boolean;
  readonly ok: boolean;
  readonly errors: readonly string[];
}

interface ProjectConfigConstitution {
  readonly constitution?: { readonly version?: string; readonly sha256?: string };
}

export function verifyConstitutionBinding(repoRoot: string): ConstitutionBindingStatus {
  const configPath = join(repoRoot, '.devai/config/project.json');
  let pin: ConstitutionPin | undefined;
  if (existsSync(configPath)) {
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as ProjectConfigConstitution;
      const v = parsed.constitution?.version;
      if (typeof v === 'string') {
        pin = { version: v, sha256: parsed.constitution?.sha256 ?? '' };
      }
    } catch {
      // malformed config → no pin resolved; reported below via hasPin: false
    }
  }

  const vendoredPath = join(repoRoot, '.devai/pin/constitution.md');
  const hasVendoredCopy = existsSync(vendoredPath);
  const vendoredText = hasVendoredCopy ? readFileSync(vendoredPath, 'utf8') : null;
  const vendoredVersion =
    vendoredText !== null ? parseConstitutionVersion(vendoredText) : undefined;
  const vendoredSha256 = vendoredText !== null ? sha256Text(vendoredText) : undefined;

  const errors: string[] = [];
  if (pin === undefined) errors.push('no constitution pin declared in .devai/config/project.json');
  if (!hasVendoredCopy) errors.push(`no vendored constitution copy at ${vendoredPath}`);

  const versionMatches =
    pin !== undefined && vendoredVersion !== undefined
      ? pin.version === vendoredVersion
      : undefined;
  const shaMatches =
    pin !== undefined && pin.sha256.length > 0 && vendoredSha256 !== undefined
      ? pin.sha256 === vendoredSha256
      : undefined;
  if (versionMatches === false) {
    errors.push(
      `pinned version ${pin?.version ?? '?'} does not match vendored copy version ${vendoredVersion ?? '?'}`,
    );
  }
  if (shaMatches === false) {
    errors.push('pinned sha256 does not match the vendored copy (tamper or stale pin)');
  }

  const canonical = resolveCanonicalConstitution();
  const upstreamVersion = canonical?.version ?? null;
  const upstreamAhead =
    pin !== undefined && upstreamVersion !== null
      ? isVersionBehind(pin.version, upstreamVersion)
      : undefined;

  const ok =
    pin !== undefined && hasVendoredCopy && versionMatches !== false && shaMatches !== false;

  return {
    hasPin: pin !== undefined,
    hasVendoredCopy,
    ...(pin !== undefined && { pin }),
    ...(vendoredVersion !== undefined && { vendoredVersion }),
    ...(vendoredSha256 !== undefined && { vendoredSha256 }),
    ...(versionMatches !== undefined && { versionMatches }),
    ...(shaMatches !== undefined && { shaMatches }),
    upstreamVersion,
    ...(upstreamAhead !== undefined && { upstreamAhead }),
    ok,
    errors,
  };
}

function isVersionBehind(pinned: string, upstream: string): boolean {
  const a = pinned.split('.').map(Number);
  const b = upstream.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
}

/**
 * Bootstrap/upgrade-facing plan for the constitution binding at
 * `targetRoot`. Two shapes:
 *
 *   - self (targetRoot has its own `law/constitution.md` AND no
 *     `constitution` pin yet recorded in `.devai/config/project.json`
 *     — the pre-D-119 tested contract: "a target that already
 *     carries its own root constitution is treated as its source"):
 *     `.devai/constitution.md` symlinks to `../law/constitution.md`; no
 *     pin is written (DEVAI is the source, not a binding to it).
 *   - adopter: vendors `.devai/pin/constitution.md` from
 *     whatever `resolveCanonicalConstitution()` resolves, a
 *     `.devai/constitution.md` stub pointing at it, and a
 *     `{version, sha256}` pin for `project.json`. When no canonical
 *     text resolves, degrades to the pre-D-119 unresolved-pointer
 *     text and no pin (bootstrap still completes; `devai doctor`
 *     surfaces the gap precisely via `constitution-binding`).
 *
 * The pin check (`hasAdopterConstitutionPin`) disambiguates "true
 * self" from "an adopter that already vendored its own copy" — both
 * have a constitution on disk once binding has run once, but
 * only a prior *adopter* bootstrap also wrote a pin. Without this,
 * a second `buildBootstrapPlan`/`buildUpgradePlan` pass over an
 * already-bootstrapped adopter would misclassify itself as self
 * (since its vendored copy alone satisfies the existence check) and
 * silently drop the pin on the next recomputation.
 */
export interface ConstitutionBindingPlan {
  readonly rootFile?: { readonly path: string; readonly content: string };
  readonly pointerFile: {
    readonly path: string;
    readonly content: string;
    readonly symlink_target?: string;
  };
  readonly pin?: ConstitutionPin;
}

export function buildConstitutionBindingPlan(
  targetRoot: string,
  version: string,
): ConstitutionBindingPlan {
  const selfConstitution = join(targetRoot, 'law/constitution.md');
  const isSelf = existsSync(selfConstitution) && !hasAdopterConstitutionPin(targetRoot);
  if (isSelf) {
    return {
      pointerFile: {
        path: '.devai/constitution.md',
        content: '',
        symlink_target: '../law/constitution.md',
      },
    };
  }

  const canonical = resolveCanonicalConstitution();
  if (canonical === null) {
    return {
      pointerFile: {
        path: '.devai/constitution.md',
        content: `# See <unresolved>\n\nNo canonical DEVAI Constitution could be resolved (no bundled dist/law/constitution.md, no workspace checkout, no sibling checkout). Edit this pointer to name the actual path to your DEVAI installation's constitution, then re-run \`devai doctor --adopter\`. Generated by \`devai init\` v${version}.\n`,
      },
    };
  }

  const pin = computeConstitutionPin(canonical.text);
  return {
    rootFile: { path: '.devai/pin/constitution.md', content: canonical.text },
    pointerFile: {
      path: '.devai/constitution.md',
      content: `# See pin/constitution.md\n\nVendored constitution copy at \`.devai/pin/constitution.md\`. This pointer exists so \`devai doctor\` finds the binding at the conventional \`.devai/constitution.md\` path; the vendored pin plus the \`constitution\` entry in \`.devai/config/project.json\` are the load-bearing artifacts. Refresh both via \`devai adopt upgrade --constitution\`. Generated by \`devai init\` v${version}.\n`,
    },
    ...(pin !== null && { pin }),
  };
}
