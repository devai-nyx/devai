---
title: Scripts
sidebar_position: 3
---

# Scripts

> The repo's `pnpm` scripts plus the `scripts/*.mjs` utilities. Auto-generation is candidate work for a follow-on round; the current page is hand-curated and may drift between rounds.

## `pnpm` scripts (`package.json`)

| Script                           | Command                                             | What it does                                                                               |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm build`                     | `tsc -b` + sub-package builds                       | Build all packages                                                                         |
| `pnpm lint`                      | `eslint .`                                          | Lint everything                                                                            |
| `pnpm typecheck`                 | `tsc -b && tsc --noEmit -p tsconfig.typecheck.json` | Two-pass typecheck (per-package + full-include)                                            |
| `pnpm test`                      | Unit suite                                          | Vitest, in-process, no DB                                                                  |
| `pnpm test:integration`          | Integration suite                                   | DB-gated subprocess tests; needs `DEVAI_DB_TESTS=1`                                        |
| `pnpm test:e2e`                  | E2E suite                                           | Full-flow brownfield-loop scenarios                                                        |
| `pnpm test:smoke`                | Smoke suite                                         | Environment + bin resolution baseline                                                      |
| `pnpm test:contract`             | Contract suite                                      | JSON Schema instance validation                                                            |
| `pnpm test:regression`           | Regression suite                                    | Anchored past-defect scenarios                                                             |
| `pnpm test:coverage`             | Unit + V8 coverage                                  | Vitest with `--coverage`                                                                   |
| `pnpm test:coverage:integration` | Unit + integration coverage merge                   | Wraps both suites under `NODE_V8_COVERAGE` and merges via `scripts/coverage-aggregate.mjs` |

## `scripts/*.mjs` utilities

| Script                            | Purpose                                                                                                                                                       | When invoked                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `scripts/coverage-aggregate.mjs`  | Merge V8 coverage dumps from unit + integration suites into a single c8 report                                                                                | `pnpm test:coverage:integration`                                                                                |
| `scripts/r14-path-rewrite.mjs`    | R14 W03 — rewrite docs/`<old>/` and `../<old>/` paths in markdown to new IA locations                                                                         | Run once by W03; reusable by adopters migrating to constitution 0.2.0                                           |
| `scripts/r14-fixup-relpath.mjs`   | R14 W03 — over-rewrite reversal + depth-shift for repo-root refs inside new containers                                                                        | Sequential with `r14-path-rewrite.mjs`                                                                          |
| `scripts/r14-fixup-relpath-2.mjs` | R14 W03 — top-level docs files + cross-container new-container refs                                                                                           | Sequential with the above                                                                                       |
| `scripts/r14-fixup-relpath-3.mjs` | R14 W03 — top-level non-container siblings (adopters/, roles/, root files)                                                                                    | Sequential with the above                                                                                       |
| `scripts/r14-harness-sweep.mjs`   | R14 W04 — sweep `packages/`, `.github/`, vitest configs for hardcoded old paths in TS/JS/JSON/YAML                                                            | Run once by W04; reusable by adopters                                                                           |
| `scripts/gen-aspect-grid.mjs`     | R14 W10 — generate `framework/aspect-grid.md` from sensor design notes                                                                                        | Per `npm run sync-docs` invocation                                                                              |
| `scripts/gen-self-scorecard.mjs`  | Render the canonical/site self-scorecard pair and provenance manifest from one explicit schema-valid scorecard, its exact measured SHA, and a freshness bound | Invoked directly by the Auditor-owned exact-candidate flow; deliberately **not** called by ordinary `sync-docs` |
| `scripts/gen-test-matrix.mjs`     | R14 W10 — generate `meta/test-matrix.md` from vitest configs + test file globs                                                                                | Per `npm run sync-docs` invocation                                                                              |
| `scripts/gen-skill-catalog.mjs`   | R14 W10 — generate `reference/skills/` catalog from `devai agent skill list`                                                                                  | Per `npm run sync-docs` invocation                                                                              |
| `scripts/gen-schema-browser.mjs`  | R14 W10 — generate `law/schemas/` browser from `law/schemas/*.schema.json`                                                                                    | Per `npm run sync-docs` invocation                                                                              |

## `docs/site/scripts/sync-docs.mjs`

The Docusaurus sync substrate. Runs the mirror/allowlist/category/asset phases
and the deterministic generators that do not require external observation
inputs, per ADR-DOCS-IA Decisions 3-6. Invoked by
`cd docs/site && npm run sync-docs` (or `npm run build`, which wraps it through
the `prebuild` hook).

Self-scorecard rendering is intentionally outside that path. The caller must
own and supply the exact candidate evidence explicitly:

```sh
node scripts/gen-self-scorecard.mjs \
  --repo-root . \
  --scorecard <schema-valid-scorecard.json> \
  --expected-subject-head <full-40-hex-measured-sha> \
  --max-age-hours 24
```

The renderer rejects missing, stale, placeholder, wrong-SHA, synthetic,
experimental, and Round-9007 inputs without replacing the governed outputs.
It records distinct scorecard-subject and render-source identities; deployment
provenance remains a separate claim.

## See also

- [Test policy](../theory/framework/test-policy.md) — what each test suite probes.
- [Adopters → install](../adopters/install.md) — initial `pnpm install` + build verification.
- [Lightweight CI](../adopters/lightweight-ci.md) — how the scripts integrate into the CI freshness-check model.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/scripts.md (classification CURRENT).
