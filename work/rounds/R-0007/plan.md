---
id: R-0007-PLAN
title: Product, documentation, and deploy-ready site
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; OM-014; DII-246; BL-019; BL-021; BL-032; BL-039; BL-044]
---

# R-0007 — Product, documentation, and deploy-ready site

## Objective

Apply the approved semantic product dispositions, generate the complete CLI reference
and derived projections, re-bind active docs by risk, finalize frozen History, and
produce an exact deployable successor site artifact without deploying it.

## Entry gates

R-0006 is merged and closed; 70/60/70/70 and all production gates are green; action and
schema populations are stable; the pre-R-0007 close-control machinery is merged with
green exact-main CI; `round-close:entry-check -- --round R-0007` resolves exactly one
active Owner reviewer binding; the external Pages gate remains ungranted. An unbound,
inactive, ambiguous, or conflicting reviewer binding means R-0007 remains dormant.

## Risk slices

- P0: authority tables, state/proof placement, destructive operations, mutable/current
  claims, repository identity, deploy guard, History integrity.
- P1: commands, adoption, CI, round procedures, generated CLI reference.
- P2: theory, historical labels, counts, diagrams, derived indexes.

P0 completes before P1; P1 before P2.

## Batches

| Batch | Role                                                   | Work                                                                                                                                                           | Commit gate                                                     |
| ----- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| B0    | Architect                                              | Declare the round with a structured exact-base marker, bind the profile declaration slot, and freeze a per-reference semantic mapping; no bulk rewrite         | Exact then-main base and every source occurrence classified     |
| B1    | Engineer                                               | Add a fail-closed deploy-refusal guard that requires the later external-release grant and exact candidate identity                                             | Accidental deploy exits nonzero                                 |
| B2    | Inspector                                              | Commit product/docs/reference/site reds, including repository existence, command/action resolution, generated-byte identity, and hard-coded performance claims | Reds match all five items                                       |
| B3    | Owner                                                  | Apply BL-044 line-by-line dispositions to journeys/use cases and record rationale                                                                              | Only OM-002-approved setpoint changes                           |
| B4    | Architect                                              | Re-bind P0 docs and BL-021 History using re-read frozen hashes; distinguish predecessor history from successor standing                                        | Authority, links, and history verification                      |
| B5    | Engineer                                               | Generate BL-019’s CLI pages and the five BL-032 projections from stable sources                                                                                | Reproducible bytes; direct output edits rejected                |
| B6    | Architect                                              | Complete P1/P2 semantic documentation and BL-039 site/versioned 1.0 source with candidate-not-release wording                                                  | No stale live doctrine or copied predecessor snapshot           |
| B7    | Inspector                                              | Run product contracts, docs CLI check, links, site drift, repository-existence sweeps, and full gates                                                          | Zero missing/drifted pages and broken links                     |
| B8    | Auditor                                                | Hash the exact built site artifact, audit all risk slices, materialize current claims, converge twice, and freeze the exact candidate                          | Exact candidate, claims, impact plan, and review scope validate |
| B9    | Independent reviewer + role-pure repair + machine verb | Review the complete semantic topic population within two cycles, publish the exact reviewed head, then close source and closure PRs                            | PASS within budget; no Pages action                             |

## Acceptance

- Every active product action reference resolves or is explicitly non-active.
- Performance use case uses the real command, reading kind, and policy thresholds.
- History publishes recomputable predecessor hashes and honest nonclaims.
- Every CLI page in the current generation manifest and all five projections generate
  deterministically.
- Historical material is labelled; active docs contain no retired doctrine.
- Site build, typecheck, links, generated-byte, and drift checks pass.
- The built artifact is hash-bound to the exact source commit.
- The explicit affected-test graph accounts for every governed source and stable test
  shard or widens conservatively; a warm unchanged local convergence starts no test
  process, while remote CI executes the complete authoritative population.
- Every changed and unchanged semantic review topic has exactly one valid structured
  disposition, and every finding names its complete same-class population.
- Cycle 3 is mechanically unavailable. Cycle-2 failure stops for Owner escalation.
- No deploy command or workflow executes.

## Stops

Stop on a new Owner product choice, unresolved reviewer binding, mechanical reference
replacement, mutable-main historical citation, direct edit of generated output,
unknown dependency treated as a skip, incomplete topic or finding-class population,
cycle-2 failure, missing deploy refusal, Pages deployment, or wording that calls the
candidate released.

## Exit claim

Product and documentation are semantically current and the site artifact is
deploy-ready. Nothing has been deployed or released.
