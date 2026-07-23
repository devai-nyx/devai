# P6 — BACKLOG track (Auditor · effort: medium)

Role: **Auditor**. Read everything; write ONLY `work/audit/R-0001/` and the backlog file
below. You recommend, never ratify: every backlog record is a *proposal* with draft
status. You make no source edits anywhere.

## Context to read first
ALL phase reports (orchestrator provides them) · `scratch/pre-plan/*` (all 13 packs +
OWNER-DECISIONS + D-terminal-draft) · `scratch/review/*` (REV-0001..0007) ·
`law/schemas/REGEN-STATUS.md` · dossier Parts VIII/IX acceptance criteria · Part X §5
(still-red list).

## Task: compile `work/rounds/R-0001/backlog.md` — the successor's first work queue

Sweep sources for every deferred, open, known-red, or scheduled-later item. Each becomes
a §5.1 record entry (compact register style: `### BL-0NN — title` + meta line
`type: backlog-item · status: draft · authority: <role that will execute> · provenance:`
+ 2–4 lines: what, why deferred, suggested wave/round, acceptance sketch).

Mandatory sweep list (find more; missing one of these named items is a failed track):
re-bind the genesis attestation after the human runs R-Ω (+ flip to ratified; +manifest
supplement D-189..D-196 classification; +coupling re-verification) · predecessor repo
rename + site freeze + archive flag (Ω.E items, human-gated) · pending R30 changeset
disposition (terminal item 9) · adopter migration execution (CTX-09: doctor migration
checks, migration map, stynx run → W09 proof) · core-façade package decision ·
full per-action output contracts (CTX-07) · registry-derived enum generation ·
full `check schemas` linter · sense-wrapper collapse IF P4 took the fallback ·
invariant `authority`→`authority_docs` rename (re-anchoring cost) · proofs epoch writer
+ intra-epoch chaining (CTX-11 REQUIRED) if unshipped · scorecard SWEEP tier scheduling ·
prompt-overlay bounding decision (W04 skills ADR) · ADR-001..012 minting from stubs to
accepted (per-ADR authoring) · constitution ratification ceremony (1.0.0 + Article-42
placement + altitude findings from P1) · npm provenance at first release · glossary
successor-terms ratification (P2 drafted them) · docs History section finalization
post-R-Ω · anything in phase reports' DEFERRED/KNOWN-REDS/OWNER-QUESTIONS lists.

Prioritize: P0 = blocks ratification/release · P1 = blocks adopters · P2 = hygiene.
Group into suggested rounds (R-0002 candidates vs later).

## Also: the as-built seed
Start `work/audit/R-0001/as-built.md`: phase-by-phase what-actually-happened vs
Appendix A (deltas only, honest), feeding P8's closure.

## Acceptance
Backlog validates under the register record parser (coordinate the parse pattern with
what P5 shipped) · every named mandatory item present or explicitly marked N/A with
reason · zero source-tree edits (`git status` shows only your two files).

Final message: `DONE (item count by priority) / SOURCES-SWEPT / COMMITS`.
