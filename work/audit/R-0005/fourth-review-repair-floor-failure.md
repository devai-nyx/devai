---
id: R-0005-FOURTH-REVIEW-REPAIR-FLOOR-FAILURE
title: R-0005 fourth-review repair floor failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0005-INDEPENDENT-CODEX-REVIEW-4-FAILURE; KR-R5-042; candidate 02d2d5de912b38de823d9134ef6e710c3408b10b,
  ]
---

# R-0005 fourth-review repair floor failure

The first complete floor after the fourth-review repair passed 131 of 133 test files
and failed exactly two existing repository-reference projection contracts. The reading
was 1,215 passing tests, eight declared skips, and two failures.

Both failures report the same deterministic one-line displacement in
`docs/dev/security/authority-enforcement.md`: its current GitHub reference moved from
line 124 to line 123 after the governed lifecycle table correction. No schema,
implementation, authority behavior, assertion, source set, threshold, or skip failed.
The active semantic projection remains stale by that exact locator and must be
regenerated under Architect authority before the floor restarts.

This record preserves a red measurement. It is not a PASS and authorizes no projection
exclusion, reference normalization, historical rewrite, or external action.
