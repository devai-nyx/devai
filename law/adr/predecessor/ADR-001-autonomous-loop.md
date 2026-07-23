---
adr_id: ADR-001
title: Autonomous loop orchestrator design
status: accepted
date: 2026-05-13
authors: ["@aarusso"]
tags: [phase-9, orchestrator, loop]
---

# ADR-001 — Autonomous loop orchestrator design

> **Experimental track notice (R15 / D-126).** This ADR remains historical design authority for the strategic autonomous track. Its loop-specific commands and completion claims are not part of the supported production baseline. Current mutation requires project opt-in plus `--experimental --write`, stops at a preserved human-review checkpoint, and cannot merge, push, complete, destroy work, or promote readiness. Promotion requires the checklist in `ADR-HUMAN-SUPERVISED-EXPERIMENTAL-LOOP.md`.

**Authority:** Architect.
**Related:** Constitution Articles 15 (triage), 17–19 (gates + iteration cap), 22 (RGR), 27 (worktree discipline), 33–35 (auditor + backlog), 36 (self-application). INV-DEVAI-004 (atomic spawn), INV-DEVAI-005 (linearizable lifecycle), INV-DEVAI-010 (skills emit evidence).

## Status

Accepted on 2026-05-13 (Phase-9 Batch 9.D).

## Context

Phases 0–8 shipped every supporting subsystem (locks, worktrees, per-task DBs, scorecard, triage, prompts, skills) but no top-level orchestrator that chains them. Calling each piece manually from the CLI is feasible for debugging, but it is not the autonomous loop the constitution describes. Phase-9 Batch 9.D builds the orchestrator and its central skill — `SKILL-feedback-iteration`.

## Decisions

### 1. Backlog as the only work queue (Article 35)

The orchestrator reads `.devai/state/backlog.jsonl` and selects the highest-priority not-completed item. The backlog is append-only (one task per line). `SKILL-compile-backlog` (Phase 8 deterministic) refreshes priorities from scorecard deltas; `devai backlog add` lets humans enqueue manually.

A backlog entry is a partial Task (id, title, discipline, target_modules, target_substrates, priority, db_isolation). The orchestrator materializes a full Task on selection.

### 2. Per-task environment via `task spawn --with-worktree --with-db`

The orchestrator does **not** invent its own composition. It calls the existing `spawnTask({ withWorktree: true, withDb: true })` (Batch C, INV-DEVAI-004). The transactional substrate is reused unchanged: locks → worktree → DB → status:in_progress, with rollback to `cancelled` on any failure.

### 3. Inner loop: sense → triage → feedback → re-sense

Each iteration:

1. **Sense.** Run `senseLint`, `senseTest`, `senseTypeCheck` against the task's worktree. Persist readings under `.devai/state/skills/SKILL-feedback-iteration/<task>/iter-<N>/`.
2. **Decide convergence.** If all readings are PASS, the iteration succeeds and the loop exits with `status:'pass'`. The orchestrator then runs `SKILL-commit-push` (Batch A safety: explicit files only) and integrates the branch.
3. **Triage.** Classify the most severe failing reading. If `reference_gap` → emit RGR via `SKILL-emit-rgr` and pause the task (`task pause-rgr`). If `sensor_error` → escalate immediately.
4. **Compose prompt.** PromptComposition with layers `global` (DEVAI iteration framing), `role` (engineer.role), `task` (task title + description + current iteration's failing findings as payload).
5. **Invoke LLM.** `LlmClient.complete(messages, meta, opts)`. Request structured output: `{ edits: [{path, content}], rationale, expect_pass: boolean }`.
6. **Apply edits.** Write each `edits[].path → content` inside the worktree. Validate paths against the manifest's `allowed_write_scopes` BEFORE writing (Batch 9.A.1 host_mutation_policy contract).
7. **Checkpoint commit.** `git add` the edited files; commit with `WIP: iter-<N>` message. This is the rollback substrate per ADR 27.
8. **Loop or escalate.** Increment iteration_count. If `iteration_count >= max_iterations` (default 3, Article 19), escalate. Otherwise restart at step 1.

### 4. Cost cap per task

`DEVAI_LLM_BUDGET_USD` is process-wide. The orchestrator additionally tracks per-task spending and escalates when a configurable per-task cap is exceeded (default $5.00 via `.devai/config/loop.json`). The check happens after each LLM call.

### 5. Signal handling

`SIGTERM` / `SIGINT` are caught by the orchestrator. On signal:
1. Drop locks (`releaseLocks`).
2. Leave the worktree on disk for forensic inspection.
3. Mark the task as `escalated` with reason `'interrupted'`.
The orchestrator NEVER deletes work-in-progress on signal.

### 6. Model-family routing

The orchestrator reads `model_tier` from the task record:

- `default` → default family from `.devai/config/llm.json`
- `bumped` → same family, larger model (e.g. `claude-3-opus-latest`)
- `fallback` → **different family** (Article 23 cross-family escalation)

`SKILL-feedback-iteration`'s manifest `default_family: 'claude'` is the starting point; `bumped`/`fallback` override per-task.

### 7. Persistence

Every iteration writes:

```
.devai/state/skills/SKILL-feedback-iteration/<task-id>/iter-<N>/
  prompt.json         — PromptComposition for audit replay
  response.json       — LlmResponse (text + usage + json)
  readings.json       — array of SensorReading objects from sense run
  diff.patch          — git diff of the iteration's edits
```

This is the audit trail. Any iteration can be replayed by re-feeding `prompt.json` to a deterministic LLM with the same seed.

### 8. Safety rails (Article 17 hard-gate compliance)

- The worktree filesystem isolates iterations from the main tree. Even a runaway iteration cannot touch the integration branch.
- `SKILL-commit-push` requires explicit `files: string[]` (Batch A). The orchestrator computes this from `edits[].path`; never passes wildcards.
- Each iteration's edits are validated against the manifest's `allowed_write_scopes` before writing. Out-of-scope writes are rejected and surfaced as a `judge_invalid_response`-equivalent finding.
- A hard gate failure (Article 17) in `sense build` or `sense type-check` blocks integration regardless of LLM confidence.

## Consequences

**Positive:**
- The autonomous loop is finally a thing the orchestrator runs, not a manual sequence.
- Every iteration is fully replayable from its persisted prompt + response.
- Cost is bounded per process AND per task.
- Cross-family escalation (Article 23) is implementable because both families exist (Batch 9.B).

**Negative / Trade-offs:**
- A 3-iteration cap is conservative. Tasks that need more iterations escalate; the human resumes or revises the prompt. This is intentional — Article 19's purpose is to bound cost AND to surface "the loop can't solve this" early.
- The orchestrator currently runs ONE task at a time. Multi-task parallelism is deferred — Phase-9 Batch 9.G's Postgres advisory locks make it safe, but the orchestrator process itself stays sequential until proven otherwise.
- LLM cost is real money. The Phase-9 plan's no-LLM-in-CI default (decision 3i) means CI never spends; local + nightly runs do. The cost telemetry log makes spending visible.

## Alternatives Considered

1. **Build the orchestrator as a separate process** that talks to DEVAI via the CLI. Rejected: would force every state transition through file-system serialization, doubling the audit-trail surface; and would prevent the orchestrator from sharing a single `LlmClient` instance (cost telemetry would fragment).
2. **Have the orchestrator own its own task substrate** (instead of calling `spawnTask`). Rejected: `spawnTask` is the constitutional entry point for task creation (INV-DEVAI-004); a second path would diverge and create a second audit surface.
3. **Run multiple tasks in parallel from the start.** Rejected for the MVP: the file-lock substrate is single-host (Phase-9 Batch 9.G adds Postgres advisory locks but the orchestrator process itself stays sequential until proven safe under load). Parallelism is a Phase-10+ concern.

## Affected Rules

- **INV-DEVAI-004** (Task spawn composes lock + worktree + DB atomically) — the orchestrator is the canonical consumer of the composed spawn.
- **INV-DEVAI-005** (Task state transitions are linearizable per task id) — the orchestrator drives transitions strictly through `completeTask` / `escalateTask` / `pauseTaskForRgr`.
- **INV-DEVAI-010** (Skills persist evidence on every non-skipped run) — every iteration of `SKILL-feedback-iteration` writes prompt/response/readings/edits under `.devai/state/skills/SKILL-feedback-iteration/<task>/iter-<N>/`.
- **Constitution Article 19** (Iteration cap and bump-model escalation) — `max_iterations` default 3; on cap, the orchestrator escalates rather than looping forever.

## Next Steps

This ADR is the contract for Batch 9.D's implementation. Subsequent batches (9.E LLM skills, 9.F Article-23 ladder, 9.G operational substrate) build on top.
