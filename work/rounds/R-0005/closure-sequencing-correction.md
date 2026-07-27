---
id: R-0005-CLOSURE-SEQUENCING-CORRECTION
title: Closure-only sequencing boundary correction
type: round-correction
status: active
date: 2026-07-27
authority: Architect
supersedes: null
superseded_by: null
provenance:
  - DII-202; DII-203; DII-204; DII-205; R-0005-SOURCE-CLOSE; local closure rehearsal 3c06a3e
---

# Closure-only sequencing boundary correction

## Observed blocker

After source PR 8 merged as `c449710298e2a51e3938d9dcb17b5d03a2823759`
and exact-main CI run `30234222364` passed all nine jobs, the production
`govern phase close` verb emitted the single permitted PC-0006 file in a closure-only
branch. The first post-commit `pnpm run ci:governance` rehearsal rejected local Machine
commit `3c06a3e1026a3c30aa90ef50dcf16fa0facf0392` with
`shape-before-machine-record`: the checker searched only the closure PR's one-commit
range, so it could not see the schema and production verb already merged in ancestry.
The rehearsal branch was never pushed and provides no standing closure.

## Authorized correction

An Inspector contract must establish two repository fixtures:

1. a closure-only range whose immediate base already descends from an Architect schema
   and Engineer production verb, followed only by a Machine record; this must pass; and
2. an ancestry lacking either governed prerequisite; this must continue to fail with
   `shape-before-machine-record`.

The Engineer may then make the sequencer evaluate history strictly before each Machine
record for those two prerequisites. No other sequencing rule, historical exception,
threshold, test, or closure schema may be weakened. Auditor correction evidence and an
independent Codex close review are required before the replacement exact source merge.

## Ceremony boundary

The correction is a source repair within R-0005. Its exact PR head and exact merged main
must each pass all nine CI jobs. Only then may the production close verb regenerate
PC-0006 with the correction merge as `merged_as`; that closure-only PR must independently
pass, merge, and pass final exact-main CI. All external and later-round gates remain
closed.
