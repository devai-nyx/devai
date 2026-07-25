---
id: R-0003-ADR-POPULATION-CORRECTION
title: ADR replacement population contract correction
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [BL-129; Inspector 08025ba; Architect d277b14; R-0003 ordinary floor]
---

# ADR replacement population contract correction

## Verdict

BL-129 is locally closed. The ordinary floor first failed five assertions that retained
the pre-replacement assumption of twelve physical ADR files with every record active.
Those failures were read before the Inspector correction.

Inspector `08025ba` now binds the gapless ADR-001 through ADR-013 roster, thirteen
physical records, twelve active records, ADR-005 terminally superseded by ADR-013, and
the production command's thirteen-file validation result. The contracts retain schema,
filename, provenance, non-empty supersession, and lifecycle checks; no validator or
governance rule is weakened. Architect `d277b14` refreshed and verified the deterministic
repository-reference projection after the role-pure correction.

The complete ordinary `pnpm vitest run` floor then passed. Decision-record integrity had
already passed the rebuilt branch history, proving that the legal topology does not hide
the rejected seal mutations.

## Remaining gates

The final Architect source-closing decision, complete exact-candidate ladder, and fresh
literal `claude-opus-5` read-only PASS remain mandatory before source push. PC-0004 is
not emitted and R-0004 remains dormant.
