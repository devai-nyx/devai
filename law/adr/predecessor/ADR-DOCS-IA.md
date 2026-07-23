---
adr_id: ADR-DOCS-IA
title: Documentation information architecture — seven-section layout, framework/meta split, generators, dashboards, enforcement
status: accepted
date: 2026-06-04
authors: ["@aarusso"]
tags: [round-14, docs, ia, information-architecture, docusaurus, framework, meta, governance]
---

# ADR-DOCS-IA — the documentation information-architecture law

**Authority:** Architect.
**Related:** Constitution Article 5 (transversals — the docs surface is evaluated by the same scorecard), Article 6 (substrate authority-by-path — `docs/` is Architect-owned), Article 32 (sensor adapter uniformity — enforcement is one more sensor), Article 36 (DEVAI applies to itself — DEVAI's own published site must satisfy the IA it writes), Article 38 (JSON canon — dashboard inputs are JSON), Article 40 (constitutional versioning — the published Constitution is version-pinned). Companion ADRs: `ADR-DOCS-GOVERNANCE.md` (R13 W01 — builder choice and publish target; this ADR layers IA on top), `ADR-LOCAL-PUBLISH-WORKFLOW.md` (R13 W02 — the `gh-pages` publish mechanism that ships the IA).

## Status

Proposed on 2026-06-04 (R14 W01). The locked approach to Decision A (existing-`docs/<dir>` re-home) is **physical reorg**, which renames six paths enumerated in Constitution Article 6. Per Article 40, this is a constitutional amendment; R14 therefore IS the first amendment and bumps the Constitution from 0.1.1 to 0.2.0. Sequential workers W02–W13 implement the law: W02 amends CONSTITUTION.md Article 6 and bumps version; W03 performs the physical reorg of `docs/`; W04 sweeps harness code for hardcoded paths; W05 extends the sync substrate, initialises Docusaurus versioned-docs (snapshotting 0.1.1 as historical, serving 0.2.0 as latest), and converts the sidebar; W06 lands the Start section + landing; W07 lands Theory + papers; W08–W09 land the Framework reference and the Roles section + Adopters reorganisation; W10 ships the five generators; W11 ships the Reference + Meta sections; W12 extends `check-docs-governance` with the five IA rules plus the adopter-migration doc; W13 publishes, verifies, and closes.

## Context

R13 (ADR-DOCS-GOVERNANCE + ADR-LOCAL-PUBLISH-WORKFLOW) settled three questions: which builder (Docusaurus for libraries, default for applications), where to publish (same-repo `gh-pages`), and who enforces (`devai check docs-governance`). It did not settle the question that adopters of the resulting site immediately ask, which is: *what am I looking at, and how do I navigate it?*

DEVAI's current Pages site at `https://aarusso-nyx.github.io/devai/` exposes the symptom. The sidebar autogenerates twelve flat categories (`arch`, `adr`, `contracts`, `skills`, `cli`, `adopters`, `ops`, `roles`, `security`, `glossary`, `product`, `papers`) directly from the filesystem layout under `docs/`. The reader who lands on the site is dropped alphabetically into `arch/cli-grammar.md`. There is no landing page that orients by audience; no theory entry-point even though two papers exist under `papers/`; no curated reading order even though the repo README has one; no live scorecard or test-matrix visible even though the data is produced every CI run; no Constitution publish even though Article 40 binds clients to a pinned version of it. The repo-side documentation is rich; the Pages-side is filesystem-shaped.

The four canonical audiences for this site each want a different first page:

- **The theorist** wants the control-theoretic framing in compact form, then the papers.
- **The adopter** wants install → first-introspection → role declaration → packs → operations, in that order.
- **The role-holder** (operating as Owner, Architect, Inspector, Engineer, or Auditor) wants the walkthrough for their authority before anything else.
- **The contributor or auditor of DEVAI itself** wants the self-application surface: how DEVAI applies to its own development, what the live scorecard says, what the test matrix covers, where the dev process lives.

These four audiences read four different sites today only because they each know which directory to open. The Pages site flattens them into one undifferentiated tree.

This ADR establishes the information architecture. It is binding on DEVAI's own publish; soft-warning on adopter repos until they graduate per Decision 9. The mechanism — constitutional amendment, physical reorg, harness sweep, sync-script extensions, generators, sidebar manifest, enforcement sensor rules — is delegated to W02–W12; this ADR is the law and W13 is the close.

## Decision

Twelve enumerated decisions. Together they define the published-site layout, the framework/meta semantic split, the publish contract for generated content, the constitution-versioning posture, and the enforcement substrate.

### Decision 1 — Seven-section information architecture

Every governed repo's Pages site publishes exactly seven top-level sections, in this order:

1. **Start here** — landing page, "what is this," reading order, current status.
2. **Theory** — the framework's theoretical grounding (for DEVAI: the modern-control-theory framing and the long-form papers; for adopters: pointers upstream).
3. **Framework** — the framework reference. The Constitution is the index. Substrates, transversals, the aspect grid, sensors, the scorecard, the loop, concurrency, evidence, invariants, contracts, schemas, the test policy, the glossary all live here. This section answers *what the framework is*.
4. **Roles** — the five human roles plus the agent-discipline mirror. Authored walkthroughs per role; the cross-role coordination model (coupled triplets, branch pipelining, checkpoints). This section answers *who acts*.
5. **Adopters** — install → first introspection → packs → role declaration → conventions → operations → maintenance, in curated order. This section answers *how to use the framework in a repo*.
6. **Reference** — auto-generated reference for the CLI, skills, scripts, sensors quick-reference, examples, and the schema browser. This section answers *where is the verb / artifact I am looking up*.
7. **Meta** — DEVAI applies to itself (Article 36). The live self-scorecard, the test matrix, the dev process (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`), the build plan, the decision log, the changelog, ops audits, security notes, ADRs. This section answers *what does DEVAI itself look like*.

Section names are binding. The order is binding. The mapping of existing `docs/` content into the seven sections is the subject of W02–W08 implementation; the IA itself is closed.

Adding an eighth section, renaming a section, or reordering sections requires a successor ADR. Sub-sectioning within each section is implementation discretion governed by the per-directory `_category_.json` files of Decision 5.

### Decision 2 — Framework and Meta are a binding semantic split

**§3 Framework** describes the contract DEVAI offers to an adopter. Reading it tells the adopter what they are getting and what is expected of them.

**§7 Meta** describes DEVAI's self-application: how DEVAI applies itself to its own development per Article 36. Reading it tells the contributor or auditor of DEVAI what DEVAI is doing internally.

The split is binding because the alternative — mixing self-application with the framework reference — is the canonical failure mode of a framework's documentation. An adopter who reads "the framework requires you to do X" should never have to disambiguate between "X is a property of the framework you are adopting" and "X is what DEVAI happens to do in its own client-of-itself repo."

The split is enforced by:

- **Pages organisation.** Framework and Meta are siblings; neither is a child of the other.
- **Cross-link discipline.** Adopter-facing pages (§5) may cite §3 freely; they may cite §7 only as illustrative example, never as authority. The reverse is true for contributor-facing pages.
- **Sensor (Decision 10).** `docs-ia.framework-meta-split` checks that both sections exist as sibling top-level categories.

The Constitution lives in §3, not §7, because the Constitution is the framework's contract, not its self-application. The Build Plan and Decision Log live in §7, not §3, because they record DEVAI's own development history, not the framework's reference shape.

### Decision 3 — Mirror, do not fork

There is exactly one source of truth for content: the in-repo `docs/` tree plus the named root-file allowlist (Decision 4). The Pages site is generated from that source; it is not an independent authoring surface.

**Mirror** means: every page on the Pages site corresponds to a file under `docs/`, to a file in the root-file allowlist of Decision 4, or to a file produced at build time by a named generator (Decision 6) whose inputs are themselves under `docs/`, `.devai/`, or the allowlist. There are no Pages-only authored documents.

The Pages site layers on top of the mirror three things the in-repo view does not provide:

1. **A landing page** that orients by audience.
2. **A curated sidebar** that replaces autogeneration with authored category manifests (Decision 5).
3. **Frozen-at-build dashboards** that render JSON inputs as readable Markdown (Decision 7).

The Pages site does not introduce content that contradicts, supplements without source, or extends the in-repo `docs/` tree. A contributor who edits a Pages page is editing the source under `docs/`; the Pages copy is a derived artifact.

This rule is what makes Pages publish reproducible and what makes the framework/meta split auditable. A Pages-only authored document is, by construction, a forked surface and a future drift.

### Decision 4 — Root-file publish allowlist

The following repo-root files publish to Pages as part of the sync contract:

| Root file | Pages destination | Section |
|---|---|---|
| `README.md` | `start/readme.md` | §1 Start here |
| `CONSTITUTION.md` | `framework/constitution.md` (versioned-docs URL; 0.2.0 latest + 0.1.1 snapshot per Decision 8) | §3 Framework |
| `CONTRIBUTING.md` | `meta/contributing.md` | §7 Meta |
| `CHANGELOG.md` | `meta/changelog.md` | §7 Meta |
| `BUILD-PLAN.md` | `meta/build-plan.md` | §7 Meta |
| `DESIGN-DECISIONS.md` | `meta/decisions.md` | §7 Meta |

The following root files do **not** publish, by design:

| Root file | Reason |
|---|---|
| `CLAUDE.md` | Session-only instructions for Claude Code. Not a reader-facing document. |
| `AGENTS.md` | Session-only instructions for other agents. Same rationale as `CLAUDE.md`. |
| `LICENSE`, `package.json`, lockfiles, config files | Repo machinery, not documentation. |

The allowlist is closed in the sense that adding a new root-file publish destination requires either an existing entry's destination to change (treated as a documentation reorganisation) or a successor ADR. Adopters MAY extend the allowlist locally for their own root files; the local extension is recorded in the adopter's own ADR.

The two large root files (`BUILD-PLAN.md` at ~256 KB and `DESIGN-DECISIONS.md` at ~360 KB) are too large to scroll cold. Their Pages destinations are accompanied by **prefix index pages** authored at W08 that surface phase-by-phase / D-by-D jump links above the embedded long-form content.

### Decision 5 — Sidebar is authored, not autogenerated

The Docusaurus `sidebars.ts` for each governed repo MUST be authored to reflect the seven-section IA. Autogeneration at the top level is prohibited. Within sections, per-directory `_category_.json` files MAY use Docusaurus's `autogenerated` mode for leaf-page enumeration, but the ordering and labelling of those leaves is governed by an authored manifest at `docs/_ia/categories.json` (or equivalent per-repo location declared in the adopter's pack config).

The manifest declares, per directory:

- The order in which the directory's contents appear.
- The label for the category (overriding Docusaurus's filename-derived default).
- Any per-page overrides (custom label, `sidebar_position`).

The sync substrate (W02) reads the manifest and emits `_category_.json` files into the synced tree. Editing the manifest is the only authorised way to reorder a category; ad-hoc renumbering of files is rejected (it leaves drift between the on-disk layout and the published order).

This rule is the structural counterpart to Decision 1: Decision 1 sets the top-level shape; Decision 5 governs how the shape is implemented and how within-section order is maintained.

### Decision 6 — Five generators are part of the publish contract

The sync substrate runs five generators at build time. Each is a deterministic, pure function of in-repo inputs; each emits Markdown into the Pages tree; each has a vitest contract test pinning output against a fixture.

| Generator | Input | Output | Section |
|---|---|---|---|
| `gen-aspect-grid.mjs` | `cell-mapping.json` + `docs/framework/arch/sensors/<kind>.md` frontmatter | `framework/aspect-grid.md` | §3 |
| `gen-self-scorecard.mjs` | `.devai/scorecard/<latest>.json` | `meta/self-scorecard.md` | §7 |
| `gen-test-matrix.mjs` | vitest configs + suite-outcome manifest | `meta/test-matrix.md` | §7 |
| `gen-skill-catalog.mjs` | skill manifests | `reference/skills/index.md` + per-skill pages | §6 |
| `gen-schema-browser.mjs` | `docs/framework/schemas/*.schema.json` | `framework/schemas/index.md` + per-schema pages | §3 |

The five generators are named in this ADR rather than left to implementation discretion because their outputs are reader-facing pages with binding section placement. The set is closed: adding a sixth generator requires a successor ADR. Changes to an existing generator's output shape land via the generator's contract test, not via ad-hoc Pages re-renders.

The aspect-grid generator (§3) emits the **adopter-facing projection** (kind per cell, no verdict). The self-scorecard generator (§7) emits the **contributor-facing projection** (kind + last verdict) against the scorecard JSON. The two share the cell mapping as input but are separate generators with separate outputs.

### Decision 7 — Frozen-at-build dashboards

The §3 aspect grid, the §7 self-scorecard, and the §7 test matrix are dashboards. They render JSON inputs as Markdown. They are explicitly **frozen at build time**: no runtime fetches, no client-side rendering against a live API, no service-worker refresh.

The published dashboard reflects "state at last publish." When the operator runs `devai docs publish`, the generators read the most recent inputs from disk and emit the Markdown that lands in `gh-pages`. Subsequent state changes do not propagate until the next publish.

This rule is binding because:

- **No runtime substrate.** Pages is a static-hosting target. Introducing runtime calls would require an API or a CDN-cached snapshot, which Article 32 (sensor adapter uniformity) and the lightweight-CI model both reject.
- **Build-time reflects publishable truth.** A dashboard that drifts from the publishable state at publish time has nothing to anchor on; the operator who runs `devai docs publish` should see exactly what the audience sees five minutes later.
- **Replayability.** A frozen-at-build dashboard is reproducible from the same inputs; a live dashboard is not.

The dashboard pages carry a `last_built_at` frontmatter field and a "Last updated" annotation in the rendered output. A dashboard older than 30 days (relative to its latest input file's mtime) is a finding from the W09 sensor at the severity declared in the pack (Decision 9); the remedy is republishing.

### Decision 8 — Constitution publishes as versioned-docs from R14

The Constitution publishes via Docusaurus's `versioned-docs` mechanism. R14 itself triggers initialisation because R14 amends Article 6 (the path-mapping rewrite required by the physical reorg in Decision A of the round plan) and therefore bumps the Constitution from 0.1.1 to 0.2.0. The amendment is Article 40's first invocation against this constitution; the versioning infrastructure activates at the same round that produces the first successor version.

R14 lands the activation in workers W02 and W05:

1. **W02 amends CONSTITUTION.md.** Article 6 is rewritten to point at the new section roots (per Decision A of the round plan). Version bumps to 0.2.0. The Article 40 amendment history records the prior text, the new text, and the rationale.
2. **W05 initialises versioned-docs.** Snapshot the 0.1.1 version into Docusaurus's `versioned_docs/version-0.1.1/` tree (the snapshot is taken from the pre-W02 text). Serve the 0.2.0 canonical at the latest URL (`framework/constitution`). Serve the 0.1.1 snapshot at the versioned URL (`framework/constitution` under `version-0.1.1`).
3. **W05 sweeps cross-references *within DEVAI's docs*** and decides per-link whether each pins to a version or follows latest. Internal framework references default to latest unless anchored to version-specific article numbering. Client repos make their own pin decisions independently; the 0.1.1 snapshotted URL is the link target for clients that choose to pin to 0.1.1, but DEVAI does not sweep external client links.
4. **This decision records the activation.** The earlier-drafted "deferred until first amendment" framing is collapsed by the cascade from Decision A — R14 is the first amendment.

Only the Constitution is versioned. The rest of the docs site remains single-version. Adding versioning to another document still requires a successor ADR.

Subsequent constitutional amendments follow the same workflow established by R14: snapshot the version being superseded, convert `framework/constitution.md` to the new canonical, sweep cross-references, and update CHANGELOG.md. The activation is one-shot; the workflow it enables is permanent.

The earlier draft of this ADR deferred versioned-docs initialisation under the assumption that R14 would not amend the Constitution. Once Decision A was locked as physical reorg, that assumption collapsed — Article 6's rewrite is itself the first amendment, so the cost of activation falls in R14 regardless. The deferral becomes vacuous; the simpler framing is "R14 activates."

### Decision 9 — Severity policy and soft-warn rollout

The W09 enforcement sensor (Decision 10) emits findings at a severity declared per-rule. Severity is governed by the existing pack severity ladder. The defaults per the rollout posture:

| Pack | Default severity for `docs-ia.*` rules |
|---|---|
| DEVAI's own pack | `fail` |
| Default adopter pack | `warn` |

An adopter graduates a rule from `warn` to `fail` by overriding the severity in the adopter's pack config (`docs.ia.<rule>.severity = fail`). The graduation is per-rule, not all-or-nothing: an adopter may graduate `docs-ia.constitution-published` to `fail` while leaving `docs-ia.dashboard-current` at `warn`.

The soft-warn default for adopters exists because R14 lands the IA at the framework side first; the adopter side (currently stynx) needs a migration path that is observable but not blocking. An adopter cliff at R14 close would create a regression where there was none. A future round MAY harden the defaults to `fail` once the canonical adopter has migrated; the harden is itself a pack-config change, not a code change.

The `warn` severity surfaces a finding in `devai doctor` and in the sensor's `SensorReading` output but does not block CI gates. The `fail` severity blocks. This is the same pack-severity ladder Phase 10 introduced (D-38) and that R13's `check-docs-governance` consumes; R14 reuses it without extension.

### Decision 10 — Enforcement substrate

The W09 worker extends the existing `check-docs-governance` sensor (R13 W04) with five new rules:

| Rule | What it checks |
|---|---|
| `docs-ia.landing-exists` | A landing page exists at the Pages root (`docs/site/docs/index.md` or `docs/site/src/pages/index.tsx`) |
| `docs-ia.constitution-published` | When `CONSTITUTION.md` exists at the repo root, `framework/constitution.md` exists on the published site at the versioned-docs latest URL, and a `versioned_docs/` snapshot exists for each prior version recorded in CONSTITUTION's amendment history (per Decision 8) |
| `docs-ia.sidebar-curated` | `sidebars.ts` does not consist exclusively of `autogenerated` top-level items |
| `docs-ia.framework-meta-split` | `framework/` and `meta/` are sibling top-level categories in the sidebar |
| `docs-ia.dashboard-current` | When a dashboard page exists under §3 or §7, its `last_built_at` frontmatter is younger than 30 days relative to its latest input file's mtime |

Each rule emits a finding with `ruleId`, `severity` (per Decision 9), `status` (`pass` / `fail`), `evidence` (paths and observed state), and a `fixHint` (the verb that resolves it; e.g., the sync verb introduced by W02 to extend the sync surface). Findings cite this ADR's decision numbers so operators can locate the violated rule.

The sensor is invoked from `devai doctor` and from the `pnpm check` (or equivalent) batch gate; whether a finding blocks depends on the pack-declared severity (Decision 9). For DEVAI's own pack, every `docs-ia.*` rule is `fail` and blocks; for the default adopter pack, every rule is `warn` and surfaces without blocking.

The sensor is silent on within-section ordering, page word counts, prose quality, link freshness within the synced tree, and other matters that are repo-local concerns or already covered by other sensors (e.g., `devai docs links`). The rules are deliberately narrow: each names a falsifiable structural property of the IA.

### Decision 11 — Adopter applicability

This ADR's rules apply to every governed repo classified as `library` per ADR-DOCS-GOVERNANCE Decision 1. Adopter repos classified as `application` apply the rules in the following form:

| Section | Library | Application |
|---|---|---|
| §1 Start here | MUST | MUST |
| §2 Theory | MUST (full) | MAY publish as upstream pointer |
| §3 Framework | MUST | MAY publish as upstream pointer |
| §4 Roles | MUST | MAY publish |
| §5 Adopters | MUST (their own adopter guide for downstream consumers) | MUST (the app's own user guide) |
| §6 Reference | MUST when CLI / skills / schemas exist | MUST when the app exposes any reference surface |
| §7 Meta | MUST | MUST |

An application repo with no consumers (one-shot product, not a published library) MAY collapse §3 and §4 to a single page each pointing upstream to DEVAI's published versions. The collapse is recorded in the adopter's project config (`docs.ia.collapsed_sections = ["framework", "roles"]`) and the W09 sensor honours the collapse without finding.

The `application`-tier opt-out path is itself the subject of an adopter-side ADR similar to the Jekyll opt-out in ADR-DOCS-GOVERNANCE Decision 3: the adopter authors an `ADR-DOCS-IA-COLLAPSE` recording the rationale and the sunset trigger for revisiting the collapse.

### Decision 12 — Versioning of this ADR

This ADR is at v1. Changes are classified:

- **Major.** Adding an eighth section, removing or renaming an existing section, reordering sections, changing the framework/meta semantic boundary, adding or removing a generator, changing the dashboard freshness threshold, changing severity defaults. Requires a successor ADR.
- **Minor.** Adjusting the sensor's diagnostic messages, adding new validations of existing rules, extending the root-file allowlist, adding per-page overrides in the category manifest, refining the application-tier collapsed-section vocabulary, recording subsequent constitutional version snapshots as Article 40 amendments accumulate. Lands via CHANGELOG entries.

A successor ADR enumerates:

1. What changed and why.
2. Which adopters are affected.
3. The migration path with worker-authored conversion guidance where applicable.
4. The deprecation window for the prior rule.

This versioning policy mirrors ADR-DOCS-GOVERNANCE Decision 7 and ADR-MUTATION-SCENARIOS Decision 7. The same governance discipline applies to schema-shaped substrate, to law-shaped substrate, and to layout-shaped substrate.

## Consequences

**Positive.**

- **Audience-coherent landing.** Each of the four canonical audiences (theorist, adopter, role-holder, contributor) lands somewhere that orients them in one screen rather than dropping them alphabetically into `arch/`.
- **Framework/Meta separation is auditable.** An adopter reading "the framework requires X" never has to disambiguate between framework specification and DEVAI's self-application. The split is sensor-checkable.
- **Constitution is reachable on Pages with full pin-by-version semantics.** R14's Article 6 amendment is itself Article 40's first invocation against this constitution, so versioned-docs activates in R14 (Decision 8). Clients pinning to 0.1.1 link to the snapshotted URL; clients following latest link to 0.2.0's URL. Both URLs are stable.
- **Dashboards become first-class surfaces.** The self-scorecard, the test matrix, and the aspect grid stop being buried in JSON or distributed across prose; they render as readable Markdown pages. The "where is DEVAI today?" question gets a one-click answer.
- **The CLI/skills/schemas reference is uniform.** What R13 W03 began for `devai docs publish`, R14 W07 finishes for the rest of the reference surface. Auto-generated reference becomes the norm.
- **Soft-warn rollout protects the canonical adopter.** Stynx does not get a hard-fail cliff at R14 close. The migration becomes an opt-in graduation.

**Negative / trade-offs.**

- **Authoring volume in W05–W06 is large.** Roughly fifteen new prose pages distilled from CONSTITUTION + existing `docs/framework/arch/`. Quality matters; under time pressure it is easy to under-edit. Mitigation: every `framework/*` page that paraphrases a constitutional article cites the article number and reads as commentary, not restatement.
- **URL discipline starts in R14.** Every cross-reference to the Constitution authored from R14 onward decides per-link whether to pin to a version or follow latest (Decision 8). W05 performs the initial sweep of existing references. The discipline is permanent: contributors learn the versioned URL form once and apply it.
- **R14 substrate scope expanded by the reorg cascade.** Decision A's physical reorg adds three substantial workers (W02 amendment, W03 reorg, W04 harness sweep) ahead of the IA work proper. Workers W05–W13 absorb the original ten-worker plan. The round is now ~13 workers, not 10. Coordinated harness path sweep at W04 is the highest-risk piece; a missed hardcoded path silently breaks authority enforcement.
- **Five generators are five surfaces to maintain.** Each has a contract test, but each is also a long-term commitment to keep producing output as inputs evolve. The closed-set rule in Decision 6 makes the maintenance scope finite.
- **The category-manifest indirection costs one layer of mental model.** Adopters who expected to renumber a file to reorder it now learn to edit `docs/_ia/categories.json`. Documented in the adopter guide; sensor surfaces ad-hoc renumbering as drift.
- **Soft-warn for adopters creates a graduation backlog.** An adopter that never graduates accumulates silent debt. A future round MAY introduce a sensor that surfaces ungraduated `docs-ia.*` rules whose `warn` findings have persisted past a threshold.

## Alternatives Considered

**(a) Keep autogenerated sidebar, add a landing page only.** Rejected. The landing page solves the cold-start problem but not the structural one. A reader who clicks past the landing page is back to the alphabetical category list. The IA must be encoded in the sidebar itself for the navigation to remain coherent across the full site.

**(b) Five sections instead of seven (collapse Roles into Adopters; collapse Reference into Framework).** Rejected. The Roles collapse buries the authority chain inside an installation context; reading "I am operating as Architect" is a pre-install question, not an in-install detail. The Reference collapse loses the auto-generated discipline (CLI / skills / schemas / scripts are all reference surfaces with the same lifecycle, and grouping them together is what justifies the auto-generators' shared infrastructure).

**(c) Single section with subsections (Framework + Meta together).** Rejected per Decision 2. The framework/meta split is the load-bearing semantic boundary; collapsing it reintroduces the canonical confusion this ADR exists to prevent. Subsections within a single top-level category do not provide the same visual signal in Docusaurus's sidebar.

**(d) Meta as a sibling site / subdomain.** Rejected. Splitting Meta to its own URL (`meta.devai.dev` or similar) maximises separation but breaks the single-publish workflow that ADR-LOCAL-PUBLISH-WORKFLOW established. Operators would need two publish targets, two `gh-pages` branches (or two repos), and twice the rendering infrastructure. The pages-side separation in the sidebar achieves the semantic split at a fraction of the operational cost.

**(e) Live dashboards (runtime fetch).** Rejected per Decision 7. A live scorecard would require an API or a service-worker-cached CDN snapshot; both contradict the static-host rule of ADR-LOCAL-PUBLISH-WORKFLOW. Frozen-at-build dashboards are reproducible; live dashboards are not. The 30-day staleness threshold (Decision 7) bounds drift without introducing runtime substrate.

**(f) Algolia DocSearch instead of default Docusaurus search.** Rejected for R14 (out of scope; default search is adequate for ~150 pages). A successor ADR may revisit if the corpus grows substantially or if adopters report search-quality issues. The decision is reversible and adds no IA-level constraints.

**(f-bis) Defer Docusaurus versioned-docs until a future amendment (this ADR's earlier draft).** Considered and superseded. The earlier draft of Decision 8 deferred versioned-docs activation under the assumption that R14 would not amend the Constitution. Once Decision A was locked as physical reorg, that assumption collapsed: Article 6's path-enumeration rewrite is itself Article 40's first amendment, so R14 produces the 0.2.0 version that the deferral would have waited for. The "save the URL discipline until later" benefit disappears (R14 must do the sweep regardless), and the "the same one-shot cost at the amending round" framing now resolves *in this round*. The deferral framing is preserved here as historical record only; the locked Decision 8 is "R14 activates."

**(g) Generate the roles index from the Constitution rather than author it.** Rejected. The authority chain + Article 9-10 framing reads better as authored prose than as a stitched extract. The page does not change often; the cost of authoring once is lower than the cost of maintaining a generator whose output has to read as prose. Authored prose also lets the page cite-then-comment rather than restate-then-link.

**(h) Sync allowlist as code (hardcoded in `sync-docs.mjs`) rather than as a manifest.** Rejected per Decision 5. The category manifest at `docs/_ia/categories.json` is a checked-in declaration of intent; hardcoding it in the script makes it invisible to anyone who is not reading the script. The manifest also lets adopters extend the allowlist without forking the script.

**(i) Apply the IA uniformly to library and application repos.** Rejected per Decision 11. A two-page application repo (e.g., a contact-info site) does not benefit from a §3 Framework section; forcing one creates compliance theatre. The collapsed-section opt-out (with its own adopter-side ADR + sunset trigger) preserves the law's intent without forcing every application repo through the full surface.

## Affected Rules / References

- **Constitution Article 5** (transversals — the docs surface is evaluated by the same scorecard machinery). The §3 Framework section's `test-policy.md` and the §7 Meta section's `self-scorecard.md` are the reader-facing projections of this article.
- **Constitution Article 6** (substrate authority-by-path — `docs/` is Architect-owned). This ADR exercises that authority across the IA layer.
- **Constitution Article 32** (sensor adapter uniformity). The W09 sensor extension uses the same SensorReading shape as every other DEVAI sensor.
- **Constitution Article 36** (DEVAI applies to itself). The §7 Meta section is the reader-facing surface of self-application; the ADR's own validation criteria require DEVAI's pack to override `docs-ia.*` rules to `fail`.
- **Constitution Article 38** (JSON canon). All five generator inputs are JSON.
- **Constitution Article 40** (constitutional versioning). R14's Article 6 amendment is Article 40's first invocation against this constitution. Decision 8 activates Docusaurus versioned-docs in R14, snapshots 0.1.1, and serves 0.2.0 as latest. Article 40's pin-by-version semantics are fully operational at both page and URL levels from R14 close.
- **`docs/meta/adr/ADR-DOCS-GOVERNANCE.md`** (R13 W01). Sibling cross-repo governance ADR; this ADR layers IA on top of the builder + publish-target decisions established there.
- **`docs/meta/adr/ADR-LOCAL-PUBLISH-WORKFLOW.md`** (R13 W02). The publish mechanism that ships the IA to `gh-pages`. Decision 7 (frozen-at-build dashboards) depends on the static-host rule established there.
- **`docs/meta/adr/ADR-MUTATION-SCENARIOS.md`** (R11 W1.01) and **`docs/meta/adr/ADR-ROUND-EXECUTE-SEMANTICS.md`** (R10) — precedents for the twelve-decision sectioning and the versioning policy of Decision 12.
- **R14 round prompts:** to be authored at `align/devai/round-14/prompts/` per the R13 convention. The orchestrator brief enumerates W01–W13; this ADR is W01's deliverable.
- **Downstream gating:** stynx adopter migration (soft-warn rollout per Decision 9) is gated on R14 close. The migration is the adopter's own subsequent round; DEVAI does not block it.

## Validation criteria

The ADR is satisfied at R14 W13 close when all of the following hold:

- DEVAI's own Pages site at `https://aarusso-nyx.github.io/devai/` exposes exactly seven top-level sections in the order of Decision 1.
- The Constitution publishes at `framework/constitution.md` reachable from the §3 Framework sidebar. Docusaurus versioned-docs is initialised (Decision 8): 0.2.0 serves as latest; 0.1.1 is snapshotted under `versioned_docs/version-0.1.1/`. Both URLs resolve.
- CONSTITUTION.md at the repo root is at version 0.2.0; the Article 40 amendment history records the Article 6 rewrite.
- The five generators (Decision 6) produce non-empty output that validates against their respective contract tests.
- The W09 sensor returns `findings: []` against DEVAI's own pack with all five `docs-ia.*` rules at severity `fail`.
- The framework/meta split (Decision 2) is observable in the sidebar: `Framework` and `Meta` are sibling top-level categories.
- The root-file allowlist (Decision 4) is honoured: `CONSTITUTION.md`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `BUILD-PLAN.md`, `DESIGN-DECISIONS.md` are reachable on the published site; `CLAUDE.md` and `AGENTS.md` are not.
- `devai docs links` clean.
- All test suites green (lint, typecheck, unit, integration, e2e, smoke, contract, regression).
