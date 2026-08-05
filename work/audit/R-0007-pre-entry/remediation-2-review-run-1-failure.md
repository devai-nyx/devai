---
id: R-0007-PRE-ENTRY-REMEDIATION-2-REVIEW-RUN-1-FAILURE
type: audit
status: current
date: 2026-07-29
authority: Auditor
round: R-0007
---

# Remediation campaign 2 independent review run 1 — failure

## Exact reviewed subject

- Authority: `OM-016`.
- Remediation base and merge base:
  `539bfa2b9488c51b898d7a5b06889cfc93880864`.
- Reviewed candidate: `45e38de5a6dc615cd4d986e3144029a5d3407715`.
- Reviewed tree: `b87045c8eba8416f66d3460f7339c326279f13ba`.
- Candidate-only clone: `/tmp/devaii-remediation2-review1.S3NfR0`, clean and
  detached at the exact candidate before and after review.
- Reviewed range: 27 changed paths across 20 role-labelled commits.
- Reviewer model: `gpt-5.6-sol`, independent read-only machinery reviewer only.
- Protected R-0006 path changes: zero.

One reviewer helper was interrupted after it did not return. Its partial work was
excluded. The primary reviewer independently completed that population inside the
same substantive Review Run 1. This was not a transport retry or a second review run.

## Terminal result and budget

`RUN_1_RESULT: FAIL`.

The reviewer continued after blockers and found substantive P1 defects across every
remediation-2 class, `R2-F001` through `R2-F008`. Review Run 1 is consumed. Review Run
2 remains unused and may run only after one complete-class repair covers every
population below. Review Run 3 remains forbidden.

The exact final-candidate 16-gate green roster is valid execution evidence, but does
not close the adversarial populations below. The exact candidate is not freeze
eligible for a PASS claim.

## Complete topic accounting

| Topic population        | `RECHECKED_PASS` | `RECHECKED_FAIL` |
| ----------------------- | ---------------: | ---------------: |
| 10 semantic obligations |                4 |                6 |
| 27 changed paths        |               15 |               12 |
| active-control census   |                0 |                1 |
| 6 current claims        |                6 |                0 |
| 18 prior defect classes |                5 |               13 |
| candidate identity      |                1 |                0 |
| convergence evidence    |                0 |                1 |
| **Total**               |           **31** |           **33** |

`REUSED_FRESH_PASS: 0`. `BLOCKED: 0`. The 64 terminal dispositions reconcile
exactly.

Failed semantic obligations: `R7-P0-AUTHORITY`, `R7-P0-REVIEWER-BINDING`,
`R7-P0-CANDIDATE-IDENTITY`, `R7-P1-AFFECTED-TESTS`, `R7-P1-REVIEW-CENSUS`, and
`R7-P1-TWO-CYCLE`.

Failed changed paths:

- `law/schemas/affected-test-graph.schema.json`
- `law/schemas/control-provenance.schema.json`
- `law/schemas/review-obligations.schema.json`
- `scripts/run-round-close-controls.mjs`
- `tests/contract/pre-r0007-impact-dag.adversarial.contract.test.ts`
- `tests/contract/pre-r0007-remediation-2.red.contract.test.ts`
- `tests/contract/pre-r0007-review-run-1-repairs.red.contract.test.ts`
- `work/audit/R-0007-pre-entry/remediation-2-pre-freeze-certification.md`
- `work/rounds/R-0007/affected-test-graph.json`
- `work/rounds/R-0007/control-provenance.json`
- `work/rounds/R-0007/remediation-2-closure-matrix.json`
- `work/rounds/R-0007/review-obligations.json`

## Complete finding population

### R2-F001 — AUTHORITATIVE_GATE_CANDIDATE_RED (P1)

The exact candidate's green 16-gate roster passed. The failure path remains
incomplete: the controller stops on the first failed authoritative gate, so a red run
retains only a prefix instead of all sixteen gate IDs and exits. The focused contract
only reruns the currently green formatting command.

- Population query: inject one failure independently at every gate ordinal and one
  early red followed by later green gates; compare the terminal population with the
  exact ordered sixteen-gate roster.
- Complete affected population: all sixteen authoritative gates and every possible
  failure ordinal.
- Repair condition: execute or explicitly account for all sixteen gates after a
  failure, retain every result, make any red result terminally ineligible, and prove
  the behavior with executable adversaries.

### R2-F002 — AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE (P1)

The closure validator checks ordered IDs and nonempty hand-authored script/program
arrays, not recursively expanded command semantics. Stage 1, Stage 2, and governance
omit transitive schema/CLI builds; several Git-consuming commands omit the `git`
executable. Preparation, Stage 1, Stage 2, and governance omit eight upstream `dist`
trees and all ten `tsconfig.tsbuildinfo` files: 879 current output instances. Git
status cannot discover these ignored outputs. Input keys discard Git mode/type;
same-byte symlink-to-regular-file conversion preserves the key. Cache validation does
not bind `producing_candidate`, allowing history-sensitive reuse across identical-tree
history rewrites.

- Population query: recursively expand every authoritative command, root/workspace
  package script, program, project reference, dependency output, persistent output,
  environment/toolchain input, Git mode/type, and history-sensitive read.
- Complete affected population: all sixteen freshness profiles; ten build-output
  trees; ten build-info files; same-byte mode/type changes; identical-tree rebase and
  re-author histories; all history-sensitive gates.
- Repair condition: mechanically derive and compare command closure, bind exact
  candidate/history and Git mode/type, validate `producing_candidate`, enumerate every
  ignored dependency/persistent output, and execute adversaries for each class.

### R2-F003 — AFFECTED_TEST_INPUT_POPULATION_INCOMPLETE (P1)

The mandated asset population is 109 paths: four CLI JSON fixtures, one effects-check
fixture config, ten skills prompts, and 94 skills fixtures. The graph declares the
nonexistent `packages/skills/test-fixtures/**`; the 94 real fixtures are under
`packages/skills/tests/contract/fixtures/**` and miss `skills-tests`. Of 1,588 tracked
paths, 224 are unknown and 223 select the full suite without whole coverage. Regex
loader detection misses aliases, wrappers, and deleted or renamed preimages.

- Population query: classify every tracked candidate and base/preimage path plus every
  computed-loader family; inspect selected shards, full-suite fallback, and
  full-coverage fallback.
- Complete affected population: all 109 runtime/test assets; all currently unknown
  paths; alias/wrapper/computed loaders; deleted and renamed loader preimages.
- Repair condition: map all 94 real fixtures, make every unknown or unresolved loader
  select both full suite and whole coverage, inspect candidate and preimage blobs, and
  replace source-string assertions with executable mutations.

### R2-F004 — RECHECKED_TOPIC_EVIDENCE_UNAUTHENTICATED (P1)

Review scope is self-referential. Candidate-identity and review-census obligations
require the review-scope file before it exists; two-cycle evidence requires transport
before it exists. Unresolved references receive a synthetic unresolved-reference
digest. Regeneration after files exist changes digests and produces
`REVIEW_SCOPE_RECOMPUTATION_INVALID`. The role/path evidence hashes commit and author
identity but not paths or the verdict.

- Population query: generate every topic from a clean pre-state, resolve each typed
  evidence reference, then regenerate after scope/transport materialization and compare
  exact digests and causal availability.
- Complete affected population: all seven topic source classes, scope-dependent
  obligations, transport-dependent obligations, and role/path census evidence.
- Repair condition: use immutable non-self-referential pre-state evidence, reject
  unresolved references during scope generation, create transport proof before
  consumption, and authenticate actual role/path inputs and verdict.

### R2-F005 — STATE_AND_TRANSPORT_CHAIN_INCOMPLETE (P1)

Predecessor reconstruction hashes a selected subset rather than the exact persisted
prior state. `CYCLE_2_ACTIVE -> REVIEW_TRANSPORT_BLOCKED` expects cycle 1. Transport
reauthentication omits payload digest and validation; result reauthentication omits
`state_before_digest`; repair reauthentication omits candidate/scope/transition/state
links and full repaired-class validation. Transport-blocked emission stores the real
prior state digest while validation compares a synthetic reconstruction.

- Population query: mutate and re-self-digest every field over all twelve edges,
  attempts zero/one/two, every result and repair-v2 link, and every terminal.
- Complete affected population: all twelve transitions; all transport fields; all
  result fields; all repair links; `PASS`, `ESCALATION_REQUIRED`, and
  `REVIEW_TRANSPORT_BLOCKED`.
- Repair condition: reauthenticate exact persisted predecessor artifacts and every
  schema field before mutation, correct cycle semantics, and executable-test every
  edge and terminal.

### R2-F006 — ACTIVE_CONTROL_CENSUS_ALLOWLIST_INCOMPLETE (P1)

The candidate census resolves 54 unique source references but compares coordinated
declarations without an independent expected population. Owner mandates remain a
manual allowlist. Decision rows collapse through `Map` before duplicate-ID rejection.
Decisions or mandates can disappear through coordinated provenance edits.

- Population query: independently enumerate exact-candidate decisions, applicable
  active mandates, transitive references, manifest roots, and raw source digests; then
  compare them with emitted provenance.
- Complete affected population: DII-246 through DII-249, all applicable active Owner
  mandates, twenty policy schemas, all round registries/authority documents, and four
  prior-review records.
- Repair condition: derive expected populations independently, reject duplicates
  before map construction, and fail any coordinated removal, extra, or digest change.

### R2-F007 — REVIEWER_BINDING_CENSUS_NOT_CANDIDATE_BOUND (P1)

Mandates are candidate-bound, but `loadV4Context` reads profile and linked documents
from the mutable worktree. Binding resolution compares candidate mandate markers with
that mutable profile. Exact-candidate resolution also accepts `HEAD` and abbreviated
revisions at authoritative boundaries.

- Population query: dirty each profile/binding path independently while HEAD remains
  fixed and invoke every authority consumer with full, abbreviated, symbolic, and
  omitted candidate identities.
- Complete affected population: policy-check, entry-check, status, convergence,
  candidate proof, review-scope, and review-check.
- Repair condition: load all binding inputs from the explicit candidate object and
  require a literal 40-hex candidate at authoritative boundaries, except documented
  pre-resolution for preparation policy/status.

### R2-F008 — SEMANTIC_OBLIGATION_POPULATION_UNCHECKED (P1)

Eight source digests and ten obligation mappings are internally consistent but not
independently complete. Expected source paths come from provenance and known IDs come
from the obligation registry, so coordinated deletion or digest refresh passes. None
of the eight normative sources contains stable `R7-P*` identities.

- Population query: add/remove a normative requirement, delete each obligation row,
  remove each source from provenance and registry together, duplicate each ID, and
  refresh source digests.
- Complete affected population: all eight normative sources and all ten obligation
  rows.
- Repair condition: place stable machine-resolvable obligation identities in
  authoritative sources or execute an independent omission lint, then derive and
  compare the registry against that independent population.

## Mandatory transition

The campaign transitions to its single complete-class repair phase. All eight matrix
rows must reopen. No partial repair, specimen-only closure, candidate freeze, Review
Run 2, push, PR, merge, or R-0007 entry is valid until every complete population above
is green together.

R-0007 is **NOT STARTED**. Its governed reviewer model and B0 declaration remain
unbound. No deployment, publication, release, evidence promotion, real-stynx mutation,
or predecessor mutation is authorized or performed.
