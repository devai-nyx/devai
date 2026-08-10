# Database isolation

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-15](../../../law/adr/README.md) — "Database-per-task via TEMPLATE clone as default (locked)."

## Rule

DEVAI provisions **one Postgres database per active task worktree**, via Postgres's `CREATE DATABASE … TEMPLATE devai_template` mechanism. The cluster is shared (one running Postgres instance); the databases within it are not.

```sql
CREATE DATABASE devai_task_<task-id> TEMPLATE devai_template;
```

The template database (`devai_template`) carries:

- Full schema from all applied migrations.
- Seed data sufficient for tests to be meaningful.

The template is rebuilt on every integration merge — `pnpm db:template-rebuild` re-applies all migrations against a fresh database and re-seeds it. Tasks branching off after the rebuild get the latest template content via the next `TEMPLATE` clone.

For tasks needing **cluster-level state** (Postgres extensions, replication, role-level configuration), an opt-in `db_isolation: cluster` mode runs the task in a dedicated container instead of a shared-cluster database.

## Rationale

Four isolation modes were evaluated:

| Mode                                  | Verdict                         | Why                                                                                                                                                 |
| ------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| One shared DB                         | Rejected                        | Test pollution, migration races, no parallel work                                                                                                   |
| Container-per-task                    | Available as opt-in (`cluster`) | Right for cluster-state needs; wrong as default (startup + migration replay cost)                                                                   |
| Schema-per-task within one DB         | Rejected                        | Database-level vs schema-level state mismatch; Postgres extension state isn't schema-isolatable; migrations don't naturally compose at schema level |
| Filesystem snapshots (ZFS/Btrfs/Neon) | Rejected                        | macOS-unfriendly; operational complexity outweighs the marginal speedup over TEMPLATE                                                               |

`TEMPLATE` cloning won because:

- **Sub-second provisioning.** Postgres clones the template at the block level. Even a multi-GB template clones faster than a fresh migration replay would take.
- **Full fidelity at the database level.** All schema, all data, all constraints, all sequences — present in the clone with no fix-up needed.
- **Minimal resource cost.** Each task DB is a separate Postgres database, but they share the cluster process, connection pool config, and host resources.
- **The catch is rare.** Cluster-level state (extensions, replication setup) is occasionally needed; the `cluster` opt-in handles those cases without forcing the cost on every task.

## Practical consequences

1. **Each task worktree has its own connection string.** The harness sets `DATABASE_URL` per worktree on spawn; application code reads the env var.

2. **Template rebuilds happen on integration merge.** A merge triggers `pnpm db:template-rebuild` (or the equivalent automation). Tasks spawned after the rebuild inherit the new template; in-flight tasks keep their existing per-task DB unaffected.

3. **Per-task DBs are dropped when their worktree is destroyed.** `devai work worktree destroy <task-id>` drops `devai_task_<task-id>`. Long-lived databases for "the task I'll come back to" don't accumulate.

4. **The 11 DB-gated integration tests** (see [`testing.md`](./testing.md)) target the per-task DB pattern. They verify that:
   - Template rebuild produces a clean DB.
   - Per-task clone happens correctly.
   - Destroying a worktree releases the DB.

5. **Cluster-isolation mode** runs an entirely separate Postgres container per task. Used when:
   - The task touches Postgres extensions (e.g., `pg_partman`).
   - The task tests replication or logical-decoding behaviour.
   - The task needs role-level configuration that would conflict with other tasks.

   Container startup overhead is ~5–10 seconds; the task declares the mode in its task spec.

## Operational hooks

| Command                             | Purpose                                                          |
| ----------------------------------- | ---------------------------------------------------------------- |
| `pnpm db:start-shared`              | Bring up the shared dev cluster (single Postgres container)      |
| `pnpm db:template-rebuild`          | Drop + recreate `devai_template`, replay all migrations, re-seed |
| `devai work db provision <task-id>` | Clone the template into `devai_task_<task-id>`                   |
| `devai work db drop <task-id>`      | Drop the per-task DB (also runs on worktree destroy)             |
| `pnpm db:stop-shared`               | Tear down the shared cluster                                     |

The shared cluster's lifecycle is managed by the operator; DEVAI's per-task verbs assume the cluster is up.

## Failure modes and recovery

| Symptom                                                                      | Likely cause                             | Recovery                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATE DATABASE … TEMPLATE` errors with `source database is being accessed` | Another connection has the template open | `pg_terminate_backend` the offending pid; retry                                                                                                                             |
| Task DB exists but DDL is stale                                              | Template was rebuilt mid-task            | Drop and reprovision it with `devai work db drop <task-id> --write` followed by `devai work db provision <task-id> --write`, or accept the staleness for the in-flight task |
| Disk fills with per-task DBs                                                 | Destroyed worktrees left DBs behind      | Inspect with `devai work db status`, then explicitly remove orphan task DBs with `devai work db drop <task-id> --write`                                                     |
| `cluster`-isolation container won't start                                    | Port collision or resource limit         | Check container logs; the cluster-isolation container picks a random high port to avoid the shared cluster's 5432                                                           |

See [`incident-playbook.md`](./incident-playbook.md) for a wider catalog.

## When to revisit

A successor D-entry would be needed if:

- Filesystem-snapshot isolation becomes operationally viable on macOS (e.g., via APFS clone semantics that Postgres can leverage). Currently the macOS-host requirement keeps snapshot modes off-the-table.
- The template rebuild cost grows enough to be the binding overhead (currently it's well below a minute for the canonical reference repo).
- A consistent need for cluster-isolation across most tasks emerges, shifting the default. Currently `cluster` is rare enough to remain opt-in.
