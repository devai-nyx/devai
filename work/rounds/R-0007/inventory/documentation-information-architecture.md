---
id: R-0007-DOCUMENTATION-INFORMATION-ARCHITECTURE-INVENTORY
title: R-0007 canonical-reference and R-0009 documentation architecture
type: inventory
status: active
date: 2026-08-07
authority: Architect
provenance:
  - ADR-023
  - R-0007 plan canonical reference handoff
  - R-0007 B1 output and documentation contracts
---

# Documentation information architecture inventory

This is the readable inventory for ADR-023. The machine authority is
`law/policy/documentation-information-architecture.json`; this inventory does not carry a
second canonical population. Paths below are planned targets. Their appearance here does not
claim that R-0009 pages, a complete narrative corpus, or a deploy-ready site exist.

## Current boundary

- `law/`, `product/`, `work/`, and `record/` retain the source authorities assigned by
  ADR-007. Published views do not become authoring sources.
- The current `docs/reference/cli.md` and other existing pages predate the R-0007 grammar.
  They remain inputs for R-0009's risk-classified semantic rebind, not proof of this manifest.
- R-0007 produces canonical descriptors and minimum safe operator/migration guidance.
- R-0009, only after its own valid entry, authors the complete narrative pages, integrates
  generated references, repairs links and sidebars, and builds the deploy-ready artifact.
- Neither round receives deployment or release standing from this inventory.

## Exact planned page set

| Order | Page ID                | Planned path                                 | Content boundary                                         | R-0007 delivery          | R-0009 completion                                |
| ----: | ---------------------- | -------------------------------------------- | -------------------------------------------------------- | ------------------------ | ------------------------------------------------ |
|     1 | `cli-overview`         | `docs/reference/cli/index.md`                | Narrative that links to generated reference              | Minimum operator handoff | Complete conceptual journey and site integration |
|     2 | `vocabulary`           | `docs/reference/cli/vocabulary.md`           | Narrative distinctions plus generated tables             | Canonical descriptor     | Complete conceptual vocabulary                   |
|     3 | `check-suites`         | `docs/reference/cli/check-suites.md`         | Generated reference                                      | Canonical descriptor     | Generated page and site integration              |
|     4 | `sense-presets`        | `docs/reference/cli/sense-presets.md`        | Generated reference                                      | Canonical descriptor     | Generated page and site integration              |
|     5 | `sensor-kinds`         | `docs/reference/cli/sensor-kinds.md`         | Generated reference                                      | Canonical descriptor     | Generated page and site integration              |
|     6 | `inventory-slices`     | `docs/reference/cli/inventory-slices.md`     | Generated reference                                      | Canonical descriptor     | Generated page and site integration              |
|     7 | `adoption-tiers`       | `docs/reference/cli/adoption-tiers.md`       | Narrative distinctions plus generated table              | Canonical descriptor     | Complete adoption guidance                       |
|     8 | `round-task-executors` | `docs/reference/cli/round-task-executors.md` | Narrative operation plus generated executor tables       | Minimum operator handoff | Complete lifecycle and recovery guide            |
|     9 | `authority-effects`    | `docs/reference/cli/authority-effects.md`    | Narrative safety model plus generated role/effect tables | Minimum operator handoff | Complete authority guide                         |
|    10 | `migration`            | `docs/reference/cli/migration.md`            | Generated migration table plus safe narrative            | Safe migration handoff   | Generated page and site integration              |
|    11 | `model-runtime`        | `docs/reference/cli/model-runtime.md`        | Generated roster reference                               | Canonical descriptor     | Generated page and site integration              |

The page order is the reference navigation order. It begins with command selection, teaches
the vocabulary before specialized catalogs, places round/task execution before authority and
migration, and leaves mutable model availability in a generated roster.

## Exact category routing

| Category                | Canonical population source                                                                                                       | Page                   | Required parity source                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| `check-suites`          | `law/policy/check-suites.json#/suites`                                                                                            | `check-suites`         | Suite command membership and order                             |
| `sense-presets`         | `law/policy/sense-presets.json#/presets`                                                                                          | `sense-presets`        | Sensor registry and sweep exclusions                           |
| `inventory-slices`      | `law/policy/round-execution.json#/vocabularies/inventory_slices`                                                                  | `inventory-slices`     | Runtime slice implementations or explicit unsupported contract |
| `adoption-tiers`        | `law/policy/round-execution.json#/vocabularies/adoption_tiers`                                                                    | `adoption-tiers`       | Binding/advisory semantics                                     |
| `executor-kinds`        | `law/schemas/task.schema.json#/properties/executor`                                                                               | `round-task-executors` | Round execution policy                                         |
| `agent-selection-modes` | `law/schemas/task.schema.json#/$defs/agentSelection/properties/mode/enum`                                                         | `round-task-executors` | Agent routing policy                                           |
| `roles`                 | `law/schemas/action-registry.schema.json#/$defs/authorityContract/properties/subject/oneOf/1/properties/allowed_roles/items/enum` | `authority-effects`    | Authority policy                                               |
| `effects`               | `law/schemas/action-registry.schema.json#/properties/entries/items/properties/effect/enum`                                        | `authority-effects`    | Per-action registry assignments                                |
| `verdicts`              | `law/policy/round-execution.json#/vocabularies/verdicts`                                                                          | `vocabulary`           | Sensor execution-state subset                                  |
| `action-lifecycles`     | `law/schemas/action-registry.schema.json#/properties/entries/items/properties/lifecycle/enum`                                     | `vocabulary`           | Per-action registry assignments                                |
| `surface-tiers`         | `law/policy/round-execution.json#/vocabularies/surface_tiers`                                                                     | `vocabulary`           | Action-registry schema parity                                  |
| `sensor-kinds`          | `law/policy/sensor-registry.json#/entries[].kind`                                                                                 | `sensor-kinds`         | Preset membership and effect                                   |
| `runtimes`              | `law/policy/model-runtime-registry.json#/runtimes`                                                                                | `model-runtime`        | Runtime adapter registration                                   |
| `rostered-models`       | `law/policy/model-runtime-registry.json#/models`                                                                                  | `model-runtime`        | Selection eligibility and availability                         |
| `supported-efforts`     | `law/policy/model-runtime-registry.json#/models[].supported_efforts`                                                              | `model-runtime`        | Deduplicated UTF-8 byte order                                  |

`joint` is an authority-composition marker and is not a sixth human governance role. Model
capability and executor kind do not grant role authority. Surface tier, adoption tier, check
suite, sensor preset, sensor kind, and inventory slice remain distinct concepts even when a
single command displays more than one of them.

## Generated and narrative boundary

Generated-reference content owns every complete mutable enumeration. Its renderer reads the
candidate's canonical bytes, preserves declared order, resolves all named joins, and emits
deterministic bytes. A check invocation compares without writing. A materialization invocation
may write only its declared generated targets and must mark their canonical sources.

Narrative content owns mental models, selection advice, non-goals, recovery, and worked
explanation. It may name an individual value in an example, but it links to the generated
table for the complete population and does not reproduce that table in prose.

The migration page is the sole mixed case: its table is generated from the complete
old-to-new map and checked against the action registry; the adjacent prose explains the
fail-closed operator procedure. Historical spellings outside migration or history are drift.

## Per-entry semantic contract

Every generated value must carry all fields declared by the IA policy. In human terms, each
entry answers:

1. what the stable value is and how it is labelled;
2. what it means and what exact population or projection it includes;
3. what it requires, accepts, and defaults;
4. what it emits and how every verdict or non-pass outcome behaves;
5. what it may affect and which independent consent flags apply;
6. its relative cost class without a time promise;
7. when it is and is not appropriate;
8. one copy-paste example in the new grammar; and
9. which canonical source and workflow govern it.

An explicit not-applicable reason is a value; a missing field is not.

## Completeness progression

- B2 validates the policy/schema and the uniqueness and internal linkage of this manifest.
- B5 resolves all cross-stream canonical sources and produces deterministic descriptors plus
  minimum safe operator/migration material.
- B6 proves exact category and migration bijections, semantic-field completeness, examples,
  generated-byte stability, historical-vocabulary containment, and the nonclaim ceiling.
- R-0009 proves the planned page paths, narrative completeness, links, sidebars, site bytes,
  and deploy-ready artifact only after its own entry gates pass.

At R-0007 close the only positive documentation claim available is
`canonical descriptor handoff complete`. Narrative completeness and deploy readiness remain
false.
