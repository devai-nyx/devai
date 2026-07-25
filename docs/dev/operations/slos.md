# DEVAI's own development SLOs

**Scope:** what "green" means for DEVAI as a plant. These are SLOs for developing **DEVAI itself** (Article 36 dogfooding). Client projects authored on DEVAI define their own SLOs in their own `docs/dev/operations/slos.md`.

## CI deadlines

| Stage                                  | Target   | Hard cap | Historical observation (2026-05-13) |
| -------------------------------------- | -------- | -------- | ----------------------------------- |
| Lint                                   | < 30 s   | 2 min    | ~5 s                                |
| Typecheck (`tsc -b`)                   | < 60 s   | 5 min    | ~30 s                               |
| Unit tests                             | < 60 s   | 5 min    | ~3 s (157 tests)                    |
| Integration tests                      | < 5 min  | 30 min   | ~3 min (164 tests)                  |
| Regression tests                       | < 60 s   | 10 min   | ~2 s (4 tests)                      |
| `devai spec validate all` against self | < 30 s   | 5 min    | ~10 s                               |
| `devai inventory regen` against self   | < 60 s   | 5 min    | ~15 s                               |
| Full CI workflow                       | < 10 min | 30 min   | ~7 min                              |

The full workflow must finish in under 10 minutes on the default GitHub Actions runner. If it grows past 10 minutes, the gate decision flips to `review` (not `block`) and the next PR carries a "CI duration regression" finding.

## Gate decisions

Per Phase 11.B `release gate`, the gate decision derives from:

1. **Scorecard verdict** from `devai govern score compute`. Must be `green` to pass.
2. **Invariant catalog presence**. Must be non-empty (canonical DEVAI has 10 INV-DEVAI-* + the law-pack reference).
3. **Sensor readings freshness**. At least one reading per sensor in the last hour.

Any single block-class check → gate = `block`. Any review-class check (and no blocks) → gate = `review`. All pass → `pass`.

## Hard-fail invariants

These invariants block at the schema level — no override:

- All invariants with `severity: constitutional` (currently just `INV-DEVAI-001`).
- All invariants with `severity: hard-fail` (currently `INV-DEVAI-002..010` plus the law-pack's 15).

Soft-fail (`gate`, `warn`, `advisory`) invariants surface as findings but do not block merge. Per Phase 10.A severity ladder + `GE-026`.

## What "green" means per substrate

| Substrate               | Green criterion                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------- |
| F1 (Architecture specs) | `spec validate-all` clean; trace covers every active invariant.                         |
| F2 (Code)               | `tsc -b` clean; `eslint` clean; `build` clean.                                          |
| F3 (Tests)              | All suites pass; no `test-weakening` findings; coverage ≥ configured threshold.         |
| F4 (Inventory)          | `inv regen` byte-identical across two runs; `inv adherence-reverse` reports no orphans. |
| F5 (Harness)            | `evidence verify` clean; `lock list` shows no stale; `worktree list` ≤ cap.             |

## Transversal-property thresholds

Per the 5×9 scorecard grid (D-2), each substrate × property cell scores green/yellow/red. The thresholds DEVAI applies to **itself** are conservative; clients should tune for their own risk tolerance.

| Property              | Green threshold (DEVAI self-application)                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| T1 Correctness        | All hard-fail invariants pass.                                                                  |
| T2 Performance        | CI < 10 min; loop iteration < 5 min wall-clock at default tier.                                 |
| T3 Lifecycle          | All schemas have `schemaVersion`; all invariants have `version` (10.E).                         |
| T4 Concurrency        | `worktree list` ≤ 3 non-adopted worktrees; no stale locks > TTL.                                |
| T5 Adherence          | `inv adherence-reverse` reports 0 orphans (with current `code_areas` coverage).                 |
| T6 Security & Privacy | `check forbidden-actions` clean; `check prompt-overlays` clean; no `inv-override` past expiry.  |
| T7 Observability      | Every `skill run` emits a SensorReading and an agent-run; evidence chain verifies.              |
| T8 Verifiability      | `evidence verify` clean; `rtd bundle --strict` produces a non-empty manifest.                   |
| T9 Maintainability    | No deprecated invariants without a tombstone; no deprecated glossary entries without `aliases`. |

## Yellow vs. red

- **Red**: the criterion fails outright. Blocks merge.
- **Yellow**: the criterion is at risk (within 80% of threshold, or trending in the wrong direction). Surfaces in `score assess` recommendations; the loop should pick this up before it goes red.

## Re-tuning

These SLOs are soft (D-39 risk register). Re-tune when:

- CI substrate (GitHub Actions, runner type) changes.
- A new sensor kind ships and changes the per-PR test surface.
- A phase introduces a new substrate slice.

Re-tuning is a docs-only change — bump the numbers in this file and commit. No invariant change required unless the SLO is constitutional (it isn't).

## See also

- [`capacity.md`](./capacity.md) — quantitative limits.
- [`incident-playbook.md`](./incident-playbook.md) — what to do when an SLO is missed.
- `GE-014` (Scorecard), `GE-015` (Assessment), `GE-026` (Severity ladder).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/slos.md (classification CURRENT).
