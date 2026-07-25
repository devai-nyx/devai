---
id: R-0003-ADR-SEAL-FAILURE
title: Exact-candidate ADR seal failure
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [DII-153 candidate 46535a3; R-0003 exact local ladder; BL-128]
---

# Exact-candidate ADR seal failure

The exact local ladder stopped during decision-record integrity at candidate
`46535a3c8939aad7a2bbc8fce981bdcc48757e54`. Seven active ADRs differed from their
sealing commits. The guard emitted `DECISION_LOCKED_BODY_MUTATED` for ADR-002, ADR-003,
ADR-005, ADR-007, ADR-008, ADR-010, and ADR-011. No later stage ran and no source push
occurred.

BL-128 governs the correction. Six records changed only because their pre-existing
semicolon-delimited `supersedes` values were normalized after sealing. Their sealed
bytes must be restored; the production parser must interpret the preserved delimiter.
ADR-005 also contains the confirmed false live workflow path, so it must transition
terminally to `superseded` and a new gapless ADR must carry the corrected active rule
set. No locked body may be silently rewritten.

This failure changes no doctrine, release state, readiness, evidence standing, or
coverage threshold. DII-153 is not a source-close authorization until a superseding
decision binds the legal correction and a new exact ladder and Opus review pass.
