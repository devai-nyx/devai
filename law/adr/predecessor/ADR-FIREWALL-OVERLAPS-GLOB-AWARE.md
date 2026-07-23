---
adr_id: ADR-FIREWALL-OVERLAPS-GLOB-AWARE
title: Glob-aware overlap semantics for the prompt-firewall
status: proposed
date: 2026-05-25
authors: ["@aarusso"]
tags: [round-12, prompt-firewall, authority, article-6, glob-semantics]
---

# ADR-FIREWALL-OVERLAPS-GLOB-AWARE — strengthen `overlaps()` to glob-aware path-set intersection

**Authority:** Architect.
**Related:** Constitution Articles 6 (substrate authority-by-path) and 36 (DEVAI applies to itself). Successor to `ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION` (commit `aea23bb`); preserves its exemption mechanism under the strengthened semantics. R11 commits: `272dd08` (W6.07 first batch — `fix-docs-links` + `fix-overrides`) and `5b8b4af` (W6.07-extension — `isAutofixSelfScope` shipped). DEC-0005 (R11 successor — SHIP-LATER fix-* skills invoke this exemption post-strengthening). R11 close decision tree Option 4 (the decision that motivates this ADR).

## Status

Proposed on 2026-05-25 (R12 W1). To be flipped to `accepted` upon Architect review of the W2 implementation. Implementation lands in R12 W2; backward-compat fallout is dispositioned in R12 W3 (re-narrow the two W6.07 scopes authored under the broken regime) and R12 W4 (audit every existing skill manifest in `packages/core/src/skills/index.ts`).

## Context

The prompt-firewall (`packages/core/src/prompt-firewall/index.ts`) enforces Article 6's path-based authority by inspecting every skill manifest's `allowed_write_scopes` against the framework's reserved-prefix sets (`ARCHITECT_RESERVED`, `OWNER_RESERVED`, `JOINT_RESERVED`). A write/act-tier coding-agent whose scope overlaps an Architect-reserved prefix fires `PROMPT_OVERLAY_AUTHORITY_INVERSION`. Per Article 36, DEVAI's own catalog is subject to this check.

The current `overlaps(scope, reserved)` at lines 91-100 is a string-based check with three branches: (a) identity (`scope === reserved`), (b) forward containment (`scope.startsWith(reserved)` — the scope lives under the reserved prefix), and (c) a `**`-glob-stripped backward containment that handles `docs/framework/arch/**/*.ts` by trimming the trailing glob to `docs/framework/arch/` and noting the reserved prefix is a prefix of that. The function's own docstring asserts "false-positives are preferable to false-negatives here" — but the failure mode is exactly the opposite: false negatives on broad globs.

The R11 W6.07-extension encounter made the gap concrete. `fix-adrs` declared the honest, narrow scope `docs/meta/adr/**/*.md` and was correctly caught by `overlaps()` because the scope's directory portion (`docs/meta/adr/`) is identical to the reserved prefix. `fix-docs-links` and `fix-overrides` declared broad scopes (`**/*.md`, `**/*.{ts,tsx,...}`) and silently slipped through — neither the forward-containment nor the `**`-stripped backward-containment branches fire for a scope whose directory portion is the empty string or `./`. The result is a backwards incentive: narrow truthful scopes get blocked while broad scopes pass. That is the opposite of what an authority firewall should reward. R11 closed by ratifying `isAutofixSelfScope` as a principled exemption (`ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION`, commit `aea23bb`) and explicitly deferring the broad-glob detection fix to R12 (see that ADR's *Consequences / Negative* and *Alternatives Considered (c)*).

This ADR specifies the strengthened semantics. The implementation algorithm (third-party library vs hand-rolled subset) is W2's call; this ADR sets policy, not algorithm.

## Decision

The firewall's `overlaps(scope, reserved)` is replaced by a glob-aware path-set-intersection check with the following semantics.

### Semantics

A scope glob `S` overlaps a reserved prefix `R` **iff at least one possible file path is both matched by `S` and located under `R`**. Formally: `match(S) ∩ paths_under(R) ≠ ∅`, where `paths_under(R)` denotes the set of paths matched by the conceptual glob `R**` (every path whose normalized form begins with the reserved prefix). The check is symmetric in spirit (both "S covers something under R" and "S sits inside R" produce overlap) and replaces all three branches of the current substring check.

The reserved-prefix vocabulary is unchanged: the literal entries in `ARCHITECT_RESERVED`, `OWNER_RESERVED`, and `JOINT_RESERVED` continue to denote directory-or-file prefixes (e.g., `docs/framework/arch/` denotes the subtree, `CONSTITUTION.md` denotes the single file).

### Implementation choice (W2's call; this ADR recommends, does not mandate)

Two viable algorithms exist:

**(a) Adopt minimatch (or equivalent battle-tested library).** Add a small dependency that already implements brace expansion, `**` semantics, character classes, and edge cases. Use it to materialize a representative path under the reserved prefix and test `matches(scope_glob, candidate_path)`. Recommended: well-known semantics, exhaustively tested upstream, eliminates an entire class of edge cases.

**(b) Hand-roll a glob-subset matcher.** Cover the patterns the framework actually uses: `<dir>/**`, `<dir>/**/*`, `<dir>/**/*.<ext>`, `**/*.<ext>`, and brace-alternation tails (`*.{ts,tsx,...}`). Acceptable if the W4 audit confirms the framework's manifest-pattern surface is genuinely narrow and W4 constrains future manifests via lint or schema validation to stay within that subset.

The W2 worker chooses and justifies in the implementation commit. This ADR does not foreclose either path.

### Backward-compatibility policy

The strengthened semantics will surface authority-inversion findings against skills that previously slipped through. This is *the intended effect*. Each newly-detected overlap gets a per-skill disposition in W3 + W4:

- **(i) Narrow scope to honest paths** — most common; the broad scope was sloppy authoring, not a genuine need.
- **(ii) Qualify for the autofix-self-scope exemption** — `family: 'fix'` review-agents with file-extension-restricted scopes per `ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION`.
- **(iii) Author a new exemption ADR** — last resort; each new exemption is its own ADR. Do not bundle.

W3 handles the two known cases (`fix-docs-links`, `fix-overrides`) explicitly; W4 audits the rest of `packages/core/src/skills/index.ts` and records dispositions in a `docs/work/` audit document.

### Exemption preservation (load-bearing)

The strengthened `overlaps()` raises the rate of true-positive overlap detections; it does NOT change how exemptions apply at the call site. `checkPromptOverlays()` (line 162+) continues to evaluate `exemptByDraft` and `exemptByAutofix` after `overlaps()` returns true. W2 MUST preserve both:

- **`isDraftSubpath` exemption** (precedent #1, lines 119-121) — `docs/framework/arch/draft/**` against `docs/framework/arch/` returns overlap = true under the new semantics (it always did), but `exemptByDraft` carries.
- **`isAutofixSelfScope` exemption** (precedent #2, lines 143-151, R11 W6.07-ext) — the file-extension-restriction guard MUST continue to gate the exemption. A scope like `docs/meta/adr/**/*.md` qualifies (overlap = true, exemption applies); a bare `docs/meta/adr/` or `docs/meta/adr/**` does not (the regex `\.[a-zA-Z]+(\{[^}]+\})?$` fails).

Critically: under the strengthened semantics, a broad scope like `**/*.md` will overlap *every* reserved markdown surface. The exemption gate must reject this case — the file-extension restriction is a necessary condition for the exemption, not a sufficient one. W2 MUST harden `isAutofixSelfScope` (or its call site) to require the scope's directory portion to be a single reserved prefix or a tight sub-glob thereof, not a wildcard-rooted glob. Equivalently: the exemption must require strict containment of the scope's coverage set within one reserved subtree. A broad `**/*.md` on a `family: 'fix'` skill MUST still fire `PROMPT_OVERLAY_AUTHORITY_INVERSION`. This hardening is part of W2.

### Required test coverage (W2 implements)

W2 MUST land focused tests for the following cases. Each case is named so the test file (`packages/core/src/prompt-firewall/__tests__/overlaps.test.ts` or co-located equivalent) can be reviewed against this ADR.

1. **Broad-glob overlap (the regression this ADR fixes).** `scope = '**/*.md'` against `reserved = 'docs/framework/arch/'` → overlap = true. The same scope against `docs/meta/adr/`, `docs/framework/schemas/`, `CONSTITUTION.md` → overlap = true for each. The skill (non-exempt) fires `PROMPT_OVERLAY_AUTHORITY_INVERSION`.

2. **Narrow-glob overlap (no regression on the cases the old `overlaps()` already handled).** `scope = 'docs/meta/adr/**/*.md'` against `reserved = 'docs/meta/adr/'` → overlap = true; against `reserved = 'docs/framework/arch/'` → overlap = false.

3. **File-extension-restricted exemption preservation.** A `family: 'fix'` review-agent with `auto_fix_capable: 'partial'` and `allowed_write_scopes: ['docs/meta/adr/**/*.md']` → overlap = true on `docs/meta/adr/`, BUT `exemptByAutofix` carries, no finding.

4. **Broad-glob + autofix exemption attempted (the hardening case).** A `family: 'fix'` review-agent with `allowed_write_scopes: ['**/*.md']` → overlap = true on every reserved markdown surface; `isAutofixSelfScope` MUST reject the broad scope (file-extension restriction alone is not sufficient); finding fires.

5. **Draft sub-path exemption preservation.** A review-agent with `allowed_write_scopes: ['docs/framework/arch/draft/**']` against `reserved = 'docs/framework/arch/'` → overlap = true, `exemptByDraft` carries, no finding.

6. **Identity and forward containment preservation.** `scope = 'docs/framework/arch/'`, `scope = 'docs/framework/arch/foo/**'`, `scope = 'CONSTITUTION.md'` against their respective reserved entries → overlap = true (unchanged from the old semantics).

7. **Negative case (no false positives).** `scope = 'packages/**/*.ts'` against `reserved = 'docs/framework/arch/'` → overlap = false. A scope that genuinely targets a non-reserved area does not regress.

8. **Evidence-only scope preservation.** `permission_tier: 'read'` with `host_mutation_policy: 'evidence_only'` and `allowed_write_scopes: ['.devai/state/**']` → no finding (unchanged; the evidence-only branch is independent of `overlaps()`).

### Migration sequencing

The ADR explicitly states: re-narrowing the R11 W6.07 scopes (W3) and the manifest audit (W4) MUST land in the same round as the algorithmic change (W2). Shipping the strengthened `overlaps()` without W3 + W4 would leave the framework's own catalog in a known-failing state and violate Article 36 (self-application).

## Consequences

**Positive.**

- The firewall actually enforces what it claims. Article 6 path-based authority is no longer evadable by writing a broader glob.
- Honest narrow declarations become the easy path; broad over-declaration no longer dodges enforcement via the substring gap. The R11 W6.07-extension's backwards incentive is removed.
- R11's `isAutofixSelfScope` exemption becomes the *principled* way past the firewall for fix-skills, instead of relying on the overlap gap accidentally. The exemption was authored anticipating this strengthening; it now operates in its intended regime.
- DEVAI's self-application (Article 36) becomes meaningful for the firewall: a green `checkPromptOverlays()` against the framework's own catalog is now a real assertion about the catalog's authority discipline, not an artifact of the substring check missing the broad cases.

**Negative / trade-offs.**

- Existing skill manifests that slipped through under the substring check now need disposition. W3 handles the two W6.07 skills explicitly (`fix-docs-links`, `fix-overrides`); W4 audits the rest. This is real work; the orchestrator (R12) sizes it.
- The implementation acquires a dependency on glob-matching semantics — either an external library (one new dep, lockfile churn, supply-chain surface) or hand-rolled code (maintenance burden, edge cases to discover). W2 chooses; both costs are real.
- Two exemption paths (`isDraftSubpath`, `isAutofixSelfScope`) now sit between `overlaps()` and the finding. The exemption budget remains approximately full; a third exemption would warrant rethinking the rule structure rather than patching a third time. This was already noted in `ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION` and remains true.
- W2's hardening of `isAutofixSelfScope` (requiring tight sub-glob containment, not just file-extension restriction) tightens the exemption. Any fix-skill that today declares a broad `**/*.<ext>` scope and relies on family/agent_class/auto_fix_capable to exempt itself will now be rejected. This is intentional — those skills were never within the exemption's published intent — but it is a behavior change to call out.

## Alternatives Considered

**(a) Keep the naive substring check; layer a separate broad-glob detector on top.** Rejected. Two-path overlap detection is harder to reason about than one principled check, and the two paths can disagree (a scope that the substring check finds non-overlapping while the broad-glob detector flags overlapping, and vice versa, must reconcile). A single semantics — "do the path sets intersect?" — is easier to specify, test, and maintain.

**(b) Add `minimatch` (or equivalent battle-tested library) as a runtime dependency.** Recommended for W2 (not mandated). Pros: well-known semantics, exhaustively tested upstream, eliminates an entire class of edge cases the firewall would otherwise have to rediscover. Cons: one more dep in the workspace graph, lockfile churn, supply-chain surface. The framework already depends on `ajv` and `cac` per `DESIGN-DECISIONS.md`; one more well-maintained library is a small marginal cost.

**(c) Hand-roll a glob subset matcher covering exactly the patterns the framework uses.** Acceptable for W2 *if* the W4 audit confirms the framework's manifest-pattern surface is genuinely narrow (e.g., the union of `<dir>/**/*.<ext>`, `**/*.<ext>`, and brace-alternation tails). Pros: zero new deps, full understanding of the matcher's semantics. Cons: yet another correct-by-construction artifact to maintain, and the matcher's scope is set by what manifests use *today*. W4 would then need to constrain future manifest authors to this subset via lint or schema validation; otherwise the matcher silently goes wrong as new patterns appear.

**(d) Defer the strengthening to a later round.** Rejected by R11's close decision tree (Option 4 selected). The longer the gap persists, the more skills accumulate broad scopes that will need disposition later; the cost grows monotonically with time.

## Affected Rules / References

- **Constitution Article 6** (substrate authority-by-path) — the article this ADR strengthens enforcement of. The new `overlaps()` is what gives the firewall the resolving power to enforce Article 6 against broad-glob declarations.
- **Constitution Article 36** (DEVAI applies to itself) — the framework's own skill catalog is subject to its own firewall; the audit (W4) is the Article-36-mandated self-application of this ADR.
- **`packages/core/src/prompt-firewall/index.ts`**:
  - `overlaps()` (lines 91-100) — the function being replaced.
  - `isDraftSubpath()` (lines 119-121) — exemption precedent #1; preserved unchanged.
  - `isAutofixSelfScope()` (lines 143-151) — exemption precedent #2 from R11 W6.07-ext; W2 hardens its gate to reject wildcard-rooted globs while preserving its semantics for tight sub-globs.
  - `checkPromptOverlays()` (line 162+) — call site; `exemptByDraft` and `exemptByAutofix` continue to apply post-`overlaps()`.
- **`ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION`** (commit `aea23bb`) — the R11 ADR this one succeeds. Its *Consequences / Negative* explicitly deferred the broad-glob fix to R12; this ADR is that fix.
- **R11 commit `272dd08`** — W6.07 first batch; introduced `fix-docs-links` (`**/*.md`) and `fix-overrides` (`**/*.{ts,tsx,...}`) scopes that R12 W3 re-narrows.
- **R11 commit `5b8b4af`** — W6.07-extension; shipped `isAutofixSelfScope`. W2 preserves and hardens it.
- **DEC-0005** (R11 successor) — when SHIP-LATER fix-* skills (`fix-spec-validate`, `fix-typecheck`, `fix-build`) ship in later rounds, they invoke the exemption mechanism this ADR hardens.
- **R11 close decision tree, Option 4** — the round-close decision that motivates this ADR.
- **R12 worker prompts** — `align/devai/round-12/prompts/01-firewall-overlaps-adr.md` (this ADR), `02-firewall-overlaps-impl.md` (W2 implementation), `03-w6-07-scope-renarrow.md` (W3 disposition of the two known skills), `04-manifest-audit-disposition.md` (W4 catalog-wide audit).
