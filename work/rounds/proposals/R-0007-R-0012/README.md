# Proposed DEVAI rounds 0007–0012

Status: **adopted migration source; non-runtime**

Created: 2026-08-02
Repository changed: **no**

This directory records the planning source from which OM-019 adopted the dependency-correct
six-round sequence. Canonical committed plans now live directly under
`work/rounds/R-0007` through `R-0012`. This subtree remains non-runtime provenance: it does
not declare, authorize, or execute a round.

## Proposed sequence

| New round | Subject                                                                  | Source material                                  | Structural change                                                                      |
| --------- | ------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| R-0007    | CLI contract, round-subordinate tasks, and executor substrate            | temporary Round 11                               | moved before docs/release; documentation wave split out                                |
| R-0008    | Authenticated cross-gate claim reuse                                     | temporary Round 12                               | moved before docs/release; whole-gate ordinary/stage2/coverage reuse remains forbidden |
| R-0009    | Product semantics, complete user documentation, and deploy-ready site    | repository R-0007 + Round 11 documentation waves | merged documentation work after CLI and convergence semantics stabilize                |
| R-0010    | 1.0.0 release candidate, adopter proof, and separately gated publication | repository R-0008                                | renumbered only; external phase remains pending                                        |
| R-0011    | Evidence-reuse authorization preparation                                 | repository R-0009                                | renumbered only; distinct from build/test result reuse                                 |
| R-0012    | Genuine evidence observation and promotion eligibility                   | repository R-0010                                | renumbered only; fresh Owner mandate remains mandatory                                 |

## Governing interpretation

- Original files remain the historical planning sources and are untouched.
- Existing authorizations are not mechanically renumbered. Authority is subject-specific,
  so each new round requires an Owner/Architect rebind to its new number and exact live
  base. The old R-0007 preparation grant and old R-0008 repository-phase grant are inputs,
  not automatic grants for new R-0009/R-0010.
- No plan reserves a DII identifier or Git SHA. Both are re-read at entry.
- All rounds preserve the predecessor checkout as read-only, unchanged coverage floors,
  role-pure commits, law-before-implementation, red-before-repair, complete convergence,
  and separately authorized external effects.
- R-0010 is the only round containing a possible publication phase, and that phase remains
  stopped until an exact-candidate Owner grant.

See `manifest.json` for the machine-readable mapping and each `round-NNNN/plan.md` for
scope, dependencies, batches, gates, stops, and claim ceiling.
