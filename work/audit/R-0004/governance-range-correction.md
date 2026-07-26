---
id: R-0004-GOVERNANCE-RANGE-CORRECTION
title: R-0004 exact governance-range correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [BL-162; failed strict-governance reading after c530468; Inspector 3581591; Engineer ab04008]
---

# R-0004 exact governance-range correction

The first BL-162 implementation used a 1,000-commit trailing window. The mandatory live
strict-governance check correctly failed because that window crossed the R-0004 base and
imported unrelated older forbidden-pattern fixtures and documentation. It was broad
enough but not semantically bounded to the round.

Inspector `3581591` red-first required an exact base range and proved that a one-commit
tail omits an earlier in-range forbidden change. Engineer `ab04008` added fail-closed
`--since-ref` resolution and changed `ci:governance` to scan every commit strictly after
exact closed-R-0003 SHA `b60b4c52bff1779da84f48edc63cbf34652ab18e`. Focused tests,
typecheck, and the full strict-governance composition pass with zero findings.

No historical finding was waived or suppressed. The correction narrows only the
declared campaign boundary while retaining every R-0004 commit, including the workflow
change that the original 50-commit default omitted.
