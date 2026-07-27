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

| ID        | Source       | Required red boundary                                                                                                                                                                                                    |
| --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| KR-R5-017 | local ladder | The reusable evidence workflow lacks an exact active ADR `affected_rules` association.                                                                                                                                   |
| KR-R5-018 | local ladder | The deterministic child-authority test imports the entire broker and drives fresh T1+T3 statements/branches below 70/60. Extract a production-pure predicate; do not change thresholds or coverage inclusion.            |
| KR-R5-019 | review P0    | Managed cleanup must reject external, traversal, symlink, ID/path-divergent, unregistered, and corrupt registry targets before recursive fallback removal.                                                               |
| KR-R5-020 | review P0    | A declared record must remain schema-valid, rereadable, closable through a canonical register DII decision, and idempotent through compliance closure selection.                                                         |
| KR-R5-021 | review P0    | Local evidence must survive its governed trailer commit and verify from a fresh checkout without caller-selected subject bytes.                                                                                          |
| KR-R5-022 | review P1    | Every production legacy `chain.json` mutation must be migrated to canonical epochs or fail closed; legacy read/verify compatibility remains.                                                                             |
| KR-R5-023 | review P1    | Architect identity alone must not bypass reserved prompt scope; only ADR-016's exact bounded output cases pass.                                                                                                          |
| KR-R5-024 | review P1    | Attributable post-merge observation products must reconcile into an Auditor-owned `work/audit/` path; runtime locks/receipts remain state-only and retries stay clean.                                                   |
| KR-R5-025 | review P1    | Prospective sequencing must bind exact law and demonstrated failing Inspector evidence; unrelated or already-green predecessors fail.                                                                                    |
| KR-R5-026 | review P1    | Anti-skip enforcement must detect governed Vitest skip/conditional forms beyond literal `it.skip` and `describe.skip`, including aliases and wrappers.                                                                   |
| KR-R5-027 | local ladder | Forbidden-action scanning must classify repository-root protected paths semantically and must not treat a nested `record/` segment inside an Engineer-owned package path as the top-level Machine tree.                  |
| KR-R5-028 | local ladder | A public single-sensor `sense run <kind>` invocation must inherit a read boundary only for an exact registry-resolved `read` child; presets, unknown kinds, write consent, and non-read children remain authority-bound. |
| KR-R5-029 | local ladder | Governance-history parsing must interpret the semicolon-separated inline arrays accepted by the ADR validator so canonical multi-record supersession resolves symmetrically.                                             |
| KR-R5-030 | full floor   | ADR roster guards and the active roster index must reflect the canonical ADR-001..020 population and its fifteen active records after the sealed-history repair.                                                         |
| KR-R5-031 | Stage 1      | The two independent-review test files must carry canonical invariant markers and be projected into the generated trace without changing their assertions.                                                                |
| KR-R5-032 | Stage 1      | The sequencing adversary must satisfy the no-non-null-assertion lint rule while retaining its exact duplicate-binding mutation and expectations.                                                                         |
| KR-R5-033 | Stage 1      | The pure child-authority adversary must use an explicit test-side structural function type so minimal registry fixtures typecheck without fabricating production registry fields.                                        |
| KR-R5-034 | formatting   | Apply the configured formatter only to the five reported files, preserving parsed JSON, assertions, runtime behavior, role ownership, and all unchanged formatting rules.                                                |
| KR-R5-035 | review-2 P1  | The public `@devai-nyx/evidence` root must not export legacy aggregate-chain mutation functions; direct internal imports remain test-only compatibility fixtures.                                                        |
| KR-R5-036 | review-2 P1  | The prompt firewall must reject every Architect lifecycle writer scope outside ADR-016/019's exact evidence-only and single-document exceptions, including the four hard-coded skill identities.                         |

Each Inspector cluster must fail for its named absent behavior. KR-R5-027 is the
strict-governance integration repair exposed after the independent-review batch. Law precedes every
substantive implementation. KR-R5-028 is the strict-governance command-boundary repair
exposed after the path-aware scanner repair. No cluster authorizes destructive cleanup, a weaker source
set, threshold reduction, evidence reuse, history rewriting, external mutation, or a
fabricated review PASS. This authority retires only after focused adversaries, the full
ordinary floor, strict governance, fresh coverage, and a new exact-candidate independent
Codex PASS.

Auditor record `R-0005-INDEPENDENT-CODEX-REVIEW-2-FAILURE` is the governing observation
for KR-R5-035 and KR-R5-036. Both corrections implement ADR-019's already-active
reader-only legacy-chain and exact prompt-exception decisions; they do not amend or
supersede sealed law. Their Inspector contracts must demonstrate the current public API
and lifecycle-scope allowances failing before either production source is changed.

## Third-review repair authority

Auditor record `R-0005-INDEPENDENT-CODEX-REVIEW-3-FAILURE` preserves the exact
`732a2562753991089737402a1f895c0d0a0aca30` FAIL without conversion. The following
clusters are authorized for one further red-first role-pure repair:

| ID        | Source      | Required red boundary                                                                                                                                                                                                    |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| KR-R5-037 | review-3 P1 | No agent-callable skill may mutate, rename, or claim wildcard scope over `law/adr/**`; `SKILL-fix-adrs` must be absent or diagnose-only, and no prompt-firewall autofix exemption may restore that authority.            |
| KR-R5-038 | review-3 P1 | Backlog proposal, orchestration log, and verify/defer consumption must share canonical `.devai/state/round-runs/**` routing, while governed references use `work/audit/**` and lowercase `work/rounds/**/plan.md`.       |
| KR-R5-039 | review-3 P1 | The governed-round adopter guide and repository-reference contracts must describe in-place `work/rounds/R-NNNN`, disposable `.devai/state/round-runs/**`, and attributable `work/audit/R-NNNN` without archive movement. |

KR-R5-037 and KR-R5-038 require failing Inspector contracts before production repair.
KR-R5-039 requires a failing Inspector documentation/reference contract before the
Architect edits the guide. No cluster authorizes ADR mutation by an agent, round intent
movement, governed output from a runtime skill, weaker assertions, a fabricated review
PASS, or any external action. Retirement requires focused adversaries, the complete
floor and exact ladder, and a new independent Codex PASS on the repaired exact candidate.

## Third-review full-floor collateral

Auditor record `R-0005-THIRD-REVIEW-REPAIR-FLOOR-FAILURE` preserves the first complete
post-repair floor without conversion. It authorizes one additional bounded cluster:

| ID        | Source     | Required red boundary                                                                                                                                                                                                             |
| --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KR-R5-040 | full floor | `SKILL-fix-docs-links` must retain read-only diagnosis while losing broad `docs/**/*.md` mutation authority; the prompt-overlay gate must return zero, and deterministic fixtures/projections must reflect the reviewed behavior. |

The existing prompt-overlay contract is the failing Inspector boundary. The Engineer may
remove mutation but may not add an exemption or suppress a finding. Inspector may refresh
only behavior/manifest/prompt corpora proven by the new source, and the Architect may
regenerate only the semantic repository-reference projection. Retirement requires the
complete ordinary floor and exact ladder to pass.

## Third-review trace projection collateral

Auditor record `R-0005-THIRD-REVIEW-TRACE-PROJECTION-FAILURE` authorizes KR-R5-041:
regenerate only the Architect-owned `law/trace.json` projection so the new Inspector
round-state routing test is represented by its unchanged invariant marker. No test,
invariant, generator, or source behavior may change. The cluster retires when
`trace:check` and the restarted complete ladder pass.

## Third-review repair retirement

KR-R5-037 through KR-R5-041 retire at exact candidate
`504bbf9aeb4dbf01fab444b25bdf5b8a10fc0abe`. The repair sequence is Auditor
`dddb863`, Architect `1e2a05f`, Inspector red `67aa794`, Engineer `02aaaf7`,
Inspector `e6a0d9d`, Architect `29e3ff5`, Auditor `3db5631`, Architect `2bd5e0c`,
Engineer `8651b26` and `3925a2f`, Inspector `5158742`, `d61a48e`, `e8dde2a`, and
`7ad3536`, Architect `c8885fd`, Auditor `a8ae6e6`, Architect `77a7067`, Auditor
`23a6adf`, and Architect `504bbf9`.

The complete ordinary floor passes 133 files with 1,214 tests, eight declared skips,
and zero failures. The exact exit ladder passes Stage 1; Stage 2 with T1 at 74 files /
856 tests and T2 at 41 files / 270 passing plus one declared skip; Stage 3 with 83
files / 912 passing plus seven declared skips and 72.42/62.36/78.07/74.52 coverage;
changeset classification; T4, T5, and T6; strict governance with all 34 invariants and
133 tests traced; repository-wide formatting; `git diff --check`; and clean status.

This ledger now grants no active red authority. A new exact-candidate independent Codex
review remains required, and any actionable finding from that review requires a fresh
Architect entry and failing Inspector boundary before repair.

## Fourth-review repair authority

Auditor record `R-0005-INDEPENDENT-CODEX-REVIEW-4-FAILURE` preserves the exact
`0045bdb8182ebc4c1bf87815c4e74a7c292efa35` FAIL without conversion. The
following clusters are authorized for one further red-first role-pure repair:

| ID        | Source      | Required red boundary                                                                                                                                                                                                                                                                                                                                                |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KR-R5-042 | review-4 P1 | A corpus-wide Inspector contract must fail on every CURRENT document that assigns governed round intent, disposable runtime material, or Auditor observations to obsolete `docs/work/**` or `scratch/sessions/rounds/**` paths, including wildcard and generic forms.                                                                                                |
| KR-R5-043 | review-4 P1 | A hermetic sequencing contract must prove that prospective red evidence names the exact substantive implementation paths, that the named failing tests contain those path bindings, and that the Auditor observation agrees. The historical `8651b26` / `3925a2f` docs-link inversion must be an exact disclosed exception rather than a false binding to `67aa794`. |

The Architect may first declare the prospective semantic-scope policy and exact
historical exception. Inspector must then commit failing contracts for both clusters.
Architect may correct only CURRENT documentation; Engineer may correct only the
sequencing checker. The later Auditor evidence binding and Architect policy projection
must cite the exact new red commit and command. No cluster authorizes a rewritten
historical commit, a blanket round exception, a weaker documentation classification, a
synthetic PASS, or external action. Retirement requires focused green, the complete
ordinary floor, the exact exit ladder, and a new independent Codex PASS.

## Fourth-review projection collateral

Auditor record `R-0005-FOURTH-REVIEW-REPAIR-FLOOR-FAILURE` authorizes KR-R5-044:
regenerate only the Architect-owned semantic repository-reference projection after the
governed authority-document correction left one current GitHub locator at line 124
while the stale projection names line 123. The two existing projection contracts are the failing Inspector boundary.
No generator, document, test, classification, rationale, or other locator may change.
The cluster retires when both focused contracts and the restarted complete floor pass.

## Fourth-review repair retirement

KR-R5-042 through KR-R5-044 retire at exact candidate
`6968d039bc3ccc57d3a5412ad1f90ba59f56032e`. The correction sequence is Auditor
`4674343`; Architect `d906c94`; Inspector red `5d93c20`; Architect `62b8477`;
Inspector `7693b2b`; Engineer `a0b82da`; Auditor `58b483e`; Architect `02d2d5d`;
Auditor `1b68a24` and `9f16613`; and Architect `00c7af5` and `6968d03`.

The complete ordinary floor passes 133 files with 1,217 tests, eight declared skips,
and zero failures. The exact exit ladder passes Stage 1; Stage 2 with T1 at 74 files /
856 tests and T2 at 41 files / 273 passing plus one declared skip; Stage 3 with 83
files / 912 passing plus seven declared skips and 72.42/62.36/78.07/74.52 coverage;
changeset classification; T4, T5, and T6; strict governance across 147 commits;
repository-wide formatting; `git diff --check`; and clean status.

This ledger grants no active red authority. A new exact-candidate independent Codex
review remains required. Any further actionable finding requires a fresh Architect
entry and failing Inspector boundary before repair.

## Fifth-review repair authority

Auditor record `R-0005-INDEPENDENT-CODEX-REVIEW-5-FAILURE` preserves the exact
`6d1353e84d188d51a4bdbfbc7adfb59c2bd21a08` FAIL without conversion and
authorizes KR-R5-045. Inspector must first commit hermetic failures proving that an
unbound post-boundary Engineer commit under an application/root-tooling surface is
rejected and that a prospective round-wide historical exception cannot bypass binding.

The Architect may declare the complete current implementation surface and convert the
R-0002 round entry to disclosure-only semantics. Engineer may then make the checker
derive its classifier from that exact policy and reject any machine-active round-wide
exception. The later Auditor observation and Architect binding must name the exact red
commit, command, tests, and checker path. No cluster authorizes a wildcard exception,
test weakening, history rewrite, fabricated review PASS, or external action. Retirement
requires focused green, the complete ordinary floor, exact exit ladder, and a new
independent Codex PASS.
