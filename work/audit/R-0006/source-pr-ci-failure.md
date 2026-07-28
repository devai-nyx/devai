---
id: R-0006-SOURCE-PR-CI-FAILURE-1
title: R-0006 source PR first remote CI failure
type: audit-report
status: active
date: 2026-07-28
authority: Auditor
supersedes: null
superseded_by: null
verdict: FAIL
source_head: 3bd2faec178ef1d37d9ae37973dc0b2971658f5d
pull_request: 12
workflow_run: 30391126864
failed_job: 90382899841
---

# R-0006 source PR first remote CI failure

## Verdict

**FAIL — Stage 2 failed at exact source head
`3bd2faec178ef1d37d9ae37973dc0b2971658f5d`; Stage 3 and round gates were skipped.**

The fail-closed evidence-mode job, Stage 1, changeset classification, and governed
repository enforcement passed. The Stage 2 T1/T2/law/record-contract job reported
three test failures:

- two `r0006-entry-control.red.contract.test.ts` fixture paths invoked
  `git commit-tree` without an explicit author/committer identity, and therefore
  failed on the clean GitHub runner where no user identity is configured;
- `r0006-smart-convergence.red.contract.test.ts` inherited the runner's `CI=true`
  environment in a test intended to exercise locally trusted cache behavior, so the
  controller correctly distrusted the prior cache and executed the ordinary task
  instead of producing the test's expected `SKIPPED_FRESH` result.

This exact remote failure invalidates the cycle-4 PASS candidate's publication and
closure standing. It authorizes only complete-class role-pure repair, a fresh exact
candidate, reconvergence, rehearsal, manifest and review-scope regeneration, and a
fresh exhaustive review under OM-012.

## Nonclaims

No merge, exact-main CI, PC-0007, closure-only PR, final closure, release, package
publication, tag, GitHub Release, Pages deployment, evidence promotion, real-stynx
mutation, predecessor mutation, or R-0007+ work is claimed.
