---
id: R-0004-SOURCE-CI-REPORTER-PROGRESS-CORRECTION
title: R-0004 source exact-head reporter-progress correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-CI-REPORTER-PROGRESS-FAILURE
superseded_by: null
provenance:
  [
    BL-180; Inspector 6c876f1 and 54e79a1; Engineer d694249; exact repaired snapshot 54e79a1d9b15170b885950c1371758867ac52024,
  ]
---

# R-0004 source exact-head reporter-progress correction

Inspector `6c876f1` reproduced exact-head run `30209278971`'s remaining R20 fingerprint
divergence: CI selected a one-test per-file progress line with a nondeterministic
duration that local non-interactive output omitted. Engineer `d694249` removes only the
exact `tests/fixture.test.ts (1 test) <duration>` presentation line inside deterministic
R20 normalization. Raw sensor output, subprocess status, passed/failed metrics, summary
text, and all other content remain visible. Inspector `54e79a1` records the focused
contract green.

The committed R20 baseline was not recaptured. The complete ladder passed on exact clean
snapshot `54e79a1d9b15170b885950c1371758867ac52024`: T1 passed 71 files / 838 tests, T2
passed 38 files / 240 tests plus one declared skip, root passed 127 files / 1,166 tests
plus eight declared skips, coverage remained 71.23/61.79/77.62/73.25, and all eleven
package dry-runs passed. Formatting, strict governance, and all generated checks were
green.

A new atomic closing decision, a complete ladder, fresh literal `claude-opus-5` review,
and repaired exact-head CI remain mandatory before merge. No external gate moved.
