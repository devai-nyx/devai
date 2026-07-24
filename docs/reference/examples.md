---
title: Examples
sidebar_position: 5
---

# Examples

> Packs, fixtures, and reference baselines under `examples/`. Each is a self-contained directory that an adopter can copy, study, or use as a template.

## `examples/law-pack/`

The **15-invariant scaffold pack** for NestJS + Angular + Postgres greenfield clients. Use this when starting a new repo from scratch.

- Includes a starter constitution pin, ADR template, 15 baseline invariants covering common security / data / RBAC concerns.
- Used as an explicit scaffold source after the role-separated bootstrap; current `devai init` has no implicit `--pack` mutation.
- See [adopters/blueprint-authoring](../adopters/blueprint-authoring.md) for the greenfield path.

## `examples/sample-f1/`

A **minimal F1 fixture** — a stripped-down architecture spec set used by integration tests and as a teaching example. Shows the bare-minimum structure of `docs/theory/architecture/`, `docs/reference/contracts/`, and `law/glossary/` for a project.

## `examples/sample-nest-angular/`

A **NestJS + Angular sample** that the inventory sensors run against in test scenarios. Useful as a reference for what a small client repo looks like before/after `devai init apply-f5 --introspect`.

## `examples/redox-pack-*` (7 packs)

The **stack-adapter packs** absorbed from the redox engine in Phase 17. Each pack targets a specific stack and provides detection signals, extractor params, and per-writer prompt overlays. `devai adopt pack resolve` matches a repo to one of these.

| Pack | Stack |
|---|---|
| `redox-pack-nestjs-postgres-angular` | NestJS backend + Postgres + Angular frontend (the canonical DEVAI stack) |
| `redox-pack-nestjs-postgres-react` | NestJS backend + Postgres + React frontend |
| `redox-pack-express-knex-postgres-angular` | Express + Knex + Postgres + Angular |
| `redox-pack-laravel-postgres-angular` | Laravel + Postgres + Angular |
| `redox-pack-laravel-postgres-blade` | Laravel + Postgres + Blade templates |
| `redox-pack-laravel-postgres-react-blade` | Laravel + Postgres + React + Blade |
| `redox-pack-java-spring-oracle-angularjs` | Spring + Oracle + AngularJS (legacy/migration scenarios) |

Each pack's `stack-adapter.json` declares:

- **Detect signals** — file patterns + config keys that identify the stack.
- **Extractor params** — how the L0 sensors parse this stack's specific shape (e.g., NestJS `@Public()` decorator pattern, Laravel route file location).
- **Writer overlays** — per-writer prompt extensions for doc synthesis (e.g., how to describe a NestJS controller vs a Laravel controller).

See [pack-resolution](../adopters/pack-resolution.md) for how packs are selected and how to author your own.

## `examples/devai-self-baseline/`

A **dep-graph regression anchor** capturing DEVAI's own inventory at a known-good state. Per [Article 36](./law.md), DEVAI must apply itself; this baseline catches accidental inventory drift between rounds.

The baseline is updated via Architect-approved Inspector tasks when DEVAI's source tree changes shape (e.g., a new package added under `packages/`).

## See also

- [Adopters → pack resolution](../adopters/pack-resolution.md) — how a pack matches your repo.
- [Adopters → install](../adopters/install.md) — initial setup including pack selection.
- [Scorecard N/A overrides](../adopters/scorecard-na-overrides.md) — per-pack cell carve-outs.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/examples.md (classification CURRENT).
