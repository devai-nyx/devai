/**
 * Exact predecessor measurable_via action-to-kind bridge.
 *
 * The successor sensor law registry deliberately carries kinds, emitters,
 * cells, and tiers but has no action-id field. Keep this compatibility bridge
 * local until Architect authority extends that schema; do not treat it as a
 * second source for sensor kinds or scorecard cells.
 */
export const ACTION_TO_KIND: Readonly<Record<string, string>> = Object.freeze({
  "sense type-check": "type_check",
  "sense lint": "lint",
  "sense build": "build",
  "sense test": "unit_test",
  "sense migrate-check": "migration_check",
  "sense test-weakening": "test_weakening_review",
  "sense trace-resolve": "trace_resolution",
  "sense judge": "llm_judge",
  "sense api": "inventory_api",
  "sense routes": "inventory_routes",
  "sense data-model": "inventory_data_model",
  "sense rbac": "inventory_rbac",
  "sense data-handling": "inventory_data_handling",
  "sense dep-graph": "inventory_dep_graph",
  "sense coverage": "inventory_coverage",
  "sense spec-depth": "spec_depth",
  "sense spec-idiomaticity": "spec_idiomaticity",
  "sense spec-freshness": "spec_freshness",
  "sense plant-coverage": "plant_coverage",
  "sense test-coverage-depth": "test_coverage_depth",
  "sense test-invariant-alignment": "test_invariant_alignment",
  "sense inventory-adherence": "inventory_adherence",
  "sense inventory-determinism": "inventory_determinism",
  "sense harness-security": "harness_security",
  "sense harness-green-main": "harness_green_main",
  "sense spec-alignment": "spec_alignment",
  "sense spec-security-coverage": "spec_security_coverage",
  "sense spec-performance-targets": "spec_performance_targets",
  "sense spec-robustness-targets": "spec_robustness_targets",
  "sense plant-depth": "plant_depth",
  "sense plant-coherence": "plant_coherence",
  "sense test-coherence": "test_coherence",
  "sense test-idiomaticity": "test_idiomaticity",
  "sense test-security-coverage": "test_security_coverage",
  "sense test-performance-coverage": "test_performance_coverage",
  "sense test-robustness-coverage": "test_robustness_coverage",
  "sense harness-coverage": "harness_coverage",
  "sense harness-depth": "harness_depth",
  "sense harness-coherence": "harness_coherence",
  "sense harness-invariant-alignment": "harness_invariant_alignment",
  "sense harness-idiomaticity": "harness_idiomaticity",
  "sense harness-performance": "harness_performance",
  "sense harness-robustness": "harness_robustness",
  "sense inventory-performance": "inventory_performance",
  "sense decision-record-integrity": "decision_record_integrity",
  "sense decision-citation-resolution": "decision_citation_resolution",
  "sense archive-immutability": "archive_immutability",
  "sense round-record-integrity": "round_record_integrity",
  "sense docs-drift": "docs_drift",
  "policy check action effects": "action_effect_inference",
});

export function actionToSensorKind(action: string): string | null {
  return ACTION_TO_KIND[action] ?? null;
}
