---
id: R-0004-CORRECTED-CANDIDATE-T2-CORRECTION
title: Corrected-candidate T2 collateral correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-CORRECTED-CANDIDATE-T2-FAILURE
superseded_by: null
provenance:
  [
    BL-152–153; DII-173; Architect 691821aa362330ad6e738ebc06ff7385d2ce2ab2; Inspector 1c2793568045c1c5178ccae331f30ecad5159eb6,
  ]
---

# Corrected-candidate T2 collateral correction

BL-152 and BL-153 are locally implemented. The canonical trace schema now admits
`contract` for invariant test bindings without changing any path, lifecycle,
target-type, invariant, or evidence-strength condition. Schema build plus focused roster
and CLI trace-resolution contracts pass against the live 34-invariant / 126-test trace.

The test-only authority host now admits bare `pnpm vitest run` and its exact
`--config tests/config/<file>.ts` shape. Seven direct assertions prove the two accepted
forms and deny traversal, nested configuration paths, watch/update flags, arbitrary
scripts, and shell execution. Hermetic R20 fixtures carry the fixed config and the
characterization corpus records the intended command-identity change. Both affected
skills baselines pass.

The failure record now points symmetrically to this active correction. Architect must
rebind source close and projections, then restart the complete ladder from a clean
candidate. No production argv, threshold, skip, external gate, or release boundary
changed.
