# Governance roadmap — accepted audit items and current disposition

> **Predecessor closure context.** This roadmap was CURRENT at devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d; it carries no successor standing. Successor work is declared only in work/rounds/.

The 2026-06-09 Auditor review produced six accepted recommendations. Status:

| Item                                                                  | Status                                                                      | Where                                                                                                                                                                                           |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–3 — drift sensor, constitutional amendments, BUILD-PLAN restructure | **shipped**                                                                 | drift-remediation round (D-108 → D-109, closure PC-0001)                                                                                                                                        |
| 4 — mechanize the closure ceremony                                    | **shipped**                                                                 | GV round (D-110 → D-111, closure PC-0002): `phase-closure.schema.json`, `devai govern phase close` / `phase ledger`, `gen-closure-ledger.mjs`                                                   |
| 5 — minimal adoption profile                                          | **shipped**                                                                 | AP round (D-112 → D-113, closure PC-0003): `project-config.profile`, profile-aware `doctor` / `init` / `upgrade` / `score compute`, [adoption-profiles guide](../adopters/adoption-profiles.md) |
| 6 — second independent adopter + license                              | **license resolved; supervised pilot deferred to the next readiness round** | Apache-2.0 is current; R15 intentionally excludes the real-adopter exercise                                                                                                                     |
| 7 — canonical adopter-guide placement                                 | **complete in the R21 candidate**                                           | Canonical sources are `docs/adopters/user-guide.md` and `docs/adopters/adoption.md`; W08 removed the former root copies and reconciled inbound links and generated references                   |
| 8 — skills implementation decomposition                               | **R20 local candidate; not integrated or shipped**                          | R22 owns cross-audit, rebase, integration, and package release                                                                                                                                  |
| 9 — reusable evidence-gate self-adoption                              | **shipped in the R21 candidate**                                            | ADR-004 records the hybrid posture; `ci.yml` consumes `reusable-evidence-gate.yml` while DEVAI-specific jobs retain full signal                                                                 |
| 10 — supervised 0.6 package publication                               | **complete**                                                                | Pre-round W0 published the fixed five-package 0.6.0 group; subsequent R19/R20 changes remain a separate future release                                                                          |

The sections below preserve the original rationale. The table above is the
current disposition; historical trigger language below is not a current-status
substitute. Item 6 remains the next production-applicability milestone after
R21 truth closure and R22 integration.

## Item 4 — Mechanize the closure ceremony _(shipped — D-110)_

**Problem.** Every phase/round closes with a hand-written D-entry pair, and properties that are pure functions of the log (the "Nth consecutive no-deletion closure" streak, with its ever-growing bracketed list of prior D-numbers) are narrated manually in prose. The ceremony's cost grows linearly with history; its information content does not. The D-108 round already trimmed one side of this (BUILD-PLAN no longer accumulates recap paragraphs).

**Proposed shape.**

1. A `phase-closure.schema.json` instance per closure under `record/proofs/closures/`, carrying: phase/round id, declaring and closing D-entry ids, sub-batch list with commits and role tags, gate-sweep results keyed by gate name, `source_repo_deleted: boolean`, validation-criteria checklist with per-criterion verdicts.
2. A `devai govern phase close` verb that validates the instance, appends it, and computes derived properties (consecutive-streak counters, scope-trend series) on demand — never stored as prose.
3. The closing D-entry shrinks to: decision id, one-paragraph judgment ("what we learned"), pointer to the closure instance. Judgment stays human-authored; arithmetic becomes machine-computed.
4. A small generator (`scripts/gen-closure-ledger.mjs`, same family as the R14 generators) renders the closure ledger as a published reference page.

**Touches.** 1 new schema (Architect), 1 CLI verb + state writer (Engineer), contract tests (Inspector), generator (Engineer). No constitutional change — Article 40 is untouched; this mechanizes convention, not axiom.

**Trigger.** Next phase/round closure after this roadmap ships — i.e., the first closure after D-109 should be the first machine-recorded one.

## Item 5 — Minimal adoption profile (tiered on-ramp) _(shipped — D-112)_

**Problem.** Adoption is currently all-or-nothing: constitution + five roles + invariants + trace + 45-cell scorecard before the first green gate. The conceptual load is the framework's largest existential risk; one canonical adopter is the consequence.

**Proposed shape.** Three declared profiles, recorded in `project-config` (extend the schema with a `profile` key):

- **Tier 1 — gates + evidence.** Hard gate, evidence chain, authority-by-path. No invariants, no trace, no scorecard. The pitch: "CI you cannot lie to, in an afternoon."
- **Tier 2 — reference signal.** Adds invariants, trace, test-weakening checks, and the deterministic sensor battery; scorecard computed but advisory.
- **Tier 3 — supervised control.** Adds the soft gate, triage, coupled triplets, worktree orchestration, and human-reviewed scorecard gates. The autonomous loop is an orthogonal experimental feature flag, never implied by a profile.

Profile is a _floor declaration, not a cage_: `devai doctor` reports the declared profile, sensors outside it run in advisory mode rather than being absent, and `devai adopt upgrade --profile` walks a repo up one tier with a checklist. Adoption docs gain a per-tier path; the user guide's first chapter targets Tier 1 only.

**Touches.** `project-config.schema.json` widening (Architect), profile-aware gating in `doctor`/`score compute`/`init` (Engineer), per-tier adoption docs (Architect), tests (Inspector). Constitutionally clean: Articles 16–18 define the gates; a profile that runs fewer _sensors_ is a client policy choice under Article 18's threshold-override clause, but Tier 1/2 repos must not claim Article 36-style full self-application.

**Trigger.** Before any second-adopter onboarding (item 6) — the second adopter should land on Tier 1, by design.

## Item 6 — Second independent adopter + license resolution _(license closed; pilot pending)_

**Problem.** All convergence evidence comes from one adopter (stynx) and sibling repos by the same author; "framework + adopter have converged" remains unfalsifiable until someone outside the author's control adopts. The repository now uses Apache-2.0, so licensing no longer blocks that pilot.

**Proposed shape, in order.**

1. **License decision — complete:** Apache-2.0 is declared consistently in `LICENSE`, package manifests, README, and security policy.
2. **Adoption-readiness gate:** R15 closes repository readiness and experimental containment using controlled fixtures. By Owner direction, it does not perform the representative greenfield/brownfield exercise.
3. **Candidate profile**: a small-to-mid TypeScript repo, NestJS or Express (pack-supported), owner willing to run Tier 1 for one real feature cycle and file findings as D-A-entries — the stynx protocol, but with an author-independent counterparty.
4. **Success criterion**: one merged feature regulated end-to-end by the Tier 1 gates in the external repo, plus a retro distinguishing "confusing docs" findings from "wrong mechanism" findings.

**Touches.** LICENSE + ADR (Owner/Architect), no code expected beyond what the pilot surfaces.

**Trigger.** Schedule the supervised external pilot as the next readiness round after R15 clean close. Autonomous promotion remains a separate later round.

## Sequencing

Items 4, 5, 9, and 10 are closed; item 7 is part of the R21 candidate. Item 8
remains isolated in the R20 branch until R22 cross-audits and integrates it. The
remaining production-applicability sequence is **R21 published-truth close →
R22 R20 integration/release → supervised external pilot → evidence-based
readiness reassessment**. Autonomous promotion is not coupled to that pilot.

## Items 7–10 — disposition of the 2026-07-14 deferrals

The 2026-07-14 clean-room inspection deferred four items at R17 declaration.
Their original scope and current disposition are:

| Item | What                                                                                                      | Who                                  | Trigger                                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7    | Canonicalize the adopter guides under `docs/adopters/`, updating generators and inbound links atomically. | Owner + Architect                    | **Closed in R21 W08:** `docs/adopters/user-guide.md` and `docs/adopters/adoption.md` are the singular canonical sources; close verifies that the former root paths are absent. |
| 8    | Split the skills implementation and embedded prompts without changing manifests or behavior.              | Engineer (own round, coverage-first) | **R20 local candidate**; R22 must cross-audit and integrate before any shipped claim.                                                                                          |
| 9    | Decide whether DEVAI self-consumes the exported evidence-first reusable workflow.                         | Architect + Owner                    | **Closed by ADR-004/R21:** hybrid self-adoption, preserving DEVAI-specific full-signal jobs.                                                                                   |
| 10   | Exercise the supervised package publication credential and fail-closed release contract.                  | Operator + Engineer                  | **Closed by W0:** 0.6.0 fixed group published and tagged.                                                                                                                      |

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/governance-roadmap.md (classification CURRENT).
