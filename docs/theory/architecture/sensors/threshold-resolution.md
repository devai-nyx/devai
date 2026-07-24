# Sensor threshold resolution

**Status:** Phase 29.K (closes T-1). Canonical reference for how each Phase 26-29 sensor's PASS/REVIEW/FAIL boundaries are tunable.

## Resolution chain

Every sensor with adopter-tunable thresholds follows the same precedence ladder:

1. **CLI flag** (highest priority) — `--threshold-pass <n>`, `--threshold-review <n>`, or a uniform `--thresholds <json>` where applicable.
2. **Pack config** — `extractor_params.<sensor_kind>.thresholds` (or sensor-specific shape) in the matched `redox-pack-*` stack-adapter pack. Resolved via `resolveSensorParams` when `--pack-tune` or `--pack-id` is set.
3. **Sensor default** — hard-coded constant in the sensor source.

## Phase 26 sensors (10)

| Kind | Pack key | Default |
|---|---|---|
| `spec_depth` | (no thresholds; count-based) | — |
| `spec_idiomaticity` | (no thresholds; status mirrors validator) | — |
| `spec_freshness` | `spec_freshness.threshold_days` | 90 |
| `plant_coverage` | (no thresholds; presence check) | — |
| `test_coverage_depth` | `test_coverage.thresholds` | `{pass:80, review:50}` |
| `test_invariant_alignment` | (no thresholds; presence check) | — |
| `inventory_adherence` | `inventory_adherence.max_orphans` | 50 |
| `inventory_determinism` | (no thresholds; equality check) | — |
| `harness_security` | `harness_security.workflow_dir` (not a threshold) | `.github/workflows` |
| `harness_green_main` | `harness_green_main.threshold_pct` | `{pass:95, review:80}` |

## Phase 27 sensors (11)

| Kind | Pack key | Default |
|---|---|---|
| `spec_alignment` | `spec_alignment.reverse_threshold_pct` | 80 |
| `spec_security_coverage` | `spec_security_coverage.{threat_model_globs, pii_registry_table}` | — |
| `spec_performance_targets` | **`spec_performance_targets.signals_required`** (Phase 29.K addition) | `{invariants:1, use_cases:1}` |
| `spec_robustness_targets` | **`spec_robustness_targets.signals_required`** (Phase 29.K addition) | `{invariants:1, error_contracts:1}` |
| `plant_depth` | `plant_depth.thresholds` | `{pass:500, review:1000}` |
| `plant_coherence` | `plant_coherence.max_review_incoherent` | 3 |
| `test_coherence` | `test_coherence.{min_per_package_ratio, pass_ratio}` | `{0.1, 0.3}` |
| `test_idiomaticity` | `test_idiomaticity.thresholds` | `{review:0.5, fail:0.8}` |
| `test_security_coverage` | `test_security_coverage.thresholds` | `{pass:5, review:2}` |
| `test_performance_coverage` | **`test_performance_coverage.thresholds`** (Phase 29.K addition) | `{pass:1, review:0}` (perf tests are rare; PASS at ≥1 + ≥1% reflects this) |
| `test_robustness_coverage` | `test_robustness_coverage.thresholds` | `{pass:10, review:5}` |

## Phase 28 sensors (7)

| Kind | Pack key | Default |
|---|---|---|
| `harness_coverage` | `harness_coverage.thresholds` | `{pass:80, review:50}` |
| `harness_depth` | `harness_depth.thresholds` | `{pass:3}` |
| `harness_coherence` | `harness_coherence.max_review_incoherence` | 3 |
| `harness_invariant_alignment` | `harness_invariant_alignment.gate_severity_value` | `'gate'` |
| `harness_idiomaticity` | (no thresholds; score-based 0-3) | — |
| `harness_performance` | `harness_performance.thresholds` | see design note |
| `harness_robustness` | `harness_robustness.thresholds` | `{pass:5, review:15}` |

## Phase 29 sensor (1)

| Kind | Pack key | Default |
|---|---|---|
| `inventory_performance` | `inventory_performance.thresholds` | `{pass:2000, review:5000}` (ms) |

## Phase 29.K work scope

T-1's directive ("walk all 28 trilogy sensors and expose hard-coded thresholds") is largely **already complete** as of Phase 28.I — most sensors already accept pack-config overrides at the CLI verb layer. The Phase 29.K commit adds the genuine gaps surfaced by an audit of the canonical adopter pack:

- **`spec_performance_targets.signals_required`** — adopters with stricter perf-coverage expectations can require >1 perf invariant.
- **`spec_robustness_targets.signals_required`** — same for error-semantics invariants + error contracts.
- **`test_performance_coverage.thresholds`** — formalises the previously-implicit "≥1 perf test ≥1%" boundary.

Other sensors either had pack-config exposure shipped at their introduction (Phases 26 + 27 + 28) or are count-based / equality-based and have no meaningful threshold to expose.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/sensors/threshold-resolution.md (classification CURRENT).
