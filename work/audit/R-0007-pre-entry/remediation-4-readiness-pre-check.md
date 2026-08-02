---
id: remediation-4-readiness-pre-check
title: Independent readiness pre-check of the campaign-3 candidate, and the R7-F012 finding it produced
type: audit-record
status: active
date: 2026-08-02
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-017,
    DII-253,
    work/audit/R-0007-pre-entry/remediation-3-pre-freeze-certification.md,
    work/audit/R-0007-pre-entry/remediation-3-repair-handoff.md,
  ]
---

# Independent readiness pre-check — candidate `46fdc770`

## Why this record exists

The campaign-3 candidate was certified fit to freeze at `60ea6ab`, amended at `46fdc770`.
Before spending the sole remaining substantive review, the Owner commissioned independent
re-checks of that certification by two agents outside this session. They returned NOT READY.

One of the two findings survived verification and produced a new P0 defect class, R7-F012.
The certification was wrong on the merits, not merely in its wording. This record states
what was checked, what held, what did not, and what the certification claimed that it should
not have.

## Verdict

**The candidate is not fit to freeze.** Review Run 2 is not spent. The review budget remains
1, unspent.

## What the independent pre-check claimed, and what survived

| Claim under test                                       | Pre-check verdict | Adjudication after verification                                                                                                                                                        |
| ------------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sixteen literal commands pass in one uninterrupted run | UNVERIFIABLE      | **Upheld as unestablished.** The observation was made at `6c4c687`; the head was two commits later. The pre-check's own run was interrupted and yields nothing either way.             |
| The battery passes at the candidate                    | UNVERIFIABLE      | **Upheld as unestablished**, for the same reason.                                                                                                                                      |
| Commits are role-pure                                  | CONFIRMED         | Holds. `ci:sequencing` PASS over 218 commits.                                                                                                                                          |
| Red evidence precedes every implementation commit      | REFUTED           | **The claim was overstated; the defect is not repairable.** See "The `bef98f9` exception" below.                                                                                       |
| The matrix is a superset of the OPEN registry          | CONFIRMED         | Holds.                                                                                                                                                                                 |
| No decision-id literal in the controller               | CONFIRMED         | Holds.                                                                                                                                                                                 |
| The audit records do not contradict each other         | REFUTED           | **Upheld.** Two defects: a stale self-referential head claim, and a precedence rule substituted for reconciliation. Both are repaired in the superseding records of this campaign.     |
| Four coalesced edges unbound — disqualifying           | DISQUALIFYING     | **Reasoning wrong, conclusion right for a different reason.** It conflated edge discrimination with predecessor lineage. Verification found the live defect recorded below as R7-F012. |
| Pre-B0 convergence unavailability — disqualifying      | DISQUALIFYING     | **Rejected, and retracted by the pre-check on review.** Scope, not defect: those obligations require a bound B0 declaration that OM-017 places in R-0007 execution. Owner confirmed.   |
| `R7-004` asserts derivation not declaration            | ACCEPTABLE        | Accepted. Retained as a declared limitation.                                                                                                                                           |

## R7-F012 — undeclared state-machine control selector

`UNDECLARED_STATE_MACHINE_CONTROL_SELECTOR`, severity P0, disposition OPEN.

OM-017 §4 requires that each transition authenticates the complete exact persisted
predecessor artifact, and that all twelve edges are executable mutation populations. The
implementation did not meet that requirement.

`review-scope` constructs the preflight, freeze and activation transitions as one atomic
burst and calls `persistStateV5` once, so the intermediate states are never materialized.
Four edges are then exempted from predecessor-artifact corroboration by a hard-coded set of
edge literals in the controller, which returns before the corroboration branch whenever
`previous_state_digest` is null.

Reachability is production-real. A state artifact presenting a null predecessor on any of
those four edges recomputes its transition, history and state self-digests, satisfies the
remaining identity constraints, and passes. The exemption is not neutralized by an earlier
check.

The claim that those transitions receive _no_ corroboration would be too strong, and is not
made here. Edge membership, history continuity, the previous-transition digest, the
transition self-digest, the cycle derivation and the canonical history digest are all still
enforced. What is absent is corroboration of a complete predecessor **state artifact**, which
is the specific property OM-017 §4 names.

Three aggravating facts:

- Policy already declared `canonical_history.first_predecessor` as
  `null-only-for-DRAFT-origin`. The implementation contradicted a declaration that already
  existed, not merely a mandate.
- `control_capabilities` already declared `predecessor_artifact_authentication: true` and
  `review_scope_state_persistence: true`. The capability was declared enabled and partially
  disabled in implementation.
- The condition was disclosed as a declared limitation rather than repaired, and the
  limitation described the behaviour as a property of the machine when it was a property of
  the implementation.

The selector population is wider than the exemption. Edge-to-cycle derivation, the emitted
transition sequences, state and cycle sets, the canonical cycle-1 prefix, repair and terminal
guards, cycle and retry budgets, blocked-state mapping, the verdict-to-next-state mapping and
the initial state are all selected by literals in the controller. Several duplicate
declarations that already exist in policy and are free to drift from them. The contract
harness mirrors the same literals, so the oracle could not detect controller drift. The
complete enumeration is recorded in the registry entry for R7-F012.

`law/policy/round-close-controls.json` was itself loaded without schema validation;
`loadV4Context` validated the round profile only.

## Claims this Auditor made that were wrong

Stated here because a superseding record that quietly drops a false claim is worth less than
one that names it.

1. **"No schema floor lowered" was false.** `law/schemas/remediation-closure-matrix.schema.json`
   carried a clause stating that a class may be `GREEN_PROVED` while a named boundary of its
   population remains unbound, provided the boundary is declared. `git log -S` locates it at
   `9038a7d`, authored by this campaign, and the matrix closure then rested on it. Naming an
   unproved boundary had become a way to keep a closure state the class had not earned.
2. **"All 43 classes GREEN_PROVED" was false.** R7-F002's own `required_behavior` requires that
   for every edge an executable case spawns the controller so the transition is persisted. The
   contract writes the state artifact directly instead. Eight classes rested on that or on
   predecessor authentication and are returned to RED_REQUIRED.
3. **The certification named its own containing commit as "the actual head."** An audit record
   cannot verify the commit that introduces it.
4. **A precedence rule was substituted for reconciliation.** Declaring which of two disagreeing
   records governs does not make them agree.
5. **`git clone --shared` was described as hermetic.** It borrows the origin object store
   through alternates. Hermeticity claims resting on it were weaker than stated.
6. **Three mutations were treated as adequate discrimination evidence** for a population far
   larger than three.

## The `bef98f9` exception

The claim "red evidence precedes every implementation commit" was overstated and must be
stated once, with the exception named: every substantive Engineer commit has qualifying prior
red evidence **except** the disclosed exact historical exception `bef98f9`, which added root
`vitest.config.ts` after the bound Inspector red at `3e863e5`.

No forward repair removes it. `scripts/check-governed-sequencing.mjs` associates exceptions by
exact commit SHA present in history, and history is not rewritten, so the commit remains an
implementation commit requiring the exception permanently. Deleting the file today does not
change that. Twelve exception entries covering fourteen commits already exist across R-0005,
R-0006 and R-0007 under the same policy-provided mechanism.

The Owner accepted it as a disclosed exception on 2026-08-02. Calling a truthfully disclosed
exception disqualifying was withdrawn by the pre-check; claiming no exception exists would
remain refuted.

## The long-running command is not a defect

Both the interrupted pre-check run and a subsequent local run were read as stalls. They are
not. Direct process inspection during the second run showed the live descendant to be
`pnpm install --offline --frozen-lockfile --store-dir …`, respawned once per hermetic contract
case. `pre-r0007-remediation-4.red.contract.test.ts` carries 51 contracts and
`R7-005-SIXTEEN-LITERAL-DETACHED` performs a real offline install per case, so multi-minute
silence is expected behaviour; the reporter buffers to completion, which is why the stream
appeared empty.

No conclusion is drawn from this in favour of readiness. An interrupted run is INCONCLUSIVE
and yields no rows, not the rows it had already produced. The prior 16/16 observation is
neither confirmed nor refuted by it and must be re-established at the final head.

The authoritative argv is not modified. No `CI=1`, no `--watch=false`, no injected argument.

## Consequences recorded in law

`61b32a8` records DII-253, registers R7-F012, replaces the escape clause with a mechanically
enforced floor, declares the state-machine control vocabulary in policy, adds the first schema
for the policy document, splits the verdict into `pre_entry_ready` and `full_round_closure`,
and returns the eight affected classes to RED_REQUIRED.

The repair is sequenced Inspector red and implementation-path manifest, Auditor red
observation, Engineer repair, Inspector green and adversarial verification, Auditor subset
check of the implementation diff against the manifest, Architect closure recomputation,
Auditor superseding result. No Engineer change precedes the durable red observation.
