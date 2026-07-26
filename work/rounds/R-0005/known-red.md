---
id: R-0005-KNOWN-RED
title: R-0005 bounded known-red ledger
type: round-known-red
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance: [DII-202; OM-009; BL-106; R-0005-ENTRY-INVENTORY]
---

# R-0005 known-red ledger

## KR-R5-001 — Review-selector contract follows superseded campaign default

After OM-009 and the R-0005 prompt amendment, the existing Inspector contract still
requires literal Claude Opus 5 selection in every active campaign prompt. Exactly one
case fails because R-0005 now requires an independent Codex review and prohibits a
fabricated Claude/Opus PASS. The Inspector must replace that case with a narrow OM-009
exception contract before the B2 red cluster is committed.

## Resolved entry observation

DII-202 initially exposed one register parsing failure while the declaration was being
authored. Its metadata line was corrected to the governed register grammar and the
focused four-case register contract passed before the B0 commit. It is not an active
known-red permission.

## Authorized B2 red clusters

The Inspector may now commit exactly these failing R-0005 contract clusters. Each must
fail because its named implementation or governed artifact is still absent, not because
of a syntax, type, fixture, or harness error.

| ID        | Backlog        | Expected entry failure                                                                                                 |
| --------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| KR-R5-002 | BL-010         | Canonical per-round/per-kind JSONL epoch schema and writer are absent.                                                 |
| KR-R5-003 | BL-011         | The close SWEEP runner does not derive and persist all 59 live registry kinds.                                         |
| KR-R5-004 | BL-045         | The local-evidence manifest lacks exact subject and explicit expiry bindings.                                          |
| KR-R5-005 | BL-015         | The canonical prompt-overlay check reports the 27 inherited findings.                                                  |
| KR-R5-006 | BL-018         | Post-merge observation still uses `scratch/worktrees` instead of the clean managed root.                               |
| KR-R5-007 | BL-033         | The invariant schema and 34 records still use the anchor-doc field `authority`.                                        |
| KR-R5-008 | BL-050; BL-063 | Round closure still moves intent, reads the deprecated closure path, and managed worktrees still use the scratch root. |
| KR-R5-009 | BL-106         | No prospective law-first/red-first sequence checker is wired into governance.                                          |
| KR-R5-010 | BL-176; BL-177 | The current documentation reconciliation artifact and complete repair-cycle map are absent.                            |
| KR-R5-011 | BL-178         | The R-0004 anti-skip contract does not scan and pin conditional-skip test sources.                                     |

The obsolete global Claude-selector failure in KR-R5-001 must become green in the same
Inspector batch. No additional failure is authorized. The table is retired only after
all clusters pass and the complete regression floor is green.

## B3 transition measurement

After the Architect introduced the governed schema and ADR semantics, the full floor
reported 52 failures across 13 test files, with 1,129 passing and 8 intentionally
skipped. The larger assertion count is the expected downstream expression of the same
authorized clusters: proof-schema roster/current-population guards (KR-R5-002 and
KR-R5-010), local-evidence producers and fixtures (KR-R5-004), ADR-016 lifecycle and
prompt-policy consumers (KR-R5-005), the coordinated invariant consumer migration
(KR-R5-007), and repository-reference reconciliation displaced by the governed schema
change (KR-R5-010). No production implementation was present at that measurement, and
no unrelated failure class was observed. B4 through B7 must return the entire floor to
green; this paragraph does not authorize a red source candidate.

## B7 retirement

Inspector commit `3b7fc2b` closes KR-R5-001 through KR-R5-011. The complete ordinary
floor then passed 130 test files with 1,188 passing tests, the unchanged eight declared
skips, and zero failures. The adversarial set covers proof mutation, reordering,
truncation, duplicate terminals, invalid errata, local-evidence subject/expiry/path
selection, post-merge retry cleanliness, total anchor migration, prospective
law-first/red-first sequencing, and conditional-skip source enumeration.

This ledger now describes retired, commit-scoped red authority. It grants no permission
for a red source candidate, a weakened assertion, a new conditional skip, or a later
round to reuse any cluster without fresh Architect authorization.

## KR-R5-012 — Current repository-reference projection drift

The first B8 `ci:stage1` restart passed workflow, action-registry, and trace checks, then
failed because `work/rounds/R-0002/repository-reference-triage.json` no longer matched
the deterministic current projection. The B7 test had incorrectly relaxed this active
production contract to a historical subset when R-0005 line and population changes
shifted the projection.

The bounded repair is authorized to restore exact Inspector parity before regenerating
the Architect-owned projection. It may not exclude another file, normalize away a
reference, weaken semantic classification, or change the generator. The cluster retires
only when the focused test, `repository-reference:check`, and the complete floor pass.

## KR-R5-013 — Exit-lint collateral

The next B8 `ci:stage1` restart passed the deterministic projections and then found
seven lint errors: five non-null assertions in the new proof-epoch adversarial fixture,
one unused test import after KR-R5-012 reconciliation, and one unused production import
left by the in-place round-close repair. Tests remain green; these are source-quality
failures and block the candidate.

The Inspector may replace only the five assertions with explicit fixture narrowing and
remove the one unused test import. The Engineer may remove only the unused production
import. No assertion value, runtime behavior, lint rule, or gate may change. The cluster
retires only after focused tests, lint, and the complete floor pass.

## KR-R5-014 — Exit-formatting collateral

After KR-R5-012 and KR-R5-013 were repaired, the exit ladder passed stage 1, stage 2,
T4, T5, T6, and changeset classification. The repository-wide Prettier check then
identified exactly three refreshed R20 JSON baselines and the post-merge E2E test.

The Inspector may apply the configured formatter to only those four files. Parsed JSON,
snapshot meaning, test assertions, and runtime behavior must remain unchanged. The
cluster retires only when exact fixture comparisons, the complete floor, and the
repository-wide formatting check pass. KR-R5-012 and KR-R5-013 are retired at this same
measurement: exact reference generation, lint, typecheck, and the complete floor are
green.

## KR-R5-015 — Authority-policy materialization drift

The B8 disposable SWEEP invocation reached the production authority broker and was
correctly refused with `AUTHORITY_POLICY_RESOLVED_BYTES_MISMATCH` before writing proof.
The committed config and law mirrors are byte-identical to each other, but both predate
R-0005's changed action and scope rules. Constitution-only binding tests did not expose
the resolved-rule drift.

The governed repair is to run the existing `adopt upgrade` machine materializer as
Architect, commit its `.devai/config/authority-policy.json` product as Engineer, then
byte-copy that exact validated product to the Architect-owned law mirror in a separate
commit. Add an Inspector contract that recomputes the current resolved policy and
rejects future stale bytes. No rule may be hand-edited or relaxed. The cluster retires
only when the production SWEEP and complete exit ladder pass.

## KR-R5-016 — SWEEP child routing mismatch

After current authority-policy materialization, the B8 SWEEP advanced past policy load
and was refused with `AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED` before proof output. The
aggregate runner spawns each public `sense run <kind>` alias unchanged. The parent
broker therefore sees the harness-write aggregate action rather than the router's exact
read-only internal sensor binding; an unchanged child would also demand a fresh human
declaration instead of preserving the parent harness context.

The Inspector must first bind public-to-internal child routing and the exact read-only
broker recognition. The Engineer may then route only registry-derived sensor children
to their existing internal bindings and admit only those bindings under the parent
`sense run` scope. No arbitrary command, write flag, unknown sensor, external binary,
or non-read action may pass. The cluster retires only after adversarial tests, a live
59-sensor disposable SWEEP with a valid terminal epoch, and the complete ladder pass.

## B8 final retirement

KR-R5-015 retires at Engineer materialization `4d040c4`, Inspector runtime-byte guard
`e03b8f9`, and Architect mirror `4ea2c00`: policy resolution, byte parity, the ordinary
floor, and the production SWEEP policy load are green.

KR-R5-016 retires through the complete red-first repair ending at Engineer `2cb2ff3`.
The focused authority/readiness suite passes six tests, the ordinary floor passes 130
files with 1,192 tests and eight declared skips, and the live disposable `R-0999` SWEEP
writes 59 unique record lines plus one terminal. The canonical verifier reports a valid,
closed 60-line epoch with record count 59 and no errors. Forty-four non-runnable or
under-bound actions are preserved as honest blockers; the terminal truthfully remains
execution ERROR and readiness FAIL. The fixture was removed after verification and was
not committed.

KR-R5-012 through KR-R5-014 were already retired by their named exact projection, lint,
formatting, and full-floor measurements. This ledger now grants no active red authority.
Any independent-review or CI finding requires a fresh Architect entry before repair.

## Independent-review and exit-ladder repair authority

Auditor record `R-0005-INDEPENDENT-CODEX-REVIEW-1-FAILURE` preserves the exact
`7883c74` FAIL without conversion. The same frozen candidate also failed strict CI-path
ADR association and the unchanged statement/branch coverage floors. The following ten
clusters are now authorized for red-first role-pure repair:

| ID        | Source       | Required red boundary                                                                                                                                                                                         |
| --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KR-R5-017 | local ladder | The reusable evidence workflow lacks an exact active ADR `affected_rules` association.                                                                                                                        |
| KR-R5-018 | local ladder | The deterministic child-authority test imports the entire broker and drives fresh T1+T3 statements/branches below 70/60. Extract a production-pure predicate; do not change thresholds or coverage inclusion. |
| KR-R5-019 | review P0    | Managed cleanup must reject external, traversal, symlink, ID/path-divergent, unregistered, and corrupt registry targets before recursive fallback removal.                                                    |
| KR-R5-020 | review P0    | A declared record must remain schema-valid, rereadable, closable through a canonical register DII decision, and idempotent through compliance closure selection.                                              |
| KR-R5-021 | review P0    | Local evidence must survive its governed trailer commit and verify from a fresh checkout without caller-selected subject bytes.                                                                               |
| KR-R5-022 | review P1    | Every production legacy `chain.json` mutation must be migrated to canonical epochs or fail closed; legacy read/verify compatibility remains.                                                                  |
| KR-R5-023 | review P1    | Architect identity alone must not bypass reserved prompt scope; only ADR-016's exact bounded output cases pass.                                                                                               |
| KR-R5-024 | review P1    | Attributable post-merge observation products must reconcile into an Auditor-owned `work/audit/` path; runtime locks/receipts remain state-only and retries stay clean.                                        |
| KR-R5-025 | review P1    | Prospective sequencing must bind exact law and demonstrated failing Inspector evidence; unrelated or already-green predecessors fail.                                                                         |
| KR-R5-026 | review P1    | Anti-skip enforcement must detect governed Vitest skip/conditional forms beyond literal `it.skip` and `describe.skip`, including aliases and wrappers.                                                        |
| KR-R5-027 | local ladder | Forbidden-action scanning must classify repository-root protected paths semantically and must not treat a nested `record/` segment inside an Engineer-owned package path as the top-level Machine tree.       |
| KR-R5-028 | local ladder | A public single-sensor `sense run <kind>` invocation must inherit a read boundary only for an exact registry-resolved `read` child; presets, unknown kinds, write consent, and non-read children remain authority-bound. |

Each Inspector cluster must fail for its named absent behavior. KR-R5-027 is the
strict-governance integration repair exposed after the independent-review batch. Law precedes every
substantive implementation. KR-R5-028 is the strict-governance command-boundary repair
exposed after the path-aware scanner repair. No cluster authorizes destructive cleanup, a weaker source
set, threshold reduction, evidence reuse, history rewriting, external mutation, or a
fabricated review PASS. This authority retires only after focused adversaries, the full
ordinary floor, strict governance, fresh coverage, and a new exact-candidate independent
Codex PASS.
