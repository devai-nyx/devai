---
id: R-0005-INDEPENDENT-CODEX-REVIEW-1-FAILURE
title: R-0005 independent Codex exact-candidate review failure
type: audit-failure
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-009; DII-202; R-0005-AS-BUILT; candidate 7883c74ce65149df246cab431e8d8b22b967aba4; base e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190,
  ]
---

# R-0005 independent Codex exact-candidate review failure

## Identity and scope

Independent reviewer: Codex agent `/root/r0005_codex_reviewer`. This is not Claude,
Opus, or cross-provider review. The reviewer verified an empty status, exact candidate
`7883c74ce65149df246cab431e8d8b22b967aba4`, merge base
`e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190`, and a 40-commit governed range before
performing a read-only inspection.

Verdict: **FAIL**. No source-close or readiness claim follows from this review.

## Blocking findings

| Severity | Surface                                                                                                      | Exact defect                                                                                                                                            | Required bounded repair                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | `packages/loop/src/loop/worktrees.ts:115-135`                                                                | Mutable registry paths can reach recursive fallback deletion without canonical managed-root, ID, symlink, and Git-registration proof.                   | Fail closed on divergence and test external, traversal, symlink, corrupt-registry, and registration cases.                            |
| P0       | `packages/loop/src/round-lifecycle/index.ts:110,224-227`                                                     | Declaration rendering drops required record fields; the current test accepts schema failure, and close cannot resolve canonical DII register decisions. | Preserve the validated record, resolve canonical decision sources, and prove declare-to-close reread and idempotency.                 |
| P0       | `packages/evidence/src/local-evidence/collect.ts:207` and `verify.ts:131`                                    | Collection binds the pre-manifest HEAD/tree, but committing the manifest changes both and makes the documented gate workflow self-invalidating.         | Govern a non-self-referential exact subject and test collect, trailer commit, fresh checkout, and reusable verification.              |
| P1       | `packages/evidence/src/evidence/verb-evidence.ts:40`, CLI evidence emit/record/redaction, and `chain.ts:153` | The legacy aggregate proof chain remains a production writer although DII-203 permits read/verify compatibility only.                                   | Inventory every mutation and migrate or disable it without losing legacy verification.                                                |
| P1       | `packages/skills/src/prompt-firewall/index.ts:284`                                                           | Any Architect-tagged deterministic non-LLM skill receives a blanket reserved-scope bypass forbidden by ADR-016.                                         | Remove the bypass and prove only the two exact governed cases pass.                                                                   |
| P1       | `packages/skills/src/post-merge-auditor/index.ts:395,495`                                                    | Attributable observations are written beneath `.git` rather than the Auditor-owned `work/audit/` tree.                                                  | Keep runtime locks/receipts in state but reconcile attributable outputs through an Auditor-authorized path, cleanly and idempotently. |
| P1       | `scripts/check-governed-sequencing.mjs:46-87`                                                                | Same-round presence of any prior law/test commit is accepted; no exact semantic/contract binding or demonstrated red state is required.                 | Add governed machine-readable exact bindings and unrelated/non-failing adversaries.                                                   |
| P1       | `tests/contract/r0004-governed-surface.red.contract.test.ts:613`                                             | Literal `it.skip`/`describe.skip` matching misses `test.skip`, `suite.skip`, `skipIf`, aliases, and equivalent conditional wrappers.                    | Replace with a comprehensive governed detector and bypass fixtures.                                                                   |

The reviewer found no blocking defect in role/path-pure authorship, the R-0004 cycle
reconciliation, the total 34-record `authority_docs` migration, `.devai` tracked/ignored
boundaries, honest SWEEP nonclaims, or external-gate nonclaims.

## Additional exact-candidate ladder failures

After the reviewed snapshot was frozen, the local ladder independently reported two
further source blockers without changing it:

- strict forbidden-action governance rejects workflow commit `02da3be` because
  `.github/workflows/reusable-evidence-gate.yml` has no exact active ADR association;
- fresh T1+T3 coverage passes 81 files / 900 tests but reports 68.22% statements and
  58.48% branches, below the unchanged 70/60 floors, because the new deterministic
  predicate test imports the entire CLI broker into the coverage graph.

All ten gaps require fresh Architect authority and red-first, role-pure repair. A new
independent Codex review must inspect the later exact candidate; this failure record is
never converted into a PASS.
