---
id: R-0001-AS-BUILT
title: R-0001 as-built audit
type: audit-report
status: draft
date: 2026-07-24
authority: Auditor
supersedes: null
superseded_by: null
provenance: R-0001/P8a; Appendix A; committed and inherited phase evidence through P7
---

# R-0001 as-built audit

This is the independent P8a observation before the P8 closure ceremony. It finalizes
planned-versus-actual execution through P7, recommends dispositions, and ratifies
nothing. P8b has not executed at this observation boundary: no PC-0001 closure record,
proof epoch, dossier status update, or closing commit is claimed here.

## Claims boundary

R-0001 **did** execute the bootstrap implementation through P7: it created the
successor genesis, authored and guarded governed populations, transposed the selected
documentation and runtime, materialized the six executable test tiers, compiled the
draft backlog, and installed fail-closed CI wiring. The tier suite floor is green, and
the successor is bound provisionally to a re-read predecessor snapshot.

R-0001 **did not** ratify the Constitution, ADRs, glossary, attestation, or any backlog
proposal. It made no release and establishes no readiness. The predecessor remains
unfrozen and read-only to this bootstrap; its terminal R-Ω ceremony has not run. The
genesis attestation remains draft, with `ratified: null` and `frozen: false`. The
coverage threshold remains red. No predecessor standing, release standing, autonomy,
task-completion claim, or product-candidate claim transfers to the successor.

## Planned versus actual, P0–P7

### P0 — Genesis re-init and provisional binding

Planned: create an orphan genesis, bind re-read provisional predecessor values, quote
the granted Owner authorization, and pass the one-commit/27-test gate.

Actual: Architect commit
`14439b05c1b9d1390db10be5d32fbc7281978b46` is the sole root. The attestation binds
predecessor commit `d76cd12d2241a1a28a32a0fe629c6531da7fe74d`, tree
`386cbb500a795f17624442ebb2c416ed5f16b15d`, and evidence-chain SHA-256
`8ae98775e373617f814e2e7bd3d2616f7664a90f761442b45d5b205537984fb1`.
The initial 27 tests passed.

Delta/disposition: provisionality was intentional, not closure. R-Ω, D-189..D-196
manifest supplementation and coupling review, pending changeset disposition, host
rename/freeze/archive actions, and successor re-bind remain BL-001..BL-003.

### P1 — Law completion

Planned: perform the law sweep, complete schema examples and shared definitions,
declare the population registry, and report rather than invent judgment-dependent
changes.

Actual: Architect commits
`faf7a4ea08dce848e683776dffa30ded5aa8de32` and
`c94060eeee11bfe898b41f343b324d2bb9e36817`, with role-separated Engineer commit
`9f9f5a2134cd3823015ede8e4b097829c07ed932`, completed the phase-time 52-schema
corpus and closed its roster dependency. Later P4 inputs
`2c69779948f718c53c6dcca95cd042063b793655` and
`7c3d34b2455d7086ce02202fe4f5f225b62e09a3` brought the current corpus to 54
schemas and added the sensor/error and CLI-tier law.

Delta/disposition: scoped stale paths and counts, the 56-versus-55 anchor description,
and 62 predicate-fragment false positives were corrected. Broader successor law
freshness, complete population guards, shared vocabulary generation, the full schema
canon linter, founding ratification, ADR acceptance, `authority_docs` migration, and
policy-altitude extraction remain BL-004..BL-009 and BL-033..BL-034. The initial
Node/ESLint workspace defects were later closed under BL-042's N/A disposition.

### P2 — Recorded Owner marks

Planned: apply REV-0006 exactly, create no new Owner decision, and hand test/code
changes to the owning roles.

Actual: Architect commits
`7b2816a3bc31cfadda99bf30985521b4ea1221da` and
`a77f9d2dbdfebc3fd44bcde8181fc8b049e22417` preserve 14 journey records with 13
active, retire JNY-007 in favor of JNY-014, map 12 use cases, supersede OM-001,
remove a hand-maintained use-case timestamp, and establish 44 glossary records. The
phase reported no Owner question.

Delta/disposition: the seven successor glossary entries remain draft under BL-006.
P4/P5 completed the product-test and sensor-comment handoffs; BL-041 records them N/A.
Their committed `active` metadata is stale historical lifecycle metadata, not evidence
that the substantive handoffs remain open.

### P3 — Documentation migration

Planned: transpose the current predecessor publication corpus into the successor
cluster canon while deferring generated and post-ratification surfaces.

Actual: Architect commit
`ab3c88327312d7ec0caae1394bf7000fc9cb8244` migrated the selected corpus and passed
the reported strict site build and link checks. The committed audit roster records
164 CURRENT, 5 STALE, 12 DUPLICATE, 11 HISTORICAL, and 8 machinery entries, plus
four final-pin additions and one removal. Historical/versioned predecessor pages were
excluded rather than presented as successor standing.

Delta/disposition: generated CLI pages, decision/changelog/round/scorecard/test
projections, post-R-Ω History, semantic rebind of structurally migrated live pages,
successor hosting rebind, and first 1.0.0 snapshots remain BL-019, BL-021, BL-032,
and BL-039. Structural migration is not semantic successor freshness.

### P4 — Packages and runtime rebind

Planned: split the predecessor core by responsibility, bind authority/evidence/schema/
sensor contracts, collapse sensor wrappers when safe, rebuild the CLI, and integrate
the workspace.

Actual: Architect prerequisite commits
`2c69779948f718c53c6dcca95cd042063b793655` and
`7c3d34b2455d7086ce02202fe4f5f225b62e09a3`, plus Engineer commits
`040d97edd640a4c023796dad61518cfef27e2aa8`,
`1aea28704a5d45c608d943928dd75edb84172a12`,
`83e127381ab150e1ff966d8bc63f880712b6b21d`,
`bcfcb6ba046c8e96748db6d5fdaa5a7d8d587628`,
`3435dc68070aadb3c6496a827add715baf5607d7`,
`caf3d30f3841b40be3b29c3e7d19b4ec1b1e7a14`,
`91947d41edab2d279452319d85686f0a5658b9be`,
`ee6a885dc9f18dd5fc545eb9d37f0b442aa374c6`,
`1a1a5ad4c482e4c1d6002964533b10a7a33399eb`,
`3a533fd6a6473ade05b49299759c6450335311fd`, and
`4161554d9ad0b61067a6093d897d01f908293aa8` produced 75,128 reported lines of
ported runtime, with 628 retained tests passing at handoff. The empty core package was
dissolved; 59 live sensor kinds route through one parameterized command; the guarded
CLI has 146 actions (34 porcelain, 112 plumbing).

Delta/disposition: the sensor-wrapper fallback was not needed (BL-040 N/A). Proof
epochs, SWEEP scheduling, reachability/freshness/domains policy, overlay and
effect-catalog reconciliation, action identity/output contracts, Auditor schema roles,
first-parent authorization, adopter/core compatibility, sensor notes, surface review,
and bounded build/test porcelain remain BL-010..BL-016 and BL-022..BL-031.

### P5 — Tiered verification

Planned: materialize T1–T6, apply role-pure handoffs, add population/authority/evidence
guards, wire merged T1+T3 coverage, and preserve every known red.

Actual: Inspector commits
`16c5152166920fe6917f56bc50d2494a835d5064` and
`5df51c62a07ed81c19c33126dea2afa156392832` established T1 590 pass; T2 140 pass,
1 skip; T3 50 pass, 7 DB-gated skips; T4 4 pass; T5 25 pass; and T6 3 pass. The
combined floor is **812 passed / 8 skipped**. The one T2 skip is the intentionally
absent pre-ratification release workflow; the seven T3 skips are DB tests that P7's
GitHub job provisions and enables.

Delta/disposition: all 11 entries in `tests/KNOWN-RED-P5.md` remain explicit and map
to BL-010, BL-012..BL-019, and BL-027 as detailed below. P7 added the declared
`@vitest/coverage-v8` 4.1.10 provider, closing only the dependency half of KR-011.
Coverage itself remains red: **29.2% lines vs 70%; 26.81% branches vs 60%;
31.09% functions vs 70%; 28.22% statements vs 70%**. The governing pointer is
P5-KR-011 → **BL-017**.

### P6 — Backlog compilation

Planned: sweep every open/deferred/known-red item into draft proposals and seed this
as-built report without editing source.

Actual: Auditor commit
`bdd0859ce6cda6e2160c03bf7a71293fa14904bb` created 43 gapless records:
39 active proposals (P0 23, P1 5, P2 11) and four explicit N/A dispositions. The
phase floor and parser checks were reported green.

Delta/disposition: P6 accurately seeded P0–P5. P8a updates P6/P7 actuals and records
the one strict reconciliation gap found in the inherited P7 report.

### P7 — CI

Planned: implement stage 1 static, stage 2 fast, stage 3 merged coverage, round gates,
a fail-closed local-evidence skeleton, changeset classification, and porcelain routing
where supported. Acceptance also said the local stage-1..3 runner must pass end to end.

Actual: Engineer commit
`620b9dad3e247ad8ab64277b9411e523e5ed8c77` added two no-path-filter workflows,
T4/T5/T6 round gates, a local stage runner, evidence-mode refusal, workflow and
changeset checks, and the version-matched coverage provider. Workflow parse/action
checks, formatting, changeset classification, stage 1, stage 2, and T4–T6 were
reported green. Lint/typecheck use DEVAI porcelain; build, root test, tier, and
coverage scripts stay direct under BL-031. Direct preparation, workflow parsing, and
changeset classification are factual P7 N/A cases because no applicable CLI verb
exists; P7 did not claim that verb work as deferred.

Delta/finding: the acceptance sentence requiring `ci:local` to pass end to end
contradicts the unweakened coverage contract. Stage 3 correctly runs and exits 1 at
the exact coverage values above; making it green without closing BL-017 would launder
red evidence. Truthy `EVIDENCE_MODE` correctly exits 2 under BL-022/BL-038. The absent
release workflow remains the sole T2 skip under BL-020. Local DB skips are not a CI
deferral because the GitHub job provisions PostgreSQL and sets `DEVAI_DB_TESTS=1`.
The coverage command's explicit gitignored `scratch/coverage/t1-t3` destination
factually overrides the config's root default.

### P8 — Close

Not executed at this report boundary. This P8a report recommends that P8b preserve all
findings and red evidence when deciding whether and how to create closure records.

## Governed-population snapshot

| Population        | As-built count and boundary                                     |
| ----------------- | --------------------------------------------------------------- |
| Canonical schemas | 54 rostered and exampled; broader canon work remains BL-008/009 |
| Decision register | 107 parsed DII entries; lifecycle/freshness work remains BL-007 |
| Invariants        | 34; coordinated anchor rename remains BL-033                    |
| Journeys          | 14 physical, 13 active                                          |
| Use cases         | 12 mapped                                                       |
| Glossary          | 44 records; seven successor entries remain draft under BL-006   |
| ADRs              | 12 successor stubs, all draft pending BL-005                    |
| Sensors           | 59 live, 5 archived compatibility-only kinds                    |
| CLI actions       | 146 guarded actions: 34 porcelain, 112 plumbing                 |
| Skills            | 55 manifests in the guarded list                                |

These are population and guard observations, not ratification, release, or readiness
claims. BL-007 records the remaining totality and freshness work.

## Full deferral and known-red reconciliation

The backlog was mechanically parsed as 43 unique, gapless records
(`BL-001`..`BL-043`), each with draft metadata, priority, suggested round, and
acceptance text. The following is the one-to-one phase/report reconciliation.

| Record | Source item and audited disposition                                                           |
| ------ | --------------------------------------------------------------------------------------------- |
| BL-001 | P0/R-Ω close, manifest supplement, coupling recheck, and attestation re-bind — active         |
| BL-002 | P0/D-terminal pending R30 changeset disposition — active                                      |
| BL-003 | P0 Ω.E rename, site freeze, redirects, and archive flag — active                              |
| BL-004 | P1 Constitution 1.0.0 founding ratification and 42-article crosswalk — active                 |
| BL-005 | P1 ADR-001..ADR-012 authoring/accept-or-supersede — active                                    |
| BL-006 | P2 seven successor glossary entries and joint ratification — active                           |
| BL-007 | P1 population guards and law/freshness rebind — active                                        |
| BL-008 | P1/P4 registry-derived enums and shared-vocabulary rewiring — active                          |
| BL-009 | P1 full `check schemas` canon linter — active                                                 |
| BL-010 | P4/P5-KR-002 proof-epoch writer and line chaining — active                                    |
| BL-011 | P4 scorecard SWEEP scheduling and persisted readings — active                                 |
| BL-012 | P4/P5-KR-001 F1:T1 reachability orphan — active                                               |
| BL-013 | P4/P5-KR-003 Architect-owned stale-reading threshold — active                                 |
| BL-014 | P4/P5-KR-004 and KR-007 domains policy/materialization — active                               |
| BL-015 | P4/P5-KR-005 prompt-overlay decision and 27 findings — active                                 |
| BL-016 | P4/P5-KR-008 effect extractor's 39 stale actions — active                                     |
| BL-017 | P5-KR-011/P7 merged coverage; provider done, thresholds still red — active                    |
| BL-018 | P4/P5-KR-010 post-merge Auditor worktree cleanliness — active                                 |
| BL-019 | P3/P5-KR-006 18 generated CLI reference pages — active                                        |
| BL-020 | P7 post-ratification release lane, provenance, and current release-test skip — active         |
| BL-021 | P3 post-R-Ω History finalization — active                                                     |
| BL-022 | P4/P7 successor first-parent evidence authorization — active                                  |
| BL-023 | P4 Auditor role in mutation/translation schemas — active                                      |
| BL-024 | P4 adopter migration and stynx proof — active                                                 |
| BL-025 | P4 core-façade decision; also covers P7's stale `@devai-nyx/core` fixed-group member — active |
| BL-026 | P4 full per-action success/error output contracts — active                                    |
| BL-027 | P4/P5-KR-009 leaf-help routing — active                                                       |
| BL-028 | P4 action IDs registry-derived end to end — active                                            |
| BL-029 | P4 sensor design notes and diagnostic dispositions — active                                   |
| BL-030 | P4 146-action surface disposition against the approximate target — active                     |
| BL-031 | P4/P7 bounded build/test porcelain and direct-script gap — active                             |
| BL-032 | P3 semantic docs rebind and generated projections — active                                    |
| BL-033 | P1 invariant `authority` to `authority_docs` coordinated migration — active                   |
| BL-034 | P1 constitutional policy-altitude extractions — active                                        |
| BL-035 | Review/dossier mutation-strength and evidence-aggregation decisions — active                  |
| BL-036 | Review/dossier deterministic semantic-review PASS decision — active                           |
| BL-037 | Review/dossier scorecard-skill unification re-evaluation — active                             |
| BL-038 | P7/dossier actions-evidence promotion must re-earn from zero — active                         |
| BL-039 | P3 successor site binding and first versioned 1.0.0 snapshot — active                         |
| BL-040 | P4 sense-wrapper fallback — N/A because collapse shipped                                      |
| BL-041 | P2 product-test and sensor-comment handoffs — N/A because P4/P5 completed them                |
| BL-042 | P1 Node typings/ESLint baseline defects — N/A because P4/P7 gates closed them                 |
| BL-043 | P1/P4 schema roster, examples, and package-test handoffs — N/A because P5 closed them         |

P5's exact one-to-one known-red map is:
KR-001→BL-012; KR-002→BL-010; KR-003→BL-013;
KR-004/KR-007→BL-014; KR-005→BL-015; KR-006→BL-019;
KR-008→BL-016; KR-009→BL-027; KR-010→BL-018; KR-011→BL-017.

### Reconciliation finding

P7 reported the reusable local-evidence manifest/evidence-gate flow as deferred, but
no backlog record names that deliverable exactly. BL-022 covers successor
first-parent authorization and BL-038 covers later promotion; neither specifies the
manifest/evidence-gate implementation. Under P8's strict rule, this is an unmatched
report deferral, not silently absorbed scope. The Auditor recommends adding a
dedicated draft backlog proposal before R-0002 planning. This report does not amend
the Auditor-owned backlog because P8a's authorized path is only this report.

## Defects and guard graduation

| Defect or red observation                                       | Disposition                                   | Graduated guard status                                                               |
| --------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| P1 schema/register roster mismatch                              | Closed by `9f9f5a2`; later advanced to 54/107 | Roster, register, examples, and governed-population contracts                        |
| P1 62 false positives on predicate fragments                    | Closed without weakening schema logic         | Canon-linter regression distinguishes fragments from complete object shapes          |
| Missing Node type configuration and emitted source artifacts    | Closed in P4; BL-042 N/A                      | Typecheck is a stage-1 blocking gate; no dedicated historical regression             |
| Undeclared `@eslint/js`                                         | Closed in P4; BL-042 N/A                      | Lint is a stage-1 blocking gate                                                      |
| P2 glossary count, active journey seam, and use-case assertions | Closed in P5; BL-041 N/A                      | Product contract pins 44/14/13/12 and supersession semantics                         |
| P2 hand-maintained historical sensor counts                     | Closed in P4; BL-041 N/A                      | Runtime parity guards current descriptors; no dedicated stale-comment scanner        |
| P4 schema/register/glossary concurrent assertion reds           | Closed in P5; BL-043 N/A                      | Governed-population and product contracts                                            |
| P5 deterministic scaffold fixture/path failures                 | Closed by `5df51c6`                           | Rebound deterministic fixture suites                                                 |
| P5-KR-001                                                       | Open at BL-012                                | Exact scheduled-reachability guard                                                   |
| P5-KR-002                                                       | Open at BL-010                                | No executable guard: production writer/protocol is absent; ledger prevents silence   |
| P5-KR-003                                                       | Open at BL-013                                | Sensor-standing integration guard                                                    |
| P5-KR-004/KR-007                                                | Open at BL-014                                | RTD integration and action-coverage guards                                           |
| P5-KR-005                                                       | Open at BL-015                                | Skill-firewall and action-coverage guards pin 27 findings                            |
| P5-KR-006                                                       | Open at BL-019                                | Action-coverage guard pins 18 missing pages                                          |
| P5-KR-008                                                       | Open at BL-016                                | Production effect-binding integration guard pins 39 extras                           |
| P5-KR-009                                                       | Open at BL-027                                | E2E help guard pins generic group-help behavior                                      |
| P5-KR-010                                                       | Open at BL-018                                | Post-merge Auditor E2E guard                                                         |
| P5-KR-011                                                       | Open at BL-017                                | Policy-derived coverage config and P7 stage 3 fail closed                            |
| P7 end-to-end-pass acceptance contradicts BL-017                | Open until BL-017 closes                      | Local runner explicitly fails stage 3; this prevents claim laundering                |
| P7 reusable evidence flow lacks a dedicated backlog item        | Open reconciliation finding                   | Evidence-mode sentinel fails closed, but it is not the missing implementation record |
| Changeset fixed group still names dissolved `@devai-nyx/core`   | Open at BL-025                                | Current changeset checker does not validate fixed-group members; no guard yet        |

Committed handoff lifecycle metadata was not rewritten for presentation. The P1
handoff is superseded; P2's two copied/authoritative handoffs remain labelled active
despite factual completion; the P4 prerequisite remains draft after consumption.
BL-041/BL-043 and the guards above establish the substantive DONE/N/A dispositions.

## Auditor recommendations

1. Preserve the P7 stage-3 failure until BL-017 meets 70/60/70/70; do not describe
   stage 1–3 as green.
2. Add a dedicated draft backlog item for the reusable local-evidence
   manifest/evidence-gate flow before R-0002 planning.
3. Treat the stale core member in `.changeset/config.json` as part of BL-025 and add
   fixed-group membership validation when that item is executed.
4. Keep BL-001..BL-003 and BL-004..BL-006 as hard predecessors to any ratification or
   release claim.
5. If P8b writes a bootstrap closure record, describe execution through P7 and the
   honest red boundary only; the closure must not imply ratification, release, or
   readiness.

## Verification census

The audit read the P6 seed, Appendix A and P0–P7 prompts, inherited P0–P7 reports,
all committed R-0001 handoffs and KNOWN-RED ledgers (including migrated copies), the
backlog, law and documentation freshness audits, schema regeneration status, current
attestation and thresholds, coverage summary, and all 24 P0–P7 commits with their
complete diffs. Mechanical checks confirmed 43 unique backlog records, 39 active
priority counts of P0 23/P1 5/P2 11, four N/A records, the 11-entry P5 map, two valid
workflow files, zero pending changesets, and a clean read-only predecessor worktree.
