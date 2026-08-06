# R-0011 ORCHESTRATOR — evidence-reuse authorization preparation

Do not execute unless R-0010’s published phase is closed. Read OM-002, OM-003, the
shared contract, R-0011 authorization/plan, published R-0010 audit, ADR-003/005,
successor authorization schemas, gate resolver, revocation paths, weekly/source
workflow rules, and semantic-review implementation.

Execute B0 through B6. Freeze the zero baseline before code changes. Commit Inspector
reds first. Preserve `git show <base-sha>:` first-parent resolution and full-run fallback
for every invalid state. Metrics are observation only.

Ask Claude Opus 5 through literal `claude-opus-5` to attack self-authorization,
head-only authorization, revocation, source-PR bypass, manufactured runs, and
semantic-review trust; no fallback to another model is permitted. Resolve findings
before merge.

Final report:

`PUBLISHED ENTRY SUBJECT / ZERO BASELINE / SUCCESSOR AUTHORIZATION SHAPE / INVALID-CASE
MATRIX / SOURCE+WEEKLY BEHAVIOR / SEMANTIC-REVIEW DISPOSITION / INSTRUMENTATION / BATCH
COMMITS / GATES / CLOSURE / CLAUDE REVIEW / R-0010 PENDING`.
