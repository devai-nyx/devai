# Sensor: `harness_coherence` → F5×T3

## Property semantics

**T3 Coherence** (Constitution Article 5) for F5 (Harness): "do the workflows agree with each other?" Concretely: do all workflows pin the same versions of common actions (e.g. `actions/checkout`), apply consistent permissions discipline, and follow a uniform structural style?

## Operational definition

Across all workflows, detect inconsistencies:

1. **Action-version drift.** For each `<owner>/<repo>` used by ≥ 2 workflows, are all `@<ref>` values identical? If not → drift incident.
2. **Permissions discipline.** Count workflows with vs without a top-level `permissions:` block. If both groups are non-empty → discipline incident.
3. **Concurrency discipline.** Same check for `concurrency:` block. (Less critical than permissions; info-level only.)

`incoherence_score = drift_incidents + permissions_mixed + concurrency_mixed`.

## PASS / REVIEW / FAIL boundaries

- **PASS:** `incoherence_score === 0`.
- **REVIEW:** `1 ≤ incoherence_score ≤ 3`.
- **FAIL:** `incoherence_score > 3`.

## Adopter overrides

- `extractor_params.harness_coherence.max_review_incoherence: number` — REVIEW/FAIL boundary. Default `3`.

## Out of scope

- **Node-version pinning per workflow.** Requires deeper `with:` parsing — defer.
- **Reusable workflow extraction recommendations.** That's idiomaticity (F5×T5).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/sensors/harness_coherence.md (classification CURRENT).
