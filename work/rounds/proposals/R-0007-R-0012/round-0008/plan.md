---
id: R-0008-PROPOSED-RESEQUENCED-PLAN
title: Authenticated cross-gate claim reuse
type: temporary-round-plan
status: draft-non-authoritative
date: 2026-08-02
source: work/rounds/R-0008
---

# R-0008 — Authenticated convergence-claim reuse

## Objective

After the CLI/executor surface stabilizes, introduce fail-closed, independently
reproducible reuse of a prior gate's **equivalent assertion result**. Preserve all sixteen
literal authoritative commands, their standalone clean-checkout executability, unchanged
test populations, coverage thresholds, stage2 build/order assertions, and distinct
instrumented/uninstrumented environments.

## Non-equivalence boundary

No whole-result reuse edge among `ordinary`, `stage2`, and `coverage` is sound:

- ordinary does not prove V8 instrumentation, outputs, or 70/60/70/70 thresholds;
- ordinary does not prove build-before-T1 or separate ordered T1 then T2 processes;
- stage2 does not prove the combined all-tier root run;
- coverage does not prove the uninstrumented root run or stage2 ordering/build.

Reuse is limited to mechanically derived sub-claims whose canonical contracts are
identical. Any absent, stale, ambiguous, unsigned, unauthenticated, unreproducible, or
non-equivalent result executes; if safe execution cannot be formed, it blocks.

## Entry gates

- R-0007 is merged/closed and its final CLI, schemas, command registry, tests, and task
  executor evidence are stable.
- A new Owner mandate binds R-0008, the independent reviewer, Ed25519 verification trust
  root/trust epoch, private-key custody boundary, and non-release scope.
- Architect resolves the existing role-purity versus same-commit projection issue without
  a mixed-role exception; otherwise stop.
- Exact command/test populations and coverage configuration are re-derived from live base.
- All prior convergence controls and 70/60/70/70 are green.

## Identity contract

The claim key binds schema version; claim kind/assertion; candidate commit/tree and
history-sensitive range; normalized argv/cwd/process boundaries/order/instrumentation;
recursive command closure; complete discovered population and config; transitive inputs;
dependency keys/results; environment; toolchain; policy/profile/graph/schema/threshold and
trust digests; required outputs; executed PASS body; key ID and trust epoch.

Producer/consumer gate IDs, round ID, timestamps, PID, duration, cache path, and incidental
log location are not equivalence inputs. Gate IDs and round remain signed provenance.
Signature is outside the identity to avoid a cycle. Expected identity is recomputed from
trusted candidate/runtime sources **before** reading the result; the result never supplies
the identity used to authenticate itself.

## Batches

| Batch | Role                 | Work                                                                                                                                                  | Gate                                     |
| ----- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| B0    | Owner + Architect    | Bind mandate, exact base, reviewer, trust root, declaration, and next free DII                                                                        | no ambiguous authority                   |
| B1    | Architect            | Define generic capabilities, claim/attestation schemas, policy/profile/graph, protected properties, atomic derivation, and closure matrix             | unchanged 16-command roster              |
| B2    | Inspector            | Red complete equivalence, property-loss, signature, replay, self-authentication, false-green, atomicity, benchmark, and literal-execution populations | specific check/ordinal/identity payloads |
| B3    | Auditor              | Preserve immutable red evidence with correctly named file/suite/case counts                                                                           | every class RED_PROVED                   |
| B4    | Engineer             | Implement derivation, independent recomputation, signature verification, ambiguity fallback, provenance, and capability-gated rollback                | all adversaries green                    |
| B5    | Inspector            | Exhaust every key component, all 16 ordinals, both passes, protected gates, signer states, order and output tamper                                    | no false REUSE_FRESH                     |
| B6    | Auditor              | Execute detached literal roster and paired correctness-first cold/warm benchmark                                                                      | equal populations before timing          |
| B7    | Auditor + Architect  | As-built, atomic projections, closing decision, two-pass convergence                                                                                  | pass 2 no-write                          |
| B8    | independent reviewer | Complete two-cycle review under Owner-bound selector                                                                                                  | cycle 3 forbidden                        |
| B9    | authorized close     | Close only after exact-head full uncached CI                                                                                                          | no release/deployment effect             |

## Acceptance and timing

- Every reusable result has a valid trusted signature and independently reproduced identity.
- Cache writer access alone cannot forge PASS; replay succeeds only under exact identity.
- Invalid reuse retains all sixteen ordered terminal records and never freezes a candidate.
- Each literal command passes alone from empty runtime state with no signer/cache prerequisite.
- Protected gate properties and coverage floors are unchanged.
- The paired benchmark compares exact equal gate/claim/file/suite/case/threshold/output
  populations before duration. Whole-gate saving for the three named gates is expected to
  be zero. Positive sub-claim saving is unbound until the producing benchmark; zero or
  negative saving leaves activation disabled.

## Stops, rollback, and claim ceiling

Stop on missing trust authority, private-key exposure, self-digested-but-unsigned reuse,
identity sourced from cache, ambiguous result accepted, false green, population/property
loss, projection non-atomicity, role impurity, threshold change, or predecessor/external
effect. Rollback disables the capability, increments/revokes trust epoch, ignores runtime
cache, and reruns literal gates; it never removes a gate. Completion claims only a verified
local convergence optimisation. No property is surrendered and no release is authorized.
