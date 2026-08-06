# Wave 1 — entry, authority, and current-state audit

## Agents

| Agent            | Model         | Effort | Authority                 | Paths                                           |
| ---------------- | ------------- | ------ | ------------------------- | ----------------------------------------------- |
| Owner recorder   | `gpt-5.6-sol` | high   | Owner; transcription only | exact authorized `product/owner-mandates/` file |
| Surface Auditor  | `gpt-5.6-sol` | xhigh  | Auditor                   | new round-specific `work/audit/` paths only     |
| Consumer Auditor | `gpt-5.6-sol` | xhigh  | Auditor                   | separate audit file; no overlap                 |

## Instructions

1. Verify the direct Owner instruction, live release standing, and exact scope. Do not manufacture or broaden the mandate.
2. Inventory all runnable/historical actions, public/internal consumers, package scripts, skills, docs, CI, schemas, and generated views.
3. Record source-vs-built parity, current help, current set expansions, sensor registry,
   task schema, task/round relationship, every extant task record, model tiers,
   prompt-composition targets, skill/runtime adapters, wave model/effort headers,
   execution evidence, effects, and output contracts.
4. Search every adopter/current-doc invocation of routes or vocabulary that will change.
5. Freeze an exact machine-readable 147-row command migration denominator and an exact
   task-schema/model-runtime migration inventory for Inspector ownership in the next wave.
6. Inventory every applicable GitHub Actions feature and current workflow job/needs graph,
   duplicated setup/install work, queue/setup/install/job/critical-path durations, action pins,
   permissions, cache/artifact/report/retention behavior, event concurrency, repository
   visibility/plan, fork policy, rulesets and required checks. Assign no feature disposition
   until live availability and present semantics are evidenced.
7. Inventory every current commit-floor selector and affected-test/command-closure dependency
   used to derive the four validation classes. Unknown or non-mechanical boundaries are defects,
   not candidates for optimistic classification.

## Stop conditions

Stop on missing authorization, stable/RC publication evidence, dirty/shared worktree,
predecessor mutation, unresolved open-PR collision, or an inability to establish the
exact current population.
