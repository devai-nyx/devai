---
id: R-0003-FORMATTING-FAILURE
title: Exact-candidate formatting failure
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate b89a7d7; complete R-0003 local ladder; BL-130]
---

# Exact-candidate formatting failure

The complete ladder at candidate `b89a7d703c7e2e305e4239e173f31a7619805481`
passed Stage 1, Stage 2, Stage 3, governance, T1 through T6, unchanged coverage floors,
and changeset classification. Repository-wide Prettier then failed on five files, so
tree-cleanliness was not evaluated and no Opus review or source push began.

Two files are live repair sources and require ordinary formatting:
`packages/spec/src/adr/index.ts` and
`work/audit/R-0003/first-opus-corrections.md`. The three files under
`work/rounds/R-0003/reviews/` are deliberately exact REV-0001, REV-0003, and REV-0006
copies whose hashes are contract-bound. Formatting them would destroy the preserved
evidence claim.

BL-130 therefore requires formatting the live files and adding a narrow immutable-review
subtree exclusion. It authorizes no content change to the three review copies, no broad
formatting waiver, and no threshold or assertion weakening.
