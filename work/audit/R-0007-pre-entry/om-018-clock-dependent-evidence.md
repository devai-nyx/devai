---
id: om-018-clock-dependent-evidence
title: Fixture timestamps aging out of freshness windows, and what that means for gate evidence
type: audit-record
status: active
date: 2026-08-03
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-018, work/audit/R-0007-pre-entry/om-018-admission-gate-evidence.json]
---

# Clock-dependent evidence

## What happened

The sixteen-command admission gate was 16/16 green at `00b1fa7`. Three hours later, at
`7996370`, it was red on `ordinary`, `stage2` and `coverage`. The only commits between the two
were audit records changing markdown front matter.

The cause was neither of those commits. A test fixture hard-coded
`timestamp: '2026-07-27T12:00:00.000Z'` and was compared against the real clock with a
168-hour limit. It reported `stale: record is 172.9h old (limit 168h)`. The fixture crossed
its own expiry between the two runs.

A second live case was found by sweeping every hard-coded timestamp under `packages/` and
`tests/`: `2026-07-28T00:00:00.000Z`, at 158 hours, backing `database_updated_at` against
`DEFAULT_DATABASE_MAX_AGE_HOURS = 168` and a sensor `completed_at`. It had roughly ten hours
left and would plausibly have expired during Review Run 2.

Both are repaired: those timestamps are now relative to the real clock. Every other hard-coded
timestamp in the repository is already older than the window and does not fail, which is
evidence it is not compared against one. A re-run of the sweep reports none remaining inside a
window.

## Why this matters beyond the two fixtures

**Gate evidence has a shelf life that nothing declared.** OM-018 says any semantic or
current-tree change invalidates gate evidence. It does not say the evidence can also be
invalidated by the passage of time alone, with no change to the repository at all. That is now
demonstrated: a green sixteen-row run at an exact commit stopped being reproducible at that
same commit, seven days after an unrelated fixture was written.

A reviewer re-running the gate at the attested commit could therefore get a different result
from the attestation, through no fault of either party. That is a real limitation of this
evidence and is stated here rather than discovered by the reviewer.

## What was not done

No control was added. OM-018 freezes the control surface before entry, and a defect found in
proof machinery is to be repaired or deferred, not wrapped in a new gate. A mechanical check
that no fixture compares a hard-coded instant against a relative window belongs in R-0007, and
is recorded here as a deferral rather than built now.

## Standing caution

Any gate attestation in this campaign is reproducible only while no fixture inside it expires.
The two known expiries are repaired. If a future run of the sixteen rows fails on a `stale:`
or `max_age` diagnostic with no intervening commit, this record is the explanation and the
repair is to make the offending fixture relative, not to relax the window.
