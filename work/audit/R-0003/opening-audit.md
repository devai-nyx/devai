---
id: R-0003-OPENING-AUDIT
title: Independent R-0003 founding-ratification entry audit
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    PC-0003; immutable predecessor objects at 05dd242bf72334bfd683096aed380e8240b6b9aa; GitHub Actions run 30173550074,
  ]
---

# R-0003 opening audit

## Independent boundary

This observation was re-derived after R-0002 closed. It does not adopt R-0002's own
conclusion as evidence, does not ratify any law, and authorizes no release, deployment,
publication, readiness claim, evidence promotion, or predecessor mutation.

The successor base is clean at
`1c3d239e8b46f57c23cd7c4e9f6cc63262b1ba8d`, equal to live `origin/main`, with zero
open pull requests. The dedicated R-0003 worktree was created from that exact commit.

## Frozen predecessor re-verification

The predecessor was read only through immutable GitHub objects. Its local checkout was
observed clean at the opening absorption pin
`d76cd12d2241a1a28a32a0fe629c6531da7fe74d`, with origin
`https://github.com/devai-nyx/devai-original.git`; it was not fetched or modified.

| Fact                         | Fresh observation                                                   |
| ---------------------------- | ------------------------------------------------------------------- |
| Repository                   | `devai-nyx/devai-original`; public, archived, default branch `main` |
| Terminal commit              | `05dd242bf72334bfd683096aed380e8240b6b9aa`                          |
| Terminal tree                | `a6d6bf5ba06d78e182792441dffac4ae554b684c`                          |
| Closing decision             | `D-196`, status `locked`                                            |
| Closing record               | `PC-0019`, round `round-31`                                         |
| Release disposition          | `none-needed`                                                       |
| Evidence-chain records       | 157                                                                 |
| Evidence-chain internal head | `d0c5b9ac2da64fb2e3533317abcc65511b593c3e610d301c60504cc8deddc9c4`  |

The immutable predecessor objects independently hash to:

- absorption manifest:
  `c406f7b419b59f8d122fc4bdd8882210fa3a821b324242790388f46bd0f0a4c1`;
- coupling re-verification:
  `b73d0e196a74d31f3a960f5a4b8f1d946453ef6a3c828ce7ea7a53292bce6942`;
- evidence-chain whole file:
  `8ae98775e373617f814e2e7bd3d2616f7664a90f761442b45d5b205537984fb1`.

Every value agrees with the successor genesis attestation. That attestation is still
unratified (`ratified: null`), names the frozen predecessor repository, and imports no
evidence standing.

## R-0002 closure re-verification

Machine record `PC-0003` is present and schema-valid. It closes R-0002 under DII-105
and DII-147, binds exact source merge
`3d111a8cb571b289cee03ae78faa173ca327ae3a`, and records
`none-preratification`. Its SHA-256 is
`3471b9205b75565769dea7a2a205c808ed5933ee9253144f099c8753de91d1d0`.

The append-only predecessor records remain unchanged:

- PC-0001:
  `56f8d37868ec72ca9b16f22e3f1d74fd2098b2c050f73a230a9c147c250bfad9`;
- PC-0002:
  `b1d4ce8873272149d61de4eb71776c985b4d41c3086ddb7efed89550a1354135`.

Final R-0002 closure merge `1c3d239e8b46f57c23cd7c4e9f6cc63262b1ba8d` passed exact-main CI run
`30173550074`. Evidence mode, Stage 1, governance, changesets, Stages 2–3, and T4–T6
all completed successfully for that exact SHA. No release workflow has run in the
successor.

## Fresh production gates

At the exact R-0003 base:

- `pnpm run devai:prepare` passed;
- the complete Vitest floor passed: 121 files, 1,097 tests, 8 declared skips;
- strict forbidden-action policy, decision integrity, decision citation resolution,
  trace resolution, and docs drift passed;
- trace resolution found 34 invariants, 121 executable tests, and zero unresolved,
  missing, or untraced entries;
- merged T1+T3 coverage passed 79 files / 869 tests with 7 declared skips;
- coverage remained above the unchanged floors: statements 70.61%, branches 61.00%,
  functions 77.27%, lines 72.88%.

The canonical and materialized authority policy are byte-identical at SHA-256
`4b423cad058257d6a1302646c202d653dd3ab9934274c831b1471dfc708a5066` and bind the
current candidate Constitution digest
`d1dd4858cf48ca14597d3a0d9f70fe8fbda01cc69a019c7e210b46e40bda3763`.

## Entry verdict

R-0002 is independently closed and green. Frozen bindings agree, the successor has no
ratification or release standing yet, and all R-0003 entry gates are satisfied.
R-0003 may begin the founding-law ceremony under its granted authorization. The only
possible new claim at its close is founding law ratified.
