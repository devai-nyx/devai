# B1 — backlog

**Round phase:** plan.
**Driven by:** [`SKILL-round-backlog`](../../reference/skills/round-backlog.md).
**Placeholders:** `{{round_n}}`.

## Required inputs

- `scratch/sessions/rounds/round-{{round_n}}/audit/scratch.md` (from [B0](./B0-audit.md)).
- `scratch/sessions/rounds/round-{{round_n}}/audit/scorecard.baseline.json`.

## Goal

Convert audit findings into a prioritized backlog. The backlog drives [B2-wave-plan](./B2-wave-plan.md) (waves + effort hints) which drives [B3-orchestrate](./B3-orchestrate.md) (worker prompts).

## Steps

1. **Compile the backlog from failing cells.**
   ```bash
   devai agent skill run SKILL-compile-backlog --repo-root .
   ```
   The skill reads the latest scorecard and emits one item per FAIL/REVIEW cell. Persist to `scratch/sessions/rounds/round-{{round_n}}/backlog.json`.
2. **Augment with carryovers and open questions.** From `scratch.md`'s "Carryovers" and "Open questions" sections, add backlog items. Carryovers inherit their prior priority; open questions become **blockers** unless an operator resolves them in this phase.
3. **Prioritize.** Sort by: (a) blockers first, (b) FAIL > REVIEW, (c) substrate criticality (F1 spec > F2 plant > F3 test > F4 inventory > F5 harness), (d) cost. Document priority rationale in `scratch/sessions/rounds/round-{{round_n}}/backlog.md` (a human-readable narrative companion to the machine-readable backlog.json).
4. **Group into rough waves** — typically 1–4 waves per round depending on backlog size. A wave is "items that can ship as one bundled gate-passing batch." Don't pre-assign workers to waves yet; that happens in B2.

## Deliverables

- `scratch/sessions/rounds/round-{{round_n}}/backlog.json` — machine-readable list of items with `{id, title, priority, substrate, verdict_before, proposed_action}`.
- `scratch/sessions/rounds/round-{{round_n}}/backlog.md` — human narrative + priority rationale.

## Acceptance

- Every backlog item references a specific cell from `scorecard.baseline.json` OR a specific carryover/open-question from `scratch.md`.
- No item is "miscellaneous improvement." If you can't name the cell or carryover, it doesn't belong in this round's backlog.

## Next

Hand off to [B2-wave-plan.md](./B2-wave-plan.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B1-backlog.md (classification DUPLICATE).
