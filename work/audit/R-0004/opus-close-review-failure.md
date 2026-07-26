---
id: R-0004-OPUS-CLOSE-REVIEW-FAILURE
title: First exact-candidate Claude Opus 5 close-review failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate 1bcaf5d9120976c296e85160b478495f5a47aba0; literal claude-opus-5; BL-144–151]
---

# First exact-candidate Claude Opus 5 close-review failure

The mandated read-only review ran in one tracked terminal session through exact model
selector `claude-opus-5`, with no fallback, against clean candidate
`1bcaf5d9120976c296e85160b478495f5a47aba0`. It returned `VERDICT: FAIL` after
independently re-deriving the otherwise-green action, effect, schema, sensor, package,
reference, trace, workflow, governance, test, and claims evidence.

The review found eight actionable gaps:

1. BL-144: the root R-0004 contract matches no T1–T6 include glob while law and trace
   treat it as an executing integration guard;
2. BL-145: public `policy check schemas` bypasses the canonical action registry and is
   hard-coded in the router;
3. BL-146: forbidden-action and subprocess-effect `.devai/config` materializations are
   byte-stale against law;
4. BL-147: all 50 cell-bound sensor notes render cell objects as `[object Object]`;
5. BL-148: same-line production SQL can borrow an unrelated allowed dev identity;
6. BL-149: declared build/test argv differs from production and unit selection recurses;
7. BL-150: two superseded failure records remain status `active`; and
8. BL-151: immutable workflow pin validation is partial and one stronger test is gated
   on a nonexistent release workflow.

The source PR remains prohibited. Each item requires a role-pure red-first correction,
fresh deterministic projections, a complete exact-candidate ladder, and a new literal
`claude-opus-5` close review. No release or external human gate changed.
