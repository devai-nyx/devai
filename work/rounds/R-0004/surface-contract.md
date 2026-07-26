---
id: R-0004-SURFACE-CONTRACT
title: R-0004 governed surface and package contract
type: round-contract
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance:
  [
    OM-002; OM-008; DII-162; DII-200; BL-163; BL-165; BL-169; BL-172; BL-174; BL-180; BL-181; BL-182; BL-183; BL-184; R-0004-SURFACE-DISPOSITION; R-0004-OPUS-CLOSE-REVIEW-3-CORRECTION; R-0004-OPUS-CLOSE-REVIEW-6-CORRECTION; R-0004-OPUS-CLOSE-REVIEW-8-CORRECTION; R-0004-SOURCE-CI-REPORTER-PROGRESS-CORRECTION; R-0004-SOURCE-DECISION-SHA-CORRECTION; R-0004-OPUS-CLOSE-REVIEW-11-CORRECTION; R-0004-OPUS-CLOSE-REVIEW-12-CORRECTION; R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION,
  ]
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

The command-description parity guard resolves all 147 keep bindings as 144 literal AST
definitions plus three exact invocations of the init command factory. It verifies the
factory template, invocation segments, owner specialization, and canonical registry
text; it does not claim 147 literal definitions.

## Sensors and schema canon

Every one of the 59 live sensor entries resolves its existing emitter and the exact
successor-local path recorded in the B0 enumeration. The nine diagnostic entries remain
diagnostic and the other fifty retain their current cells; R-0004 creates no standing
upgrade. Archived kinds retain typed retirement behavior.

The full canon linter applies recursively across all 55 schemas. Complete object shapes
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

The build action may execute only `pnpm -r build`.
The root all-suite test action may execute only `pnpm vitest run`. The four named suite
variants may add only `--config` followed by exactly one of
`tests/config/t1.unit.config.ts`, `tests/config/t3.integration.config.ts`,
`tests/config/t4.regression.config.ts`, or `tests/config/t5.e2e.config.ts`. All five test
forms and the build form use registered argv arrays through the host process adapter: no
shell, caller-selected executable, metacharacter expansion, additional argv, arbitrary
config, or recursive root-script call is accepted. Root `build` and `test` invoke the
fixed build and all-suite actions after CLI preparation.

## Workflow and output policy

All required remote jobs prewarm every declared package-manager identity, require built
binaries rather than silently skipping suites, and pin third-party workflow actions by
immutable commit with readable version comments. Generated action and sensor views are
checked byte-for-byte in CI. Human help remains read-only and never supplies consent.
Vitest summary parsing ignores ANSI SGR sequences only in its metric-extraction view;
deterministic R20 fingerprint normalization also ignores ANSI presentation before its
existing time and duration masks and omits only the exact fixed-fixture per-file progress
line selected by CI. The subprocess output retained as evidence remains byte-for-byte
raw, passed/failed summary metrics remain visible, and no characterization baseline is
recaptured.

Governed forty-hex Git identities must resolve as local Git objects.
Historical foreign, predecessor, transient-merge, and intentionally invalid review
specimens are admitted only through the canonical exception registry and only at their
exact classified paths. CI scans the decision register and Auditor records and fails
closed on an unresolved or newly misplaced identity, stale allowed path, or stale
exception; it does not treat an exception value as a repository-wide waiver. The
registry includes two objects that resolve in the development repository but are absent
from clean CI checkouts; their exact-path classifications are exercised hermetically.

R-0004 implements a governed surface and package topology only. It publishes, tags,
releases, deploys, promotes, re-earns, or declares ready nothing.
