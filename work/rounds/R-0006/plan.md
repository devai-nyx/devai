---
id: R-0006-PLAN
title: Contracts and coverage depth
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; BL-026; BL-034; BL-035; BL-081]
---

# R-0006 — Contracts and coverage depth

## Objective

Move operational values out of constitutional prose through explicit amendments,
separately decide mutation-strength obligations and evidence aggregation, close every
action’s success/error contract, and bind trace links to assertion-bearing execution
without weakening the already-green coverage baseline.

## Entry gates

R-0005 is merged and closed; proof/local-evidence machinery is green but reuse remains
disabled; coverage is freshly measured with version-matched provider and unchanged
configuration.

## Batches

| Batch | Role                     | Work                                                                                                                                                        | Commit gate                                      |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| B0    | Architect                | Declare round; inventory operational values and every action in the current registry with its output/error shapes; record baseline coverage by package/file | No hidden denominator or stale count             |
| B1    | Architect                | Amend law for BL-034 extractions; record mutation-strength and aggregation as separate BL-035 decisions with FAIL/UNKNOWN rules                             | No doctrine duplicated in two homes              |
| B2    | Inspector                | Commit red contracts for every missing/invalid action payload and each untested branch selected by risk                                                     | Reds assert behavior, not line execution alone   |
| B3    | Architect                | Define closed per-action output/error schemas and common envelope relationships                                                                             | All actions have authoritative shapes            |
| B4    | Engineer                 | Implement BL-026 typed `--json` emissions and validation; fix genuine defects exposed by tests without embedding test-only branches                         | Unknown/invalid payloads fail closed             |
| B5    | Inspector                | Add unit/integration/adversarial/DB tests for contract depth and BL-081; preserve production code independence                                              | Tests prove behavior and mutation resistance     |
| B6    | Engineer                 | Repair coverage instrumentation/provider integration only where measurement is incorrect; do not exclude valid source                                       | Provider/version and merged reports reproducible |
| B7    | Inspector                | Run full T1–T6, DB-enabled T3, mutation-relevant checks, trace-depth checks, and merged coverage                                                            | All prior coverage floors remain green           |
| B8    | Auditor                  | Audit denominator, exclusions, thresholds, output totality, and law extraction; write as-built                                                              | No coverage or semantics laundering              |
| B9    | Architect + machine verb | Close source and closure PRs                                                                                                                                | Every required exact-SHA check green             |

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
decisions, or any release action.

## Exit claim

All repository release gates, including merged coverage, are green. This makes the tree
eligible for product/docs release preparation, not released or ready by itself.
