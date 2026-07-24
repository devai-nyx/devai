# Audit requirements

**Scope:** the evidence chain (`record/proofs/chain.json`) and the agent-run hash chain (`record/proofs/agent-runs/`). Per Articles 32 (Evidence) and 33 (Provenance).

## What gets audited

Every **governed action** emits an evidence record. "Governed" = goes through a harness verb that is registered in the action catalog. The set:

- Every `devai sense …` invocation → emits a `SensorReading` + an `evidence.sensor_reading` event referencing it.
- Every `devai agent skill run` → emits a `SkillResult` + an `agent-run` record + an `evidence.skill_run` event.
- Every `devai experimental loop run` iteration → emits an `agent-run` per iteration.
- Every `devai evidence redact` → emits an `evidence.redact` event (the redaction itself is audited).
- Every `devai release gate / postdeploy-verify / runtime-drift` → emits a `release-control` record + an `evidence.release` event.
- Every `devai govern rgr emit / resolve` → emits an `evidence.rgr_*` event referencing the RGR id.
- Every `devai work task spawn / complete / escalate` → emits the corresponding task-lifecycle event.

Things that do **not** get audited automatically:

- File reads (would be too noisy and rarely actionable).
- `devai catalog actions`, `inv glossary`, `doctor`, `spec validate-*` and other read-only inspectors. The harness assumes inspection is benign.
- Out-of-band edits (raw `git`, manual file writes). The chain detects tampering after the fact via `verify`, but cannot prevent it.

## Hash chain structure

Each record has:

```json
{
  "id": "EV-<uuid-v7>",
  "kind": "<event.kind>",
  "actor": "<email-or-skill-id>",
  "timestamp": "<ISO-8601>",
  "payload": { … kind-specific },
  "prev_hash": "<sha256 of prior record>",
  "manifest_hash": "<sha256 of this record without manifest_hash>"
}
```

The first record (genesis) has `prev_hash: 'GENESIS'`. Subsequent records' `prev_hash` MUST equal the prior record's `manifest_hash`. This makes the chain:

- **Append-only**: inserting in the middle breaks every subsequent record's `prev_hash`.
- **Tamper-evident**: editing any field of any record invalidates its `manifest_hash`, breaking the chain forward.
- **Order-preserving**: chain order is the order of insertion.

## Verification

```bash
devai evidence chain verify
```

Walks the chain start to end, recomputing each record's `manifest_hash` (against its canonical form) and comparing `prev_hash` to the prior record. First mismatch is the corruption point.

This MUST be wired into CI. The canonical workflow runs it as part of `devai doctor`.

## Agent-run subset (Phase 10.I)

Agent-run records are a specialized evidence subset capturing what an LLM-backed action read, wrote, and ran. Stored separately under `record/proofs/agent-runs/AR-<UUIDv7>.json` with their own hash chain:

```json
{
  "id": "AR-<uuid-v7>",
  "schemaVersion": "1.0.0",
  "actor": "skill@SKILL-feedback-iteration",
  "files_read": [...],
  "files_written": [...],
  "commands_run": [...],
  "llm_cost_usd": 0.014,
  "prompt_composition_id": "PC-<sha16>",
  "prev_hash": "<sha256 prior agent-run>",
  "manifest_hash": "<sha256>"
}
```

Why a separate chain: agent-runs are dense (every iteration) and would otherwise drown signal in the primary evidence chain. The primary chain references agent-runs by id, so traversal is fast.

## Retention

| Stream | Retention | Notes |
|---|---|---|
| `evidence-chain.json` | All history; no built-in rotation | Grows ~bytes per action; budget < 10 MB / year for typical workloads |
| `agent-runs/` | All history; reap dead runs per [`capacity.md`](../operations/capacity.md) | Each run is a separate file; deletion = lost provenance, emit `evidence.recovery` |
| `sensor-readings/` | Last 1000 by default; older reaped on a sidecar | Per-reading provenance preserved in the primary chain via reference |
| `loop-runs/` | Last 30 days by default | Each iteration links its agent-run by id |

## Tamper-detection edge cases

| Scenario | Detection |
|---|---|
| Single-byte edit in any record | `manifest_hash` mismatch on `verify`. |
| Record deletion | `prev_hash` mismatch in the next record. |
| Record insertion | `manifest_hash` of the inserted record probably won't match (collision negligible); even if it did, the subsequent records' `prev_hash` would not match the inserted record's `manifest_hash`. |
| Wholesale chain replacement with a forged chain | `evidence verify` would pass against the forged chain. The defense is **off-chain attestation**: hashes published to a tamper-resistant external store (CI artifact log, GitHub commit, etc.). DEVAI does not currently do this; it's a residual risk. |

## Article 32: provenance preservation

Per Article 32, the chain is **provenance-critical**. Operations that touch it must preserve history:

- `init apply-f5 --force --as-role architect --write` re-seeds the F5 bootstrap **without overwriting** the existing chain.
- `evidence redact` updates a single record + re-links downstream; never deletes records.
- `evidence recovery` events are emitted whenever a recovery action is taken (truncation, restore from backup).

A wholesale `rm record/proofs/chain.json` is **never** a correct recovery action. The corrupt or unreadable file is itself forensic evidence per Article 32.

## CI requirements

The minimum audit requirements every CI run must satisfy:

1. `devai evidence chain verify` — exits 0.
2. `devai doctor` — all checks pass (includes the above).
3. The CI artifact upload includes the full `record/proofs/chain.json` so post-hoc audit can run against any past run.

## Residual risks

1. **Wholesale forgery without off-chain attestation.** Mitigation: publish chain heads externally; see Phase 11.B `release postdeploy-verify`.
2. **Audit chain not surfacing read-only inspection.** Intentional; inspecting is benign. If your threat model requires read-audit, add a sidecar that logs reads at the filesystem layer.
3. **Cost of `verify` at scale.** Linear in chain length; for >100k records, CI verification slows. Mitigation: archive old segments with a recovery event documenting the archival.

## See also

- [`../ops/evidence-chain-runbook.md`](../operations/evidence-chain-runbook.md) — operational procedures.
- Constitution Articles 32, 33, 34, 36.
- `GE-021` (Evidence chain), `GE-025` (Agent-run).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/audit-requirements.md (classification CURRENT).
