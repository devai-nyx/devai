---
id: R-0004-OPUS-CLOSE-REVIEW-2-FAILURE
title: R-0004 corrected exact-candidate Opus close-review failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-OPUS-CLOSE-REVIEW-2-CORRECTION
provenance: [Claude Opus 5 read-only review of cd536da78ae4980176e6866c3b3369d5bb71e3d6; BL-156–162]
---

# R-0004 corrected exact-candidate Opus close-review failure

The mandated read-only close review used literal `claude-opus-5` with no fallback and
returned `VERDICT: FAIL` on exact clean candidate
`cd536da78ae4980176e6866c3b3369d5bb71e3d6`. The reviewer independently reproduced the
complete green ladder but identified seven blocking defects inside the R-0004 claim:

- four governed `sense test <suite>` routes emitted argv rejected by the production
  authority broker;
- two stale action counts remained in the active as-built prose;
- the R20 fixture-delta record named a nonexistent skill, omitted the real changed
  fields/files, and was guarded by a self-comparison;
- canonical `sense build` help still advertised a removed override and wrong argv;
- the leaf-help non-authorizing guard checked a path the session store never used;
- the test-only authority host admitted any `tests/config/*.ts`, including coverage;
- strict CI governance's default 50-commit window excluded the round's workflow commit.

BL-156 through BL-162 govern the minimum repair. No source push, PR, publication,
release, deployment, real-stynx write, or later-round activation occurred. A complete
ladder restart and a fresh exact-candidate Opus 5 PASS remain mandatory.
