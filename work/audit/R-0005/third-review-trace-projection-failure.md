---
id: R-0005-THIRD-REVIEW-TRACE-PROJECTION-FAILURE
title: R-0005 third-review trace projection failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - exact ladder at 77a706796775cd71a49e745375c667178c27862f
---

# R-0005 third-review trace projection failure

The first exact-ladder restart after the third-review repair passed workflow and action
registry checks, then stopped at `trace:check` because the new Inspector round-state
routing test was not present in the deterministic `law/trace.json` projection.

The bounded repair is to regenerate the Architect-owned trace from unchanged invariant
markers. No test, invariant, trace rule, or source behavior may change. Retirement
requires exact trace parity and a complete ladder restart.
