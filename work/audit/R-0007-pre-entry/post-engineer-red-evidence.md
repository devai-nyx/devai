---
id: R-0007-PRE-ENTRY-POST-ENGINEER-RED
title: Post-Engineer complete-class red evidence
type: assessment
status: active
date: 2026-07-29
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-014; DII-246; Inspector 3d950ed09d6ec0f11b986ec532146b54c01c67a1; Engineer 477237c8b7c33c2c59e2262ec9147311feaf6e5b,
  ]
related_invariants: [INV-DEVAI-001; INV-DEVAI-002; INV-DEVAI-003; INV-DEVAI-017; INV-DEVAI-020]
---

# Post-Engineer complete-class red evidence

The generic controller implementation at exact Engineer commit
`477237c8b7c33c2c59e2262ec9147311feaf6e5b` closes the original nine-case red
population: `tests/contract/pre-r0007-close-controls.red.contract.test.ts` passes all
13 cases. `pnpm run devai:prepare` also passes.

Two subsequent focused populations preserve five remaining failures. They are not
implementation PASS evidence and are not relabelled green.

## Architect contract defects

Command:

`pnpm vitest run tests/contract/pre-r0007-close-controls.red.contract.test.ts packages/schemas/tests --reporter=dot`

Result: 115 tests, 112 pass, 3 fail.

- The five new schemas and the two upgraded schemas omit existing meta-gate
  `description` or `examples` fields, so the meta-gate admits 58 of 65 roster schemas.
- DII-246 provenance lacks the register-required `session-draft`, `generalizes`, or
  equivalent marker.
- The active-campaign selector contract still treats the now model-neutral R-0007
  prompt as an Opus-bound instruction.

The first two defects belong to Architect paths. The selector expectation belongs to
Inspector paths and must be migrated to the explicit unbound-entry contract; the
production prompt must not be changed back to a fixed model.

## Closed-round regression test drift

Command:

`pnpm vitest run tests/contract/r0006-smart-convergence.red.contract.test.ts tests/contract/r0006-entry-control.red.contract.test.ts --reporter=dot`

Result: 58 tests, 56 pass, 2 fail. Both failures read the prospective live v3 policy as
if it were still R-0006's unbounded policy. The other 56 historical controller,
manifest, envelope, rehearsal, freshness, and review adversaries pass.

The repair must retain R-0006's immutable OM-012, review, source-close, and current-claim
evidence while making the tests assert that history from its historical sources. The
prospective v3 policy must remain round-generic, two-cycle bounded, and free of an
R-0006 final-record default.

R-0007 has not started. Its reviewer remains unbound. Deployment and release remain
forbidden.
