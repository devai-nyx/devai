---
id: R-0006-INDEPENDENT-OPUS-B9-REVIEW-2-FAILURE
title: R-0006 second B9 independent Opus review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-208; DII-211; DII-219; DII-220; DII-221; candidate b9d300913ef92e1af72e7fc8f24d54d9134dc6c2; manifest 433cef8afe17c280b1fdbf15ca9cdea8a959f33faf90a686473af46869b3f0e7,
  ]
---

# R-0006 second B9 independent Opus review failure

## Verdict and standing

**FAIL — one P0, one P1, and three P2 findings.** The mandatory reviewer ran through
the literal `claude-opus-5` selector in plan mode with file-write tools denied and no
model fallback. It reviewed exact candidate
`b9d300913ef92e1af72e7fc8f24d54d9134dc6c2` from base
`7cf325625307a630344efe971bceccb011560301` and independently recomputed manifest
digest `433cef8afe17c280b1fdbf15ca9cdea8a959f33faf90a686473af46869b3f0e7`.
The worktree was clean and the reviewer made no file, commit, ref, remote, or
predecessor mutation. This FAIL grants no review envelope, push, merge, closure,
release, or later-round standing.

## Blocking findings and bounded repairs

1. **P0 — coverage numerator inflation.**
   `tests/config/subprocess-v8-coverage-provider.ts` merges a zero-hit exact location by
   falling back to any covered containing range. That projects an enclosing execution
   count onto unexecuted nested statements and functions. The reviewer confirmed the
   fingerprint in the generated artifact, including 45 files reporting 100% statement
   coverage with zero covered branches. Remove containment inference, merge only
   exact-located hits, retain auditable statement-level or raw coverage evidence, and
   remeasure. Any resulting floor deficit is real test-depth work and cannot be waived.
2. **P1 — stale final coverage evidence.** `work/audit/R-0006/as-built.md` cites digest
   `668853a175141f371d61ae7f01f2b246f885f3fc2abdc9e403a9d0eb25a75801`
   and counts 17,668/22,395 statements, 11,894/19,384 branches, and
   16,407/20,385 lines. Candidate convergence instead records digest
   `8974ca4a775004c871c374ce07673dd2acbf4c1be66420c6403baa6c8b34f28c`
   and the live artifact reports 17,666/22,393 statements, 11,892/19,382 branches,
   and 16,405/20,383 lines. Re-read all final evidence from the corrected source.

Every repair invalidates the candidate, convergence, rehearsal, manifest, and review.
Inspector reds and Architect law must precede Engineer changes; a fresh candidate must
rerun the complete B9 ladder and literal-model review.

## P2 corrections required for an accurate final record

1. Correct the false universal that describes three governed historical exceptions;
   DII-221 adds a fourth R-0006 exception for `63b2238d`.
2. Re-read governed-range counts: the cited 52, 67, and 77 values lag their asserted
   commit boundaries by one; the reviewed candidate contains 78 commits.
3. Qualify or refresh the active entry-control and known-red command totals and the
   stale statement that B0 through B9 remain blocked.

## Prior-review dispositions

Opus found the earlier population-content scanner, behavioral execution proof,
manifest exception disclosure, assertion-site totals, and post-repair green
dispositions repaired as specified. The assertion-total repair remains correct, but
the same evidence-restatement defect class recurred in the coverage record. Those
positives do not waive the new P0 or P1 and have no current standing after repair
begins.

## Verified positives retained as historical evidence

Opus independently verified exact-base and candidate identity, the 78-commit range,
candidate tree `3228a7bbb4930f8466a72ae660c6ae546ba2ed09`, manifest digest,
role purity and disclosed exceptions, two-pass convergence, clean-clone rehearsal,
complete 378-file denominator, unchanged 70/60/70/70 thresholds and four exclusions,
registry totality, semantic population scanning, trace integrity, and fail-closed
review-envelope behavior. The reviewer did not accept the measured coverage numerator.

## Nonclaims

This record does not claim PASS, honest coverage-floor attainment, publication
readiness, closure, PC-0007, exact-head or exact-main remote CI, release, package
publication, tag, GitHub Release, Pages or other deployment, evidence reuse or
promotion, real-stynx mutation, predecessor mutation, or R-0007+ work.
