---
title: Sensor registry
---

# Sensor registry

**Generated from `@devai-nyx/sensors` `SENSOR_DESCRIPTORS`. Do not hand-edit.**

Descriptors: **62**. Reading kinds: **64**.

| Sensor | Command | Reading kind(s) | Lifecycle | Family |
|---|---|---|---|---|
| `type-check` | `sense type check` | `type_check` | supported | plant |
| `lint` | `sense lint` | `lint` | supported | plant |
| `build` | `sense build` | `build` | supported | plant |
| `test` | `sense test` | `unit_test`, `integration_test`, `e2e_test` | supported | observation |
| `api-test` | none | `api_test` | compatibility | observation |
| `db-test` | none | `db_test` | compatibility | observation |
| `journey-test` | none | `journey_test` | compatibility | observation |
| `migrate-check` | `sense migrate check` | `migration_check` | supported | plant |
| `contract-validation` | none | `contract_validation` | compatibility | specification |
| `inventory-regeneration` | `sense readings rebuild` | `inventory_regeneration` | supported | inventory |
| `test-weakening` | `sense test weakening` | `test_weakening_review` | supported | observation |
| `trace-resolution` | `sense trace resolve` | `trace_resolution` | supported | observation |
| `mutation-test` | none | `mutation_test` | compatibility | observation |
| `security-scan` | `sense security scan` | `security_scan` | supported | plant |
| `perf-test` | `sense perf test` | `perf_test` | supported | plant |
| `llm-judge` | `sense judge` | `llm_judge` | supported | observation |
| `runtime-api` | `sense runtime api` | `runtime_probe_api` | supported | runtime |
| `runtime-auth` | `sense runtime auth` | `runtime_probe_auth` | supported | runtime |
| `runtime-data` | `sense runtime data` | `runtime_probe_data` | supported | runtime |
| `inventory-api` | `sense inventory api` | `inventory_api` | supported | inventory |
| `inventory-routes` | `sense inventory routes` | `inventory_routes` | supported | inventory |
| `inventory-data-model` | `sense inventory data model` | `inventory_data_model` | supported | inventory |
| `inventory-rbac` | `sense inventory rbac` | `inventory_rbac` | supported | inventory |
| `inventory-data-handling` | `sense inventory data handling` | `inventory_data_handling` | supported | inventory |
| `inventory-dep-graph` | `sense inventory dep graph` | `inventory_dep_graph` | supported | inventory |
| `inventory-coverage` | `sense inventory coverage` | `inventory_coverage` | supported | inventory |
| `spec-depth` | `sense spec depth` | `spec_depth` | supported | specification |
| `spec-idiomaticity` | `sense spec idiomaticity` | `spec_idiomaticity` | supported | specification |
| `spec-freshness` | `sense spec freshness` | `spec_freshness` | supported | specification |
| `plant-coverage` | `sense plant coverage` | `plant_coverage` | supported | plant |
| `test-coverage-depth` | `sense test coverage depth` | `test_coverage_depth` | supported | observation |
| `test-invariant-alignment` | `sense test invariant alignment` | `test_invariant_alignment` | supported | observation |
| `inventory-adherence` | `sense inventory adherence` | `inventory_adherence` | supported | inventory |
| `inventory-determinism` | `sense inventory determinism` | `inventory_determinism` | supported | inventory |
| `harness-security` | `sense harness security` | `harness_security` | supported | harness |
| `harness-green-main` | `sense harness green main` | `harness_green_main` | supported | harness |
| `spec-alignment` | `sense spec alignment` | `spec_alignment` | supported | specification |
| `spec-security-coverage` | `sense spec security coverage` | `spec_security_coverage` | supported | specification |
| `spec-performance-targets` | `sense spec performance targets` | `spec_performance_targets` | supported | specification |
| `spec-robustness-targets` | `sense spec robustness targets` | `spec_robustness_targets` | supported | specification |
| `plant-depth` | `sense plant depth` | `plant_depth` | supported | plant |
| `plant-coherence` | `sense plant coherence` | `plant_coherence` | supported | plant |
| `test-coherence` | `sense test coherence` | `test_coherence` | supported | observation |
| `test-idiomaticity` | `sense test idiomaticity` | `test_idiomaticity` | supported | observation |
| `test-security-coverage` | `sense test security coverage` | `test_security_coverage` | supported | observation |
| `test-performance-coverage` | `sense test performance coverage` | `test_performance_coverage` | supported | observation |
| `test-robustness-coverage` | `sense test robustness coverage` | `test_robustness_coverage` | supported | observation |
| `harness-coverage` | `sense harness coverage` | `harness_coverage` | supported | harness |
| `harness-depth` | `sense harness depth` | `harness_depth` | supported | harness |
| `harness-coherence` | `sense harness coherence` | `harness_coherence` | supported | harness |
| `harness-invariant-alignment` | `sense harness invariant alignment` | `harness_invariant_alignment` | supported | harness |
| `harness-idiomaticity` | `sense harness idiomaticity` | `harness_idiomaticity` | supported | harness |
| `harness-performance` | `sense harness performance` | `harness_performance` | supported | harness |
| `harness-robustness` | `sense harness robustness` | `harness_robustness` | supported | harness |
| `inventory-performance` | `sense inventory performance` | `inventory_performance` | supported | inventory |
| `decision-record-integrity` | `sense decision record integrity` | `decision_record_integrity` | supported | harness |
| `decision-citation-resolution` | `sense decision citation resolution` | `decision_citation_resolution` | supported | harness |
| `archive-immutability` | `sense archive immutability` | `archive_immutability` | supported | harness |
| `round-record-integrity` | `sense round record integrity` | `round_record_integrity` | supported | harness |
| `docs-drift` | `sense docs drift` | `docs_drift` | supported | harness |
| `site-drift` | `sense site drift` | `site_drift` | supported | harness |
| `action-effect-inference` | `policy check action effects` | `action_effect_inference` | supported | operational |

## Pack parameter bindings

| Binding | Consumed | Declared only |
|---|---|---|
| `harness_coherence` | none | `max_review_incoherence` |
| `harness_coverage` | none | `thresholds` |
| `harness_depth` | none | `thresholds` |
| `harness_green_main` | `min_sample_size`, `since`, `threshold_pct` | none |
| `harness_invariant_alignment` | none | `gate_severity_value` |
| `harness_performance` | none | `branch`, `limit`, `thresholds` |
| `harness_robustness` | none | `branch`, `limit`, `thresholds` |
| `harness_security` | `workflow_dir` | none |
| `inventory_adherence` | `max_orphans` | none |
| `inventory_api` | `public_marker_decorators`, `scan_dir`, `scan_dir_alternates` | `annotation_patterns`, `app_file`, `controller_glob`, `controllers_dir`, `framework`, `routes_files`, `routes_pattern` |
| `inventory_data_model` | `dialect`, `migration_dirs`, `pii_registry_table` | none |
| `inventory_performance` | `thresholds` | none |
| `inventory_routes` | `framework`, `scan_dir`, `scan_dir_alternates` | `fallback_scan_dirs`, `inertia`, `routes_file_glob`, `view_extension` |
| `inventory_type_check` | `typecheck_strategy` | none |
| `lint` | `timeout_ms` | none |
| `llm` | `llm_timeouts` | none |
| `migrate_check` | `bootstrap_roles`, `migration_dirs` | none |
| `perf_test` | `script_name`, `thresholds` | none |
| `plant_coherence` | none | `max_review_incoherent`, `source_globs` |
| `plant_depth` | none | `source_globs`, `thresholds` |
| `security_scan` | `thresholds` | none |
| `spec_alignment` | `reverse_threshold_pct`, `source_globs` | none |
| `spec_freshness` | `threshold_days` | none |
| `spec_performance_targets` | none | `signals_required` |
| `spec_robustness_targets` | none | `signals_required` |
| `spec_security_coverage` | `pii_migrations_globs`, `pii_registry_table`, `threat_model_globs` | none |
| `spec_validate` | `invariant_companion_patterns` | none |
| `test_coherence` | none | `min_per_package_ratio`, `package_roots`, `pass_ratio` |
| `test_coverage` | `thresholds` | none |
| `test_performance_coverage` | none | `thresholds` |
| `test_robustness_coverage` | none | `thresholds` |
| `test_security_coverage` | none | `thresholds` |

## Parser boundary

Pack detection and declared-only hints do not create a parser. `inventory_api` has a NestJS-shaped AST walker; Express, Laravel, and Spring AST parsers are absent. `inventory_routes` has Angular and React walkers; AngularJS and Blade parsers are absent. Those stacks require independent validation and cannot claim complete inventory support.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/sensor-registry.md (classification CURRENT).
