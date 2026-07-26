---
id: R-0004-EXACT-LADDER-PASS
title: R-0004 exact-candidate ladder pass
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0004-AS-BUILT; R-0004-OPUS-CLOSE-REVIEW-4-CORRECTION; source snapshot fd8c8b68e05f2fc7a305b6403373f2820d9b64bc,
  ]
---

# R-0004 exact-candidate ladder pass

The complete local R-0004 exit ladder passed on exact source snapshot
`fd8c8b68e05f2fc7a305b6403373f2820d9b64bc` with a clean worktree.

- workflow lint: 2 workflow files passed;
- action registry: 3 generated views reproduced byte-for-byte;
- contract trace: 34 invariants bound 127 tests;
- repository references: 164 classified references reproduced;
- lint, typecheck, recursive build, Changesets status, formatting, and strict governance:
  passed; strict governance reported zero forbidden-action findings;
- T1: 71 files / 837 tests;
- T2: 38 files / 238 passed / 1 declared skip;
- T3: 9 files / 56 passed / 7 declared skips;
- T4: 2 files / 4 tests;
- T5: 6 files / 25 tests;
- T6: 1 file / 3 tests;
- merged T1+T3 coverage: 80 files / 893 passed / 7 declared skips, with statements
  71.21%, branches 61.79%, functions 77.61%, and lines 73.23%;
- root `pnpm run test`: 127 files / 1,163 passed / 8 declared skips;
- all eleven public packages passed `npm pack --dry-run --ignore-scripts --json`.

No threshold, test source set, skip, assertion, waiver, or governance gate was weakened.
The package commands were dry-runs only: no archive was created and no publish, tag,
release, deployment, real-stynx write, or external R-0008 through R-0010 action ran.

This report admits the local ladder only. The literal `claude-opus-5` read-only close
review and the source and closure-only PR ceremonies remain required.
