/**
 * Prompt-overlay authority firewall (Phase 12.B, D-42).
 *
 * Inspects skill manifests for authority-inversion: a coding-agent
 * with write/act tier MUST NOT name successor authority-owned static
 * prefixes outside its declared role.
 * Findings feed the existing unified firewall-verdict schema.
 */

import { minimatch } from 'minimatch';

import type { SkillManifest } from '../skills/index.js';

// Derive these from SkillManifest so the source of truth stays in
// the skills module. If SkillManifest reshapes, these track.
export type AgentClass = NonNullable<SkillManifest['agent_class']>;
export type PermissionTier = NonNullable<SkillManifest['permission_tier']>;

/**
 * Glob patterns reserved to Architect authority. Any coding-agent /
 * ops-agent at write+ tier naming these in allowed_write_scopes is
 * an authority inversion.
 */
const ARCHITECT_RESERVED = [
  'law/constitution.md',
  'law/register/DECISIONS.md',
  'law/register/',
  'law/adr/',
  'law/schemas/',
  'law/invariants/',
  'law/trace.json',
  'law/policy/',
  'work/rounds/',
  'docs/',
];

const OWNER_RESERVED = ['product/'];

const AUDITOR_RESERVED = ['work/audit/'];

const JOINT_RESERVED = ['law/glossary/'];

// Tests are Inspector-authored. coding-agent may write packages/*/src/**;
// ops-agent at act tier may not rewrite tests. The actual check sits in
// the OPS_AGENT_WRITES_TESTS branch below (test-path heuristic).

export interface PromptFirewallFinding {
  readonly code:
    | 'PROMPT_OVERLAY_AUTHORITY_INVERSION'
    | 'READ_TIER_WITH_WRITE_SCOPES'
    | 'OPS_AGENT_WRITES_TESTS'
    | 'JOINT_RESERVED_WITHOUT_REVIEW_AGENT';
  readonly severity: 'warning' | 'error' | 'critical';
  readonly skill_id: string;
  readonly offending_scope: string;
  readonly reserved_to: 'architect' | 'owner' | 'inspector' | 'auditor' | 'architect+owner';
  readonly message: string;
}

export interface PromptFirewallVerdict {
  readonly ok: boolean;
  readonly manifests_checked: number;
  readonly findings: readonly PromptFirewallFinding[];
}

// The validator accepts the readonly subset of SkillManifest it needs.
// SkillManifest carries many fields (kind, authority_role, evidence_files,
// risk_level, etc.) the firewall has no opinion on; Pick keeps the
// dependency narrow and the function callable with partial test fixtures
// (e.g. the unit tests pass synthetic shapes lacking host_mutation_policy).
type SkillManifestShape = Pick<
  Partial<SkillManifest>,
  | 'agent_class'
  | 'permission_tier'
  | 'host_mutation_policy'
  | 'allowed_write_scopes'
  | 'family'
  | 'auto_fix_capable'
  | 'authority_role'
  | 'deterministic'
  | 'llm_backed'
> & { readonly id: string };

/**
 * Determine whether a scope glob overlaps with a reserved prefix.
 *
 * Semantics (R12 W2, per `law/adr/ADR-FIREWALL-OVERLAPS-GLOB-AWARE.md`):
 * a scope glob `S` overlaps a reserved prefix `R` iff at least one path
 * is both matched by `S` and located under `R`. Formally:
 * `match(S) ∩ paths_under(R) ≠ ∅`.
 *
 * Implementation: a literal/substring fast path preserves the existing
 * forward-containment + identity branches (cheap, covers most cases),
 * followed by a glob-aware path-set-intersection check using
 * `minimatch` against a small set of representative probe paths
 * synthesised under the reserved prefix. If any probe is matched by
 * the scope glob, the path sets intersect.
 *
 * Probes cover the patterns the framework's manifests actually use:
 * `<reserved>file.md`, `<reserved>sub/file.md`, `<reserved>a/b/c.json`,
 * `<reserved>a/b/c.ts`, `<reserved>a/b/c.tsx`, `<reserved>a/b/c.json`,
 * `<reserved>schema.json`, `<reserved>a.yaml`. Reserved prefixes that
 * are bare-file (no trailing `/`, e.g. `law/constitution.md`) are probed
 * via the file path itself.
 *
 * Sub-path exemption: paths containing `/draft/` under a reserved
 * prefix are *sandboxed staging surfaces*. A review-agent may
 * write `law/draft/**` without inverting authority,
 * because draft surfaces by convention never merge to the
 * authority-bearing path without explicit Architect review. The
 * exemption is checked in the calling code, not here.
 */
function overlaps(scope: string, reserved: string): boolean {
  // Fast paths — preserve existing exact-match + forward-containment
  // semantics. These are O(1) substring checks and cover the bulk of
  // honest manifests.
  if (scope === reserved) return true;
  if (scope.startsWith(reserved)) return true;

  // Probe paths under the reserved prefix. If reserved ends in `/`,
  // treat it as a directory and synthesise sample files inside it.
  // Otherwise treat it as a single-file reserved entry (e.g.
  // `law/constitution.md`) and probe that exact path.
  const probes: readonly string[] = reserved.endsWith('/')
    ? [
        `${reserved}file.md`,
        `${reserved}sub/file.md`,
        `${reserved}a/b/c.md`,
        `${reserved}a/b/c.json`,
        `${reserved}a/b/c.ts`,
        `${reserved}a/b/c.tsx`,
        `${reserved}a/b/c.yaml`,
        `${reserved}schema.json`,
        `${reserved}index.ts`,
      ]
    : [reserved];

  // dot:true so `.devai/...` style paths still match `**`; nobrace
  // is left default so `{a,b}` brace-alternation is honoured (a
  // common pattern in the framework's manifests).
  for (const probe of probes) {
    if (minimatch(probe, scope, { dot: true })) return true;
  }
  return false;
}

/**
 * Evidence-only scopes (`.devai/state/**` and subdirs) are not
 * host mutations — they are governed audit/replay artifacts.
 * `permission_tier: read` skills may declare these without
 * inverting authority, as long as `host_mutation_policy` is
 * `evidence_only`.
 */
function isEvidenceOnlyScope(scope: string): boolean {
  return (
    scope.startsWith('.devai/state/') ||
    scope.startsWith('record/proofs/work/skill-runs/') ||
    scope.startsWith('record/proofs/work/rgr/')
  );
}

function isArchitectDocumentWriter(m: SkillManifestShape, scope: string): boolean {
  return (
    m.authority_role === 'architect' &&
    m.agent_class === 'review-agent' &&
    m.permission_tier === 'write' &&
    m.host_mutation_policy === 'write_requires_flag' &&
    scope.startsWith('docs/') &&
    !scope.endsWith('/') &&
    !/[*?{}]/u.test(scope)
  );
}

/**
 * Sandbox/draft scopes under reserved prefixes are exempt from
 * the authority-inversion check when the agent_class is
 * review-agent. The convention: `<reserved>/draft/**` is a
 * staging surface, never directly authority-bearing.
 */
function isDraftSubpath(scope: string): boolean {
  return /\/draft(\/|$)/.test(scope);
}

/**
 * Fix-skill autofix exemption (R11-W6.07 extension, R2-Δ1 ship-now).
 *
 * A `family: 'fix'` skill with `auto_fix_capable: 'partial'` (or 'full')
 * and `agent_class: 'review-agent'` may write to its own gate's
 * authority-reserved surface, provided the declared scope is a tight
 * sub-glob (file-type-restricted) of a single reserved prefix. The
 * autofix is constitutionally constrained to mechanical edits — the
 * same way `fix-lint` mechanically edits TypeScript source — so naming
 * the gate's own surface in `allowed_write_scopes` is not authority
 * inversion. Each fix-skill's autofix logic is reviewed in code, and
 * the `host_mutation_policy: write_requires_flag` keeps the runtime
 * gate intact.
 *
 * The check requires strict containment: a scope like
 * `law/adr/<star><star>/<star>.md` is accepted because it's under
 * `law/adr/`, but a bare `law/adr/` or `law/adr/<star><star>`
 * without a file-extension restriction is rejected. This keeps the
 * exemption narrow.
 */
function isAutofixSelfScope(m: SkillManifestShape, scope: string): boolean {
  if (m.family !== 'fix') return false;
  if (m.agent_class !== 'review-agent') return false;
  if (m.auto_fix_capable !== 'partial' && m.auto_fix_capable !== 'full') return false;
  // Require a file-extension restriction within the scope to prove the
  // pattern targets specific authored artifacts, not the directory at
  // large.
  const hasFileExt = /\.[a-zA-Z]+(\{[^}]+\})?$/.test(scope) || /\{[^}]+\}$/.test(scope);
  if (!hasFileExt) return false;
  // R12 W2 hardening (per ADR-FIREWALL-OVERLAPS-GLOB-AWARE §Decision /
  // "Exemption preservation"): the exemption requires strict containment
  // of the scope's coverage set within a single reserved subtree. A
  // wildcard-rooted glob (e.g. `**/*.md`) covers the whole repo and
  // must NOT qualify — otherwise the broad-glob class re-enters the
  // firewall through the exemption rather than through the
  // (now-strengthened) overlap check.
  //
  // The path-segment prefix up to the first `**` wildcard must be a
  // non-empty, non-trivial literal directory. Scopes whose first
  // segment is `**` (or whose only literal segment before `**` is
  // empty / `./`) are rejected.
  const firstDoubleStar = scope.indexOf('**');
  if (firstDoubleStar === -1) {
    // No `**` present — the scope is a literal or single-segment
    // pattern. The file-extension check above already ensures it
    // targets a specific artifact type; any literal scope is fine.
    return true;
  }
  const prefix = scope.slice(0, firstDoubleStar).replace(/\/+$/, '');
  if (prefix.length === 0) return false;
  // Reject prefixes that contain wildcards before the first `**`
  // (e.g. `*/foo/**/*.md`). The exemption is for scopes rooted at a
  // literal directory the skill plausibly governs, not patterns whose
  // root segment is itself wild.
  if (/[*?]/.test(prefix)) return false;
  return true;
}

// reservedTagOf intentionally inlined into the rule branches below;
// the explicit dispatch makes the authority attribution obvious in
// each finding's `reserved_to` field. Kept as a comment marker so
// future maintainers know the lookup table is intentional.

export interface CheckPromptOverlaysOptions {
  readonly manifests: readonly SkillManifestShape[];
}

export function checkPromptOverlays(opts: CheckPromptOverlaysOptions): PromptFirewallVerdict {
  const findings: PromptFirewallFinding[] = [];
  for (const m of opts.manifests) {
    const scopes = m.allowed_write_scopes ?? [];
    const tier = m.permission_tier;
    const cls = m.agent_class;

    // Rule 1: read tier MUST have empty allowed_write_scopes, EXCEPT
    // for evidence-only scopes (`.devai/state/**`) when host_mutation_policy
    // says evidence_only. Read skills emit governed audit/replay records
    // to their own state dir; that's not a host mutation.
    if (tier === 'read' && scopes.length > 0) {
      for (const s of scopes) {
        if (isEvidenceOnlyScope(s) && m.host_mutation_policy === 'evidence_only') continue;
        findings.push({
          code: 'READ_TIER_WITH_WRITE_SCOPES',
          severity: 'error',
          skill_id: m.id,
          offending_scope: s,
          reserved_to: 'architect',
          message: `skill '${m.id}' permission_tier=read but allowed_write_scopes contains '${s}'`,
        });
      }
    }

    // Rule 2: write/act tier MUST NOT name Architect-reserved paths,
    // EXCEPT review-agent draft subpaths (e.g. law/draft/**).
    // Drafts are staging surfaces and never merge to authority-bearing
    // paths without explicit Architect review.
    if (tier === 'write' || tier === 'act') {
      for (const s of scopes) {
        const exemptByDraft = cls === 'review-agent' && isDraftSubpath(s);
        const exemptByAutofix = isAutofixSelfScope(m, s);
        const architectBoundDeterministicSkill =
          m.authority_role === 'architect' && m.deterministic === true && m.llm_backed === false;
        const architectDocumentWriter = isArchitectDocumentWriter(m, s);
        for (const reserved of ARCHITECT_RESERVED) {
          if (overlaps(s, reserved)) {
            if (
              exemptByDraft ||
              exemptByAutofix ||
              architectBoundDeterministicSkill ||
              architectDocumentWriter
            )
              break;
            findings.push({
              code: 'PROMPT_OVERLAY_AUTHORITY_INVERSION',
              severity: 'critical',
              skill_id: m.id,
              offending_scope: s,
              reserved_to: 'architect',
              message: `skill '${m.id}' (agent_class=${cls ?? '?'}, tier=${tier}) names Architect-reserved path '${reserved}' via scope '${s}'`,
            });
            break; // one finding per scope-vs-reserved-set match
          }
        }
        for (const reserved of OWNER_RESERVED) {
          if (overlaps(s, reserved)) {
            if (exemptByDraft || exemptByAutofix) break;
            findings.push({
              code: 'PROMPT_OVERLAY_AUTHORITY_INVERSION',
              severity: 'critical',
              skill_id: m.id,
              offending_scope: s,
              reserved_to: 'owner',
              message: `skill '${m.id}' (agent_class=${cls ?? '?'}, tier=${tier}) names Owner-reserved path '${reserved}' via scope '${s}'`,
            });
            break;
          }
        }
        const auditorBoundDeterministicSkill =
          m.authority_role === 'auditor' && m.deterministic === true && m.llm_backed === false;
        for (const reserved of AUDITOR_RESERVED) {
          if (overlaps(s, reserved)) {
            if (!auditorBoundDeterministicSkill) {
              findings.push({
                code: 'PROMPT_OVERLAY_AUTHORITY_INVERSION',
                severity: 'critical',
                skill_id: m.id,
                offending_scope: s,
                reserved_to: 'auditor',
                message: `skill '${m.id}' (agent_class=${cls ?? '?'}, tier=${tier}) names Auditor-reserved path '${reserved}' via scope '${s}'`,
              });
              break;
            }
          }
        }
        for (const reserved of JOINT_RESERVED) {
          if (overlaps(s, reserved) && cls !== 'review-agent') {
            findings.push({
              code: 'JOINT_RESERVED_WITHOUT_REVIEW_AGENT',
              severity: 'warning',
              skill_id: m.id,
              offending_scope: s,
              reserved_to: 'architect+owner',
              message: `skill '${m.id}' touches joint-reserved path '${reserved}' but agent_class is '${cls ?? 'unset'}', not 'review-agent'`,
            });
            break;
          }
        }
      }
    }

    // Rule 3: ops-agent at act tier MUST NOT write tests.
    if (cls === 'ops-agent' && tier === 'act') {
      for (const s of scopes) {
        if (
          s.startsWith('test/') ||
          s.startsWith('tests/') ||
          s.includes('/test/') ||
          s.includes('__tests__') ||
          /\*\*\/test\b/.test(s)
        ) {
          findings.push({
            code: 'OPS_AGENT_WRITES_TESTS',
            severity: 'error',
            skill_id: m.id,
            offending_scope: s,
            reserved_to: 'inspector',
            message: `skill '${m.id}' is ops-agent/act and names test path '${s}' (Inspector authority)`,
          });
        }
      }
    }
  }

  const ok = findings.every((f) => f.severity === 'warning');
  return {
    ok,
    manifests_checked: opts.manifests.length,
    findings,
  };
}
