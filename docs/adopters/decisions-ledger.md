# Decisions ledger — `record/proofs/decisions.jsonl`

**Authority:** Architect (cross-repo). Issued R3-W6 (2026-05-23).
**Schema:** [`../docs/reference/contracts/decisions.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/decisions.schema.json) — one record per ledger line.
**Location:** `record/proofs/decisions.jsonl` (append-only JSONL).
**Origin:** generalizes SGP's `devai.config.json.deferredOwnerDecisions` array (which was just a list of prompt file paths) into a structured ledger usable by every adopter.

## Purpose

Every project accumulates **decisions that are real but not actioned**: items deferred to a later round, alternatives considered and rejected, blockers escalated for human input, supersession chains. Today these live in commit messages, `plan.md` prose, and audit observations — findable, but not queryable, not aggregatable, not auditable.

The decisions ledger gives every adopter one place to record those calls in a structured form. Each round's `Closeout.md` can lift "deferred" + "blockers" entries into the ledger; future rounds can query for open defers expiring soon, supersession chains, decisions by a given owner.

## Why JSONL (not JSON, not a directory)

- **Append-only:** add a record by appending a line. No re-write of prior records.
- **Concurrency-friendly:** multiple parallel waves can append without locking the entire file (writers acquire a small advisory lock per append).
- **jq-queryable** out of the box.
- **Diff-friendly** in git: each line is one decision; reviews are clean.

The single-file ledger trades a bit of read-time work (must scan for supersession chains) for low write-time complexity. The trade is the right one until ledgers grow past ~10k records, at which point indexing becomes worth it (out of scope for now).

## The five kinds

| `kind`      | When to use                                                                                                                                                                                      | Status starts as                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `defer`     | Item considered and deliberately postponed. The decision is "not now"; the item stays open until either shipped (→ resolved) or formally killed (→ supersede with a new `reject`).               | `open`                                                               |
| `accept`    | A proposal approved and acted on (or about to be). Record the WHY for the forensic trail.                                                                                                        | `resolved`                                                           |
| `reject`    | A proposal considered and declined. Future readers benefit from knowing the rejection rationale, not just its absence.                                                                           | `resolved`                                                           |
| `escalate`  | Decision pushed up to a higher authority role (typically: blocker requiring human input). The original decision is now blocked-pending-human; resolution arrives via a new `accept` or `reject`. | `open`                                                               |
| `supersede` | A new record overturns an earlier one. The new record carries `kind=supersede` + the body of the new decision; the old record is updated to `status=superseded` with `superseded_by` set.        | `resolved` (the new record); the superseded record's `status` flips. |

## Lifecycle

```
              ┌─→ resolved
   open ──────┤
              ├─→ superseded (rare; mid-life overturning)
              └─→ (stays open until acted on)
```

- `defer` and `escalate` records start `open`.
- `accept`, `reject`, `supersede` records start `resolved`.
- Status flips never go backward — a `resolved` record can become `superseded` (when a new decision overturns it), but never returns to `open`.

## Worked examples

### `defer` — postpone a substrate change

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0001",
  "created_at": "2026-05-23T15:00:00Z",
  "kind": "defer",
  "subject": "Defer SKILL-fix-* iteration loop",
  "description": "Catalog-fill in R3-W3 shipped read-only diagnose for the 10 new SKILL-fix-<gate-id> skills. The R2-Δ1 spec asks for iteration loop + fix-log + blocker emission + devai-record-run integration. Defer to a successor round (R5+); 13 existing fix-skills work as diagnose-only for now.",
  "owner": "agent:architect",
  "status": "open",
  "context": { "round_id": "R3-W3", "commit_sha": "<pending>" },
  "decision": "Re-evaluate when round-loop substrate runs require multi-iteration recovery; until then, gate failures escalate as blockers per the canon.",
  "references": ["commit:abc1234", "docs/adopters/round-break.md"]
}
```

### `accept` — formalize a convention

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0002",
  "created_at": "2026-05-23T13:00:00Z",
  "kind": "accept",
  "subject": "Adopt the round-break canon",
  "description": "ROUND > WAVE > PHASE > STEP hierarchy with prompts/, log per wave, mandatory Closeout.md. Authored R3-W1.",
  "owner": "aarusso",
  "status": "resolved",
  "resolved_at": "2026-05-23T13:00:00Z",
  "context": { "round_id": "R3-W1" },
  "references": ["docs/adopters/round-break.md", "docs/adopters/CONVENTIONS.md"]
}
```

### `reject` — record a path not taken

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0003",
  "created_at": "2026-05-22T10:00:00Z",
  "kind": "reject",
  "subject": "@detran/ layer",
  "description": "Considered a shared @detran/* layer for DETRAN-specific concerns across PEC + TEAT. Rejected: shared adapter PATTERNS extract into STYNX (retry, timeout, idempotency, circuit-breaker); domain-specific state-system integrations don't have enough schema overlap to warrant a layer. Revisit if a third DETRAN app appears.",
  "owner": "aarusso",
  "status": "resolved",
  "resolved_at": "2026-05-22T10:00:00Z",
  "context": { "file_path": "align/cross-repo-promotion-assessment.md" },
  "references": ["align/cross-repo-promotion-assessment.md"]
}
```

### `escalate` — push to human

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0004",
  "created_at": "2026-05-23T19:30:00Z",
  "kind": "escalate",
  "subject": "PEC's adopter-private record/proofs/ paths",
  "description": "PEC ships coverage/, obligations.json, rtd/ under record/proofs/ — non-canonical paths. R3-W4 state-extensions canon documents them as adopter-private (not promoted to canon). If they generalize to other adopters in a future round, promotion requires an Architect ADR. No action needed unless and until a second adopter ships the same paths.",
  "owner": "agent:architect",
  "status": "open",
  "context": { "round_id": "R3-W4" },
  "decision": "Re-evaluate at next cross-repo audit (probably PORM greenfield phase). Human input needed only if PORM independently adopts one of these paths.",
  "references": ["docs/reference/contracts/state-extensions.md"]
}
```

### `supersede` — overturn an earlier decision

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0005",
  "created_at": "2026-05-23T16:00:00Z",
  "kind": "supersede",
  "subject": "Merge R4/R5/R6 into R3",
  "description": "Earlier plan (Plan-of-record at R3-W0): keep R4 (state-extensions), R5 (BUILD-PLAN convention), R6 (decisions-ledger) as separate sequential rounds. Superseded by Option 1 (merge all three into R3 as W4/W5/W6). Rationale: bundled adopter-governance ship; W4 risk acceptable.",
  "owner": "aarusso",
  "status": "resolved",
  "resolved_at": "2026-05-23T16:00:00Z",
  "superseded_by": "",
  "context": { "round_id": "R3" },
  "references": ["DEC-0001-original-separate-rounds-plan"]
}
```

(In the corresponding superseded record `DEC-XXXX`, `status` flips to `superseded` and `superseded_by` is set to `DEC-0005`.)

## Querying — jq recipes

### Open defers

```bash
jq -c 'select(.kind=="defer" and .status=="open")' record/proofs/decisions.jsonl
```

### Defers expiring soon (next 7 days)

```bash
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LATER=$(date -u -v+7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)
jq -c --arg now "$NOW" --arg later "$LATER" \
  'select(.kind=="defer" and .status=="open" and (.expires_at? // "9999") <= $later and (.expires_at? // "0000") >= $now)' \
  record/proofs/decisions.jsonl
```

### Decisions by a given owner

```bash
jq -c --arg owner "aarusso" 'select(.owner==$owner)' record/proofs/decisions.jsonl
```

### Supersession chain (forward from a given DEC-id)

```bash
jq -r '. as $r | select(.id=="DEC-0001") | .superseded_by // empty' record/proofs/decisions.jsonl
# then re-query with the returned id, repeat until empty
```

### Counts by kind + status

```bash
jq -r '[.kind, .status] | @tsv' record/proofs/decisions.jsonl | sort | uniq -c
```

## Integration with round artifacts

- **`SKILL-round-verify-publish`** at round close SHOULD append each `Closeout.md` blocker as an `escalate` record. Each deferred backlog item becomes a `defer` record. (Wired in a successor round — automatic integration is R5+ work.)
- **Round audit** at round open SHOULD scan for open `defer` records whose `expires_at` is past; surface them in `diag/` or `Closeout.md`.
- **Cross-references** in any DEC record SHOULD cite round/wave identifiers (`context.round_id`).

## Append discipline

- One record per line; valid JSON per line.
- No mid-file edits. To close, supersede, or invalidate a record, append a
  separate `kind: resolution` record (see "Closing records" below). The
  original record's bytes are never rewritten.
- File grows monotonically; rotation is out of scope until ledgers cross ~10k records.

## Closing records (D-A-42, R10)

Use [`devai spec decision close`](../reference/cli.md) to append a resolution record:

```bash
devai spec decision close DEC-0001 \
  --disposition closed \
  --evidence commit:abc1234 \
  --note "shipped in R5-W4"
```

Batch close every open DEC from a given round (per the round_id prefix):

```bash
devai spec decision close --from-round R3 \
  --disposition closed \
  --evidence commit:abc1234
```

The CLI appends a record matching `#/$defs/resolutionRecord` in the schema:

```json
{
  "schemaVersion": "1.0.0",
  "id": "DEC-0001-resolution",
  "kind": "resolution",
  "resolves_dec_id": "DEC-0001",
  "resolved_at": "2026-05-24T18:00:00Z",
  "resolved_by": "human:cli",
  "disposition": "closed",
  "evidence_ref": "commit:abc1234",
  "note": "shipped in R5-W4"
}
```

### Dispositions

| `disposition` | When to use                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed`      | The original decision is satisfied — work done, condition met, gate now green.                                                                          |
| `superseded`  | A later decision overturns this one. Often paired with a new `accept`/`reject` DEC record (cite via `superseded_by` in the new DEC or via `note` here). |
| `invalidated` | Retroactively determined to have been written in error (false positive). Common when a substrate bug wrote spurious escalations.                        |

### Closing false-positive records

Some early-adopter records were written by substrate bugs (e.g. pre-R10
`docs-links` gates against repos with no mapping — ADR-ROUND-EXECUTE-SEMANTICS
Decision 4). The correct disposition for these is `invalidated`, with an
`--evidence` pointer to the fix or ADR:

```bash
devai spec decision close DEC-0004 \
  --disposition invalidated \
  --evidence "law/adr/ADR-ROUND-EXECUTE-SEMANTICS.md" \
  --note "Pre-R10 false positive: unmapped docs-links gate."
```

### Automatic supersession

`SKILL-round-verify-publish` auto-appends a `disposition: superseded`
resolution when a gate that previously failed (writing an `escalate` DEC in
an earlier round) now passes at close time. No operator action is required;
the supersession `resolved_by` cites the current run-id.

### Legacy status flips

Records authored before D-A-42 may have `status: closed` or `status: resolved`
written via in-place edit. These remain valid (the schema enum accepts both),
but new closures always go through the resolution-record mechanism above.

## Relationship to `ESC-NNNN` task escalations

`decisions.jsonl`'s `escalate` kind and `escalation.schema.json`'s `ESC-NNNN` records are **both canonical, and deliberately different in scope** — not competing conventions, and not one superseding the other (D-123). A portfolio audit initially misread a repo with `counters.json`'s `ESC` key at `0` alongside several `decisions.jsonl` records of `kind: "escalate"` as drift; it is not. This section exists so that misreading doesn't happen again.

|                     | `decisions.jsonl` (`kind: "escalate"`)                                                                                                                               | `escalation.schema.json` (`ESC-NNNN`)                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**           | Any governance decision pushed to a higher authority role — a blocker, an ambiguous spec, a policy question. Human- or externally-operated-agent-authored, any role. | Specifically: an explicitly activated experimental autonomous loop (`devai experimental loop run`) escalating a stuck **task** after exhausting its recovery options.                                      |
| **Id source**       | `DEC-NNNN`, appended via `devai spec decision close` / round-close skills.                                                                                           | `ESC-NNNN`, minted via `nextCounterId({key: 'ESC', prefix: 'ESC'})` (`record/proofs/counters.json`'s `ESC` field).                                                                                         |
| **Required fields** | `kind`, `subject`, `description`, `owner`, `status` — general-purpose.                                                                                               | `escalated_task_id` (`TASK-*`), `failure_class` (enum: `hard_gate_failure`, `soft_gate_failure`, `iteration_cap_exhausted`, …), `model_tiers_tried` — loop-specific.                                       |
| **Who uses it**     | Every adopter, at any tier. This is the default escalation path.                                                                                                     | Only repos explicitly running the experimental loop. Adoption profile alone never activates it; a repo with no such experiment correctly keeps zero `ESC-NNNN` records and `counters.json.ESC: 0` forever. |

If your repo's gate failures, blockers, and policy escalations go through `decisions.jsonl`'s `escalate` kind (as sgp's do, as most adopters' do), that is the sanctioned path — you do not also need `ESC-NNNN` records, and `ESC: 0` is not a gap to close.

## What this canon does NOT govern

- The decision-making process itself (who has authority over what — see [`CONVENTIONS.md §6`](./CONVENTIONS.md#6-authority)).
- ADR-tier architectural decisions (those live under `law/adr/` per [`adr/README.md`](./adr/README.md); a DEC record may reference an ADR, but the ADR is the canonical artifact).
- Round-execution discipline (see [`round-break.md`](./round-break.md)).
- Inv-overrides (see [`../law/schemas/inv-override.schema.json`](../../law/schemas/inv-override.schema.json)) or test-weakening overrides — those have their own ledgers and shapes.

## Cross-references

- Schema: [`../docs/reference/contracts/decisions.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/decisions.schema.json).
- State-layout canon: [`state-layout.md`](./state-layout.md) (decisions.jsonl listed as an optional extension).
- ADR canon: [`adr/README.md`](./adr/README.md).
- Round canon: [`round-break.md`](./round-break.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/decisions-ledger.md (classification CURRENT).
