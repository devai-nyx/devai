# thresholds.json — adopter guide

**Schema:** [`../docs/reference/contracts/thresholds.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/thresholds.schema.json)
**Location in adopter:** `.devai/config/thresholds.json`
**Authority:** Architect (cross-repo); per-repo values are local.

## What it is

`thresholds.json` is the single config file that pins the numeric pass/review/fail gates the DEVAI scorecard and the F2/F3 sensors use. Promoting it from STYNX-only to cross-repo canon means every adopter answers the same questions in the same shape — only the values differ.

## Schema contract

The shape is fixed by [`thresholds.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/thresholds.schema.json):

```jsonc
{
  "schemaVersion": "1.0.0",
  "coverage": { "lines": 70, "branches": 60, "functions": 70, "statements": 70 },
  "mutation": { "score_min": 60, "survived_max": 50 },
  "lint": { "max_errors": 0, "max_warnings": 0 },
  "typecheck": { "max_errors": 0 },
  "perf": { "p95_ms_max": 9000, "rps_min": 0.2 },
  "freshness": { "default_max_age_hours": 168 },
}
```

All top-level sections are optional; the schema enforces only `schemaVersion`. Adopters set only what their pipeline measures.

## How to copy and tune

1. Copy the DEVAI baseline (`/.devai/config/thresholds.json` from this repo) into your adopter's `.devai/config/`.
2. Edit values to match your assurance tier:
   - **Greenfield**: start permissive (DEVAI's defaults) — coverage 70, mutation 60, lint/typecheck 0.
   - **Mature**: tighten as you ratchet — STYNX's per-package tiers (`tier1`/`tier2`/`tier3`) at 80/85/90 mutation are a useful reference.
3. Validate locally: `devai spec validate --schema docs/reference/contracts/thresholds.schema.json --file .devai/config/thresholds.json` (post-DEVAI-R2; today, manual ajv).
4. Commit. The file is per-repo state.

## DEVAI MVP-critical minimums

For MVP-readiness reviews, DEVAI treats coverage as local Inspector evidence, not a CI-produced value. The minimum acceptable evidence is:

| Surface                                                     |                                               Minimum line coverage | Required command                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------: | ------------------------------------- |
| CLI (`packages/cli/src`)                                    |                                                                 70% | `pnpm test:coverage:integration`      |
| Core (`packages/core/src`)                                  |                                                                 70% | `pnpm test:coverage:integration`      |
| Schemas (`packages/schemas/src` + `docs/schemas`)           | 80% validator/source line coverage and 100% schema compile coverage | `pnpm test` + `pnpm test:integration` |
| Sensors (`packages/sensors/src` and CLI `sense-*` adapters) |                                                                 70% | `pnpm test:coverage:integration`      |

The MVP floor is intentionally below the long-term PASS target of 80% lines because Phase 37/38 established that DEVAI's unit-only coverage is a measurement artifact; subprocess integration coverage is the canonical local measurement. Falling below these floors is an Inspector blocker for release-readiness. Full-production readiness additionally requires the real DB and real LLM integration lanes to run green against natural credentials. Hermetic runs may set `DEVAI_DB_TESTS=0`, `DEVAI_LLM_TESTS=0`, or `DEVAI_LLM_BACKEND=mock`, but those runs are wiring evidence only and do not satisfy the full-production bar.

## How `score compute` consumes it

`devai govern score compute` reads `.devai/config/thresholds.json` to drive cell verdicts:

- For each (F, T) cell whose `measurable_via` includes a coverage-bearing sensor, the cell's verdict pulls the relevant `coverage.*` value as the PASS line. Below it → REVIEW; well below → FAIL.
- For mutation cells, `mutation.score_min` is the PASS line; `mutation.survived_max` is the absolute ceiling regardless of percentage.
- For lint/typecheck cells, `max_errors=0` is the canonical hard gate; any non-zero count flips the cell to FAIL.
- The `freshness` block governs UNKNOWN — a sensor reading older than its budget flips the cell to UNKNOWN regardless of value.

See [tool-surface.md](../theory/architecture/tool-surface.md) for the score-compute resolution chain and [`scorecard.schema.json`](../../law/schemas/scorecard.schema.json) for the verdict envelope.

## Why a single schema, per-repo values

The original STYNX form lived only in `stynx/.devai/config/thresholds.json` and was implicit. Surveys for the R1 round found three adopters with their own coverage gate numbers buried in CI scripts and one adopter with no numbers at all. Promoting the schema (not the values) is the minimum intervention that lets the scorecard be consistent across the portfolio without forcing a one-size-fits-all assurance bar.

## Compatibility notes

- **STYNX-era 0..1 fractions** are still numerically valid against the schema (any number 0..100 passes the validator). DEVAI's canonical scale is 0..100; consumers normalize on read with `v <= 1 ? v * 100 : v`. STYNX's existing `stynx/.devai/config/thresholds.json` validates as-is.
- **No additional top-level keys** are permitted (`additionalProperties: false`). New sections require a contract revision.
- **Adding a field inside an existing section** is non-breaking; consumers ignore unknown nested keys.

## Cross-references

- Schema: [`../docs/reference/contracts/thresholds.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/thresholds.schema.json)
- DEVAI's own baseline: `.devai/config/thresholds.json` at the repo root
- Scorecard semantics: [`../law/schemas/scorecard.schema.json`](../../law/schemas/scorecard.schema.json), `score compute` in [`../docs/theory/architecture/tool-surface.md`](../theory/architecture/tool-surface.md)

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/thresholds.md (classification CURRENT).
