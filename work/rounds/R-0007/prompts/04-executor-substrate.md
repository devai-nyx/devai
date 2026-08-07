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

## 2026-08-07 bounded pre-B3B gate amendment

This appendix preserves the historical Wave-4 instruction above while resolving its
phase-ownership conflict with the canonical plan, the Wave-4-before-Wave-5 dependency, and
OM-021's mechanically classified validation setpoint. It does not waive, relabel, skip, or
turn any observed failure green. The complete round-close population and the unchanged
70/60/70/70 floors remain binding.

### B3A-owned admission gates

B3A integration is admitted to B3B only when all of the following package-native and
focused checks pass on one clean exact candidate:

1. `pnpm run devai:prepare` and `pnpm run action-registry:check` prove source/generated
   parity and build the integration boundary.
2. Direct package builds for `@devai-nyx/schemas`, `@devai-nyx/loop`, and
   `@devai-nyx/evidence` provide the B3A typecheck boundary. Direct ESLint and Prettier
   checks cover every B3A-owned changed TypeScript path; a root wrapper that still routes
   through a retired CLI spelling is not substituted for these checks.
3. `packages/schemas/tests/contract/roster.contract.test.ts` proves the affected schema
   roster and compilation population.
4. `packages/loop/tests/unit/backlog-tasks.test.ts`, after the Inspector's schema-2 fixture
   migration, and the complete `@devai-nyx/loop` package test population prove task
   persistence, round binding, pre-resource refusal, and lifecycle behavior. The explicit
   schema-1 historical-record case remains non-executable and is not migrated into a
   runnable fixture.
5. `tests/contract/r0007-b1-executor-semantics.red.contract.test.ts` passes every
   `B1-EXEC-*` case except the ten parameterized CLI-façade cases whose names begin with
   `B1-EXEC-005 requires an active --round before task`. `B1-EXEC-005A` remains in B3A
   and must pass. The excluded ten cases remain red B3B obligations; their exclusion is
   an ownership boundary, not a PASS disposition.
6. The `R7-B1-EXEC-*` task/execution-evidence schema cases in
   `tests/contract/r0007-b1-output-docs.red.contract.test.ts` and the complete
   `@devai-nyx/evidence` package test population pass.
7. `git diff --check`, clean-boundary checks, exact-path and role-purity inspection, and
   inspection of every gate output pass before the B3A integration commit.

Any failure inside this B3A-owned population blocks B3B. B3B may consume the substrate only
after the Architect appendix, the Inspector schema-2 fixture migration, and the Engineer
integration/materialization commits are role-pure and the complete B3A population above is
green on their integrated exact candidate.

### Later-wave ownership retained as red until proved

- B3B owns the ten `B1-EXEC-005` CLI cases and the root `lint` and `typecheck` wrappers
  whose current argv still enters retired CLI routes. B3B must repair the canonical
  façade/wrapper routing and pass those commands; B3A must not implement that public CLI
  work or report the current failures as green.
- B3B integration owns the first eligible post-façade complete repository Vitest run
  (`pnpm vitest run`) and coverage execution (`pnpm run test:coverage:t1-t3`). That
  coverage run retains the exact 70/60/70/70 thresholds and must pass before B3C consumes
  the integrated CLI/executor surface.
- B3C reruns the complete minimum and exit floors plus whole coverage after classifier,
  workflow, test-configuration, or cold-lane changes because those changes have broad
  impact. No classified or cached result substitutes for that cold population.
- B4 reruns the complete executable acceptance population and whole coverage after its
  Inspector work. B7 convergence and close retain every complete floor already required
  by the orchestrator, shared execution contract, and active close-control profile.

The first eligible complete coverage run and every required later rerun use the unchanged
70/60/70/70 floors. A complete-suite or coverage failure observed before its owning repair
lands remains a named red dependency and cannot be cited as a B3A PASS, an exception, or a
reduced population.
