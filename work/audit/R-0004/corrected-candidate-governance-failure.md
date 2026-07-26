---
id: R-0004-CORRECTED-CANDIDATE-GOVERNANCE-FAILURE
title: Corrected-candidate CI ADR governance failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate a8937f5297a5a5e300128f5959cb3245a237ac0b; strict governance; BL-154]
---

# Corrected-candidate CI ADR governance failure

Candidate `a8937f5` passed the complete Stage 1 through Stage 3 ladder: T1 at 71 files /
827 tests, T2 at 38 files / 232 passed / one declared skip, and merged T1+T3 coverage at
71.12% statements, 61.66% branches, 77.55% functions, and 73.14% lines. Changeset
classification also passed.

Strict governance then stopped on one `FORBID-CI-WITHOUT-ADR` finding. Engineer commit
`55ee8d0` corrected `scripts/check-workflows.mjs` for the first Opus review's F8, under
DII-171 and BL-151, but no active ADR explicitly covers that CI-checker path. The scanner
therefore cannot machine-verify the architectural authorization.

BL-154 requires a gapless active ADR and a fail-closed association between the changed
CI path and exact active-ADR `affected_rules` coverage. An exact-commit waiver is not
permitted. No later governance sub-gate, T4–T6, formatting, root floor, package dry-run,
or Opus review ran after this stop. No threshold, skip, external gate, or release
boundary changed.
