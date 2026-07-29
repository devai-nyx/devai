---
id: R-0006-INDEPENDENT-OPUS-B9-REVIEW-FAILURE
title: R-0006 B9 independent Opus review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-208; DII-211; DII-219; candidate c0f49afc9013d61e5d528067c60057adea3c745e; manifest 79a72bcefc3a2809f5854f4bfd2bbe6f55d0814c71fe54b397b1d4a2639784a1,
  ]
---

# R-0006 B9 independent Opus review failure

## Verdict and standing

**FAIL — five P1 blockers and no P0 blocker.** The mandatory reviewer ran through the
literal `claude-opus-5` selector in plan mode with file-write tools denied and no model
fallback. It reviewed exact candidate `c0f49afc9013d61e5d528067c60057adea3c745e`
from base `7cf325625307a630344efe971bceccb011560301` and independently recomputed manifest
digest `79a72bcefc3a2809f5854f4bfd2bbe6f55d0814c71fe54b397b1d4a2639784a1`.
The worktree was clean and the reviewer made no file, commit, ref, remote, or predecessor
mutation. This FAIL grants no review envelope, push, merge, closure, release, or later
round standing.

## P1 findings and bounded repairs

1. The semantic anti-vacuity checker applies fixed-count, self-comparison, and
   named-file-only checks only to policy JSON instead of the declared repository
   populations. Add behavior-first population fixtures, implement content scanning,
   and remove the four live anti-patterns the review identified.
2. Output/error totality is not behaviorally proved for the 39 folded or tombstoned
   identities. Assert exact `router-only` modes, drive a folded alias and the tombstone,
   and narrow the as-built claim for the residual kept-action invocation gap.
3. The manifest records DII-219-classified commits as indistinguishable
   `path_authorized: true` rows. Extend schema and materialization with an explicit
   exception disclosure carrying the decision and exact classified paths.
4. The as-built retains two stale 2,535 assertion-site totals alongside the correct
   2,542 value. Correct both from the trace source.
5. `tests/KNOWN-RED-R0006.md` lacks exact post-repair green dispositions for B2 and the
   B9 role-path red. Add the observed commands and counts after repair.

Every repair invalidates the candidate, convergence, rehearsal, manifest, and review.
Inspector reds and Architect law must precede Engineer changes; a fresh candidate must
rerun the complete B9 ladder and literal-model review.

## Verified positives retained as historical evidence

Opus independently verified the 69-commit exact range, candidate tree
`c4a5b56d5e085910c3b129ff59a3e9cb29875eca`, manifest digest, 32 green convergence
gate records, identical workspace digest
`7fee0dc0066a92bf51edbfdcb289d5a74b6021b169df55e3dbb3a267321be2af`, identical
coverage digest `668853a175141f371d61ae7f01f2b246f885f3fc2abdc9e403a9d0eb25a75801`,
378-file denominator, unchanged 70/60/70/70 floors and four exclusions, exact DII-219
set enforcement, sequencing, candidate-only identities, closure rehearsal, preserved
red records, and separation of mutation and aggregation decisions. These positives do
not waive any P1 and have no current standing after repair begins.

## Nonclaims

This record does not claim PASS, publication readiness, closure, PC-0007, exact-head or
exact-main remote CI, release, package publication, tag, GitHub Release, Pages or other
deployment, evidence reuse or promotion, real-stynx mutation, predecessor mutation, or
R-0007+ work.
