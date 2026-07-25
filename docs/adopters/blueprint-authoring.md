# Blueprint authoring (greenfield path)

Goal: author a single `module-blueprint` describing the _intent_ of a new vertical slice (DB tables + API endpoints + UI components + RBAC + tests + docs), then let DEVAI's deterministic scaffolders generate the boilerplate.

This is the **greenfield** path. If you're inventorying an existing repo, see [first-introspection.md](./first-introspection.md) instead.

## What a blueprint is

A `module-blueprint` is an Owner-authored document under `product/blueprints/` that pairs with the `module-blueprint.schema.json`. Per Phase 18 (D-59), it captures the _intent_ of a vertical-slice module: what entities exist, what endpoints expose them, what RBAC permissions guard them, what retention policy applies to each field.

Minimal shape:

```json
{
  "schemaVersion": "1.0.0",
  "id": "BP-USERS-001",
  "module": { "name": "Users", "namespace": "core", "version": "0.1.0" },
  "database": {
    "entities": [
      {
        "name": "User",
        "primaryKey": ["id"],
        "fields": [
          { "name": "id", "type": "uuid", "default": "gen_random_uuid()" },
          { "name": "email", "type": "varchar(255)", "pii": "low", "retention": "default" },
          { "name": "created_at", "type": "timestamptz", "default": "now()" }
        ]
      }
    ]
  },
  "api": {
    "basePath": "/api",
    "resources": [{ "entity": "User", "operations": ["list", "get", "create", "update", "delete"] }]
  },
  "auth": {
    "rbac": {
      "roles": ["admin"],
      "permissions": [{ "role": "admin", "allow": ["manage"] }]
    }
  }
}
```

The full schema lives at [../law/schemas/module-blueprint.schema.json](../../law/schemas/module-blueprint.schema.json).

## Step 1 — Validate

```bash
node "$DEVAI/packages/cli/dist/bin.js" blueprint validate \
  -f product/blueprints/BP-USERS-001.json
```

Validation runs the JSON Schema check + Phase 18 invariants:

- **INV-BLUEPRINT-001** — every blueprint declares ≥1 entity with a primary key.
- **INV-BLUEPRINT-002** — every field with `pii != none` declares `retention`. Hard-fail.
- **INV-BLUEPRINT-003** — every API operation maps to an RBAC permission.

Hard-fails block scaffolding; review-level findings are informational.

## Step 2 — Plan

```bash
node "$DEVAI/packages/cli/dist/bin.js" blueprint plan \
  product/blueprints/BP-USERS-001.json
```

Output: a deterministic six-task plan, one per scaffolder skill (db, api, ui, tests, docs, ci), with target paths. The plan also carries `blueprint_sha256` — a content hash you'll see again in every generated file's header (INV-SCAFFOLD-001).

## Step 3 — Scaffold

The six deterministic scaffolders consume the blueprint + the matched stack-adapter pack's `templates` registry. Run them in order or in parallel; each is idempotent (re-running with the same blueprint is a no-op).

```bash
node "$DEVAI/packages/cli/dist/bin.js" skill-run SKILL-scaffold-db \
  --input blueprint_path=product/blueprints/BP-USERS-001.json

node "$DEVAI/packages/cli/dist/bin.js" skill-run SKILL-scaffold-api \
  --input blueprint_path=product/blueprints/BP-USERS-001.json

# repeat for SKILL-scaffold-ui, -tests, -docs, -ci
```

Generated files land under `domain/<module-slug>/` (where `<module-slug>` is the kebab-cased namespace + module name; here `core-users`). Each file carries an INV-SCAFFOLD-001 header citing the blueprint id, version, and 8-char sha head — that's the forensic anchor.

## Step 4 — When the blueprint changes

Re-run the scaffolders. Two outcomes:

- **No-op**: files match what the template would render now. Reported as `idempotency: no-op`.
- **Drift detected**: a scaffolded file was hand-edited after generation. Reported as `idempotency: drift-detected` with a per-file diff report. Drift is _observational_, not blocking — the agent-run record captures the divergence; manual edits to scaffolded code are explicitly allowed (per Phase 18 design).

For a real version bump (e.g. you added a field), the scaffolders re-render with the new content and overwrite. Hand-edits to non-bumped files survive because the no-op check is exact-content.

## Step 5 — Stack-pack coverage

Phase 18 shipped scaffolder template trees for only the two NestJS packs:

- `redox-pack-nestjs-postgres-react` (no UI templates; React UI scaffolding deferred).
- `redox-pack-nestjs-postgres-angular` (full coverage).

The 5 other stack packs have empty `templates` registries. The scaffolder family surfaces "no scaffolder pack for this stack" gracefully when a pack has no template for a given skill (status `skipped`). To add template trees for another stack: author them under `examples/redox-pack-*/templates/` and update the pack's `templates` registry — Architect work.

## What this path doesn't do

- It doesn't invent an LLM-derived blueprint for you. `SKILL-plan-blueprint` (Phase 18.F, optional) is an LLM-backed planner that _drafts_ a candidate blueprint from a journey + invariants; Owner curates the draft into a real spec.
- It doesn't substitute for code review. Scaffolded files are starting points; they get hand-edited freely.

## Further reading

- [../law/schemas/module-blueprint.schema.json](../../law/schemas/module-blueprint.schema.json) — full schema.
- [../law/schemas/scaffold-evidence.schema.json](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/schemas/scaffold-evidence.schema.json) — scaffolder output shape.
- [../docs/theory/architecture/phase-18-plan.md](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/arch/phase-18-plan.md) — Phase 18 design notes.
- [pack-resolution.md](./pack-resolution.md) — selecting the right pack.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/blueprint-authoring.md (classification CURRENT).
