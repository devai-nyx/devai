---
adr_id: ADR-DOCS-GOVERNANCE
title: Cross-repo documentation publishing law — classification, builder, opt-out, publish target, enforcement
status: accepted
date: 2026-05-26
authors: ["@aarusso"]
tags: [round-13, docs, governance, docusaurus, jekyll, gh-pages, cross-repo]
---

# ADR-DOCS-GOVERNANCE — the cross-repo documentation publishing law

**Authority:** Architect.
**Related:** Constitution Article 6 (substrate authority-by-path; `docs/` is Architect-owned), Article 32 (sensor adapter uniformity — the enforcement substrate is just another sensor), Article 36 (DEVAI applies to itself — DEVAI's own docs must satisfy the law it writes), Article 38 (JSON canon — classification fact lives in `.devai/config/project.json`). Companion ADRs: `ADR-LOCAL-PUBLISH-WORKFLOW.md` (R13 W02, sequential after this commit — the publishing mechanism). Companion adopter guide: `docs/adopters/docs-governance.md` (R13 W03, future).

## Status

Accepted on 2026-05-26 (R13 W01). Worker 02 ships the publish-workflow ADR. Workers 03 and 04 ship the `devai docs publish` CLI verb and the `devai check docs-governance` sensor that enforces this law. Workers 05 and 06 convert DEVAI itself to Docusaurus and run the first `gh-pages` publish as the canonical reference implementation.

## Context

Every governed repo in the DEVAI ecosystem (DEVAI, STYNX, PEC, TEAT, SGP, PORM) currently picks its docs builder independently. The result is fragmentation: an adopter consuming `@devai-nyx/*` or `@stynx/*` libraries reads API reference, search, and versioning surfaces that differ from repo to repo; a consultant moving between PEC and TEAT context-switches between a Docusaurus tree and an ad-hoc collection of Markdown rendered by GitHub's web UI. There is no constraint forcing convergence, because there is no law.

Per Article 6, `docs/` is Architect-owned substrate in every governed repo. That ownership entails responsibility for the cross-repo coherence of the documentation surface, not just for any single repo's internal docs tree. Per Article 36, DEVAI must apply itself: a framework whose own documentation builder is undefined cannot legitimately constrain its adopters' choices. Per Article 32, the enforcement mechanism must be a sensor — a verb the operator can run locally, with deterministic findings, that gates the same artifacts the human reviewer reads.

This ADR establishes the law. The companion W02 ADR establishes the mechanism. The W03 CLI verb and W04 sensor ship the substrates. The W05/W06 self-conversion proves the law is operable on the framework that wrote it.

## Decision

Seven enumerated decisions. Together they define what every governed repo's `docs/` surface must look like, how it gets published, and what happens when the sensor catches a violation.

### Decision 1 — Classification

Every governed repo is classified as exactly one of two `repo.kind` values:

- **`library`** — Framework or library. Consumed or imported by other products as a code dependency. Examples: **DEVAI**, **STYNX**.
- **`application`** — Final application. End-user product not consumed by other repos as a code dependency. Examples: **PEC**, **TEAT**, **SGP**, **PORM**.

Classification is recorded as `repo.kind` in `.devai/config/project.json` and is read by the W04 sensor. A repo that is unclassified at sensor-run time is a hard-fail finding.

The two-class taxonomy is intentional. The library/application distinction is the load-bearing axis for docs requirements: libraries need API reference, search, and versioning so their consumers can find what they need; applications need a one-shot site that explains the product. Subdividing further (e.g., "framework" vs. "library" vs. "SDK") buys nothing operationally and invites taxonomy drift.

### Decision 2 — Builder choice

The builder is determined by classification per the following table:

| Classification | Builder | Latitude |
|----------------|---------|----------|
| `library` | **Docusaurus** | REQUIRED. No opt-out. |
| `application` | **Docusaurus** (default) | Strongly recommended. |
| `application` — opt-out | **Jekyll** | Permitted only via the opt-out procedure (Decision 3). |

No other builder is permitted under this law. Adding a new permitted builder (e.g., mkdocs, hugo, vitepress) requires a successor ADR amending this one. The closed-set rule is what makes cross-repo coherence enforceable: the sensor can validate a finite enumeration; it cannot validate "use whatever you prefer."

Library repos have no opt-out because the API-reference / search / versioning needs that motivate Docusaurus selection are non-negotiable for consumers. An application repo's docs choice affects its users only; a library repo's docs choice affects every downstream consumer's experience.

### Decision 3 — Opt-out procedure (applications only)

An application repo opting out to Jekyll MUST do all of the following:

1. **Author an adopter-side ADR** at the path `docs/meta/adr/ADR-DOCS-BUILDER-OPT-OUT.md` in the adopter repo. The ADR records:
   - **Rationale.** Why Docusaurus is the wrong choice for this repo (e.g., "site is two pages of contact info; Docusaurus overhead unjustified").
   - **Reviewer.** Named human reviewer (not just role) and review date.
   - **Sunset trigger.** The condition under which the decision will be revisited (e.g., "when the docs grow past N pages or when API surface emerges"). An opt-out without a sunset trigger is a hard-fail finding from the sensor.
2. **Record the builder fact** in `.devai/config/project.json` as `docs.builder = "jekyll"`.
3. **Pass the sensor.** The W04 sensor reads both the config fact and the ADR; it verifies the ADR exists at the expected path, has a `sunset_trigger` field, and matches the config. A `docs.builder = "jekyll"` without a paired ADR is a hard-fail finding.

The opt-out is Owner-discretion at the adopter level — DEVAI does not approve or reject specific opt-outs, only enforces that they are documented and revisitable. The sunset trigger is what prevents "permanent" opt-outs from accumulating as silent debt across the ecosystem.

### Decision 4 — Publish target

GitHub Pages from a **`gh-pages` branch in the same repo**. NOT a separate docs repo. NOT via GitHub Actions.

The mechanism — how the build artifact reaches the `gh-pages` branch — is the subject of the companion W02 ADR (`ADR-LOCAL-PUBLISH-WORKFLOW.md`). This ADR establishes only the target: the source-of-truth is `gh-pages` on the same repo where the docs source lives. Custom domains are permitted; the CNAME file is materialized by the W03 CLI verb when configured.

Same-repo `gh-pages` is mandatory because it preserves atomicity: a commit on `main` and the corresponding docs build land in the same repo's history, so `git log` is the single audit trail for both. A separate docs repo splits that history and creates a synchronization problem that DEVAI does not want to solve. GitHub Actions is rejected because the publish mechanism must be operable locally without CI — see W02 for the full rationale.

### Decision 5 — Initial repo classification table

The following table is the canonical classification at the time R13 lands. Subsequent repo additions are classified at their first DEVAI round.

| Repo  | Classification | Builder | Status when R13 lands |
|-------|---------------|---------|----------------------|
| DEVAI | `library`     | Docusaurus | Converted in W05 (this round). |
| STYNX | `library`     | Docusaurus | Audited via `align/stynx/docs-governance-audit.md`. |
| PEC   | `application` | Docusaurus (default) OR Jekyll opt-out | Decided in PEC R11 W01. |
| TEAT  | `application` | Docusaurus (default) OR Jekyll opt-out | Decided in TEAT R11 W01. |
| SGP   | `application` | Docusaurus (default) OR Jekyll opt-out | Decided in SGP R12 W01. |
| PORM  | `application` | Docusaurus (default) OR Jekyll opt-out | When PORM's first round starts. |

Each application repo's classification round chooses between the Docusaurus default and the Jekyll opt-out per Decision 3, and lands the corresponding `.devai/config/project.json` change in the same commit that lands the ADR (for the opt-out case) or the Docusaurus scaffold (for the default case).

### Decision 6 — Enforcement

The W04 sensor `devai check docs-governance` is the enforcement substrate. It is a **hard-fail gate**. The check runs in `devai doctor` and as part of any `pnpm check` (or equivalent) batch gate. Findings cite this ADR's decision numbers (D1–D7) so operators can locate the violated rule.

The sensor validates, at minimum:

- `.devai/config/project.json` declares `repo.kind ∈ {library, application}` (D1).
- The builder fact (`docs.builder`) matches the classification per D2.
- If `docs.builder = "jekyll"`, the adopter-side opt-out ADR exists at the expected path with the required fields (D3).
- The publish target is `gh-pages` in the same repo (D4) — sensor reads `docs.publish_target` from the same config file.
- The docs source tree matches the builder's expected layout (e.g., `docusaurus.config.ts` at the repo's docs root for Docusaurus; `_config.yml` for Jekyll).

A failing finding lists the violated decision number, the offending file/config key, and the remediation step. The sensor is silent on builder-internal choices (e.g., which Docusaurus theme; whether to use `sidebar_position` or numbered file prefixes) — those are repo-local.

### Decision 7 — Versioning and breaking changes

This ADR is at v1. Adding a new permitted builder (e.g., admitting vitepress) is a major-version change to this law and requires a successor ADR. Tightening the rules (e.g., removing the Jekyll opt-out) is also a major-version change. Adjusting the sensor's diagnostic messages, adding new validations of existing rules, or extending the classification table with new repos are minor changes that land via CHANGELOG entries.

A successor ADR must enumerate:

1. What changed and why.
2. Which adopters are affected.
3. The migration path (with worker-authored conversion guidance where applicable).
4. The deprecation window for the prior rule.

This versioning policy mirrors the one in `ADR-MUTATION-SCENARIOS` Decision 7 — the same governance discipline applies to schema-shaped substrate and to law-shaped substrate.

## Consequences

**Positive.**

- **Consistent adopter experience.** An adopter consuming any DEVAI library repo (DEVAI, STYNX) reads a Docusaurus site with the same search, versioning, and API-reference affordances. Cross-repo navigation cost drops.
- **Sensor-enforced, not convention-enforced.** Every governed repo's docs choice becomes a sensor-checkable fact. Drift surfaces immediately as a `devai doctor` finding, not as a slow erosion noticed quarters later.
- **Opt-out is documented, not silent.** A Jekyll opt-out leaves an ADR with reviewer and sunset trigger; the alternative (allowing silent opt-outs) would erode the law within a release cycle.
- **DEVAI self-applies (Article 36).** W05 converts DEVAI itself; the framework cannot ship the law without exercising it.
- **Same-repo `gh-pages` preserves atomicity.** No separate docs repo to keep in sync; `git log` on the source repo is the single audit trail for both the docs and the code they document.

**Negative / trade-offs.**

- **Docusaurus learning curve for app-tier adopters.** Application repos that would have happily shipped a flat README + GitHub Pages now ramp on Docusaurus's TypeScript config, sidebar model, and build pipeline. Mitigated by W03's CLI verb (which abstracts the publish step) and the Jekyll opt-out (which exists exactly for repos where the ramp is not justified).
- **Sunset triggers must actually be tracked.** Without a separate mechanism that periodically re-evaluates opt-outs against their sunset triggers, Jekyll opt-outs could become permanent drift. A future minor MAY extend the sensor to flag opt-out ADRs whose sunset triggers have plausibly elapsed (e.g., "site has grown past N pages").
- **Closed builder set is friction for experimentation.** A repo wanting to try a builder not on the list must either lobby for a successor ADR or break the law. This is the intended trade-off: a permissive law cannot be enforced. The successor-ADR path is the safety valve.
- **Two new substrates to maintain.** The W03 CLI verb and the W04 sensor are net-new code surfaces. Worth it because each has a single responsibility (Article 32) and the framework already has the iteration loop that supports them (Articles 16–19).

## Alternatives Considered

**(a) mkdocs as the standard builder.** Rejected. mkdocs is a Python toolchain; introducing Python into a TypeScript-only stack (per `DESIGN-DECISIONS.md`) is a non-trivial cost — every adopter would need to install and version-pin a Python runtime, and CI matrices grow. The stack lock-in established at Phase 0 explicitly excludes non-TS runtimes for tooling that runs on the same machine as `pnpm`.

**(b) hugo as the standard builder.** Rejected. hugo ships as a single Go binary, which is operationally cleaner than mkdocs but still introduces a non-TS toolchain dependency that adopters must install separately from `pnpm`. The argument against mkdocs applies here for the same reason: docs tooling on adopter machines should travel with `pnpm install`.

**(c) vitepress as the standard builder.** Rejected. vitepress is too new and its plugin ecosystem is materially thinner than Docusaurus's (versioning, search, sidebar autogen, theme customization). For a framework whose adopters need API-reference and versioning surfaces today, the maturity gap is decisive. A successor ADR may revisit this in 12–18 months when vitepress's ecosystem matures.

**(d) GitHub Actions-driven publish.** Rejected per the companion ADR (`ADR-LOCAL-PUBLISH-WORKFLOW.md`, W02). The short form: the publish mechanism must be operable locally without CI — debugging a publish failure that only manifests in a CI runner is operationally worse than running the same publish locally where the operator can iterate. CI is reserved for freshness checks (per the lightweight-CI model), not as a value-producer for the docs site.

**(e) Separate docs repo (e.g., `devai-docs`).** Rejected. A separate repo splits `git log` between code and docs, creates a synchronization problem (when does a docs commit correspond to which code commit?), and breaks atomicity — a feature ships as a code-and-docs pair in one commit on `main` under this law, not as two coupled commits across two repos. The atomicity argument is the same one that put `docs/` inside every governed repo to begin with.

**(f) Per-repo discretion (no law).** Rejected. This is the status quo, and the round exists to fix it. The cost of fragmentation grows with every adopter; convergence today is cheaper than convergence in two years.

## Affected Rules / References

- **Constitution Article 6** (substrate authority-by-path) — establishes that `docs/` is Architect-owned in every governed repo. This ADR exercises that authority cross-repo.
- **Constitution Article 32** (sensor adapter uniformity) — the W04 sensor is the enforcement substrate; uniform with every other DEVAI sensor.
- **Constitution Article 36** (DEVAI applies to itself) — DEVAI's own docs convert to Docusaurus in W05 as the reference implementation.
- **Constitution Article 38** (JSON canon) — `.devai/config/project.json` holds the classification and builder facts.
- **`docs/meta/adr/ADR-LOCAL-PUBLISH-WORKFLOW.md`** (R13 W02, lands sequentially after this ADR) — the publishing mechanism that this ADR's Decision 4 delegates to. Cited by path; the file exists after W02 commits.
- **`docs/adopters/docs-governance.md`** (R13 W03, future) — the adopter-facing guide that walks a new repo through the classification, builder-scaffold, and publish steps. Listed in `docs/adopters/README.md` and authored by W03.
- **`ADR-MUTATION-SCENARIOS`** (R11 W1.01) — precedent for the seven-decision sectioning and the versioning policy (Decision 7).
- **`ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION`** (R11 W6.07-ext) — precedent for ADR-as-ratification of a cross-cutting law that names an enforcement substrate.
- **R13 prompts:** `align/devai/round-13/prompts/00-orchestrator.md`, `align/devai/round-13/prompts/01-docs-governance-adr.md` — the round and worker briefs that scope this ADR.
- **Cross-repo audit:** `align/stynx/docs-governance-audit.md` — STYNX's classification audit, gated on this ADR.
- **Downstream gating:** PEC R11 W01, TEAT R11 W01, SGP R12 W01 are each gated on this ADR's landing.
