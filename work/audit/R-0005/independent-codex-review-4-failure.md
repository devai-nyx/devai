---
id: R-0005-INDEPENDENT-CODEX-REVIEW-4-FAILURE
title: R-0005 fourth independent Codex review failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - OM-009; R-0005; Codex agent /root/r0005_codex_reviewer; candidate 0045bdb8182ebc4c1bf87815c4e74a7c292efa35; base e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190
---

# R-0005 fourth independent Codex review failure

The independent Codex agent `/root/r0005_codex_reviewer` reviewed the exact clean
135-commit candidate `0045bdb8182ebc4c1bf87815c4e74a7c292efa35` against exact
base `e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190`. The review was strictly read-only
and used no external service. It is not a Claude, Opus, Fable, or cross-provider review.

## Findings

1. **P1 — CURRENT documentation retains contradictory authority and lifecycle paths.**
   `docs/roles/auditor.md` and `docs/adopters/user-guide.md` still assign Auditor output
   to `scratch/sessions/rounds/*/audit/**`; `docs/dev/security/authority-enforcement.md`
   assigns working papers and observations to `docs/work/**`; and
   `docs/theory/architecture/README.md` describes round plans, prompts, observations,
   and closeout evidence under `docs/work/`. The existing Inspector contract scans
   only eight named files and narrow literals, so it misses wildcard and generic stale
   forms. Every CURRENT document must use the canonical `work/rounds/**`,
   `.devai/state/round-runs/**`, and `work/audit/**` model, and the contract must scan
   the complete CURRENT documentation corpus for obsolete formulations.
2. **P1 — The docs-link correction lacks exact semantic red-first binding.** The
   substantive Engineer commits `8651b26` and `3925a2f` are bound to Inspector red
   `67aa794`, but that red demonstrated ADR mutation, round-state routing, and lifecycle
   documentation; it did not exercise `SKILL-fix-docs-links`, and its command omitted
   the prompt-overlay test that exposed the later defect. The historical inversion must
   be disclosed instead of being represented by unrelated evidence. A fresh red-first
   repair must make the sequencing validator bind exact implementation paths to the red
   tests and Auditor observation that exercise them.

The reviewer independently confirmed the public evidence API is reader-only; ADR and
docs-link skills are diagnose-only; prompt exemptions are absent; scaffold/archive are
CLI-only; round state routes end to end; all 52 skill identities are unique and contain
no forbidden lifecycle writer; trace, repository-reference, SHA-reference, focused
tests, `git diff --check`, and worktree cleanliness pass. Mechanical governed sequencing
also passes, subject to finding 2.

VERDICT: FAIL
