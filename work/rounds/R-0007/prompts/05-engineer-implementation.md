# Wave 5 — parallel CLI Engineer implementation

## Agents

Use `gpt-5.6-sol` at `high` for bounded implementation and `xhigh` for the final
integration Engineer. Spawn as many disjoint agents as capacity permits:

1. Registry/router/help/catalog/history.
2. Check descriptors, suites, aggregator, and exits.
3. Sense kinds, presets, inventory slices, recording, and migration authority.
4. Round orchestration and round-subordinate task services.
5. Evidence façades.
6. Release façades and `--publish` consent.
7. Init/doctor, `harness`, and upgrade `--tier` vocabulary.
8. Generated views and source/built parity integration.

## Rules

- Engineer-owned package/tooling paths only.
- Reuse services; do not shell through retired CLI routes.
- Keep task plumbing hidden and require `round_id` at service and CLI boundaries.
- Consume the Wave-4 executor substrate; do not create a second executor, routing, or
  execution-evidence implementation in the CLI layer.
- `round run` dispatches only schema-valid, same-round executor contracts and exposes
  no new public agent/model command domain.
- Sensing is observation; recording is explicit.
- Suite and preset populations come from Architect policy.
- Do not hand-edit generated outputs.
- Do not create new user-facing docs in this wave.
- Each commit passes prepare, affected tests, typecheck/lint, and diff-check.

The integration Engineer may resolve imports and regenerate materializations but may not
rewrite another role's policy or tests.
