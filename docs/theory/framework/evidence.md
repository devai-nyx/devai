---
title: Evidence
sidebar_position: 8
---

# Evidence

> Every sensor reading, scorecard cell, agent run, decision, and merge produces an evidence record. Records are written to a hash-chained append-only log at `record/proofs/chain.json`. [Article 38](../../reference/law.md) (JSON canon) binds the format; the chain is the framework's audit substrate.

## The evidence chain

Each event becomes one record. A record carries:

- `prev_hash` — the hash of the immediately prior record.
- `event_type` — one of `sensor-reading`, `scorecard-cell`, `agent-run`, `decision`, `merge`, `escalation`, `rgr-emission`, `rgr-resolution`.
- `payload` — type-specific JSON; for sensor readings, the full `SensorReading` shape (Article 32); for scorecard cells, the verdict + threshold + measurement.
- `timestamp` — UTC ISO 8601.
- `actor` — discipline + agent ID + role.
- `hash` — the record's own hash, computed over canonical JSON serialisation.

The chain's hash linkage means any retroactive modification surfaces immediately at the modified record's next downstream record. Tampering is detectable; the rolling head hash is the chain's published-state anchor.

## What gets evidenced

| Event type       | Source                                                | Triggered by                            |
| ---------------- | ----------------------------------------------------- | --------------------------------------- |
| `sensor-reading` | Any `sense-*` invocation                              | Per Cycle A / B / C run                 |
| `scorecard-cell` | `score-compute` per cell                              | Cycle C; on-demand by Auditor or human  |
| `agent-run`      | Any controller invocation                             | Task spawn → task close                 |
| `decision`       | `triage classify`, `triage tie-break`, RGR resolution | Per classification / break / resolution |
| `merge`          | Integration-branch merge                              | Per task merge                          |
| `escalation`     | Iteration cap exhaustion                              | Per Article 21 escalation               |
| `rgr-emission`   | RGR emission                                          | Per emitting task                       |
| `rgr-resolution` | Spec update merged that closes an RGR                 | Per resolved RGR                        |

The list is **closed** — adding a new event type requires a contract change. The closed list is what makes the chain queryable by sensors, auditors, and clients without per-payload-type special-casing.

## Verification

`devai evidence chain verify` walks the chain from genesis to head, recomputing each record's hash and the chain linkage. The verb returns the head hash on success and the first divergence point on failure.

`devai evidence chain head` prints the current head hash. The head hash is the published-state anchor — adopters who want to assert "the framework at SHA X had evidence head Y" record this pairing in their release manifests.

## Redaction

`devai evidence redact` is the **only** authorised mutation operation on the chain. Redaction removes a specific record's payload (replacing with `{"redacted": true, "reason": "<text>", "actor": "<who>"}`), bumps the record's hash, and re-walks downstream records to re-link. The chain stays continuous; the audit trail of _what was redacted, by whom, with what rationale_ is itself an evidence record.

Redaction targets are: PII that was accidentally captured in a sensor reading; credential leaks in agent run logs; legal compliance requirements. Redaction is **never** used to "fix" framework defects; defects are corrected via normal Engineer / Inspector flow with the original evidence preserved.

## Storage

The chain lives at `record/proofs/chain.json` as a JSON array. For large chains, rotation is supported per pack config — rotated segments are themselves hash-linked to the live chain. Adopters should not write to `record/proofs/` directly; all writes go through the `devai evidence` CLI verbs.

## Sensor adapter uniformity (Article 32)

Every executable sensor emits its output through a normalised `SensorReading` schema:

- `status` (one of `pass`, `review`, `fail`, `unknown`).
- `evidence_path` (where the raw output lives).
- `timestamp`.
- `command` (the verb invoked).
- `command_hash` (hash of the invoked command + args + relevant env).
- `failure_mode` (when status ≠ pass).
- `findings` (optional structured array; sensor-specific).

Scorecard composition is polymorphic over sensor types via this contract — the framework treats every sensor's output identically at the scorecard layer.

## See also

- [Constitution Articles 32, 38](../../reference/law.md) — sensor adapter uniformity, JSON canon.
- [Persistence design note](../architecture/persistence.md) — operational detail on chain storage + rotation.
- [Security](../../dev/security) — threat model, audit requirements, secret-handling.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/evidence.md (classification CURRENT).
