---
id: R-0003-FORMATTING-CORRECTION
title: Exact-candidate formatting correction
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: R-0003-FORMATTING-FAILURE
superseded_by: null
provenance: [BL-130; R-0003-FORMATTING-FAILURE; Engineer b45073a]
---

# Exact-candidate formatting correction

## Verdict

BL-130 is locally closed. Engineer `b45073a` formatted the live production parser and
added only `work/rounds/R-0003/reviews/` to the formatting exclusions. Repository-wide
Prettier now passes.

The exclusion is bounded to the three durable review copies already hash-bound by
`R-0003-REV-PROVENANCE-MANIFEST`. Their exact-byte contract passes after the change;
none of REV-0001, REV-0003, or REV-0006 was modified. The parser's focused tests also
pass. The deterministic repository-reference projection remains a separate Architect
refresh because this Auditor evidence changes locators.

The repaired candidate still requires a final source-closing decision, a complete exact
ladder restart, and a fresh literal `claude-opus-5` PASS before source push. No gate,
coverage floor, assertion, release boundary, or evidence standing is weakened.
