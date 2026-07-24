---
id: R-0002-OPENING-AUDIT
title: R-0002 immutable opening-state observation
type: audit-report
status: active
date: 2026-07-24
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-105; OM-002; immutable devai-original objects at 05dd242bf72334bfd683096aed380e8240b6b9aa; GitHub run 30133847762,
  ]
---

# R-0002 immutable opening-state observation

## Boundary

This is an Auditor observation after DII-105 and before implementation. It ratifies
nothing, releases nothing, transfers no evidence standing, and authorizes no mutation
of the frozen predecessor or real stynx.

## Successor opening identity

- Source base and live `origin/main`:
  `cc0084ba38fb6d583f79fddd38554524714c4fa4`.
- Owner-directed prepared execution head:
  `5afdbfea99368d917c1ed9bc9e19404fcf3d7cc1`.
- Opening declaration commit:
  `d528c06420b398ed82b20649db71fac9d91638ae`.
- The prepared worktree and primary checkout were clean at their opening boundaries.
- The successor host is public, unarchived, and named `devai-nyx/devai`; its default
  branch is `main`.
- Successor GitHub Pages is absent: the Pages API and
  `https://devai-nyx.github.io/devai/` both return 404.

## Frozen predecessor re-derivation

Terminal values were read from immutable GitHub objects, never from the stale local
checkout:

| Fact                              | Re-derived value                                                   |
| --------------------------------- | ------------------------------------------------------------------ |
| Final commit                      | `05dd242bf72334bfd683096aed380e8240b6b9aa`                         |
| Final tree                        | `a6d6bf5ba06d78e182792441dffac4ae554b684c`                         |
| Closing decision                  | `D-196`                                                            |
| Closing record                    | `PC-0019`                                                          |
| Release disposition               | `none-needed`                                                      |
| Evidence-chain internal head      | `d0c5b9ac2da64fb2e3533317abcc65511b593c3e610d301c60504cc8deddc9c4` |
| Evidence-chain whole-file SHA-256 | `8ae98775e373617f814e2e7bd3d2616f7664a90f761442b45d5b205537984fb1` |
| Absorption-manifest SHA-256       | `c406f7b419b59f8d122fc4bdd8882210fa3a821b324242790388f46bd0f0a4c1` |
| Coupling-review SHA-256           | `b73d0e196a74d31f3a960f5a4b8f1d946453ef6a3c828ce7ea7a53292bce6942` |

The repository is public, archived, and renamed
`devai-nyx/devai-original`. Its Pages site is built at
`https://devai-nyx.github.io/devai-original/` and returns HTTP 200. The local
`../devai` checkout remains clean at
`d76cd12d2241a1a28a32a0fe629c6531da7fe74d`, with origin
`https://github.com/devai-nyx/devai-original.git`; it was not fetched or modified.

## BL-002 disposition

D-196 item 9 and PC-0019 agree that the pending predecessor changeset was retired
without a predecessor release. No 0.9.0 or 1.0.0 predecessor release was created.
BL-002 is therefore verified complete with disposition `none-needed`; it requires no
predecessor implementation.

## BL-003 disposition and residuals

Verified completed host acts:

- the predecessor is renamed `devai-original`;
- the successor owns `devai`;
- the predecessor is archived;
- its frozen Pages surface is built and returns 200;
- the successor link is part of the frozen source contract.

Verified residuals:

- the former `/devai/` Pages path returns 404 rather than redirecting;
- the successor has no Pages deployment yet;
- the successor History/hash publication remains BL-021;
- the successor genesis attestation remains provisional until BL-001 closes.

These residuals do not reopen the frozen predecessor and do not authorize a new tag or
site mutation there.

## Opening reds

Exact PR run `30133847762` at prepared head `5afdbfea...` passed evidence-mode,
Stage 1, and changeset classification. Stage 2 failed because a cold Corepack download
notice for fixture-pinned `pnpm@10.0.0` entered the skill behavior signature; Stage 3
was skipped. An isolated empty `COREPACK_HOME` reproduced the same diff locally. This
is BL-046 and is not an allowed merge red.

The local baseline remains 812 passed and 8 skipped before DII-105. DII-105 then
advanced the parsed decision population from 107 to 108, exposing exactly two
Inspector-owned maintained-count assertions. Those two failures are the B0
BL-007-known-red and must become gapless derived guards in B2.

BL-017 remains a separate release-blocking coverage red at the unchanged
70/60/70/70 floors. Production ADR, glob-guard, and trace commands remain the scoped
BL-007/BL-014 opening reds; no opening observation relabels them green.

## Auditor conclusion

R-0002’s immutable entry facts agree with OM-002 and DII-105. BL-002 may close as
verified `none-needed`; BL-003 may close with the residuals above. BL-046, BL-001,
BL-007, BL-012–014, BL-023, BL-047–049, and the temporary decision-count guard red
remain to be resolved in the round. The claims ceiling remains: re-bind preparation
only; nothing ratified, released, ready, or promoted.
