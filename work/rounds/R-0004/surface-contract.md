---
id: R-0004-SURFACE-CONTRACT
title: R-0004 governed surface and package contract
type: round-contract
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; DII-162; R-0004-SURFACE-DISPOSITION]
---

# R-0004 governed surface and package contract

## Action identity and disposition

`law/policy/action-registry.json` becomes the single identity authority. Each record has
a never-reminted public `action_id`, internal binding, tokenized path, lifecycle,
disposition, tier, effect, authority contract, and migration. The public space-separated
path is the stable action id. CLI metadata, routing, effects, sensors, documentation,
and tests consume generated views of that source; no local action-id, effect, tier, or
porcelain mirror remains.

Every action in the exact B0 enumeration is `keep`. The 38 historical sensor wrappers
are `fold` records preserving behavior through `sense run <kind>`. Backlog compaction is
a `tombstone`; the retired route must fail with typed migration guidance. Unknown action
ids fail closed. Generation sorts by UTF-8 code-unit order and never by locale or input
insertion order.

## Sensors and schema canon

Every one of the 59 live sensor entries resolves its existing emitter and the exact
successor-local path recorded in the B0 enumeration. The nine diagnostic entries remain
diagnostic and the other fifty retain their current cells; R-0004 creates no standing
upgrade. Archived kinds retain typed retirement behavior.

The full canon linter applies recursively across all 54 schemas. Complete object shapes
must be closed; conditional predicate fragments remain valid; shared vocabulary must
resolve through `common-defs`; generated projections carry verified markers; and a
dereferenced published copy must be byte-identical to its canonical materialization.

## Package topology

The fixed 1.x group is exactly the ten existing public packages plus
`@devai-nyx/core`. Core is an implementation-free, acyclic compatibility façade: its
JavaScript modules contain exports only and it may stage only canonical public assets
selected by active packaging law. It cannot own implementation bodies, hidden state, or
side effects. Pack dry-runs inspect exact contents; publication is forbidden.

## Bounded root porcelain

The build action may execute only `pnpm -r --if-present build`. The test action may
execute only `pnpm exec vitest run`. Both use registered argv arrays through the host
process adapter: no shell, caller-selected executable, metacharacter expansion,
additional argv, or recursive root-script call is accepted. Root `build` and `test`
invoke these actions after CLI preparation.

## Workflow and output policy

All required remote jobs prewarm every declared package-manager identity, require built
binaries rather than silently skipping suites, and pin third-party workflow actions by
immutable commit with readable version comments. Generated action and sensor views are
checked byte-for-byte in CI. Human help remains read-only and never supplies consent.

R-0004 implements a governed surface and package topology only. It publishes, tags,
releases, deploys, promotes, re-earns, or declares ready nothing.
