---
id: R-0003-FORMATTING-CONTRACT-FAILURE
title: Exact-candidate formatting exclusion contract failure
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate ef50b8b; Stage 2 T2; BL-130; BL-131]
---

# Exact-candidate formatting exclusion contract failure

The restarted ladder at `ef50b8bf23861f81ea3fc93c219a2b763acf1e17` passed Stage 1
and T1, then stopped in T2 because the exact global formatting-exclusion contract did
not yet include `work/rounds/R-0003/reviews/`. No later gate or Opus review ran.

BL-131 governs the Inspector correction. The contract must add exactly that one path in
its repository order while retaining every prior exclusion. The separate exact-byte
review contract must remain green, so this correction cannot authorize formatting or
content mutation of REV-0001, REV-0003, or REV-0006.
