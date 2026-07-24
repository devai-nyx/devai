---
id: R-0007-PLAN
title: Product, documentation, and deploy-ready site
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; BL-019; BL-021; BL-032; BL-039; BL-044]
---

# R-0007 — Product, documentation, and deploy-ready site

## Objective

Apply the approved semantic product dispositions, generate the complete CLI reference
and derived projections, re-bind active docs by risk, finalize frozen History, and
produce an exact deployable successor site artifact without deploying it.

## Entry gates

R-0006 is merged and closed; 70/60/70/70 and all production gates are green; action and
schema populations are stable; the external Pages gate remains ungranted.

## Risk slices

- P0: authority tables, state/proof placement, destructive operations, mutable/current
  claims, repository identity, deploy guard, History integrity.
- P1: commands, adoption, CI, round procedures, generated CLI reference.
- P2: theory, historical labels, counts, diagrams, derived indexes.

P0 completes before P1; P1 before P2.

## Batches

| Batch | Role                     | Work                                                                                                                                                           | Commit gate                                           |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| B0    | Architect                | Declare round and freeze a per-reference semantic mapping; no bulk rewrite                                                                                     | Every source occurrence classified                    |
| B1    | Engineer                 | Add a fail-closed deploy-refusal guard that requires the later external-release grant and exact candidate identity                                             | Accidental deploy exits nonzero                       |
| B2    | Inspector                | Commit product/docs/reference/site reds, including repository existence, command/action resolution, generated-byte identity, and hard-coded performance claims | Reds match all five items                             |
| B3    | Owner                    | Apply BL-044 line-by-line dispositions to journeys/use cases and record rationale                                                                              | Only OM-002-approved setpoint changes                 |
| B4    | Architect                | Re-bind P0 docs and BL-021 History using re-read frozen hashes; distinguish predecessor history from successor standing                                        | Authority, links, and history verification            |
| B5    | Engineer                 | Generate BL-019’s CLI pages and the five BL-032 projections from stable sources                                                                                | Reproducible bytes; direct output edits rejected      |
| B6    | Architect                | Complete P1/P2 semantic documentation and BL-039 site/versioned 1.0 source with candidate-not-release wording                                                  | No stale live doctrine or copied predecessor snapshot |
| B7    | Inspector                | Run product contracts, docs CLI check, links, site drift, repository-existence sweeps, and full gates                                                          | Zero missing/drifted pages and broken links           |
| B8    | Auditor                  | Hash the exact built site artifact, audit all risk slices, and write as-built                                                                                  | Artifact is deployable but not deployed               |
| B9    | Architect + machine verb | Close source and closure PRs                                                                                                                                   | No Pages action                                       |

## Acceptance

- Every active product action reference resolves or is explicitly non-active.
- Performance use case uses the real command, reading kind, and policy thresholds.
- History publishes recomputable predecessor hashes and honest nonclaims.
- Every CLI page in the current generation manifest and all five projections generate
  deterministically.
- Historical material is labelled; active docs contain no retired doctrine.
- Site build, typecheck, links, generated-byte, and drift checks pass.
- The built artifact is hash-bound to the exact source commit.
- No deploy command or workflow executes.

## Stops

Stop on a new Owner product choice, mechanical reference replacement, mutable-main
historical citation, direct edit of generated output, missing deploy refusal, Pages
deployment, or wording that calls the candidate released.

## Exit claim

Product and documentation are semantically current and the site artifact is
deploy-ready. Nothing has been deployed or released.
