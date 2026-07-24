# Adopters guide

This tree is for engineers adopting DEVAI into an existing repository (brownfield) or starting a new module under DEVAI governance (greenfield). It complements [`adoption.md`](./adoption.md) (a single long-form walkthrough) with shorter, topic-focused pages you can read in any order or as a checklist.

Audience: an external adopter. Anything DEVAI-specific that you'd only need if you were _developing DEVAI itself_ lives in `CLAUDE.md` at the repo root and the `arch/` tree, not here.

## Reading order

1. [install.md](./install.md) — clone DEVAI, install the CLI, verify gates green.
2. [role-declaration.md](./role-declaration.md) — the five-role authority model, from an adopter's perspective.
3. [pack-resolution.md](./pack-resolution.md) — how `devai adopt pack resolve` matches your repo and what `extractor_params` tune.
4. [first-introspection.md](./first-introspection.md) — the brownfield path: `devai init apply-f5 --introspect`, the seven L0 inventory sensors, `devai inventory suggest`.
5. [blueprint-authoring.md](./blueprint-authoring.md) — the greenfield path: Owner-authored `module-blueprint`, `devai spec blueprint validate / plan`, deterministic scaffolders.
6. [sense-migrate-check.md](./sense-migrate-check.md) — applying platform migrations against a clean Postgres; when to use `--role-bootstrap` vs `--pre-seed` (Phase 32.E / R-1).
7. [scorecard-na-overrides.md](./scorecard-na-overrides.md) — when (and when not) to declare F×T cells N/A on your repo via `.devai/config/scorecard-na.json` (Phase 34.G / D-91).
8. [lightweight-ci.md](./lightweight-ci.md) — the "CI is freshness check, not value-producer" model. What DEVAI's own `ci.yml` does, what it deliberately doesn't, and how to copy the pattern without inheriting theatre (Phase 39 / D-103).
9. [common-pitfalls.md](./common-pitfalls.md) — operational gotchas surfaced during pilots.
10. [migrating-to-0.5.0.md](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/migrating-to-0.5.0.md) — breaking CLI migration instructions for adopter-repository agents.
11. [migrating-authority-enforcement.md](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/migrating-authority-enforcement.md) — explicit role/consent migration, policy materialization, shadow observation, binding cutover, and safe rollback.

## Cross-repo canon

Issued with Architect authority via [CONVENTIONS.md](./CONVENTIONS.md). These are the cross-repo conventions every DEVAI adopter (DEVAI, STYNX, PEC, TEAT, SGP, PORM) reconciles to:

**Structural (R1, 2026-05-22):**

- [docs-layout.md](./docs-layout.md) — canonical `docs/` tree: `eng/`, `arch/`, `adr/`, `contracts/`, `schemas/`, `ops/`, `user/`, `gov/`, `security/`, `work/`, `glossary/` (short forms only).
- [database-layout.md](./database-layout.md) — canonical `database/` tree: `ddl/`, `seed/`, `migrations/` (with filename + ordering rules).
- [language-policy.md](./language-policy.md) — English preferred; Portuguese accepted in user-facing material.
- [adr/README.md](./adr/README.md) + [adr/TEMPLATE.md](./adr/TEMPLATE.md) — ADR authoring rules and template.
- [contracts/README.md](./contracts/README.md) + [contracts/TEMPLATE.md](./contracts/TEMPLATE.md) — contract authoring rules and template.
- [thresholds.md](./thresholds.md) — `.devai/config/thresholds.json` schema and tuning guide.
- `docs-governance.md` (forthcoming, R13 W03) — adopter walkthrough for the cross-repo docs-publishing law in [`../meta/adr/ADR-DOCS-GOVERNANCE.md`](../../law/adr/README.md): classify the repo (`library` vs `application`), pick the builder (Docusaurus default; Jekyll opt-out for applications via paired ADR), and publish to a same-repo `gh-pages` branch.

**Operational (R3, 2026-05-23):**

- [round-break.md](./round-break.md) — work-break canon: ROUND > WAVE > PHASE > STEP hierarchy, naming, artifact discipline, gate processing, close criteria, right-sizing.
- [prompt-header.md](./prompt-header.md) — metadata header spec for every prompt under any round's `prompts/`.
- [state-layout.md](./state-layout.md) — `record/proofs/` filesystem canon (baseline + 5 optional extensions absorbed from STYNX). Contract counterpart: [`../docs/reference/contracts/state-extensions.md`](../reference/contracts/state-extensions.md).
- [build-plan-convention.md](./build-plan-convention.md) — work/rounds/R-0001/plan.md project-lifecycle ledger structure (phase + sub-batch terminology; phase-vs-round disambiguation).
- [governed-rounds.md](./governed-rounds.md) — supported human-supervised round lifecycle, local scratch boundary, and durable archive ceremony.
- [decisions-ledger.md](./decisions-ledger.md) — append-only deferred-decision ledger at `record/proofs/decisions.jsonl`. Schema: [`../docs/reference/contracts/decisions.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/decisions.schema.json).

## Where else to look

- Full reference walkthrough: [adoption.md](./adoption.md).
- Operator-facing runbooks (per-worktree DBs, locks, evidence chain): [../meta/ops/](../dev/operations).
- CLI reference (auto-generated): [../reference/cli/](../reference/cli.md).
- Schemas the framework speaks: [../law/schemas/](../../law/schemas).
- Cross-repo contracts (test-result, thresholds, evidence-chain, inventory): [../docs/reference/contracts/](../reference/contracts).
- The forty-article constitution: [../../law/constitution.md](../../law/constitution.md).

## What this guide assumes

- You run `pnpm` and Node ≥ 24.
- Your repo is on macOS or Linux. Windows is not supported.
- You read `../../README.md` for the one-page orientation before starting here.

If anything in the steps below doesn't match your repo's reality, the most likely cause is a missing stack-adapter pack rather than a DEVAI bug — see [pack-resolution.md](./pack-resolution.md) for how to confirm and extend.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/README.md (classification CURRENT).
