---
id: R-0004-CI-ADR-GOVERNANCE-CORRECTION
title: CI ADR association and seal-history correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: [R-0004-CORRECTED-CANDIDATE-GOVERNANCE-FAILURE, R-0004-ADR-SEAL-GOVERNANCE-FAILURE]
superseded_by: null
provenance:
  [
    BL-154–155; DII-175–179; Engineer 0e80205,
    c3cd89c,
    cb2d58e,
    and f134f26; Inspector e984aed,
    2c2d8ec,
    cc4e2c9,
    and fceaa12,
  ]
---

# CI ADR association and seal-history correction

BL-154 and BL-155 are locally implemented. The forbidden-action scanner derives exact
path coverage from active numbered ADR frontmatter and rejects absent, malformed,
superseded, or unrelated coverage. The original workflow-checker finding and every
historical governed CI-path change now resolve without an exact-commit or author-only
waiver; focused allow/deny tests pass.

The governance ledger now follows true renames but stops inherited history at a Git copy
boundary. It accepts a pre-merge correction only when the final record either exactly
restores its first seal or restores all sealed bytes and stable fields through a
canonical terminal transition with no replacement drift. Unrestored body mutations,
rename mutations, malformed history, terminal replacement changes, and returns to draft
remain findings. All 38 focused ledger tests pass.

ADR-013 is restored to its active seal. ADR-014 is restored to its actual first sealed
body plus the one terminal transition to ADR-015. Active ADR-015 carries the complete
seven-path CI governance association and preserves CI-economy and workflow-pin doctrine.
The ADR roster is gapless through 015 with thirteen active records, and production ADR
validation plus strict governance pass.

No waiver, history rewrite, threshold, skip, external gate, or release boundary changed.
