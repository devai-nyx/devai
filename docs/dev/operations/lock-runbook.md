# Lock runbook

**Scope:** the TTL-based file lock subsystem under `record/proofs/locks/` and the Postgres advisory-lock backend (Phase 9.G). Locks coordinate concurrent agent work on the same module / route / surface — Article 25 (Module locking) and Article 27 (Worktree discipline).

## When locks matter

Whenever two tasks could edit the same file population. Examples:

- Two agents both want to refactor `packages/core/src/inventory/` simultaneously.
- An autonomous loop iteration is mutating `examples/sample-f1/` while a human is hand-editing the same fixture.
- A long-running mutation test is reading code that an Engineer task is rewriting.

Without locks, the second writer silently overwrites the first; with locks, the second acquirer is **denied** and either retries or escalates.

## Acquiring a lock

```bash
devai work lock acquire \
  --target packages/core/src/inventory/ \
  --holder TASK-0042 \
  --ttl 1800
```

- `--target` is a path glob; lock contention is computed by glob intersection.
- `--holder` is the task or agent id requesting the lock.
- `--ttl` is seconds; default 900 (15 min). Cap is 3600 (1 hr) per Article 25.

Exit `0` on success; `EXIT_FAIL` (2) on contention; `EXIT_USAGE` (64) on malformed args. Successful acquires write `record/proofs/locks/LOCK-<id>.json` and emit a `lock.acquire` evidence event.

## Listing held locks

```bash
devai work lock list --format human
```

Output: each held lock with its holder, target glob, acquired-at, expires-at, and remaining TTL.

## Releasing a lock

```bash
devai work lock release --id LOCK-abc123
```

Releases atomically (file is unlinked) and emits `lock.release`.

## Reaping expired locks

```bash
devai work lock reap                 # dry-run; lists what would be reaped
devai work lock reap --write       # actually deletes expired lock files
```

Expired = `expires_at < now`. Reap is safe to run on any cadence; it never deletes a non-expired lock. Wire into CI on a 5-minute cadence in long-running environments.

## Postgres advisory-lock backend (Phase 9.G)

For multi-host correctness (e.g., CI agents on different runners), set:

```bash
export DEVAI_LOCK_BACKEND=postgres
export DEVAI_LOCK_PG_URL=postgres://user:pass@host/db
```

`acquirePgLocks` / `releasePgLocks` / `listPgLocks` then use PostgreSQL's `pg_advisory_lock` family instead of file locks. Same semantics, just network-coordinated.

**Note:** the file-lock backend is the default; switch only when multi-host coordination is needed. The Postgres backend requires a DB that all agents can reach.

## Routine maintenance

| Cadence          | Command                               | What it does                                      |
| ---------------- | ------------------------------------- | ------------------------------------------------- |
| Every CI run     | `devai work lock reap --write`        | Clean expired file locks.                         |
| On task complete | `devai work lock release --id <held>` | Always release explicitly, even on failure paths. |
| Weekly           | `devai work lock list` (audit)        | Confirm no stale locks accumulating.              |

## Failure modes

| Symptom                              | Cause                                           | Action                                                                                                                         |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `lock acquire` denied repeatedly     | Another holder genuinely owns the target        | Either wait, escalate to that task's owner, or reap if expired.                                                                |
| Lock file present but TTL passed     | Crashed holder didn't release                   | Run `lock reap --write`.                                                                                                       |
| `LOCK-*.json` malformed              | Concurrent crash during write                   | The file-lock implementation uses `O_EXCL`; corruption shouldn't happen. If it does, manually delete and emit `lock.recovery`. |
| Postgres backend timing out          | Network partition or DB overload                | Fall back to file-lock backend temporarily (`unset DEVAI_LOCK_BACKEND`); investigate the DB.                                   |
| Two agents see different lock states | Some agents on file backend, others on Postgres | All agents in a workgroup must use the **same** backend. Audit env vars.                                                       |

## Capacity

See [`capacity.md`](./capacity.md). The file-lock backend scales to ~hundreds of held locks before directory enumeration slows. The Postgres backend is bounded by your DB's connection pool.

## See also

- [`worktree-runbook.md`](./worktree-runbook.md) — worktrees and locks interact: each task with a worktree typically holds locks on its target module.
- Constitution Article 25 (Module locking), Article 27 (Worktree discipline).
