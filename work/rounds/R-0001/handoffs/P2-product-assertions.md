---
id: R-0001-P2-PRODUCT-ASSERTIONS
title: P2 product assertion handoff to P5
type: round-handoff
status: active
date: 2026-07-23
authority: Architect
supersedes: null
superseded_by: null
provenance: R-0001/P2 REV-0006 execution; Constitution Article 6 role boundary
---

# P2 product assertion handoff to P5

P2 applied the recorded REV-0006 Owner marks without editing Inspector-owned tests.
The product contract suite now has one expected assertion failure:

- `packages/schemas/tests/contract/product.contract.test.ts:77` expects 37 glossary
  records; the vocabulary rider adds GE-038..044, so the governed population is 44.

Observed before the P2 commit with `pnpm vitest run`: 5 files, 28 tests, 27 pass,
1 fail, and the sole failure is `expected 44 to be 37` at that assertion.

## Exact P5 changes

P5 owns the following changes to
`packages/schemas/tests/contract/product.contract.test.ts`.

### Article-12 seam and supersession

Keep the physical journey-record count at 14. Parse all records once, filter
`status === 'active'` for the active-seam loop, and assert that the active set has 13
records. The seam resolution and non-empty checks apply to those 13 active records.
Add explicit assertions that:

- JNY-007 has `status === 'retired'` (the journey schema's supersession vocabulary)
  and `superseded_by === 'JNY-014'`;
- JNY-014 has `supersedes` equal to `['JNY-007']`.

This preserves JNY-007 as a governed record while excluding it from active-seam
claims. Do not change the journey schema vocabulary merely to spell the shared
front-matter token `superseded`.

### Use-case mapping

Rename the ratification-pending use-case test and assert the applied state:

- `cases.length === 12`;
- `generatedAt` is absent from this hand-authored bundle;
- every `mainFlow` step and every `alternateFlows[].steps[]` step has a non-empty
  `refs.actionRefs`;
- every action ref has a non-empty `id`;
- a `provisional` member, when present, is exactly `true`;
- provenance contains `REV-0006 Owner marks applied 2026-07-23`.

The schema makes `generatedAt` optional because only a writer may machine-stamp it.
The successor-stable identifiers are unmarked; predecessor canonical paths retained
pending P4 carry `provisional: true` on the individual action ref.

### Glossary rider

Change the glossary test title and count assertion from 37 to 44. Continue requiring
every entry to validate and every `see_also` edge to resolve. Preserve the imported
provenance check for GE-001..037, and for GE-038..044 instead assert:

- `status === 'draft'`;
- `authority === 'joint'`;
- the first provenance line contains both `REV-0006 vocabulary rider` and
  `Owner 2026-07-23`.

After these changes, rerun the full suite and close this handoff with the Inspector
commit SHA.
