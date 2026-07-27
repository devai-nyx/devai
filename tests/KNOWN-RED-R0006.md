# R-0006 entry-control known red

At E1, exact declaration commit `6f8ee85370690b8aac4ed9d4b57657d98d9cabd2`
authorized the control-prelude red sequence. The Inspector ran:

```text
pnpm vitest run tests/contract/r0006-entry-control.red.contract.test.ts
```

The command exited nonzero with one collected file and eight failing behavioral
contracts. The failures were read before any E2 semantics or E3 implementation:

1. candidate-only publishability returned no classification for four identities held
   only by another branch, reflog, stash, or the ambient object database;
2. abbreviated, invented, wrong-kind, unresolved, and unclassified identities returned
   no required fail-closed diagnostics;
3. fixed-window and overbroad-range requests returned no exact-range diagnostics;
4. stale formatting, trace, repository-reference, generated-view, materialization,
   lint, and typecheck gates plus a dirty tree returned no convergence diagnostics;
5. post-PASS changes across every frozen semantic and current close-artifact class
   returned no invalidation diagnostics;
6. a second Auditor record, uncaused projection, and projection-source mutation returned
   no review-envelope diagnostics;
7. the valid closure-only ancestry case could not run, and missing prerequisites could
   not be classified; and
8. fixed counts, self-comparisons, narrow named-file scans, and policy mirror drift
   returned no semantic-assertion diagnostics.

The common immediate cause was the intentionally absent Engineer-owned
`scripts/run-round-close-controls.mjs`. These failures establish the exact behavioral
surface for that script and the generated
`.devai/config/round-close-controls.json` materialization. They authorize no B0 work,
threshold change, public action, release, or retained red at E5.
