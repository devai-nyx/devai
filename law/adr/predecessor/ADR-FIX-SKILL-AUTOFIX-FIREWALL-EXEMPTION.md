---
adr_id: ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION
title: Prompt-firewall exemption for fix-skill autofix self-scope
status: accepted
date: 2026-05-25
authors: ["@aarusso"]
tags: [round-11, prompt-firewall, fix-skills, authority, article-6]
---

# ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION — ratify the `isAutofixSelfScope` carve-out

**Authority:** Architect.
**Related:** Constitution Articles 6 (substrate authority-by-path), 17 (hard gate), 18 (soft gate / iteration loop), 32 (sensor adapter uniformity), 36 (self-application). DEC-0001 (closed via DEC-0001-resolution, R11 W6.07). DEC-0004 (closes with this ADR + the R2-Δ1 triage). DEC-0005 (to be filed for the three SHIP-LATER skills, each invoking this exemption when implemented). Triage: `docs/work/2026-05-25-r2-delta-1-remaining-fix-skills-triage.md`. R11 commits: `272dd08` (W6.07 first batch), `5b8b4af` (W6.07-extension — exemption shipped), `a0f1c8f` (triage doc).

## Status

Accepted on 2026-05-25 (R11 W6.07-extension). The exemption code already shipped in commit `5b8b4af`; this ADR ratifies it.

## Context

Constitution Article 6 establishes substrate authority by filesystem path: Architect-reserved prefixes include `docs/meta/adr/`, `docs/framework/arch/`, `docs/framework/schemas/`, `docs/framework/contracts/`, `docs/meta/ops/`, `docs/meta/security/`, plus `CONSTITUTION.md` and `BUILD-PLAN.md`. The prompt-firewall (`packages/core/src/prompt-firewall/index.ts`) is the runtime mechanism enforcing this article: any write/act-tier skill whose `allowed_write_scopes` overlap an Architect- or Owner-reserved prefix fires `PROMPT_OVERLAY_AUTHORITY_INVERSION`. Per Article 36 (self-application), DEVAI's own skill manifests are subject to the firewall.

There is already one published exemption: `isDraftSubpath()` (lines 119-121) lets a review-agent write `<reserved-prefix>/draft/**` without inverting authority. The rationale is that staging surfaces don't carry authority — drafts never merge to the authority-bearing path without explicit Architect review. This is the precedent shape: a narrow, conventional sub-glob exempted on the basis that the constraint mechanism lives elsewhere.

An asymmetric but instructive precedent already operates in the live framework: `SKILL-fix-lint` (`agent_class: 'review-agent'`, `auto_fix_capable: 'partial'`) mechanically edits TypeScript source under `packages/**` — i.e., Engineer-authority territory — and nobody considers it authority inversion. The constitutional constraints that justify it are (a) the iteration loop (Articles 16-19) caps how many times the autofix can run before escalating; (b) `host_mutation_policy: write_requires_flag` keeps the runtime gate intact; (c) each fix-skill's autofix logic is reviewed in code as it ships. The skill cannot make decisions — it applies pre-determined mechanical transforms.

R11 W6.07 shipped `fix-docs-links` (scope `**/*.md`) and `fix-overrides` (scope `**/*.{ts,tsx,...}`) without firewall pushback, because `overlaps()` (lines 91-100) has a known limitation: it doesn't detect that broad globs literally cover authority-reserved subtrees. R11 W6.07-extension's `fix-adrs` declared the narrower, honest scope `docs/meta/adr/**/*.md` and was correctly caught. The result is a backwards incentive: narrow, truthful scopes get blocked while broad scopes slip through. This ADR introduces a principled exemption so fix-skills can declare narrow, truthful scopes.

## Decision

The firewall's `checkPromptOverlays()` (line 162+) exempts a (manifest, scope) pair from `PROMPT_OVERLAY_AUTHORITY_INVERSION` when all four guard conditions hold, as implemented by `isAutofixSelfScope()` (lines 143-151):

1. **`manifest.family === 'fix'`** — pins the exemption to gate-recovery skills. The substrate's iteration loop is the constitutional constraint mechanism (Articles 16-19); only `fix` skills participate in it.

2. **`manifest.agent_class === 'review-agent'`** — write-class agents do not qualify. The exemption is for skills that exist to verify-and-mechanically-correct, not to author. A `coding-agent` declaring a write scope on an Architect-reserved prefix remains authority inversion.

3. **`manifest.auto_fix_capable ∈ {'partial', 'full'}`** — diagnose-only skills should not declare write scopes at all (Rule 1 of the firewall already enforces that for `permission_tier: read`). The exemption is specifically for skills with shipped autofix logic that has been reviewed in code.

4. **The scope ends in a file-extension restriction** — regex matches `\.[a-zA-Z]+(\{[^}]+\})?$` or `\{[^}]+\}$`. This prevents a bare `docs/meta/adr/**` from qualifying. The exemption requires the skill to target specific authored artifact types (`.md`, `.json`, `.{ts,tsx}`, etc.), never whole directories. A scope like `docs/meta/adr/**/*.md` is accepted; `docs/meta/adr/` and `docs/meta/adr/**` are not.

All four guards must hold conjunctively. The check is per (manifest, scope) pair; a skill with one qualifying scope and one non-qualifying scope still gets the inversion finding on the latter.

## Consequences

**Positive.**

- Fix-skills can declare honest, narrow scopes. The incentive to overdeclare (broad globs that slip past `overlaps()`) is removed.
- The carve-out is reusable for the three SHIP-LATER candidates in the R2-Δ1 triage (`fix-spec-validate`, `fix-typecheck`, `fix-build`) when each ships. DEC-0005 will name them and invoke this ADR at implementation time.
- The constitutional constraint mechanism — iteration loop (Articles 16-19) + `host_mutation_policy: write_requires_flag` + code review of autofix logic — is named explicitly as the post-firewall layer of authority enforcement. The firewall is no longer the only line of defense; it is one of three layered constraints.
- Symmetric with `fix-lint`'s relationship to Engineer authority: a review-agent making mechanical, pre-determined edits to a higher-authority surface is not authority inversion when the mechanical-transform contract is enforced upstream.

**Negative / trade-offs.**

- The firewall now has two exemption paths (`isDraftSubpath` and `isAutofixSelfScope`). A third exemption would warrant rethinking the rule itself rather than patching again — the carve-out budget is approximately full.
- The broad-glob overlap-detection gap remains: `**/*.md` still slips through `overlaps()` because the function doesn't recognize broad globs as covering Architect-reserved subtrees. Listed under Affected Rules for R12 follow-up.
- The four guard conditions are convention, not constitutional invariant. A future refactor renaming `family`, `agent_class`, or `auto_fix_capable` could silently nullify the exemption. Test coverage on the exemption path must include each guard's negative case (one guard at a time fails → finding still fires).

## Alternatives Considered

**(a) Revert `fix-adrs` and reclassify it DIAGNOSE-BY-DESIGN.** Rejected. The triage's symmetry argument with `fix-lint` is sound: `fix-lint` (review-agent) writes mechanical edits to Engineer-authority source; `fix-adrs` (review-agent) writing mechanical edits to Architect-authority ADR scaffolding is the same constitutional shape. Reclassifying would create an inconsistent treatment of two structurally-identical skills.

**(b) Broaden `fix-adrs` scope to `**/*.md` to dodge the firewall.** Rejected. This papers over the firewall gap rather than fixing it, and the manifest's declared scope should be the most-narrow truthful statement. Encouraging skills to overdeclare to avoid runtime checks is the opposite of what the firewall exists to enforce.

**(c) Strengthen `overlaps()` to catch broad globs AND ratify the exemption in this same ADR.** Rejected as out of scope. Re-narrowing the W6.07 skills (`fix-docs-links`, `fix-overrides`) plus auditing every existing manifest for broad-glob authority overlap is non-trivial work. That work is filed as R12 scope; this ADR ratifies the exemption only. Doing both at once would conflate a constitutional ratification with a substrate refactor.

## Affected Rules / References

- **Constitution Article 6** (substrate authority-by-path) — the article this exemption interprets. The firewall enforces it at the tool layer; the exemption narrows the enforcement to non-mechanical writes.
- **Constitution Article 36** (DEVAI applies to itself) — the framework's own skill manifests are subject to its own firewall; the exemption applies uniformly to DEVAI and adopters.
- **Constitution Articles 16-19** (cycles, hard gate, soft gate, iteration cap) — named as the post-firewall constitutional constraint mechanism that justifies the carve-out.
- **`packages/core/src/prompt-firewall/index.ts`**:
  - `overlaps()` (lines 91-100) — known limitation; broad-glob detection deferred to R12.
  - `isDraftSubpath()` (lines 119-121) — exemption precedent #1.
  - `isAutofixSelfScope()` (lines 143-151) — the function this ADR ratifies.
  - `checkPromptOverlays()` (line 162+) — exemption call sites (`exemptByDraft`, `exemptByAutofix`).
- **R11 commits:** `272dd08` (W6.07 first batch — `fix-docs-links` + `fix-overrides`), `5b8b4af` (W6.07-extension — `fix-adrs` + `isAutofixSelfScope` shipped), `a0f1c8f` (triage doc).
- **Decisions:**
  - DEC-0001 — closed via DEC-0001-resolution (R11 W6.07).
  - DEC-0004 — closes citing this ADR and the R2-Δ1 triage.
  - DEC-0005 — to be filed for the three SHIP-LATER skills (`fix-spec-validate`, `fix-typecheck`, `fix-build`); each invokes this exemption at implementation time.
- **Triage doc:** `docs/work/2026-05-25-r2-delta-1-remaining-fix-skills-triage.md`.
- **R12 scope:** `align/devai/round-12/prompts/` (planned) — `overlaps()` strengthening, W6.07 scope re-narrowing (`fix-docs-links`, `fix-overrides`), and a manifest audit pass.
