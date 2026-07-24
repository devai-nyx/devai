# B3 — orchestrate

**Round phase:** execute.
**Driven by:** [`SKILL-round-orchestrate`](../../reference/skills/round-orchestrate.md).
**Placeholders:** `{{round_n}}`, `{{lint_cmd}}`, `{{typecheck_cmd}}`, `{{test_cmd}}`.

## Required inputs

- `scratch/sessions/rounds/round-{{round_n}}/prompts/00-orchestrator.md` (the wave plan).
- `scratch/sessions/rounds/round-{{round_n}}/prompts/NN-*.md` (worker prompts).
- `scratch/sessions/rounds/round-{{round_n}}/backlog.json`.

## Goal

Drive the materialized round to completion. Fan out workers wave-by-wave, gate each wave, run fix-up skills on failure, track blockers.

## Steps

1. **Initialize the round log.**
   ```bash
   cat > scratch/sessions/rounds/round-{{round_n}}/log.txt <<'EOF'
   # Change log — round {{round_n}}
   # Format: YYYY-MM-DD HH:MM  <ACTION>  <path>  [note]
   # ACTION ∈ {ADD, MOD, MV, DEL, RENAME}
   EOF
   ```
2. **For each wave declared in `00-orchestrator.md`:**
   - **Dispatch workers.** Workers marked "safe to parallelize" run in parallel (separate sessions / agent contexts). Workers with declared dependencies run sequentially.
   - **Each worker MUST append `ADD` / `MOD` / `MV` lines to `log.txt`** with one row per file action.
   - **Run wave gates.** Default minimum: `{{lint_cmd}}`, `{{typecheck_cmd}}`. Add schema validation, smoke tests, or other checks as the orchestrator's "Gates" section directs.
3. **On gate failure:**
   - Lint failure → invoke [`SKILL-fix-lint`](../../reference/skills/fix-lint.md).
   - Build/typecheck failure → invoke [`SKILL-fix-build`](../../reference/skills/fix-build.md). Read the SensorReading. If fixable mechanically, apply the fix; otherwise escalate.
   - Test failure → invoke [`SKILL-fix-test`](../../reference/skills/fix-test.md). Same triage.
   - If three iterations of a fix-up skill don't resolve the gate, write the failure to `scratch/sessions/rounds/round-{{round_n}}/blockers.md` and proceed (the round closes with a blocker, not a green merge).
4. **Track blockers.** `scratch/sessions/rounds/round-{{round_n}}/blockers.md` is a running ledger. Each blocker entry includes: which gate failed, which worker triggered the failure, what was tried, and the proposed resolution (human-input needed).
5. **Wave-close discipline.** Before declaring a wave complete:
   - Every required gate is green.
   - Every worker's "Deliverable" section is satisfied (files exist with expected content).
   - The round log has entries for every file action in the wave.

## Deliverables

- `scratch/sessions/rounds/round-{{round_n}}/log.txt` — complete action log.
- `scratch/sessions/rounds/round-{{round_n}}/blockers.md` — any unresolved gate failures or human-input items.
- Per-worker outputs as declared in their respective prompts.

## Acceptance

- Every worker prompt's gate either passed or is logged as a blocker.
- `log.txt` has at least one entry per worker (no silent workers).
- Every wave that completed cleanly has a "wave-N closed" NOTE entry in `log.txt`.

## Next

Hand off to [B4-verify-publish.md](./B4-verify-publish.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B3-orchestrate.md (classification DUPLICATE).
