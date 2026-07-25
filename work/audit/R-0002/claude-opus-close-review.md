---
id: R-0002-CLAUDE-OPUS-CLOSE-REVIEW
title: R-0002 independent Claude Opus 5 close review
type: independent-review
status: draft
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-003; OM-005; claude-opus-5 exact-candidate read-only review of 00531f7876ca528051fdd922e001b95b6ed3f838,
  ]
---

# R-0002 independent Claude Opus 5 close review

The Owner confirmed quota recovery on 2026-07-25. The orchestrator invoked the exact
model selector `claude-opus-5` with no fallback, in safe/read-only plan mode, against
the committed base-to-candidate range
`cc0084ba38fb6d583f79fddd38554524714c4fa4..00531f7876ca528051fdd922e001b95b6ed3f838`.
Write and network tools were denied. The worktree was clean before and after review.

## Verdict

**FAIL. The exact candidate may not advance to push or remote checks.**

## Actionable findings

### High

1. Commit `00531f7` added seventeen projection wrappers that import existing contract
   suites into T1/T3-selected paths. This changes the measured test population without
   changing the coverage configuration and violates OM-004's explicit anti-laundering
   boundary. The doubled reading is not a like-for-like proof.
2. The final as-built predates seven later Inspector commits. DII-121 and its bound
   as-built do not cover OM-005, DII-122, DII-123, BL-058, or the final coverage work.
3. The as-built and closing law still state BL-017 is red even though the supplied
   exact-candidate command passes the unchanged 70/60/70/70 thresholds.
4. The prepared PC-0003 ceremony instructs the machine to record
   `coverage-t1-t3` as failed. Following it after a green gate would append a false
   immutable proof.

### Medium

1. The phase-closure validator requires `merged_as` and `release_disposition` only for
   numeric IDs at or above seven, so successor PC-0003 may omit its source-merge
   binding.
2. Failed-gate acknowledgment uses substring matching and admits empty or ambiguous
   gate keys.
3. The trace command counts an invariant as traced before requiring a test link.
   Eleven of 34 invariants have empty `tests` arrays despite `require_test_links: true`.
4. Trace generation is stale and non-regenerable: the tracked corpus contains more test
   files than the generated trace and several R-0002 tests lack invariant markers.
5. The as-built cites a nonexistent `zero untraced tests` metric.
6. DII-117 overstates the round-archive implementation survey. The deprecated
   implementation still reads `record/proofs/closures`, and its archive acceptance is
   incompatible with the closure verb's required failed-gate acknowledgment.
7. The projection wrappers cause the root Vitest floor to execute the same contract
   suites twice.
8. The backlog census and round-ownership table stop at BL-050 while the register
   contains BL-051 through BL-058.

### Low

1. The as-built overstates the active-Fable selector contract, carries a stale
   correction boundary, and cites claims not produced by the named command.
2. `law/register/DECISIONS.md` says entries are unnumbered although the successor
   register uses DII identifiers.
3. Operational-law materialization remains nondeterministic and lacks a complete
   byte-identity CI assertion.
4. Some sort/prewarm helpers have platform- or insertion-order dependence.
5. The coverage commit widened the test-only read-process classifier with `rev-list`
   without recording that test-harness change.
6. Cold-Corepack equivalence remains only partially secured in remote jobs.

## Sound boundaries observed

Opus found role purity and red-first history sound through BL-058, no predecessor
mutation, no ratification/release/deployment/readiness inflation, byte-identical current
authority-policy mirrors, truthful narrow Machine attribution, unchanged historical
Fable records, and an honestly unexecuted two-PR ceremony.

## Required disposition

Remove the projection wrappers or govern a real lane change; obtain like-for-like
coverage; repair closure merge/gate validation red-first; restore trace non-vacuity and
regeneration; reconcile every stale claim and backlog record; write a final exact
as-built; mint a later closing decision; then request a fresh exact-candidate
`claude-opus-5` review before push.

## Claims ceiling

The reviewed candidate was substantially complete and role-pure, but its coverage
proof and close artifacts were not truthful for HEAD. Nothing is ratified, released,
deployed, ready, or granted evidence standing.
