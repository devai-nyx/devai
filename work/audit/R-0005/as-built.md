---
id: R-0005-AS-BUILT
title: R-0005 evidence and lifecycle as-built
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-202; DII-203; OM-009; R-0005-ENTRY-INVENTORY; R-0005-DOCUMENTATION-RECONCILIATION; implementation snapshot 86608b74a9f46df63c92e9ab161e4d4e5ab423a0,
  ]
---

# R-0005 evidence and lifecycle as-built

## Boundary and verdict

R-0005 B0 through B8 and all six completed independent-review/exit-ladder repair
cycles are implemented through governed snapshot
`86608b74a9f46df63c92e9ab161e4d4e5ab423a0`. The source is not closed by this
report: a fresh independent Codex review, source PR and exact-head CI, source merge and
exact-main CI, machine PC-0006 emission, closure-only PR, closure merge, and final
exact-main CI remain serial gates.

The bounded claim is **evidence and lifecycle machinery implemented and tested**.
Evidence reuse and promotion remain disabled pending BL-022. No package was published;
no tag, GitHub Release, Pages deployment, external release, deployment, real-stynx
write, R-0008 external action, R-0009 activation, or R-0010 observation occurred.

## Backlog disposition

| Record | Disposition before ceremony | As-built evidence                                                                                                                                           |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BL-010 | Implemented                 | Canonical per-round/per-kind JSONL lines bind prior hashes; terminal seals, errata, tamper, reorder, truncation, and post-terminal guards are tested.       |
| BL-011 | Implemented                 | SWEEP derives all 59 current kinds and persists every execution or honest blocker before one terminal line.                                                 |
| BL-015 | Implemented                 | ADR-016 and the prompt firewall admit only the two bounded overlays; the inherited 27 findings reach zero without granting authority inversion.             |
| BL-018 | Implemented                 | Post-merge retries persist once, clean managed state, and retain fail-closed receipt checks.                                                                |
| BL-033 | Implemented                 | The invariant schema, all 34 records, trace, validators, and consumers use `authority_docs`; record-meta `authority` remains distinct.                      |
| BL-045 | Implemented, reuse disabled | Local evidence binds producer-derived repository, commit, tree, sources, required jobs, expiry, and exact subject; callers cannot select standing evidence. |
| BL-050 | Implemented                 | Round close amends committed intent in place, appends separate audit/proof state, and never moves the round directory.                                      |
| BL-063 | Implemented                 | Closure reads only the canonical compliance-closure path; the deprecated archive movement is no longer the close behavior.                                  |
| BL-106 | Implemented                 | Strict governance prospectively enforces law-first and red-first sequencing while retaining historical exceptions only as disclosures.                      |
| BL-176 | Implemented                 | Historical counts and closing language are interpreted at their cited snapshots rather than rewritten as current truth.                                     |
| BL-177 | Implemented                 | Entry and exit populations are explicit, and the omitted R-0004 repair cycle is appended below under Auditor authority.                                     |
| BL-178 | Implemented                 | Anti-skip governance enumerates governed test sources and rejects undeclared conditional skips without changing the eight declared skips.                   |

## Machine-verb exercises

The production SWEEP verb was exercised from a clean worktree with disposable round
`R-0999`. It wrote 59 unique sensor records and exactly one terminal line. The canonical
verifier returned `valid: true`, `closed: true`, `recordCount: 59`, `lineCount: 60`, and
no errors. Fourteen readings were applicable, one was N/A, and 44 actions recorded
honest blockers. The terminal truthfully retained `execution_status: error` and
`readiness_status: fail`; it was not converted into a readiness claim. The exact
disposable epoch was removed only after verification and was never committed.

The proof-epoch, local-evidence, SWEEP readiness, and corrected lifecycle/post-merge
fixture group passed 4 files and 23 tests. The lifecycle implementation retains round
intent in place and separates audit/proof output; production PC-0006 remains forbidden
until the exact source merge passes exact-main CI.

## Role-pure batch map

| Batch                     | Role                                       | Commit(s)                                                                                         | Result                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0                        | Owner + Architect                          | `47d9ca8`, `f93b957`                                                                              | OM-009 authorizes the exact R-0005 Codex substitution; DII-202 and the entry inventory declare the round.                                                                                                            |
| B1                        | Owner                                      | `861ca54`                                                                                         | JNY-014 adopts the three-tree doctrine and `.devai/worktrees` setpoint.                                                                                                                                              |
| B2                        | Architect + Inspector                      | `99f6dbd`, `6ecbfd9`                                                                              | Eleven bounded red clusters were authorized and demonstrated red for their expected missing behavior.                                                                                                                |
| B3                        | Architect                                  | `6ed9f72`, `9de2ee1`                                                                              | ADR-016, proof vocabulary, lifecycle, anchor migration, and prospective sequencing became governed semantics.                                                                                                        |
| B4-B6                     | Engineer + Architect                       | `02da3be`, `584337d`, `e76d65f`, `1bfbfbb`, `b167ce9`                                             | Evidence epochs, exact-subject local evidence, prompt bounds, clean observation, corrected lifecycle, and SWEEP persistence were implemented.                                                                        |
| B7                        | Inspector + Architect                      | `3b7fc2b`, `3771e05`, `00f56cc`                                                                   | Adversarial coverage closed the initial reds and refreshed invariant trace projection.                                                                                                                               |
| Exit projection           | Architect + Inspector                      | `c717c73`, `35bd9bd`, `30bf3ee`, `54a0b5e`                                                        | Exact current repository references were restored without weakening semantic classification.                                                                                                                         |
| Exit quality              | Architect + Inspector + Engineer           | `340360f`, `d869e1f`, `571d1cd`, `afe0e00`, `14fa547`                                             | Lint and formatting collateral were governed and repaired under path ownership.                                                                                                                                      |
| Policy materialization    | Architect + Inspector + Engineer           | `2929b4f`, `450bf79`, `4d040c4`, `e03b8f9`, `4ea2c00`                                             | The machine-resolved policy, runtime parity guard, and Architect law mirror were synchronized.                                                                                                                       |
| SWEEP authority           | Architect + Inspector + Engineer           | `84be6f7`, `75b4352`, `06e9af6`, `5a6521f`, `9ca6c4b`, `e92be4d`, `70bb495`, `cc2eee2`, `2cb2ff3` | Registry-derived read children execute under bounded authority; non-read and folded actions persist honest blockers and cannot abort the epoch.                                                                      |
| Independent review repair | Auditor + Architect + Inspector + Engineer | `f47ec0c`, `8932138`, `faad6fd`, `d752bac` through `b875121`                                      | The first independent Codex FAIL is preserved; all eight P0/P1 findings received governed adversaries and bounded repairs.                                                                                           |
| Strict governance repair  | Architect + Inspector + Engineer + Auditor | `4ea2dbc`, `7a17bc3`, `691a90d`, `94192b3`, `d71bcda`                                             | Protected-path scanning now classifies repository-root ownership without nested-path false positives.                                                                                                                |
| Final ladder repair       | Architect + Inspector + Engineer + Auditor | `fcc9a1b` through `52a353b`                                                                       | Sealed ADR history was repaired by canonical supersession; single read sensors use bounded read authority; parser, roster, trace, lint, typecheck, and formatting gates are exact-green.                             |
| Second-review repair      | Auditor + Architect + Inspector + Engineer | `249b749` through `2f3dc22`                                                                       | Public aggregate-chain writers were removed, lifecycle prompt exemptions were deleted, unsafe governance adapters left the skill catalog, and disposable backlog proposals moved under `.devai/state/round-runs/**`. |
| Third-review repair       | Auditor + Architect + Inspector + Engineer | `dddb863` through `77a7067`                                                                       | ADR and documentation repair skills became diagnose-only, prompt exemptions were removed, round state routing became end-to-end canonical, and current lifecycle documentation was reconciled.                       |
| Trace projection repair   | Auditor + Architect                        | `23a6adf`, `504bbf9`                                                                              | The unchanged round-state invariant marker was projected into the 34-invariant / 133-test trace without changing the test, invariant, generator, or runtime behavior.                                                |
| Fourth-review repair      | Auditor + Architect + Inspector + Engineer | `4674343` through `02d2d5d`                                                                       | All current documentation is corpus-guarded against obsolete lifecycle paths; semantic red scope is exact-path bound; and the two historical docs-link commits are disclosed rather than falsely attributed.         |
| Fourth projection repair  | Auditor + Architect                        | `1b68a24` through `6968d03`                                                                       | The exact one-line current reference displacement was preserved, corrected, authorized, and regenerated without changing another locator or the generator.                                                           |
| Fifth-review repair       | Auditor + Architect + Inspector + Engineer | `c1ed4d4` through `86608b7`                                                                       | The implementation classifier now derives the complete governed plant/root-tooling surface from policy, and round-wide historical entries are disclosure-only with no machine bypass.                                |
| Sixth-review repair       | Auditor + Architect + Inspector + Engineer | `f00104c` through `5cea654`                                                                       | Root implementation matching now follows the canonical Engineer glob declaration exactly and fails closed on policy/source parity drift.                                                                             |

Combined-role rows are serial role-pure commits, never shared-authority commits.

## Fresh regression evidence

The final pre-review ordinary floor passed 133 files with 1,223 tests passing, eight
declared skips, and zero failures. The merged T1+T3 coverage reading passed 83 files
with 912 tests and seven declared skips against the unchanged
70/60/70/70 policy:

| Metric     |                  Reading | Floor |
| ---------- | -----------------------: | ----: |
| Statements | 72.42% (10,821 / 14,940) |   70% |
| Branches   |  62.36% (7,867 / 12,615) |   60% |
| Functions  |   78.07% (1,556 / 1,993) |   70% |
| Lines      |  74.52% (9,984 / 13,396) |   70% |

Stage 1 passed; Stage 2 passed with T1 at 74 files / 856 tests and T2 at 41 files /
279 tests plus one declared skip; Stage 3 passed with the coverage above. Changeset
classification, T4 (2 files / 4 tests), T5 (6 files / 25 tests), T6 (1 file / 3 tests),
strict governance (34 invariants, 133 traced tests, 163 governed commits),
repository-wide Prettier, `git diff --check`, and a clean status all pass at exact
candidate `5cea65414187e8af940f3241f43040f5ba3f961c`. No threshold, source set,
conditional skip, assertion, lint rule, or formatting rule was weakened.

## Remaining ceremony

OM-009 requires an independent Codex agent to review the exact candidate and governed
range. Every actionable finding must be red-first repaired before the source PR. The
review evidence must name the agent, candidate, range, findings, and verdict without
claiming Claude, Opus, or cross-provider review. Source and closure PRs remain separate,
and PC-0006 may be produced only from the exact source merge after exact-main CI.
