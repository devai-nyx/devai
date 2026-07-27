---
id: R-0005-CLOSURE-SEQUENCING-CORRECTION-AUDIT
title: Closure-only sequencing correction evidence
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - DII-205; R-0005-CLOSURE-SEQUENCING-CORRECTION; Inspector e9bb4d8; Engineer e5485ad; Auditor c0d4198; Architect 3d0da6a and dab95cc
---

# Closure-only sequencing correction evidence

## Finding and red

The production PC-0006 rehearsal followed source PR 8 and exact-main CI correctly and
emitted only the closure record. Post-commit governance rejected the local-only,
unpublished Machine rehearsal object because
`shape-before-machine-record` searched only the one-commit closure PR range. DII-205
authorized the correction. Inspector commit
`e9bb4d86a918b72e71d33b3153455fa7c7943fd9` added a valid closure-only ancestry
case and a missing-prerequisite refusal. The focused command exited 1 with exactly the
valid ancestry case failing; the other 15 cases, including the new refusal, passed.

## Repair

Engineer commit `e5485add545ec550e104edc339d099181f4bc465` makes the checker search
history strictly before each Machine record for an Architect-owned `law/schemas` shape
and Engineer-owned `packages` verb. It does not change implementation classification,
law-before-implementation, red-before-repair, semantic scope, historical exceptions,
or failure behavior when either prerequisite is absent. Architect commit
`3d0da6a0296046442e1433675967ef9c967014a8` binds the exact law, red, implementation,
and hashed Auditor artifact; `dab95cca4074eda7290788bd1f09d70986b969e6` corrects
the decision provenance marker found by the first full-floor pass.

## Verification

- Focused sequencing contract: 1 file / 16 tests pass.
- Ordinary floor: 133 files / 1,230 tests pass / 8 declared skips.
- Stage 1: workflow lint, generated registries, trace, 167 repository references, lint,
  and typecheck pass.
- Stage 2: T1 74 files / 856 tests; T2 41 files / 286 tests plus 1 skip.
- Stage 3: 83 files / 912 tests plus 7 skips; coverage remains
  72.42/62.36/78.07/74.52 against 70/60/70/70.
- T4 2 files / 4 tests; T5 6 files / 25 tests; T6 1 file / 3 tests.
- Strict governance passes six correction commits; 278 governed identities, all 34
  invariants, decision integrity/citations, trace, docs drift, formatting, and
  `git diff --check` pass.

The unpushed rehearsal PC-0006 is not evidence of closure and must be regenerated only
after the correction source PR and exact-main CI. External and later-round gates remain
closed.
