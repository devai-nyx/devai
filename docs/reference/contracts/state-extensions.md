# `record/proofs/` — extensions contract

**Authority:** Architect (cross-repo). Issued R3-W4 (2026-05-23).
**Status:** stable.
**Adopter playbook:** [`../../adopters/state-layout.md`](../../adopters/state-layout.md).

## Purpose

This contract canonicalizes the **filesystem layout** under each adopter's `record/proofs/` directory. The on-disk file shapes are governed by the existing schemas in [`../schemas/`](../../../law/schemas); this contract maps each canonical path to its governing schema and declares presence rules, ownership, and lifecycle.

The contract was authored by promoting five extensions that STYNX shipped ahead of canon (`inv-candidates/`, `locks/`, `tasks/`, `worktrees.json`, `backlog.jsonl`) into the baseline spec. No new schemas were created — STYNX's on-disk files already validate against existing DEVAI schemas.

## Canonical layout

| Path                                       | Schema                                                                                                                                                                           | Presence    | Owner                                                              | File-naming                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ | ---------------------------------- |
| `counters.json`                            | inline JSON                                                                                                                                                                      | required    | every counter-emitting verb                                        | `counters.json`                    |
| `evidence-chain.json`                      | [`evidence-chain.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/evidence-chain.schema.json)             | required    | `evidence emit`, `record run --chain`                              | single file                        |
| `sensor-readings/<kind>/<id>.json`         | [`sensor-reading.schema.json`](../../../law/schemas/sensor-reading.schema.json)                                                                                                  | required    | `sense <kind>` verbs                                               | one file per reading               |
| `inventory/inventory.json`                 | [`cross-repo-inventory.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/cross-repo-inventory.schema.json) | required    | `inv regen`                                                        | single file                        |
| `skills/<skill-id>/<ts>.json`              | per-skill evidence (manifest-declared)                                                                                                                                           | required    | `skill run`                                                        | one per execution                  |
| `agent-runs/<AR-id>.json`                  | [`agent-run.schema.json`](../../../law/schemas/agent-run.schema.json)                                                                                                            | required    | agent-driven verbs                                                 | one per agent run                  |
| `sensors/<reading-id>.json`                | [`sensor-reading.schema.json`](../../../law/schemas/sensor-reading.schema.json)                                                                                                  | recommended | legacy flat emission                                               | back-compat path                   |
| `llm-usage.jsonl`                          | inline `{ts, family, model, tokens, cost_usd, …}`                                                                                                                                | recommended | `createLlmClient` instrumentation                                  | append-only JSONL                  |
| `rtd-manifests/<RTD-id>.json`              | [`rtd-manifest.schema.json`](../../../law/schemas/rtd-manifest.schema.json)                                                                                                      | recommended | `rtd bundle`                                                       | one per bundle                     |
| `inv-candidates/INV-CANDIDATE-<ulid>.json` | [`inv-candidate.schema.json`](../../../law/schemas/inv-candidate.schema.json)                                                                                                    | optional    | discovery sensors                                                  | one per candidate                  |
| `locks/<substrate>~<module>.json`          | [`lock.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/schemas/lock.schema.json)                                   | optional    | `lock acquire`, `task spawn`                                       | substrate~module key               |
| `tasks/<TASK-id>.json`                     | [`task.schema.json`](../../../law/schemas/task.schema.json)                                                                                                                      | optional    | `task spawn / complete / escalate`                                 | one per task                       |
| `worktrees.json`                           | [`worktree.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/schemas/worktree.schema.json) (array)                   | optional    | `worktree create / destroy / list`                                 | single file                        |
| `backlog.jsonl`                            | [`backlog.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/schemas/backlog.schema.json) (JSONL)                     | optional    | `backlog add / next / complete`, `score backlog-refresh`           | append-only JSONL                  |
| `decisions.jsonl`                          | [`decisions.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/decisions.schema.json) (JSONL)               | optional    | human, `SKILL-round-verify-publish` (R5+ integration), audit waves | append-only JSONL; R3-W6 canonized |

**Presence levels:**

- **required** — baseline; any DEVAI-enabled repo MUST have the file/dir (may be empty bootstrap content).
- **recommended** — present in most adopters; absent rounds typically just haven't exercised the relevant verb yet.
- **optional** — opt-in; absent in many adopters without consequence.

## Validation rule

Every file under a canonical path MUST validate against the cited schema. The validation gate is `devai inventory contracts`. Adopter-private paths (see §"Extension policy") are not subject to this gate but cannot collide with canonical names.

## Cross-repo diff (R3-W4 survey)

| Path                      | DEVAI    | STYNX                       | TEAT                                            | PEC                                                        |
| ------------------------- | -------- | --------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Baseline (9 entries)      | ✓ all    | ✓ all (no `rtd-manifests/`) | ✓ all minus `llm-usage.jsonl`, `rtd-manifests/` | partial: `counters.json`, `inventory/`, `sensor-readings/` |
| Optional ext. (5 entries) | none yet | ✓ all five                  | none yet                                        | none                                                       |
| Adopter-private           | none     | `init-introspection.json`   | `init-introspection.json`                       | `coverage/`, `obligations.json`, `rtd/`                    |

**Observations:**

- STYNX is the canon leader for the five optional extensions (`inv-candidates/`, `locks/`, `tasks/`, `worktrees.json`, `backlog.jsonl`).
- TEAT mirrors DEVAI's baseline minus the two recommended-presence items.
- PEC carries a minimal baseline + three adopter-private paths (`coverage/`, `obligations.json`, `rtd/`). These are PEC-internal concerns; **not promoted to canon** in R3-W4. If they generalize to other adopters in a future round, an ADR-backed promotion is the path.
- No `init-introspection.json` was promoted to canon — it is an adopter-cache artifact whose shape varies, and the recovery cost of regenerating it via `devai init apply-f5 --introspect --as-role architect --write` is low.

## Extension policy

### Adopter-private paths

Adopters MAY add subdirs/files under `record/proofs/` for their own purposes without cross-repo coordination, subject to:

- Names MUST NOT collide with canonical paths (baseline or optional).
- Content is the adopter's responsibility; not subject to `inv contracts`.
- Convention: prefer kebab-case directory names; document in the adopter's own README/AGENTS.md.

### Promotion to canon

A new path becomes canonical via:

1. Architect-tier ADR documenting the path's purpose, schema, presence level, and owner.
2. A wave (in a successor round) that updates this contract and the adopter playbook.
3. Backfill: each existing adopter either creates the path (lazily, on first use) or declares N/A in `.devai/config/scorecard-na.json`.

### Demotion (removal from canon)

Reserved; not yet exercised. Would require: ADR, deprecation period, migration recipe for adopters whose state depends on the demoted path.

## Lifecycle + retention

- Default: **gitignored**, per [`.gitignore`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/.gitignore) line `record/proofs/...`. Runtime state is regenerable, not source.
- **Exception**: `counters.json` and `evidence-chain.json` are explicitly tracked in repos that want them to persist across sessions. The bootstrap chain at `EV-0000000000000001` provides the starting point.
- Per-worktree: per Constitution Article 25, each task's worktree gets its own `record/proofs/` slice. The parent repo's `record/proofs/` is the merged view at the end.

## What this contract does NOT govern

- Source code, configuration, secrets — these belong elsewhere.
- The shapes of the cited schemas (governed by the schema files themselves).
- Adopter-private paths (out of scope by definition).
- DEVAI's `.devai/config/` directory (governed separately by [`CONVENTIONS.md §4`](../../adopters/CONVENTIONS.md#4-canonical-devai-directory) and individual config schemas).

## Cross-references

- Adopter playbook: [`../../adopters/state-layout.md`](../../adopters/state-layout.md).
- `.devai/` overall canon: [`../../adopters/CONVENTIONS.md §4`](../../adopters/CONVENTIONS.md#4-canonical-devai-directory).
- Schema catalog: [`../schemas/`](../../../law/schemas).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/contracts/state-extensions.md (classification CURRENT).
