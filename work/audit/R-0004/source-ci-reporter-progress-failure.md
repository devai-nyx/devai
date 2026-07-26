---
id: R-0004-SOURCE-CI-REPORTER-PROGRESS-FAILURE
title: R-0004 source exact-head reporter-progress failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-SOURCE-CI-REPORTER-PROGRESS-CORRECTION
provenance:
  [PR #6; exact head f4466a6b8ffc4fe0455893d1b9013a6f5f4f0f34; GitHub Actions run 30209278971; BL-180]
---

# R-0004 source exact-head reporter-progress failure

Source PR #6 ran CI on exact head
`f4466a6b8ffc4fe0455893d1b9013a6f5f4f0f34`. Evidence mode, Stage 1, Changesets, and
governed-repository enforcement passed. Stage 2 failed the R20 fingerprint contract.

ANSI removal and summary metrics were correct. GitHub Actions nevertheless selected a
Vitest reporter form containing `✓ tests/fixture.test.ts (1 test) 5ms`, while the
unchanged baseline's locally selected form omitted that per-file progress line. Its
duration is nondeterministic presentation, not fixture behavior. The subprocess passed
one test and recorded `tests_passed: 1`, `tests_failed: 0`; raw evidence remained
truthful.

BL-180 remains open. Inspector must reproduce this exact fingerprint divergence red
first. Engineer may normalize only the exact fixture reporter-progress presentation
inside the deterministic R20 view; raw sensor output and metrics remain unchanged, and
the baseline must not be recaptured. A symmetric correction, complete ladder, fresh
literal `claude-opus-5` review, and exact-head CI pass remain mandatory before merge.
No closure, release, publication, deployment, real-stynx write, or later-round action is
authorized.
