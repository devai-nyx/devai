# B3 — orchestrate

**Round phase:** execute.
**Driven by:** [`SKILL-round-orchestrate`](../../reference/skills/round-orchestrate.md).
**Placeholders:** `{{round_n}}`, `{{lint_cmd}}`, `{{typecheck_cmd}}`, `{{test_cmd}}`.

## Required inputs

- `.devai/state/round-runs/R-{{round_n}}/backlog/prompts/00-orchestrator.md` (the
  disposable wave-plan proposal), or its reviewed Architect promotion under
  `work/rounds/R-{{round_n}}/prompts/`.
- The matching disposable or governed worker prompts.
- `.devai/state/round-runs/R-{{round_n}}/backlog/backlog.json`.

## Goal

Drive the materialized round to completion. Fan out workers wave-by-wave, gate each wave, run fix-up skills on failure, track blockers.

## Steps

1. **Initialize runtime state.** Wave logs are emitted under
   `.devai/state/round-runs/R-{{round_n}}/orchestrate/`.
2. **For each wave declared in `00-orchestrator.md`:**
   - **Dispatch workers.** Workers marked "safe to parallelize" run in parallel (separate sessions / agent contexts). Workers with declared dependencies run sequentially.
   - **Each worker MUST return an attributable status** recorded in its runtime wave log.
   - **Run wave gates.** Default minimum: `{{lint_cmd}}`, `{{typecheck_cmd}}`. Add schema validation, smoke tests, or other checks as the orchestrator's "Gates" section directs.
3. **On gate failure:**
   - Lint failure → invoke [`SKILL-fix-lint`](../../reference/skills/fix-lint.md).
   - Build/typecheck failure → invoke [`SKILL-fix-build`](../../reference/skills/fix-build.md). Read the SensorReading. If fixable mechanically, apply the fix; otherwise escalate.
   - Test failure → invoke [`SKILL-fix-test`](../../reference/skills/fix-test.md). Same triage.
   - If three iterations do not resolve the gate, append an attributable escalation to `.devai/state/decisions.jsonl`; never relabel the gate green.
4. **Track blockers.** `.devai/state/decisions.jsonl` is the disposable runtime ledger;
   durable disposition requires promotion through the owning governed record.
5. **Wave-close discipline.** Before declaring a wave complete:
   - Every required gate is green.
   - Every worker's "Deliverable" section is satisfied (files exist with expected content).
   - The runtime wave log carries the final status.

## Deliverables

- `.devai/state/round-runs/R-{{round_n}}/orchestrate/*.log` — runtime wave status.
- `.devai/state/decisions.jsonl` — disposable escalations and blockers.
- Per-worker outputs as declared in their respective prompts.

## Acceptance

- Every worker prompt's gate either passed or is logged as a blocker.
- Every attempted worker has a runtime status (no silent workers).
- Every clean wave has a `clean` runtime log entry.

## Next

Hand off to [B4-verify-publish.md](./B4-verify-publish.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B3-orchestrate.md (classification DUPLICATE).
