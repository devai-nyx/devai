# Wave 4 — typed task executor substrate

## Authority and dependency

This is an Engineer wave. It starts only after the Wave-2 Inspector reds and Wave-3
Architect executor/model setpoint are committed. It is a prerequisite for the CLI and
round integration in Wave 5.

Use `gpt-5.6-sol` at `high` for bounded package implementation and `xhigh` for the
integration Engineer. Use dedicated worktrees, exact path allowlists, and one role per
commit. Do not edit Architect law or Inspector tests.

## Agents

Spawn bounded Engineer agents as capacity and disjoint ownership permit:

1. Task schema/parser/type integration and explicit legacy-record refusal.
2. Model/runtime registry loader and exact/preferred/policy resolver.
3. Routine and agent executor adapters plus authority/effect enforcement.
4. Human/composite lifecycle, same-round child validation, dependency ordering, and
   cycle rejection.
5. Requested-versus-resolved task-execution evidence and integration.

The integration Engineer owns cross-package wiring and generated materialization only.

## Required implementation

- Require `round_id` and a closed `executor` discriminated union on every new task.
- Keep `discipline` as governance authority; executor/model capability grants none.
- Support `routine`, `agent`, `human`, and `composite` executor kinds.
- Routine execution accepts a registered action or explicit argv without a shell,
  validates relative cwd, declared inputs/outputs/effects, timeout, and authority.
- Agent execution resolves a rostered runtime/model/effort using:
  - `exact`: no substitution;
  - `preferred`: only the ordered explicit fallback allowlist;
  - `policy`: only the named, versioned routing policy.
- Agent execution may reference one registered skill ID; the skill's class, permission
  tier, and capabilities must be compatible with the task authority and selected model.
- Model names remain registry values rather than task-schema enums. Registry entries
  bind stable ID, vendor/family, runtime/adapter, exact provider identifier or governed
  alias, supported efforts, capabilities, eligible agent classes, availability, and
  replacement metadata.
- Require prompt-composition linkage for agent work.
- Human execution requires the declared role and completion evidence.
- Composite execution references child task IDs only; all children belong to the same
  round, dependency order is explicit, and cycles fail before dispatch.
- Persist immutable requested executor data and a separate resolved execution record
  containing runtime/model/effort or canonical argv, adapter/tool versions, inputs,
  output/evidence digests, selection/fallback decision, usage/cost where applicable,
  timestamps, and verdict.
- Never infer a round, executor, model, or effort for legacy records. Preserve them as
  historical input and block execution until an explicitly mapped migration occurs.

## Focused gates

Read and pass the Wave-2 executor contract suite, affected schema roster/parity checks,
task/round unit and integration tests, model resolver tests, evidence-schema tests,
typecheck, lint, prepare, coverage floors, and `git diff --check`.

Stop on implicit fallback, arbitrary shell execution, cross-round composite execution,
task-request mutation, unrostered runnable models, authority derived from capability,
schema/type/runtime drift, or pressure to implement the public CLI façade in this wave.
