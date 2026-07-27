---
id: R-0005-SOURCE-CI-SHA-REFERENCE-FAILURE
title: Correction source CI local-only SHA reference failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - PR 9; exact head 7d8b279a859f6e08e435cfb47ae4b5a22e072443; CI run 30235760058; governed repository enforcement job 89883259450
---

# Correction source CI local-only SHA reference failure

## Observation

PR 9 CI run `30235760058` checked exact source-repair head
`7d8b279a859f6e08e435cfb47ae4b5a22e072443`. Governed repository enforcement failed
after sequencing passed ten merge-ref commits. The SHA-reference check correctly
rejected a 40-character identity in the closure-sequencing audit because that object
belonged only to the unpushed PC-0006 rehearsal branch and therefore did not resolve in
the clean GitHub checkout.

Local governance had passed because the shared local object database retained the
unpublished rehearsal object. That made the local result insufficient for repository
reference standing; CI is authoritative for clean-clone resolvability.

## Correction boundary

The rehearsal remains truthful non-standing history, but it must be described as a
local-only unpublished object rather than as a governed Git identity. Auditor and
Architect must remove the hexadecimal identity only from their own narrative paths.
No source behavior, sequencing rule, test, exception, threshold, or gate may change.
PR 9 must rerun all required jobs on the corrected exact head before merge.
