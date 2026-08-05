---
id: R-0007-PRE-ENTRY-CYCLE1-COMPLETE-CLASS-REPAIR-CERTIFICATION
type: audit
status: current
date: 2026-07-29
authority: Auditor
round: R-0007
provenance:
  - OM-014
  - DII-247
  - independent machinery review cycle 1
  - Inspector 28d07305fd33681aab56cad0bdce00158c9afe0e
  - Engineer acda29ec3e8d3fa7f34da1f2a6198087f9f36755
  - Engineer a4ac90bdd999af12dcf8ffbc8eb44148ab68d1f6
---

# Pre-R-0007 cycle-1 complete-class repair certification

## Exact observed subject

- Base: `722e8a3438f3534260ac4f24c3eecc59e76f905b`.
- Observed implementation head: `6fba1de9401de9f0a79bfe57165548ff539b7f1a`.
- Tree: `87b1c9112d50c5c15ba1a4406367c2f33224481f`.
- Candidate manifest digest:
  `d511748556714cbd798c1cba73913b672a7346801f5cd321d0b04e01a7056e8b`.
- Cycle-2 review-scope manifest before this Auditor record contained 68 topics and
  had digest `c95a009dda4b3e932c11770905848671179137760293d099ee7f6eb04baad230`.
  This record changes the candidate and therefore invalidates that manifest; the
  final review scope must be regenerated from the later frozen candidate.

## Complete-class repair population

The exact focused population passed together:

- `tests/contract/pre-r0007-cycle1-defect-classes.red.contract.test.ts`: 11/11.
- `tests/contract/pre-r0007-impact-dag.adversarial.contract.test.ts`: 6/6.
- Combined legacy, cycle-1, and DAG contracts: 30/30.
- Schema population: 14 files and 102 tests.

The eight retained defect classes are structurally present as mandatory cycle-2 topics:

1. `BINDING_CENSUS_ABSENT`;
2. `AUTHORITATIVE_GATE_POPULATION_OMITTED`;
3. `CONSERVATIVE_WIDENING_DEAD`;
4. `CACHE_RECORD_IDENTITY_UNBOUND`;
5. `REVIEW_CENSUS_AND_CANDIDATE_PROOF_INCOMPLETE`;
6. `REVIEW_REUSE_AND_STREAM_CANONICALITY`;
7. `REVIEW_STATE_TRANSITION_BYPASS`; and
8. `CLAIM_DIGEST_PLACEHOLDER_ACCEPTED`.

No point instance is used as complete-class standing. The authoritative population and
machine-checkable repair conditions remain in
`work/rounds/R-0007/prior-finding-registry.json`.

## Full acceptance observed

- `pnpm run devai:prepare`: PASS and no tracked write.
- `pnpm vitest run`: 161 files PASS; 1,519 tests PASS; 8 governed skips.
- `pnpm run ci:stage1`: PASS.
- `pnpm run ci:stage2`: PASS; T1 1,024/1,024 and T2 407 PASS with one governed skip.
- T4/T5/T6: 4/4, 25/25, and 3/3 PASS.
- Whole T1-T3 coverage: 72.45% statements, 60.75% branches, 81.14% functions,
  and 73.90% lines; unchanged floors remain green.
- Changesets and governance: PASS; governed sequencing binds both cycle-1 Engineer
  repair commits to the exact prior Inspector red and durable Auditor evidence.
- Preparation policy: PASS with the required unbound diagnostic standing.
- Entry check: intentionally FAIL with only `ENTRY_BLOCKED_REVIEWER_UNBOUND`.

## Cold and warm convergence

At observed implementation head `6fba1de9…`, cold smart convergence executed all 16
authoritative policy gates in pass 1 and freshly reused all 16 in pass 2. The
supplemental DAG executed 12 affected test nodes in pass 1 and freshly reused those 12
in pass 2. Exact head remained stable and pass boundaries were clean, no-write, and
equivalent.

An identical warm invocation executed zero authoritative gates and zero affected test
nodes. Each pass freshly reused all 16 policy gates and all 14 planned DAG nodes. The
warm invocation started no fresh test process.

This Auditor record invalidates the observed implementation-head candidate and its
convergence evidence. The final review candidate must reconverge cold and warm, create
a new authentic candidate manifest, and regenerate the complete cycle-2 scope.

## Honest red and stop boundaries

The prospective current-claim source remains in `registry` mode because R-0007 has not
started and has produced no site artifact, source PR, exact-head CI population, or B8
Auditor materialization. `claims-check` therefore reports `CLAIM_UNRESOLVED`; this red
is preserved and is not relabelled as a machinery PASS. The materialized-claim
adversaries pass and prove that forged source and value digests are rejected.

R-0007 remains not started. Its reviewer slot remains unbound. No deployment,
publication, release, evidence promotion, real-stynx mutation, or predecessor mutation
is authorized or observed.

## Certification

The F001-F008 repair implementation is complete enough to become a new review candidate
only after this record is committed and the exact resulting head reconverges. The final
independent machinery review is cycle 2 and the last substantive review allowed by
OM-014. A cycle-2 failure requires `ESCALATION_REQUIRED`; cycle 3 remains forbidden.
