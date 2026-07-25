# B2 — wave plan

**Round phase:** plan (B1 continuation).
**Driven by:** [`SKILL-round-backlog`](../../reference/skills/round-backlog.md).
**Placeholders:** `{{round_n}}`.

## Required inputs

- `scratch/sessions/rounds/round-{{round_n}}/backlog.json` (from [B1](./B1-backlog.md)).

## Goal

Materialize the orchestrator + worker prompts the execute phase reads. Output is a self-contained `scratch/sessions/rounds/round-{{round_n}}/prompts/` directory the round-orchestrator can run blind.

## Steps

1. **Determine wave count.** Pin the rough waves from B1 to a final count. Common shapes: 1 wave (small round, <5 items), 2 waves (typical), 3+ waves (large or interdependent).
2. **Assign workers to waves.** Each backlog item gets one worker prompt (`NN-<slug>.md`). Numbering is round-global (01, 02, …), not per-wave. The wave membership is declared in the orchestrator prompt, not in the worker filenames.
3. **Author the orchestrator prompt.** `scratch/sessions/rounds/round-{{round_n}}/prompts/00-orchestrator.md` MUST contain:
   - **Goal** — one paragraph: what this round delivers.
   - **Inputs** — files the orchestrator reads (backlog, scratch, prior-round closeout).
   - **Worker fan-out** — wave-by-wave listing, each wave naming its worker prompts and effort hint.
   - **Gates** — what runs between waves (lint, typecheck, schema validate, tests).
   - **Output checklist** — concrete files/directories expected at round close.
   - **Logging** — append-to-log format.
4. **Author each worker prompt.** `scratch/sessions/rounds/round-{{round_n}}/prompts/NN-<slug>.md` MUST carry the six headings:
   - **Goal** — what this worker delivers.
   - **Inputs** — files to cite (do not byte-copy).
   - **Deliverable** — files to add/modify.
   - **Acceptance** — how to know it's done (gate command, validation rule).
   - **Logging** — what to append to the round log.
   - **Model** — effort hint (low / medium / high). Drives which model the orchestrator dispatches.

## Effort hint guide

| Hint     | Use for                                                                               |
| -------- | ------------------------------------------------------------------------------------- |
| `low`    | Mechanical edits, single-file changes, renames, doc-rot fixes.                        |
| `medium` | New schemas / verbs / adopter docs; multi-file refactors; non-trivial test additions. |
| `high`   | New skill compositions, cross-substrate work, architecturally novel code.             |

## Deliverables

- `scratch/sessions/rounds/round-{{round_n}}/prompts/00-orchestrator.md`.
- `scratch/sessions/rounds/round-{{round_n}}/prompts/NN-<slug>.md` per backlog item.

## Acceptance

- Each worker prompt's "Deliverable" section names specific files (paths, not "the relevant code").
- Each worker prompt's "Acceptance" section names a gate command that can be run mechanically.
- The orchestrator prompt's "Gates" section lists every command the orchestrator should run between waves.
- A reader who has not seen the audit can execute the round from the prompts directory alone.

## Next

Hand off to [B3-orchestrate.md](./B3-orchestrate.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B2-wave-plan.md (classification DUPLICATE).
