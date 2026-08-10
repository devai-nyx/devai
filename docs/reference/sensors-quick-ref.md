---
title: Sensors quick-ref
sidebar_position: 4
---

# Sensors quick-ref

> A compact scorecard-oriented reference. The generated [sensor registry](./sensor-registry.md) is authoritative for current descriptor and reading-kind counts, CLI producers, pack parameters, and parser support. For full per-sensor design notes, see [docs/theory/architecture/sensors](../theory/architecture/sensors); for the cell × sensor table, see the [aspect grid](../theory/framework/aspect-grid.md).

## By substrate

### F1 — Specification

- `sense-spec-alignment` — F1 × T4. Cross-reference and citation alignment across specs.
- `sense-spec-depth` — F1 × T2. Substance of individual specs (not just shallow titles).
- `sense-spec-freshness` — F1 × T9. Stale-spec detection vs current code reality.
- `sense-spec-idiomaticity` — F1 × T5. Adherence to spec authoring conventions.
- `sense-spec-performance-targets` — F1 × T7. Perf targets declared per relevant invariant.
- `sense-spec-robustness-targets` — F1 × T8. Robustness targets declared.
- `sense-spec-security-coverage` — F1 × T6. Security concerns named in specs.

### F2 — Plant

- `sense-build` — F2 × T1 (transitive). Build succeeds for all affected apps.
- `sense-lint` — F2 × T5. Lint clean (errors).
- `sense-type-check` — F2 × T3 (transitive). TypeScript clean.
- `sense-plant-coherence` — F2 × T3. Cross-file coherence beyond type-check.
- `sense-plant-coverage` — F2 × T1. Code-level coverage.
- `sense-plant-depth` — F2 × T2. Non-trivial implementations (not stubs).
- `sense-security-scan` — F2 × T6. Dep scan + SAST integration.
- `sense-perf-test` — F2 × T7. Perf-test scaffold.
- `sense-migrate-check` — F2 × T8. Migrations apply cleanly from empty DB.

### F3 — Observation

- `sense-test` — F3 × T1 (transitive). All assigned tests pass.
- `sense-test-coherence` — F3 × T3. Tests agree with each other.
- `sense-test-coverage-depth` — F3 × T2. Tests are substantive.
- `sense-test-idiomaticity` — F3 × T5. Adherence to test authoring conventions.
- `sense-test-invariant-alignment` — F3 × T4. Every test references at least one invariant.
- `sense-test-performance-coverage` — F3 × T7. Perf tests present for relevant invariants.
- `sense-test-robustness-coverage` — F3 × T8. Robustness tests present.
- `sense-test-security-coverage` — F3 × T6. Security tests present.
- `sense-test-weakening` — F3 × T9. AST-diff weakening check per Article 30.
- `sense-trace-resolve` — F3 × T4 (transitive). Trace maps resolve.

### F4 — Inventory

- `sense-api` / `sense-routes` / `sense-data-model` / `sense-data-handling` / `sense-rbac` / `sense-dep-graph` / `sense-coverage` — L0 sensors emitting inventory; consumed by `inv regen`.
- `sense-inventory-adherence` — F4 × T1. Inventory matches declarations.
- `sense-inventory-determinism` — F4 × T8. Inventory regenerates byte-identical.
- `sense-inventory-performance` — F4 × T7. Inventory generation latency.

### F5 — Harness

- `sense-harness-coherence` — F5 × T3. Workflows agree on action versions, permissions, concurrency.
- `sense-harness-coverage` — F5 × T1. Coverage of harness invariants.
- `sense-harness-depth` — F5 × T2 (N/A by Article 5).
- `sense-harness-green-main` — F5 × T9. Main-branch success rate over a window.
- `sense-harness-idiomaticity` — F5 × T5. Workflow style.
- `sense-harness-invariant-alignment` — F5 × T4. Harness honors framework invariants.
- `sense-harness-performance` — F5 × T7. CI runtime tracking.
- `sense-harness-robustness` — F5 × T8. Retry / timeout / fallback discipline.
- `sense-harness-security` — F5 × T6. Permissions + pinning discipline.

## By transversal

Each transversal is evaluated five times (once per substrate). See the [aspect grid](../theory/framework/aspect-grid.md) for the canonical cell × sensor mapping.

| Transversal     | Substrate hits                                      | Pattern                                                                      |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| T1 Coverage     | F1, F2, F3, F4, F5                                  | `sense-*-coverage`                                                           |
| T2 Depth        | F1, F2, F3 (F4 N/A in some packs, F5 N/A by design) | `sense-*-depth`, `sense-spec-depth`                                          |
| T3 Coherence    | F1-F5                                               | `sense-*-coherence`, plus `sense-type-check` for F2                          |
| T4 Alignment    | F1-F5                                               | `sense-*-invariant-alignment`, `sense-spec-alignment`, `sense-trace-resolve` |
| T5 Idiomaticity | F1-F5 (F4 N/A)                                      | `sense-*-idiomaticity`, plus `sense-lint` for F2                             |
| T6 Security     | F1-F5                                               | `sense-*-security-*`, `sense-security-scan`                                  |
| T7 Performance  | F1-F5                                               | `sense-*-performance-*`, `sense-perf-test`, `sense-inventory-performance`    |
| T8 Robustness   | F1-F5                                               | `sense-*-robustness-*`, `sense-inventory-determinism`, `sense-migrate-check` |
| T9 Discipline   | F1, F3, F5 (others mostly N/A)                      | `sense-spec-freshness`, `sense-test-weakening`, `sense-harness-green-main`   |

## Observation and recording boundary

Supported `sense` observations are read-only: they emit a `SensorReading` to
stdout and do not silently create repository state. `--repo-root <path>` is
common, and the public router accepts `--format human` where a human projection
is available. Sensor-specific thresholds and inputs are not uniform; consult
the generated CLI page or `devai <sense path> --help` for the exact action.

To retain an observation, capture its JSON output and perform the separately
authorized mutation:

```sh
devai sense build > /tmp/build-reading.json
devai sense readings record \
  --input /tmp/build-reading.json \
  --as-role inspector \
  --write
```

The record action validates the exact artifact, stores it content-addressed,
and appends chained provenance. Legacy `--no-emit-reading` declarations may
remain visible while the W08 generated reference is reconciled; they do not
change the R21 read-only observation contract.

## See also

- [Aspect grid](../theory/framework/aspect-grid.md) — generated cell × sensor table.
- [docs/theory/architecture/sensors](../theory/architecture/sensors) — full per-sensor design notes.
- [CLI](./cli.md) — auto-generated CLI reference; every `sense-*` verb has its options listed.
