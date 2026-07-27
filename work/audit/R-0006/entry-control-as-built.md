---
id: R-0006-ENTRY-CONTROL-AS-BUILT
title: R-0006 E0-E5 entry-control as-built
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-207; DII-208; DII-209; OM-010; R-0006-AUTHORIZATION; R-0006 entry-control candidate 0c0da48e25ecbd400dc4b452b0020bf891b87dff,
  ]
---

# R-0006 E0-E5 entry-control as-built

## Boundary and verdict

R-0006 is complete only through its mandatory E0-E5 entry-control prelude at evidence
candidate `0c0da48e25ecbd400dc4b452b0020bf891b87dff`, descended from exact live base
`7cf325625307a630344efe971bceccb011560301`. The prelude implements and accepts
candidate-only Git identity verification, exact-base candidate manifests, two-pass
convergence, the post-PASS review envelope, semantic population checks, and isolated
source/closure rehearsal. The manifest for that exact 22-commit evidence candidate is
schema-valid with digest
`2f45c2c35fbfbe32564fa1e6d44b6eb0b9fea01454b9095cbe2af531a5a99dc6`.

This report is itself part of the later review candidate, so its commit cannot be named
inside itself without circularity. The ignored final manifest must therefore be
regenerated after this Auditor commit and submitted to independent review with the
resulting exact `review_candidate` and digest. No earlier convergence or rehearsal state
may be reused for that later head.

The bounded verdict is **entry-control prelude implemented and locally accepted**.
R-0006 B0 has not begun. No action/output contract inventory, substantive contract or
coverage-depth implementation, threshold or exclusion change, release, publication,
deployment, predecessor mutation, real-stynx mutation, or R-0007+ work occurred.

## Entry evidence

- Live `origin/main`, the governance-alignment merge, and the exact base are
  `7cf325625307a630344efe971bceccb011560301` (PR 11).
- Exact-main GitHub Actions run 30239216258 completed successfully for that SHA.
- PC-0006 closed R-0005 before this prelude, and no pull request was open at entry or at
  this evidence snapshot.
- The dedicated worktree is
  `/Users/aarusso/Development/stech/devaii-wt-r0006-entry-control` on local-only branch
  `codex/r0006-entry-control-prelude-7cf32562`; the stale primary checkout and the
  predecessor checkout were not used for mutation.
- DII-207 binds the base, the execution-contract digest
  `1fd6384fe303d24a329a06b9fe0144f1d8dac1de2dc8e57b52d223f9b4176a64`, plan digest
  `c87ff86156f3d56ede6ee79775255b0c82d0d1112303929bf51c9bc9d2d3d73f`, and
  orchestrator-prompt digest
  `c7b652c7874d53ea9b42687e81a43a36bd3feebd0f63e41b01b47578547853ab`.

## Role-pure commit map

| Stage                 | Role                                       | Exact commits                                                                                                                                                                                                              | Result                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E0                    | Architect                                  | `6f8ee85370690b8aac4ed9d4b57657d98d9cabd2`                                                                                                                                                                                 | DII-207 opened only the entry-control prelude and imposed the B0 stop.                                                                                                                                                              |
| E1                    | Inspector                                  | `0afa4449a134584f0fb704581eb3377032297876`, `2e73c5d9c440ff2a2cf9e8b8c025df1a44ae9948`                                                                                                                                     | Eight behavioral reds plus four schema-roster integration reds were read before implementation.                                                                                                                                     |
| E2                    | Architect                                  | `b53bde0535aa9d61e22ccf08f3ca44f6650e444c`                                                                                                                                                                                 | DII-208, the canonical policy, and the manifest schema govern the controls.                                                                                                                                                         |
| E3                    | Engineer                                   | `77ac7cd2aaf238db96b29ee2430498febc210b14`                                                                                                                                                                                 | Workspace-only close controls, schema roster integration, and the committed policy mirror were implemented.                                                                                                                         |
| E3 evidence           | Auditor + Architect                        | `e0331ba1cf6cd5da48ed656c3b7124cb58448b21`, `6912c11a166e364448cab8f05dc7ea0eca04621b`                                                                                                                                     | Exact red output and prospective sequencing were bound.                                                                                                                                                                             |
| E4 acceptance         | Inspector                                  | `3df91390c8cd878b6960db99007cfdb9b93c3e8b`                                                                                                                                                                                 | Initial acceptance and all requested adversarial classes became green.                                                                                                                                                              |
| E4 convergence repair | Architect + Engineer + Auditor             | `3655fd63921baf1607581d205df3076ff7d8bc40`, `ae68840a11f2caebaacdc774931627ddf712c446`, `23d19a7b494595d6c145f7c3b77a2e4e994a45c8`, `7620947d65d503a3282be47646fae942506212f2`, `1e4374aab7b7b1f16f275c1e89d6e7db18cfc1e0` | The multiline base declaration and stale trace were corrected. The first combined binding at `23d19a7` failed sequencing and was superseded by the exact split binding at `1e4374a`; immutable history is disclosed, not rewritten. |
| E4 closure repair     | Inspector + Auditor + Architect + Engineer | `f9ff51ed2181a9ed2ae09981e2e61e8af5695bbe`, `156fc7f2294e5f1ccb9c4daf23277196e07ac079`, `3f5120886319f6ece4645014d54c2ad02e23cafc`, `848524a509bed3d25867eab347c877803f7ca8ed`, `a8db658e56bd62371ed6824f508f7f6e8e340d22` | DII-209 bound rehearsal to the tracked production phase-close verb; the mirror and sequencing were refreshed.                                                                                                                       |
| E4 freshness repair   | Inspector + Auditor + Engineer + Architect | `1ca2bd61ca2c5b3d8ac14a3bfc68e3bcd11efa31`, `348d8e2f6643b6ae2a10b4e29990f7004c5f0072`, `42060dc4e4095cc4f672dba9257dfda5b1ac28b7`, `0c0da48e25ecbd400dc4b452b0020bf891b87dff`                                             | Candidate manifests now reject convergence or closure evidence generated for any other base/head.                                                                                                                                   |

Every combined-role row is a serial list of single-role commits, never a shared-role
commit.

## Red evidence and implementation

The initial focused command
`pnpm vitest run tests/contract/r0006-entry-control.red.contract.test.ts` exited 1 with
eight of eight contracts failing because the Engineer control script did not yet exist.
After E2, the full floor read 12 expected failures, 1,226 passes, and eight declared
skips: the same eight control reds plus four schema-roster integration reds. These are
preserved in `tests/KNOWN-RED-R0006.md` and
`work/audit/R-0006/red-evidence.json`.

Real-candidate execution later produced two additional honest repair reds. The closure
rehearsal rejected the nonexistent configured verb path, preserved in
`red-evidence-closure-prerequisite.json`; the stale-evidence adversary then proved that
an old convergence/rehearsal state could be reused for a changed head, preserved in
`red-evidence-freshness.json`. Both are green after their exact role-separated repairs.
No declared red remains.

The production implementation is the workspace script
`scripts/run-round-close-controls.mjs`, the canonical
`law/policy/round-close-controls.json`, its byte-identical generated mirror, and the
canonical manifest schema/roster integration. No public action or existing public-action
behavior was added or changed.

## Candidate manifest and isolated clone

For evidence candidate `0c0da48e25ecbd400dc4b452b0020bf891b87dff`:

- exact base: `7cf325625307a630344efe971bceccb011560301`;
- implementation subject, review candidate, and published head:
  `0c0da48e25ecbd400dc4b452b0020bf891b87dff`;
- candidate tree: `48abd6b811dcc822789ba48c262d805a037e1244`;
- governed range: 22 commits, all mapped to exact role/path ownership;
- digest: `2f45c2c35fbfbe32564fa1e6d44b6eb0b9fea01454b9095cbe2af531a5a99dc6`;
- isolated method: bundle-backed, `--no-local`, single candidate branch, no alternates;
- isolated refs: `refs/heads/candidate` and `refs/remotes/origin/candidate` only;
- 290 governed identities were either reachable from candidate-only history or admitted
  by an exact existing SHA/kind/reason/path classification; findings were empty.

The manifest is stored only under ignored
`.devai/state/round-runs/R-0006/close/candidate-manifest.json` and grants no publication,
merge, release, or closure standing.

## Fixpoint, gates, coverage, and rehearsal

The policy-defined convergence command completed two consecutive clean/no-write passes
at exact head `0c0da48e25ecbd400dc4b452b0020bf891b87dff`. On each pass all 15 ordered checks
returned exit 0: repository-wide formatting, preparation, action-registry generation,
trace, repository references, policy materialization, diff check, Stage 1, Stage 2,
T4, T5, T6, changesets, merged T1-T3 coverage, and governance. Both clean-before and
clean-after readings were true.

The ordinary floor is 134 files passing, 1,245 tests passing, eight declared skips, and
zero failures. Coverage retains the unchanged 70/60/70/70 floors:

| Metric     | Reading | Floor |
| ---------- | ------: | ----: |
| Statements |  72.42% |   70% |
| Branches   |  62.36% |   60% |
| Functions  |  78.07% |   70% |
| Lines      |  74.52% |   70% |

The exact-head isolated rehearsal produced non-standing source merge `796c3585f408…`
and closure-only descendant `09cb971a5e5a…`. The closure schema resolves at ancestor
`4cbb686dab0fc75d8f3554c35ad5b28962f6e2c8`; the production verb resolves at ancestor
`f9b44082dc2365722748ff71246c0d616b79a4e7`. The disposable refs and bytes were removed
and grant no standing.

## Remaining limit and nonclaims

The independent read-only review has not yet been recorded. This Auditor commit must be
included in a fresh exact-head rehearsal, convergence reading, and manifest before that
review begins. After review, the only potentially valid envelope is exactly one
`DEVAI Auditor` commit at `work/audit/R-0006/independent-review.md`; the current policy
admits no projection ID. Any semantic, implementation, test, current-documentation,
as-built, source-close, or closing-decision change after PASS invalidates it and requires
a new cycle and fresh review.

This report does not claim R-0006 contracts or coverage work is implemented. It does not
claim B0 started, source closure, PC-0007, publication, merge, exact-main CI for this
local candidate, release, deployment, package publication, tag, GitHub Release, Pages,
real-stynx mutation, predecessor mutation, R-0007+ work, or production readiness.
