# `sense-migrate-check` — applying platform migrations against a clean Postgres

`devai sense migrate check` walks every `*.sql` file under the configured `migration_dirs`, applies them sequentially against a Postgres URL, and emits a `migration_check` SensorReading. The DB starts empty (or in a known-clean fixture state) and the sensor confirms that the migration set can drive it to the production schema shape from scratch.

For most adopters this works out of the box: `devai sense migrate check --database-url postgres://localhost/devai_test --pack-tune` and the SensorReading flips F2×T4 to PASS once every migration applies cleanly.

Two common patterns require extra setup _before_ the migrations run. Both are role-related; both are flag-driven; both ship with DEVAI since Phase 30.F. This page documents when each is needed and which to reach for.

## The two flags

```text
--role-bootstrap        Create roles declared in pack config (idempotent DO blocks).
--pre-seed <file>       Apply a SQL file before any migration (repeatable).
```

`--role-bootstrap` is the simpler tool. `--pre-seed` is the canonical pattern when role creation alone isn't enough.

## Decision tree

```
Do the platform migrations assume any role exists on the DB?
│
├── No        → don't use either flag. Migrations create everything from a
│               fresh DB; sense-migrate-check Just Works.
│
└── Yes
    │
    ├── They only need the role(s) to EXIST (e.g. `ALTER TABLE … OWNER TO app`)
    │   and don't care about schema-level grants or default privileges
    │       → use `--role-bootstrap`. Declare the role names in pack config:
    │             extractor_params.migrate_check.bootstrap_roles: ["app_owner"]
    │
    └── They also need schema-level grants, ALTER DEFAULT PRIVILEGES,
        SECURITY DEFINER reassignment, cross-schema REFERENCES privilege, or
        any pre-migration grant the migrations themselves don't perform
            → use `--pre-seed db/migrate-check-preseed.sql`. Author the SQL
              once; commit it under db/; pass --pre-seed every run.
```

If you're unsure: try `--role-bootstrap` first. If migrations still fail with `permission denied for schema X` or `role "Y" cannot create objects in schema "Z"`, you've crossed into pre-seed territory.

## When `--pre-seed` is necessary

The platform migration runner in many real-world apps does role + grant setup as a series of pre-migration steps that aren't themselves migrations: Helm hooks, Terraform-managed roles, startup scripts, `psql` wrappers in CI. `sense-migrate-check` deliberately applies migrations against a fresh DB via raw `psql` so the SensorReading reflects what the migration _files_ can do, not what the surrounding infrastructure does. When the migrations assume infrastructure-installed roles + grants, `sense-migrate-check` needs a single bootstrap SQL file that replays that setup. That file is the `--pre-seed`.

Typical pre-seed shape:

```sql
-- 1. CREATE ROLE IF NOT EXISTS for each role the migrations reference.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner LOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- 2. GRANT ALL ON DATABASE for the owner role so SECURITY DEFINER helpers work.
DO $$
BEGIN
  EXECUTE format('GRANT ALL ON DATABASE %I TO app_owner', current_database());
END
$$;

-- 3. ALTER DEFAULT PRIVILEGES per schema the migrations will create tables in.
--    Without this, FK constraints from later migrations fail with "permission
--    denied for table tenants" or "must be owner of table tenants".
DO $$
DECLARE schema_name text;
BEGIN
  FOREACH schema_name IN ARRAY ARRAY['tenancy', 'auth', 'data', 'audit']
  LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    EXECUTE format('GRANT ALL ON SCHEMA %I TO app_owner', schema_name);
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON TABLES TO app_owner',
      current_user, schema_name
    );
  END LOOP;
END
$$;
```

The whole file is idempotent (`IF NOT EXISTS`, `DO` blocks, `CREATE SCHEMA IF NOT EXISTS`) so re-runs against an existing test DB don't error. That matters because the `devai_migrations` bookkeeping table will already exist on the second run, but the pre-seed runs again every time.

## The canonical worked example: stynx

Stynx (the C-4 pilot adopter at maturity) authored its pre-seed at `db/migrate-check-preseed.sql` to get `sense-migrate-check` past stynx's platform migration role-grant prerequisites. The file is the most complete worked example we have. Quoted verbatim from `stynx/db/migrate-check-preseed.sql` (lifted from stynx U9):

```sql
-- stynx pre-seed for `devai sense migrate check --pre-seed db/migrate-check-preseed.sql`
--
-- The platform migration runner normally provisions roles + grants in steps,
-- but `sense-migrate-check` applies SQL files via raw psql against a fresh
-- database without the surrounding application-layer setup. This pre-seed
-- gives stynx_owner the cross-schema privileges the platform migrations
-- expect by the time 0011_storage.sql runs (which references tenancy.tenants
-- + auth.users via FKs, and goes through SECURITY DEFINER helpers in
-- data.create_soft_deletable_table).
--
-- Applied BEFORE any migration. Idempotent — uses DO blocks + IF NOT EXISTS
-- so re-runs against an existing test DB are safe.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stynx_owner') THEN
    CREATE ROLE stynx_owner LOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stynx_app') THEN
    CREATE ROLE stynx_app LOGIN NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stynx_reader') THEN
    CREATE ROLE stynx_reader LOGIN NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT ALL ON DATABASE %I TO stynx_owner', current_database());
END
$$;

DO $$
DECLARE schema_name text;
BEGIN
  FOREACH schema_name IN ARRAY ARRAY['tenancy', 'auth', 'core', 'audit', 'data', 'storage', 'archive', 'flow', 'demo', 'sample']
  LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    EXECUTE format('GRANT ALL ON SCHEMA %I TO stynx_owner', schema_name);
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON TABLES TO stynx_owner',
      current_user, schema_name
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON SEQUENCES TO stynx_owner',
      current_user, schema_name
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO stynx_owner',
      current_user, schema_name
    );
  END LOOP;
END
$$;
```

Read it once; adapt three things for your repo: (1) the role names; (2) the schema list in the `FOREACH`; (3) drop the `EXECUTE ON FUNCTIONS` block if your migrations don't use SECURITY DEFINER helpers.

## Verdict semantics

`sense-migrate-check` reports a SensorReading whose `status` reflects what actually happened:

| Status    | When                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass`    | All migrations exited 0 and any `--pre-seed` files also exited 0.                                                                                                                                                                               |
| `fail`    | At least one migration exited non-zero. The failing migration's filename + first stderr line is in `findings[]`.                                                                                                                                |
| `unknown` | A `--pre-seed` file itself errored. **Migrations are not penalized for adopter-side pre-seed bugs.** Fix the pre-seed (or your pack config), then re-run.                                                                                       |
| `error`   | DEVAI couldn't run its own idempotent role-bootstrap DO block, or couldn't create the `devai_migrations` bookkeeping table, or the migrations directory itself doesn't exist. Reflects a DEVAI/environment problem, not your migration content. |
| `skipped` | No `--database-url` was supplied. Useful for hostile environments (CI without a Postgres).                                                                                                                                                      |

Verdict mapping was formalized in D-87 (Phase 32.C). If your scorecard cell F2×T4 stays UNKNOWN after pre-seed work, check whether `--emit-reading` is on (default true since Phase 32; older DEVAI versions need explicit `--emit-reading` or `finishSenseCommand`).

## Operational tips

- Commit the pre-seed file. It's spec, not a fixture; treat it like `tsconfig.json`.
- Keep the pre-seed idempotent. The sensor doesn't guarantee a fresh DB on every run; on developer workstations the test DB persists between invocations.
- If your pre-seed needs to be regenerated from another source of truth (a Helm values file, a Terraform output), regenerate at CI time, not at sensor-run time. The sensor should never read live infrastructure.
- For multi-tenant repos with per-tenant roles: still one pre-seed file. Iterate inside a `DO` block over the role list. Don't pass `--pre-seed` repeatedly with one file per tenant — it works, but rebuilding the pre-seed becomes a per-tenant artifact.
- When the pre-seed grows past ~200 lines, split it: one file per concern (`db/preseed-roles.sql`, `db/preseed-grants.sql`, `db/preseed-defaults.sql`), pass `--pre-seed` repeatedly in declaration order. The sensor preserves order across multiple `--pre-seed` flags.

## See also

- `examples/redox-pack-nestjs-postgres-angular/stack-adapter.json` — `extractor_params.migrate_check` shows where `bootstrap_roles` and `migration_dirs` are declared.
- [D-87](../../law/adr/README.md) / [D-88](../../law/adr/README.md) — Phase 32 framing + closeout; documents the `unknown` verdict for pre-seed failures.
- The frozen pre-v1 build-plan archive preserves the original Phase 30.F `--pre-seed` + `--role-bootstrap` design intent (I-1 closure).
- REJ-2 in D-87 — why DEVAI doesn't couple `sense-migrate-check` to an adopter-side migration runner (layering violation).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/sense-migrate-check.md (classification CURRENT).
