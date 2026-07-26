---
id: R-0004-OPUS-CLOSE-REVIEW-8-CORRECTION
title: R-0004 eighth exact-candidate Opus repair correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-OPUS-CLOSE-REVIEW-8-FAILURE
superseded_by: null
provenance:
  [
    BL-180; Inspector b4d895e and bf42be1; Engineer db75ddc; Architect 467b001; exact repaired snapshot dc64176ab75675a65e3c561576a2f5bb756b408f,
  ]
---

# R-0004 eighth exact-candidate Opus repair correction

Inspector `b4d895e` reproduced the second exact-CI defect at fingerprint level: ANSI
presentation prevented both reporter-text identity and the wall-clock mask from
stabilizing. It also pinned the disposition schema total to the live canon. Engineer
`db75ddc` removes ANSI only inside the deterministic R20 normalization view; sensor raw
stdout and `out_head` remain unchanged. Architect `467b001` reconciled the exit
disposition from 54 to 55 schemas. Inspector `bf42be1` records both guards green without
recapturing the baseline.

The complete ladder passed on exact clean snapshot
`dc64176ab75675a65e3c561576a2f5bb756b408f`: T1 passed 71 files / 838 tests, T2 passed
38 files / 239 tests plus one declared skip, the root porcelain passed 127 files / 1,165
tests plus eight declared skips, merged T1+T3 coverage remained
71.23/61.79/77.62/73.25, and all eleven package dry-runs passed. Formatting, strict
governance, and all generated checks were green.

The 147 command-description guard covers 144 literal AST definitions plus three exact
init-factory invocations; it is not represented as 147 literal definitions. No skip,
threshold, assertion, evidence source, or baseline changed. A new atomic closing
decision, complete ladder, fresh literal `claude-opus-5` review, and repaired exact-head
CI remain required before merge. Every external human gate remains closed.
