# P3 — DOCS track (Architect · effort: high) — may run concurrent with P4 (disjoint trees)

Role: **Architect**. You own `docs/**` only. Source material: `../devai/docs/**`
READ-ONLY. You never touch law/, product/, packages/, tests/.

## Context to read first
Dossier Part IX §3 (import posture + cluster canon) · Part VII §3 docs/ ·
`scratch/review/subsystem-audits.md` §3 (the classification: 5 STALE named, 12
DUPLICATE named, 11 HISTORICAL named, machinery list) · `scratch/pre-plan/04-docs.md` (CTX-04).

## The canon rule (apply everywhere)
Concepts → `docs/` framework pages · runbooks → `docs/dev/` · adopter how-to →
`docs/adopters/` · law only in `law/` (link, never restate). Generated content is never
hand-committed; hand-maintained indexes do not migrate (they become `record/derived/`
outputs — leave a stub note where one is expected).

## Tasks

1. **Migrate CURRENT files** from the predecessor per the audit's per-section counts:
   start/ theory/ roles/ adopters/ reference(non-generated)/ + meta runbooks → their
   canon homes in the Part VII tree. Preserve content byte-faithfully except: path
   rewrites to the successor layout (docs/framework/… → law/… links, .devai/state →
   record/proofs, DESIGN-DECISIONS.md → law/register/DECISIONS.md, BUILD-PLAN → rounds)
   and the 5 STALE one-line fixes (SECURITY.md command; framework index "56 schemas"→
   guard pointer; cli-grammar count→guard pointer; skip the two dead indexes).
2. **Consolidate the DUPLICATE clusters** (round-workflow B0–B4 double tree; role
   declaration): one canon home each, pointers elsewhere.
3. **Do NOT migrate**: HISTORICAL (11 named files), docs/site versioned snapshots,
   generated CLI reference (regenerates in P7/later), docs/work (predecessor scratch).
4. **Author fresh**: `docs/index.md` landing (successor voice, links the History
   section); `docs/start/status.md` pointing at the round ledger + attestation;
   `docs/dev/` index describing the test tiers (Part VII §4) and the per-batch gates;
   History section stub (`docs/reference/history.md` or per IA) presenting the genesis
   attestation + frozen-predecessor link with the PROVISIONAL-binding caveat.
5. Every migrated file gets a provenance line appended in front-matter or footer:
   `migrated from devai@<pin> path <old> (classification CURRENT)`. Log a per-file
   manifest at `work/rounds/R-0001/handoffs/docs-migration-manifest.md`.

## Acceptance
Zero broken relative links (verify with a link-check script you write into
`scratch/sessions/` — tool, not product) · canon rule holds (spot-audit your own output
against 5 random files per section) · no HISTORICAL content imported · role-pure commits.

Final message: `DONE (per-section counts) / DEFERRED / STALE-FIXES-APPLIED / COMMITS`.
