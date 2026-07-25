# Contracts

**Authority:** Architect (Constitution Article 6, F1).

This directory holds Architect-authored API contracts (OpenAPI), data contracts (JSON Schema), and SQL DDL contracts. The Phase-1 hard gate validates contracts and re-generates derived artifacts to verify byte identity (Article 17).

## Client-facing vs. canonical contracts

There are two distinct contract surfaces in the repo:

- **`docs/reference/contracts/`** (this directory) — Architect-authored _client-facing_ contracts: the OpenAPI specs adopters publish to their consumers, the SQL DDL for adopter databases, and the JSON Schemas adopters expose at runtime. Content is deferred; this directory exists as the canonical home for that material when client work begins.
- **`law/schemas/`** — the schema set governing DEVAI's _own machinery_ (sensor readings, invariants, evidence chain, scorecard, task records, etc.). Distinct F1 path, distinct purpose.

The rest of this doc covers the second tier — DEVAI's own schema canon — because that surface is large, stable, and load-bearing, and adopters reading these contracts need to know what shape the framework expects.

## Adopter-facing contracts in this directory

A growing set of schemas in this directory normalizes inputs/outputs at adopter boundaries (these are NOT part of the fixed `law/schemas/` canon — they govern adopter-authored data the framework consumes):

| Schema                                                                                                                                                                     | Companion adopter doc                                                          | ADR                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [`decisions.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/decisions.schema.json)                 | [`../../adopters/decisions-ledger.md`](../../adopters/decisions-ledger.md)     | (see D-A-42)                                                    |
| [`test-result.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/test-result.schema.json)             | —                                                                              | (record-run/render-matrix)                                      |
| [`mutation-scenario.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/mutation-scenario.schema.json) | [`../../adopters/mutation-scenarios.md`](../../adopters/mutation-scenarios.md) | [`ADR-MUTATION-SCENARIOS`](../../../law/adr/README.md) (D-A-44) |
| [`thresholds.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/thresholds.schema.json)               | [`../../adopters/thresholds.md`](../../adopters/thresholds.md)                 | —                                                               |

Examples for each schema live under [`examples/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/examples/).

## DEVAI's schema canon

**Forensic anchor:** [D-31](../../../law/adr/README.md) — "22 schemas, JSON Schema 2020-12 canon (locked)" — and successor entries that expanded the count.

DEVAI ships a fixed set of JSON Schemas covering every machine-readable artifact the framework produces or consumes. All schemas:

- Use **JSON Schema Draft 2020-12**.
- Set `additionalProperties: false` at every object level (no silent acceptance of unknown fields).
- Use tri-state verdicts where applicable (`pass` / `review` / `fail`, never boolean).
- Declare explicit `$id` URIs and version metadata.

### Canon by concern

| Concern       | Schemas                                                            |
| ------------- | ------------------------------------------------------------------ |
| Primitives    | `sensor-reading`, `evidence`                                       |
| Specification | `invariant`, `journey`, `glossary-entry`, `trace`                  |
| Inventory     | `module`, `inventory`, `trace-resolution`, `test-weakening-config` |
| Work units    | `task`, `backlog`, `lock`, `worktree`                              |
| Escalation    | `rgr`, `escalation`, `triage-result`, `firewall-verdict`           |
| Assessment    | `scorecard`, `assessment`                                          |
| Harness       | `skill-manifest`, `prompt-composition`, `rtd-manifest`             |

The canonical list lives at [`../schemas/`](../../../law/schemas). The full schema catalog is enumerated and validated by `devai spec validate-schemas`.

### How the canon evolves

Adding a schema requires:

1. A canonical D-record indexed under [`law/adr/`](../../../law/adr/README.md), recording the addition and superseding D-31's count claim.
2. The schema file under `law/schemas/` declaring `$id`, `$schema: https://json-schema.org/draft/2020-12/schema`, and `additionalProperties: false`.
3. A type-generation entry so the schema is consumed via `@devai-nyx/schemas` typed imports.
4. An invariant in `law/invariants/` claiming `spec validate-<new-schema>` as `measurable_via`, if the new schema is governance-relevant.

Removing or renaming a schema is a breaking change requiring an Article 40 amendment cycle.

### Why a fixed canon

A smaller schema set with embedded sub-objects was considered. Rejected: every conceptual unit needs independent versioning. A larger set with finer cuts was also considered. Rejected: the additional cuts didn't carry independent semantics — they just added decode hops.

Each schema as it stands is the canonical representation of a distinct concept, with a distinct authority, lifecycle, and reader. The set is intentionally kept narrow; new additions require an explicit D-entry rather than landing as drift.

## Phase-1 contract gate

Whenever client-facing contracts land under this directory, the Phase-1 hard gate:

1. Validates each contract against its meta-schema (OpenAPI 3.x linting; JSON Schema 2020-12 validation; SQL DDL parsing).
2. Regenerates derived artifacts (typed clients, type definitions, migration stubs) and verifies byte identity with the committed copies.
3. Cross-checks: every contract referenced by an invariant via `measurable_via` must exist; every contract must be cited by at least one invariant.

Drift on any check is a hard-fail.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/contracts/README.md (classification CURRENT).
