---
title: Test policy
sidebar_position: 12
---

# Test policy

> Per [Constitution Article 29](../../reference/law.md), a test is a sensor on the plant — it measures plant behaviour against specification. Tests are not malleable documentation. They are anchored to invariants via [trace](./invariants.md) (Article 13), gated against weakening (Article 30), and probed by the six vitest suites described below.

## What a test is in DEVAI

- **A sensor.** Tests measure *y(t)* — the plant's actual behaviour — against *r(t)*, the specification.
- **Anchored to invariants.** Every test references one or more invariants via the test's `invariants:` declaration; the trace artifact records the mapping.
- **Not malleable documentation.** A failing test means the plant violated the specification. The Inspector cannot relax the test to make the plant pass — relaxation requires either an Architect invariant change (Article 24) or an [RGR](./loop.md) (Article 22).

## The six suites

DEVAI ships six vitest configurations. Each probes the plant at a different level; together they cover the framework's regulation surface.

### Unit (`vitest.config.ts`)

- **Purpose.** Per-package logic. In-process. No external dependencies.
- **Timing.** Measured by the current CI/test-matrix evidence; no fixed duration is a contract.
- **Coverage target.** The merged binding floor is 70% lines, 60% branches, 70% functions, and 70% statements. An 80% line figure remains an improvement target, not a release gate.
- **When it runs.** Cycle A continuously; Cycle B at every merge attempt; CI on every push.

### Integration (`vitest.integration.config.ts`)

- **Purpose.** DB-gated subprocess tests that walk the CLI surface end-to-end.
- **Gating.** Ordinary CI is deterministic. Live DB and real-provider cases use explicit environment opt-ins; real LLM cases run only when `DEVAI_LLM_TESTS=1`.
- **Timing.** Measured by the current CI/test-matrix evidence; provider and DB opt-ins materially change it.
- **Coverage caveat.** Per [Phase 37 finding](../../dev/round-ledger.md), the integration suite is the **only** suite that produces realistic CLI coverage; the unit suite under-measures because it doesn't capture subprocess-spawned CLI execution.
- **When it runs.** Cycle B at every merge attempt; CI on every push (via `pnpm test:coverage:integration` for merged unit+integration coverage).

### E2E (`vitest.e2e.config.ts`)

- **Purpose.** Full-flow supported human-supervised journeys. Experimental-loop containment scenarios prove activation and recoverability separately; they do not claim autonomous convergence.
- **Timing.** Measured by the current CI/test-matrix evidence.
- **When it runs.** Cycle C post-merge; CI on every push.

### Smoke (`vitest.smoke.config.ts`)

- **Purpose.** Environment + bin resolution baseline. "Can the CLI be invoked? Does `devai --version` return?"
- **Timing.** Measured by the current CI/test-matrix evidence.
- **When it runs.** Earliest CI step; quickfail if smoke breaks.

### Contract (`vitest.contract.config.ts`)

- **Purpose.** JSON Schema instance validation. Every artifact that matches a schema validates against that schema.
- **Timing.** Measured by the current CI/test-matrix evidence.
- **When it runs.** Cycle B at every merge attempt; CI on every push.

### Regression (`vitest.regression.config.ts`)

- **Purpose.** Anchored scenarios reproducing past defects. Each regression test names the defect it reproduces and the fix that closed it.
- **Timing.** Measured by the current CI/test-matrix evidence.
- **Policy.** Regression tests are **never deleted**, only added. A regression test that no longer reproduces its scenario is removed only via an Architect-authored ADR documenting why the scenario is no longer reachable.

## Journeys

Owner-authored journeys under `product/journeys/` translate to acceptance tests under the integration or e2e suite. Per the [invariants](./invariants.md) authority chain, every journey's `acceptance_criteria` field references at least one test ID; the test ID resolves to a real test in the corresponding suite.

`devai spec validate journeys` enforces the mapping.

Journey, test, and evidence lifecycle provenance is binding. Experimental tests remain traceable but cannot turn a supported readiness cell PASS or enter its denominator.

## DB tests

- **Gating.** `DEVAI_DB_TESTS=1`. Without the gate, DB-touching tests skip.
- **Per-worktree DB.** Each worktree gets its own Postgres DB; advisory locks (`devai work lock acquire`) coordinate concurrent writes when multiple tests target the same module.
- **Setup.** `devai work db start shared` boots a shared Postgres for the integration suite; per-worktree DBs are provisioned by `devai work db provision`.

## Mutation scenarios

Per [ADR-MUTATION-SCENARIOS](../../../law/adr/README.md), mutation testing runs against a scenario contract (`docs/reference/contracts/mutation-scenario.schema.json`). Scenarios encode which mutations to apply (variable swap, boundary nudge, return-value flip, etc.) and the per-scenario kill-rate threshold for the soft gate.

`devai sense mutation run --scenarios <path>` runs the scenarios; `devai sense mutation verify` enforces the configured threshold when invoked. This machinery is **advisory production evidence** for DEVAI itself and is **not part of the binding close chain**. Promotion requires a separately authorized, recorded campaign; ordinary unit coverage of the runner does not establish a mutation score.

## Test weakening (Article 30)

Every commit touching F3 is **AST-diffed against its parent**. Weakening events are quantified by:

- Change in assertion count.
- Change in `expect` call count.
- Change in HTTP-status assertions.
- Addition of `skip` / `todo` / `only` annotations.
- Removal of invariant references.

**Unjustified weakening** is when metrics exceed thresholds in `.devai/scorecard/thresholds.json` AND there's no corresponding tracked invariant change (deprecation, retirement, scope reduction).

- **Default thresholds:** max 20% assertion-decrease ratio per file; absolute floor of 1 assertion; exempt when test-case count increases (split-not-weaken pattern).
- **Per-invariant override:** `change_policy.test_weakening_allowed: false` overrides all thresholds — any weakening is unjustified regardless of magnitude.
- **Hard gate.** Unjustified weakening produces `FAIL`. Weakening within thresholds but without tracked invariant change produces `REVIEW`.

The Inspector or Engineer must strengthen back, justify against an invariant change, or emit an [RGR](./loop.md).

**An Inspector acting outside a coupled triplet has no authorized route to weaken a test independently.** Relaxation requires either an Architect invariant change (Article 24) or an RGR (Article 22).

## Flaky quarantine (Article 31)

Tests identified as flaky by repeated non-deterministic outcomes may be moved to quarantine. Quarantined tests carry metadata in trace (`flaky: true`, `quarantine: true`, optional ticket reference) and are **excluded from hard-gate failure aggregation**.

Quarantine is **a temporary state** subject to Auditor scrutiny. The Auditor surfaces the quarantine list periodically and pressures it toward zero. A quarantined test that remains broken indefinitely is itself a hard-gate failure of `Observation × Discipline`.

## Coverage policy

Per [Phase 33 IO-shape heuristic](../../adopters/common-pitfalls.md):

- **Interface-injected packages** (sensors take options; no live DB clients in src): aim for ≥80% via mocks. Estimated 2-3 hr/package burn-down.
- **IO-bound packages** (live DB clients, network calls): use the integration suite as the dominant coverage signal; don't try to hit ≥80% with unit-suite mocks.

`scripts/coverage-aggregate.mjs` merges unit + integration coverage via `NODE_V8_COVERAGE` dumps; the merged report is what the F3 × T2 cell scores against. CI enforces 70/60/70/70 and the threshold may not be reduced to close a round.

## Per-batch verification (Phase 38.D)

The four CI-gate commands required locally before every commit:

1. `pnpm lint` — `eslint .`
2. `pnpm typecheck` — `tsc -b && tsc --noEmit -p tsconfig.typecheck.json`
3. `pnpm test` — unit suite
4. `DEVAI_LLM_TESTS=0 pnpm test:coverage:integration` — deterministic merged unit + integration coverage
5. `pnpm test:regression`, `pnpm test:contract`, `pnpm test:smoke`, and supported E2E
6. Experimental-containment E2E, reported separately

**Sensor SRs are NOT CI-gate-equivalent.** The `sense-lint` and `sense-type-check` SRs surface signal but their cache can be stale; the four commands above are the gates.

## Adopter expectations

- Mirror the six-suite shape in your repo. Configs may differ (different vitest globs, different DB) but the conceptual six suites stay.
- The `extractor_params` field on each sensor's pack config lets you tighten or relax thresholds per-pack. Loosening is logged as a soft-gate finding.
- Journeys + invariants + trace are non-negotiable — they're the framework's reference signal and you must keep them in sync.

## See also

- [Constitution Articles 29-31](../../reference/law.md) — sensor, weakening, quarantine.
- [Scorecard](./scorecard.md) — verdict semantics + thresholds.
- [`adopters/common-pitfalls`](../../adopters/common-pitfalls.md) — operational coverage notes.
- [`meta/test-matrix`](../../dev/index.md) — DEVAI's own current suite measurements.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/test-policy.md (classification CURRENT).
