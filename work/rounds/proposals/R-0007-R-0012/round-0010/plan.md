---
id: R-0010-PROPOSED-RESEQUENCED-PLAN
title: DEVAI 1.0.0 release candidate and adopter proof
type: temporary-round-plan
status: draft-non-authoritative
date: 2026-08-02
source: work/rounds/R-0008
---

# R-0010 — 1.0.0 release candidate and adopter proof

## Objective

Build an exact, independently verifiable 1.0.0 candidate for the eleven-package fixed
group, prove 0.7-to-1.0 migration hermetically, and prepare the release/site transaction.
Stop before every external effect until a later exact-candidate Owner grant.

## Entry gates

- R-0009 is merged/closed with current product/docs/site artifact.
- Repository-phase authority is rebound from former R-0008 to R-0010.
- All tiers, 70/60/70/70, authenticated convergence, release checks, and site artifact
  reproducibility are green.
- GitHub/package credentials are checked without exposing values; no workflow has published.

## Phase A — repository preparation

| Batch | Role      | Work                                                                                                                                | Gate                      |
| ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| A0    | Architect | Declare R-0010 with pending external disposition and exact candidate rules                                                          | no released wording       |
| A1    | Inspector | Reds for fixed group, workflow pins, tarball/source identity, attestations, version/tag mismatch, migration consent, deploy subject | all fail closed           |
| A2    | Engineer  | Immutable-SHA workflow, eleven-package Changesets, pack staging, SBOM/hash manifest, attestations                                   | lint and hermetic dry run |
| A3    | Engineer  | `adopt upgrade --from 0.7`, migration map, consent, doctor, installed-tarball paths                                                 | no sibling dependency     |
| A4    | Inspector | Pack/install all eleven in clean stynx-shaped fixture; migration/doctor/evidence/E2E                                                | exact bytes/behavior      |
| A5    | Auditor   | Read-only stynx comparison; audit hashes, subjects, changelogs, versions, site and prerequisites                                    | no external action        |
| A6    | Architect | Release notes and exact external handoff                                                                                            | reproducible candidate    |

Stop at A6 with the round open and release disposition pending.

## Phase B — separately authorized external transaction

Only after an Owner grant names the exact revalidated candidate:

| Batch | Role                     | Work                                                                                                        | Gate                    |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------- |
| B0    | Auditor                  | Revalidate candidate, checks, hashes, registry/tag state, tokens                                            | handoff current         |
| B1    | Owner + Architect        | Exact go/no-go and rollback decision                                                                        | subject/order bound     |
| B2    | Engineer                 | Publish packages, tags, GitHub Release, bound Pages artifact in authorized order                            | stop on partial failure |
| B3    | Inspector                | Resolve published packages in clean fixture; verify attestations, migration, assets, tags, Pages provenance | bytes equal candidate   |
| B4    | Auditor                  | Independently audit registry, Release, Pages, source and adopter proof                                      | no mismatch             |
| B5    | Architect + machine verb | Close with published disposition                                                                            | close only after proof  |

## Acceptance, stops, and claims

Exactly eleven 1.0.0 tarballs derive from one source commit/fixed group with verifiable
hashes and attestations. Workflows are immutable-pinned/least-privilege. Migration is
consented, reproducible, and sibling-independent. Real stynx remains read-only.

Phase A forbids package publication, tags, Release, and Pages. Phase B stops on drift,
conflict, credential failure, partial publication, attestation/site mismatch, or stynx
write. Phase A may claim only “release candidate prepared.” “DEVAI 1.0.0 released” requires
B3/B4 evidence and does not imply evidence promotion.
