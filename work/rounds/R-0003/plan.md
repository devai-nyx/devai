---
id: R-0003-PLAN
title: Founding ratification
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; BL-004; BL-005; BL-006; R-0002 exit handoff]
---

# R-0003 — Founding ratification

## Objective and claims ceiling

Ratify Constitution 1.0.0, disposition ADR-001 through ADR-012, and jointly ratify or
supersede the successor glossary. This is a law ceremony, not a release ceremony.

## Entry gates

- R-0002 is merged and closed.
- A fresh Auditor observation re-derives the frozen bindings, PC-0002, attestation
  digest, production-law results, and exact-main CI.
- Every production law command is green at ceremony time.
- `ratified` is still null before the ceremony.
- Coverage is independently re-run and must retain the all-green R-0002 floors.

## Batches

| Batch | Role                                 | Work                                                                                                                                                         | Commit gate                                        |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| B0    | Auditor                              | Independent R-0002 entry audit; no reuse of R-0002’s own conclusion                                                                                          | All cited facts re-derived                         |
| B1    | Architect                            | Declare R-0003; complete the 42-article source crosswalk; decide Article 42 placement; reconcile wrapper/version/status without doctrine drift               | Crosswalk total, anchors, law checks               |
| B2    | Architect                            | Review ADR-001..012 under their lifecycle; accept or supersede each; preserve `must-re-earn` standing and A1–A3 deltas                                       | Six sections, gapless IDs, citations, ADR checks   |
| B3    | Owner                                | Record approved glossary setpoint marks and rationale under `product/`; do not edit `law/`                                                                   | Every Owner mark traceable to OM-002/R-0001 review |
| B4    | Architect                            | Apply the recorded marks to `law/glossary/`, finalize its lifecycle, ratify Constitution 1.0.0 and the genesis attestation, and append the ceremony decision | Glossary/invariant graph and full law suite        |
| B5    | Engineer via authorized materializer | Re-materialize authority policy and vendored constitution/checksum against the exact ratified digest                                                         | Byte identity and upgrade-path tests               |
| B6    | Inspector                            | Run schema, register, invariant, journey, trace, authority, and adversarial ratification contracts                                                           | No stale draft/accepted mismatch                   |
| B7    | Auditor                              | Write the as-built with the exact ceremony boundary and fresh all-green coverage                                                                             | No release/readiness wording                       |
| B8    | Architect + machine verb             | Run the shared two-PR ceremony with every required job green                                                                                                 | Closure scope is ratification only                 |

## Acceptance

- Constitution frontmatter and body consistently state 1.0.0/ratified.
- All 42 articles have one reviewed source disposition and resolvable anchors.
- All 12 ADRs are explicitly accepted or superseded under the selected vocabulary.
- Every glossary record has deliberate lifecycle and resolved references.
- The ratified timestamp is written once and bound to the final ceremony commit.
- The genesis attestation’s `ratified` field is set to that same ceremony timestamp and
  validates against its schema.
- Authority materialization cites and byte-matches the exact ratified law.
- Coverage thresholds remain unchanged and all four floors remain green.

## Stops

Abort on any red production-law check, changed frozen binding, new Owner-tier product
choice, unresolved ADR/glossary conflict, same-round self-certification from R-0002, or
release/deployment action.

## Exit handoff

R-0004 receives the ratified law digest, accepted ADR/package topology constraints,
materialized policy digest, exact merge SHA, exact-main CI, and fresh all-green
coverage. The only new claim is **founding law ratified**.
