# Contributing to DEVAI

DEVAI is governed by `CONSTITUTION.md` and the per-role authority discipline declared in `CLAUDE.md`. Read both before touching anything substantive. Adopter-facing orientation lives in [`docs/adopters/user-guide.md`](docs/adopters/user-guide.md), with the hands-on path in [`docs/adopters/adoption.md`](docs/adopters/adoption.md).

This file documents the practical workflow for getting a development environment working and running the gates the project uses to assess itself.

## Prerequisites

- Node.js ≥ 24 (matches `engines.node` `>=24.0.0` in `package.json`; CI runs Node 24).
- pnpm (the only package manager — locked by `D-5` and confirmed across phases).
- Git ≥ 2.40 (worktree subsystem requires modern git).
- Optional: Docker, if you want to run the DB-gated integration tests locally (see below).

## Initial setup

```bash
pnpm install
pnpm run build
```

## Running the gates

The full sweep the closeout uses:

```bash
pnpm run lint                  # eslint
pnpm run typecheck             # tsc --noEmit
pnpm test                      # vitest run, unit tests only
pnpm test:integration          # vitest run, integration tests
pnpm test:regression           # vitest run, regression suite
pnpm test:coverage:integration # merged unit + integration coverage; binding 70/60/70/70 floors
node packages/cli/dist/bin.js spec validate all      # aggregate F1 validation
node packages/cli/dist/bin.js docs cli --check       # CLI reference byte-identity
node packages/cli/dist/bin.js docs links             # cross-reference auditor
```

Every batch commit during phase work runs the relevant subset of these before landing. The closeout commit of each phase runs all of them.

## DB-gated integration tests (`DEVAI_DB_TESTS=1`)

Three integration test files require a reachable Postgres to run their full contents:

- `packages/cli/test/sense.integration.test.ts` — `sense migrate-check` idempotence
- `packages/core/test/db-introspector.integration.test.ts` — `information_schema.tables` introspection
- `packages/sensors/test/runtime-probe-data.integration.test.ts` — runtime-probe data-kind driver

In default CI runs, these tests are silently skipped (currently 11 tests, depending on the gated set). The skip is intentional per BUILD-PLAN Phase 3.G: real Postgres in CI adds infrastructure cost we haven't chosen to absorb yet.

To run the gated tests locally:

```bash
# 1. Start a Postgres container (one-time per session)
docker run --rm -d \
  --name devai-test-pg \
  -p 5433:5432 \
  -e POSTGRES_PASSWORD=test \
  postgres:15-alpine

# 2. Wait ~5 seconds for it to be ready, then run with the env var set
DEVAI_DB_TESTS=1 \
DEVAI_DB_URL=postgres://postgres:test@localhost:5433/postgres \
pnpm test:integration

# 3. When done, stop the container
docker stop devai-test-pg
```

Without `DEVAI_DB_TESTS=1`, the integration suite passes without exercising any of these paths. With it set but no DB reachable, the tests will error rather than skip — a deliberate honesty choice (failure to set up the prerequisite is louder than silent skip when the user explicitly opted in).

Why this is gated, not always-on: the CI overhead of bringing up Postgres for every PR is ~10s per run, and the matters-for-this-PR question almost never depends on the gated tests. The trigger to flip this to always-on lands in `docs/framework/arch/known-tech-debt.md` if and when canonical's substrate needs it.

## LLM-gated integration tests (`DEVAI_LLM_TESTS=1`)

Two integration test files exercise four writer skills against a real LLM
provider:

- `packages/cli/test/writer-real-llm.integration.test.ts` — `SKILL-write-overview` end-to-end against `claude` or `codex` family
- `packages/cli/test/writer-real-llm-matrix.integration.test.ts` — three
  additional writers: RBAC matrix, architecture guide, and onboarding

Ordinary deterministic CI sets `DEVAI_LLM_TESTS=0`, so all four real-provider
cases are skipped and mock-backed coverage remains active. Real-provider tests
run only with explicit `DEVAI_LLM_TESTS=1`, a usable provider credential or
logged-in host CLI, and a built DEVAI binary. To run them locally:

```bash
ANTHROPIC_API_KEY=sk-... \
DEVAI_LLM_TESTS=1 \
DEVAI_LLM_BUDGET_USD=1.00 \
pnpm test:integration
```

Or with the OpenAI family:

```bash
OPENAI_API_KEY=sk-... \
DEVAI_LLM_BACKEND=codex \
DEVAI_LLM_TESTS=1 \
DEVAI_LLM_BUDGET_USD=1.00 \
pnpm test:integration
```

The test invokes `devai docs synthesize overview` against a temp-dir fixture; expect ~$0.01 cost per run on claude-3-5-sonnet or gpt-4o-class models. The budget cap in `DEVAI_LLM_BUDGET_USD` is mandatory — the LLM substrate refuses to start a call that would exceed remaining budget.

Why this is gated, not always-on: cost + determinism. CI runs many times per day; real-provider calls add up and produce non-deterministic outputs that are hard to assert against. The mock-LLM path covers wiring + schema validation in every CI run; this gate covers the "did the prose actually come out non-empty" question that only a real provider can answer.

### Phase 19.E — opt-in real-LLM CI matrix

`.github/workflows/llm-real-matrix.yml` (Phase 19.E, D-61) widens the gated suite into a CI matrix across the `{claude, codex}` provider families. It is **not** part of the default `ci.yml` workflow; default PRs are unaffected.

Triggers:

- `workflow_dispatch` — operator clicks "Run workflow" in the GitHub UI.
- `schedule` — Sundays at 06:00 UTC, but the job is no-op unless the opt-in secret is set.

Secret prerequisites (configured at the repo level):

- `DEVAI_LLM_REAL` — any non-empty value enables the workflow.
- `ANTHROPIC_API_KEY` — required for the `claude` matrix cell.
- `OPENAI_API_KEY` — required for the `codex` matrix cell.

The matrix runs `pnpm test:integration` with `DEVAI_LLM_TESTS=1` + `DEVAI_LLM_BUDGET_USD=1.00`, so it picks up both `writer-real-llm.integration.test.ts` (single writer) and `writer-real-llm-matrix.integration.test.ts` (three additional writers: rbac-matrix, architecture-guide, onboarding). Expected cost per matrix cell: ~$0.04. Total workflow cost when fully enabled: ~$0.08 per run.

## LLM substrate in development

CI pins the LLM backend to `mock` (Phase-9 plan decision 3i). For local development with a real provider:

```bash
ANTHROPIC_API_KEY=... DEVAI_LLM_BUDGET_USD=2.00 \
  node packages/cli/dist/bin.js llm probe
```

Or run the loop:

```bash
ANTHROPIC_API_KEY=... DEVAI_LLM_BUDGET_USD=10.00 \
  node packages/cli/dist/bin.js loop run
```

`DEVAI_LLM_BUDGET_USD` is a fail-safe cost cap: the LLM substrate refuses to start a call that would exceed the remaining budget. Reset by either restarting the process or editing `.devai/state/llm-usage.jsonl`.

## Per-project test-weakening config

The test-weakening sensor (`sense test-weakening`) ships with the D-21 defaults: 20% assertion-decrease ratio, absolute floor of 1, etc. Each project can override these via `.devai/config/test-weakening.json` (schema: `test-weakening-config.schema.json`). The file is optional; on absence, defaults apply.

```json
{
  "schemaVersion": "1.0.0",
  "threshold_ratio": 0.15,
  "absolute_decrease_floor": 2,
  "skip_added_threshold": 3,
  "invariant_reference_removed_threshold": 1,
  "ignored_paths": ["packages/legacy/**/test/**"]
}
```

Values clamp into safe ranges on load (e.g. `threshold_ratio` to `[0, 1]`). Locked by D-56; see DESIGN-DECISIONS.md.

## Authoring discipline

- **Role declaration.** Before touching anything substantive, declare which Article-6 role you're operating in (Architect / Engineer / Inspector / Auditor / Owner). The path-based authority enforced by `CLAUDE.md` decides what you can edit.
- **Role-tagged commits.** Commits on this repo's own batches carry the exercising role as the message prefix (`Engineer: …`, `Architect: …`). Externally-branched PRs (e.g. agent-authored `codex/*` branches) may use conventional-commit style in the commits, but the PR body must then declare the role(s) exercised per batch; a PR that bundles cross-role work must say so explicitly so the merge commit's provenance is auditable (Articles 7 and 10). (Convention recorded at R17 after PRs #23–24 landed untagged.)
- **Per-batch commits.** Substantial work lands as a sequence of small batch commits (Batch N.A, N.B, …) rather than one monolithic commit. Each batch is independently revertable.
- **Schema-instance validation.** Any record produced that matches a `docs/framework/schemas/*.schema.json` must validate against that schema as part of its emit path. This is non-negotiable.
- **D-entry discipline.** Substantive design decisions land in `DESIGN-DECISIONS.md` as numbered D-N entries. Decisions supersede via new entries, never via in-place edits.

## Reporting issues

DEVAI is currently single-author. If you've reached this file via a future open-source distribution, the issue-reporting pathway will be documented here. For now, the practical channel is direct discussion with the author.
