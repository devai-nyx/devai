# Wave 3 — Architect semantic setpoint

## Agents

Spawn three `gpt-5.6-sol` agents at `xhigh`, each as Architect with disjoint paths:

1. CLI-law Architect — ADR, action registry, effects, authority, dispositions, counts, migration guidance.
2. Workflow/executor Architect — suite/preset/slice/tier policies, round-task/executor
   schema semantics, model/runtime registry, routing policy, execution evidence,
   lifecycle and output contracts.
3. Information Architect — user-doc architecture, canonical-source routing, generated/reference boundaries, migration narrative.

## Binding decisions

- Freeze the seven-domain porcelain and hidden task/catalog plumbing.
- Freeze exact suite and preset membership and order in machine-readable policy.
- Define `kind`, `slice`, and `tier` without overlap.
- Define every task as belonging to exactly one active round; no unmanaged escape in this round.
- Define a breaking task-schema revision requiring one closed `routine`, `agent`,
  `human`, or `composite` executor.
- Keep discipline/authority independent from executor and model capability.
- Define routine registered-action/shell-free-argv semantics; agent
  exact/preferred/policy resolution; human evidence completion; and same-round,
  cycle-free composite children.
- Define an Architect-owned model/runtime registry and rostered task-execution evidence
  schema. Model names are registry data, not task-schema enums.
- Define immutable requested executor data, separately resolved execution evidence, and
  fail-closed explicit migration for legacy task records.
- Define `round run` selection, dependency, role, resource, failure, and rollback semantics.
- Correct effect classifications using actual capabilities.
- Define `--publish` as independent consent in addition to `--write`.
- Preserve historical identities; folds and tombstones never dispatch.
- Freeze documentation pages, generated tables, semantic fields, and completeness gates.

Do not write package implementation or tests. Any unresolved semantic choice blocks the
Engineer wave.
