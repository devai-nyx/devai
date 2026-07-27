---
id: R-0006-PLAN
title: Contracts and coverage depth
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; OM-010; BL-026; BL-034; BL-035; BL-081]
---

# R-0006 — Contracts and coverage depth

## Objective

Move operational values out of constitutional prose through explicit amendments,
separately decide mutation-strength obligations and evidence aggregation, close every
action’s success/error contract, and bind trace links to assertion-bearing execution
without weakening the already-green coverage baseline.

## Entry gates

R-0005 is merged and closed; proof/local-evidence machinery is green but reuse remains
disabled; the pre-R-0006 governance-alignment PR and its exact-main CI are green;
coverage is freshly measured with version-matched provider and unchanged configuration.

This amended plan does not declare R-0006. At a separately revalidated live launch, E0
through E5 are mandatory and serial. B0 remains blocked until the exact E5 prelude
candidate has converged, passed the candidate-only clone and ceremony rehearsals, and
received an Auditor plus independent-review PASS.

## Mandatory entry-control prelude

| Batch | Role                           | Work                                                                                                                                                                                                 | Commit gate                                                                                         |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| E0    | Architect                      | Declare R-0006; bind the live base, amended execution contract, claims ceiling, and SHA-256 digests of the exact plan and orchestrator prompt                                                        | No substantive contract, coverage, plant, or test-depth work                                        |
| E1    | Inspector                      | Establish failing contracts for three candidate identities, candidate-only clone publishability, two-pass convergence, review freeze/envelope, same-class sweeps, finding disposition, and rehearsal | Reds fail for the admitted control defects and name exact workspace-tooling scope                   |
| E2    | Architect                      | Define the policy and schema semantics required by the E1 contracts without weakening existing sequencing or SHA-reference rules                                                                     | One authoritative meaning for identity, envelope, convergence, sweep, publishability, and rehearsal |
| E3    | Engineer                       | Implement only workspace tooling and generated materializations needed by E1/E2                                                                                                                      | No substantive R-0006 contracts, coverage work, plant behavior, or test-depth implementation        |
| E4    | Inspector                      | Run acceptance, mutation, adversarial, shared-object-store, candidate-only clone, dirty-pass, post-PASS mutation, same-class, and closure-ancestry cases                                             | Every admitted bypass fails closed; full existing floor remains green                               |
| E5    | Auditor + independent reviewer | Audit the exact prelude as-built and complete population sweeps; independently challenge the clean candidate and record an exact verdict                                                             | PASS binds the exact prelude candidate; any finding restarts its governed correction and review     |

## Batches

| Batch | Role                     | Work                                                                                                                                         | Commit gate                                                |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| B0    | Architect                | Inventory operational values and every action in the current registry with its output/error shapes; record baseline coverage by package/file | E5 PASS; no hidden denominator or stale count              |
| B1    | Architect                | Amend law for BL-034 extractions; record mutation-strength and aggregation as separate BL-035 decisions with FAIL/UNKNOWN rules              | No doctrine duplicated in two homes                        |
| B2    | Inspector                | Commit red contracts for every missing/invalid action payload and each untested branch selected by risk                                      | Reds assert behavior, not line execution alone             |
| B3    | Architect                | Define closed per-action output/error schemas and common envelope relationships                                                              | All actions have authoritative shapes                      |
| B4    | Engineer                 | Implement BL-026 typed `--json` emissions and validation; fix genuine defects exposed by tests without embedding test-only branches          | Unknown/invalid payloads fail closed                       |
| B5    | Inspector                | Add unit/integration/adversarial/DB tests for contract depth and BL-081; preserve production code independence                               | Tests prove behavior and mutation resistance               |
| B6    | Engineer                 | Repair coverage instrumentation/provider integration only where measurement is incorrect; do not exclude valid source                        | Provider/version and merged reports reproducible           |
| B7    | Inspector                | Run full T1–T6, DB-enabled T3, mutation-relevant checks, trace-depth checks, and merged coverage                                             | All prior coverage floors remain green                     |
| B8    | Auditor                  | Audit denominator, exclusions, thresholds, output totality, and law extraction; write as-built                                               | No coverage or semantics laundering                        |
| B9    | Architect + machine verb | Converge, rehearse, review, publish, and close through the source and closure-only PRs                                                       | Every identity, clone, envelope, and exact-SHA check green |

## Acceptance

- Every runnable action validates success payloads and declared error codes.
- Human and JSON output stay semantically consistent; parsers never depend on prose.
- Operational values have one policy home and constitutional anchors remain deliberate.
- Mutation-strength and aggregation rules cannot manufacture PASS from absent,
  judge-only, stale, or independently uncheckable evidence.
- The normal workspace coverage command retains all four R-0002 floors without
  threshold, include, or exclusion weakening.

## Stops

Stop on threshold reduction, unjustified ignore/exclusion growth, snapshot-only tests,
tests that encode implementation trivia instead of behavior, combining the two BL-035
decisions, any E1–E5 implementation before E0, any B0–B9 work before E5 PASS, an
unpublishable identity, review-envelope violation, nonconvergent pass, unrehearsed
closure ancestry, or any release action.

## Exit claim

All repository release gates, including merged coverage, are green. This makes the tree
eligible for product/docs release preparation, not released or ready by itself.
