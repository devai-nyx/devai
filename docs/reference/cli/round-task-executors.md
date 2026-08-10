# Rounds, tasks, and executors

A round is the governed container; a task is subordinate work; an executor is the declared
mechanism for attempting that work. These three layers stay separate so scheduling cannot invent
authority and execution evidence cannot rewrite the request it is meant to prove.

The complete executor-kind and agent-selection populations on this page are generated from
canonical schemas and policies. Narrative outside those blocks explains containment, operation,
and recovery without maintaining another enum.

## Ownership and containment

Every executable task:

- has one `R-NNNN` owner;
- is valid only while that same round is active;
- carries one governance `discipline`, which remains its authority source;
- carries exactly one immutable requested executor contract; and
- is selected for ordinary execution through `devai round run`.

Round validation and complete task-population validation happen before worktree creation, lock
acquisition, or executor dispatch. A direct hidden task command still requires `--round` and cannot
move a task across rounds or bypass the active-round check.

Read the container before running anything:

```sh
devai round status --round R-1000 --repo-root . --format json
```

## Plans, waves, and tasks

The Architect-owned round plan defines the authorized work and may group related task production
into waves. A wave is planning and coordination structure, not an executor kind, lifecycle state,
or grant of parallelism. Runtime dispatch is determined by the canonical task graph, resource
claims, active-round standing, and role order.

Use tasks for independently evidenced units of work. If work crosses authority paths, model it as
coupled role-pure tasks in the policy-declared order rather than one mixed-role task. A role change
requires a new session and commit boundary.

## Selection and dependency closure

`round run` accepts either the default all-ready selection or one or more explicit task IDs. In
both cases the runtime:

1. validates the complete selected population against the requested active round;
2. expands the mandatory same-round dependency closure;
3. rejects a missing dependency, a cross-round edge, or a cycle before dispatch;
4. schedules in the deterministic order declared by the round-execution policy; and
5. permits parallel dispatch only within a dependency generation whose resource claims are
   disjoint.

Implicit task independence is forbidden. Dependency edges can come from the task's upstream
reference, a coupled group position, or a composite executor's declared graph. A failed dependency
keeps its dependants blocked; an independent, resource-disjoint branch may continue.

Select one task deliberately:

```sh
devai round run --round R-1000 --task TASK-7001 --repo-root . --as-role engineer --write --format json
```

The example assumes the task exists, is ready, belongs to `R-1000`, and has Engineer discipline.
If any assumption is false, dispatch must refuse rather than reinterpret the request.

## Lifecycle and checkpoints

A new task begins in the policy-declared initial state and moves only through declared transitions.
The lifecycle distinguishes readiness, resource denial, active work, checkpoints, review,
pre-merge/merge, governed gaps, escalation, completion, and cancellation. Undeclared transitions
are contract errors, and timestamps must remain monotonic and evidenced.

Checkpoints preserve bounded progress without turning partial work into completion. A task paused on
a reference gap releases its locks, preserves the governed branch/evidence needed for repair, and
returns to scheduling only through a declared resolution transition. Terminal state is not inferred
from a process exit or a partial output.

The exact state machine is
[`round-execution.json#/lifecycle`](../../../law/policy/round-execution.json). Action lifecycle
vocabulary is a different concept; see [action lifecycles](./vocabulary.md#action-lifecycles).

## Resources and isolation

Resource claims are task data, not model suggestions. Before dispatch, the scheduler derives
canonical lock keys for the task's target substrate/module, database isolation identity, and
worktree. It acquires the complete set in canonical order or acquires none.

A conflict produces an evidenced lock-denied state and requeue; repeated conflict escalates for
human review. Locks are released at the policy-declared completion, escalation, gap, or cancellation
boundaries. The executor cannot expand a claim after resolution, and model capability cannot claim
a path, database, or worktree.

## Canonical executor-kind descriptors

Choose a kind by the work contract: deterministic registered action or shell-free argv,
provider-backed bounded reasoning, evidenced human checkpoint, or explicit same-round composition.
The generated descriptors below own the complete kind population and every per-kind field.

<!-- devai:generated-reference:start category="executor-kinds" -->

## Executor kinds

<!-- devai:generated-entry category="executor-kinds" id="routine" -->

### `routine` — Routine

- **Stable ID:** routine
- **User-facing label:** Routine
- **Purpose:** `routine` is one closed requested-executor branch; discipline, not executor kind, grants authority.
- **Population or projection:** All schema fields in `#/$defs/routineExecutor` plus the exact `routine` discriminator.
- **Prerequisites:** One active owning round and one schema-valid immutable requested executor contract.
- **Required external tools:** Only the registered action or literal shell-free argv tools.
- **Accepted inputs:** The exact `routine` task-schema branch; fields from other executor branches are rejected. Dispatch uses `--as-role <allowed-role>` or a live authority session plus `--write`.
- **Defaults:** No executor kind is inferred for new or legacy tasks.
- **Output contract:** Requested executor remains immutable; resolution and completion are recorded separately in task-execution evidence.
- **Verdict semantics:** Incomplete, mismatched, cyclic, cross-round, timed-out, or unevidenced execution blocks completion.
- **Declared effect:** Derived from the requested work and its registered actions; executor kind grants no effect.
- **Consent flags:** Derived from the resolved action effects; executor kind supplies no consent.
- **Cost class:** `moderate`
- **When to use:** Use `routine` only when its closed execution contract matches the task.
- **When not to use:** Do not use it to bypass round containment, role authority, or evidence requirements.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai round run --round R-1000 --repo-root . --as-role owner --write --format json`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/properties/executor)
- **Related workflow:** `round`

<!-- devai:generated-entry category="executor-kinds" id="agent" -->

### `agent` — Agent

- **Stable ID:** agent
- **User-facing label:** Agent
- **Purpose:** `agent` is one closed requested-executor branch; discipline, not executor kind, grants authority.
- **Population or projection:** All schema fields in `#/$defs/agentExecutor` plus the exact `agent` discriminator.
- **Prerequisites:** One active owning round and one schema-valid immutable requested executor contract.
- **Required external tools:** A rostered runtime adapter and provider/host preflight.
- **Accepted inputs:** The exact `agent` task-schema branch; fields from other executor branches are rejected. Dispatch uses `--as-role <allowed-role>` or a live authority session plus `--write`.
- **Defaults:** No executor kind is inferred for new or legacy tasks.
- **Output contract:** Requested executor remains immutable; resolution and completion are recorded separately in task-execution evidence.
- **Verdict semantics:** Incomplete, mismatched, cyclic, cross-round, timed-out, or unevidenced execution blocks completion.
- **Declared effect:** Derived from the requested work and its registered actions; executor kind grants no effect.
- **Consent flags:** Derived from the resolved action effects; executor kind supplies no consent.
- **Cost class:** `external-dependent`
- **When to use:** Use `agent` only when its closed execution contract matches the task.
- **When not to use:** Do not use it to bypass round containment, role authority, or evidence requirements.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai round run --round R-1000 --repo-root . --as-role owner --write --format json`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/properties/executor)
- **Related workflow:** `round`

<!-- devai:generated-entry category="executor-kinds" id="human" -->

### `human` — Human

- **Stable ID:** human
- **User-facing label:** Human
- **Purpose:** `human` is one closed requested-executor branch; discipline, not executor kind, grants authority.
- **Population or projection:** All schema fields in `#/$defs/humanExecutor` plus the exact `human` discriminator.
- **Prerequisites:** One active owning round and one schema-valid immutable requested executor contract.
- **Required external tools:** Not applicable unless the executor record declares a tool through a child or completion procedure.
- **Accepted inputs:** The exact `human` task-schema branch; fields from other executor branches are rejected. Dispatch uses `--as-role <allowed-role>` or a live authority session plus `--write`.
- **Defaults:** No executor kind is inferred for new or legacy tasks.
- **Output contract:** Requested executor remains immutable; resolution and completion are recorded separately in task-execution evidence.
- **Verdict semantics:** Incomplete, mismatched, cyclic, cross-round, timed-out, or unevidenced execution blocks completion.
- **Declared effect:** Derived from the requested work and its registered actions; executor kind grants no effect.
- **Consent flags:** Derived from the resolved action effects; executor kind supplies no consent.
- **Cost class:** `moderate`
- **When to use:** Use `human` only when its closed execution contract matches the task.
- **When not to use:** Do not use it to bypass round containment, role authority, or evidence requirements.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai round run --round R-1000 --repo-root . --as-role owner --write --format json`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/properties/executor)
- **Related workflow:** `round`

<!-- devai:generated-entry category="executor-kinds" id="composite" -->

### `composite` — Composite

- **Stable ID:** composite
- **User-facing label:** Composite
- **Purpose:** `composite` is one closed requested-executor branch; discipline, not executor kind, grants authority.
- **Population or projection:** All schema fields in `#/$defs/compositeExecutor` plus the exact `composite` discriminator.
- **Prerequisites:** One active owning round and one schema-valid immutable requested executor contract.
- **Required external tools:** Not applicable unless the executor record declares a tool through a child or completion procedure.
- **Accepted inputs:** The exact `composite` task-schema branch; fields from other executor branches are rejected. Dispatch uses `--as-role <allowed-role>` or a live authority session plus `--write`.
- **Defaults:** No executor kind is inferred for new or legacy tasks.
- **Output contract:** Requested executor remains immutable; resolution and completion are recorded separately in task-execution evidence.
- **Verdict semantics:** Incomplete, mismatched, cyclic, cross-round, timed-out, or unevidenced execution blocks completion.
- **Declared effect:** Derived from the requested work and its registered actions; executor kind grants no effect.
- **Consent flags:** Derived from the resolved action effects; executor kind supplies no consent.
- **Cost class:** `expensive`
- **When to use:** Use `composite` only when its closed execution contract matches the task.
- **When not to use:** Do not use it to bypass round containment, role authority, or evidence requirements.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai round run --round R-1000 --repo-root . --as-role owner --write --format json`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/properties/executor)
- **Related workflow:** `round`

<!-- devai:generated-reference:end category="executor-kinds" -->

## Canonical agent-selection descriptors

Agent execution must bind an available roster entry and one declared selection mode. The generated
descriptors own the complete mode population, accepted fields, defaults, costs, examples, and all
failure semantics.

<!-- devai:generated-reference:start category="agent-selection-modes" -->

## Agent selection modes

<!-- devai:generated-entry category="agent-selection-modes" id="exact" -->

### `exact` — Exact

- **Stable ID:** exact
- **User-facing label:** Exact
- **Purpose:** Require one exact roster entry with no substitution.
- **Population or projection:** One registry_id.
- **Prerequisites:** A schema-valid agent executor and model/runtime entries that are available in the canonical registry; host preflight is still mandatory.
- **Required external tools:** The adapter declared by the selected runtime entry and its provider or host preflight.
- **Accepted inputs:** Only the fields admitted by the `exact` conditional branch of agentSelection.
- **Defaults:** No implicit mode, latest version, provider alias, or fallback.
- **Output contract:** Resolved executor and selection/fallback decision are recorded separately from the immutable requested executor.
- **Verdict semantics:** The first unresolved, unavailable, capability, effort, adapter, or exact-identity mismatch blocks before provider invocation.
- **Declared effect:** Not applicable: a selection mode grants no action effect; the resolved task work declares effects separately.
- **Consent flags:** Not applicable: selection mode grants no consent; the resolved task actions enforce their own consent.
- **Cost class:** `external-dependent`
- **When to use:** Use `exact` when its explicit substitution boundary is intended and authorized.
- **When not to use:** Do not use it to create implicit fallback, infer authority, or select an unrostered model/effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/$defs/agentSelection/properties/mode/enum); [`law/policy/agent-routing-policies.json`](../../../law/policy/agent-routing-policies.json)
- **Related workflow:** `round`

<!-- devai:generated-entry category="agent-selection-modes" id="preferred" -->

### `preferred` — Preferred

- **Stable ID:** preferred
- **User-facing label:** Preferred
- **Purpose:** Try only one task-owned ordered allowlist.
- **Population or projection:** One ordered nonempty registry_ids allowlist.
- **Prerequisites:** A schema-valid agent executor and model/runtime entries that are available in the canonical registry; host preflight is still mandatory.
- **Required external tools:** The adapter declared by the selected runtime entry and its provider or host preflight.
- **Accepted inputs:** Only the fields admitted by the `preferred` conditional branch of agentSelection.
- **Defaults:** No implicit mode, latest version, provider alias, or fallback.
- **Output contract:** Resolved executor and selection/fallback decision are recorded separately from the immutable requested executor.
- **Verdict semantics:** The first unresolved, unavailable, capability, effort, adapter, or exact-identity mismatch blocks before provider invocation.
- **Declared effect:** Not applicable: a selection mode grants no action effect; the resolved task work declares effects separately.
- **Consent flags:** Not applicable: selection mode grants no consent; the resolved task actions enforce their own consent.
- **Cost class:** `external-dependent`
- **When to use:** Use `preferred` when its explicit substitution boundary is intended and authorized.
- **When not to use:** Do not use it to create implicit fallback, infer authority, or select an unrostered model/effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/$defs/agentSelection/properties/mode/enum); [`law/policy/agent-routing-policies.json`](../../../law/policy/agent-routing-policies.json)
- **Related workflow:** `round`

<!-- devai:generated-entry category="agent-selection-modes" id="policy" -->

### `policy` — Policy

- **Stable ID:** policy
- **User-facing label:** Policy
- **Purpose:** Resolve only through one named and versioned routing policy.
- **Population or projection:** One policy_id and exact policy_version roster.
- **Prerequisites:** A schema-valid agent executor and model/runtime entries that are available in the canonical registry; host preflight is still mandatory.
- **Required external tools:** The adapter declared by the selected runtime entry and its provider or host preflight.
- **Accepted inputs:** Only the fields admitted by the `policy` conditional branch of agentSelection.
- **Defaults:** No implicit mode, latest version, provider alias, or fallback.
- **Output contract:** Resolved executor and selection/fallback decision are recorded separately from the immutable requested executor.
- **Verdict semantics:** The first unresolved, unavailable, capability, effort, adapter, or exact-identity mismatch blocks before provider invocation.
- **Declared effect:** Not applicable: a selection mode grants no action effect; the resolved task work declares effects separately.
- **Consent flags:** Not applicable: selection mode grants no consent; the resolved task actions enforce their own consent.
- **Cost class:** `external-dependent`
- **When to use:** Use `policy` when its explicit substitution boundary is intended and authorized.
- **When not to use:** Do not use it to create implicit fallback, infer authority, or select an unrostered model/effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/schemas/task.schema.json`](../../../law/schemas/task.schema.json#/$defs/agentSelection/properties/mode/enum); [`law/policy/agent-routing-policies.json`](../../../law/policy/agent-routing-policies.json)
- **Related workflow:** `round`

<!-- devai:generated-reference:end category="agent-selection-modes" -->

### Choose without implicit fallback

Use exact selection when substitution is unacceptable. Only the requested registry identity may be
considered, and the first runtime, model, effort, class, capability, availability, host-preflight,
or adapter-identity mismatch blocks before provider invocation.

```json
{
  "mode": "exact",
  "registry_id": "codex-cli:gpt-5.6-sol"
}
```

Use an ordered preferred allowlist only when the immutable task itself names every acceptable
registry entry. Nothing outside that list may be considered. Do not invent a fallback example:
the current canonical roster has no multiple equivalent entries for one requested runtime/model
identity, so a multi-entry runnable fallback cannot be demonstrated from current policy.

Use a named policy only with both its literal ID and version. There is no implicit latest version,
alias expansion, or unrecorded provider substitution. This current policy specimen is rostered for
a coding-agent request whose runtime/model/effort are `codex-cli`, `gpt-5.6-sol`, and `high`:

```json
{
  "mode": "policy",
  "policy_id": "governed-coding",
  "policy_version": "1.0.0"
}
```

The exact live combinations and availability metadata are generated in the
[model/runtime reference](./model-runtime.md). `available` means roster-eligible, not
host-reachable; provider/session preflight and adapter-reported exact identity remain mandatory.

## Requested versus resolved execution

The task's `executor` object is the immutable request. The runtime binds it by canonical digest;
it does not copy the object into a mutable execution record. Resolution and observation live in a
separate task-execution-evidence record.

That record binds the task, round, candidate, task digest, and requested-executor digest, then
records the resolved executor or argv, adapter/tool versions, input/output digests, selection
decision, prompt identity, usage/cost where applicable, timestamps, verdict, failure disposition,
and evidence references. Selection evidence includes what was considered, what was selected,
rejection codes, and whether an explicitly authorized fallback was used.

An exact mismatch or incomplete record blocks completion. If the request must change, create a new
governed request; never mutate the old requested executor in place or silently retry another model.

Canonical contract:
[task schema](../../../law/schemas/task.schema.json),
[task-execution-evidence schema](../../../law/schemas/task-execution-evidence.schema.json), and
[agent-routing policy](../../../law/policy/agent-routing-policies.json).

## Authority stays with discipline

Executor kind, runtime, model, effort, skill, capability, and selection result answer how a task may
be attempted. They do not answer who may change a path. The task's discipline, the repository's
role/path policy, the resolved effect, and explicit consent remain authoritative.

An executor resolved to a more capable model does not gain additional filesystem, database,
publication, or remote authority. A deterministic routine is not automatically read-only. A human
checkpoint supplies evidence but cannot ratify outside that human role. See
[authority and effects](./authority-effects.md).

## Failure and recovery

- **Selection failure:** unavailable, mismatched, or exhausted allowed selection stops before
  invocation. Preserve the evidence and amend work only through a new governed task request.
- **Executor failure or timeout:** stop the dependent branch. Agent retry is bounded by the
  task's iteration limit; a human timeout follows its declared block/escalate behavior.
- **Malformed, unknown, or partial output:** treat it as error or diagnostic-only output, never
  completion.
- **Resource conflict:** requeue after lock denial; repeated conflict escalates for human review.
- **Reference gap:** preserve the branch and evidence, release resources, and resume only after the
  governed gap transition.
- **Rollback:** there is no automatic remote rollback and no destructive reset. An unmerged batch
  is abandoned or explicitly reverted; merged work needs a newly authorized revert. Composite
  compensation is reverse dependency order and only through an explicit registered action.

Aggregate task output follows the [verdict contract](./vocabulary.md#verdicts). Failure evidence is
retained even when rollback succeeds.

## Hidden task plumbing

Expanded help exposes low-level task operations for orchestration and advanced automation:

```sh
devai task --all
```

This is inspection, not an ordinary workflow recommendation. Plumbing retains the same round
argument, containment, authority, effect, consent, output, and lifecycle checks. Operators should
prefer `round status`, `round assess`, `round gap ...`, and `round run`.

## Legacy task-record boundary

Task records that predate the required round and executor fields remain historical and
non-executable. They need an explicit digest-bound mapping to a round and a complete executor
contract, producing a new record while preserving the original. Runtime inference from tags,
prompts, worktrees, branches, or previous executions is forbidden.

## Nonclaims

Successful task dispatch proves only the recorded execution attempt and verdict for its bound
candidate. It does not by itself close the round, publish evidence, establish release eligibility,
or authorize deployment.

Canonical sources: [round execution policy](../../../law/policy/round-execution.json),
[task execution schema](../../../law/schemas/task-execution-evidence.schema.json).
