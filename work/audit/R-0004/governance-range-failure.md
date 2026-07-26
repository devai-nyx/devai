---
id: R-0004-GOVERNANCE-RANGE-FAILURE
title: R-0004 overbroad governance-range failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-GOVERNANCE-RANGE-CORRECTION
provenance:
  [BL-162; failed strict-governance reading after c530468; R-0004-GOVERNANCE-RANGE-CORRECTION]
---

# R-0004 overbroad governance-range failure

The first BL-162 repair replaced the insufficient 50-commit tail with a 1,000-commit
tail. The mandatory live strict-governance check then failed because that count crossed
the exact R-0004 base and imported unrelated pre-round forbidden-pattern fixtures and
documentation. It included the omitted workflow commit but did not express the governed
round boundary.

The paired active correction `R-0004-GOVERNANCE-RANGE-CORRECTION` preserves this failure
and records the exact fail-closed base-range repair. No finding was waived, no history was
rewritten, and no external action occurred.
