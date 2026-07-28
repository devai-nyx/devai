---
id: R-0006-INDEPENDENT-OPUS-B9-REVIEW-3-FAILURE
title: R-0006 third B9 independent Opus review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-208; DII-211; DII-222; DII-223; DII-224; candidate 3c6c2d3bdde6bc6d505a6a29fb92d120a36c0050; manifest 942aa91b5c1ac7c1dcf8a7709b3899f9e15f5be4c45298dd67076fa167311abc,
  ]
---

# R-0006 third B9 independent Opus review failure

## Verdict and standing

**FAIL — one P0, three P1, nine P2, and four P3 findings.** The mandatory reviewer ran
through the literal `claude-opus-5` selector in read-only plan mode with file-write
tools denied and no model fallback. It reviewed exact candidate
`3c6c2d3bdde6bc6d505a6a29fb92d120a36c0050` from base
`7cf325625307a630344efe971bceccb011560301` and independently recomputed manifest
digest `942aa91b5c1ac7c1dcf8a7709b3899f9e15f5be4c45298dd67076fa167311abc`.
The worktree remained clean at candidate tree
`b8670d2823a81c4251446f1022fce5235c21eed1`; the reviewer made no file, commit,
ref, remote, or predecessor mutation. This FAIL invalidates the candidate,
convergence, rehearsal, manifest, and every publication claim.

## Blocking findings

### P0 — branch-location collision inflates the coverage numerator

`tests/config/subprocess-v8-coverage-provider.ts` uses the four source-position fields
as the branch-hit key. Istanbul implicit branch arms encode an empty location, so all
four values become `undefined` and every such arm in a file collapses to `:::`. The
last candidate count is then credited to every empty-location arm in the current map.
The reviewer measured 3,577 such slots across 271 files, with collisions in 242 files;
2,634 were reported covered. For checkable implicit `if` arms, 525 violated the
execution identity and 97 were provably false-positive covered branches. Removing only
those 97 credits yields 11,557/19,382 = 59.63%, below the unchanged 60% floor. This is
the branch-path recurrence of the second Opus review's coverage-inflation defect.

The bounded repair is an Inspector red with multiple empty-location arms carrying
different counts, followed by an exact-hit provider correction. Empty or incomplete
locations may not share a merge key. The corrected measurement must remain honest;
any branch-floor deficit requires behavior-bearing test depth, never a threshold,
exclusion, denominator, generated-label, or assertion change.

### P1 — unstable raw-artifact digest is presented as reproducible final evidence

`work/audit/R-0006/coverage-depth-evidence.json` records
`coverage_final_sha256` as `6afc83635427b4eecca2d40802d78565c973f61273ce5ba2a1252a8cadd0b7f6`,
while the reviewed candidate artifact hashes to
`0effa576bc3ba0a9cfe5d7b460f57e7a130ae158fbd6792f83a9e450d0f4b36e`.
DII-224 already establishes that this artifact is runtime-variable. Final evidence
must bind stable summary bytes and derived totals, and must describe the raw artifact
as retained but byte-unstable rather than claim a durable digest.

### P1 — retained statement-level counters are doubled

The provider obtains `current` from `fileCoverageFor(filename).toJSON()`, which exposes
the map's internal data by reference, mutates it, and then passes the same object to
`coverageMap.addFileCoverage(current)`. Istanbul merges the object into itself, giving
`2 × parent + subprocess` counts. Percentages are unchanged because coverage is based
on positive counts, but the retained counter evidence is false. The correction must
clone before mutation or replace rather than add, and an Inspector adversary must
prove exact counters and repeat-merge behavior.

### P1 — the coverage-integrity tests do not exercise branch merging or retention

The only executing fixture in
`tests/contract/r0006-coverage-integrity.red.contract.test.ts` has empty branch maps.
The other two cases inspect source text rather than run the provider or inspect
retained artifacts. New behavior tests must distinguish location-keyed merging from
ID-keyed merging, cover multiple degenerate branch arms, assert exact arrays and
counters, and observe retained `coverage-final.json` plus nonempty raw subprocess
evidence from an actual run.

## P2 corrections

The review also found nine non-PASS-blocking control weaknesses that remain visible:

1. `clean_clone.alternates` is emitted as a literal instead of the observed value.
2. The hand-written semantic scanner can desynchronize on regex literals containing
   quote characters, although an AST sweep found no currently hidden violation.
3. The manifest schema does not itself encode coverage floors, successful gates, or
   governed-range/role-map cardinality relationships.
4. No negative contract reaches `MANIFEST_SCHEMA_INVALID` against the real schema.
5. No negative contract reaches `IDENTITY_ORDER_INVALID` with non-ancestor identities.
6. Source-close prose permits deterministic post-review projections even though the
   governing policy admits none.
7. Candidate-file reads trim boundary whitespace before projection digests and
   semantic scans.
8. The policy review-record path still contains the superseded E0–E5 PASS and would
   erase that evidence when replaced by the final review record.
9. The custom provider's dist filter is skipped on early returns and malformed raw
   subprocess JSON is silently discarded.

## P3 observations

The trace's 2,742 assertion-site count includes three lexical markers inside fixture
strings; source-close should say "both B9 Opus FAILs" rather than imply only two Opus
FAIL records overall; the known-red statement-artifact digest should be explicitly
dated; and several manifest fields are producer literals rather than derived values.

## Independently verified positives

The reviewer independently reproduced the 100-commit range and its 30 Architect, 29
Inspector, 29 Auditor, and 12 Engineer commits; all role/path rows; 347 identity
references with 337 reachable and ten exactly classified; candidate tree; manifest
schema and digest; 32 green convergence gate records; identical summary and normalized
workspace digests; rehearsal; all four projection materializations; byte-identical law
and machine policy; 378-file denominator; unchanged thresholds and exclusions; 186
action identities; 24 operational-value rows; and 34 invariants across 153 test sources.
Those positives do not waive the P0 or P1 findings.

## Required restart

Preserve this FAIL, add behavior-first Inspector reds, bind any needed Architect law,
apply role-pure implementation corrections, remeasure honestly, refresh Auditor
evidence from current sources, and rerun the full convergence, rehearsal, manifest,
literal-model review, and review-envelope ladder. No prior candidate state may be
reused.
