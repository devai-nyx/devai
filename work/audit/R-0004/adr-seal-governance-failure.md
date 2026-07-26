---
id: R-0004-ADR-SEAL-GOVERNANCE-FAILURE
title: CI ADR seal and copied-history governance failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [strict governance after 9c7818d6d8763b74b008e2756a6d0e45bad87b2b; BL-155]
---

# CI ADR seal and copied-history governance failure

The active-ADR association removed every forbidden-action finding, including the
original checker change. The next strict-governance sensor then stopped on two
`DECISION_LOCKED_BODY_MUTATED` findings.

ADR-014 was edited after its sealing commit to complete affected paths, which is not a
permitted active-record mutation. ADR-013 changed only through its canonical terminal
lifecycle fields, but `git log --follow --find-renames=1%` crosses the earlier Git copy
boundary and incorrectly compares ADR-013 against ADR-005's sealed body.

BL-155 requires a new gapless ADR rather than mutating ADR-014's sealed body, and a
red-first governance-ledger correction that stops copied history while preserving
rename tracking and mutation detection. No sensor waiver, history rewrite, threshold,
skip, external gate, or release boundary is permitted.
