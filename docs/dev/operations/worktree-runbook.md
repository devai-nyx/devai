# Worktree runbook

**Scope:** the git-worktree subsystem under `record/proofs/worktrees/`. Worktrees isolate concurrent agent work on the same repository; each task gets its own working tree, branch, and (optionally) database. Per Article 27 (Worktree discipline) and D-52 (worktree cap of 3, superseding D-11's earlier value of 6).

## Why worktrees

A single git working tree forces serialization: if two agents both want to checkout different branches, one blocks the other. Worktrees give each task its own `.git/worktrees/<id>` linked back to a shared object store, so multiple agents can build / test / commit in parallel.

DEVAI's worktree subsystem wraps `git worktree` with a registry, lifecycle management, and integration with locks + tasks.

## Lifecycle

```
create  →  adopt  →  destroy  ←  reap (for stale)
   │         │         │
   │         │         └── normal cleanup
   │         └── attach an existing worktree to a task
   └── new worktree for a new task
```

### Creating a worktree

```bash
devai work worktree create \
  --task TASK-0042 \
  --branch task/0042-auth-refresh \
  --base main
```

Output: a `WT-NNNN` id and a registry entry under `record/proofs/worktrees/`. The path is typically `.devai/worktrees/<id>/` but configurable.

### Listing worktrees

```bash
devai work worktree list --format human
```

Each entry: id, owning task, branch, path, created-at, status (`active | escalated | destroying`).

### Destroying a worktree

```bash
devai work worktree destroy --id WT-0042
```

Atomically: runs `git worktree remove`, deletes the registry entry, emits `worktree.destroy`. Refuses to destroy worktrees with uncommitted changes unless `--force` is passed.

### Reaping stale worktrees

```bash
devai work worktree reap                 # dry-run
devai work worktree reap --write       # actually clean up
```

Stale = the owning task has been in `escalated`, `cancelled`, or `completed` state for longer than the reap window (default 24 hours). Reaping a worktree first renames its branch to `escalated/<task-id>` if the task was escalated (Article 21), so no work is silently lost.

## The 3-worktree cap (D-52)

`worktree create` refuses when 3 non-adopted worktrees are already active. This is empirical: 3 leaves headroom for the typical adopter pattern of 1 autonomous-loop task + 1 human-initiated branch + 1 buffer for escalation/rescue, without the slack that allows runaway parallelism on a shaky host. (D-52 supersedes D-11's earlier cap of 6 after observing canonical's actual parallelism rarely exceeded 2 concurrent live worktrees.)

**Human-adopted worktrees are cap-exempt.** `worktree adopt` for a deliberate human review path does not count against the autonomous-loop cap.

Override is **not** a flag — raising the cap requires editing `WORKTREE_CAP` in `packages/core/src/loop/worktrees.ts` (or, when the future `.devai/config/limits.json` surface lands per D-52, configuring it there) and a justification commit.

## Coordination with locks

Worktrees and locks compose:

1. Spawning a task with `--with-worktree --with-locks` (via `task spawn`) acquires the worktree and the relevant module locks atomically. Failure of either rolls back both (Phase 3.C transactional composition).
2. Completing or escalating the task releases both atomically.

Operator-driven worktree create/destroy doesn't auto-acquire locks — those are an explicit step in the task lifecycle.

## Failure modes

| Symptom                                             | Cause                                                            | Action                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worktree create` rejected with "cap exceeded"      | 3 non-adopted worktrees already active (D-52)                    | `worktree list` to identify candidates; reap stale entries; if all 3 are legitimate, queue. Human-adopted worktrees are cap-exempt and don't count. |
| `worktree destroy` rejected for uncommitted changes | Agent crashed mid-edit                                           | Inspect the worktree's working state; commit-or-discard manually; retry with `--force` if discard is intentional.                                   |
| Registry entry exists but path is gone              | Crash or external `git worktree remove`                          | Run `worktree reap --write`; the orphan registry entry will be cleaned.                                                                             |
| Path exists but no registry entry                   | External `git worktree add` bypassing the harness                | Adopt with `worktree adopt --path <p> --task <id>` to attach it back to the registry, or remove manually with `git worktree remove`.                |
| Branch `escalated/<task-id>` left behind            | Task escalated, worktree reaped, branch preserved per Article 21 | Intentional. Leave the branch for human review; delete only after resolving the escalation.                                                         |
| `git worktree` reports lockfile contention          | Concurrent `git worktree add` from another process               | Retry; the harness's `worktree create` is single-writer per repo.                                                                                   |

## Routine maintenance

| Cadence          | Command                            | What it does                                                           |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Every CI run     | `devai work worktree reap --write` | Clean up stale entries from prior failed runs.                         |
| Daily            | `devai work worktree list` (audit) | Confirm worktree count is healthy.                                     |
| On task escalate | (automatic)                        | `task escalate` renames the branch and marks the worktree for reaping. |

## See also

- [`lock-runbook.md`](./lock-runbook.md) — locks and worktrees compose.
- [`loop-runbook.md`](./loop-runbook.md) — autonomous loop spawns worktrees per task.
- Constitution Article 27 (Worktree discipline), Article 21 (Escalation lifecycle).
- `GE-017` (Task), `GE-018` (RGR).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/worktree-runbook.md (classification CURRENT).
