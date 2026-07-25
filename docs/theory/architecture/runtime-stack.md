# Runtime stack

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-29](../../../law/adr/README.md) — "Tool runtime stack (soft, defaulted)."

## Rule

DEVAI's own implementation (the `@devai-nyx/*` packages) is built on a fixed set of runtime and tooling choices:

| Layer              | Choice                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| Language           | TypeScript (strict mode, ESM modules throughout)                            |
| Workspace manager  | pnpm workspaces (content-addressable store, lightweight orchestration)      |
| Build              | `tsc -b` composite builds; project references per package                   |
| Test runner        | Vitest (one root config + filename-suffix-driven test categories)           |
| CLI framework      | `cac` (small, declarative, no plugin architecture)                          |
| Type generation    | `json-schema-to-typescript` (schemas → `.d.ts` for compile-time validation) |
| Runtime validation | `ajv` + `ajv-formats` (Draft 2020-12 schemas)                               |
| Dev platform       | macOS                                                                       |
| CI platform        | Linux (GitHub Actions)                                                      |

Generated TypeScript types are not committed (per [`.gitignore`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/.gitignore) — `packages/schemas/generated/`).

## Rationale

Each choice was made by elimination:

**CLI framework — `cac` over `commander` and `oclif`:**
`commander` is mature but verbose for ~60 commands (see [`tool-surface.md`](./tool-surface.md)). `oclif` is heavy: plugin architecture, manifest generation, command lifecycle hooks — none of which DEVAI needs since all commands ship in one binary. `cac` is the right size: a clean declarative API, sub-command grouping out of the box, no overkill.

**Workspace manager — `pnpm` over plain npm and Nx:**
Plain npm workspaces work but lack a content-addressable store, which makes installs in CI slow and disk-hungry across multiple worktrees. Nx is an orchestration framework — DEVAI _is_ an orchestration framework, so layering Nx on top would conflict on the same surface. `pnpm`'s store + workspace primitives are exactly what DEVAI needs and nothing more.

**Test framework — Vitest over Jest and `node:test`:**
Jest is CJS-by-default and slow to start across a multi-package monorepo. `node:test` is minimal but lacks the watch / coverage / project-references behaviour the workflow depends on. Vitest is ESM-native, fast, and integrates cleanly with `tsc -b` composite builds.

**Type generation + runtime validation — `json-schema-to-typescript` + `ajv`:**
The repo ships 35+ JSON schemas (see [`../contracts/README.md`](../../reference/contracts/README.md)). Generating compile-time types from those schemas is non-negotiable; using a single canonical generator (`json-schema-to-typescript`) avoids type drift. Runtime validation must be JSON-Schema-2020-12-compliant; `ajv` with `ajv-formats` is the canonical choice in the JS ecosystem.

## Practical consequences

1. **No new tooling layer without a D-entry.** Adding a build orchestrator, a different test runner, or a different CLI framework requires a new design decision that supersedes the relevant row above. This is the "soft, defaulted" framing: the choices are firm but not constitutional.

2. **Generated code is not committed.** Per [`CLAUDE.md`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/CLAUDE.md), `packages/schemas/generated/*` is regenerated on demand. CI regenerates before each test run; local dev does so via `pnpm build`.

3. **TypeScript composite builds enforce the package boundary.** Each `@devai-nyx/*` package has its own `tsconfig.json` with explicit `references`. The dependency graph is therefore declared, not inferred. Circular dependencies fail compilation.

4. **Vitest configs split test categories by filename suffix**: `.test.ts` is unit, `.integration.test.ts` is integration (DB-gated, see [`../../meta/ops/testing.md`](../../dev/operations/testing.md)), `.e2e.test.ts` is end-to-end. The categorization lives in `vitest.config.ts` / `vitest.integration.config.ts` / etc.

5. **macOS-dev / Linux-CI is the canonical target pair.** Windows is unsupported. Adopters on Linux dev environments are first-class but receive less canonical testing.

## When to revisit

Each row is independently revisitable:

- **`cac` → something else:** triggered if `cac` is unmaintained, or if a need emerges that `cac` cannot model (e.g., interactive REPL mode). Currently no trigger.
- **Vitest → something else:** triggered if Vitest's project-references behaviour becomes a blocker (e.g., for parallel matrix CI runs the way Jest's workers handle it). Currently no trigger.
- **`pnpm` → something else:** triggered if pnpm's store semantics change in a way that breaks worktree-shared installs. Currently no trigger.
- **`ajv` → something else:** triggered only if JSON Schema Draft 2020-12 support drops or a meaningfully faster validator emerges. Currently no trigger.

Per the soft framing of D-29, any row can be revisited with a new D-entry without constitutional impact.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/runtime-stack.md (classification CURRENT).
