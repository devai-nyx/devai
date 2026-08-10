# `scorecard-na.json` — per-repo N/A overrides

Some F×T scorecard cells genuinely don't apply to a particular repo. A library with no UI can't measure F4×T1 inventory presence of routes; a CLI tool with no DB can't measure F2×T4 plant-migrate-check; a governance framework with no PII registry can't measure F4×T6 inventory-security. The framework's global `DEGENERATE_CELLS` set (in `packages/core/src/loop/scorecard.ts`, anchored on Article 5) handles only cells that are degenerate for _every_ adopter — F4×T5 inventory-idiomaticity is the only canonical entry today. Cells that are degenerate only for _your repo's substrate shape_ go in your own `.devai/config/scorecard-na.json` file.

This page covers when to use the override (and when not to), the schema and decision tree, and a worked example using DEVAI's own carve-out.

## When to reach for the override

The decision tree, in order:

```
Is the cell genuinely non-PASS / non-N/A — i.e. a real defect?
│
├── Yes  → Fix the defect. The override exists to remove framework-shape NOISE
│         from the scorecard, not to hide real failures. Adding a cell to your
│         override file when you have a real defect is dishonest and the
│         schema's required `reason` field is there to make that obvious in
│         review.
│
└── No, it's a substrate-shape mismatch (the cell's question doesn't apply
    to this repo's substrate)
    │
    ├── Can the substrate be authored cheaply? (e.g. a small use-cases JSON,
    │   a `test:perf` script wrapping an existing benchmark, a one-time
    │   `inv coverage --emit-reading` against existing coverage data)
    │   │
    │   ├── Yes  → Author the substrate. The cell then PASS / REVIEW /
    │   │         FAIL on a real signal. Strictly preferred over an N/A
    │   │         carve-out when the cost is low.
    │   │
    │   └── No, the substrate genuinely doesn't exist
    │       │
    │       └─→ Add the cell to `.devai/config/scorecard-na.json` with an
    │           explicit `reason` and (recommended) `constitution_anchor`.
    │           Each carve-out is auditable; silent N/A is the failure mode
    │           the schema's required-field design exists to prevent.
```

The bias is toward "fix or author, not override." Use the override only when (a) the substrate truly doesn't exist for your repo and (b) creating it would be substrate-theatre (synthetic data that exists only to satisfy a sensor). The `reason` field is mandatory so every carve-out is justified in writing; expect every entry to survive PR review by a skeptical reader.

## Schema

`scorecard-na-config.schema.json` (added in Phase 34.B / D-91):

```json
{
  "schemaVersion": "1.0.0",
  "cells": [
    {
      "cell": "F2:T4",
      "reason": "short justification — at least 8 chars, schema-enforced",
      "constitution_anchor": "Article 5 (optional but recommended)"
    }
  ]
}
```

The `cell` field is required and must match `^F[1-5]:T[1-9]$`. Cells outside the 5×9 grid are rejected at load time. The `reason` field is required and must be at least 8 characters. The `constitution_anchor` field is optional but recommended — it forces you to cite the constitutional basis for each carve-out, and makes audit-time review trivial.

The file lives at `<repoRoot>/.devai/config/scorecard-na.json` by default. `score-compute --scorecard-na <path>` overrides the location. Absent file → no-op (no carve-outs). Schema-invalid file → hard error (don't silently degrade).

## Override timing

The overlay is applied:

1. **After** the global `DEGENERATE_CELLS` set (Article 5 structural claim). A cell already globally N/A stays N/A; redundant entries in your override are harmless no-ops.
2. **Before** reading-driven verdicts. A cell listed in your override stays N/A even when a SensorReading maps to it — the override is the conservative direction: a repo's explicit "this doesn't apply to us" beats sensor noise. This protects you from sensor misconfiguration that would FAIL a carved-out cell.

A consequence: if you list a cell in the override, the relevant sensor's emissions are silently dropped for that cell's verdict computation. The SR is still persisted to disk for audit; it just doesn't influence the cell's verdict.

## Worked example: DEVAI's own carve-out

DEVAI is a governance framework, not a SaaS product. Several scorecard cells designed against the canonical adopter shape (NestJS controllers, Postgres migrations, PII registry, RBAC inventory, customer-facing use-cases) don't apply to DEVAI's substrate. The framework's own `.devai/config/scorecard-na.json` carves out five cells:

```json
{
  "schemaVersion": "1.0.0",
  "cells": [
    {
      "cell": "F2:T4",
      "reason": "DEVAI is a governance framework, not a service with a database of record. It has no migration substrate of its own; sense-migrate-check has nothing to apply against. ...",
      "constitution_anchor": "Article 5 (degenerate cells, extended per-repo by D-91)"
    },
    {
      "cell": "F2:T9",
      "reason": "F2 × Freshness has no producer mapped in the current mapSensorToCell registry ...",
      "constitution_anchor": "Article 5 (degenerate cells, extended per-repo by D-91)"
    },
    {
      "cell": "F4:T6",
      "reason": "DEVAI is a governance framework with no PII registry, no RBAC inventory, and no customer-facing data substrate. ...",
      "constitution_anchor": "Article 5 (degenerate cells, extended per-repo by D-91)"
    },
    {
      "cell": "F4:T1",
      "reason": "DEVAI's actual product surface is the CLI verb catalog (actions-list), not NestJS controllers. ...",
      "constitution_anchor": "Article 5; Article 36 (self-application)"
    },
    {
      "cell": "F4:T2",
      "reason": "Same framework-shape rationale as F4:T1 ...",
      "constitution_anchor": "Article 5; Article 36 (self-application)"
    }
  ]
}
```

Each `reason` field cites the specific substrate mismatch, not just "doesn't apply." Each `constitution_anchor` field points to the Article-5 extension established in D-91. The full file lives at [.devai/config/scorecard-na.json](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/.devai/config/scorecard-na.json).

### What DEVAI did NOT carve out

For comparison, the framework chose to **author substrate** rather than override for several cells where authoring was cheap:

- **F2×T7 (perf-test)** — DEVAI has real perf SLOs (sensor wall-clocks, CLI startup). Phase 34.F added [scripts/perf-bench.mjs](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/scripts/perf-bench.mjs) + a `test:perf` package script wrapping it. Sensor flipped UNKNOWN → PASS.
- **F3×T1 (test × coverage)** — DEVAI's test suite is green; the cell was UNKNOWN purely because no `unit_test` SensorReading was on disk. Running `sense-test unit --emit-reading` (Phase 34.F) populated the SR. Flipped UNKNOWN → PASS.
- **`product/use-cases/devai-cli.json`** — authored in Phase 34.E for Article 36 self-describing value, even though it doesn't directly flip F4×T1/T2 (those cells use the carve-out instead, because DEVAI's inv-api currently picks up fixture endpoints from the example pack rather than DEVAI's actual CLI surface). The authoring exists as both a worked example for this page and a stake in the ground for what DEVAI's CLI verbs map to in journey/use-case terms.

The general rule: author when the substrate could exist and the cost is small, carve out when the substrate genuinely cannot exist.

## Counts and forensic trail

The mechanism's existence is the entire story; there's no separate counter to maintain. The forensic value comes from:

- **The carve-out file itself** — every cell carries a written justification.
- **The schema's required `reason` field** — silent carve-outs cannot pass `pnpm test`'s validator checks.
- **Per-cell evidence in the scorecard** — even an N/A cell carries `sensor_readings: undefined` because the overlay drops them; PR review can see which cells the carve-out affected.

When in doubt: **don't override**. The override should be the last resort after both "fix the defect" and "author the substrate" have been ruled out.
