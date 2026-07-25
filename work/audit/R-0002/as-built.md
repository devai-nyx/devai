---
id: R-0002-AS-BUILT
title: R-0002 frozen re-bind and operational-law repair as built
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-105; OM-002; OM-005; R-0002-OPENING-AUDIT; R-0002-CLAUDE-OPUS-CLOSE-REVIEW; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-2; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-3; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-4; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-5; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-6; immutable predecessor objects at 05dd242bf72334bfd683096aed380e8240b6b9aa,
  ]
---

# R-0002 frozen re-bind and operational-law repair as built

## Audit boundary

This report is chronological. The initial B8 observations and each correction snapshot
are retained as historical evidence; they are not current-candidate claims. The
authoritative current observation is **Sixth Opus exact-candidate FAIL and correction
cycle** below. A seventh independent review still precedes source push. The later
Architect closing decision, source merge, exact-main observation, and machine closure
record remain part of the two-PR close and are not predicted here.

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

| Batch         | Role                             | Commits and observed result                                                                                                                                                                                                                                                           |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0            | Architect                        | `d528c06420b398ed82b20649db71fac9d91638ae` declared the exact base, scope, claims ceiling, and opening reds.                                                                                                                                                                          |
| B1            | Auditor                          | `3d8d899ae08dbb0378cdfe930d314c7ad994edd7` independently recorded the immutable and host opening state.                                                                                                                                                                               |
| B2            | Inspector                        | `69caf2bfce5ab45cf53dd2fffb5f0590c49af27f`, `b1fa018ba11cc76570a0545f1e9e2edadcd827ed`, and `902938ae8cabf111060b2cb1f7f15b7f455ab595` established and corrected the red-first contracts without changing production behavior.                                                        |
| B3            | Engineer                         | `f9b44082dc2365722748ff71246c0d616b79a4e7` made Corepack prewarming and closure validation deterministic and established the managed-runtime ignore boundary.                                                                                                                         |
| B4–B5         | Architect / Engineer / Inspector | `f5c27ee2b3ff1b8ec5d9f8443fc2a13e3a7c00a5`, `68757da4d0879734c5bae958fc361fcd89007660`, `7a6c4d675735a2761ac3d681112adecfbdbeca28`, and `92385432ba79c378e40096105d3c86209da3e2c4` re-bound law, materialized operational policy and trace, and replaced the scoped known reds.       |
| B5 correction | Inspector / Engineer / Architect | `c98531149ffc9781307ae89c526e9a9cafe3a2ac`, `019b86446025247146b013ebdcef3eed92dcf4de`, and `95b1aaf747e8cde561f59e1fda977bb04632b8a4` exposed and then authorized the canonical machine-proof path. DII-109 records the final commit’s historical generated-byte attribution defect. |
| B6            | Machine / Inspector              | `bec810bb38e74ebdf0bd31ec3ee90aa0b186d1ed` emitted PC-0002 through the production closure verb; `ab1ef5a2338f76d04fa2af383e51839ecc9a4d9f` verifies append-only supersession and ledger selection.                                                                                    |
| B7            | Inspector / Engineer             | `429e89d063500523ca45e84113c6f62c2c69a492` kept the new contract lint-clean; `3f2275bb54086b5882cae3662899fceac6b56b3a` repaired candidate-Constitution version parsing exposed by the production T1 gate.                                                                            |

## Historical scoped backlog reconciliation at initial B8

| Item   | R-0002 disposition                                              | Acceptance evidence or explicit residual                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BL-001 | Closed for frozen re-bind.                                      | The schema-valid genesis attestation contains the exact final commit, tree, chain head, closing decision/record, three immutable document digests, `frozen: true`, and `ratified: null`. Ratification remains BL-004/R-0003.                                                                                                                                                                                                           |
| BL-002 | Closed `none-needed`.                                           | D-196 and PC-0019 agree that no predecessor release is required and no pending predecessor changeset survives.                                                                                                                                                                                                                                                                                                                         |
| BL-003 | Closed as the authorized host transition, with residuals.       | The predecessor is renamed and archived and its frozen Pages surface returns 200. The former successor path returns 404, successor Pages is absent, and successor History/hash publication remains BL-021/R-0007. No predecessor repair is authorized.                                                                                                                                                                                 |
| BL-007 | R-0002 operational-law slice closed; umbrella remains governed. | ADR parsing, successor authority/glob/forbidden-action policy, trace resolution, gapless decision identity, and cited law paths are non-vacuous and green. Registry-wide count/liveness/tombstone completion is not claimed: the explicit remaining population work stays in BL-008/009 (R-0004), BL-010/011/015 (R-0005), and BL-019/021 (R-0007).                                                                                    |
| BL-012 | Closed as explicit N/A.                                         | F1:T1 is recorded in `scorecard-na.json` because no live emitter exists at the frozen pin; the exact known-red guard was replaced and the general scheduled-reachability set is empty.                                                                                                                                                                                                                                                 |
| BL-013 | Closed.                                                         | Architect-owned freshness policy is 168 hours in authoritative and materialized thresholds; the scorecard loader consumes it instead of accepting caller-selected age. Same-kind ordering and stale behavior remain green.                                                                                                                                                                                                             |
| BL-014 | Closed.                                                         | The canonical schema-valid F5 domain policy is materialized byte-identically under law and `.devai/config`; trace and action coverage consume it.                                                                                                                                                                                                                                                                                      |
| BL-023 | Closed.                                                         | Auditor is admitted by the mutation and translation role schemas while final adapters continue to deny Auditor actuation; schema and role-closure tests are green.                                                                                                                                                                                                                                                                     |
| BL-046 | Closed.                                                         | CI prewarms both workspace and characterized fixture package-manager pins. Isolated cold and warm runs produce the same fingerprint corpus without refreshing the baseline or widening noise exemptions. Stage 2 is green and stage 3 executes.                                                                                                                                                                                        |
| BL-047 | Closed.                                                         | The current deterministic triage maps all 155 committed repository-name occurrences: 122 active-successor, 17 frozen-predecessor, 5 historical-label, 10 package-metadata, and 1 generated-output. Its exact-locator guard and predecessor-attestation self-reference guard are green after each governed regeneration.                                                                                                                |
| BL-048 | Closed by append-only correction.                               | PC-0001 retains SHA-256 `56f8d37868ec72ca9b16f22e3f1d74fd2098b2c050f73a230a9c147c250bfad9`. Machine-emitted PC-0002 supersedes it, preserves historical gates, states the unmatched P7 deferral now governed by BL-045, and is selected as the effective R-0001 record.                                                                                                                                                                |
| BL-049 | Closed.                                                         | Numeric DII ordering accepts valid order and rejects equal, inverted, malformed, and mixed-namespace IDs. `none-preratification` is typed end to end and the production CLI emitted PC-0002 under final schema validation.                                                                                                                                                                                                             |
| BL-051 | Closed after final-gate discovery.                              | The first literal repository-wide Prettier execution exposed 352 imported baseline failures. DII-110 excludes only generated/canonical, parser-sensitive, and immutable historical paths; Owner, Architect, Engineer, and Inspector formatted every remaining active file separately; the changed forbidden-action policy was re-materialized through the production verb; and the literal global command is green.                    |
| BL-052 | Closed after closure-payload prevalidation.                     | An Inspector red-first contract proved that the production closure verb accepted failed gates with no matching failing validation criterion. The Engineer correction now requires every failed gate key to appear in the criterion or evidence of at least one `verdict: fail` criterion, while preserving all-pass and acknowledged-failure behavior.                                                                                 |
| BL-053 | Source correction closed; exact-candidate execution is a gate.  | OM-003 records the Owner’s quota pause and Opus-only narrowing. DII-111 and the active campaign instructions require `claude-opus-5`, prohibit fallback, and preserve historical Fable attribution. A 12-case Inspector contract rejects a missing rider, invalid metadata, any active Fable selector, and any active instruction lacking Opus 5. The required Opus review remains a pre-push merge gate, not a source deferral.       |
| BL-054 | Closed after PC-0003 draft prevalidation.                       | A red-first closure contract proved that Machine attribution was rejected. DII-113 admits `Machine` only as provenance for verb-produced record commits; the schema and `ClosureRole` type now agree; the production closure path records separate Machine and Inspector B6 entries; and byte-hash guards preserve both existing PC records.                                                                                           |
| BL-055 | Closed after production-write prevalidation.                    | A red-first contract proved both authority-policy copies bound stale pre-format Constitution bytes. DII-115 classifies formatting as a binding-relevant byte change. The production `adopt upgrade` transition refreshed `.devai/config`; the Architect mirror is byte-identical; rules and source/extension digests are unchanged; and a disposable production `govern phase close --write` emitted PC-0003 with Machine attribution. |
| BL-056 | Closed after publication preflight.                             | A red-first contract proved the canonical phase-closure schema described mutable `.devai/state/closures` instead of the production compliance-proof path. DII-117 binds closure records to `record/proofs/compliance/closures/PC-NNNN.json`; the schema now agrees with implementation, CLI help, authority policy, and the three-tree doctrine without changing record shape or behavior.                                             |
| BL-057 | Closed after quota-window coverage testing.                     | A red-first history fixture proved the ADR mutation guard searched only for schema-invalid predecessor lifecycle tokens and treated scalar `superseded_by` as an array. DII-120 binds successor sealing semantics. Production now detects body, metadata, replacement-link, and return-to-draft mutation after activation while admitting the one canonical reciprocal supersession transition.                                        |

At that historical snapshot there was no uncatalogued deferral. Its BL-017 red was
later closed by the assertion-bearing work recorded in the current re-close section.
BL-007’s wider population program and BL-015, BL-019, BL-021, and BL-045 retain their
separately governed later-round scope.

## Historical production acceptance at initial B8

Fresh local execution at the audited candidate produced:

- Stage 1: workflow lint, repository lint, and typecheck pass.
- Stage 2: build passes; T1 passes 48 files / 591 tests; T2 passes 30 files /
  177 tests with 1 declared skip.
- T3 passes 9 files / 50 tests with 7 declared skips.
- T4 passes 2 files / 4 tests.
- T5 passes 6 files / 25 tests.
- T6 passes 1 file / 3 tests.
- ADR policy accepts all 12 draft successor ADRs under the declared lifecycle.
- Successor glob guards execute 34 law, 54 schema, and 12 ADR matches; no required
  guard matches zero.
- Trace validation resolves 34 invariants and 94 test links. Production trace
  resolution reports 34/34 invariants, zero unresolved references, zero missing paths,
  and zero untraced invariants.
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
then fails only at the updated BL-017 readings quoted above. At that historical
snapshot, a closure would have had to name `coverage-t1-t3` and acknowledge it through
a failing criterion. That instruction was invalidated when BL-017 later closed; the
current closure payload admits no red gate or failing criterion.

## Owner-directed BL-053 correction

The Owner suspended Claude interaction until quota recovery and narrowed all later
Claude work to Opus 5. Auditor commit
`590922df4cd10eaa7385b12f7d0aadbb3119d113` governed the stale active Fable
selectors as BL-053 before repair.

The correction remained role-pure:

- Inspector commit `79238b2b9f4d97b04192e69dbe3f4db03ea954ff` pinned the
  twelve failing mandate-and-enumerated-instruction cases;
- Owner commit `9c716e2b896dc3a8ff47c038faf99ecfad9ae870` recorded OM-003
  without changing any other OM-002 boundary;
- Architect commit `a283ad684922968afe4107a661bfa9e5c4be4214` recorded
  DII-111 and changed the eleven instruction files enumerated by that contract to
  Claude Opus 5 with the explicit `claude-opus-5` selector and no fallback;
- Inspector commit `e562ad0b69c11f7c53234272117fd0553640f49c` added schema
  validation for the Owner rider and made all twelve cases green; and
- Architect commit `26c200d813226510cc2dc4dd422333fa8c5ba613` regenerated the
  one shifted repository-reference locator through the production script.

Historical Fable review artifacts retain their original model attribution. No Claude
interaction occurred during the quota pause. Fresh stage 1, stage 2, and the global
formatting gate are green; stage 2 now contains 30 T2 files / 174 passes / 1 declared
skip. The next independent review is performed only after quota recovery, on the exact
source candidate, with `claude-opus-5`.

## Closure-draft BL-054 correction

PC-0003 draft prevalidation found that the phase-closure schema could not truthfully
attribute the B6 production-verb commit to Machine. Auditor commit
`d0b3098e1f54893e549c5df54d0901d1d5a11f43` governed BL-054 before repair.

The correction remained red-first and role-pure:

- Inspector commit `72f6f77c30ac4e41ab59336246645cc591676f0b` proved that a
  Machine-attributed batch was rejected by the production closure path;
- Architect commit `b0d5aed3d637122a83528c3b061310d90401ae55` recorded DII-113
  and admitted `Machine` in the canonical schema only as provenance for verb-produced
  record commits;
- Engineer commit `a9b1386cab8d51081d7fcbd314bac57a16c5d421` mirrored that
  vocabulary in the production `ClosureRole` type; and
- Inspector commit `ce549b6a02e3f71944b2e7d0eb95b97f57dab50d` removed the
  temporary type-red annotation, retained human-role acceptance, verified separate
  Machine and Inspector B6 entries, and pinned PC-0001 and PC-0002 byte hashes.

Fresh stage 2 passes 48 T1 files / 591 tests and 30 T2 files / 175 tests / 1 declared
skip. The global formatting gate remains green. PC-0003 can now name the Machine commit
without relabeling it as a human role; this representation grants no new mutation
authority.

## Production-write BL-055 correction

Disposable production closure prevalidation found that the Constitution hashes to
`d1dd4858cf48ca14597d3a0d9f70fe8fbda01cc69a019c7e210b46e40bda3763`
while both authority-policy copies still bound the pre-format digest
`e2ebe98eae91cb91e7868dda84309bd61c5d86d7b0b1a94f7bdacfb3ce6c2dd8`.
The write broker correctly refused the stale binding. Auditor commit
`c0c6b199f51fcc972580136917eda1ffffbab9a1` governed BL-055 before repair.

The correction remained red-first and role-pure:

- Inspector commit `3a587cbf8e29c7eaf6721e421941dabd2b56ea79` pinned exact raw
  Constitution-digest equality across the canonical, pinned, and two policy copies;
- Architect commit `c4298eb396893feaeac5e0ffdb464de028ea393c` recorded DII-115
  and authorized only the production recovery path;
- Engineer commit `1d81940ed53d5b86be2ee6090176f1c54590ff03` captured the
  `.devai/config` bytes emitted by `devai adopt upgrade --target . --as-role architect
--write`; and
- Architect commit `68f682e30d2cdeb13ee3fb4d15f65c57531023ab` synchronized the
  canonical law mirror byte-for-byte from that verb output.

The pre/post semantic comparison shows no rule, source-policy digest, extension digest,
resolved digest, version, or repository identity change. Both policy copies now have
SHA-256 `4b423cad058257d6a1302646c202d653dd3ab9934274c831b1471dfc708a5066`
and bind the exact current Constitution digest. A full tracked-tree disposable replay of
the production command emitted PC-0003 successfully with separate Machine and Inspector
B6 entries, the acknowledged `coverage-t1-t3` failure, and
`none-preratification`. Stage 2 now passes 30 T2 files / 176 tests / 1 declared skip;
the global formatting gate remains green.

## Publication-preflight BL-056 correction

The publication evidence preflight found that the canonical phase-closure schema still
claimed the production close verb wrote tracked records under
`.devai/state/closures/<id>.json`. That contradicted the production implementation,
CLI help, authority policy, and approved three-tree doctrine, all of which place
immutable closure proof under `record/proofs/compliance/closures/`. Auditor commit
`ca72277b4e61e12502fc8ef0faba5794e85106c9` governed BL-056 before repair.

The correction remained red-first and role-pure:

- Inspector commit `5fe07a9b248168e6bde9b56fde25b97062bf4d99` proved the canonical
  schema named the wrong proof path; and
- Architect commit `dd5787d6591e2cd970ad349e8346f61eef040662` recorded DII-117 and
  corrected only the schema description to
  `record/proofs/compliance/closures/PC-NNNN.json`.

The focused phase-closure contract passes 15 tests, the full Vitest floor passes 96
files / 850 tests / 8 declared skips, and Stage 2 passes 48 T1 files / 591 tests and 30
T2 files / 177 tests / 1 declared skip. Coverage still builds and runs 57 files / 641
tests / 7 declared skips before failing only at the unchanged BL-017 readings quoted
above. PC-0001 and PC-0002 remain byte-identical.

## Quota-window BL-057 correction

OM-004 coverage strengthening exercised the governance ledger’s historical mutation
branches and found that its advertised sealed-record guard could never identify a
schema-valid successor sealing commit. Auditor commit
`0b374c9f8ef82768eb421344853592498c09aeb7` governed BL-057 before repair.

The correction remained red-first and role-pure:

- Inspector commit `06b5787ba5d362bf65b25b57e63f1b108257d005` proved that
  mutating the body after a schema-valid `active` commit went undetected;
- Architect commit `b478edf8e11e7b7a0b79981d50cac07c4d319974` recorded
  DII-120 and bound the successor lifecycle and scalar replacement semantics;
- Engineer commit `27d8d74ff6a483cdaa88ac1b83dd4214477b6dbf` made the
  historical guard seal on `active`, `superseded`, or `tombstoned`, implemented only
  the permitted terminal transitions, and corrected reciprocal scalar-link handling;
  and
- Inspector commit `f0c8e7c1b9f74567bf7a47a493145907360f9b4e` pinned the
  allowed active-to-superseded transition plus replacement-link and return-to-draft
  rejection.

The focused ledger suite passes 19 tests and the full Vitest floor passes 96 files /
880 tests / 8 declared skips. No ADR status, body, or replacement link changed.

## OM-004 coverage strengthening

Owner mandate OM-004 authorized behavior-focused Inspector tests during the Claude
quota pause without changing source selection, exclusions, assertions, production
behavior, or the 70/60/70/70 policy. Architect commit
`6b118af051ae95f1283ca1bc08012791a4461ddb` recorded DII-119’s non-closing boundary.

Inspector commit `2a03c556acddbab3a8d3edb6fadfcbd93946458e` added triage
classification, deterministic identity, dispatch, synchronous tie-break, Article-23
breaker, scorecard filter, grid, narrative, transpose, color, caption, brief, and JSON
cases. The BL-057 red-first and closing Inspector commits added governance parsing,
record integrity, git-history sealing, citation, archive, rendering, and round-ledger
cases. The production source set and coverage configuration are unchanged.

The fresh merged T1+T3 run executes 57 files / 671 tests / 7 declared skips. Relative
to the OM-004 baseline, it adds 30 passing tests and improves:

| Metric     | Baseline | Current | Delta |
| ---------- | -------: | ------: | ----: |
| Statements |   28.78% |  31.61% | +2.83 |
| Branches   |   27.15% |  29.88% | +2.73 |
| Functions  |   31.84% |  35.29% | +3.45 |
| Lines      |   29.77% |  32.74% | +2.97 |

The unchanged thresholds still fail at statements 70%, branches 60%, functions 70%,
and lines 70%. The command therefore remains honestly red under BL-017, which R-0006
still owns; no closure or readiness is inferred from the uplift.

## OM-005 BL-058 correction

The coverage-doubling inventory fixture exposed a production SQL parsing defect:
`TEXT NOT NULL` was parsed as type `TEXT NOT`, leaving `NULL` as the constraint tail
and incorrectly reporting the column nullable. Auditor commit
`a7eb9049b12ee2bb072fae488c3767482645c121` governed BL-058 before repair.

The correction remained red-first and role-pure:

- Inspector commit `a91ff98552794fb97c0bdba1d413f4fa60804d5a` established the
  isolated nullable-column failure while 14 companion inventory cases passed;
- Architect commit `782545b32083f246da986dff429946ddb09ae1c2` recorded DII-123 and
  made constraint keywords type boundaries while retaining explicit multi-word types;
- Engineer commit `85f33306def27ad73b25d70ea20af06785374222` replaced the
  unconstrained second type identifier with deterministic supported forms; and
- Inspector commit `f2b26aa0d6b4d60da59dacf42a17af710b703292` pinned ordinary
  `NOT NULL`, `DOUBLE PRECISION`, `CHARACTER VARYING`, and
  `TIMESTAMP WITH TIME ZONE` behavior.

The focused sensor file passes 15 tests, the sensor typecheck is green, and the full
Vitest floor passes 96 files / 892 tests / 8 declared skips. BL-058 is closed; the
inventory schema, coverage source set, exclusions, and thresholds are unchanged.

## Post-Opus exact re-close

The first exact-candidate Claude Opus 5 review ran read-only through the literal
`claude-opus-5` selector with no fallback against
`00531f7876ca528051fdd922e001b95b6ed3f838`. It returned **FAIL** and is
preserved at `work/audit/R-0002/claude-opus-close-review.md`. The candidate did not
advance to push. Auditor commit `0a31f0ce7459ce0d4f4a792c6d343f70cc4eb921`
governed BL-059 through BL-065 before remediation.

The remediation remained red-first and role-pure:

- BL-059: Inspector commit `1967d5263af97964dca01f980dbaa5b277c394ff`
  deleted all seventeen import-only coverage projections. No provider, include glob,
  exclusion, source selection, assertion, production behavior, or threshold changed.
- BL-060: Inspector commit `1dbc5beb2853b53270711c409549e63556f6e63b`
  pinned four successor-closure failures; DII-124 bound exact successor merge,
  disposition, and gate identities; Engineer commit
  `b46ad7c01a97d5ac6ae99e59d395f5c537a17a20` repaired the production validator; and
  Inspector commit `33950f135d440dee3f60a9b9f81d44596bfa638c` accepted the exact
  behavior while preserving PC-0001 and PC-0002 bytes.
- BL-061: Inspector commit `89ec1bd24a411494dca93f18ea8a7e0d2d4205ab`
  proved that an empty target list was counted as traced; DII-125 bound non-vacuous
  links; Engineer commit `093c2758e88adf0dfa499578b30af145a8fccfcd`
  required resolvable test targets; and Inspector/Architect commits
  `93665e9694beb1fd6727002e91bd31930dedfea8` and
  `9f0842c6a5d124b09e60ca27fa6267c278d0aa6c` classified and regenerated the corpus.
- BL-017/OM-005: Inspector commit
  `cc3b84defde7d4c1d679d2c6b340be020c3a77bc` added assertion-bearing release,
  Actions-run, scaffolder, bounded-writer, trace, hook, Mermaid, state/profile, and
  verdict behavior. It imported no suite and duplicated no execution through a
  projection path. Architect commit
  `db3cb8b8aa678e6d562b3311cf4adacf31da88af` regenerated the canonical trace and
  reference map after the final test population changed.

Fresh merged T1+T3 coverage at that exact source snapshot executes 75 files with 821
passing tests and 7 declared skips. The unchanged production thresholds now pass:

| Metric     | Covered / total | Reading | OM-005 target | Policy floor |
| ---------- | --------------- | ------: | ------------: | -----------: |
| Statements | 10,276 / 14,672 |  70.03% |        63.22% |          70% |
| Branches   | 7,401 / 12,256  |  60.38% |        59.76% |          60% |
| Functions  | 1,468 / 1,912   |  76.77% |        70.58% |          70% |
| Lines      | 9,473 / 13,114  |  72.23% |        65.48% |          70% |

The command exits zero. BL-017 therefore closed early in R-0002; it is not deferred,
acknowledged red, suppressed, or relabelled. The full Vitest floor and
`devai:prepare` pass. Deterministic trace generation produces 34 invariants and 114
tracked executable tests; the production trace sensor reports 34/34 traced, zero
unresolved invariant entries, zero missing paths, zero untraced invariants, and zero
attestation-only invariants.

BL-059, BL-060, BL-061, and BL-064 are closed. This section and the following
Architect closing decision close BL-062 subject to a fresh exact-candidate Opus 5
PASS. BL-063 remains ring-fenced to R-0005 before any `round archive` activation, and
BL-065 remains assigned to R-0004 before production-readiness claims. Those two
records are catalogued residual work, not an R-0002 source red.

The prepared PC-0003 payload must now record every source gate as pass, include the
exact source merge SHA and `none-preratification`, and contain no invented failed gate
or failed validation criterion. PC-0001 and PC-0002 remain byte-immutable. R-0002
ratifies nothing, releases nothing, deploys nothing, and transfers no readiness or
evidence standing.

## Second Opus correction

The second exact-candidate Claude Opus 5 review ran read-only through literal
`claude-opus-5` with no fallback against
`d41423f3ab2d6ed8cede910deaec821fcf423937`. It returned **FAIL** and is
preserved at `work/audit/R-0002/claude-opus-close-review-2.md`; the candidate did not
advance to push. Auditor commit `6ec716622b7885ac4954ec55d6c19516956e923b`
governed BL-066 through BL-071 and reopened BL-064’s remaining truth drift.

The correction remained red-first and role-pure:

- BL-066/067: Inspector `fdd59fdac13c9234954971422eebfe34816bc25a`
  exposed caller-steered PC ids, abbreviated merge identities, and unbound Machine
  batches. DII-127 and schema commit
  `4cbb686dab0fc75d8f3554c35ad5b28962f6e2c8` bind full Git objects, and Engineer
  `cdf7d6557e951a3f2acb4cf0fe43a6e4e478e9e9` rejects caller ids and requires
  Machine commit attribution. The focused closure suite passes 8 tests.
- BL-068/064: Inspector `be956824e1a3ba4bf2b6fb81dc6a76ddfbf58a5d`
  made literal selectors, no fallback, and OM-003 precedence executable. Architect
  `337dae8465853bb9e4a36c0180b15da209e6359b` corrected the eleven
  selector-enumerated instruction files and removed retired BL-017 permissions inside
  that set. It did not cover the R-0003, R-0004, and R-0006 plans or campaign-level
  ownership prose; BL-074 later closed that omission. The selector suite passes 12
  cases, and the decision-register introduction now describes its DII numbering
  truthfully.
- BL-069/071: Inspector `2cd8121c2d2e264bc7157e23763741be4a74ae61`
  exposed shallow-history success, an uncaught malformed post-seal revision, and the
  array-shaped lifecycle scaffold. DII-128 commit
  `8f067414b38cd4bc8cf78d5188b0671cc8a1e2f5` binds complete, parseable history.
  Engineer `520134ab3e1d3c611641f5a53b9ba843b3183c34` emits deterministic findings,
  scaffolds `superseded_by: null`, and gives both remote workflows full Git history.
  The focused ledger/lifecycle suites pass 64 tests and workflow lint passes.
- BL-070: Inspector `2db9cc1c45c22af66c89aa410a1f97381ca25cb6`
  proved check mode wrote its input and that the completeness floor self-relaxed.
  DII-129 commit `d5191d3595178a267b2398ff7a9794800026ab4a`
  fixes both required ratios at one. Engineer
  `e3cbf5ed0e7f021d90c8b1c0b5f7952d5baed648` added a no-write
  `trace:check` production/CI gate and refuses any untraced invariant. Architect
  `f870df380b6cd1898b85a63438377b3c368b4a4f` regenerated 34/34 invariants
  over 115 tracked executable tests; the trace sensor reports zero unresolved,
  missing, untraced, or attestation-only entries.

The third exact-candidate review remains mandatory. BL-063 still prohibits archive
activation in R-0002, and BL-065 remains governed for R-0004; neither is relabelled
green or treated as readiness.

## Pre-third-review exit-ladder re-close

The post-review ladder found two additional source blockers before third review:

- BL-072: Stage 1 reported 19 lint findings in assertion-bearing Inspector sources.
  Auditor `76e8722deac74d78eb9db1519620398b13d9c58d` governed the red before
  Inspector `baea69f5cc3b2906437cbd03411647771d894831` replaced unsafe
  assertions and one unnecessary escape without changing production behavior or test
  expectations.
- BL-073: the literal global Prettier check then reported 12 active files. Auditor
  `85bedf77ec5109821d307fb9dab38d3c464f621d` governed the red before
  Engineer `bee40d0afec2e41a3c3289389dc844f1e2f7e493` formatted only
  implementation paths and Inspector
  `448a423d5362468be4459486cabb4fb37488082b` formatted only test paths.
  DII-110 exclusions, immutable history, generated proof, thresholds, and source
  selection were unchanged.

Fresh exact execution after those repairs reports:

- the full Vitest floor: 115/115 files, 1,038 passes, 8 declared skips;
- Stage 1: workflow lint, 34-invariant/115-test no-write trace freshness, repository
  lint, and typecheck pass;
- Stage 2: build passes; T1 passes 66 files / 772 tests; T2 passes 31 files /
  178 tests with 1 declared skip;
- T4 passes 2 files / 4 tests; T5 passes 6 files / 25 tests; T6 passes 1 file /
  3 tests;
- Changeset classification passes with zero pending changesets;
- the literal `pnpm exec prettier --check .` and `git diff --check` pass.

The unchanged merged T1+T3 coverage command passes 75 files with 828 passing tests and
7 declared skips:

| Metric     | Covered / total | Reading | Policy floor |
| ---------- | --------------- | ------: | -----------: |
| Statements | 10,293 / 14,682 |  70.10% |          70% |
| Branches   | 7,414 / 12,267  |  60.43% |          60% |
| Functions  | 1,468 / 1,912   |  76.77% |          70% |
| Lines      | 9,489 / 13,123  |  72.30% |          70% |

BL-064 and BL-066 through BL-073 are closed at this observation. BL-063 and BL-065
were the catalogued later-round residuals discovered by the first two Opus reviews at
that observation. The third review later added BL-080, BL-081, and BL-084 to the
prepared later rounds. None permits an R-0002 skip, red gate, archive activation, or
readiness claim.

## Third Opus correction and fourth-review candidate re-close

The third exact-candidate Claude Opus 5 review ran read-only through literal
`claude-opus-5` with no fallback against
`eb09504be91d3339d527ca6dd6a952280d625e81`. It returned **FAIL** and is
preserved at `work/audit/R-0002/claude-opus-close-review-3.md`; the candidate did not
advance to push. Auditor `1e456cb0d5cdb7df64da94ae01e5e41c38cf334a` governed
BL-074 through BL-084 before repair or assignment.

The P0 correction remained role-pure and red-first:

- BL-074: Owner `ac67b4095699c691488a392ad96c5455dd96f632` recorded OM-006,
  Inspector `96d18cf79c6838fd6b4ab5a4ad626ee2afa917ea` exposed the stale
  active instructions, and Architect
  `a771835a0c9da9a6d08a7f30726f2ac199d9b214` retired every remaining
  BL-017 red permission under DII-131. Historical red observations remain unchanged.
- BL-075: Inspector `ef5fe944ad1d2b57a90ea5355f40cf37fe2f8f3f` exposed the
  synthetic Constitution fallback. DII-132 and Engineer
  `46d0b2b4872afbc5677707d63d045a374e7a30b9` bind all callers to one
  fail-closed parser for actual Constitution bytes.
- BL-076: Inspector `97803fa9a64d745826478243ff17b66b9d7a6d32` and
  `660b08443a518ac768ff12cff6e1dce3df191f15` established renamed-history
  and unavailable-Git reds. DII-133 and Engineer
  `a7c220d403d025accbdc1b44f3a297516565f276` preserve the historical path
  at each commit and emit deterministic findings on every history failure.
- BL-077: Inspector `51c2022e365f511c48c74da9f534170ba145ff57` and
  `30fd48096cc772820e5046f0a5b947ab73b303e8` exposed neutral-message
  deletion and unavailable-history behavior. DII-134 and Engineer
  `6fbe40c3e5d09b8a63f4f1db51bec38cd34f34de` inspect committed
  name-status and patch evidence and fail closed.
- BL-078: DII-135 reached the correct historical conformance conclusion but misstated
  the record shape. PC-0002 has failing gate `coverage-t1-t3`; its two failing
  `validation_criteria` do not contain that standalone token. DII-137 corrects the
  evidence without rewriting proof bytes. PC-0003 must satisfy the strict rule.
- BL-079: the backlog register now classifies the gapless BL-001 through BL-084
  population by current disposition without rewriting historical item text.
- BL-082: Inspector `f5ba1ebd56f162033bda084c6fbd7be2b6581737` established the
  integrity-pin red. Engineer `abbf46ab6ff2cf7724984769f833106b7f3fa6c3`
  binds pnpm 9.15.0 to the registry SHA-512 digest in Corepack's canonical hexadecimal
  metadata form; cold prewarm and version execution pass.
- BL-083: the review premise that `rev-list` existed only in the Inspector scope is
  refuted by the production CLI broker and post-merge auditor, both of which authorize
  and execute it. Removing it broke the real post-merge receipt tests. That correction
  still left `git show` in the Inspector scope without a production-broker match; the
  fourth review reopened the item and BL-090 later removed it.

Fresh merged T1+T3 coverage executes 75 files with 832 passing tests and 7 declared
skips:

| Metric     | Covered / total | Reading | OM-005 target | Policy floor |
| ---------- | --------------- | ------: | ------------: | -----------: |
| Statements | 10,351 / 14,720 |  70.31% |        63.22% |          70% |
| Branches   | 7,451 / 12,306  |  60.54% |        59.76% |          60% |
| Functions  | 1,477 / 1,915   |  77.12% |        70.58% |          70% |
| Lines      | 9,546 / 13,160  |  72.53% |        65.48% |          70% |

Exact local execution at clean pre-audit source snapshot
`bcf5b4b7afcaaa9365b41cff2895c0a34d532253` also reports:

- the full Vitest floor exits zero;
- Stage 1 passes workflow lint, 34-invariant/115-test no-write trace freshness,
  repository lint, and typecheck;
- Stage 2 passes the build, 66 T1 files / 776 tests, and 31 T2 files / 185 tests
  with 1 declared skip;
- Stage 3 passes the build and the coverage execution above;
- T4 passes 2 files / 4 tests, T5 passes 6 files / 25 tests, and T6 passes 1 file /
  3 tests;
- changeset classification passes with zero pending changesets; and
- literal global Prettier, `git diff --check`, trace freshness, and worktree
  cleanliness pass.

BL-074 through BL-079 and BL-082 are closed at this observation.
BL-080 and BL-084 remain prepared in R-0004, BL-081 remains prepared in R-0006, and
DII-135 narrows current claims accordingly. The trace reading proves marker and
tracked-path completeness, not the stronger assertion-semantic guarantee assigned to
BL-081. The fourth exact-candidate Opus 5 review, exact local ladder, source PR, and
closure-only PR remain mandatory.

## Fourth Opus correction and fifth-review candidate re-close

The fourth exact-candidate Claude Opus 5 review ran read-only through literal
`claude-opus-5` with no fallback against
`892c24b8ec96603dc62b67a55bb5a9085db5b170`. It returned **FAIL** and is
preserved at `work/audit/R-0002/claude-opus-close-review-4.md`; the candidate did not
advance to push. Auditor `e0cf1ef` governed BL-085 through BL-093 and reopened
BL-074, BL-077, BL-078, and BL-083 before repair.

The correction remained red-first and role-pure:

- Inspector `d074c4b` established nine failures covering exhaustive BL-017
  instructions, current-plan digest binding, prepared residual ownership, protected
  in-place mutations, malformed registry bytes, no-Git history, and the Git-command
  mirror. It also pins the permitted global formatting exclusions.
- Architect `22f8a4c` retired the remaining AGENTS, CLAUDE, CAMPAIGN, and R-0005 red
  instructions; added BL-065/080/084 to R-0004 and BL-063 to R-0005; broadened the
  canonical authority-path pattern; and recorded DII-137. DII-137 binds the amended
  plan digest, corrects PC-0002's actual criterion shape, and reopens DII-136.
- Engineer `e9c45eb` uses production-authorized `git diff-tree` rather than
  Inspector-only `git show`, fails sealed history closed without `.git`, treats
  malformed registries as explicit findings, and detects neutral updates throughout
  the claimed law/product/work/record/config surfaces. Focused execution passes 74
  tests and both affected builds.

Exact local execution at clean pre-audit snapshot
`44e75d1d4a9f85691020056fde7446bc5749c23f` reports:

- the full Vitest floor passes 115 files / 1,060 tests with 8 declared skips;
- Stage 1 passes workflow lint, 34-invariant/115-test no-write trace freshness, lint,
  and typecheck;
- Stage 2 passes the build, 66 T1 files / 781 tests, and 31 T2 files / 191 tests
  with 1 declared skip;
- Stage 3 passes 75 files / 837 tests with 7 declared skips at statements 70.31%
  (10,356/14,727), branches 60.55% (7,454/12,310), functions 77.12%
  (1,477/1,915), and lines 72.54% (9,551/13,166);
- T4 passes 2 files / 4 tests, T5 passes 6 files / 25 tests, and T6 passes 1 file /
  3 tests; and
- changesets, literal global Prettier, `git diff --check`, and worktree cleanliness
  pass.

BL-074, BL-077, BL-078, BL-083, and BL-085 through BL-093 are closed at this
observation. The fourth review's locale-sensitive reference-generation advisory
remains explicitly within BL-065/R-0004; it is not relabelled complete. A fifth
exact-candidate Opus 5 PASS and the complete local/remote ceremony remain mandatory.

## Fifth Opus correction and sixth-review candidate re-close

The fifth exact-candidate Claude Opus 5 review ran read-only through literal
`claude-opus-5` with no fallback against
`a8849d5df4ab61bc284749e5508d2d8c10aa0ae8`. It returned **FAIL** and is
preserved at `work/audit/R-0002/claude-opus-close-review-5.md`; the candidate did not
advance to push. Auditor `1ffbde5` governed BL-094 through BL-106 and reopened
BL-075, BL-077, BL-079, BL-082, BL-086, and BL-092 before repair.

The P0 repair remained red-first and role-pure:

- Inspector `2854075`, `6b12f09`, `81b5be4`, `3070199`, `0c81ce7`, `5635c50`,
  and `dbe6b83` established failing contracts for Constitution parsing, committed
  forbidden-history enforcement, decision resolution, automatic governance,
  Corepack integrity, closure validation, ADR diagnostics, trace containment,
  canonical bootstrap policy, backlog consistency, and exact close inputs.
- Architect `a40c9bb` recorded DII-139's freshness boundary. Architect `9c4b718`,
  `557e6c4`, and `f701c48` regenerated governed trace/reference projections after
  the corresponding source changes.
- Engineer `a1ce4d4` made governance and T4–T6 automatic, bound every Corepack
  preparation to integrity, validated raw and existing closure inputs, aligned ADR
  diagnostics, and repaired scanner operations. Engineer `1a1e0d5` then closed the
  residual acceptance details: the sensor and spec validator use one contained
  file-kind primitive, the sensor requires tracked targets and fails on an absent
  trace, existing closure rows validate before sequencing, and bootstrap policy is
  parsed and schema-validated from packaged canonical bytes only.

Exact local execution at clean pre-audit source snapshot
`7f1f84a31e4e99f8cf5463dd74cb8fd73ddd265f` reports:

- the full Vitest floor passes 119 files / 1,084 tests with 8 declared skips;
- Stage 1 passes workflow lint, 34-invariant/119-test no-write trace freshness, lint,
  and typecheck;
- the automatic governance lane passes strict forbidden actions, decision-record
  integrity, decision-citation resolution, trace resolution, and docs drift;
- Stage 2 passes the build, 68 T1 files / 801 tests, and 33 T2 files / 195 tests
  with 1 declared skip;
- Stage 3 passes 77 files / 857 tests with 7 declared skips at statements 70.53%
  (10,480/14,857), branches 60.85% (7,590/12,472), functions 77.22%
  (1,492/1,932), and lines 72.80% (9,672/13,285);
- T4 passes 2 files / 4 tests, T5 passes 6 files / 25 tests, and T6 passes 1 file /
  3 tests; and
- changeset classification passes with zero pending changesets and the only literal
  global Prettier defect was corrected in Engineer commit `7f1f84a`.

BL-075, BL-077, BL-079, BL-082, BL-086, BL-092, and BL-094 through BL-104 are
closed at this observation. BL-105 remains open until the final decision,
repository-reference regeneration, and exact sixth Opus review bind the actual
candidate. BL-106 remains assigned to R-0005 because immutable earlier ordering cannot
be rewritten and prospective enforcement is the accepted mitigation. BL-080/R-0004
and BL-081/R-0006 remain honest residuals; neither narrows the now-enforced executable
trace-path contract into an assertion-depth claim.

## Sixth Opus exact-candidate FAIL and correction cycle

The sixth exact-candidate review ran read-only through literal `claude-opus-5` with no
fallback against `d21a3f2c3345dfb1d235292562b6ad152110bfbf`. It returned
**FAIL** and is preserved at
`work/audit/R-0002/claude-opus-close-review-6.md`; the candidate did not advance to
push.

The review confirmed the fifth-review enforcement repairs but found six remaining
defects, governed as BL-107 through BL-112: production phase-close did not resolve
batch commit objects; one PC-0003 template identity was a fabricated full expansion;
this report retained stale current-section and review-ordinal pointers; pnpm 10
prewarm lacked recorded local execution; ordinary trace validation omitted the shared
target primitive; one forbidden-rule authority exception was vacuous for an empty
protected-path set; and CLI help described a weaker default than implementation.

The audit-pointer and provenance defect is corrected in the same Auditor-owned cycle
that preserves and governs the review. The remaining repairs require Inspector red
contracts followed by Engineer implementation. DII-140 is reopened for a later
Architect close after those repairs, exact checks, and deterministic reference
regeneration. A seventh exact-candidate Opus PASS remains mandatory.

## PC-0002 correction

PC-0002 is a correction to R-0001, not the R-0002 closure. It was emitted by the
production machine verb after BL-049 passed. Its source proof epoch is
`record/proofs/work/test-results/R-0001.jsonl`, and it records
`none-preratification`. PC-0001 remains byte-identical and present.

## Residuals and closing posture

The source PR may merge only after the seventh independent Claude Opus 5 review and exact
candidate checks. After that merge, the closure-only branch must append the next
machine PC record against the exact source merge SHA and verify final exact-main state.
Every required source and exact-main workflow must be green; BL-017 is no longer an
allowed red. External R-0008 release, R-0009 activation, and R-0010 observation remain
human-gated exactly as authorized.

R-0003 must independently re-read the frozen bindings, this report, the source merge
SHA, the machine closure record, and exact-main CI before conducting any founding
ratification.

**Claims ceiling: re-bound and operationally coherent; nothing ratified, nothing
released, no readiness or evidence standing.**
