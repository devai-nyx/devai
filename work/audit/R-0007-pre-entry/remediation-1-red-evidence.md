---
id: R-0007-PRE-ENTRY-REMEDIATION-1-RED
title: Remediation campaign 1 complete-population red evidence
type: assessment
status: active
date: 2026-07-29
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-015; DII-248; Inspector dd70f0fc4aaa42b27cc3f8a0542c17dac4a9abb2]
related_invariants: [INV-DEVAI-002; INV-DEVAI-003; INV-DEVAI-017; INV-DEVAI-020]
---

# Remediation campaign 1 complete-population red evidence

At exact Inspector commit `dd70f0fc4aaa42b27cc3f8a0542c17dac4a9abb2`, the
command below exited 1:

```text
pnpm vitest run tests/contract/pre-r0007-remediation-1.red.contract.test.ts --reporter=dot
```

The isolated population contains 45 tests. One foundation test passes: the fixture
schema-validates all new records and checks their self- and cross-digests. The remaining
44 tests are intentional behavioral reds: 6 for `C2-F001`, 9 for `C2-F005`, 9 for
`C2-F006`, 5 for `C2-F007`, and 15 for `C2-F008`.

The output proves absent implementation, not a machinery PASS. The current dispatcher
does not recognize policy v4, review scope does not expose the new exact convergence
diagnostics, `claims-check` is not dispatched on the v4 path, and authenticated review
state, transport, reuse, and complete-repair transitions are absent.

The Engineer repair condition is all 45 cases green together while preserving every
earlier pre-R-0007 control population. No substantive remediation review has been
consumed.

R-0007 is not started and its governed reviewer remains unbound. This evidence does not
authorize B0, round execution or closure, push, merge, deployment, release, evidence
promotion, real-stynx mutation, or predecessor mutation.
