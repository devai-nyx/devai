# B4 — verify and close locally

**Round phase:** compare.
**Driven by:** [`SKILL-round-verify-publish`](../../reference/skills/round-verify-publish.md).
**Placeholders:** `{{round_n}}`, `{{lint_cmd}}`, `{{typecheck_cmd}}`, `{{test_cmd}}`, `{{integration_test_cmd}}`.

## Required inputs

- `scratch/sessions/rounds/round-{{round_n}}/audit/scorecard.baseline.json` (the pre-round snapshot).
- All worker outputs from the orchestrate phase.
- `scratch/sessions/rounds/round-{{round_n}}/log.txt`.
- `scratch/sessions/rounds/round-{{round_n}}/blockers.md` (if any).

## Goal

Verify the round's claimed outcomes by re-running all gates and comparing the current scorecard against the pre-round baseline. Stop after writing the disposable local closeout; it is not durable evidence or a publication input.

## Steps

1. **Re-run every gate the orchestrator declared.** Minimum:
   ```bash
   {{lint_cmd}}
   {{typecheck_cmd}}
   {{test_cmd}}
   {{integration_test_cmd}}   # if the round touched code paths covered by integration
   ```
   Anything that's now red is a **regression**, even if a worker claimed PASS — re-running is the truth.
2. **Recompute the scorecard.**
   ```bash
   devai agent skill run SKILL-compute-scorecard --repo-root .
   ```
   Persist to `scratch/sessions/rounds/round-{{round_n}}/closeout/scorecard.after.json`.
3. **Diff against baseline.**
   ```bash
   diff <(jq -S . scratch/sessions/rounds/round-{{round_n}}/audit/scorecard.baseline.json) \
        <(jq -S . scratch/sessions/rounds/round-{{round_n}}/closeout/scorecard.after.json)
   ```
   Document the cell-by-cell delta: which cells flipped PASS → FAIL (regressions), REVIEW → PASS (resolutions), UNKNOWN → PASS (newly measurable), N/A overrides added.
4. **Write `scratch/sessions/rounds/round-{{round_n}}/closeout.md`** with:
   - **Verdict** — round closed clean, closed with blockers, or aborted.
   - **Scorecard delta** — table of flipped cells.
   - **Backlog disposition** — each backlog item: shipped, deferred to round N+1, or escalated.
   - **Blockers** — open from `blockers.md`.
   - **Next round prep** — what should be on round N+1's audit reading list.
5. **STOP.** The human operator reviews `closeout.md` and either re-opens the round or independently promotes a durable result through the result's owning schema, role, and verification ceremony. Never stage, cite, or publish `.devai/local/` content.

## Deliverables

- `scratch/sessions/rounds/round-{{round_n}}/closeout/scorecard.after.json`.
- `scratch/sessions/rounds/round-{{round_n}}/closeout.md`.

## Acceptance

- All gates re-ran green (or every red is documented as a blocker).
- `closeout.md` lists every backlog item's disposition.
- The verdict line at the top of `closeout.md` matches reality. "Closed clean" requires every gate green; otherwise "closed with blockers."

## End

Local round complete. Bump `round_n` for the next iteration; the loop driver picks the next free integer. Durable closure remains a separate governed action.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B4-verify-publish.md (classification DUPLICATE).
