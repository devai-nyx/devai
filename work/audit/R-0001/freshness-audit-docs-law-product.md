---
id: R-0001-AUDIT-FRESHNESS-01
title: Freshness audit — docs/, law/, product/ against successor framework state
type: audit-report
status: draft
date: 2026-07-24
authority: Auditor (observation only — this report recommends, never ratifies)
supersedes: null
superseded_by: null
provenance: [session audits 2026-07-23/24 following the P3, P1, P2 closure claims; docs/ audited at ab3c883-era tree, law/ pinned at 1a1a5ad, product/ pinned at 3a533fd; gate runs executed and output read; verified against law/, record/, product/, work/, packages/, REV-0006, plan.md, prompts/, handoffs/; revision 2 of 2026-07-24 integrates the cross-model review (Codex, all three assessments), the round-closure artifacts (backlog BL-001..043, as-built.md, PC-0001), and post-closure repo state — original observation preserved verbatim at commit 1bc2564]
---

# Freshness audit — docs/, law/, product/

Scope: the three trees whose bootstrap waves (P3 docs, P1 law, P2 product) were reported closed.
Question audited: coherence, freshness, and adherence to the successor framework state — not
whether each wave met its own contract (they largely did), but whether the trees are free of
predecessor anchoring and phased-out decisions.

**Revision note (rev 2, 2026-07-24).** The original observation was pinned to pre-closure states;
between its audits and its commit, R-0001 closed (P6 backlog, P7 CI, P8 as-built, PC-0001). This
revision (a) corrects claims the closure artifacts made stale — most importantly, seven of the ten
"silent deferral" ledger rows were in fact captured by the compiled backlog, which consumed the
session audit notes; (b) integrates an independent cross-model verification (Codex) that confirmed
the core findings, refuted or narrowed several claims, and contributed one new product defect and
decisive law evidence (production-facing checks fail while the vitest floor is green); and
(c) upgrades the remediation sections accordingly. Corrections are marked [rev-2]. The original
text is at commit 1bc2564; per round doctrine, PC-0001 and the closed R-0001 records are not
revised by this report.

Method per tree: mechanical sweeps (predecessor paths, retired D-ids with ex- lookbehind, counts,
link graphs, JSON parse/validation, anchor and trace target resolution) plus full or fan-out
semantic reads, every cited claim re-verified against the repository at the pinned HEADs; rev-2
claims re-verified at the post-closure tree. Gate history: 628 passed / 3 failed at the law audit
(all three failures the documented known-reds of P4-law-prerequisites-known-red.md and
P2-product-assertions.md — honest KNOWN-RED state); fully green at closure and since
(812 passed / 8 skipped). [rev-2] The green floor is honest but does not prove operational law
coherence — see Part 3.2b.

A concurrent P4 Engineer session was mutating `packages/` throughout the original audits
(packages/core dissolved, packages/cli rebuilt mid-audit). Package-facing statements name the
state they were checked at.

---

# Part 1 — Cross-cutting synthesis

## 1.1 One root cause, three instances

Every wave faithfully executed a contract whose freshness baseline was the **predecessor**, not
the successor:

- **P3 (docs)**: the audit classification "CURRENT" certified pages current *for the predecessor*
  (its drift gates were green), and the migration contract mandated byte-faithful copies with only
  four path-rewrite classes and three one-line fixes (prompts/03-docs.md L19 — the narrowness was
  intentional and stated).
- **P1 (law)**: W02 imported schemas "as-is at the pin" by design; the genesis import carried
  invariants, trace, policy instances, and adr.schema.json verbatim; P1's contract was completion
  (sweep, examples, defs, population registry), not rebinding.
- **P2 (product)**: REV-0006 certified content "CURRENT" against predecessor-relative checks
  (schema validity, commands resolving in the predecessor's manifest); the Owner marks named three
  fixes, and P2 was correctly forbidden to edit beyond them.

Consequently each closure claim is true of its contract and initially misleading about its tree.
[rev-2] The rebind debt is now almost entirely *documented*: the P6 backlog consumed the docs and
law session audits (BL-007, BL-032, BL-039 cite them in provenance), and the P8 as-built itself
records for P3 that structural migration deliberately deferred semantic surfaces (as-built.md, P3
section). What remains genuinely uncaptured is enumerated in §1.2.

## 1.2 Deferral ledger — status after closure [rev-2: supersedes the original "all silent" table]

Documented before this audit: invariant `authority.docs` anchor rebind (plan W05.2);
authority-policy re-materialization (plan W05.1); `authority`→`authority_docs` rename (DII-099 →
BL-033); constitution operational-value extraction (altitude sweep → BL-034); sensor design notes
and D-190..196 classification; roster/register/glossary count wirings (since closed green).

Ledger disposition at the current tree:

| # | Item | Now covered by | Residue |
|---|---|---|---|
| S1 | trace.json rebind/regeneration | **BL-007 (P0)** — names "rebind or regenerate trace" | execution |
| S2 | forbidden-actions path refresh + missing `law/` protection | **BL-007 (P0)** | execution |
| S3 | adr.schema.json rebind + accepted-vs-active vocabulary | **BL-007 (P0)** — "reconcile the ADR schema/status vocabulary" | genuine policy choice remains (lifecycle vocabulary) |
| S4 | Schema-description predecessor semantics | **BL-007 (P0)** — "scrub predecessor semantics from schema descriptions" | execution |
| S5 | Invariant statement/decisions[]/status cleanup | **BL-007 (P0)** — "disposition stale … invariant … assertions" | per-record reassessment, not mechanical flips |
| S6 | Glossary recurrence outside REV-0006 scope | **BL-007 (P0)** + BL-006 ratification review | execution |
| S7 | glob-guards patterns + floors | **BL-007 (P0)** — "refresh glob/forbidden-action paths" | floors must be non-vacuous, never zeroed for green |
| S8 | docs/ systemic rebind | **BL-032 (P2)** — cites the docs session audit | [rev-2] single-P2 classification understates operational-authority risk; split recommended (Part 2.3) |
| S9 | product residual staleness (journeys, JNY-014, use-cases) | **UNCOVERED** — recorded here (Part 4) only | needs an Owner review + dedicated backlog item (BL-044 candidate; ledger ends at BL-043) |
| S10 | docs/site deploy identity + live-main blob links | **BL-039 (P0)** — cites the docs session audit; BL-003 owns the eventual rename | interim hazard until executed: `npm run deploy` still targets the predecessor name; an immediate deploy-refusal guard is recommended (Part 2.3) |

Note on tracking: BL-007 already names the S1–S7 set — do **not** mint seven DII entries merely to
track defects. New decisions are warranted only where a genuine policy choice remains (notably ADR
lifecycle vocabulary; Article 27's worktree location).

## 1.3 Cross-tree contradiction classes (worth knowing as classes)

- **The Article-32 numbering fossil.** The constitution documents it (L452, L470: evidence is
  Article 42; 32 = sensor uniformity, 33 = Auditor) — yet register DII-055 asserts "the Article-32
  chain" as doctrine, glossary GE-021 defines the evidence chain under "Article 32-33", and the
  docs trees cite Articles 32–33 for evidence pervasively. Law knows the truth; its own register
  and vocabulary contradict it; docs never heard.
- **Placement-test violations in both directions.** Docs' `.devai/state → record/proofs` blanket
  rewrite files mutable state (locks, worktrees, counters, backlog, authority sessions) in the
  append-only proofs store; product journeys carry the inverse fossil (immutable facts still homed
  in `.devai/state/`). [rev-2] The line is per-object, not per-tree: an *open* RGR is legitimately
  mutable head state under `.devai/state/rgr/`; its resolution/closed snapshot belongs in proofs.
  Blanket replacement in either direction is wrong — classification must be individual.
- **Predecessor ADR numbering.** Register entries DII-060/068/092 and docs pages cite "ADR-003/
  005/006" in predecessor numbering; the successor renumbered (runtime authority = ADR-001,
  promotion = ADR-003, completion evidence = ADR-004). The vendored archive is legitimate; live
  citations to it are not.
- **Retired D-nn ids.** Disciplined in successor-authored law (ex- provenance; minor slash-list
  slips) — but cited as live authority across 65 docs files (~94–95 distinct ids, ~312–314
  occurrences by two independent counts), ~14 invariants, several glossary entries, two journeys.
- **Round ceremony.** The successor doctrine (committed work/rounds/R-NNNN intent + work/audit
  observation + record/proofs closure) is what R-0001 itself practiced — yet docs round-workflow
  B0–B4, build-plan-convention, round-break, CONVENTIONS, governed-rounds, use-cases L529, and
  JNY-014's abstract model still teach the predecessor scratch-dossier/seal-and-move ceremony.
  [rev-2] The contradiction now extends into the runtime: the round-lifecycle implementation moves
  `work/rounds/R-NNNN` to `work/rounds/archive/R-NNNN` (packages/loop/src/round-lifecycle/,
  packages/skills governance), which conflicts with the constitutional "plans are amended by dated
  appendix, never rewritten" and the three-tree doctrine — so this is a law/product/runtime
  three-way decision, not a documentation fix (Part 4.3).

## 1.4 Wave-quality ranking (contract execution, not tree freshness)

1. **P2 (product)** — every mark executed exactly and traceably; precise handoffs; no invented
   decisions; one gap (out-of-mark findings never became durable Owner questions).
2. **P1 (law)** — contract items all verified; known-red discipline followed role-pure;
   high-quality altitude sweep; the imported-substrate debt is now BL-007 (P0).
3. **P3 (docs)** — stated acceptance criteria all pass (links, provenance, manifest bijection,
   canon consolidation), but the criteria could not produce a fresh tree; deliberate per its
   prompt, and now correctly characterized by the P8 as-built.

[rev-2] Process-note correction: the original claim that "all three closure claims were executor
self-reports with no independent observation" described the pinned audit-time states. The P8
as-built (committed before this record) is an Auditor observation and explicitly distinguishes
P3's structural migration from semantic freshness; this record is the *consolidated* independent
freshness observation, not the first observation of any kind.

---

# Part 2 — docs/ (audited 2026-07-23, tree of commit ab3c883; rev-2 checks at the current tree)

## 2.1 Verdict

**Structurally closed, semantically open — and the openness was contract-intentional.** All P3
acceptance criteria verified: 718 relative links / 0 broken (185 source files); provenance
footers on all 178 migrated files, with exactly the 7 declared fresh/stub pages without one;
manifest↔disk bijection exact (211 rows); zero HISTORICAL leakage (11 excluded); DUPLICATE
clusters properly reduced to pointers; the 3 STALE one-line fixes applied; role-pure Architect
commit; no versioned snapshots or build output committed under docs/site. The corpus nevertheless
remains the predecessor's manual wearing successor paths; no semantic documentation commit has
landed after ab3c883 [rev-2: reconfirmed by cross-review].

## 2.2 Defect classes (representative citations; full inventory re-derivable mechanically)

1. **Retired D-nn ids as the live citation spine** — 65 files; ~94–95 distinct ids, ~312–314
   occurrences [rev-2: two independent counts, small method variance].
   docs/theory/devai-theory.md alone carries 117 occurrences, codifies the practice (L14; Appendix
   D L738), and still describes the predecessor register and constitution (L88 claims a "D-1
   onward, 165+ entry" register). [rev-2] Docs must point at the register count guard rather than
   hardcode any figure: the current register shows 108 visible DII headings vs 107 parsed governed
   entries — neither number belongs in prose. Several pages teach minting "a successor D-entry"
   as the amendment procedure (reference/cli-grammar.md L73, theory/architecture/id-scheme.md L49,
   invariant-taxonomy.md L58/L80–90).
2. **Predecessor named ADRs as live law; wrong successor numbers** — 21 body references; some link
   texts name nonexistent law/adr files; dev/security/authority-enforcement.md L3 cites "ADR-003"
   for authority enforcement where the successor's is ADR-001.
3. **Fossilized article numbering + standing overclaims** — evidence cited to "Articles 32–33"
   across dev/security, adopters, theory; tests-as-sensors to Article 39 (successor 29), weakening
   to 39 (successor 30), RGR to 19 (successor 22), cost to 30, security-change to 14.
   [rev-2 — narrowed] The version concern is confined to text implying ratification, release, or
   demonstrated successor standing: devai-theory.md's "ratified … v0.7.0" with a six-amendment
   history (L106, L157, L643, L736), docs/index.md's site branding, skill-roadmap.md and
   versioning-policy.md claiming predecessor run/publication history as this repo's standing.
   docs/start/status.md L7 and docs/reference/history.md say draft/provisional correctly; schema
   versions and explicitly labelled candidate versions are legitimate — do not scrub every
   "1.0.0" string.
4. **Phased-out ceremony as current process** — adopters/build-plan-convention.md (whole page,
   incl. the self-contradictory "plan.md at the repo root" rewrite artifact), round-break.md,
   CONVENTIONS.md L109–131, governed-rounds.md, dev/process.md, and the entire
   dev/round-workflow/B0–B4 library (predecessor scratch-session wave ceremony; never names
   work/rounds/R-NNNN + work/audit + record/proofs). Predecessor "four gates" CI, coverage floors,
   and `test:*` scripts presented as the current gate. [rev-2] P7 has since added two workflows
   (.github/workflows/ci.yml, round-gates.yml) and four root scripts/ helpers — which the docs'
   CI/scripts pages still do not describe: the pages describe *different, absent* generators and
   gate sets, so the defect stands with updated ground truth.
5. **Semantically wrong mechanical rewrites** — the `.devai/state → record/proofs` blanket
   substitution files mutable state in the append-only proofs store and describes `record/proofs/`
   as "gitignored, regenerated": adopters/state-layout.md (L1–62), reference/contracts/
   state-extensions.md (L9–31, L81), dev/operations/lock-runbook.md L3/L28, worktree-runbook.md
   L3/L30, operations/README.md L14, security/authority-enforcement.md L55, adopters/
   decisions-ledger.md, adoption.md L57/L226/L364 — contrary to Article 6 L102's explicit split.
   Collaterals: link text naming `../meta/...` while hrefs were rebased; sensors/docs_drift.md L12
   specifies a D-heading check that can never bind against the DII register; transversals.md L30
   vs aspect-grid.md L14 contradict each other about a nonexistent generator.
6. **Frozen predecessor as "live home"** — ≥10 schemas absent from the successor's 54-schema
   canonical roster (most deliberately archived under law/schemas/predecessor-archive/), all 28
   theory figures (no local diagrams/svg or render pipeline; fig-08..20 numbering off-by-one), CI
   workflow references `uses: devai-nyx/devai/...@main`, templates, WORKTREE_CAP source,
   predecessor CLAUDE.md as authority.
7. **Repo-contradicting facts** — [rev-2 re-scoped to the current tree] the blanket absences
   originally cited (no workflows, empty root scripts/, empty packages) are now populated by
   P4/P7; what stands is that many documented script, command, configuration, example, and proof
   paths remain absent (examples/ tree, gen-* generators, root CONTRIBUTING/SECURITY, six
   .devai/config files, several record/proofs subdirectories, docs/_ia/categories.json) and the
   counts/enums remain wrong (sensor registry "58/60–64" vs 59 live; "must/should" severities vs
   the 5-tier enum; SensorReading status enum missing 3 values; fig-07's obsolete transversal
   taxonomy; worktree cap 3-vs-6 across two adopter pages; sensor-registry.md listing five
   archived kinds as live).
8. **Law restated in docs, divergently** — all seven role pages + adopters/user-guide.md L48–55 +
   adopters/prompt-header.md L43–49 + theory/architecture/prompt-firewall.md L42–59 reproduce
   Article 6/7/8 authority tables; restatements wrong where it matters (Auditor's writable path
   given as scratch/…; authority-enforcement.md's table omits law/ and gives F2 as apps/libs);
   framework/loop.md L77–83 and framework/test-policy.md L97 reproduce article text verbatim.
9. **docs/site** — IA plumbing genuinely retargeted, but sync-docs.mjs L10 rewrites unmapped
   cross-repo links to the predecessor's **live main** (44 dead links in generated output) and
   docusaurus.config.ts L9/L11 still selects `baseUrl: '/devai/'`, `projectName: 'devai'` —
   `npm run deploy` would push at the predecessor. [rev-2] Now owned by BL-039 (P0), with the
   rename decision under BL-003; the interim hazard stands until a deploy-refusal guard exists.

Cleanest ground: reference/law.md, product.md, glossary.md, cli.md, the generated-index stubs,
predecessor-governance-roadmap.md, the five skills/round-* pointers, dev/round-ledger.md,
adopters/role-declaration.md, start/what-is-devai.md, ~20 sensor/figure pages. Worst trees in
order: reference/contracts/ + skills/; adopters/ (31 of 33 files with findings); dev/
operations+security; theory/.

## 2.3 Remediation (rev-2 — supersedes the original sketch)

0. **Neutralize the deployment hazard immediately.** Before the final successor repository target
   exists, make `npm run deploy` refuse execution: guard against the predecessor project name, the
   `/devai/` base target, and the predecessor `blob/main` link fallback. Complete BL-039's real
   target binding only after the BL-003 rename/freeze decision.
1. **Split BL-032 by risk** — its single P2 classification understates operational-authority risk:
   P0 site deployment, role-authority pages, mutable-state placement, and destructive/mutating
   operational instructions; P1 obsolete commands, absent paths, adopter onboarding, CI and round
   procedures; P2 theory citations, diagrams, historical narratives, counts, presentation.
2. **Settle sources before bulk rebinding.** Complete R-Ω, attestation rebind, constitution
   ratification, and ADR acceptance first. Then build an explicit per-reference mapping for every
   retired decision, article, ADR, path, and command: live successor reference | explicitly
   historical predecessor citation | deferred/not-implemented | removed. Never mechanical
   `D-N → DII-N` or article-number replacement.
3. **Correct in focused passes**: authority/role pages link Article 6 instead of restating it;
   state docs classified per object (immutable event → record/proofs; mutable counter, lease,
   pointer, lock, session → .devai/state); round docs use work/rounds/R-NNNN + work/audit/R-NNNN +
   record/proofs closure; commands/paths verified against the current action registry and
   filesystem; theory/history preserves predecessor evidence as labelled history, never successor
   standing; site links target the successor for live content and the frozen pin (never main) for
   predecessor citations.
4. **Graduate permanent guards** rejecting: unlabelled D-N outside provenance/history; unresolved
   named ADRs; known predecessor article mappings in current guidance; mutable objects documented
   under record/proofs; predecessor round-path syntax in operational pages; claimed-but-absent
   local paths or commands; `devai-nyx/devai/blob/main` generated links; any deploy configuration
   targeting the predecessor; ratified/released language while governing records are draft. Each
   guard needs explicit historical/provenance exceptions to avoid destroying forensic material.
5. **Execution boundary**: a new governed round — do not revise PC-0001 or the closed R-0001
   records. Architect owns documentation and site-source corrections, Engineer owns package
   generators, Inspector owns guards, Auditor independently verifies the final corpus. Until that
   round closes, treat law/, product/, work/, AGENTS.md, and committed proof records as
   authoritative, and the migrated operational and adopter documentation as provisionally stale.

---

# Part 3 — law/ (audited 2026-07-23, pinned at 1a1a5ad; rev-2 evidence at the current tree)

## 3.1 Verdict

**The P1 contract was met and the successor-authored law is disciplined; the genesis-imported
substrate beneath it is still verbatim predecessor.** [rev-2] The debt is no longer silent — BL-007
(P0) names every item of the former S1–S7 set, with the law session audit in its provenance. What
the closure did not change: the substrate itself, and the fact that the green test floor does not
exercise the broken production-facing checks (§3.2b).

## 3.2 What checks out (all independently verified)

Gate honest at each pin (628/3 documented known-reds at the law audit; 812 passed / 8 skipped
since closure). All P1 contract items: 54/54 canonical schemas with validated examples,
schema_version 1.0.0, normalized $id; defs renames landed (execution_status_core/verdict_core,
`joint` token); population-registry.json truthful (11 populations; per-guard states with backlog
refs); altitude sweep sound (counts re-derive exactly: 34 invariants, 56 authority.docs entries,
32 constitution anchors; extraction table + no-extraction list partition all 42 articles).
Register: zero predecessor evidence values restated; DII numbering monotone and gapless; all eight
P1/P4 contract entries present. The successor twelve ADRs: predecessor-anchoring hygiene
essentially perfect; all six D-164/D-165 boundaries staged in ADR-003 plus must-re-earn standing;
D-168 fragments in ADR-004; ADR-007 supersedes ADR-DOCS-IA cleanly; the one constitution citation
(Articles 6–10) correct. Constitution articles internally coherent (42 ordered articles, every
cross-article reference verified; succession Article 41 present with self-perpetuation clause; no
predecessor amendment entries carried; the three claimed mechanical fixes real). Invariant
*article* anchors CLEAN — the 32-vs-42 trap does not hit law/invariants. sensor-registry.json
(59 live/5 archived, attested pin, truthful design-note backlogs) and population-registry.json
confirmed clean; law/policy holds 7 files incl. rebound subprocess-effects.json and layout-neutral
thresholds.json. All law commits role-pure Architect.

## 3.2b [rev-2] Production-facing checks fail while the floor is green — the decisive evidence

Cross-model verification ran the production commands at the current HEAD:

- `policy check adrs` — **fails**: all 12 successor ADRs rejected by the predecessor-shape
  adr.schema.json (`adr_id`/`authors`/predecessor status enum).
- `policy check glob guards` — **fails**: all three predecessor globs match zero files.
- `spec validate trace` — **fails before trace validation**: `.devai/config/domains.json` absent.
- The focused register/ADR/constitution test files pass — the normal suite does not exercise the
  broken production checks.

The 812-green Vitest floor is honest but is not evidence of operational law coherence. Inspector
acceptance for the repair (§3.4) must therefore run the production commands, not only unit tests.

## 3.3 Defects, ranked (all confirmed by cross-review; measurements updated where noted)

1. **authority-policy.json — verbatim predecessor materialization** (BL-007/W05.1): binds
   constitution **0.6.0** by digest; materialized 2026-07-22 pre-genesis; repository_id
   devai-self; of 83 rules, 58 select paths and **zero target law/, product/, work/, or
   record/** (31 rules on 28 nonexistent globs). [rev-2 nuance] It fails **closed**: the practical
   effect is bricking legitimate successor writes rather than permitting bad ones — but it cannot
   support any authority-enforcement claim, and the materialized `.devai/config` copy is
   byte-identical to the stale source. Never hand-edit the materialized copy; it must be
   machine-materialized from corrected law after ratification.
2. **Register self-contradiction**: DII-055 (L337–340) asserts "the Article-32 chain" — the
   numbering fossil the constitution's own Article-42 notes declare wrong. The §12
   register-consistency guard entry would fail on its own file and itself carries no DII id/meta
   (violates DII-007). Predecessor-numbered ADR citations DII-068/DII-060 (also pointing at
   gitignored scratch)/DII-092; DII-029 restates the predecessor 3-iteration default that
   successor Article 19 refined.
3. **adr.schema.json — unrebound predecessor schema** (BL-007): rejects all twelve successor ADRs
   wholesale; says ADRs live "under docs/meta/adr/"; three-way status-vocabulary clash
   (record-meta draft/active vs schema proposed/accepted) makes the promised minting to
   `accepted` impossible as written; the green ADR roster tests bypass this schema entirely.
   The lifecycle vocabulary is one of the two genuine policy choices requiring a new decision.
4. **Constitution blemishes**: embedded predecessor header `Version: 0.6.0 / Status: ratified for
   implementation` (L25–26) contradicting draft frontmatter; two live references to nonexistent
   `.devai/scorecard/thresholds.json` (L229 Art 18, L342 Art 30); frontmatter cites Article 40
   where Article 41 governs founding (L7); amendment-history/genesis-pointer section missing;
   all-42 crosswalk absent (self-declared unfinished at L459); Part X retitle announced not
   applied; Article 27's `.devai/worktrees/` root conflicts with the successor placement
   enumeration — the second genuine policy choice (worktree location) requiring a decision.
5. **Invariants**: [rev-2 measurements] 55 of 56 `authority.docs` paths do not exist at the
   current tree (the original 117/209 counted all path-like strings incl. decisions arrays); all
   34 claim `status: active`; INV-RBAC-001 L9 re-legislates the predecessor authority table in
   direct contradiction of Article 6 — worst single file. [rev-2 narrowed] The runtime-absence
   claim is stale post-P4: of 174 unique `measurable_via` action strings, 139 now resolve against
   the live action registry and 35 do not — "no successor runtime surface" is no longer true, but
   each invariant still needs individual revalidation before its `active` standing is honest.
   Do not flip statuses mechanically; reassess per record against live tests and runtime.
6. **Glossary**: REV-0006 fixed exactly its declared scope; the same classes recur outside it —
   GE-021 L5 (evidence chain at `.devai/state/evidence-chain.json` "per Article 32-33"), GE-004
   (Article 39 for tests-as-sensors), GE-001, GE-010, GE-023, GE-025, GE-033; ~15 entries
   Phase-anchored; authority vocabulary inconsistent (zero `owner` uses); 37 imports `active`
   pre-ratification while the 7 rider entries are honestly `draft`. Ratification review is BL-006.
7. **Remaining policy/trace**: glob-guards.json — three dead patterns with stale floors (34/54/0
   actuals); a floor must never be zeroed merely to obtain green — a missing generated population
   needs an explicit backlogged state. forbidden-actions.json — no entry protects `law/`; two
   fossil-path actions; five actions carry no detect_patterns. trace.json — dominated by
   predecessor paths (459/482 dead at audit); regenerate from the post-P5 package/test topology
   rather than hand-editing 4k lines. Schema-description predecessor semantics in five canonical
   schemas. Vendored predecessor ADR archive needs unmistakable banners (predecessor/README.md
   currently reads as live authority) and exclusion from live checks. Register housekeeping
   (stale "unnumbered" preamble; 13 truncated titles; D-190..196 span pending — documented).

## 3.4 Remediation (rev-2 — supersedes the original sketch)

**Immediate mitigations until BL-007 closes**: do not run mutation-capable DEVAI CLI operations
against this repository; treat the materialized authority policy as stale and non-authoritative;
continue explicit role/path separation per AGENTS.md; keep ratification, release, and readiness
blocked; never hand-edit `.devai/config/authority-policy.json`.

**BL-007 execution, split into verifiable role-pure batches**:
1. *Inspector red contracts*: failing checks for successor policy prefixes, ADR-schema
   compatibility, trace target existence, semantic forbidden-action coverage (incl. law/
   protection), register citations, invariant anchors, glossary lifecycle.
2. *Architect internal-law corrections*: Article-42/ADR reference fixes (DII-055, DII-060/068/092,
   §12 guard identity), constitution wrapper/path contradictions (L7, L25–26, thresholds paths),
   successor ADR schema, invariant/glossary semantics, glob/forbidden source policy, schema
   descriptions. Mint new DII entries only for the two genuine policy choices (ADR lifecycle
   vocabulary; Article 27 worktree location) — BL-007 already tracks the defects.
3. *Engineer regeneration/materialization*: regenerate trace from the post-P5 topology; update the
   policy materializer as needed; after the ratified constitution bytes exist, produce
   `.devai/config/*` byte-identically from corrected law via the authorized upgrade path.
4. *Inspector acceptance on production commands*: `policy check adrs` 12/12 valid; glob guards on
   successor paths with non-vacuous floors; trace fully resolving; forbidden actions protecting
   successor law paths with every mechanically enforceable prohibition detectable; full tier
   ladder green. Keep the coverage red and BL-017 visible throughout.
5. *Auditor follow-up*: a new-round audit record; PC-0001 and closed R-0001 reports untouched.

**Ratification sequencing** (safest dependency order): BL-001 (R-Ω + attestation rebind) →
BL-007 red contracts + draft corrections → BL-004 (crosswalk + ratification) → BL-005 (ADR
acceptance under the corrected schema) → BL-006 (glossary review) → final authority-policy
materialization against the exact ratified digest → trace regeneration + complete successor law
audit.

**Guardrails against mechanical damage**: no bulk-replacement of D-N/ADR/article numbers — map
each reference or mark it historical; preserve the predecessor ADR archive with banners, excluded
from live checks; no mechanical `active`→`draft` flips — reassess each invariant; no zero floors
for green.

---

# Part 4 — product/ (audited 2026-07-24, pinned at 3a533fd; rev-2 at the current tree)

## 4.1 Verdict

**P2 is the cleanest wave: every recorded Owner mark executed exactly, traceably, role-pure, with
precise handoffs and no invented decisions.** The tree's freshness debt predates P2 (REV-0006's
predecessor-relative certification) and is Owner-decision class. [rev-2] The process omission
(out-of-mark findings never became Owner questions) is now durably recorded here (§1.2 S9), but
still lacks an Owner disposition and a dedicated backlog item — the ledger's one uncovered row.
The product contract suite passes 8/8, but it checks structure and counts, not semantic freshness
or live action resolution.

## 4.2 Mark execution — all verified

12 journeys imported unchanged (schema-valid; every related_invariants id across all 14 resolves);
JNY-007 `status: retired` + `superseded_by: JNY-014` + provenance, JNY-014 reciprocal
`supersedes`; OM-001 historicized with the new related_invariants field and honest gap comment;
use-cases: `generatedAt` removed, all 44 action-ref occurrences mapped with `provisional: true`
on predecessor-canonical paths; sensor-comment fix correctly deferred to P4 by handoff; README
rewritten; glossary touch-ups + rider exact; P2-product-assertions.md specified the precise P5
test diffs (since applied — the suite is green). compilation.md carries REV-0006's structural
finding to W01 rather than resolving it.

## 4.3 Freshness findings (imported content, outside the marks)

1. **Predecessor state layout as live contract** (confirmed, with rev-2 narrowing): immutable
   facts homed in `.devai/state/` contrary to Article 6 L102 and the dossier placement test
   (L935): JNY-001 L60 evidence chain, L47 rtd-manifests; JNY-002 L38 sensor-readings; JNY-003
   L34 escalations; JNY-005 L15+L56 readings precondition + release records. JNY-001 L52 — the
   worst line in the tree — prescribes "Commit the `.devai/`, `docs/arch/`, AGENTS.md surfaces"
   plus the dead `examples/law-pack` scaffold as the adoption ceremony. Phase-discipline citations
   as live (JNY-006 L49, L69); bare retired ids as live conditions (JNY-002 L7 "until … satisfy
   D-126"; JNY-006 L79 D-39).
   [rev-2 — two corrections] (a) `.devai/config/project.json` (JNY-001 L61) is NOT stale: it is an
   intentional successor adopter configuration file — the current schema, bootstrap, doctor, and
   runtime consume or materialize it; its absence from *this* repo's materialized set does not
   invalidate the journey requirement. Finding withdrawn. (b) JNY-004 L23 (open RGR under
   `.devai/state/rgr/`) is narrowed: an open RGR is mutable head state and may legitimately live
   there; only its resolution/closed snapshot must generate an append-only proof. Blanket
   state→proofs replacement would be wrong; classification must be per object.
2. **JNY-014 — the designated successor governance journey — encodes the predecessor round
   model, and the defect now extends into the runtime.** The journey (L23–L45) describes a
   *gitignored* disposable workspace sealed and "moved to the durable round ledger" (tags:
   `r30`). The successor doctrine: committed intent at work/rounds/R-NNNN (amended by appendix,
   never rewritten), observation at work/audit/R-NNNN, closure evidence appended to
   record/proofs/. [rev-2] The current round-lifecycle implementation *also* violates this — it
   moves `work/rounds/R-NNNN` to `work/rounds/archive/R-NNNN` — so the product prose must NOT
   simply be rewritten to mirror the implementation; both need one Owner/Architect decision on the
   three-tree doctrine, with any unified ledger generated as a derived view. Highest-stakes item
   in the tree.
3. **Use-cases**: L529 (UC-devai-round-lifecycle) seals rounds into `docs/meta/rounds/round-NN/`;
   six Phase-N citations in step text; L240 `.devai/state/sensor-readings/` (the successor
   default is `record/proofs/sensor-readings` — verified in packages/sensors).
   [rev-2 — action-ref reconciliation against the now-146-action registry] The audit-time "14
   successor-stable / 30 provisional" split is stale: of 44 occurrences (31 unique ids), **three
   formerly-stable occurrences do not resolve** (all citing nonexistent
   `sense run inventory performance`), **24 provisional occurrences now resolve** and need
   re-review/deprovisionalization, and **six provisional occurrences (five unique predecessor
   names) remain unresolved**.
4. **[rev-2 — new defect, credit cross-review] The performance use case is materially
   non-executable** (devai-cli.json L419 area, incl. L434): it instructs running nonexistent
   `pnpm test:perf` or nonexistent `scripts/perf-bench.mjs`, references nonexistent action
   `sense run inventory performance`, expects a `perf_test` reading, and embeds 1500/3000 ms
   thresholds. The current implementation is `devai sense inventory performance`, emits kind
   `inventory_performance`, and defaults to 2000/5000 ms (verified:
   packages/sensors/src/inventory-performance.ts, DEFAULT_THRESHOLDS). Thresholds belong to
   policy/pack, never product prose.
5. **Clean**: JNY-008..013 (subject to the pre-ratification honesty review below), README.md,
   compilation.md, OM-001 (predecessor content by design, correctly attested-historical),
   stories/ and rules/ reserved-empty as declared.

## 4.4 Remediation (rev-2 — supersedes the original sketch)

1. **A dedicated Owner review under the next unused review identifier** — NOT REV-0007, which
   already identifies the compatibility-façade work (BL-025). Give the Owner a line-level
   disposition matrix with four choices per finding: successor-normative content |
   adopter-specific configuration | predecessor provenance only | unimplemented product
   requirement (→ backlog).
2. **Substantive decisions to recommend**: amend JNY-014 to the three-tree doctrine (work/rounds
   stays in place; observations to work/audit/R-NNNN; closure evidence appended to record/proofs;
   unified ledger as a derived view) — and align the round-lifecycle runtime with the same
   decision; rewrite JNY-001 around the current tier-aware bootstrap outputs (drop
   examples/law-pack and docs/arch); classify every `.devai/state` reference individually
   (mutable head stays; immutable observations and terminal records become proofs); convert
   Phase/D-number operational dependencies into current policy/invariant references with old ids
   retained only as explicit ex- provenance; reconcile every use-case action reference with the
   current registry (incl. deprovisionalizing the 24 now-resolving refs); replace the performance
   use case with the current action, sensor kind, and policy-derived thresholds; review whether
   all 13 `status: active` journeys remain honest before ratification.
3. **Backlog**: add a dedicated item — BL-044 candidate (the ledger ends at BL-043) — "Owner
   disposition and semantic rebind of imported product content". Do not retroactively modify the
   closed P6 prompt.
4. **Role-separated follow-through**: Owner-marked product corrections → Architect law/docs
   alignment → Engineer runtime and round-lifecycle rebind → Inspector semantic regression tests →
   Auditor confirmation against the final tree.
5. **Interim posture and guards**: treat the product corpus as draft, not executable adoption
   guidance, until disposition. Guards: every non-provisional action reference must resolve in the
   live registry; provisional references carry an explicit backlog/disposition and are flagged
   when they begin resolving; smoke-test commands embedded in active use cases; reject
   unclassified predecessor paths in active product records; prevent hard-coded performance claims
   where a policy/pack owns the value; verify round closure preserves the intent/observation/proof
   authority boundaries; require active/supported journeys to identify current implementation and
   verification evidence.

---

# Appendix — evidence pointers

- Gate runs: 628 passed / 3 failed at the law audit (failing files product.contract.test.ts
  glossary 37 vs 44, register.contract.test.ts 104 vs 107, roster.contract.test.ts 52 vs 54 — all
  documented known-reds, since closed); 812 passed / 8 skipped at closure and at rev-2.
- [rev-2] Production-facing check evidence (cross-model verification at current HEAD, method
  independent of this session): `policy check adrs` fails 12/12; `policy check glob guards` fails
  3/3 zero-match; `spec validate trace` aborts on absent `.devai/config/domains.json`.
- [rev-2] Re-verified for this revision directly against source: BL-039 text and provenance;
  ledger extent BL-001..BL-043; .github/workflows/{ci,round-gates}.yml; root scripts/ contents;
  `work/rounds/archive` move sites (packages/loop/src/round-lifecycle/, packages/skills
  governance); inventory-performance defaults {pass: 2000, review: 5000} and
  record/proofs/sensor-readings default; docs retired-id recount 94 distinct / 312 occurrences /
  65 files (cross-review counted 95/314 — counting-method variance, same conclusion).
- Mechanical scripts (link checker, law JSON/anchor/trace/guard checks) ran from the session
  scratchpad; counts re-derivable with equivalent one-liners.
- Session working notes (ephemeral, superseded by this record): scratch/sessions/
  docs-freshness-audit-2026-07-23.md, law-freshness-audit-2026-07-23.md,
  product-freshness-audit-2026-07-24.md. Cross-model review texts (Codex, 2026-07-24) received
  via Owner session; integrated here with each load-bearing claim re-verified where feasible.
