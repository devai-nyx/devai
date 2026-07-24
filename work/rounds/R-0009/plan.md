---
id: R-0009-PLAN
title: Evidence-reuse authorization preparation
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; BL-022; BL-036; ADR-003; R-0008 published close]
---

# R-0009 — Evidence-reuse authorization preparation

## Objective

Replace predecessor first-parent authorization assumptions with successor records,
prove every fail-closed fallback, close the semantic-review decision without expanding
trust, and prepare transparent observation for the later genuine evidence campaign.

## Entry gates

R-0008 Phase B is published, independently verified, and closed; source PRs still run
full; no successor promotion streak exists; R-0010 authorization remains pending.

## Batches

| Batch | Role                     | Work                                                                                                                                                                       | Commit gate                              |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| B0    | Architect                | Declare R-0009 with streak zero; freeze successor authorization/revocation shapes and qualifying-run definitions from accepted law                                         | No predecessor-standing import           |
| B1    | Inspector                | Red contracts for absent, malformed, head-only, self-authorized, revoked, unresolved, stale, and source-PR authorization                                                   | Every case runs full                     |
| B2    | Architect                | Re-bind BL-022 to successor first-parent records; record BL-036 retention because no qualifying trusted-adapter evidence exists                                            | `semantic-review` remains unable to PASS |
| B3    | Engineer                 | Implement first-parent resolution via `git show <base-sha>:` and observation-only metrics; preserve full-run fallback                                                      | No caller/head-only authorization        |
| B4    | Inspector                | Prove valid first-parent authorization is the only reuse path, revocation restores full execution, weekly/source cases cannot promote, and metrics cannot relabel outcomes | Adversarial suite green                  |
| B5    | Auditor                  | Audit zero prior streak, zero imported standing, and instrumentation semantics; write R-0010 opening handoff without starting it                                           | All counters zero/current                |
| B6    | Architect + machine verb | Close R-0009                                                                                                                                                               | R-0010 still pending                     |

## Acceptance

- Missing, malformed, head-only, self-authored, revoked, stale, or unresolved records
  always run full.
- Only a valid first-parent record can authorize reuse.
- Source PRs always run full and weekly audits cannot manufacture promotion standing.
- `semantic-review` cannot PASS; BL-036 closes by an explicit retain decision.
- Observation data is attributable and non-authorizing.
- No streak run is counted.

## Stops

Stop on predecessor decision-path reuse, current-HEAD authorization, self-authorization,
semantic-review trust expansion, a counted run, or promotion activation.

## Exit claim

Evidence reuse is correctly authorized but promotion remains unearned and inactive.
R-0010 is prepared with a zero baseline and still requires a fresh Owner mandate.
