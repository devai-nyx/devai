---
id: R-0001-AS-BUILT
title: R-0001 as-built audit seed
type: audit-report
status: draft
date: 2026-07-24
authority: Auditor
supersedes: null
superseded_by: null
provenance: R-0001/P6; Appendix A; committed phase evidence through P5
---

# R-0001 as-built audit seed

This is the P6 observation seed for P8, not a closure record. It reports deltas from
Appendix A, carries no authority over law/product/code/tests, and preserves open red
evidence. P7 and P8 had not started at this observation boundary.

## P0 — Genesis re-init and provisional binding

Planned: orphan genesis, provisional predecessor binding, verbatim Owner authorization,
and a one-commit gate. Actual: history begins at Architect commit
`14439b05c1b9d1390db10be5d32fbc7281978b46`; the attestation records predecessor
commit `d76cd12d2241a1a28a32a0fe629c6531da7fe74d`, tree
`386cbb500a795f17624442ebb2c416ed5f16b15d`, and chain hash
`8ae98775e373617f814e2e7bd3d2616f7664a90f761442b45d5b205537984fb1`.

Delta: the expected provisional boundary remains exactly visible:
`ratified: null`, `frozen: false`, and no closing decision/PC record. R-Ω, manifest
supplement, coupling re-verification, changeset disposition, Ω.E host actions, and
successor re-bind remain BL-001..BL-003.

## P1 — Law completion

Planned: law sweep, schema examples/defs alignment, population registry, and honest
deferrals. Actual: commits `faf7a4ea08dce848e683776dffa30ded5aa8de32`,
`9f9f5a2134cd3823015ede8e4b097829c07ed932`, and
`c94060eeee11bfe898b41f343b324d2bb9e36817` authored the law slice and closed its
role-separated roster dependency; later Architect inputs
`2c69779948f718c53c6dcca95cd042063b793655` and
`7c3d34b2455d7086ce02202fe4f5f225b62e09a3` brought the canonical corpus to 54
schemas and bound CLI tiers.

Delta: prompt-scoped stale successor paths, the 56-versus-55 anchor count, and
predicate-fragment canon false positives were repaired. The independent law freshness
pass nevertheless found broader predecessor-shaped policy, trace, schema-description,
register, invariant, and glossary bindings; those remain explicit in BL-007 rather
than being hidden by P1's scoped green result. The coordinated `authority_docs`
rename, policy-altitude extractions, complete 42-article crosswalk/founding
ratification, full canon linter, and registry-derived vocabularies remain
BL-004..BL-009 and BL-033..BL-034. The earlier lint/typecheck defects were closed by
P4 (BL-042 is N/A), not relabelled as P1 success at their original boundary.

## P2 — Recorded Owner marks

Planned: apply REV-0006 without inventing Owner judgments. Actual: commits
`7b2816a3bc31cfadda99bf30985521b4ea1221da` and
`a77f9d2dbdfebc3fd44bcde8181fc8b049e22417` preserve 14 physical journeys with
13 active, supersede JNY-007 by JNY-014, remove hand-maintained use-case generation
time, map 12 use cases, supersede OM-001, and expand the glossary population to 44.
No Owner question was reported.

Delta: the seven successor vocabulary entries remain draft pending joint ratification
(BL-006). P5 completed the product assertions and P4 removed the unguarded sensor
comment counts; BL-041 records those handoffs N/A rather than reopening them.

## P3 — Documentation migration

Planned: transpose current docs into the successor cluster canon and leave generated
or post-ratification surfaces deferred. Actual: Architect commit
`ab3c88327312d7ec0caae1394bf7000fc9cb8244` changed 201 files and recorded the
full migration manifest: audit roster 164 CURRENT, 5 STALE, 12 DUPLICATE,
11 HISTORICAL, and 8 machinery, plus four final-pin additions and one removal.

Delta: generated CLI reference, generated decision/changelog/round/scorecard/test
projections, final History, and versioned 1.0.0 snapshots remain BL-019,
BL-021, BL-032, and BL-039. Historical/versioned predecessor content was not copied.
The independent documentation freshness pass classified P3 as structurally closed
but semantically open: imported live pages still contain predecessor decision,
article, process, state-placement, and existence claims, while the site configuration
can target predecessor hosting. BL-032 and BL-039 preserve that debt explicitly.

## P4 — Packages and code rebind

Planned: split the predecessor core, bind law/sensor/error contracts, collapse sensor
wrappers unless the fallback was necessary, rebuild the CLI, and integrate the
workspace. Actual: 11 Engineer commits from
`040d97edd640a4c023796dad61518cfef27e2aa8` through
`4161554d9ad0b61067a6093d897d01f908293aa8` created utils, authority, evidence,
spec, effects-check, sensors, loop, skills, schemas, CLI, and the integrated graph;
the empty core package was removed. Build/lint/typecheck and the package slices were
green at handoff. The sensor comment and package-specific P5 handoffs were completed.

Delta: collapse shipped (BL-040 N/A), but the current guarded action surface is 146
rather than the approximate 120–130 target. Build/test porcelain routing, full
per-action output schemas, action-id registry derivation, F1:T1 reachability, stale
policy, proof epochs, domains materialization, Auditor schema vocabulary,
first-parent gate path, core-façade/adopter compatibility, and sensor-note/diagnostic
work remain BL-010..BL-016, BL-022..BL-031.

## P5 — Seven-tier verification

Planned: materialize T0–T6, apply P2/P4 handoffs, add population/authority/evidence
guards, and retain explicit known reds. Actual: Inspector commits
`16c5152166920fe6917f56bc50d2494a835d5064` and
`5df51c62a07ed81c19c33126dea2afa156392832` created the tier configs, restored
successor fixtures, and produced a full floor of **812 passed / 8 skipped**.

Delta: `tests/KNOWN-RED-P5.md` retains 11 exact gaps. They map one-to-one as follows:
KR-001→BL-012; KR-002→BL-010; KR-003→BL-013; KR-004/KR-007→BL-014;
KR-005→BL-015; KR-006→BL-019; KR-008→BL-016; KR-009→BL-027;
KR-010→BL-018; KR-011→BL-017. Coverage remains honestly red at 29.2% lines,
26.81% branches, 31.09% functions, and 28.22% statements against 70/60/70/70,
and the workspace still lacks the declared coverage provider.

## P6 — Backlog compilation

Planned: exhaustively compile deferred/open/known-red/scheduled work and seed this
as-built report, writing only the two Auditor paths. Actual at this pre-commit
boundary: `work/rounds/R-0001/backlog.md` contains 39 active draft proposals
(P0 23, P1 5, P2 11) plus four explicit N/A dispositions. Register-format parsing,
mandatory-item coverage, changed-file allowlist, and the full test floor are the P6
pre-commit gates.

## P7 — CI

Not started at this boundary. Appendix A still assigns stage 1–3, round gates,
local-evidence skeleton, workflow guards, and changeset classification to P7.
Release/publish remains intentionally post-ratification under BL-020.

## P8 — Close

Not started. P8 must refresh this seed with P6/P7 evidence, reconcile the complete
deferral census one-to-one, create machine evidence only through the authorized verbs,
and perform no ceremony that the unexecuted R-Ω or open P0 backlog makes invalid.

## Defect and disposition ledger

- Repaired before P6: stale law paths/count descriptions, schema predicate false
  positives, product census assertions, P2's hand-maintained sensor counts, Node/ESLint
  workspace baselines, package fixture roots, and predecessor path assumptions.
- Still red: the 11 P5 contracts listed above; none is described as green or skipped.
- Still open: the independent law/docs freshness findings consolidated in BL-007,
  BL-032, and BL-039; structural migration success is not semantic successor freshness.
- Still draft by design: Constitution/ADRs/glossary/attestation and every backlog item.
- P6 observation: completed P2/P4 handoff files retain active/draft lifecycle labels.
  Their substantive work is evidenced complete and recorded N/A in BL-041/BL-043;
  P8 should decide whether historical handoff metadata is amended or merely explained,
  without changing source facts as part of this Auditor commit.

## Source sweep

Read in full: all P0–P5 phase reports supplied to the orchestrator; all CTX-01..CTX-12
packs plus CTX index, DS-01, and D-terminal; REV-0001..REV-0007; all committed
R-0001 handoffs and current/historical KNOWN-RED files; `law/schemas/REGEN-STATUS.md`;
the dossier Part VIII/IX acceptance criteria and Part X §5/§6 addendum; Appendix A;
current source values; and the complete 22-commit log with per-commit diffs/stats.
The two independent session audits, `law-freshness-audit-2026-07-23.md` and
`docs-freshness-audit-2026-07-23.md`, were also swept and their deferred findings
were consolidated into BL-007, BL-032, and BL-039 without changing the 43-record census.
