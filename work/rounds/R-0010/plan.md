---
id: R-0010-PLAN
title: DEVAI 1.0.0 release candidate and adopter proof
type: round-plan
status: draft
date: 2026-08-05
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; OM-019; BL-020; BL-024; R-0010-EXTERNAL-AUTHORIZATION]
---

# R-0010 — DEVAI 1.0.0 release candidate and adopter proof

## Objective

Build an exact, independently verifiable 1.0.0 candidate for the eleven-package fixed
group, prove the 0.7-to-1.0 migration hermetically, and prepare the release/site
transaction. Stop before external effects until the pending Owner gate is granted.

## Entry gates

R-0009 is merged and closed; product/docs/site artifact is current; all four coverage
floors and T1–T6 are green; release workflows have never published; GitHub and package
token availability is checked without revealing secrets.

## Phase A — authorized repository preparation

| Batch | Role      | Work                                                                                                                                                                        | Commit gate                              |
| ----- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| A0    | Architect | Declare R-0010 with pending external disposition and exact candidate rules                                                                                                  | No released wording                      |
| A1    | Inspector | Red contracts for fixed-group completeness, immutable workflow pins, tarball/source identity, attestations, version/tag mismatch, migration consent, and deploy subject     | All release/adopter failures fail closed |
| A2    | Engineer  | Implement BL-020 release workflow using immutable action SHAs, eleven-package Changesets handling, exact pack staging, SBOM/hash manifest, and GitHub artifact attestations | Workflow lint and hermetic dry-run       |
| A3    | Engineer  | Implement BL-024 `adopt upgrade --from 0.7`, migration map, explicit consent, doctor checks, and installed-tarball paths                                                    | No sibling-checkout dependence           |
| A4    | Inspector | Pack all eleven packages; install exact tarballs into the stynx-shaped fixture; run migration, doctor, local evidence, and supported E2E                                    | All bytes and behavior exact             |
| A5    | Auditor   | Compare real `stynx` read-only; audit tarballs, hashes, attest subjects, changelogs, versions, site artifact, and remote prerequisites                                      | No real-stynx write; no external action  |
| A6    | Architect | Prepare release notes and the exact external handoff; update the pending gate only by quoting a later Owner grant                                                           | Candidate reproducible from clean clone  |

At A6, stop and return control to the Owner. R-0010 remains open, BL-020/024 remain
active, and `release_disposition` remains pending.

## Phase B — pending external authorization

Execute only after `EXTERNAL-RELEASE-AUTHORIZATION.md` is GRANTED for the revalidated
candidate:

| Batch | Role                     | Work                                                                                                                                                  | Commit gate                           |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| B0    | Auditor                  | Revalidate candidate SHA, green checks, package/site hashes, registry state, token usability, and absence of conflicting versions/tags                | Exact handoff still current           |
| B1    | Owner + Architect        | Record release/deploy authorization and final go/no-go decision                                                                                       | Exact subject and rollback named      |
| B2    | Engineer                 | Publish eleven packages, push exact tags, create GitHub Release, and deploy the bound Pages artifact in the authorized order                          | Stop immediately on partial failure   |
| B3    | Inspector                | Resolve 1.0.0 from GitHub Packages in a clean fixture; verify tarball attestations/hashes, migration, release assets, tags, and live Pages provenance | Published bytes equal candidate       |
| B4    | Auditor                  | Audit registry, GitHub Release, Pages, source SHA, and adopter proof independently                                                                    | No subject mismatch or hidden failure |
| B5    | Architect + machine verb | Append closing decision and close R-0010 with published disposition                                                                                   | BL-020/024 close only here            |

## Acceptance

- Exactly eleven 1.0.0 tarballs derive from one source commit and one fixed group.
- Each tarball has an independently verifiable hash and GitHub build attestation.
- Workflow actions are immutable-SHA pinned and permissions are least privilege.
- The migration is explicit-consent, reproducible, and independent of a sibling checkout.
- Real `stynx` is never modified under OM-002.
- After Phase B only: packages resolve from GitHub Packages, tags and Release point to
  the validated commit, live Pages serves the validated artifact, and the installed
  adopter proof is green.

## Stops

During Phase A, any publish/tag/Release/Pages operation is a hard violation. During
Phase B, stop on candidate drift, conflicting existing version/tag, token/scope failure,
partial publication, attestation mismatch, live-site mismatch, or real-stynx mutation.

## Claims

Phase A may claim **release candidate prepared** only. Phase B may claim **DEVAI 1.0.0
released** only after B3/B4 prove the exact external state. Neither claim implies
evidence promotion or autonomous-loop readiness.
