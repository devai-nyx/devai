---
title: Substrates
sidebar_position: 2
---

# Substrates

> [Constitution Article 4](../../reference/law.md) declares five fundamental substrates. Every artifact in a DEVAI-governed repo belongs to exactly one. Each substrate has a distinct authority (Article 6), a distinct sensor regime, and a distinct role on the control loop.

## The five substrates

### F1 — Specification (the reference signal)

What the framework is trying to achieve. The reference signal *r(t)* in control-theory terms.

- **Contents.** Business specs (Owner-authored journeys + use-cases under `product/`), engineering specs (Architect-authored arch notes + invariants + trace + ADRs under `docs/theory/architecture/`, `framework/adr/`), contracts (`docs/reference/contracts/`), glossary (`law/glossary/`, joint Owner+Architect).
- **Authors.** Owner for business tier, Architect for engineering tier, joint at glossary.
- **Sensor regime.** Spec validators (`spec validate invariants`, `spec validate journeys`, `spec validate trace`, `spec validate glossary`), plus aspect-grid cells F1×T1..T9 measured by the `sense spec *` sensors.

### F2 — Plant (the system under control)

The system the controller acts on. The plant *P*.

- **Contents.** All source code under `apps/`, `libs/`, `packages/` (in monorepo layouts); DB migrations under `db/migrations/`; seeds under `db/seeds/`; infrastructure-as-code under `iac/`; root-level build scripts.
- **Author.** Engineer.
- **Sensor regime.** Type-checker, linter, builder, test runners. Plant transversal sensors `sense-plant-*` for the F2×T1..T9 row.

### F3 — Observation (sensors on the plant)

The tests that measure what *P* actually does, compared with what F1 says it should do. Sensors *y(t)*.

- **Contents.** All `**/*.spec.ts`, `**/*.test.ts`, `tests/`, `e2e/`, configuration files that encode test intent.
- **Author.** Inspector.
- **Sensor regime.** Six vitest configurations (see [test policy](./test-policy.md)). Plus meta-sensors that probe Inspector's own substrate: `sense-test-coverage-depth`, `sense-test-weakening`, `sense-test-idiomaticity`, `sense-test-invariant-alignment`, etc.

### F4 — Inventory (plant identification)

A derived model of *P*. The controller's view of the plant's current state *x̂*.

- **Contents.** `record/derived/inventory/` — generated artifacts from `inv modules`, `inv routes`, `inv components`, `inv dependencies`, `inv schemas`, `inv contracts`, `inv glossary`, `inv tests`, `inv coverage`. Plus the L0 sensors' outputs (`sense api`, `sense routes`, `sense data-model`, etc.) at `record/proofs/sensor-readings/`.
- **Author.** No one — F4 is *never* authored. Regenerated only by the inventory subsystem and the L0 sensors. Drift is detected by `inv regen` comparing fresh output to checked-in state.
- **Sensor regime.** `sense-inventory-adherence`, `sense-inventory-determinism`, `sense-inventory-performance`.

### F5 — Harness (the controller infrastructure)

The DEVAI machinery as instantiated in the client repo. The control system itself, not the plant.

- **Contents.** `.devai/` (excluding `inventory/` and `worktrees/`). The constitution as pinned, contracts schemas, skill manifests, agent prompts, role configurations, pack config.
- **Author.** Modified only via `devai adopt upgrade`, never by ordinary disciplines.
- **Sensor regime.** `sense-harness-*` sensors covering the F5×T1..T9 row including idiomaticity, coverage, performance, security, robustness, coherence, depth, alignment, green-main.

## Authority-by-path enforcement

[Article 6](../../reference/law.md) — *"Authority is enforced by filesystem path. The harness refuses writes that violate this mapping at the tool layer, not at review time."*

This is the load-bearing semantic difference between DEVAI and a convention-based governance model. Authority is not "what reviewers expect" or "what the PR template says" — it's what the tool refuses at execution time.

A worker that tries to write outside its declared role's enumerated paths gets a refusal *before* the write happens, not a flag *after*. The mapping is constitutional (immutable at the F1 Owner / F1 Architect / F2 / F3 / F4 / F5 level) and version-pinned per [Article 40](../../reference/law.md). Constitution 0.2.0 (R14) rewrote the F1 enumeration to point at the new section roots; clients pinned to 0.1.1 honour the old mapping until they upgrade.

## Substrate extensions

Clients MAY extend the path mapping for client-specific disciplines (e.g., adding a `db/` Engineer path for a NestJS service that has migrations at a non-default location). Extensions are **additive**; the core mapping is **immutable**.

A client extension lives in `.devai/config/` and is picked up by the harness at boot. The core mapping in Article 6 is never modified locally — only upgraded via `devai adopt upgrade`.

## See also

- [Constitution Article 6](../../reference/law.md) — the path enumeration that this page commentates on.
- [Roles](../../roles) — how human and agent roles map to substrates.
- [Aspect grid](./aspect-grid.md) — the 5×9 grid of substrates × transversals.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/substrates.md (classification CURRENT).
