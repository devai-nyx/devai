---
id: R-0004-OPUS-CLOSE-REVIEW-CORRECTION
title: First exact-candidate Claude Opus 5 close-review correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-OPUS-CLOSE-REVIEW-FAILURE
superseded_by: null
provenance:
  [
    BL-144–151; DII-171; Inspector 84a9150 and 1f01fff; Architect 96d2477,
    a1dbb5b,
    b187210,
    and 98171a0; Engineer 55ee8d0 and 2ef3936,
  ]
---

# First exact-candidate Claude Opus 5 close-review correction

BL-144 through BL-151 are locally implemented. Inspector `84a9150` established nine
red assertions spanning all eight findings. The red set proved the absent tier binding,
stale trace suite, missing canonical action, two stale policy mirrors, corrupt sensor
notes, mismatched porcelain declaration, partial workflow checker, and two same-line SQL
suppression cases.

The corrected surface contains 186 governed identities: 147 keep, 38 fold, and one
tombstone. `policy check schemas` now registers through `defineCommand`, generic router
dispatch, canonical authority/effect metadata, and generated views. T2 collects both
root and package contract trees; a union guard covers every tracked test. Trace now
materializes 34 invariants and 126 marked tests with the root R-0004 file classified as
contract.

All seven declared policy mirror pairs are byte-identical. The 50 cell-bound notes list
their exact `<substrate>×<property>` values and the nine diagnostic notes remain
cell-free. Every test route uses fixed non-recursive Vitest argv. SQL context covers the
detected operation and exact dev target, so unrelated same-line identities and comma
siblings remain findings. The production workflow checker now validates every remote
`uses:` line for a 40-hex SHA and readable version comment while allowing repository-local
reusable workflow paths.

Focused build, 50 combined repair tests, generated-view parity, trace, workflow lint,
formatting, schema canon, and 186/186 effect analysis pass. The three earlier
exit-ladder failure records and this review failure now carry symmetric superseded
status. Architect must refresh moved deterministic projections, rebind source close,
and restart the complete ladder before a fresh exact Opus review.

No release, external action, threshold, or skip changed.
