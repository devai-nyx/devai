# Pre-R-0007 close-control red evidence

## Provenance

- Base: `722e8a3438f3534260ac4f24c3eecc59e76f905b`
- Owner: `096c2d7` (`096c2d7eea3dceea0fbb24161604a255df95f0f7`)
- Architect: `55b0a78` (`55b0a78ca9585c1166d1eba109a97596e2f8649e`)
- Inspector contract: `5745dab` (`5745dabfb898ac4e0195fde1302c5f2daa747373`)
- Inspector semantic surface binding: `3d950ed`
  (`3d950ed09d6ec0f11b986ec532146b54c01c67a1`)
- Auditor observation point: Inspector commit
  `3d950ed09d6ec0f11b986ec532146b54c01c67a1`

## Focused red reproduction

Exact command:

```text
pnpm vitest run tests/contract/pre-r0007-close-controls.red.contract.test.ts --reporter=dot
```

The command exited nonzero with one failed test file. The file contains 13 tests: 9
intended failures and 4 tests already passing. The nine failing contract classes are:

1. Missing governed `round-close:*` scripts.
2. Production R-0006 hardcoding, unbounded-cycle residue, and fixed-model binding.
3. Pre-entry preparation policy behavior and its reviewer-unbound diagnostic.
4. The fail-closed entry interface for an unbound reviewer.
5. The auditable local impact plan and conservative fallback.
6. The remote complete-population plan with no trusted local cache.
7. Generated review scope covering every registered semantic obligation.
8. The exact-candidate claims command and unresolved or stale claim rejection.
9. Bounded status reporting, including substantive-cycle and transport-retry budgets.

These reds are expected implementation-driving evidence. They are not a PASS and do
not establish control readiness, convergence, or round entry.

## Standing and stop boundary

R-0007 has not started. Its independent reviewer remains unbound, so preparation does
not satisfy the entry gate. This evidence does not bind a reviewer, declare R-0007,
authorize B0 or later round work, or establish review or publication standing.

Deployment remains forbidden. No package publication, tag, GitHub Release, Pages or
other deployment, external release, evidence promotion, real-stynx mutation, or
predecessor mutation is authorized or claimed.
