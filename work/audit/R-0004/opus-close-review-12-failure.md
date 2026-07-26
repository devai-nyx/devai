---
id: R-0004-OPUS-CLOSE-REVIEW-12-FAILURE
title: R-0004 twelfth exact-candidate Opus close-review failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: R-0004-OPUS-CLOSE-REVIEW-11-CORRECTION
superseded_by: R-0004-OPUS-CLOSE-REVIEW-12-CORRECTION
provenance: [Claude Opus 5 read-only review of 62bef480316e27e0e07f804054874e9fc6327b61; BL-183]
---

# R-0004 twelfth exact-candidate Opus close-review failure

The mandated review ran in one tracked terminal session against exact clean candidate
`62bef480316e27e0e07f804054874e9fc6327b61` through literal model selector
`claude-opus-5`, effort `max`, plan permission mode, no fallback, and no Fable use. It
was strictly read-only and returned **`VERDICT: FAIL`**.

The review independently reproduced the complete green ladder, all three
snapshot-specific SHA readings, the BL-182 rejection cases, DII-195 atomicity, and the
entire R-0004 claim boundary. It found one blocking lifecycle defect:
`R-0004-OPUS-CLOSE-REVIEW-11-FAILURE` declares that it supersedes
`R-0004-SOURCE-DECISION-SHA-CORRECTION`, but the latter still declares itself active
with no `superseded_by` edge. A sweep of the 76 Auditor records found no other
in-scope asymmetric edge.

Two non-blocking precision gaps are admitted into the same repair: the active contract
must name the actual SHA scan scope—decision register plus Auditor records—rather than
the overloaded phrase “governed surface,” and the Inspector's snapshot assertion must
match the exact `8 path-classified` phrase rather than any digit `8` in a broad window.

BL-183 blocks source push. Auditor must repair the missing back-edge and pair this
failure symmetrically; Inspector must prove the exact lifecycle link and tighten the
classified-count assertion; Architect must narrow the scan wording and bind a fresh
atomic closing decision. The complete ladder and another literal `claude-opus-5` review
remain required. Nothing was merged, closed, published, released, deployed, or written
to real stynx; every later human gate remains closed.
