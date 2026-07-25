---
id: R-0002-AS-BUILT
title: R-0002 frozen re-bind and operational-law repair as built
type: audit-report
status: active
date: 2026-07-24
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-105; OM-002; R-0002-OPENING-AUDIT; R-0002-PLAN; immutable predecessor objects at 05dd242bf72334bfd683096aed380e8240b6b9aa,
  ]
---

# R-0002 frozen re-bind and operational-law repair as built

## Audit boundary

This report observes the source candidate through
`3f2275bb54086b5882cae3662899fceac6b56b3a`. The later Architect closing
decision, source merge, exact-main observation, and machine closure record are part of
the two-PR close and therefore were not predicted by the initial B8 observation.
Post-review corrections discovered by the literal shared exit floor are appended
below through closure-validation candidate
`5d614680cf2c984290a8dac1cb0255a358758f90`.

The round re-binds frozen predecessor truth and repairs the scoped operational
contracts. It ratifies nothing, releases nothing, deploys nothing, and transfers no
readiness or evidence standing.

## Immutable bindings

The values below were re-read from immutable predecessor sources during the opening
audit and agree with the frozen successor attestation:

| Fact                              | Observed value                                                     |
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

`law/register/attestation/genesis-attestation.json` now binds those values, the
immutable predecessor repository identity, `frozen: true`, and `ratified: null`.
The attestation remains draft and imports no evidence.

The local predecessor checkout was observed clean at
`d76cd12d2241a1a28a32a0fe629c6531da7fe74d`; it was neither fetched nor modified.

## Batches and role attribution

| Batch         | Role                             | Commits and observed result                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0            | Architect                        | `d528c06420b398ed82b20649db71fac9d91638ae` declared the exact base, scope, claims ceiling, and opening reds.                                                                                                                                                                    |
| B1            | Auditor                          | `3d8d899ae08dbb0378cdfe930d314c7ad994edd7` independently recorded the immutable and host opening state.                                                                                                                                                                         |
| B2            | Inspector                        | `69caf2bfce5ab45cf53dd2fffb5f0590c49af27f`, `b1fa018ba11cc76570a0545f1e9e2edadcd827ed`, and `902938ae8cabf111060b2cb1f7f15b7f455ab595` established and corrected the red-first contracts without changing production behavior.                                                  |
| B3            | Engineer                         | `f9b44082dc2365722748ff71246c0d616b79a4e7` made Corepack prewarming and closure validation deterministic and established the managed-runtime ignore boundary.                                                                                                                   |
| B4–B5         | Architect / Engineer / Inspector | `f5c27ee2b3ff1b8ec5d9f8443fc2a13e3a7c00a5`, `68757da4d0879734c5bae958fc361fcd89007660`, `7a6c4d675735a2761ac3d681112adecfbdbeca28`, and `92385432ba79c378e40096105d3c86209da3e2c4` re-bound law, materialized operational policy and trace, and replaced the scoped known reds. |
| B5 correction | Inspector / Engineer / Architect | `c98531149ffc9781307ae89c526e9a9cafe3a2ac`, `019b86446025247146b013ebdcef3eed92dcf4de`, and `95b1aaf747e8cde561f59e1fda977bb04632b8a4` exposed and then authorized the canonical machine-proof path through a role-pure red-first sequence.                                     |
| B6            | Machine / Inspector              | `bec810bb38e74ebdf0bd31ec3ee90aa0b186d1ed` emitted PC-0002 through the production closure verb; `ab1ef5a2338f76d04fa2af383e51839ecc9a4d9f` verifies append-only supersession and ledger selection.                                                                              |
| B7            | Inspector / Engineer             | `429e89d063500523ca45e84113c6f62c2c69a492` kept the new contract lint-clean; `3f2275bb54086b5882cae3662899fceac6b56b3a` repaired candidate-Constitution version parsing exposed by the production T1 gate.                                                                      |

## Scoped backlog reconciliation

| Item   | R-0002 disposition                                              | Acceptance evidence or explicit residual                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BL-001 | Closed for frozen re-bind.                                      | The schema-valid genesis attestation contains the exact final commit, tree, chain head, closing decision/record, three immutable document digests, `frozen: true`, and `ratified: null`. Ratification remains BL-004/R-0003.                                                                                                                                                                                        |
| BL-002 | Closed `none-needed`.                                           | D-196 and PC-0019 agree that no predecessor release is required and no pending predecessor changeset survives.                                                                                                                                                                                                                                                                                                      |
| BL-003 | Closed as the authorized host transition, with residuals.       | The predecessor is renamed and archived and its frozen Pages surface returns 200. The former successor path returns 404, successor Pages is absent, and successor History/hash publication remains BL-021/R-0007. No predecessor repair is authorized.                                                                                                                                                              |
| BL-007 | R-0002 operational-law slice closed; umbrella remains governed. | ADR parsing, successor authority/glob/forbidden-action policy, trace resolution, gapless decision identity, and cited law paths are non-vacuous and green. Registry-wide count/liveness/tombstone completion is not claimed: the explicit remaining population work stays in BL-008/009 (R-0004), BL-010/011/015 (R-0005), and BL-019/021 (R-0007).                                                                 |
| BL-012 | Closed as explicit N/A.                                         | F1:T1 is recorded in `scorecard-na.json` because no live emitter exists at the frozen pin; the exact known-red guard was replaced and the general scheduled-reachability set is empty.                                                                                                                                                                                                                              |
| BL-013 | Closed.                                                         | Architect-owned freshness policy is 168 hours in authoritative and materialized thresholds; the scorecard loader consumes it instead of accepting caller-selected age. Same-kind ordering and stale behavior remain green.                                                                                                                                                                                          |
| BL-014 | Closed.                                                         | The canonical schema-valid F5 domain policy is materialized byte-identically under law and `.devai/config`; trace and action coverage consume it.                                                                                                                                                                                                                                                                   |
| BL-023 | Closed.                                                         | Auditor is admitted by the mutation and translation role schemas while final adapters continue to deny Auditor actuation; schema and role-closure tests are green.                                                                                                                                                                                                                                                  |
| BL-046 | Closed.                                                         | CI prewarms both workspace and characterized fixture package-manager pins. Isolated cold and warm runs produce the same fingerprint corpus without refreshing the baseline or widening noise exemptions. Stage 2 is green and stage 3 executes.                                                                                                                                                                     |
| BL-047 | Closed.                                                         | The deterministic triage maps all 148 committed repository-name occurrences: 115 active-successor, 17 frozen-predecessor, 5 historical-label, 10 package-metadata, and 1 generated-output. Its exact-locator guard and predecessor-attestation self-reference guard are green.                                                                                                                                      |
| BL-048 | Closed by append-only correction.                               | PC-0001 retains SHA-256 `56f8d37868ec72ca9b16f22e3f1d74fd2098b2c050f73a230a9c147c250bfad9`. Machine-emitted PC-0002 supersedes it, preserves historical gates, states the unmatched P7 deferral now governed by BL-045, and is selected as the effective R-0001 record.                                                                                                                                             |
| BL-049 | Closed.                                                         | Numeric DII ordering accepts valid order and rejects equal, inverted, malformed, and mixed-namespace IDs. `none-preratification` is typed end to end and the production CLI emitted PC-0002 under final schema validation.                                                                                                                                                                                          |
| BL-051 | Closed after final-gate discovery.                              | The first literal repository-wide Prettier execution exposed 352 imported baseline failures. DII-110 excludes only generated/canonical, parser-sensitive, and immutable historical paths; Owner, Architect, Engineer, and Inspector formatted every remaining active file separately; the changed forbidden-action policy was re-materialized through the production verb; and the literal global command is green. |
| BL-052 | Closed after closure-payload prevalidation.                     | An Inspector red-first contract proved that the production closure verb accepted failed gates with no matching failing validation criterion. The Engineer correction now requires every failed gate key to appear in the criterion or evidence of at least one `verdict: fail` criterion, while preserving all-pass and acknowledged-failure behavior.                                                              |

There is no uncatalogued deferral. BL-007’s wider population program is explicitly
bounded above; BL-045 remains the named R-0001 correction residual; BL-017 is the only
allowed command red; BL-015, BL-019, and BL-021 retain their existing later-round
assignments.

## Production acceptance

Fresh local execution at the audited candidate produced:

- Stage 1: workflow lint, repository lint, and typecheck pass.
- Stage 2: build passes; T1 passes 48 files / 591 tests; T2 passes 29 files /
  162 tests with 1 declared skip.
- T3 passes 9 files / 50 tests with 7 declared skips.
- T4 passes 2 files / 4 tests.
- T5 passes 6 files / 25 tests.
- T6 passes 1 file / 3 tests.
- ADR policy accepts all 12 draft successor ADRs under the declared lifecycle.
- Successor glob guards execute 34 law, 54 schema, and 12 ADR matches; no required
  guard matches zero.
- Trace validation resolves 34 invariants and 94 test links. Production trace
  resolution reports 34/34 invariants, zero unresolved references, zero missing paths,
  and zero untraced tests.
- Forbidden-action coverage includes successor law and governance paths.
- Reference triage and the frozen attestation contracts pass.
- `.devai/config/` and `.devai/pin/` remain tracked; runtime contents under
  `.devai/state/` and `.devai/worktrees/` are ignored except tracked `.gitkeep`
  sentinels.

Stage 3 builds and executes the merged T1–T3 suite: 57 files, 641 passed, and 7
declared skips. Its only failure is the unchanged BL-017 threshold assertion:

| Metric     | Covered / total | Reading | Floor |
| ---------- | --------------- | ------- | ----- |
| Statements | 4,188 / 14,551  | 28.78%  | 70%   |
| Branches   | 3,308 / 12,184  | 27.15%  | 60%   |
| Functions  | 606 / 1,903     | 31.84%  | 70%   |
| Lines      | 3,869 / 12,996  | 29.77%  | 70%   |

The coverage provider, collection, and tests succeed. The workflow remains red; BL-017
is not relabelled, suppressed, or weakened and must close in R-0006.

## Post-review BL-051 correction

The first exact execution of `pnpm exec prettier --check .` after the initial Claude
review failed over 352 imported baseline files. Because that was neither BL-017 nor a
permitted skip, the candidate did not advance. Auditor commit
`a5048b460fbf4a0d6ac891dc6edc4adca84a2001` governed BL-051 before repair.

The correction remained role-pure:

- Architect commit `9437eba096809941713b487e37d56d403675dc5a` defined the exact
  active-source boundary in DII-110;
- Engineer commit `1e33bb06a4e9500a6ce6c1ebe3d59e6abffb7397` encoded only those
  reasoned exclusions;
- Owner commit `4987cb05c2f4f5ce736aa604d5f419ff3eb08520` formatted active product
  records;
- Architect commit `29dd065c6d7d4c4af9e5e372b0e56759cc1cbf1e` formatted active law,
  work, host prose, and publication sources and regenerated the reference map;
- Engineer commit `631695eb695ae6fb6ef53c2a9c2b45a1e9e50253` formatted implementation
  sources and re-materialized the changed forbidden-action policy; and
- Inspector commit `871ed4d738d3aea23ef2dbaf2d093c7b561af003` formatted the remaining
  active verification sources.

Fresh execution after that sequence passes stage 1, stage 2, T3–T6, changeset
classification, all scoped production policy/trace commands, and the literal global
Prettier command. Stage 3 again builds and runs 57 files / 641 passed / 7 declared
skips before failing only at the same BL-017 readings quoted above. Formatting changed
no governed JSON meaning, immutable predecessor object, PC record, or threshold.

## Post-review BL-052 correction

Closure-payload prevalidation found that `closePhase` documented, but did not enforce,
the requirement that a failed gate be acknowledged by a matching failing validation
criterion. Auditor commit
`aa9d65b23d54b7b7aa130e06a807cbdbafcb6957` governed BL-052 before repair.

The correction remained red-first and role-pure:

- Inspector commit `003226a0af95d9111a418da1232310be4dc8e372` proved that an
  all-pass criterion set and an unrelated failing criterion were incorrectly accepted;
  and
- Engineer commit `5d614680cf2c984290a8dac1cb0255a358758f90` requires each
  failed gate key to appear in the criterion or evidence of at least one failing
  criterion while keeping valid acknowledged failures and all-pass closures green.

Fresh execution after the correction passes stage 1, stage 2, T3–T6, changeset
classification, the scoped production policy/trace commands, and the literal global
Prettier command. Stage 3 builds and runs 57 files / 641 passed / 7 declared skips,
then fails only at the updated BL-017 readings quoted above. The later machine R-0002
closure must name its failed gate exactly as `coverage-t1-t3` and acknowledge that key
in a `verdict: fail` validation criterion.

## PC-0002 correction

PC-0002 is a correction to R-0001, not the R-0002 closure. It was emitted by the
production machine verb after BL-049 passed. Its source proof epoch is
`record/proofs/work/test-results/R-0001.jsonl`, and it records
`none-preratification`. PC-0001 remains byte-identical and present.

## Residuals and closing posture

The source PR may merge only after the independent Claude Opus 5 review and exact
candidate checks. After that merge, the closure-only branch must append the next
machine PC record against the exact source merge SHA and verify final exact-main state.
Both exact-main workflows must be reported red if and only if BL-017 is the sole red.

R-0003 must independently re-read the frozen bindings, this report, the source merge
SHA, the machine closure record, and exact-main CI before conducting any founding
ratification.

**Claims ceiling: re-bound and operationally coherent; nothing ratified, nothing
released, no readiness or evidence standing.**
