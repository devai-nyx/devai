---
id: R-0003-AS-BUILT
title: R-0003 founding-ratification as-built
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0003-OPENING-AUDIT; DII-148; DII-149; DII-150; source snapshot e064d0f261a2554efd6f2fba12f75090a06a8843,
  ]
---

# R-0003 founding-ratification as-built

## Boundary and verdict

R-0003 has completed its local founding-law implementation at source snapshot
`e064d0f261a2554efd6f2fba12f75090a06a8843`. The implementation satisfies the
ratification acceptance criteria locally. It is not yet the source candidate, merged
main, or a closed round: the required independent Opus review, exact-SHA remote CI,
source merge, exact-main CI, closure-only machine record, and final exact-main CI still
follow.

The only claim this work can establish is **founding law ratified**. No release,
deployment, publication, readiness, evidence promotion, autonomous operation, or
predecessor standing is claimed.

## Ceremony result

- Constitution 1.0.0 has 42 unique ordered articles and an exact 42-row source
  disposition ledger.
- Article 42 remains in Part XI under DII-098 without anchor churn.
- Constitution frontmatter uses the binding `active` lifecycle; its wrapper and body
  state 1.0.0/ratified.
- DII-150 and `GEN-0001` bind the single ceremony time
  `2026-07-25T22:08:05Z`.
- ADR-001 through ADR-012 are gapless, active, complete in all six required sections,
  and explicitly supersede their named historical inputs. ADR-003 retains
  `must-re-earn` standing.
- GE-001 through GE-044 are active under the recorded Owner marks and Architect act;
  every glossary and invariant reference resolves.
- The genesis predecessor binding, absorption hashes, empty imported-evidence set, and
  nonclaims remain unchanged by ratification.

## Exact bindings

| Artifact                      | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Ratified Constitution         | `b005ba4ba57979d471a1a139e093f8e7d158ae03488c394d3f43561ca9c4c631` |
| Ratified genesis attestation  | `d72711c57e54025ebd2626b2ba20a1263db7d914e308d7d4ce172f4faee6bb09` |
| Canonical authority policy    | `6f62027f4dd3cb9d29daaa7d6b9a288176a9bc56979a3c9ca370cbd0ef2978c2` |
| Materialized authority policy | `6f62027f4dd3cb9d29daaa7d6b9a288176a9bc56979a3c9ca370cbd0ef2978c2` |

The self pin resolves to the exact Constitution bytes. Both policy copies are
byte-identical, retain the same resolved rules digest, and bind the ratified
Constitution version and digest.

## Role-pure batches

| Batch                     | Role      | Commit(s)            | Result                                                                                                  |
| ------------------------- | --------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| B0                        | Auditor   | `7f44d1e`            | Independently re-derived R-0003 entry.                                                                  |
| B1                        | Architect | `250eac1`            | Declared the round and completed the 42-article source ledger.                                          |
| B2                        | Architect | `ebeb320`            | Accepted the twelve successor ADRs.                                                                     |
| B3                        | Owner     | `986cb62`            | Recorded all founding glossary setpoint marks.                                                          |
| B4                        | Architect | `0488750`            | Applied the joint glossary act and ratified Constitution/genesis.                                       |
| B5                        | Engineer  | `21bf62a`, `9946a44` | Executed and normalized the authorized policy materialization.                                          |
| B5 mirror                 | Architect | `4be5f12`            | Synchronized the canonical policy bytes.                                                                |
| B6                        | Inspector | `65d8f6d`, `e064d0f` | Bound the ceremony and stabilized the coverage-only instrumentation budget without changing assertions. |
| Deterministic projections | Architect | `e3b85d2`, `eee11a8` | Refreshed repository-reference and trace projections.                                                   |

## Fresh exact-snapshot gates

The complete exit ladder was restarted after every discovered stale projection or
measurement defect. On exact snapshot `e064d0f261a2554efd6f2fba12f75090a06a8843`:

- workflow lint, trace no-write, ESLint, and TypeScript passed;
- strict forbidden-action coverage passed all 16 canonical actions;
- decision integrity and decision citation resolution passed with zero findings;
- trace resolution passed 34/34 invariants across 122 executable test files with zero
  missing or unresolved references;
- docs drift passed with zero blocking drift;
- T1 passed 70 files / 813 tests;
- T2 passed 34 files / 200 tests / 1 declared skip;
- merged T1+T3 coverage passed 79 files / 869 tests / 7 declared skips;
- T4 passed 2 files / 4 tests;
- T5 passed 6 files / 25 tests;
- T6 passed 1 file / 3 tests;
- changeset classification passed with zero pending changesets;
- repository-wide Prettier, `git diff --check`, and tree cleanliness passed.

The complete ordinary Vitest floor separately passed 122 files / 1,101 tests with 8
declared skips.

## Coverage

The unchanged 70/60/70/70 floors remain green:

| Metric     |                  Reading | Floor |
| ---------- | -----------------------: | ----: |
| Statements | 70.61% (10,515 / 14,890) |   70% |
| Branches   |  61.00% (7,632 / 12,510) |   60% |
| Functions  |   77.27% (1,496 / 1,936) |   70% |
| Lines      |  72.88% (9,705 / 13,316) |   70% |

The first audit-ladder attempt correctly stopped on a stale trace projection introduced
by the new Inspector contract. After deterministic regeneration, the coverage lane
exposed that one multi-fixture post-merge adversarial test exceeded the generic five
second budget under concurrent instrumentation. Its assertions passed in isolation; the
Inspector raised only that test's instrumentation budget to twenty seconds. The exact
snapshot then passed both ordinary and coverage lanes without skipped assertions or
threshold changes.

## Remaining ceremony

The next steps are the Architect closing decision, exact-model read-only Claude Opus 5
review, exact-candidate local recheck, source PR and exact-SHA CI, source merge and
exact-main CI, then the machine-only PC-0004 closure PR and final exact-main CI. Until
those complete, R-0003 is locally implemented but not closed and R-0004 must not begin.
