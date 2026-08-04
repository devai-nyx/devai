---
id: om-018-readiness-certification
title: Readiness certification for Review Run 2 under the OM-018 admission gate
type: audit-record
status: active
date: 2026-08-03
authority: Auditor
supersedes: remediation-3-pre-freeze-certification
superseded_by: null
provenance:
  [
    OM-018,
    work/audit/R-0007-pre-entry/om-018-admission-gate-evidence.json,
    work/audit/R-0007-pre-entry/remediation-4-readiness-pre-check.md,
    work/rounds/R-0007/om-018-deferrals.json,
  ]
---

# Readiness certification — OM-018 admission gate

## This record does not identify its own commit

Two earlier certifications in this campaign named the commit that introduced them as "the
actual head", which is impossible: an audit record cannot verify the commit that creates it.
This record therefore binds an exact prior commit, states its own delta, and defers the
terminal claim to a run performed **after** this record exists, whose result is retained
outside the repository.

## What was observed, and where

| Item                 | Value                                      |
| -------------------- | ------------------------------------------ |
| Semantic candidate S | `0cdc2967fffa63398b0655fafbe4ae6b6324f0f3` |
| Tree at S            | `d6a4e4c17e64539d66856aac31f559a1c307418c` |
| Gate result at S     | sixteen rows, all exit 0                   |
| Evidence             | `om-018-admission-gate-evidence.json`      |

At S: a non-shared detached clone, `pnpm install --frozen-lockfile --offline` exit 0, and all
sixteen literal argv rows executed once each in declared order with no injected arguments,
every one exiting zero. `ordinary` 168 files / 1787 passed / 8 skipped / 0 failed. Coverage
72.46 / 60.78 / 81.14 / 73.9 against floors 70 / 60 / 70 / 70. Working tree clean before and
after; HEAD and tree identical across the run.

## Where the terminal claim lives, third construction

Two earlier constructions of this section failed. A file count changed each time it was
corrected, because the correcting commit joined the delta it counted. The invariant that
replaced it — every delta path under `work/audit/` or `work/rounds/R-0007/` — was then broken
by legitimate Inspector repairs to expiring test fixtures, and the breakage went unnoticed:
an in-repo record that names a baseline ages exactly like the fixtures it was correcting for.

This record therefore binds **no SHA and no delta**. It states the procedure, and the exact
identity lives in the terminal attestation, which is retained outside the repository so that
recording it cannot invalidate it:

1. All role commits for a candidate are batched; the tree goes clean.
2. The sixteen-row gate runs once, cold, at that exact detached HEAD: non-shared clone,
   frozen offline install, argv verbatim from policy, every exit retained, HEAD and tree
   unchanged across the run.
3. The external attestation names the SHA, the tree, the sixteen exits, and the figures.
   A green attestation at a SHA is the admission evidence for that SHA and no other.

## Corrections to the superseded evidence record

`om-018-admission-gate-evidence.json` (candidate `0cdc296`) claimed
`each_row_executed_once: true`. Transitively that was false. Three roster rows execute the
test suite, which then contained `R7-005-SIXTEEN-LITERAL-DETACHED`, which spawned all sixteen
rows again: one nominal run performed four roster traversals — 64 row invocations, of which
48 were unrecorded, ran under `DEVAI_R7_DETACHED_GATE=1`, and used `--shared` clones — a
different isolation model than the record describes. The claim was true only of the runner's
immediate children. That contract is now deleted and its property deferred with the loss
named in `work/rounds/R-0007/om-018-deferrals.json`; after the deletion, one run of the
sixteen rows is genuinely one execution of each.

## What is proved

- The admission gate as OM-018 defines it, at S.
- Role purity and governed sequencing across 242 commits.
- The implementation-path manifest gate, which prevents recurrence of the ordering class that
  produced both historical exceptions.
- 37 of 45 closure classes pre-entry and green, verified inside the gate's `ordinary` row.

## What is not proved, and is not represented as proved

- The machinery OM-018 defers: freshness optimization, affected-test selection, the review
  transport and state machine, the closure matrix as an admission gate, the prior-finding
  topic census, and two-pass smart convergence. Eight classes are deferred as governed records
  in `work/rounds/R-0007/om-018-deferrals.json`. `full_round_closure` remains **BLOCKED** and
  enumerates every deferred id, so a pre-entry pass cannot be read as round closure.
- Any commit other than S, pending the terminal run described above.

## Declared limitations a reviewer may challenge

1. **Two disclosed ordering exceptions.** `bef98f9` shipped root `vitest.config.ts` and
   `775f47d` touched `packages/schemas/src/roster.ts`; neither was named by its bound
   prospective red. Neither is repairable forward without rewriting history. Two instances in
   one campaign may fairly be read as a pattern rather than an accident. The manifest gate now
   makes a third mechanically impossible on this branch.
2. **Branch coverage has 0.78 points of margin** above its floor, at 60.78 percent.
3. **The gate depends on a pnpm store path outside the repository.** Correct to refuse rather
   than fall back silently, but fragile.
4. **`R7-004-CLOSURE-FIXPOINT` asserts the derivation, not the declaration.** The graph rebind
   is covered by `policy-check` reporting no `GATE_COMMAND_CLOSURE_DERIVATION_INVALID`.
5. **The matrix has no mechanical force.** The controller reads neither `closure_state` nor
   `GREEN_PROVED`. It is a disclosure register, and OM-018 stops treating it as a gate.

## Review Run 2

Review Run 2 reviews only the admission gate and the B0 handoff. The budget remains one run,
unspent. Review Run 3 is forbidden. If Run 2 fails at this scope, the campaign stops at Owner
escalation with a candidate an order of magnitude smaller than the one that failed Run 1.

B0 remains unbound and R-0007 has not started. `entry-check` reports
`ENTRY_BLOCKED_DECLARATION_UNBOUND`, which is correct for this state.
