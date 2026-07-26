---
id: R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-FAILURE
title: R-0004 source exact-head clean-checkout SHA failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION
provenance:
  [PR #6; exact head 70b6092869b19631b845e6db79bfd0632871ab68; GitHub Actions run 30215723543; BL-184]
---

# R-0004 source exact-head clean-checkout SHA failure

Source PR #6 ran CI on exact head
`70b6092869b19631b845e6db79bfd0632871ab68`. Evidence mode and Stage 1 passed.
Governed repository enforcement failed closed because the clean GitHub checkout did not
retain two historical objects that remain present in the local development object
database:

- transient pull-request merge `3469026a503837de49d829c233bc7e9eb6b53620`, cited only
  in `work/audit/R-0002/as-built.md`;
- rejected amended R-0003 candidate `46535a3c8939aad7a2bbc8fce981bdcc48757e54`,
  cited only in `work/audit/R-0002-preflight/backlog-register.md` and
  `work/audit/R-0003/exit-ladder-adr-seal-failure.md`.

The references are truthful historical evidence and must not be deleted or rewritten.
The exact-path exception registry omitted these environment-dependent objects because
the prior local validation resolved them. BL-184 requires a hermetic Inspector contract
and two exact path-scoped classifications. It does not permit a repository-wide waiver,
history rewrite, threshold change, or broader exception.

No source merge, closure, publication, release, deployment, real-stynx write, or
later-round action is permitted until the repaired exact head passes the complete local
ladder and every required GitHub check. OM-008 replaces only the additional Opus review.
