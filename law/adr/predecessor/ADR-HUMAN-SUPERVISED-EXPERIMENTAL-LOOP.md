---
title: Human-supervised production baseline and experimental autonomous loop
status: accepted
date: 2026-07-13
decision: D-126
---

# Human-supervised production baseline and experimental autonomous loop

## Context

DEVAI's deterministic governance substrate is mature enough for supervised use, but its autonomous loop does not yet implement the integration and task-acceptance guarantees described by ADR-001. A green repository baseline can currently short-circuit task execution, and the success path can destroy an unintegrated worktree. At the same time, the Owner has retained autonomous execution as a strategic near-future capability.

## Decision

DEVAI 0.4.0 distinguishes two lifecycle postures:

- **Supported:** humans or explicitly operated external agents actuate; DEVAI senses, triages, constrains, gates, and records.
- **Experimental:** DEVAI may perform bounded autonomous preparation only after project opt-in plus explicit invocation consent. Experimental results are auditable but cannot promote supported readiness.

The autonomous loop requires `feature_flags.autonomous_loop=true`, `--experimental`, and `--write`. Dry-run remains available without activation. A mutating run requires a task description and task-specific acceptance commands. It terminates at `awaiting_human_review` on acceptable output or `experimental_blocked` on failure. Both preserve branch and worktree. The loop does not merge, push, mark completion, or destroy recoverable work.

All `write_requires_flag` skills require `--write` before invocation. Remote publication additionally requires `--allow-publish`. Runtime lifecycle checks apply equally to direct skill invocation so the loop boundary cannot be bypassed.

## Authority boundary

DEVAI enforces authority for writes made through its runtime. A project claiming host-integrated enforcement declares the adapter it uses. Without one, DEVAI reports CLI-only enforcement and does not imply control over arbitrary shell, editor, or external-agent writes.

## Promotion criteria

Autonomous execution may move from experimental to supported only through a later ADR and release after all of the following exist:

1. Correct commit and integration semantics with no work-loss path.
2. Task-specific acceptance and full hard-gate enforcement.
3. Deterministic full-loop E2E coverage including interruption and escalation.
4. A supervised live-adopter pilot with retained evidence.
5. Independent Auditor review with no critical open finding.

## Consequences

Existing backlog, lock, worktree, DB, sensing, triage, prompt, and evidence primitives remain supported because they are independently useful to a human-steered harness. ADR-001 remains active design history for the experimental track, but it is not evidence that its unimplemented guarantees are present.

