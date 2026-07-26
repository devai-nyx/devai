---
id: R-0004-ENTRY-MEASUREMENT
title: R-0004 exact-base entry measurement
type: round-measurement
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; OM-003; PC-0004; DII-162]
---

# R-0004 exact-base entry measurement

## Entry proof

- Exact base and live `origin/main`: `b60b4c52bff1779da84f48edc63cbf34652ab18e`.
- PC-0004 closes R-0003 and binds source merge
  `bbebc54b3948a4dc1d6a095e113d7a7a307bc0f0`.
- Final R-0003 main CI run `30188270499` passed all nine required jobs at the exact
  base.
- The successor had no open pull request and GitHub authentication was valid before
  entry.
- The predecessor remained clean at
  `d76cd12d2241a1a28a32a0fe629c6531da7fe74d` with origin
  `https://github.com/devai-nyx/devai-original.git`. Immutable GitHub object
  `05dd242bf72334bfd683096aed380e8240b6b9aa` resolved without mutating it.
- Cold Corepack prewarm, frozen install, CLI preparation, and the entry Vitest floor
  passed: 124 files, 1,118 tests passed, 8 declared skips.

## Measured populations

The complete machine-readable enumeration is
[`surface-disposition.json`](./surface-disposition.json).

| Population            |                                        Exact base reading |
| --------------------- | --------------------------------------------------------: |
| Public actions        |                        146: 144 supported, 2 experimental |
| Action tiers          |                                34 porcelain, 112 plumbing |
| Action effects        | 83 read, 39 harness-write, 23 local-write, 1 remote-write |
| Live sensors          |                         59: 50 cell-bearing, 9 diagnostic |
| Archived sensor kinds |                                                         5 |
| Canonical schemas     |                                                        54 |
| Public packages       |                                  10 existing; core absent |
| Private packages      |                                                         2 |

Every live action is retained. The 38 pre-collapse per-sensor wrappers are folded into
`sense run <kind>` and `work backlog compact` remains an explicit tombstone with
`work backlog list` migration guidance. No numerical target authorizes deletion.

## Known-red posture

- BL-016: the production effect extractor sees exactly 39 pre-collapse extras.
- BL-027: leaf help still renders group help.
- BL-031: build/test accept caller-supplied command text and are rejected by the host
  boundary; root scripts remain direct.
- BL-065: locale/insertion-order and mirror reproducibility remain incomplete.
- BL-080: repository-reference classification is not yet disposition-derived.
- BL-084: both workflows use mutable `actions/checkout@v4` and
  `actions/setup-node@v4` references.
- BL-008, BL-009, BL-025, BL-028, BL-029, and BL-030 remain absent by their exact
  acceptance contracts.

These are B1 red-first inputs, not waivers. R-0004 claims no publication, deployment,
readiness, evidence promotion, or transferred predecessor standing.
