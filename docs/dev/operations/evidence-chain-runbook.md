# Evidence chain runbook

**Scope:** verifying, inspecting, and recovering the hash-chained evidence log at `record/proofs/chain.json`. Per Articles 32–33 and `GE-021` (Evidence chain).

The evidence chain is the immutable audit trail. Every governed action emits a record with `prev_hash` + `manifest_hash`, making tampering detectable. Treat this file as append-only operationally; the only writes are by the framework (`evidence emit`, `init apply-f5 --force` provenance preservation, `evidence redact`).

## Routine verification

Run on every PR:

```bash
devai evidence chain verify
```

Exit codes: `0` = chain valid; non-zero = either a record's `prev_hash` does not match the prior record's `manifest_hash`, or a `manifest_hash` does not match the canonicalized record. In CI this is wired into the `doctor` composite check.

## Inspecting the chain head

```bash
devai evidence chain head            # prints the sha-256 of the last record
devai evidence chain head --chain path/to/evidence-chain.json    # explicit path
```

Use this when comparing a deployed runtime's claimed audit head against the repo's head (Phase 11.B `release postdeploy-verify` does this automatically).

## Emitting a new record

`devai evidence emit` is the canonical entry point. Most agentic flows emit through skill / sensor wrappers; raw emit is for operators recording out-of-band events:

```bash
devai evidence emit \
  --kind manual.intervention \
  --actor 'operator@example.com' \
  --note 'Manually rolled back deploy 2026-05-13' \
  --refs PR-1234,REL-0042
```

The kind string is free-form; common kinds: `skill.run`, `sense.reading`, `manual.intervention`, `evidence.redact`.

## Redacting a record

`evidence redact` is used to scrub sensitive content (leaked secrets, PII) **without breaking the chain**. The redacted record's `manifest_hash` is recomputed; downstream records are re-linked.

```bash
# Redact a single field on a single record:
devai evidence redact --target EV-abc12345 --field actor

# Redact a regex pattern across notes:
devai evidence redact --target EV-abc12345 --pattern 'tok_[A-Za-z0-9]+'
```

After redaction, the chain is still cryptographically continuous, but the redacted content is gone. The redaction itself emits an `evidence.redact` event recording who redacted what (without surfacing the redacted content).

**Important:** `evidence redact` rejects requests that would make a record schema-invalid. If you must remove a required field, replace it with a placeholder string instead.

## Recovery from a corrupt chain

Symptoms: `devai evidence chain verify` reports a hash mismatch, or `JSON.parse` fails on `record/proofs/chain.json`.

**Step 1 — identify the corruption point:**

```bash
devai evidence chain verify --format human 2>&1 | head
```

The first failing record is the corruption point. Records before it are intact; records after it inherit the broken chain.

**Step 2 — preserve forensic evidence:**

```bash
cp record/proofs/chain.json record/proofs/chain.json.corrupt-$(date +%Y%m%d-%H%M%S)
```

Do **not** delete the corrupt file. Article 32 protects provenance; the corrupt file is a piece of forensic evidence in itself.

**Step 3 — rebuild the F5 bootstrap segment:**

```bash
devai init apply-f5 --target . --force \
  --as-role architect --write
```

`init apply-f5 --force` re-seeds the F5 bootstrap state **while preserving the existing chain** (Article 32 — Provenance). Then run `devai evidence chain verify` again. If it passes, the corruption was confined to the bootstrap state.

**Step 4 — if the F5 re-seed does not resolve:**

The records past the corruption point cannot be deterministically re-linked. Manual options:

- **Truncate** the chain at the corruption point: edit the JSON to keep only the prefix that verifies. Records past the cut are lost (but the `.corrupt-*` backup preserves them). Emit a manual `evidence.recovery` event noting the truncation.
- **Restore from a known-good backup** (CI artifact, git LFS, or a manual snapshot taken before the corruption).

In either case, the recovery itself emits an `evidence.recovery` event so the audit trail records what happened.

## Failure modes

| Symptom | Cause | Action |
|---|---|---|
| `verify` exits non-zero on first record | Genesis record has wrong `prev_hash` (should be `'GENESIS'`) | Re-seed via `init apply-f5 --force --as-role architect --write`; check that no agent edited the chain by hand. |
| `verify` exits non-zero on a recent record | A skill or sensor wrote the chain non-atomically (process crash mid-write) | Truncate to the last-verifying record + emit `evidence.recovery`. |
| `evidence emit` rejects with `EXIT_FAIL` | Schema violation (the record doesn't match `evidence.schema.json`) | Check the `--kind`, `--actor`, `--refs` flags; non-empty required. |
| File missing entirely | `record/proofs/` was cleaned without provenance preservation | Re-seed via `init apply-f5 --as-role architect --write`. **Provenance is lost** — note this in the recovery event. |

## See also

- [`incident-playbook.md`](./incident-playbook.md) — broader gate-failure diagnostics.
- [`local-evidence-runbook.md`](./local-evidence-runbook.md) — the local-CI-evidence mechanism that feeds this chain on a trusted verification (D-117).
- Constitution Article 32 (Evidence chain), Article 33 (Provenance).
- `GE-021` (Evidence chain), `GE-025` (Agent-run).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/evidence-chain-runbook.md (classification CURRENT).
