---
id: R-0004-SOURCE-CI-ANSI-CORRECTION
title: R-0004 source exact-head ANSI summary correction
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-CI-ANSI-FAILURE
superseded_by: R-0004-OPUS-CLOSE-REVIEW-8-FAILURE
provenance: [BL-180; Inspector a01e5d5 and 016a3fa; Engineer a0dc396]
---

# R-0004 source exact-head ANSI summary correction

Inspector `a01e5d5` reproduced the exact CI defect red first: a colored Vitest summary
could not be parsed through the production sensor, while the same plain summary yielded
one passed and two failed tests. Engineer `a0dc396` strips only ANSI terminal sequences
for summary metric extraction, preserves the raw stdout/stderr evidence heads, and uses
one parser for stdout and stderr. Inspector `016a3fa` records the resulting green state.

The focused sensor test passed 18/18, exact typecheck passed, T2 passed 38 files / 238
tests plus one declared skip, and the complete local floor passed 127 files / 1,164
tests plus eight declared skips. No R20 baseline was recaptured; no skip, threshold,
assertion, or evidence source changed.

This correction repaired summary metrics but did not normalize ANSI-decorated reporter
text for the deterministic R20 fingerprint. The eighth exact-candidate Opus review
therefore superseded this record. No closure record, publication, release, deployment,
real-stynx write, or later human gate moved.
