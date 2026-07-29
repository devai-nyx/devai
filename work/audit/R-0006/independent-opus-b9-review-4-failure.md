---
id: R-0006-INDEPENDENT-OPUS-B9-REVIEW-4-FAILURE
title: R-0006 fourth B9 independent Opus review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-208; DII-211; DII-225; candidate c7ab49f5fbeffae3d8f58be0137f4c8f11d356fa; manifest 0999fa99259b82cd27003a1add804ab3b360ec83f2c8c6ea307121a1010349fb,
  ]
---

# R-0006 fourth B9 independent Opus review failure

## Verdict and standing

**FAIL — zero P0, one P1, one actionable P2, and two actionable P3 findings.** Five
additional previously disclosed observations remain governed nonblocking under DII-225.
The mandatory reviewer ran through the literal `claude-opus-5` selector in read-only
plan mode with file-write tools denied and no model fallback. It reviewed exact candidate
`c7ab49f5fbeffae3d8f58be0137f4c8f11d356fa` from base
`7cf325625307a630344efe971bceccb011560301`, independently recomputed manifest digest
`0999fa99259b82cd27003a1add804ab3b360ec83f2c8c6ea307121a1010349fb`, and confirmed
candidate tree `a665995f3b24132ef72cd1e340b97a56f292d7db`. The worktree was clean at
open and close, and the reviewer made no file, commit, ref, remote, configuration,
external-system, or predecessor mutation. This FAIL invalidates the candidate,
convergence, rehearsal, manifest, and every publication claim.

## Blocking and actionable findings

### P1 — stale current coverage digests recur in the as-built

`work/audit/R-0006/as-built.md` states that the current summary and statement-level
artifact digests are respectively
`7c394f2c539b5844349f95ec4e8073065689e7f3cc415a9f7ea28fcc52883f0b` and
`6afc83635427b4eecca2d40802d78565c973f61273ce5ba2a1252a8cadd0b7f6`.
The stable current summary is instead
`c4d75618fbc39602b4b01e9059e74249cf1e78a862f7176f770511ea177aa17b`, while the
statement artifact is deliberately byte-unstable and has no durable cross-run digest.
The stale paragraph contradicts both the current table and the same document's later
third-review correction. Auditor must perform a same-class sweep of current evidence
values, remove every unbounded runtime-variable digest claim, and distinguish immutable
historical readings from current evidence.

### P2 — invalidated intermediate reading is described as the current table

The second-review narrative says its 153-file, 1,441-test intermediate result is "the
green reading recorded above," although the current table records 155 files and 1,455
tests and the later honest 153-file run recorded 1,445 passing tests before failing the
branch floor. Auditor must bind each historical paragraph to its exact historical
reading and never point an invalidated state at the current table.

### P3 — repeat-merge behavior lacks an executing adversary

The exact-counter test invokes the merge only once. The third review explicitly required
repeat-merge behavior proof. Inspector must add an executing adversary that distinguishes
the intended cumulative behavior from both self-doubling and accidental idempotence.

### P3 — exact-location collision remains an unenforced data invariant

The reviewer independently measured zero branch, statement, or function location-key
collisions across the current 378-file artifact, so no live numerator defect exists.
The merge maps nevertheless use last-wins insertion if a future current-map population
contains two distinct entries at one complete location. Inspector must preserve the
zero-collision current population and fail closed on any same-kind duplicate exact
location rather than silently overwrite it.

## Independently verified positives

The reviewer independently reproduced the 109-commit exact ordered range and its 32
Architect, 33 Auditor, 12 Engineer, and 32 Inspector commits; every role/path row; 354
Git identities; candidate tree; manifest schema and digest; 32 green convergence gate
records; identical stable coverage and normalized workspace digests; isolated rehearsal;
all projection materializations; byte-identical policy materialization; the exact
378-file denominator; unchanged thresholds and exclusions; 186 action identities; 24
operational-value rows; and 34 invariants across 155 test sources.

It recomputed statements 16,093/22,393, branches 11,658/19,382, functions
2,479/3,073, and lines 14,936/20,383 from the retained summary. It measured zero
complete-location collisions in the real merged artifact, confirmed incomplete
locations receive no subprocess credit, verified the removal of additive self-merge,
and found the ten final depth tests behavior-bearing. Those positives do not waive the
actionable findings.

## Governed nonblocking observations

DII-225 already preserves and bounds the still-literal alternates field, regex-scanner
desynchronization risk, schema cross-field limits, absent real-schema negative cases,
and remaining producer literals. They are not restated as implemented controls or
readiness claims and do not waive any current gate.

## Required restart

Preserve this FAIL, add behavior-first Inspector reds for repeat merge and duplicate
exact-location collision, bind any needed Architect semantics, repair role-purely,
perform the Auditor same-class evidence sweep, and regenerate every caused projection.
Then rerun the full convergence, rehearsal, manifest, literal-model review, and
review-envelope ladder at a fresh candidate. No state from this failed candidate may be
reused.
