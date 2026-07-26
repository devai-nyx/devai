---
id: R-0004-SOURCE-CI-ANSI-FAILURE
title: R-0004 source exact-head ANSI summary failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [PR #6; exact head 1eed4022c06f9bfb682d820caa4755d7a29c3710; GitHub Actions run 30206695586; BL-180]
---

# R-0004 source exact-head ANSI summary failure

Source PR #6 ran CI on exact head
`1eed4022c06f9bfb682d820caa4755d7a29c3710`. Stage 1, Changesets, fail-closed evidence,
and governed-repository enforcement passed. Stage 2 failed one T2 contract:
`packages/skills/tests/contract/skills-fingerprint-behavior.test.ts`.

The hermetic fixture's Vitest subprocess passed one test but emitted ANSI SGR reporter
codes in GitHub Actions. Production `senseTest` matched the raw string with a color-blind
summary regex, recorded `tests_passed: 0`, and caused the behavior signature to differ
from the valid one-pass baseline. The evidence head remained truthful; metric extraction
was environment-dependent. Local uncolored output had masked the defect.

BL-180 governs a red-first Inspector case and a narrow Engineer parser repair. No
baseline recapture, skip, threshold change, assertion weakening, merge, closure record,
publication, release, deployment, or real-stynx action is permitted until the repaired
exact source head passes all required CI.
