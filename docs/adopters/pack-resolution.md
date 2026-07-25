# Pack resolution

DEVAI's per-stack knowledge lives in **stack-adapter packs** under `examples/redox-pack-*/`. The canonical npm-package distribution ships those directories inside `@devai-nyx/core`; a sibling checkout exposes the same layout. A pack describes one technology family (e.g. NestJS + Postgres + Angular) and ships:

- `detect.signals` — heuristics for matching an adopter repo.
- `extractor_params` — per-sensor tuning (where to scan, what dialect, etc.).
- `prompt_overlays` — writer-skill prompt extensions per stack.
- `templates` — deterministic scaffolder templates (Phase 18).
- `seed_invariants` — invariants this pack proposes when graduated.

## What `devai adopt pack resolve` does

```bash
devai adopt pack resolve --adopter-root /path/to/your/repo --format human
```

The installed CLI auto-detects the bundled `@devai-nyx/core/examples/redox-pack-*` tree from the resolved package location. An explicit path remains available for diagnosis or custom distributions:

```bash
devai adopt pack resolve \
  --packs-root node_modules/@devai-nyx/core \
  --adopter-root /path/to/your/repo \
  --format human
```

Sibling-checkout development may instead pass `--repo-root /path/to/devai`. Explicit `--packs-root`/`--repo-root` always wins over package-relative discovery.

This walks every pack under the resolved `<packs-root>/examples/redox-pack-*/`, evaluates each pack's `detect.signals` against the adopter, and prints the best match.

Output shape (`--format human`):

```
pack resolve: redox-pack-nestjs-postgres-angular (priority=70)
  stack: nestjs / angular / postgres
  matched signals (3):
    file_present: turbo.json
    file_present: pnpm-workspace.yaml
    dir_present: packages-web
```

Matching semantics: OR over signals (any hit counts), then sort by hit count desc, then by `detect.priority`, then by pack id. Ties surface as `AMBIGUOUS tie at top` — that's an Architect decision per Article 19.

## When `pack resolve` returns no match

For workspace-style monorepos where dependencies live in subpackages, signals at the _root_ `package.json` won't fire. The Phase 19.B widening already added `turbo.json`, `pnpm-workspace.yaml`, and `dir_present packages-web` to the NestJS+Postgres+Angular pack to cover this case. If your repo still doesn't match:

1. Run with `--format human` to see what signals were evaluated.
2. Inspect each pack's `detect.signals` (under `node_modules/@devai-nyx/core/examples/redox-pack-*/stack-adapter.json`, or the equivalent sibling checkout).
3. Pick the pack closest to your stack; add a new signal that hits your repo. This is an **Architect** edit to `examples/redox-pack-*/stack-adapter.json`.

Avoid creating an adopter-specific pack — packs are meant to describe stack families, not individual repositories. If your repo is the canonical example of a new stack family, that's a different decision (write a new pack, propose via PR).

## What `extractor_params` tune

The typed [sensor registry](../reference/sensor-registry.md) is authoritative for every pack key and labels each parameter `consumed` or `declared-only`. The inventory adapters currently consume:

| Sensor             | Pack field                                                                    | Effect                                                               |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `sense api`        | `inventory_api.scan_dir`, `.scan_dir_alternates`, `.public_marker_decorators` | Selects NestJS-shaped controller roots and public markers.           |
| `sense routes`     | `inventory_routes.scan_dir`, `.scan_dir_alternates`, `.framework`             | Selects roots and the supported `react` or `angular` walker.         |
| `sense data-model` | `inventory_data_model.migration_dirs`, `.dialect`, `.pii_registry_table`      | Sets migration roots, SQL dialect metadata, and PII-registry lookup. |
| `sense coverage`   | `inventory_routes.framework`                                                  | Selects the matching routes inventory body.                          |
| `sense type check` | `inventory_type_check.typecheck_strategy`                                     | Selects root or per-package type checking.                           |

Other consumed bindings—including thresholds, timeouts, migration roles, and LLM timeouts—are listed exhaustively in the generated registry. A field shown there as `declared-only` is accepted pack metadata but has no runtime effect.

Usage:

```bash
devai sense inventory api \
  --repo-root /path/to/your/repo \
  --adopter-root /path/to/your/repo \
  --pack-tune
```

CLI flags **always** win over pack defaults. So `--scan-dir apps/backend/src --pack-tune` uses `apps/backend/src` (your override) even if the matched pack declares `apps/api/src` (the pack default). Phase 20.D adds `--framework <react|angular>` to `sense-routes` with the same precedence — explicit flag wins; pack default applies on absence; the React walker is the implicit fallback for back-compat with Phase 17.C2 adopters.

## Forcing a specific pack

If auto-detection picks the wrong pack (rare) or you want deterministic test fixtures:

```bash
devai sense inventory api \
  --repo-root /path/to/your/repo \
  --pack-id redox-pack-nestjs-postgres-angular
```

`--pack-id` implies `--pack-tune` (the resolver returns the params from the forced pack).

## Pack inventory

| Pack                                       | Stack                                     |
| ------------------------------------------ | ----------------------------------------- |
| `redox-pack-nestjs-postgres-react`         | NestJS + Postgres + React                 |
| `redox-pack-nestjs-postgres-angular`       | NestJS + Postgres + Angular               |
| `redox-pack-express-knex-postgres-angular` | Express + Knex + Postgres + Angular       |
| `redox-pack-laravel-postgres-angular`      | Laravel + Postgres + Angular              |
| `redox-pack-laravel-postgres-blade`        | Laravel + Postgres + Blade                |
| `redox-pack-laravel-postgres-react-blade`  | Laravel + Postgres + React/Blade          |
| `redox-pack-java-spring-oracle-angularjs`  | Java Spring + Oracle + AngularJS          |
| `law-pack`                                 | The DEVAI bootstrap pack (used by `init`) |

Only the two NestJS packs ship Phase-18 scaffolder template trees. The other 5 are detect+overlay only; their template trees are deferred (D-60 consequence #4).

## MVP support boundary

Support has three distinct legs, and they do not advance together: **detection + writer prompt overlays** work for every listed pack; the registry-marked **consumed pack parameters** tune existing sensors; but parser availability is narrower. `inventory_api` remains NestJS-shaped. `inventory_routes` has React and Angular walkers. Laravel, Express, Spring, Blade, and AngularJS AST parsers do not exist, so their pack fields are detection/advisory metadata and non-NestJS inventory output is partial, conservative, and independently validated. Template generation is narrower still.

| Stack family                        | Status                                                                                                                              | Notes                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| NestJS + Postgres + Angular         | Supported                                                                                                                           | Canonical adopter path; includes detect signals, extractor params, prompt overlays, seed invariants, and Phase-18 templates. |
| NestJS + Postgres + React           | Supported                                                                                                                           | Same support class as Angular, with React route extraction.                                                                  |
| Express + Knex + Postgres + Angular | Detection + overlays + pack-tuned parameters; **inventory parsing partial** (no Express parser yet); non-MVP for templates          | Validate inventory output independently.                                                                                     |
| Laravel + Postgres + Angular        | Detection + overlays + pack-tuned parameters; **inventory parsing partial** (no Laravel parser yet); non-MVP for templates          | Validate inventory output independently.                                                                                     |
| Laravel + Postgres + Blade          | Detection + overlays + pack-tuned parameters; **inventory parsing partial** (no Laravel parser yet); non-MVP for templates          | Validate inventory output independently.                                                                                     |
| Laravel + Postgres + React/Blade    | Detection + overlays + pack-tuned parameters; **inventory parsing partial** (no Laravel parser yet); non-MVP for templates          | Validate inventory output independently.                                                                                     |
| Java Spring + Oracle + AngularJS    | Detection + overlays + pack-tuned parameters; **inventory parsing partial** (no Spring/AngularJS parser yet); non-MVP for templates | Database-specific extraction also conservative.                                                                              |
| Any unlisted stack                  | Non-MVP                                                                                                                             | Requires Architect review and a new or extended stack-adapter pack before readiness can be claimed.                          |

For supported readiness, deterministic sensing and human-supervised verification are binding. Real-provider writer tests are opt-in with `DEVAI_LLM_TESTS=1`; mock-provider tests verify deterministic wiring. Autonomous-loop evidence is experimental and cannot establish supported readiness.

## Further reading

- `node_modules/@devai-nyx/core/examples/redox-pack-*/stack-adapter.json` — npm-package manifests.
- `examples/redox-pack-*/stack-adapter.json` — sibling-checkout manifests.
- [../law/schemas/stack-adapter.schema.json](../../law/schemas/stack-adapter.schema.json) — pack schema.
- [adoption.md](./adoption.md) — full long-form adoption walkthrough.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/pack-resolution.md (classification CURRENT).
