---
id: R-0007-PROPOSED-INVENTORY
title: Current CLI and terminology inventory
type: inventory
status: draft
date: 2026-07-31
authority: Auditor
---

# Current-state inventory

> Planning snapshot only. Canonical values must be regenerated from live main at entry.

## Action population

| Population               | Current source-law count | Proposed count |
| ------------------------ | -----------------------: | -------------: |
| Runnable (`keep`)        |                      147 |             42 |
| Folded historical        |                       38 |            170 |
| Tombstoned               |                        1 |             11 |
| Total identities         |                      186 |            223 |
| Porcelain                |                       34 |             31 |
| Hidden runnable plumbing |                      113 |             11 |

Proposed hidden runnable plumbing is ten round-subordinate task actions plus `catalog actions`.

## Current sensor batches

| Current name | Expansion                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `baseline`   | build, lint, type check, unit test                                                                     |
| `tier1`      | identical to baseline                                                                                  |
| `tier2`      | baseline plus eight inventory/spec sensors                                                             |
| `tier3`      | tier2 plus eight governance/harness sensors                                                            |
| `all`        | identical to tier3                                                                                     |
| `sweep`      | all 59 registry kinds, including kinds whose effective behavior requires reclassification or exclusion |

## Proposed vocabulary inventory

| Category                 | Values                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Check suite              | `quick`, `standard`, `full`, `release`                                                                                                 |
| Sense preset             | `baseline`, `structural`, `governed`, `sweep`                                                                                          |
| Adoption tier            | `tier1`, `tier2`, `tier3`                                                                                                              |
| Inventory slice          | `pack`, `adherence`, `components`, `contracts`, `coverage`, `dependencies`, `glossary`, `modules`, `routes`, `schemas`, `tests`, `all` |
| Human role               | `owner`, `architect`, `inspector`, `engineer`, `auditor`                                                                               |
| Effect                   | `read`, `harness-write`, `local-write`, `remote-write`                                                                                 |
| Sensor/readiness verdict | `pass`, `review`, `fail`, `unknown`, `na`, `skipped`, `error`, `killed`                                                                |
| Action lifecycle         | `supported`, `experimental`, `retired`                                                                                                 |
| Surface tier             | `porcelain`, `plumbing`                                                                                                                |
| Task executor kind       | `routine`, `agent`, `human`, `composite`                                                                                               |
| Agent selection mode     | `exact`, `preferred`, `policy`                                                                                                         |

## Current executor/model representation

| Concern               | Current location                | Current limitation                                                         |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| Task model escalation | `task.schema.json` `model_tier` | only `default`/`bumped`/`fallback`; optional                               |
| Exact prompt target   | prompt-composition schema       | family/model/tier describes prompt composition, not executor authorization |
| Skill routing hint    | skill manifest                  | default family and agent class apply to skills, not individual tasks       |
| Wave hints            | prompt frontmatter/parser       | effort/model/vendor are loose; agent CLI integration is reserved           |
| Actual LLM identity   | LLM response telemetry          | observed after invocation, not a complete requested/resolved task contract |

The proposed inventory adds an Architect-owned model/runtime registry. Its exact entry
count is deliberately not guessed in planning: entry audit must derive it from supported
adapters and policy. Each entry records stable ID, vendor/family, runtime/adapter, exact
provider model or governed alias, supported efforts, capabilities, eligible agent
classes, availability, and replacement metadata.

## Current sweep kinds

The current sensor registry contains 59 live kinds:

```text
type_check, lint, build, unit_test, integration_test, e2e_test, migration_check,
inventory_regeneration, test_weakening_review, trace_resolution, security_scan,
perf_test, llm_judge, runtime_probe_api, runtime_probe_auth, runtime_probe_data,
inventory_api, inventory_routes, inventory_data_model, inventory_rbac,
inventory_data_handling, inventory_dep_graph, inventory_coverage, spec_depth,
spec_idiomaticity, spec_freshness, plant_coverage, test_coverage_depth,
test_invariant_alignment, inventory_adherence, inventory_determinism,
harness_security, harness_green_main, spec_alignment, spec_security_coverage,
spec_performance_targets, spec_robustness_targets, plant_depth, plant_coherence,
test_coherence, test_idiomaticity, test_security_coverage,
test_performance_coverage, test_robustness_coverage, harness_coverage,
harness_depth, harness_coherence, harness_invariant_alignment,
harness_idiomaticity, harness_performance, harness_robustness,
inventory_performance, decision_record_integrity, decision_citation_resolution,
archive_immutability, round_record_integrity, docs_drift, site_drift,
action_effect_inference
```

The proposed `sweep` must be derived from the subset whose actual capabilities are
read-only. `migration_check` must move to explicit `sense migrate`; any other
write-capable kind must be similarly excluded and reported.

## Documentation population to govern

The documentation wave must mechanically cover:

- 4 suites;
- 4 presets;
- every live sensor kind after registry reconciliation;
- 12 inventory slices;
- 3 adoption tiers;
- 5 human roles;
- 4 effects;
- every public verdict/status;
- 3 action lifecycles;
- 2 surface tiers;
- 4 executor kinds;
- 3 agent-selection modes;
- every canonical runtime, rostered model, and supported effort after registry creation;
- 7 default workflow domains;
- every old-command migration row.

Counts are assertions to be generated and tested, not copied into permanent prose.

The complete proposed command disposition is recorded in
`inventory/old-to-new-command-map.md`.
