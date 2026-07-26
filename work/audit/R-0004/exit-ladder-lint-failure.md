---
id: R-0004-EXIT-LADDER-LINT-FAILURE
title: Exact-candidate Inspector lint failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-EXIT-LADDER-LINT-CORRECTION
provenance: [candidate 268e31f0169508a635bb58a06c6e1c6fe3075239; Stage 1 lint; BL-141]
---

# Exact-candidate Inspector lint failure

The complete ladder at candidate
`268e31f0169508a635bb58a06c6e1c6fe3075239` passed evidence-mode refusal,
workflow lint, all three action-registry projections, the 34-invariant/125-test trace
projection, and all 164 repository-reference projections. It then stopped at Stage 1
lint because `tests/contract/r0004-governed-surface.red.contract.test.ts:208` contains a
two-space regular-expression literal rejected by `no-regex-spaces`. No typecheck, later
stage, or Opus review ran.

BL-141 governs the Inspector correction. The assertion must preserve the exact
two-space YAML job-key boundary while expressing its cardinality without countable
literal spaces. No workflow source, production source, assertion meaning, threshold,
skip, or external gate may change.
