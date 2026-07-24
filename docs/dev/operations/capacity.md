# Capacity

**Scope:** quantitative limits on DEVAI's substrates. Useful for sizing CI runners, DB pools, and LLM budgets. Soft per D-39: tune as load-test data accumulates.

## Concurrent worktrees

| Limit | Value | Source |
|---|---|---|
| Max active non-adopted worktrees | Runtime policy (`WORKTREE_CAP`) | [`packages/core/src/loop/worktrees.ts`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/packages/core/src/loop/worktrees.ts), D-52 |
| Effect of breach | `worktree create` refuses | Phase 5 lock subsystem |
| Harness-owned exceptions | Persistent inventory, human-adopted review, and dedicated evaluator worktrees are accounted separately | Article 27 / D-52 policy |

The numeric cap is deliberately not repeated here. Query `WORKTREE_CAP` from
the runtime source (or exercise `worktree create`) so this operational page
cannot become a second numeric authority. A cap change requires an Architect
decision and synchronized runtime/tests/docs evidence.

## Locks

| Limit | Value |
|---|---|
| Default TTL | 900 s (15 min) |
| Max TTL | 3600 s (1 hr) — Article 25 |
| File-lock backend ceiling | ~hundreds of held locks before directory enumeration slows |
| Postgres backend ceiling | bounded by DB `max_connections` |

## Database

| Limit | Value |
|---|---|
| Shared dev cluster connection pool (default Docker setup) | 100 (Postgres default `max_connections`) |
| Per-task DB | provisioned via `devai work db provision`; uses ~1 connection at peak |
| Template-DB rebuild interval | manual (`devai work db rebuild template`) — typically per migration set |

Per-task databases (Phase 5) live as `devai_task_<task-id>` on the shared cluster. Provision/drop is atomic with task spawn/complete when `--with-db` is passed.

## LLM substrate (Phase 9.B)

| Limit | Value |
|---|---|
| Default cost budget per env | `DEVAI_LLM_BUDGET_USD` (unset = unbounded for SDK providers; host CLI bridges may enforce their own budget flags) |
| Rate limit | 30 requests/min (configurable in `.devai/config/llm-limits.json`) |
| Per-iteration token cap | model-dependent; defaults from `LlmClient` implementations |
| Cost telemetry | `record/proofs/llm-usage.jsonl` — append-only, rotates monthly |

Hermetic CI pins the mock backend for deterministic wiring. Real-provider evidence is explicit opt-in, applies only to the named gated surfaces, and never consumes ambient credentials during the binding repository gate (D-55, D-192).

## Evidence chain

| Property | Value |
|---|---|
| Record size | ~500 bytes typical (UUIDv7 id + hash chain + payload) |
| Growth rate | Determined by explicit recording actions; read-only observations do not append automatically |
| Practical ceiling | unlimited; `evidence verify` is O(n) so 100k+ records slow audit by seconds |
| Rotation | none built-in; long-running deployments may want a sidecar that archives + truncates with a recovery event (see [`evidence-chain-runbook.md`](./evidence-chain-runbook.md)) |

## RTD manifest (Phase 12.A)

| Property | Value |
|---|---|
| Bundled artifacts | invariants + trace + journeys + glossary + tombstones + ADRs + forbidden-actions |
| Manifest size | scales with the sum of bundled artifact sizes; query the generated manifest for current bytes |
| Build time | < 5 s for canonical DEVAI |
| Persistence | `record/proofs/rtd-manifests/RTM-NNNN.json` |
| Reasonable retention | last 100 manifests; reap older with a sidecar |

## Schemas

| Property | Value (current) |
|---|---|
| Schema count | Query `find law/schemas -name '*.schema.json'`; do not freeze a prose count |
| Validator initialization time | Environment-dependent; measure against the current schema registry |
| Per-validation cost | O(record size); microseconds for typical records |

Schema additions remain Architect-governed contract changes and must regenerate
validators byte-identically.

## Sensor readings

| Property | Value |
|---|---|
| Observation volume | Determined by the selected action set; query the action/evidence outputs |
| Durable storage | `record/proofs/sensor-readings/<kind>/<id>.json`, only through an explicit recording path |
| Evidence chain | Recording may append the matching governed chain entry; pure sensing does not |
| Retention | Canonical evidence is not pruned; disposable ignored outputs follow the state-retention policy |

## Tasks + RGRs

| Property | Value |
|---|---|
| Active tasks ceiling | bounded by current F5 worktree policy for `in_progress`/`checkpoint`/`pre_merge` states |
| Queued tasks | unlimited (backlog) |
| Open RGRs | unlimited but if > 10, see [`incident-playbook.md`](./incident-playbook.md) §"RGR pile-up" |

## CI runner sizing

For the GitHub Actions matrix CI uses today:

| Resource | Target |
|---|---|
| CPU | 2 cores OK; 4 cores comfortable |
| RAM | 4 GB OK; 8 GB comfortable |
| Disk | 5 GB free (node_modules + worktrees + Postgres docker) |
| Network | Postgres image pull, npm registry; no external API calls in default CI config |

## See also

- [`slos.md`](./slos.md) — what counts as green at these capacity levels.
- [`loop-runbook.md`](./loop-runbook.md) — cost discipline.
- D-11 (worktree cap), Article 30 (Cost discipline).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/capacity.md (classification CURRENT).
