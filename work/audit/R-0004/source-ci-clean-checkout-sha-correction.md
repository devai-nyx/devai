---
id: R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION
title: R-0004 source exact-head clean-checkout SHA correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-FAILURE
superseded_by: null
provenance:
  [
    BL-184; GitHub Actions run 30215723543; Inspector 6b880b2,
    6c436be,
    and 78320af; Architect 808eba0; exact repaired snapshot 808eba01af556dbac37100f894c6706241bf6553,
  ]
---

# R-0004 source exact-head clean-checkout SHA correction

Exact-head run `30215723543` failed closed because its clean checkout did not retain two
historical objects that the local development object database retained. Inspector
`6b880b2` proved red that the canonical exception registry omitted the exact path-scoped
classifications and proved hermetically that both identities are absent in a fresh Git
repository. Architect `808eba0` adds only these classifications:

- transient pull-request merge `3469026a503837de49d829c233bc7e9eb6b53620` at
  `work/audit/R-0002/as-built.md`;
- rejected amended candidate `46535a3c8939aad7a2bbc8fce981bdcc48757e54` at
  `work/audit/R-0002-preflight/backlog-register.md` and
  `work/audit/R-0003/exit-ladder-adr-seal-failure.md`.

The focused BL-184 contract now passes in a fresh empty Git repository and reports two
classified identities. Local governance remains green at 259 governed identities, 251
local objects, and eight other path-classified specimens. A clean checkout is expected
to report 249 local objects and ten path-classified specimens for the same 259
identities. The environment-dependent split does not alter the governed population.

The first complete-ladder restart on closing snapshot `c80ea92` then failed strict
typecheck because the new test fixture indexed its exact two-element expectation without
non-null narrowing. Inspector `6c436be` adds only that TypeScript narrowing; exact
typecheck and the BL-184 focused test pass without changing an assertion.

The next complete-ladder restart on closing snapshot `cc8552b` failed lint because the
strict narrowing used forbidden non-null assertions. Inspector `78320af` instead names
the two exact fixture objects before constructing the expectation array. Lint,
typecheck, and the focused BL-184 contract pass; assertion meaning and production code
remain unchanged.

BL-184 is repaired locally pending the final complete-ladder restart. Historical
evidence remains byte-for-byte intact; no repository-wide waiver, threshold, review
replacement, or external gate changed. A new atomic closing decision, complete local
ladder, and repaired exact-head CI remain mandatory before source merge. OM-008
continues to replace only the additional Opus review.
