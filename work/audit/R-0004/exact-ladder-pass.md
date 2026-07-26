---
id: R-0004-EXACT-LADDER-PASS
title: R-0004 exact-candidate ladder pass
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [R-0004-AS-BUILT; DII-181; source snapshot 6116635a2e565c974e28b7dec5a4f664a97b6cb7]
---

# R-0004 exact-candidate ladder pass

The complete local R-0004 exit ladder passed on exact source snapshot
`6116635a2e565c974e28b7dec5a4f664a97b6cb7` with a clean worktree.

- workflow lint: 2 workflow files passed;
- action registry: 3 generated views reproduced byte-for-byte;
- contract trace: 34 invariants bound 127 tests;
- repository references: 164 classified references reproduced;
- lint, typecheck, recursive build, Changesets status, formatting, and strict governance:
  passed; strict governance reported zero forbidden-action findings;
- T1: 71 files / 834 tests;
- T2: 38 files / 232 passed / 1 declared skip;
- T3: 9 files / 56 passed / 7 declared skips;
- T4: 2 files / 4 tests;
- T5: 6 files / 25 tests;
- T6: 1 file / 3 tests;
- merged T1+T3 coverage: 80 files / 890 passed / 7 declared skips, with statements
  71.21%, branches 61.78%, functions 77.61%, and lines 73.23%;
- root `pnpm run test`: 127 files / 1,154 passed / 8 declared skips;
- all eleven public packages passed `npm pack --dry-run --ignore-scripts --json`.

No threshold, test source set, skip, assertion, waiver, or governance gate was weakened.
The package commands were dry-runs only: no archive was created and no publish, tag,
release, deployment, real-stynx write, or external R-0008 through R-0010 action ran.

This report admits the local ladder only. The literal `claude-opus-5` read-only close
review and the source and closure-only PR ceremonies remain required.
