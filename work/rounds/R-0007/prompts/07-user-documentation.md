# Wave 7 — canonical reference descriptors and R-0009 handoff

## Agents

Prepare canonical machine descriptors and the minimum migration/operator handoff. Full
narrative documentation and site integration are explicitly deferred to R-0009.

| Agent                         | Model         | Effort | Responsibility                                                                             |
| ----------------------------- | ------------- | ------ | ------------------------------------------------------------------------------------------ |
| Concept Architect             | `gpt-5.6-sol` | xhigh  | overview, vocabulary, tiers, rounds/tasks/executors, authority/effects                     |
| Reference Architect           | `gpt-5.6-sol` | high   | suites, presets, inventory slices, executor selection, examples and operational guidance   |
| Generated-reference Architect | `gpt-5.6-sol` | high   | sensor-kind, model/runtime, and migration-table generators/templates and canonical routing |

All agents are Architect-authority and may edit only their exact `docs/`, Architect-owned
generator-template/policy paths, and round handoff allowlists. Generated package output,
plant code, and tests remain outside this wave.

## Required handoff artifacts

1. CLI overview: seven workflows, typical adoption-to-release journey, and command-selection guide.
2. Vocabulary: suite/preset/kind/slice/tier plus round/task, role, effect, verdict, lifecycle, porcelain/plumbing.
3. Check suites reference: exact ordered membership and behavior of quick, standard, full, release.
4. Sense presets reference: exact ordered membership and behavior of baseline, structural, governed, sweep.
5. Sensor-kind catalog generated from the live registry.
6. Inventory-slice reference generated from the live slice descriptor policy.
7. Adoption-tier guide explaining binding versus advisory behavior and climb requirements.
8. Round/task/executor guide explaining ownership, containment, waves, dependencies,
   `routine`/`agent`/`human`/`composite`, selection and fallback, resources, recovery,
   requested-versus-resolved execution, and hidden task plumbing.
9. Authority/effects guide explaining five roles, four effects, `--write`, and `--publish` with safe examples.
10. Migration guide generated from the complete old-to-new map, including removed capabilities.
11. Model/runtime reference generated from the canonical registry, including vendor,
    family, runtime, exact model identifier or governed alias, supported efforts,
    capabilities, availability, replacement metadata, and selection eligibility.

## Per-enumeration content contract

For every value, document:

- stable identifier and user-facing label;
- plain-language purpose;
- exact included population or produced projection;
- prerequisites and required external tools;
- accepted inputs and defaults;
- output schema/shape and verdict semantics;
- declared effects and consent flags;
- relative cost class (`fast`, `moderate`, `expensive`, `external-dependent`), without unstable time promises;
- when to use and when not to use;
- failure, error, unknown, review, skipped, and N/A behavior where applicable;
- at least one copy-paste example using only the new grammar;
- canonical source link and related workflow.

## Single-source rules

- Generate mutable enumerations from policy/registry/schema sources.
- Treat the model/runtime registry as availability truth; do not document an example
  model as runnable unless its adapter and effort combination are rostered.
- Narrative pages link to generated tables and do not duplicate full membership lists.
- Generated output is deterministic, stable-order, and checkable without writes.
- Historical terminology appears only in migration/history sections.
- Public docs say `harness`, `suite`, `preset`, `kind`, `slice`, `tier`, and `--publish`.
- Clearly distinguish authority discipline from executor kind, requested execution from
  resolved execution, and exact selection from authorized fallback.
- Do not introduce a `devai docs` public workflow.
- Do not claim release or readiness from documentation completeness.

Each Architect reads link/parity/example checks before committing.
