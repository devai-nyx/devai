---
id: R-0004-SOURCE-DECISION-SHA-FAILURE
title: R-0004 governed decision SHA binding failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-SOURCE-DECISION-SHA-CORRECTION
provenance:
  [
    R-0004 tenth exact-candidate Claude Opus 5 review of e0af282d368501127003e026bb66de1bfeef76e4; BL-181,
  ]
---

# R-0004 governed decision SHA binding failure

The tenth exact-candidate read-only review returned **`VERDICT: FAIL`** after reproducing
the complete ladder and the narrow reporter-progress repair. The repair is sound, but
two active closing decisions and six Auditor lines cite fabricated forty-hex expansions
of valid short commit prefixes.

- `dc64176017ad07c956548b47e59955862541db21` does not resolve; exact source re-read is
  `dc64176ab75675a65e3c561576a2f5bb756b408f`.
- `54e79a1d9b15170b885950c1371758867ac52024` does not resolve; exact source re-read is
  `54e79a19a22e64ec8a6c6ea698087081872d70fd`.

The current governance checks validate SHA shape but do not prove local object
resolution or classify legitimate foreign, tree, transient-merge, or intentionally
invalid historical specimens. BL-181 requires a red-first Inspector contract, an
Engineer CI check, an explicit Architect-governed exception set, role-owned identity
corrections, symmetric Auditor closure, and an atomic next closing decision.

No source push, merge, closure, publication, release, deployment, real-stynx write, or
later-round action is permitted until the corrected exact candidate passes the complete
ladder, a fresh literal `claude-opus-5` review, and exact-head CI.
