import { spawnSync } from '@devai-nyx/authority';
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
} from '@devai-nyx/authority';
import { dirname, join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { validators } from '@devai-nyx/schemas';
import {
  readProfile,
  profileAtLeast,
  validateTestTrace,
  verifyConstitutionBinding,
  type AdoptionProfile,
} from '#core-compat';
import { verifyChain } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand, getFullRegistry } from '../define-command.js';
import { buildTrustedAuthoritySources, canonicalSha256 } from '../authority/policy.js';
import { checkDocsGovernance } from './check/docs-governance.js';
import { resolveCliProvenance, resolveCliVersion } from '../version.js';

/**
 * Phase 21.B (D-A-9): `devai doctor` is split into `--self`,
 * `--adopter`, and `--auto` postures. The DEVAI-self-development
 * checks (workspace layout, full F1 substrate, schemas-loadable)
 * are not meaningful against an adopter repo and were producing
 * by-design false-positives — several self-only checks failed against any
 * reasonable adopter pre-21.B. The split moves those out of the
 * adopter posture; each check declares the postures it applies to,
 * and `--auto` (the default) sniffs whether the repo-root has the
 * DEVAI monorepo shape to pick a posture automatically.
 *
 * Backward compatibility: existing `devai doctor` (no flag)
 * invocations from inside the DEVAI workspace continue to run all
 * self checks; adopter invocations now produce useful signal.
 */

const DEFAULT_REPO_ROOT = '.';
const DEFAULT_CHAIN_RELATIVE = 'record/proofs/chain.json';

/**
 * Self-posture F1 paths — DEVAI's own substrate roots plus
 * `law/schemas/`, which DEVAI ships and adopters consume from the
 * sibling DEVAI checkout (not their own tree).
 */
const F1_PATHS_SELF = [
  'product',
  'law/invariants',
  'law/schemas',
  'law/adr',
  'docs/dev/operations',
  'docs/dev/security',
  'law/glossary',
  'law/schemas',
] as const;

/**
 * Adopter-posture F1 paths — the substrate roots `init --execute`
 * seeds for adopters (see `buildBootstrapPlan` in
 * `@devai-nyx/skills` bootstrap service). Excludes `law/schemas/`
 * since adopters consume schemas from the sibling DEVAI checkout.
 */
const F1_PATHS_ADOPTER = [
  'product',
  'law/invariants',
  'law/schemas',
  'law/adr',
  'docs/dev/operations',
  'docs/dev/security',
  'law/glossary',
] as const;

const READING_ORDER_SOURCES = [
  'README.md',
  'law/constitution.md',
  'law/adr',
  'work/rounds',
  'law/schemas',
] as const;
const FIVE_ROLES = ['Owner', 'Architect', 'Inspector', 'Engineer', 'Auditor'] as const;

export type Posture = 'self' | 'adopter';
type PostureFlag = Posture | 'auto';

interface DoctorOptions {
  readonly repoRoot?: string;
  readonly chain?: string;
  readonly self?: boolean;
  readonly adopter?: boolean;
  readonly auto?: boolean;
  readonly human?: boolean;
  /** Comma-separated list of checks to skip, e.g. "docs-governance". */
  readonly skip?: string;
}

interface CheckResult {
  readonly name: string;
  readonly ok: boolean;
  /** D-112: true when the check is above the declared adoption profile — reported, never failing the run. */
  readonly advisory?: boolean;
  readonly info?: Record<string, unknown>;
  readonly errors?: readonly string[];
}

interface Report {
  readonly ok: boolean;
  readonly posture: Posture;
  readonly posture_source: 'flag' | 'auto';
  /** Declared adoption profile (D-112); absent project.json key resolves to tier3. */
  readonly profile: AdoptionProfile;
  readonly checks: readonly CheckResult[];
}

/**
 * Sniff a `repoRoot` for the DEVAI workspace shape. The signature is
 * `packages/cli/src/bin.ts` + at least one `examples/redox-pack-*`
 * directory directly under the root. Either of those alone is
 * insufficient — a sibling adopter that vendors `examples/` would
 * false-positive on the second; a partial DEVAI clone might lack
 * one. Requiring both keeps the detection conservative: we only
 * pick `self` when the evidence is unambiguous.
 *
 * This is more robust than `findDevaiPacksRoot()` (which walks up
 * looking for *a* DEVAI checkout — it would return a path whether
 * the cwd is the workspace itself or a sibling adopter).
 */
export function detectPosture(repoRoot: string): Posture {
  const binPath = join(repoRoot, 'packages/cli/src/bin.ts');
  if (!existsSync(binPath)) return 'adopter';
  const examplesDir = join(repoRoot, 'examples');
  if (!existsSync(examplesDir)) return 'adopter';
  let hasRedoxPack = false;
  try {
    for (const name of readdirSync(examplesDir)) {
      if (name.startsWith('redox-pack-')) {
        hasRedoxPack = true;
        break;
      }
    }
  } catch {
    return 'adopter';
  }
  return hasRedoxPack ? 'self' : 'adopter';
}

/**
 * D-125: adopters whose docs substrate has legitimately relocated (e.g. per
 * a binding ADR reclassifying an F1 path, as ADR-DOCS-IA Decision 11's §6
 * criterion can require) declare the relocation in
 * `.devai/config/project.json`'s `docs.ia.path_overrides` — a map from the
 * canonical F1/reading-order key (a `docs/`-rooted path with the `docs/`
 * prefix stripped, e.g. `"framework/contracts"`) to the adopter's actual
 * current relative path (e.g. `"reference/contracts"`). Absent config, or
 * an absent/malformed key, resolves to `{}`, so `f1-paths-present` and
 * `agents-claude-sync` stay byte-identical to pre-D-125 behavior for every
 * adopter that hasn't declared an override.
 */
function readPathOverrides(repoRoot: string): Record<string, string> {
  const configPath = join(repoRoot, '.devai/config/project.json');
  if (!existsSync(configPath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      docs?: { ia?: { path_overrides?: Record<string, string> } };
    };
    return parsed.docs?.ia?.path_overrides ?? {};
  } catch {
    return {};
  }
}

/**
 * Resolves a canonical `docs/...`-rooted path through the override map.
 * Root-level filenames (no `docs/` prefix — the other four
 * `READING_ORDER_SOURCES` entries) pass through unchanged: the override
 * only covers F1-substrate relocations, not adopter substitution of the
 * root reading-order files themselves (that is a separate, adopter-local
 * ADR concern, e.g. PEC's ADR-0008).
 */
function applyPathOverride(
  canonicalPath: string,
  overrides: Readonly<Record<string, string>>,
): string {
  if (!canonicalPath.startsWith('docs/')) return canonicalPath;
  const key = canonicalPath.slice('docs/'.length);
  const override = overrides[key];
  return override !== undefined ? `docs/${override}` : canonicalPath;
}

function checkF1Paths(repoRoot: string, posture: Posture): CheckResult {
  const expected = posture === 'self' ? F1_PATHS_SELF : F1_PATHS_ADOPTER;
  const overrides = readPathOverrides(repoRoot);
  const resolvedPaths: string[] = [];
  const missing: string[] = [];
  for (const p of expected) {
    const actual = applyPathOverride(p, overrides);
    resolvedPaths.push(actual);
    if (!existsSync(join(repoRoot, actual))) missing.push(actual);
  }
  return {
    name: 'f1-paths-present',
    ok: missing.length === 0,
    info: {
      posture,
      paths: resolvedPaths,
      missing,
      ...(Object.keys(overrides).length > 0 && { path_overrides: overrides }),
    },
    ...(missing.length > 0 && { errors: missing.map((p) => `missing F1 path: ${p}`) }),
  };
}

function checkSchemasLoadable(repoRoot: string): CheckResult {
  const dir = join(repoRoot, 'law/schemas');
  if (!existsSync(dir)) {
    return {
      name: 'schemas-loadable',
      ok: false,
      errors: [`schemas directory missing: ${dir}`],
    };
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.schema.json'));
  const errors: string[] = [];
  for (const f of files) {
    try {
      JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${f}: ${msg}`);
    }
  }
  return {
    name: 'schemas-loadable',
    ok: errors.length === 0,
    info: { count: files.length },
    ...(errors.length > 0 && { errors }),
  };
}

function checkEvidenceChain(chainPath: string): CheckResult {
  if (!existsSync(chainPath)) {
    return {
      name: 'evidence-chain-valid',
      ok: false,
      errors: [`chain file missing: ${chainPath}`],
    };
  }
  try {
    const result = verifyChain(chainPath);
    return {
      name: 'evidence-chain-valid',
      ok: result.valid,
      info: { chain: chainPath },
      ...(result.errors.length > 0 && { errors: [...result.errors] }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: 'evidence-chain-valid', ok: false, errors: [msg] };
  }
}

/**
 * Phase 21.D (closes D-A-10): the constitution-pointer check now
 * accepts three valid shapes:
 *
 *   1. Symlink resolving to `<repoRoot>/law/constitution.md` — the
 *      existing self-development case (back-compat).
 *   2. Symlink to a sibling or vendored `constitution.md`. The resolved path
 *      must end with `constitution.md` and the file must exist. Covers
 *      adopters who manually link to a known sibling DEVAI
 *      checkout.
 *   3. Plain file matching `^# See <path>` on the first line. The
 *      `<path>` is resolved relative to the pointer file's
 *      directory (or treated as absolute when it starts with `/`),
 *      must point at a file named constitution.md, and that file
 *      must exist. This is the shape `init --execute` writes for
 *      adopters when `findDevaiPacksRoot()` resolves a sibling
 *      DEVAI checkout — Phase 21.D's primary adopter-onboarding
 *      output.
 *
 * The named return shapes (`shape: 'symlink-self' | 'symlink-sibling' | 'pointer-file'`)
 * surface in the `info` block so adopter-side tooling can
 * disambiguate.
 */
function checkConstitutionSymlink(repoRoot: string): CheckResult {
  const linkPath = join(repoRoot, '.devai/constitution.md');
  if (!existsSync(linkPath)) {
    return {
      name: 'constitution-symlink',
      ok: false,
      errors: [`missing: ${linkPath}`],
    };
  }
  const stat = lstatSync(linkPath);
  if (stat.isSymbolicLink()) {
    const target = readlinkSync(linkPath);
    const resolved = resolve(linkPath, '..', target);
    const selfConst = resolve(repoRoot, 'law/constitution.md');
    // Shape 1: symlink to <repoRoot>/law/constitution.md (self).
    if (resolved === selfConst) {
      if (!existsSync(selfConst)) {
        return {
          name: 'constitution-symlink',
          ok: false,
          errors: [`symlink target ${selfConst} does not exist`],
        };
      }
      return {
        name: 'constitution-symlink',
        ok: true,
        info: { shape: 'symlink-self', target, resolved },
      };
    }
    // Shape 2: pointer to a vendored or sibling constitution.
    if (resolved.endsWith('/constitution.md') && existsSync(resolved)) {
      return {
        name: 'constitution-symlink',
        ok: true,
        info: { shape: 'symlink-sibling', target, resolved },
      };
    }
    return {
      name: 'constitution-symlink',
      ok: false,
      info: { shape: 'symlink-invalid', target, resolved },
      errors: [
        `symlink ${linkPath} points to ${resolved}; expected either <repoRoot>/law/constitution.md or a pinned constitution.md`,
      ],
    };
  }
  // Shape 3: plain file pointer (`# See <path>`).
  let body: string;
  try {
    body = readFileSync(linkPath, 'utf8');
  } catch (err) {
    return {
      name: 'constitution-symlink',
      ok: false,
      errors: [`failed to read ${linkPath}: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
  const firstLine = body.split('\n')[0] ?? '';
  const match = /^#\s+See\s+(.+?)\s*$/.exec(firstLine);
  if (match === null) {
    return {
      name: 'constitution-symlink',
      ok: false,
      info: { shape: 'plain-file-malformed', first_line: firstLine },
      errors: [
        `${linkPath} is a plain file but does not start with '# See <path-to-constitution.md>'`,
      ],
    };
  }
  const pointer = match[1] ?? '';
  if (pointer.length === 0 || pointer.includes('<unresolved>')) {
    return {
      name: 'constitution-symlink',
      ok: false,
      info: { shape: 'pointer-file-unresolved', pointer },
      errors: [
        `${linkPath} contains an unresolved pointer '${pointer}'. Edit the file to name the actual path to your DEVAI installation's constitution.md.`,
      ],
    };
  }
  const resolved = pointer.startsWith('/') ? pointer : resolve(dirname(linkPath), pointer);
  if (!resolved.endsWith('/constitution.md')) {
    return {
      name: 'constitution-symlink',
      ok: false,
      info: { shape: 'pointer-file-target-wrong-name', pointer, resolved },
      errors: [
        `${linkPath} pointer resolves to ${resolved}; expected a file named constitution.md`,
      ],
    };
  }
  if (!existsSync(resolved)) {
    return {
      name: 'constitution-symlink',
      ok: false,
      info: { shape: 'pointer-file-target-missing', pointer, resolved },
      errors: [`${linkPath} pointer resolves to ${resolved}, which does not exist`],
    };
  }
  return {
    name: 'constitution-symlink',
    ok: true,
    info: { shape: 'pointer-file', pointer, resolved },
  };
}

/**
 * D-118: `devai_version` in `.devai/config/project.json` is
 * machine-managed (stamped by `init`/`upgrade` from the running
 * CLI's own version) — this check compares the pin against the
 * actually-installed `@devai-nyx/cli` and reports drift. Canonical
 * consumption is versioned GitHub Packages (D-118); a repo consuming
 * via a sibling-checkout dev convenience will drift here whenever
 * the checkout advances without a re-stamp, which is expected and
 * informational rather than a defect in that mode.
 */
function checkDevaiVersionMatch(repoRoot: string): CheckResult {
  const configPath = join(repoRoot, '.devai/config/project.json');
  if (!existsSync(configPath)) {
    return { name: 'devai-version-match', ok: false, errors: [`missing: ${configPath}`] };
  }
  let pinned: string | undefined;
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { devai_version?: string };
    pinned = parsed.devai_version;
  } catch (err) {
    return {
      name: 'devai-version-match',
      ok: false,
      errors: [`cannot parse ${configPath}: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
  const running = resolveCliVersion();
  // D-122 (item 2a): "which devai am I running" is always answerable —
  // provenance names the resolution mode and, for a sibling-checkout,
  // the exact commit, regardless of whether the version pin matches.
  const provenance = resolveCliProvenance();
  const provenanceInfo = {
    source: provenance.source,
    ...(provenance.gitSha !== undefined && { git_sha: provenance.gitSha }),
  };
  if (pinned === undefined) {
    return {
      name: 'devai-version-match',
      ok: false,
      info: { running, provenance: provenanceInfo },
      errors: ['project.json carries no devai_version field'],
    };
  }
  const ok = pinned === running;
  return {
    name: 'devai-version-match',
    ok,
    info: { pinned, running, provenance: provenanceInfo },
    ...(!ok && {
      errors: [
        `project.json devai_version (${pinned}) does not match the installed @devai-nyx/cli (${running}); re-run \`devai init\` or \`devai adopt upgrade\` to re-stamp`,
      ],
    }),
  };
}

function checkAuthorityEnforcement(repoRoot: string): CheckResult {
  const projectPath = join(repoRoot, '.devai/config/project.json');
  const policyPath = join(repoRoot, '.devai/config/authority-policy.json');
  try {
    const project = JSON.parse(readFileSync(projectPath, 'utf8')) as {
      authority_enforcement?: { mode?: string; adapter_config?: string };
    };
    const policy = JSON.parse(readFileSync(policyPath, 'utf8')) as Record<string, unknown>;
    if (!validators.authorityPolicy(policy)) {
      return {
        name: 'authority-enforcement',
        ok: false,
        errors: ['authority-policy.json does not validate against authority-policy.schema.json'],
      };
    }
    const expected = buildTrustedAuthoritySources(
      getFullRegistry(),
      repoRoot,
      resolveCliVersion(),
    ).provenance;
    const bindingMatches =
      policy['repository_id'] === expected.repository_id &&
      canonicalSha256(policy['framework_package']) ===
        canonicalSha256(expected.framework_package) &&
      canonicalSha256(policy['constitution']) === canonicalSha256(expected.constitution) &&
      canonicalSha256(policy['source_policy']) === canonicalSha256(expected.source_policy) &&
      canonicalSha256(policy['additive_extensions']) ===
        canonicalSha256(expected.additive_extensions) &&
      policy['resolved_digest_sha256'] === expected.resolved_digest_sha256;
    const enforcement = policy['enforcement'] as { mode?: string } | undefined;
    const host = policy['host_enforcement'] as { mode?: string } | undefined;
    const declaredMode = project.authority_enforcement?.mode;
    const adapterDeclared =
      declaredMode !== 'host-integrated' ||
      (typeof project.authority_enforcement?.adapter_config === 'string' &&
        project.authority_enforcement.adapter_config.length > 0);
    const ok =
      bindingMatches &&
      enforcement?.mode === 'binding' &&
      host?.mode === declaredMode &&
      ['cli-only', 'host-integrated'].includes(declaredMode ?? '') &&
      adapterDeclared;
    return {
      name: 'authority-enforcement',
      ok,
      info: {
        enforcement: enforcement?.mode ?? 'unknown',
        host_mode: host?.mode ?? 'unknown',
        declared_mode: declaredMode ?? 'unknown',
        policy_binding: bindingMatches ? 'current' : 'mismatch',
        cli_runtime_enforced: bindingMatches && enforcement?.mode === 'binding',
        arbitrary_host_tools_enforced: declaredMode === 'host-integrated' && adapterDeclared,
      },
      ...(!ok && {
        errors: [
          'authority posture is missing, stale, non-binding, or inconsistent; re-materialize with `devai adopt upgrade --as-role architect --write`',
        ],
      }),
    };
  } catch (error) {
    return {
      name: 'authority-enforcement',
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * D-122 (item 2b): sibling-checkout consumption stops being a silent
 * default. Compares the repo's declared `devai_consumption` against
 * the running CLI's actual resolution mode (`resolveCliProvenance`).
 * Absence is assumed `npm-package` (the canonical model, D-118) — a
 * repo actually running via an undeclared sibling-checkout link
 * fails here even if `devai-version-match` happens to pass. Adopter
 * posture only: DEVAI's own repo doesn't "consume" itself.
 */
function checkDevaiConsumption(repoRoot: string): CheckResult {
  const configPath = join(repoRoot, '.devai/config/project.json');
  let declared: string | undefined;
  if (existsSync(configPath)) {
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { devai_consumption?: string };
      declared = parsed.devai_consumption;
    } catch {
      // malformed config surfaces via other checks; treat as undeclared here
    }
  }
  const provenance = resolveCliProvenance();
  const assumed = declared ?? 'npm-package';
  const ok = assumed === provenance.source;
  return {
    name: 'devai-consumption-declared',
    ok,
    info: {
      declared: declared ?? null,
      actual: provenance.source,
      ...(provenance.gitSha !== undefined && { git_sha: provenance.gitSha }),
    },
    ...(!ok && {
      errors: [
        declared === undefined
          ? `running via a sibling-checkout (${provenance.gitSha ?? 'unknown SHA'}) but project.json declares no devai_consumption (absence assumes npm-package); declare "devai_consumption": "sibling-checkout" if this is intentional (dev-only convenience, D-118), or install @devai-nyx/cli as a real dependency`
          : `project.json declares devai_consumption "${declared}" but the running CLI actually resolved as "${provenance.source}"`,
      ],
    }),
  };
}

/**
 * D-119: verifies the canonical constitution-binding shape — a
 * vendored `.devai/pin/constitution.md` plus a {version, sha256} pin
 * in project.json that matches it. Adopter-posture only: DEVAI
 * itself is the source of the constitution, not a binding to it.
 */
function checkConstitutionBinding(repoRoot: string): CheckResult {
  const status = verifyConstitutionBinding(repoRoot);
  const upstreamNote =
    status.upstreamAhead === true
      ? [
          `pinned version ${status.pin?.version ?? '?'} lags upstream ${status.upstreamVersion ?? '?'} (informational; run \`devai adopt upgrade --constitution\` to refresh)`,
        ]
      : [];
  return {
    name: 'constitution-binding',
    ok: status.ok,
    info: {
      has_pin: status.hasPin,
      has_vendored_copy: status.hasVendoredCopy,
      pin: status.pin,
      vendored_version: status.vendoredVersion,
      upstream_version: status.upstreamVersion,
      upstream_ahead: status.upstreamAhead,
    },
    ...((status.errors.length > 0 || upstreamNote.length > 0) && {
      errors: [...status.errors, ...upstreamNote],
    }),
  };
}

function checkAgentsClaudeSync(repoRoot: string): CheckResult {
  const claudePath = join(repoRoot, 'CLAUDE.md');
  const agentsPath = join(repoRoot, 'AGENTS.md');
  if (!existsSync(claudePath) || !existsSync(agentsPath)) {
    return {
      name: 'agents-claude-sync',
      ok: false,
      errors: ['CLAUDE.md or AGENTS.md missing at repo root'],
    };
  }
  const claudeText = readFileSync(claudePath, 'utf8');
  const agentsText = readFileSync(agentsPath, 'utf8');
  const overrides = readPathOverrides(repoRoot);
  const errors: string[] = [];
  for (const f of [
    { name: 'CLAUDE.md', text: claudeText },
    { name: 'AGENTS.md', text: agentsText },
  ]) {
    if (!f.text.includes('Article 6')) {
      errors.push(`${f.name}: missing Constitution Article 6 reference`);
    }
    for (const role of FIVE_ROLES) {
      if (!f.text.includes(role)) {
        errors.push(`${f.name}: missing role '${role}'`);
      }
    }
    for (const src of READING_ORDER_SOURCES) {
      const resolvedSrc = applyPathOverride(src, overrides);
      if (!f.text.includes(resolvedSrc)) {
        errors.push(`${f.name}: missing reading-order source '${resolvedSrc}'`);
      }
    }
  }
  return {
    name: 'agents-claude-sync',
    ok: errors.length === 0,
    ...(errors.length > 0 && { errors }),
  };
}

function checkWorkspaceLayout(repoRoot: string): CheckResult {
  const expected = [
    'package.json',
    'pnpm-workspace.yaml',
    'tsconfig.base.json',
    'tsconfig.json',
    'packages/cli',
    'packages/authority',
    'packages/evidence',
    'packages/loop',
    'packages/skills',
    'packages/spec',
    'packages/schemas',
    'packages/sensors',
    'packages/utils',
  ];
  const missing: string[] = [];
  for (const path of expected) {
    const full = join(repoRoot, path);
    if (!existsSync(full)) missing.push(path);
  }
  return {
    name: 'workspace-layout',
    ok: missing.length === 0,
    info: { expected, missing },
    ...(missing.length > 0 && { errors: missing.map((p) => `missing: ${p}`) }),
  };
}

function checkChainPathWritableDir(chainPath: string): CheckResult {
  try {
    const dir = chainPath.substring(0, chainPath.lastIndexOf('/'));
    const stat = statSync(dir);
    if (!stat.isDirectory()) {
      return {
        name: 'chain-dir-writable',
        ok: false,
        errors: [`${dir} is not a directory`],
      };
    }
    return { name: 'chain-dir-writable', ok: true, info: { dir } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name: 'chain-dir-writable', ok: false, errors: [msg] };
  }
}

/**
 * Phase 20.C (D-A-6): surface availability of the optional CLI-bridge
 * LLM backends (`claude-cli`, `codex-cli`). Always informational — an
 * adopter who uses `claude` (the SDK family with an API key) or `mock`
 * is unaffected; the check reports which bridges are wired so an
 * adopter setting `DEVAI_LLM_BACKEND=claude-cli` sees a clear yes/no
 * + a hint when the CLI is missing or unauthenticated.
 */
function checkLlmBridges(): CheckResult {
  const bridges = [probeCli('claude'), probeCli('codex')] as const;
  return {
    name: 'llm-bridges',
    ok: true,
    info: {
      bridges: bridges.map((b) => ({
        family: b.family,
        cli: b.cli,
        on_path: b.onPath,
        version: b.version,
        usable: b.usable,
        hint: b.hint,
      })),
    },
  };
}

interface CliProbe {
  readonly family: 'claude-cli' | 'codex-cli';
  readonly cli: string;
  readonly onPath: boolean;
  readonly version: string | null;
  readonly usable: boolean;
  readonly hint: string;
}

function probeCli(cli: 'claude' | 'codex'): CliProbe {
  const family = (cli === 'claude' ? 'claude-cli' : 'codex-cli') as CliProbe['family'];
  const which = spawnSync('command', ['-v', cli], {
    encoding: 'utf8',
    shell: true,
  });
  const onPath =
    which.status === 0 && typeof which.stdout === 'string' && which.stdout.trim().length > 0;
  if (!onPath) {
    return {
      family,
      cli,
      onPath: false,
      version: null,
      usable: false,
      hint: `Install the ${cli} CLI and ensure it is on PATH; then re-run \`devai doctor\`.`,
    };
  }
  const ver = spawnSync(cli, ['--version'], { encoding: 'utf8', timeout: 5_000 });
  const versionLine = typeof ver.stdout === 'string' ? ver.stdout.trim() : '';
  const usable = ver.status === 0;
  return {
    family,
    cli,
    onPath: true,
    version: versionLine.length > 0 ? (versionLine.split('\n')[0] ?? versionLine) : null,
    usable,
    hint: usable
      ? `Set DEVAI_LLM_BACKEND=${family} to use the host ${cli} CLI (auth via host OAuth — no API key required).`
      : `\`${cli} --version\` exited non-zero; the CLI may need a re-login (run it interactively once to refresh credentials).`,
  };
}

function checkDocsGovernanceDoctor(repoRoot: string, skip: boolean): CheckResult {
  if (skip) {
    return {
      name: 'docs-governance',
      ok: true,
      info: { skipped: true, reason: '--skip docs-governance flag set (pre-conversion adopter)' },
    };
  }
  try {
    const report = checkDocsGovernance({ repoRoot, noPublishCheck: true });
    const ok = report.verdict !== 'fail';
    const errors: string[] = report.findings
      .filter((f) => f.severity === 'fail')
      .map(
        (f) =>
          `[${f.ruleId}] ${f.message}${f.remediation !== undefined ? ` — ${f.remediation}` : ''}`,
      );
    return {
      name: 'docs-governance',
      ok,
      info: {
        verdict: report.verdict,
        fail_count: report.fail_count,
        warn_count: report.warn_count,
      },
      ...(errors.length > 0 && { errors }),
    };
  } catch (err) {
    return {
      name: 'docs-governance',
      ok: false,
      errors: [`docs-governance check threw: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

function checkTestTrace(repoRoot: string): CheckResult {
  const result = validateTestTrace({ repoRoot });
  return {
    name: 'test-trace',
    ok: result.ok,
    info: {
      referenced: result.referenced_test_files,
      discovered: result.discovered_test_files,
      supported: result.supported_test_files,
      experimental: result.experimental_test_files,
    },
    ...(result.errors.length > 0 && {
      errors: result.errors.map((error) => `${error.file}: ${error.message}`),
    }),
  };
}

/**
 * Each check is registered with the postures it applies to. The
 * adopter posture deliberately drops `workspace-layout` and
 * `schemas-loadable` (both check for DEVAI's own monorepo shape)
 * and runs an adopter-flavoured `f1-paths-present` that checks the
 * substrate roots `init --execute` seeds (minus `law/schemas/`).
 *
 * `constitution-symlink` runs in the adopter posture too; it will
 * pass against adopters once Phase 21.D's init+doctor pair lands
 * (today it requires the existing self-development symlink shape).
 */
interface CheckSpec {
  readonly name: string;
  readonly postures: ReadonlySet<Posture>;
  /**
   * D-112: lowest adoption profile at which this check is binding.
   * Below it the check still runs but is reported advisory and
   * excluded from the report's `ok`. Default tier1 (always binding).
   */
  readonly minProfile?: AdoptionProfile;
  readonly run: (
    repoRoot: string,
    chainPath: string,
    posture: Posture,
    skipDocsGovernance?: boolean,
  ) => CheckResult;
}

const CHECK_SPECS: readonly CheckSpec[] = [
  {
    name: 'workspace-layout',
    postures: new Set<Posture>(['self']),
    run: (repoRoot) => checkWorkspaceLayout(repoRoot),
  },
  {
    name: 'f1-paths-present',
    postures: new Set<Posture>(['self', 'adopter']),
    run: (repoRoot, _chainPath, posture) => checkF1Paths(repoRoot, posture),
  },
  {
    name: 'schemas-loadable',
    postures: new Set<Posture>(['self']),
    run: (repoRoot) => checkSchemasLoadable(repoRoot),
  },
  {
    name: 'test-trace',
    postures: new Set<Posture>(['self']),
    run: (repoRoot) => checkTestTrace(repoRoot),
  },
  {
    name: 'constitution-symlink',
    postures: new Set<Posture>(['self', 'adopter']),
    run: (repoRoot) => checkConstitutionSymlink(repoRoot),
  },
  {
    name: 'agents-claude-sync',
    postures: new Set<Posture>(['self', 'adopter']),
    run: (repoRoot) => checkAgentsClaudeSync(repoRoot),
  },
  {
    name: 'chain-dir-writable',
    postures: new Set<Posture>(['self', 'adopter']),
    run: (_repoRoot, chainPath) => checkChainPathWritableDir(chainPath),
  },
  {
    name: 'evidence-chain-valid',
    postures: new Set<Posture>(['self', 'adopter']),
    run: (_repoRoot, chainPath) => checkEvidenceChain(chainPath),
  },
  {
    name: 'llm-bridges',
    postures: new Set<Posture>(['self', 'adopter']),
    minProfile: 'tier3',
    run: () => checkLlmBridges(),
  },
  {
    name: 'docs-governance',
    postures: new Set<Posture>(['self', 'adopter']),
    minProfile: 'tier3',
    run: (repoRoot, _chainPath, _posture, skipDocsGovernance) =>
      checkDocsGovernanceDoctor(repoRoot, skipDocsGovernance === true),
  },
  {
    name: 'devai-version-match',
    postures: new Set<Posture>(['self', 'adopter']),
    minProfile: 'tier3',
    run: (repoRoot) => checkDevaiVersionMatch(repoRoot),
  },
  {
    name: 'authority-enforcement',
    postures: new Set<Posture>(['self', 'adopter']),
    minProfile: 'tier3',
    run: (repoRoot) => checkAuthorityEnforcement(repoRoot),
  },
  {
    name: 'constitution-binding',
    postures: new Set<Posture>(['adopter']),
    minProfile: 'tier3',
    run: (repoRoot) => checkConstitutionBinding(repoRoot),
  },
  {
    name: 'devai-consumption-declared',
    postures: new Set<Posture>(['adopter']),
    minProfile: 'tier3',
    run: (repoRoot) => checkDevaiConsumption(repoRoot),
  },
];

/**
 * D-122 (item 3b): `constitution-symlink` accepts three shapes
 * (symlink-self, symlink-sibling, pointer-file) and always reports
 * `ok: true` for any of them — it is the legacy/dev-convenience
 * resolvability check (D-119's constitution-binding is the tier3
 * canonical gate; a non-self shape already fails that check at
 * tier3, so the combination is never silently green). This note
 * makes the relationship visible on the symlink check itself,
 * instead of leaving the reader to notice the co-occurring
 * constitution-binding failure on their own.
 */
function annotatePointerOnlyAtTier3(
  checks: readonly CheckResult[],
  profile: AdoptionProfile,
): CheckResult[] {
  if (!profileAtLeast(profile, 'tier3')) return [...checks];
  return checks.map((c) => {
    if (c.name !== 'constitution-symlink') return c;
    const shape = (c.info as { shape?: string } | undefined)?.shape;
    if (shape === undefined || shape === 'symlink-self') return c;
    return {
      ...c,
      info: {
        ...c.info,
        tier3_note:
          'this shape satisfies pointer resolvability (dev-only convenience, D-118) but not the tier3 binding requirement — see the constitution-binding check for the canonical vendored-copy + pin shape',
      },
    };
  });
}

function runChecks(
  repoRoot: string,
  chainPath: string,
  posture: Posture,
  postureSource: 'flag' | 'auto',
  skipDocsGovernance?: boolean,
): Report {
  const profile = readProfile(repoRoot);
  const checks: CheckResult[] = [];
  for (const spec of CHECK_SPECS) {
    if (!spec.postures.has(posture)) continue;
    const result = spec.run(repoRoot, chainPath, posture, skipDocsGovernance);
    // D-112: checks above the declared profile still run (floor, not
    // cage) but are reported advisory and never fail the run.
    const advisory = !profileAtLeast(profile, spec.minProfile ?? 'tier1');
    checks.push(advisory ? { ...result, advisory: true } : result);
  }
  const annotated = annotatePointerOnlyAtTier3(checks, profile);
  const ok = annotated.every((c) => c.ok || c.advisory === true);
  return { ok, posture, posture_source: postureSource, profile, checks: annotated };
}

function renderHuman(report: Report): string {
  const lines: string[] = [];
  const postureSuffix = report.posture_source === 'auto' ? ` (auto)` : '';
  lines.push(
    `devai doctor [posture=${report.posture}${postureSuffix}, profile=${report.profile}]: ${report.ok ? 'OK' : 'FAIL'}`,
  );
  for (const c of report.checks) {
    const mark = c.ok ? '✓' : c.advisory === true ? '·' : '✗';
    lines.push(
      `  [${mark}] ${c.name}${c.advisory === true ? ' (advisory: above declared profile)' : ''}`,
    );
    if (!c.ok && c.errors) {
      for (const e of c.errors) {
        lines.push(`      ${e}`);
      }
    }
    const tier3Note = (c.info as { tier3_note?: string } | undefined)?.tier3_note;
    if (tier3Note !== undefined) {
      lines.push(`      note: ${tier3Note}`);
    }
    if (c.name === 'llm-bridges' && c.info !== undefined) {
      const bridges =
        (
          c.info as {
            bridges?: ReadonlyArray<{
              family: string;
              on_path: boolean;
              usable: boolean;
              version: string | null;
            }>;
          }
        ).bridges ?? [];
      for (const b of bridges) {
        const mark = b.usable ? '✓' : b.on_path ? '!' : '·';
        const versionSuffix = b.version !== null ? ` (${b.version})` : '';
        lines.push(`      [${mark}] ${b.family}${versionSuffix}`);
      }
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * Resolve the posture flags to a concrete posture. At most one of
 * `--self`, `--adopter`, `--auto` may be set; multiple is an
 * EXIT_USAGE error. Default (no flag) is `--auto`.
 */
function resolvePostureFlag(opts: DoctorOptions): PostureFlag | { error: string } {
  const set = [opts.self, opts.adopter, opts.auto].filter((v) => v === true).length;
  if (set > 1) {
    return {
      error: 'devai doctor: --self, --adopter, and --auto are mutually exclusive',
    };
  }
  if (opts.self === true) return 'self';
  if (opts.adopter === true) return 'adopter';
  return 'auto';
}

export const doctor = defineCommand({
  name: 'doctor',
  description:
    'Composite repo health check. Posture: --self (full DEVAI checks), --adopter (subset that applies to adopter repos), --auto (default; sniff repo-root for DEVAI shape).',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command(
        'doctor',
        'Composite repo health check — postures: --self / --adopter / --auto (Phase 21.B, D-A-9)',
      )
      .option('--repo-root <path>', `Repo root path (default: ${DEFAULT_REPO_ROOT})`)
      .option('--chain <path>', `Chain path (default: <repo-root>/${DEFAULT_CHAIN_RELATIVE})`)
      .option('--self', 'Run the full DEVAI-self-development check set.')
      .option(
        '--adopter',
        'Run the adopter subset (workspace-layout + schemas-loadable skipped; f1-paths-present uses the init-seeded substrate roots).',
      )
      .option(
        '--auto',
        'Default. Sniff repo-root for DEVAI workspace shape; pick --self when both packages/cli/src/bin.ts and examples/redox-pack-* are present, else --adopter.',
      )
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .option(
        '--skip <checks>',
        'Comma-separated list of checks to skip (e.g. "docs-governance" for pre-conversion adopters).',
      )
      .action((options: DoctorOptions) => {
        const flag = resolvePostureFlag(options);
        if (typeof flag === 'object' && 'error' in flag) {
          process.stderr.write(`${flag.error}\n`);
          process.exit(EXIT_USAGE);
        }
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const chainPath = options.chain ?? join(repoRoot, DEFAULT_CHAIN_RELATIVE);
        const posture: Posture = flag === 'auto' ? detectPosture(repoRoot) : flag;
        const postureSource: 'flag' | 'auto' = flag === 'auto' ? 'auto' : 'flag';
        const skipSet = new Set(
          (options.skip ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        );
        const skipDocsGovernance = skipSet.has('docs-governance');
        const report = runChecks(repoRoot, chainPath, posture, postureSource, skipDocsGovernance);
        if (options.human) {
          process.stdout.write(renderHuman(report));
        } else {
          process.stdout.write(JSON.stringify(report) + '\n');
        }
        process.exit(report.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});
