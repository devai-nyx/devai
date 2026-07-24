# B0 — audit

**Round phase:** measure.
**Driven by:** [`SKILL-round-audit`](../../reference/skills/round-audit.md).
**Placeholders:** `{{repo_name}}`, `{{round_n}}`.

## Required inputs

- `{{round_n}}` — the round number (passed in as `inputs.round_n`).
- `record/proofs/sensor-readings/` populated with current readings.
- `docs/gov/audit/` (canonical name per [CONVENTIONS.md](../../adopters/CONVENTIONS.md) §1) if the adopter keeps a gov-local audit ledger.

## Goal

Snapshot the current state of `{{repo_name}}` before any planning begins, producing a context pack the next phase reads to generate prioritized work.

## Steps

1. **Refresh sensor readings.** Run the sensor sweep relevant to the round's scope. The minimum set: `devai sense lint`, `devai sense build`, `devai sense test`, `devai sense inventory coverage`. Add domain-specific sensors as appropriate.
2. **Compute the scorecard.**
   ```bash
   devai agent skill run SKILL-compute-scorecard --repo-root .
   ```
   The output lands at `record/proofs/skills/SKILL-compute-scorecard/<ts>.json`. Copy the latest to `scratch/sessions/rounds/round-{{round_n}}/audit/scorecard.baseline.json`.
3. **Generate the assessment narrative.**
   ```bash
   devai agent skill run SKILL-assess-state --repo-root .
   ```
   Persist the output to `scratch/sessions/rounds/round-{{round_n}}/audit/assessment.json`.
4. **Author `scratch/sessions/rounds/round-{{round_n}}/audit/scratch.md`** with these sections:
   - **Current state** — one paragraph summarizing PASS / REVIEW / FAIL / UNKNOWN counts.
   - **Failing cells** — table of (F, T) cells with verdict + measurable_via + suggested fix.
   - **Open questions** — anything the audit can't resolve without an operator decision.
   - **Carryovers from round N-1** — anything explicitly deferred from the prior round.
5. **Snapshot relevant gov docs.** Copy any `docs/gov/audit/*.md` referenced by the assessment into `scratch/sessions/rounds/round-{{round_n}}/audit/inputs/` for traceability.

## Deliverables

- `scratch/sessions/rounds/round-{{round_n}}/audit/scorecard.baseline.json`
- `scratch/sessions/rounds/round-{{round_n}}/audit/assessment.json`
- `scratch/sessions/rounds/round-{{round_n}}/audit/scratch.md`
- `scratch/sessions/rounds/round-{{round_n}}/audit/inputs/*` (snapshotted)

## Acceptance

- `scratch.md` lists every non-PASS cell with a proposed action.
- Open questions are explicit, not implied. If the audit can't proceed without a decision, halt and surface the question.

## Next

Hand off to [B1-backlog.md](./B1-backlog.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/B0-audit.md (classification DUPLICATE).
