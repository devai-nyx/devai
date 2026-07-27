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
    DII-207; DII-208; DII-209; DII-210; OM-010; R-0006-AUTHORIZATION; pre-as-built evidence head f7b7b856b68aac51b43a189a4abdd0b70efbacd6,
  ]
---

# R-0006 E0-E5 entry-control as-built

## Historical E5 boundary and verdict

At this E5 checkpoint, R-0006 remained bounded to its mandatory E0-E5 entry-control prelude. At the exact
pre-as-built evidence head `f7b7b856b68aac51b43a189a4abdd0b70efbacd6`, descended
from exact base `7cf325625307a630344efe971bceccb011560301`, the prelude has
implemented and tested candidate-only Git identity verification, exact-range candidate
manifests, exact-head two-pass convergence, manifest-bound review envelopes, evaluated
semantic populations and mirrors, and production phase-close rehearsal in a disposable
candidate-only clone.

The bounded verdict at this checkpoint was **entry-control prelude implemented and
locally accepted, pending a fresh exact-candidate manifest and independent Opus PASS**. The first required
`claude-opus-5` review returned FAIL at candidate
`fcbeb2b69621d8de32fe90f34b8a1e1dbbb54cef`; its four P1 findings are repaired by
Auditor `ce0bca412243cbb9d4bcc1fd10bd080d865018ab`, Inspector
`f7b7b856b68aac51b43a189a4abdd0b70efbacd6`, and this refreshed E5 observation.
That FAIL grants no retained review standing.

This report is itself part of the next review candidate, so its own commit identity
cannot be embedded in its bytes without circularity. The exact review candidate, tree,
range, identity population, two-pass readings, rehearsal identities, and manifest digest
must be derived after this Auditor commit and supplied to a fresh read-only Opus review.
No state for an earlier head may be reused.

R-0006 B0 had not begun at this checkpoint. No action/output inventory, substantive
action contract, operational-value extraction, mutation-strength work, evidence
aggregation, or coverage-depth work was part of E0-E5. The later exact-candidate PASS
in `work/audit/R-0006/independent-review.md` closed this entry gate; subsequent B0-B9
work does not change the historical scope of this report.

## Entry evidence

- Live `origin/main` and the governance-alignment merge were revalidated at entry as
  `7cf325625307a630344efe971bceccb011560301` from merged PR 11.
- Exact-main GitHub Actions run 30239216258 passed that same SHA; PC-0006 had already
  closed R-0005; no pull request was open at entry.
- Work used only dedicated worktree
  `/Users/aarusso/Development/stech/devaii-wt-r0006-entry-control` on local-only branch
  `codex/r0006-entry-control-prelude-7cf32562`.
- The primary checkout remained untouched. The predecessor `../devai` remained
  read-only and was not fetched, configured, checked out, or modified.
- DII-207 binds execution-contract digest
  `1fd6384fe303d24a329a06b9fe0144f1d8dac1de2dc8e57b52d223f9b4176a64`, plan digest
  `c87ff86156f3d56ede6ee79775255b0c82d0d1112303929bf51c9bc9d2d3d73f`, and
  orchestrator digest
  `c7b652c7874d53ea9b42687e81a43a36bd3feebd0f63e41b01b47578547853ab`.

## Role-pure implementation and repair ladder

The exact pre-as-built range contains 34 commits. Every commit is single-role and every
path is authorized for its author role. The principal stages are:

| Stage                             | Role                                      | Exact commits                                                                                 | Result                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E0                                | Architect                                 | `6f8ee85370690b8aac4ed9d4b57657d98d9cabd2`                                                    | DII-207 opened only E0-E5 and imposed the B0 stop.                                                                                                                                   |
| E1                                | Inspector                                 | `0afa4449a134584f0fb704581eb3377032297876`, `2e73c5d9c440ff2a2cf9e8b8c025df1a44ae9948`        | Initial behavioral and schema-roster reds were read before implementation.                                                                                                           |
| E2                                | Architect                                 | `b53bde0535aa9d61e22ccf08f3ca44f6650e444c`                                                    | DII-208, canonical policy, and manifest schema established semantics.                                                                                                                |
| E3                                | Engineer                                  | `77ac7cd2aaf238db96b29ee2430498febc210b14`                                                    | Close-control script, schema roster, and policy mirror were implemented.                                                                                                             |
| E4 initial acceptance and repairs | Inspector, Auditor, Architect, Engineer   | `3df91390c8cd878b6960db99007cfdb9b93c3e8b` through `0c0da48e25ecbd400dc4b452b0020bf891b87dff` | Acceptance, materialization, production-verb binding, and stale-state rejection became green through serial role-pure commits.                                                       |
| First E5 observation              | Auditor                                   | `2f423bbde5dab29840561f6b23b2d4f92e89e024`                                                    | Recorded the first candidate; later review findings made its current-value claims historical.                                                                                        |
| Codex review repair red/evidence  | Inspector, Auditor                        | `ea00313bd8552389c4bd8608c6f8e7e6b4952af7`, `17696cee9deced9a0c771172150f5e25e9c9c9fa`        | Six P1 classes were preserved as seven focused reds and an immutable diagnostic FAIL.                                                                                                |
| DII-210 repair                    | Inspector, Architect, Engineer, Architect | `ba6a9034398450cc14cccf7694d8268648641bfd` through `fcbeb2b69621d8de32fe90f34b8a1e1dbbb54cef` | Review identity, exact-head convergence, ordinary gates, forged state, production rehearsal, semantic populations, and all mirrors were governed, implemented, and sequencing-bound. |
| Mandatory Opus FAIL and repair    | Auditor, Inspector                        | `ce0bca412243cbb9d4bcc1fd10bd080d865018ab`, `f7b7b856b68aac51b43a189a4abdd0b70efbacd6`        | The literal Opus FAIL was preserved; the population tautology, missing branch adversaries, and tracked green disposition were repaired.                                              |

The invalid combined binding at `23d19a7b494595d6c145f7c3b77a2e4e994a45c8`
remains immutable and was superseded by the exact split binding at
`1e4374aab7b7b1f16f275c1e89d6e7db18cfc1e0`. History was not rewritten.

## Red evidence and disposition

The initial focused E1 command exited 1 with eight behavioral failures. After E2, the
full floor exposed the same eight plus four expected schema-roster integration failures:
12 failed, 1,226 passed, and eight declared skips. Later real-candidate execution
preserved red evidence for the closure prerequisite and stale state.

The first independent Codex review added seven focused repair reds at exact Inspector
`ea00313bd8552389c4bd8608c6f8e7e6b4952af7`; Auditor evidence digest
`bea949a59118cce5b4b721777793d6d872ef1140fda207eb05365fd0d10d5a01`
is bound to Engineer implementation `0e7f2240b9a10c2e864e5f08749be786c5f7e505`
through DII-210 and the sequencing registry.

The mandatory Opus review then found a tautological population assertion and absent
negative tests. Inspector `f7b7b856b68aac51b43a189a4abdd0b70efbacd6`
replaced the tautology with independent filesystem/ROSTER/tracked-path populations and
added adversaries for workspace drift, coverage-byte drift, result drift,
caller-selected reviewed identity, and range-check rejection. The exact combined
focused command passes 46 tests across two files. The full ordinary floor immediately
before that Inspector commit passed 134 files, 1,254 tests, and eight declared skips.
No declared red remains, and no test, assertion, threshold, or source set was weakened.

## Last complete candidate proof and required refresh

The last complete two-pass candidate proof was generated at exact head
`fcbeb2b69621d8de32fe90f34b8a1e1dbbb54cef` before the Opus review:

- manifest digest:
  `b9bdd01306e29c1aaa6d1f41b8f401edd05eca92cbaee6716e9b0dd8c07f22ec`;
- candidate tree: `cad789666ad193f4eb7e658312c56f3bfd1c9d9e`;
- 32 role-pure commits and 313 candidate-only identities;
- bundle-backed `--no-local` single-branch clone, no alternates, and only candidate plus
  origin/candidate refs;
- two passes of all 16 ordered gates, including ordinary `pnpm vitest run`, with exact
  HEAD unchanged, clean boundaries, equivalent ordered outcomes, identical coverage
  digest `fca78ab04c51d3e03b88cbc2f7e006c83a625cb53ee7e865e1781a268fa09343`,
  and identical relevant-workspace digest
  `9662aa11670a34c60921287590f9fa00fa2662b8402410fd0e6e6d141d8c9241`;
- unchanged coverage readings: statements 72.42%, branches 62.36%, functions 78.07%,
  and lines 74.52%, above the 70/60/70/70 floors;
- production phase-close rehearsal source merge `6042ac46b86f…` and exact closure-only
  Machine descendant `4d673094010b…`, with schema ancestor
  `4cbb686dab0fc75d8f3554c35ad5b28962f6e2c8`, verb ancestor
  `f9b44082dc2365722748ff71246c0d616b79a4e7`, schema validation, and a successful
  production sequencing check over exactly one commit.

Those values are historical evidence, not the final candidate claim: the Opus FAIL,
Inspector repairs, and this refreshed as-built invalidate that head's ignored state.
After this commit the exact fresh sequence is mandatory: two convergence passes,
production rehearsal, deterministic manifest, literal `claude-opus-5` review, and only
then an exact review envelope if PASS.

## Nonclaims and stop

This historical E5 report did not itself claim an independent PASS, a valid review envelope, source closure,
PC-0007, push, PR, merge, exact-main CI for this local branch, publication, package
release, tag, GitHub Release, Pages deployment, production readiness, evidence reuse or
promotion, real-stynx mutation, predecessor mutation, or R-0007+ work. B0 through B9
were blocked at this checkpoint and could begin only after the separately recorded E5
PASS. That stop was honored before later R-0006 execution began.
