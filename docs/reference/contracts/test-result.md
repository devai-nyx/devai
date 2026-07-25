# test-result contract

**Schema:** [test-result.schema.json](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/test-result.schema.json) (JSON Schema 2020-12)
**Stability:** experimental → stable on first adopter ratification
**Authored under:** Architect authority, DEVAI R1 alignment round. See [CONVENTIONS.md](../../adopters/CONVENTIONS.md) for the broader cross-repo canon.

## Purpose

A `test-result` is the canonical machine-readable artifact emitted by **one invocation of one assurance tier** (unit, api, db, e2e, mutation, perf, lint, typecheck, coverage). It is the universal envelope every DEVAI adopter writes, and the universal input every DEVAI reporter consumes.

It exists because every adopter we surveyed had reinvented the same shape:

- STYNX wrote `tools/repo-config/test-result.schema.json` and three scripts that produced and consumed it.
- TEAT had a parallel `test-matrix.config.json` re-implementing the tiering convention.
- PEC + SGP shipped no canonical artifact at all; they relied on parsing JUnit XML at report time.

Promoting one contract eliminates the per-repo re-implementations and lets the four cross-cutting tools (`devai evidence test matrix`, `devai evidence test record`, `devai evidence emit`, `devai evidence coverage aggregate`) ship in DEVAI rather than as STYNX scripts.

## Producers

| Producer                                    | Trigger                                   | Notes                                                                 |
| ------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `devai evidence test record`                | wrapper around any test-runner invocation | The canonical writer post-DEVAI R2 (R1 ships only the contract).      |
| Adopter CI step                             | direct emission from a workflow           | Permitted; must validate against this schema.                         |
| `stynx scripts/run-and-record.mjs` (legacy) | wrapper today                             | Will be retired in STYNX R2 in favor of `devai evidence test record`. |

A producer MUST set every field in `required`. A producer SHOULD set `evidence.log_path` so a forensic re-trace can find the raw runner output without consulting the chain.

## Consumers

| Consumer                                                                      | What it reads                                                                     | Notes                                                                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `devai evidence test matrix`                                                  | one result per (package, tier); aggregates into the F×T scorecard matrix          | DEVAI R2 deliverable.                                                                                         |
| `devai evidence coverage aggregate`                                           | every result with `tier=coverage` or `metrics.coverage_pct` set                   | Folds unit-coverage and integration-coverage into a single repo-level summary (see D-98 / Phase 37 in DEVAI). |
| `devai evidence emit`                                                         | the producing run; writes a corresponding chain entry pointing at the result file | One chain entry per `test-result`.                                                                            |
| DEVAI sensors (`sense-unit-test`, `sense-coverage`, `sense-mutation-test`, …) | the relevant tier's results                                                       | Sensors read filesystem; this schema is their input contract.                                                 |
| Adopter CI summary jobs                                                       | results from many packages; produce a Markdown summary                            | Schema-driven; no parsing of JUnit required.                                                                  |

## Relationship to `evidence-chain.json`

A `test-result` is **a leaf artifact**. The hash-chained audit log at `record/proofs/chain.json` (see [evidence-chain.schema.json](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/evidence-chain.schema.json)) references it from a `kind: "test-run"` entry's `ref.test_result_id` field. The relationship is:

```
record/proofs/chain.json
    └── records[N] { kind: "test-run", ref: { test_result_id: "TR-..." }, ... }
                              │
                              ▼
.test-results/<scope>/<tier>.json   ← THIS contract
```

This split is deliberate. The chain is append-only and hash-linked; the result file is byte-stable but freely re-readable. Updating a chain entry means rewriting every subsequent entry; updating a result is just a file overwrite (governed by the producer, not by chain hash).

## Tier semantics

| `tier`      | What runs                                                    | Typical `metrics`                                            |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `unit`      | in-process unit suite (Vitest, Jest, node:test)              | `passed`/`failed`/`skipped`/`total`, optional `coverage_pct` |
| `api`       | API-shape tests against a running service                    | `passed`/`failed`/`skipped`/`total`                          |
| `db`        | database-acceptance tests (DDL apply, migrations, RLS smoke) | `passed`/`failed`/`skipped`/`total`                          |
| `e2e`       | end-to-end browser tests (Playwright, Cypress)               | `passed`/`failed`/`skipped`/`total`                          |
| `mutation`  | mutation testing (Stryker, Mutmut)                           | `mutation_score`, `mutation_survivors`                       |
| `perf`      | latency / throughput smoke (k6, autocannon, custom)          | `perf.{p50_ms,p95_ms,p99_ms,rps,samples}`                    |
| `lint`      | static lint (ESLint, ruff, golangci-lint)                    | `lint.{errors,warnings}`                                     |
| `typecheck` | type-checker pass (`tsc`, `pyright`, `mypy`)                 | `typecheck.errors`                                           |
| `coverage`  | coverage aggregation only (no test run)                      | `coverage_pct.{lines,branches,functions,statements}`         |

`tier=coverage` is distinct from "a unit run that emitted coverage as a side-effect". A coverage-tier result is the post-aggregation summary across one or more runs and is the canonical input to `devai evidence coverage aggregate`. A unit-tier result that incidentally carries `coverage_pct` describes _that one runner's_ coverage and is not a substitute.

## Worked examples

### 1. Passing unit run

```json
{
  "schemaVersion": "1.0.0",
  "id": "TR-01HG0Z9X7Y8K2N3M4P5Q6R7S8T",
  "repo": "stynx",
  "scope": "@stynx/auth",
  "tier": "unit",
  "timestamp": "2026-05-22T14:32:17.482Z",
  "status": "pass",
  "command": "pnpm --filter @stynx/auth test:unit -- --reporter=json",
  "env": {
    "node": "v24.4.0",
    "os": "linux-x64",
    "branch": "main",
    "commit": "9f0a4dd26d81ef2cc009074820c767f7be3c9682",
    "ci": true
  },
  "metrics": {
    "passed": 287,
    "failed": 0,
    "skipped": 3,
    "total": 290,
    "duration_ms": 4821,
    "coverage_pct": {
      "lines": 92.4,
      "branches": 87.1,
      "functions": 94.8,
      "statements": 92.4
    }
  },
  "evidence": {
    "log_path": ".test-results/stynx-auth/unit.log",
    "report_path": ".test-results/stynx-auth/unit-vitest.json",
    "junit_path": ".test-results/stynx-auth/unit.junit.xml",
    "coverage_summary_path": "coverage/stynx-auth/coverage-summary.json"
  },
  "exit_code": 0,
  "signal": null
}
```

### 2. Failing e2e run

```json
{
  "schemaVersion": "1.0.0",
  "id": "TR-01HG10A2B3C4D5E6F7G8H9J0K1",
  "repo": "teat",
  "scope": "apps/web",
  "tier": "e2e",
  "timestamp": "2026-05-22T15:04:51.119Z",
  "status": "fail",
  "command": "pnpm --filter apps/web test:e2e -- --reporter=json",
  "env": {
    "node": "v24.4.0",
    "os": "linux-x64",
    "branch": "feat/ait-publish-flow",
    "commit": "d333a255ed3d7193c93eec2e860c5f284e9aa5a7",
    "ci": true
  },
  "metrics": {
    "passed": 41,
    "failed": 2,
    "skipped": 0,
    "total": 43,
    "duration_ms": 184722
  },
  "evidence": {
    "log_path": ".test-results/teat-web/e2e.log",
    "report_path": ".test-results/teat-web/e2e-playwright.json",
    "junit_path": ".test-results/teat-web/e2e.junit.xml",
    "html_report_path": "playwright-report/index.html"
  },
  "exit_code": 1,
  "signal": null
}
```

### 3. Mutation-test report

```json
{
  "schemaVersion": "1.0.0",
  "id": "TR-01HG10N7P8Q9R0S1T2U3V4W5X6",
  "repo": "stynx",
  "scope": "@stynx/core",
  "tier": "mutation",
  "timestamp": "2026-05-22T16:22:08.000Z",
  "status": "pass",
  "command": "pnpm --filter @stynx/core test:mutation",
  "env": {
    "node": "v24.4.0",
    "os": "linux-x64",
    "branch": "main",
    "commit": "9f0a4dd26d81ef2cc009074820c767f7be3c9682",
    "ci": true
  },
  "metrics": {
    "mutation_score": 87.3,
    "mutation_survivors": 11,
    "duration_ms": 612344
  },
  "evidence": {
    "log_path": ".test-results/stynx-core/mutation.log",
    "report_path": "reports/stryker/stynx-core/mutation.json",
    "html_report_path": "reports/stryker/stynx-core/mutation.html"
  },
  "exit_code": 0,
  "signal": null
}
```

## Compatibility rules

- Adding a new optional field is backward compatible; bump only the schema's prose change log.
- Adding a new enum value to `tier` or `status` is a breaking change for consumers that switch exhaustively — bump `schemaVersion`.
- Removing a field is always a breaking change.
- An adopter MAY emit a subset of the enum values but MUST NOT introduce new ones. A new tier requires a contract revision (this file + the schema, under Architect authority).

## Where this contract lives

- Schema: [`docs/reference/contracts/test-result.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/test-result.schema.json) in DEVAI.
- Sample: [`docs/reference/contracts/examples/test-result-example.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/examples/test-result-example.json).
- Consumers will move into the `devai` CLI in DEVAI R2; today they live in STYNX `scripts/`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/contracts/test-result.md (classification CURRENT).
