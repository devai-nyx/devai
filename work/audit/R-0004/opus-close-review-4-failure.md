---
id: R-0004-OPUS-CLOSE-REVIEW-4-FAILURE
title: R-0004 final exact-candidate Opus close-review failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-OPUS-CLOSE-REVIEW-4-CORRECTION
provenance: [Claude Opus 5 read-only review of dfa56594d38ac2c7ccd59bdc8890f59d3c01b02b; BL-167–169]
---

# R-0004 final exact-candidate Opus close-review failure

The mandated read-only review used literal `claude-opus-5` with no fallback and returned
`VERDICT: FAIL` on exact clean candidate
`dfa56594d38ac2c7ccd59bdc8890f59d3c01b02b`. It independently reproduced the complete
green ladder and claim boundary, then found that BL-164's new parity guard compared
command names against public `action_id` instead of `internal_binding`. It asserted only
24 of 147 keep entries and missed four stale command-description literals, including the
governed schema-canon description.

The review also found stale known-red coverage, a machine-unresolvable multi-source
`supersedes` delimiter, an unpaired governance-range correction, stale audit decision
provenance, stale surface-contract provenance, and an understated test-action sentence.
BL-167 through BL-169 govern all findings, including the advisory record gaps.

No source push, PR, publication, release, deployment, real-stynx write, or later-round
activation occurred. Red-first role-pure repair, a complete ladder restart, and a fresh
exact-candidate Opus 5 PASS remain mandatory.
