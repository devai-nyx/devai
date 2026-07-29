---
id: R-0006-INDEPENDENT-CODEX-SUBSTITUTION-RED
title: R-0006 independent Codex substitution selector red
type: audit-report
status: active
date: 2026-07-28
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-013; exact worktree full-floor run on 2026-07-28]
---

# R-0006 independent Codex substitution selector red

After OM-013's R-0006-only substitution was applied to the Architect sources and
workspace control implementation, the minimum full floor stopped on the complete stale
selector-contract population.

`pnpm vitest run` completed with 156 test files: 155 passed and one failed. It reported
1,481 passing tests, two failing tests, and eight governed skips. Both failures were in
`packages/schemas/tests/contract/campaign-claude-selector.contract.test.ts`:

- the shared execution-contract case still required the literal `Claude Opus 5` text;
- the R-0006 orchestrator case still required the same literal Opus selector and
  no-fallback wording.

No other test failed. The failure proves that the active selector contract did not yet
model narrow per-round Owner substitutions, despite OM-009 already doing so for R-0005.
The complete repair population is that selector contract, OM-013, the shared execution
contract, the R-0006 prompt and source-close handoff, the canonical and materialized
round-close policy, and the workspace controller's stable review-record/model binding.

This red is preserved before Inspector acceptance. It claims no green substitution,
fresh candidate, review PASS, publication, merge, PC-0007, closure, release, or later
round authority.
