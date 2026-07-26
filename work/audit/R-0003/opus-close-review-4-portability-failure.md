---
id: R-0003-OPUS-CLOSE-REVIEW-4-PORTABILITY-FAILURE
title: Fourth exact-candidate Opus portability failure
type: audit-report
status: superseded
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: R-0003-OPUS-CLOSE-REVIEW-4-PORTABILITY-CORRECTION
provenance:
  [
    candidate b21b1f13a09a6b550a2783ac1e4aebf0cd13e620; literal claude-opus-5 session d7af245f-5496-4726-a008-1fb6a18cad65; BL-140,
  ]
---

# Fourth exact-candidate Opus portability failure

## Verdict

The read-only fourth exact-candidate review ended `VERDICT: FAIL`. Candidate
`b21b1f13a09a6b550a2783ac1e4aebf0cd13e620` is blocked from source push because the
BL-138 Inspector contract resolves seven sibling originals that are not ancestors of the
candidate and have no origin ref. A full local object store therefore produced a false
green that exact-SHA CI cannot reproduce. The review also found the BL-001 current
disposition stale after ratification; this Auditor batch corrects that row.

## Durable identity evidence

The following values were read before repair with
`git show -s --format='%h %an | %cn'`. The replay commits are candidate ancestors; the
role-pure originals are evidence from the abandoned local reconstruction branch and must
not be resolved dynamically by a portable CI contract.

| Replay  | Replay author / committer          | Original | Original author / committer       |
| ------- | ---------------------------------- | -------- | --------------------------------- |
| 1449e4d | DEVAI Engineer / Antonio A. Russo  | 16a9f36  | DEVAI Engineer / DEVAI Engineer   |
| 611e14c | DEVAI Architect / Antonio A. Russo | bfccf19  | DEVAI Architect / DEVAI Architect |
| 938e2ab | DEVAI Engineer / Antonio A. Russo  | a26369e  | DEVAI Engineer / DEVAI Engineer   |
| 3d44a48 | DEVAI Auditor / Antonio A. Russo   | dde5ae2  | DEVAI Auditor / DEVAI Auditor     |
| 726fe66 | DEVAI Inspector / Antonio A. Russo | 9293ace  | DEVAI Inspector / DEVAI Inspector |
| 0ba2612 | DEVAI Inspector / Antonio A. Russo | 93ef651  | DEVAI Inspector / DEVAI Inspector |
| fa17a5c | DEVAI Engineer / Antonio A. Russo  | 7442708  | DEVAI Engineer / DEVAI Engineer   |

## Boundary

BL-140 owns a portable red-first contract, symmetric correction audit, DII-161, complete
ladder restart, single-branch-clone proof, and fresh exact Opus PASS. The identity record
documents the already governed defect; it does not waive future DEVAI author and
committer identity. PC-0004 remains absent and R-0004 remains dormant.
