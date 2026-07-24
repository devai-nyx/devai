---
id: R-0001-AUDIT-FRESHNESS-01
title: Freshness audit — docs/, law/, product/ against successor framework state
type: audit-report
status: draft
date: 2026-07-24
authority: Auditor (observation only — this report recommends, never ratifies)
supersedes: null
superseded_by: null
provenance: [session audits 2026-07-23/24 following the P3, P1, P2 closure claims; docs/ audited at ab3c883-era tree, law/ pinned at 1a1a5ad, product/ pinned at 3a533fd; gate runs executed and output read; verified against law/, record/, product/, work/, packages/, REV-0006, plan.md, prompts/, handoffs/]
---

# Freshness audit — docs/, law/, product/

Scope: the three trees whose bootstrap waves (P3 docs, P1 law, P2 product) were reported closed.
Question audited: coherence, freshness, and adherence to the successor framework state — not
whether each wave met its own contract (they largely did), but whether the trees are free of
predecessor anchoring and phased-out decisions.

Method per tree: mechanical sweeps (predecessor paths, retired D-ids with ex- lookbehind, counts,
link graphs, JSON parse/validation, anchor and trace target resolution) plus full or fan-out
semantic reads, every cited claim re-verified against the repository at the pinned HEADs. Gate
(`pnpm vitest run`) executed and read during the law audit: 628 passed / 3 failed, all three
failures being the documented known-reds of `P4-law-prerequisites-known-red.md` and
`P2-product-assertions.md` — honest KNOWN-RED state, not silent breakage.

A concurrent P4 Engineer session was mutating `packages/` throughout (packages/core dissolved,
packages/cli rebuilt mid-audit). Package-facing statements name the commit they were checked at;
`law/` and `product/` were commit-stable during their audits.

---

# Part 1 — Cross-cutting synthesis

## 1.1 One root cause, three instances

Every wave faithfully executed a contract whose freshness baseline was the **predecessor**, not
the successor:

- **P3 (docs)**: the audit classification "CURRENT" certified pages current *for the predecessor*
  (its drift gates were green), and the migration contract mandated byte-faithful copies with only
  four path-rewrite classes and three one-line fixes.
- **P1 (law)**: W02 imported schemas "as-is at the pin" by design; the genesis import carried
  invariants, trace, policy instances, and adr.schema.json verbatim; P1's contract was completion
  (sweep, examples, defs, population registry), not rebinding.
- **P2 (product)**: REV-0006 certified content "CURRENT" against predecessor-relative checks
  (schema validity, commands resolving in the predecessor's manifest); the Owner marks named three
  fixes, and P2 was correctly forbidden to edit beyond them.

Consequently each closure claim is true of its contract and misleading about its tree. The rebind
work falls between waves: some of it is documented deferral (W05 sub-batches, DII-099, altitude
sweep, P4/P5 handoffs), and the remainder is **silent** — no register entry, no handoff, no
backlog line, and not on the P6 backlog prompt's mandatory sweep list.

## 1.2 Consolidated silent-deferral ledger (the actionable core)

Documented deferrals (cited where): invariant `authority.docs` anchor rebind (plan W05.2);
authority-policy re-materialization (plan W05.1); `authority`→`authority_docs` rename (DII-099);
constitution operational-value extraction (law-altitude-sweep.md); sensor design notes and
D-190..196 classification (registry backlog_refs; 06-backlog prompt); roster/register/glossary
count wirings (P4/P2 handoffs); glob-guard **floors** (W02 phrasing — partial).

**SILENT — no record anywhere; none named in prompts/06-backlog.md:**

| # | Item | Tree | Severity |
|---|---|---|---|
| S1 | trace.json rebind or regeneration (459/482 path refs dead) | law | high |
| S2 | forbidden-actions.json path refresh + missing `law/`-tree protection entry | law | high |
| S3 | adr.schema.json rebind to §5.1 record shape (+ accepted-vs-active minting vocabulary clash) | law | high — blocks `check adrs` green at W04 |
| S4 | Schema-description predecessor semantics (project-config binding shape; sensor-input-spec L493 glob; stack-adapter layout; invariant.schema VERSION claim; authority-policy.schema L917 glob) | law | medium |
| S5 | Invariant statement/decisions[]/`status: active` cleanup (beyond the documented anchor rebind) | law | medium |
| S6 | Glossary defect recurrence outside REV-0006 scope (GE-001/004/010/021/023/025/033 + README) | law | medium |
| S7 | glob-guards.json **patterns** (3 predecessor globs; itemized inventory lives only in gitignored scratch) | law | medium |
| S8 | docs/ systemic rebind (the entire Part 3 defect set — no wave or backlog row owns it) | docs | high |
| S9 | product residual staleness: journey state-layout/Phase/D-id content, JNY-014 round-model question, use-cases L529 + L434 (required Owner questions never durably recorded) | product | medium — Owner-decision class |
| S10 | docs/site deploy identity: `projectName: 'devai'` + `baseUrl: '/devai/'` (deploy would push at the READ-ONLY predecessor) and sync-docs githubBlob pinned to predecessor live `main` (44 dead links in generated output) | docs | **urgent** — standing-rule violation hazard |

Recommendation R1 (cheapest, highest process value): register S1–S10 now — one draft DII entry
each or named mandatory rows in `prompts/06-backlog.md` — so P6 cannot close over them. This is
the concrete enforcement of "every deferral becomes a backlog record — never a silent drop".

## 1.3 Cross-tree contradiction classes (worth knowing as classes)

- **The Article-32 numbering fossil.** The constitution documents it (L452, L470: evidence is
  Article 42; 32 = sensor uniformity, 33 = Auditor) — yet register DII-055 asserts "the Article-32
  chain" as doctrine, glossary GE-021 defines the evidence chain under "Article 32-33", and the
  docs trees cite Articles 32–33 for evidence pervasively (dev/security runbooks, adopters,
  theory). Law knows the truth; its own register and vocabulary contradict it; docs never heard.
- **The `.devai/state → record/proofs` blanket rewrite (docs) vs the placement test.** Mutable
  state (locks, worktrees, counters, backlog, authority sessions) was mechanically re-homed into
  the append-only proofs store across ~10 docs pages; meanwhile product journeys carry the inverse
  fossil (immutable facts still homed in `.devai/state/`). Both directions violate the same test.
- **Predecessor ADR numbering.** Register entries DII-060/068/092 and docs pages cite "ADR-003/
  005/006" in predecessor numbering; the successor set renumbered (runtime authority = ADR-001,
  promotion = ADR-003, completion evidence = ADR-004). The vendored archive under
  law/adr/predecessor/ is legitimate; live citations to it are not.
- **Retired D-nn ids.** Disciplined in successor-authored law (ex- provenance, 133 uses; only
  minor slash-list slips) — but cited as live authority across ~65 docs files (93 distinct ids),
  ~14 invariants, several glossary entries, and two journeys.
- **Round ceremony.** The successor doctrine (committed work/rounds/R-NNNN intent + work/audit
  observation + record/proofs closure) is what R-0001 itself practices — yet docs round-workflow
  B0–B4, build-plan-convention, round-break, CONVENTIONS, governed-rounds, use-cases L529, and
  JNY-014's abstract model all still teach the predecessor scratch-dossier/seal-and-move ceremony.

## 1.4 Wave-quality ranking (contract execution, not tree freshness)

1. **P2 (product)** — every mark executed exactly and traceably; precise handoffs; no invented
   decisions; one gap (Owner questions not durably recorded).
2. **P1 (law)** — contract items all verified; known-red discipline followed role-pure;
   high-quality altitude sweep; gaps are the silent items S1–S7 and three internal contradictions.
3. **P3 (docs)** — its stated acceptance criteria all pass (links, provenance, manifest bijection,
   canon consolidation), but the criteria themselves could not produce a fresh tree, and the
   executor's manifest is the only closure evidence.

Process note: until this record, `work/audit/R-0001/` contained only `.gitkeep` — all three
closure claims were executor self-reports with no independent observation.

---

# Part 2 — docs/ (audited 2026-07-23, tree of commit ab3c883)

## 2.1 Verdict

**Structurally closed, semantically open.** All P3 acceptance criteria verified: 718 relative
links / 0 broken; provenance footers complete (the only 7 files without one are the declared
fresh/stub pages); manifest↔disk bijection exact (211 rows); zero HISTORICAL leakage; DUPLICATE
clusters properly reduced to pointers; the 3 STALE one-line fixes applied; role-pure Architect
commit; no versioned snapshots or build output committed under docs/site. The corpus nevertheless
remains the predecessor's manual wearing successor paths.

## 2.2 Defect classes (with representative citations; the full per-file inventory is in the
session transcripts and re-derivable mechanically)

1. **Retired D-nn ids as the live citation spine** — 93 distinct ids across ~65 files;
   docs/theory/devai-theory.md alone carries 117 occurrences and codifies the practice (L14
   instructs citing `D-N`; Appendix D L738 is a live D-id index; L88 claims a "D-1 onward, 165+
   entry" register — the actual register is DII-numbered). Several pages teach minting "a
   successor D-entry" as the amendment procedure (reference/cli-grammar.md L73,
   theory/architecture/id-scheme.md L49, invariant-taxonomy.md L58/L80–90).
2. **Predecessor named ADRs as live law** — 21 body references (ADR-DOCS-IA, ADR-CI-ECONOMY,
   ADR-MUTATION-SCENARIOS, …); some link texts name nonexistent law/adr files;
   dev/security/authority-enforcement.md L3 cites "ADR-003" in predecessor numbering.
3. **Fossilized article numbering + ratification overclaims** — evidence cited to "Articles
   32–33" across dev/security, adopters (ci-economy L66, common-pitfalls L73, lightweight-ci L6),
   theory; tests-as-sensors to Article 39 (successor 29), weakening to 39 (successor 30), RGR to
   19 (successor 22), cost to 30, security-change to 14. devai-theory.md presents the constitution
   as "ratified … v0.7.0" with a six-amendment history (L106, L157, L643, L736); docs/index.md
   brands the site "DEVAI 1.0.0"; skill-roadmap.md and versioning-policy.md claim predecessor
   run/publication history as this repo's standing.
4. **Phased-out ceremony as current process** — adopters/build-plan-convention.md (whole page,
   incl. the self-contradictory "work/rounds/R-0001/plan.md at the repo root" rewrite artifact),
   round-break.md, CONVENTIONS.md L109–131, governed-rounds.md, dev/process.md, and the entire
   dev/round-workflow/B0–B4 library (teaches the predecessor scratch-session wave ceremony; never
   names work/rounds/R-NNNN + work/audit + record/proofs). Predecessor "four gates" CI, coverage
   floors, and `test:*` scripts presented as the current gate (floor is `pnpm vitest run`; no
   .github/workflows exists).
5. **Semantically wrong mechanical rewrites** — the `.devai/state → record/proofs` blanket
   substitution files mutable state in the append-only proofs store and describes `record/proofs/`
   as "gitignored, regenerated": adopters/state-layout.md (L1–62), reference/contracts/
   state-extensions.md (L9–31, L81), dev/operations/lock-runbook.md L3/L28, worktree-runbook.md
   L3/L30, operations/README.md L14, security/authority-enforcement.md L55 (revocable authority
   sessions as proofs), adopters/decisions-ledger.md (in-place status flips under proofs),
   adoption.md L57/L226/L364. Collaterals: link text naming `../meta/...` while hrefs were
   rebased (roles/README L23/35, engineer L135, skills/README L33/36); sensors/docs_drift.md L12
   specifies a D-heading check against the DII register that can never bind; transversals.md L30
   vs aspect-grid.md L14 contradict each other about a nonexistent generator.
6. **Frozen predecessor as "live home"** — ≥10 schemas absent from the successor roster (lock,
   worktree, backlog, decisions, thresholds, mutation-scenario, evidence-chain,
   cross-repo-inventory, test-result, scaffold-evidence — most deliberately archived under
   law/schemas/predecessor-archive/), all 28 theory figures (no local diagrams/svg or render
   pipeline; prompts/README documents a nonexistent toolchain; fig-08..20 numbering off-by-one),
   CI workflows (`uses: devai-nyx/devai/...@main`), templates, WORKTREE_CAP source, predecessor
   CLAUDE.md as authority.
7. **Repo-contradicting facts** — nonexistent examples/ tree (reference/examples.md catalogs it
   wholesale), root scripts/ (reference/scripts.md's tables), root CONTRIBUTING/SECURITY,
   .devai/config/{project,domains,llm-limits,scorecard-na,prompt-overlays,orphan-allowlist}.json,
   record/proofs/{sensor-readings,releases,agent-runs,rtd-manifests,locks,llm-usage.jsonl},
   docs/_ia/categories.json; wrong counts and enums (sensor registry "58/60–64" vs 59 live;
   register size; schema-count narratives vs 54 canonical; invariant severity "must/should" vs the
   5-tier enum; SensorReading status enum missing 3 values; fig-07's obsolete transversal
   taxonomy; worktree cap 3-per-D-52 vs 6-per-D-11 across two adopter pages); sensor-registry.md
   lists five archived kinds as live.
8. **Law restated in docs, divergently** — all seven role pages + adopters/user-guide.md L48–55 +
   adopters/prompt-header.md L43–49 + theory/architecture/prompt-firewall.md L42–59 reproduce
   Article 6/7/8 authority tables; the restatements are wrong where it matters (Auditor's writable
   path given as scratch/…, not work/audit/; authority-enforcement.md's table omits law/ entirely
   and gives F2 as apps/libs); framework/loop.md L77–83 and framework/test-policy.md L97 reproduce
   article text verbatim.
9. **docs/site** — IA plumbing genuinely retargeted (sync map, sidebars, navbar), but
   sync-docs.mjs L10 rewrites cross-repo links to the predecessor's **live main** (44 dead links
   in generated output) and docusaurus.config.ts L9/L11 still carries `baseUrl: '/devai/'`,
   `projectName: 'devai'` — `npm run deploy` would push gh-pages at the read-only predecessor
   (ledger item S10, urgent).

Cleanest ground: reference/law.md, product.md, glossary.md, cli.md, the generated-index stubs,
predecessor-governance-roadmap.md (properly bannered), the five skills/round-* pointers,
dev/round-ledger.md, adopters/role-declaration.md, start/what-is-devai.md, ~20 sensor/figure pages.
Worst trees in order: reference/contracts/ + skills/; adopters/ (31 of 33 files with findings);
dev/ operations+security; theory/.

## 2.3 Remediation shape (recommendation)

(1) S10 site identity first; (2) placement-test correction of the state-semantics pages;
(3) law relink (D-ids → DII/article/ADR or ex- historicization; article-number sweep; de-restate
authority tables); (4) rewrite-or-reclassify the ceremony cluster (B0–B4, build-plan-convention,
round-break, CONVENTIONS §rounds, governed-rounds — closer to HISTORICAL than CURRENT as
imported); (5) existence sweep of every path/schema/script/count claim, frozen-blob links reduced
to explicitly historical citations with counts routed to guard pointers; (6) strip
"1.0.0"/"ratified" branding until the ratification round.

---

# Part 3 — law/ (audited 2026-07-23, pinned at 1a1a5ad)

## 3.1 Verdict

**The P1 contract was met and the successor-authored law is disciplined; the genesis-imported
substrate beneath it is still verbatim predecessor.** About half the debt carries documented
deferrals (the decisive difference from docs/); the six-plus silent items are ledger rows S1–S7.

## 3.2 What checks out (all independently verified)

Gate honest (628/3, all reds documented known-reds; P1's earlier known-red closed role-pure by
Engineer 9f9f5a2 with Architect re-verification). All P1 contract items: 54/54 canonical schemas
with validated examples, schema_version 1.0.0, normalized $id; defs renames landed
(execution_status_core/verdict_core, `joint` token; old names absent); population-registry.json
truthful (11 populations; per-guard implemented/declared/backlogged states with backlog refs);
altitude sweep sound (counts re-derive exactly: 34 invariants, 56 authority.docs, 32 constitution
anchors; its extraction table + no-extraction list partition all 42 articles). Register: zero
predecessor evidence values restated; DII numbering monotone and gapless 1→104; all eight P1/P4
contract entries present (DII-098..104, DII-100). The successor twelve ADRs: predecessor-anchoring
hygiene essentially perfect; all six D-164/D-165 boundaries staged in ADR-003 plus must-re-earn
standing; D-168 fragments in ADR-004; ADR-007 supersedes ADR-DOCS-IA cleanly; every cited path
exists; the one constitution citation (Articles 6–10) correct. Constitution articles internally
coherent (42 ordered articles, every cross-article reference verified; succession Article 41
present with the self-perpetuation clause; no predecessor amendment entries carried; the three
claimed mechanical fixes real). Invariant article anchors CLEAN — the 32-vs-42 trap does not hit
law/invariants (W05.2 is smaller than feared). sensor-registry.json (59 live/5 archived, attested
pin, truthful design-note backlogs) and population-registry.json confirmed clean; law/policy also
holds subprocess-effects.json (appears rebound) and thresholds.json (layout-neutral) — 7 files,
not the 5 earlier drafts assumed. All law commits role-pure Architect.

## 3.3 Defects, ranked

1. **authority-policy.json — verbatim predecessor materialization** (documented W05.1 deferral;
   most consequential stale artifact): binds constitution **0.6.0** by digest; materialized
   2026-07-22 pre-genesis; repository_id devai-self; of 83 rules, 31 select on 28 globs that do
   not exist here and **zero rules reference law/, product/, work/, or record/** — under
   INV-AUTH-002's deny-unknown doctrine it would deny every legitimate successor write. Article
   anchors ([6,7,8,9,10]) and role-subjects already successor-correct; only selectors are dead.
2. **Register self-contradiction**: DII-055 (L338–340) asserts "the Article-32 chain is the sole
   durable authority" — the numbering fossil the constitution's Article-42 notes (L452, L470)
   declare wrong. The §12 register-consistency guard entry (L641–643) exists to catch exactly this
   and would fail on its own file — and itself carries no DII id/meta line (violates DII-007).
   Plus predecessor-numbered ADR citations DII-068 (L406), DII-060 (L364, also pointing at
   gitignored scratch/review/adrs.md), DII-092 (L532); DII-029 (L199–201) restates the predecessor
   3-iteration default that successor Article 19 refined.
3. **adr.schema.json — unrebound predecessor schema** (SILENT, S3): requires the predecessor
   front-matter shape (adr_id/authors; status enum with `accepted`; additionalProperties: false),
   says ADRs live "under docs/meta/adr/", cites D-38 — rejects all twelve successor ADRs
   wholesale; three-way status-vocabulary clash makes the promised minting to `accepted`
   impossible under record-meta. `check adrs` cannot go green at W04 as written.
4. **Constitution blemishes**: embedded predecessor header `Version: 0.6.0 / Status: ratified for
   implementation` (L25–26) contradicting draft frontmatter — the strongest overclaim in law/;
   two live references to nonexistent `.devai/scorecard/thresholds.json` (L229 Article 18, L342
   Article 30 — actual home law/policy/thresholds.json → .devai/config); frontmatter cites
   Article 40 where Article 41 governs founding (L7); amendment-history/genesis-pointer section
   missing; the all-42 crosswalk absent repo-wide (self-declared unfinished at L459 — documented);
   Part X retitle announced not applied (L411 vs L423); Article 27's `.devai/worktrees/` root
   unlisted in the layout enumeration and Article 6's table.
5. **Invariants — semantic layer**: 117/209 path anchors dead (documented W05.2); undocumented
   remainder (S5): all 34 assert `status: active` (+10 lifecycle: supported) with verification
   rationales claiming a "registered test corpus" no successor surface backs and ~55 CLI verbs
   with no runtime; ~14 files carry retired D-nn/predecessor-ADR ids as live in
   authority.decisions[]/prose (INV-DEVAI-015 has a docs/meta path inside a decisions id array);
   **INV-RBAC-001 L9 re-legislates the predecessor authority table** (root CONSTITUTION.md/
   BUILD-PLAN.md Architect, docs/product Owner, **/test/** Inspector) in direct contradiction of
   Article 6 — worst single file in the tree.
6. **Glossary**: REV-0006 fixed exactly its declared scope (GE-016/006/020/022 + rider clean);
   same classes recur outside it (S6): GE-021 defines the evidence chain at
   `.devai/state/evidence-chain.json` "per Article 32-33" (dead path AND the fossil); GE-004
   "Tests are sensors per D-1 … (Article 39)" (successor 29/30); GE-001 docs/product + bare D-7;
   GE-010/025/033 immutable facts homed in .devai/state; GE-023 docs/arch tombstones unmarked;
   ~15 entries Phase-anchored; README L17 Phase-2/3 tooling present-tense, L26–27 bare D-3/D-2.
   Contract-discipline: authority vocabulary inconsistent (zero `owner` uses; joint/architect
   split contradicts its own README); all 37 imports `status: active` pre-ratification while the
   rider is honestly `draft`.
7. **Remaining policy/trace**: glob-guards.json — all 3 guards on predecessor globs with stale
   floors 23/52/16 vs 34/54/0 (S7; the ported checker would evaluate dead globs);
   forbidden-actions.json — FORBID-DELETE-AUTHORITY-DOCS protects docs/arch|contracts|ops|security
   (none exist) while **no entry protects law/**; FORBID-MUTATE-INVARIANTS watches
   docs/framework/arch/invariants/* and routes to a DESIGN-DECISIONS entry; 5/16 actions carry no
   detect_patterns (S2); trace.json — 459/482 path refs dead, wholly silent (S1);
   schema-description predecessor semantics in five canonical schemas (S4); vendored predecessor
   ADR archive bannered only by 4-line SEEDS.md while predecessor/README.md reads as live
   authority; register housekeeping (stale "entries are unnumbered" preamble L15–18; 13 truncated
   titles; DII-1 unpadded; D-190..196 tombstone span pending — documented).

## 3.4 Remediation shape (recommendation)

(1) Ledger items S1–S7 registered before P6; (2) the no-external-work fixes: DII-055 → Article 42;
§12 guard entry id/meta; DII-060/068/092 renumbering; constitution L7 40→41 and L25–26 header
removal; (3) fold into W05: authority-policy re-materialization (blocked on the CLI upgrade verb),
invariant anchors, glob-guards, forbidden-actions (+ add law/ protection), adr.schema.json → §5.1
shape with the minting vocabulary settled before W04; (4) trace: decide rebind-vs-regenerate
(459/482 dead argues regenerate from successor sources post-P4/P5) and record the decision;
(5) constitution: author the amendment-history/genesis-pointer section and the crosswalk; fix the
two thresholds-path references; (6) glossary: extend the REV-0006 pattern to the recurrence set
and normalize the authority vocabulary.

---

# Part 4 — product/ (audited 2026-07-24, pinned at 3a533fd)

## 4.1 Verdict

**P2 is the cleanest wave: every recorded Owner mark executed exactly, traceably, role-pure, with
precise handoffs and no invented decisions.** The tree's freshness debt predates P2 (REV-0006's
predecessor-relative certification) and is Owner-decision class; its one process gap is that the
out-of-mark staleness P2's prompt required as Owner questions was never durably recorded (S9).

## 4.2 Mark execution — all verified

12 journeys imported unchanged (schema-valid; every related_invariants id across all 14 resolves);
JNY-007 `status: retired` + `superseded_by: JNY-014` + provenance, JNY-014 reciprocal
`supersedes`; OM-001 historicized (status superseded, successor_note, provenance per the mark, new
related_invariants field with honest gap comment); use-cases: `generatedAt` removed, all 44 action
refs mapped — 14 successor-stable, 30 `provisional: true` pending P4 (concentrated where expected:
introspect 9/9, loop 4/4, round-lifecycle 5/6); sensor-comment fix correctly deferred to P4 by
handoff; README rewritten; glossary touch-ups + rider exact; P5 assertion handoff
(P2-product-assertions.md) specifies the precise test diffs, and the suite's only product red is
that documented glossary count. compilation.md carries REV-0006's structural finding to W01
rather than resolving it.

## 4.3 Freshness findings (imported content, outside the marks)

1. **Predecessor state layout as live contract in 6 of 13 active journeys** (immutable facts homed
   in .devai/state, contra the placement test): JNY-001 L60 evidence chain at
   `.devai/state/evidence-chain.json` (successor: record/proofs/chain.json), L47 rtd-manifests,
   L61 `.devai/config/project.json` (not in the materialized set), and L52 — the worst line in the
   tree — "Commit the `.devai/`, `docs/arch/`, AGENTS.md surfaces" as the adoption ceremony;
   JNY-002 L38 sensor-readings; JNY-003 L34 escalations; JNY-004 L23 RGR records; JNY-005 L15+L56
   sensor-readings precondition + release records. (JNY-002's backlog.jsonl and tasks/ are
   legitimately mutable state — not defects.) Phase-discipline citations as live: JNY-006 L49
   (Phase 10.D), L69 (Phase 10.B); bare retired ids as live conditions: JNY-002 L7 ("until …
   evidence satisfy D-126"), JNY-006 L79 (D-39).
2. **JNY-014 — the designated successor governance journey — encodes the predecessor round
   model.** No dead paths, but its shape is R30's ceremony: a *gitignored* "disposable local round
   workspace" (L27) sealed and "moved to the durable round ledger" (L45); tags include `r30`
   (L89). The successor doctrine has no move-and-seal: committed intent at work/rounds/R-NNNN,
   observation at work/audit/, closure at record/proofs — the process R-0001 itself practices.
   The journey that superseded JNY-007 "because rounds are the successor process" describes a
   round process the successor does not use. Highest-value Owner question in the tree.
3. **Use-cases**: L529 (UC-devai-round-lifecycle) seals rounds into `docs/meta/rounds/round-NN/`
   — the phased-out archive path inside the round-governance use case; six Phase-N citations in
   step text (L17, L251, L262, L292, L363, L434); L240 `.devai/state/sensor-readings/`; L434
   embeds hand-maintained perf-baseline numbers — the disease REV-0006 flagged for `generatedAt`,
   unflagged here.
4. **Clean**: JNY-008..013, README.md, compilation.md, OM-001 (predecessor content by design,
   correctly attested-historical), stories/ and rules/ reserved-empty as declared.

## 4.4 Remediation shape (recommendation)

(1) Route §4.3 to the Owner as a follow-up review (REV-0007-candidate) — product/ is Owner
authority; these are content decisions: placement-test rewording, Phase/D-id scrubbing or
ex- marking, JNY-001's adoption ceremony, the L434 numbers; (2) an explicit JNY-014 disposition
(amend to the three-tree doctrine, or record the abstract wording as deemed compatible with `r30`
as provenance); (3) fix use-cases L529 with the same provisional-marker discipline already used
for action refs; (4) ledger item S9 as a named P6 row.

---

# Appendix — evidence pointers

- Gate run (law audit): `pnpm vitest run` → 628 passed / 3 failed; failing files
  product.contract.test.ts (glossary 37 vs 44), register.contract.test.ts (104 vs 107),
  roster.contract.test.ts (52 vs 54) — all documented in P4-law-prerequisites-known-red.md and
  P2-product-assertions.md.
- Gate re-run at commit time (2026-07-24, pre-commit verification of this record): 89 files,
  812 passed / 8 skipped, 0 failed — the three known-reds were closed by the concurrent P4/P5
  wiring between the law audit and this commit. This does not alter any finding above; the
  freshness findings are content, not test, defects.
- Mechanical scripts (link checker, law JSON/anchor/trace/guard checks) ran from the session
  scratchpad; all counts cited above were produced by them and are re-derivable with equivalent
  one-liners.
- Session working notes (ephemeral, superseded by this record): scratch/sessions/
  docs-freshness-audit-2026-07-23.md, law-freshness-audit-2026-07-23.md,
  product-freshness-audit-2026-07-24.md.
