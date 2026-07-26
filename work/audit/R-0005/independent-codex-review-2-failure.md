---
id: R-0005-INDEPENDENT-CODEX-REVIEW-2-FAILURE
title: R-0005 second independent Codex review failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - OM-009; R-0005; Codex agent /root/r0005_codex_reviewer; candidate 4346bdbb2af4cc917eb197edfd212b4873283eae; base e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190
---

# R-0005 second independent Codex review failure

The independent Codex agent `/root/r0005_codex_reviewer` reviewed the exact clean
92-commit candidate `4346bdbb2af4cc917eb197edfd212b4873283eae` against exact
base `e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190`. The review was strictly read-only
and used no external service. It is not a Claude, Opus, Fable, or cross-provider review.

## Findings

1. **P1 — Public legacy aggregate-chain writers remain callable.**
   `packages/evidence/src/evidence/index.ts` publicly re-exports working `initChain`,
   `saveChain`, `appendRecord`, and `redactRecord` mutations despite ADR-017/019's
   reader-only compatibility boundary. The existing contract inspects selected CLI
   call sites but does not exercise the package API.
2. **P1 — Lifecycle prompt exemptions exceed the governing law and are not red-first.**
   `packages/skills/src/prompt-firewall/index.ts` hard-codes four Architect lifecycle
   writer scopes beyond ADR-016/019's two bounded exceptions. Engineer `b875121`
   precedes the later behavioral Inspector assertion and the earlier bound red did not
   test this allowance.

The reviewer confirmed the other first-review and ladder repairs, role-pure authorship,
clean diff, and sequencing check. These two authority/API findings block closure.

VERDICT: FAIL
