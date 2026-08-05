# Remediation campaign 2 — independent machinery Review Run 2 failure

## Terminal result

`RUN_2_RESULT: FAIL`

Review Run 2 is consumed. Five P1 findings remain. OM-016 authorizes neither
another repair nor Review Run 3, so the campaign returns to Owner escalation and
R-0007 remains not started.

The independent read-only reviewer was `gpt-5.6-sol`.

## Exact review subject

- Base and merge-base:
  `539bfa2b9488c51b898d7a5b06889cfc93880864`
- Candidate: `7a39cc31c47a5858e15f2ba3cf7244dd6d744f22`
- Candidate tree: `2659fb0325ca939c9914e18554b01e13b0e18f1a`
- Range: 51 commits and 32 changed paths.
- The checkout was detached and clean before and after review.
- All 27 changed-path topics from Review Run 1 were retained and five repair-added
  changed paths were added.
- Closed R-0006 artifact changes: zero.
- `git fsck --full --strict` passed and the candidate-only clone had no alternates.

The review used only the exact base and candidate objects. Additional remote refs in
the disposable clone were not used. The clone did not contain installed dependencies;
the reviewer did not install or link them. Runtime conclusions use exact-candidate
orchestration evidence, while the reviewer independently checked Git identities,
JSON, digests, syntax, and source behavior.

## Exact-candidate execution evidence

At exact candidate `7a39cc31c47a5858e15f2ba3cf7244dd6d744f22`:

- Ordinary suite: 164 files passed, 1,710 tests passed, 8 skipped.
- Whole coverage: 164 files passed, 1,710 tests passed, 8 skipped.
- Coverage was 72.45% statements (`16,243/22,419`), 60.75% branches
  (`11,787/19,401`), 81.14% functions (`2,501/3,082`), and 73.90% lines
  (`15,081/20,406`).
- Governance passed sequencing for 142 commits, SHA references for 462 identities,
  trace resolution 34/34, and all other reported governance subchecks.
- Preparation, formatting, trace, repository references, action registry, Stage 1,
  and `git diff --check` passed.
- The literal authoritative `materializations` command failed. Running
  `node scripts/run-round-close-controls.mjs policy-check` returned exit 1 with
  `ROUND_INVALID: round must match the configured pattern`.

The older repair certification's statement and branch counts are explicitly scoped
to candidate `d5bc7d8...`, not this final candidate. They are historical rather than
current claims. Its broader assertion that all eight classes were repaired is false
for the final tree.

## Exact-once topic reconciliation

| Population            | RECHECKED_PASS | RECHECKED_FAIL | REUSED_FRESH_PASS | BLOCKED |  Total |
| --------------------- | -------------: | -------------: | ----------------: | ------: | -----: |
| Semantic obligations  |              6 |              4 |                 0 |       0 |     10 |
| Current changed paths |             24 |              8 |                 0 |       0 |     32 |
| Active-control census |              1 |              0 |                 0 |       0 |      1 |
| Current claims        |              6 |              0 |                 0 |       0 |      6 |
| Prior defect classes  |             10 |              8 |                 0 |       0 |     18 |
| Candidate identity    |              0 |              1 |                 0 |       0 |      1 |
| Convergence evidence  |              0 |              1 |                 0 |       0 |      1 |
| **Total**             |         **47** |         **22** |             **0** |   **0** | **69** |

All 64 original Review Run 1 topics were retained. Five repair-added changed-path
topics increased the current exact population to 69.

### Semantic obligations

| Obligation                 | Disposition      | Finding                  |
| -------------------------- | ---------------- | ------------------------ |
| `R7-P0-AUTHORITY`          | `RECHECKED_PASS` | —                        |
| `R7-P0-REVIEWER-BINDING`   | `RECHECKED_FAIL` | `RUN2-F005`              |
| `R7-P0-DEPLOY-REFUSAL`     | `RECHECKED_PASS` | —                        |
| `R7-P0-HISTORY-INTEGRITY`  | `RECHECKED_PASS` | —                        |
| `R7-P0-CANDIDATE-IDENTITY` | `RECHECKED_FAIL` | `RUN2-F002`, `RUN2-F005` |
| `R7-P1-AFFECTED-TESTS`     | `RECHECKED_FAIL` | `RUN2-F003`              |
| `R7-P1-REVIEW-CENSUS`      | `RECHECKED_PASS` | —                        |
| `R7-P1-TWO-CYCLE`          | `RECHECKED_FAIL` | `RUN2-F004`              |
| `R7-P1-GENERATED-IDENTITY` | `RECHECKED_PASS` | —                        |
| `R7-P2-CURRENT-CLAIMS`     | `RECHECKED_PASS` | —                        |

### Current changed paths

The following eight paths received `RECHECKED_FAIL`:

- `.devai/config/round-close-controls.json` — `RUN2-F001`.
- `law/policy/round-close-controls.json` — `RUN2-F001`.
- `scripts/run-round-close-controls.mjs` — `RUN2-F001` through `RUN2-F005`.
- `tests/contract/pre-r0007-remediation-1.red.contract.test.ts` —
  `RUN2-F003`, `RUN2-F004`.
- `tests/contract/pre-r0007-remediation-2.red.contract.test.ts` —
  `RUN2-F001` through `RUN2-F005`.
- `work/audit/R-0007-pre-entry/remediation-2-review-run-1-repair-certification.md`
  — invalid all-green assertion.
- `work/rounds/R-0007/affected-test-graph.json` — `RUN2-F002`.
- `work/rounds/R-0007/remediation-2-closure-matrix.json` — false
  `GREEN_PROVED` rows.

The remaining 24 exact current changed paths received `RECHECKED_PASS`:

- `law/policy/governed-sequencing.json`
- `law/register/DECISIONS.md`
- `law/schemas/affected-test-graph.schema.json`
- `law/schemas/control-provenance.schema.json`
- `law/schemas/remediation-closure-matrix.schema.json`
- `law/schemas/review-obligations.schema.json`
- `law/schemas/round-close-profile.schema.json`
- `law/schemas/task-freshness.schema.json`
- `law/trace.json`
- `packages/schemas/src/roster.ts`
- `product/owner-mandates/OM-016.md`
- `tests/contract/pre-r0007-cycle1-defect-classes.red.contract.test.ts`
- `tests/contract/pre-r0007-impact-dag.adversarial.contract.test.ts`
- `tests/contract/pre-r0007-review-run-1-repairs.red.contract.test.ts`
- `work/audit/R-0007-pre-entry/remediation-2-pre-freeze-certification.md`
- `work/audit/R-0007-pre-entry/remediation-2-red-evidence.json`
- `work/audit/R-0007-pre-entry/remediation-2-review-run-1-failure.md`
- `work/audit/R-0007-pre-entry/remediation-2-review-run-1-repair-red-evidence.md`
- `work/audit/R-0007-pre-entry/remediation-2-review-run-1-repair-sequencing-red-evidence.json`
- `work/rounds/R-0007/close-control-profile.json`
- `work/rounds/R-0007/control-provenance.json`
- `work/rounds/R-0007/prior-finding-registry.json`
- `work/rounds/R-0007/review-obligation-baseline.json`
- `work/rounds/R-0007/review-obligations.json`

### Active controls and current claims

The active-control census independently reconciled 55 unique source references:
decisions DII-246 through DII-250; mandates OM-002, OM-003, OM-014, OM-015,
and OM-016; 20 policy schemas; policy, profile, graph, obligation, claim,
prior-finding, closure-matrix, and provenance material; five manifest roots; four
prior-review records; and obligation source references. All resolved to current
candidate bytes. Duplicate-ID-before-map and coordinated declaration-removal
controls were present. The census received `RECHECKED_PASS`.

All six current claims received `RECHECKED_PASS`:

- `suite.population`
- `coverage.summary`
- `candidate.range`
- `review.topic-population`
- `site.artifact`
- `ci.exact-head`, correctly deferred until publication

### Prior defect classes

| Prior defect class                             | Disposition      |
| ---------------------------------------------- | ---------------- |
| `ACTIVE_CONTROL_CENSUS_ALLOWLIST_INCOMPLETE`   | `RECHECKED_PASS` |
| `AFFECTED_TEST_INPUT_POPULATION_INCOMPLETE`    | `RECHECKED_FAIL` |
| `AUTHORITATIVE_GATE_CANDIDATE_RED`             | `RECHECKED_FAIL` |
| `AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE`  | `RECHECKED_FAIL` |
| `AUTHORITATIVE_GATE_POPULATION_OMITTED`        | `RECHECKED_PASS` |
| `BINDING_CENSUS_ABSENT`                        | `RECHECKED_PASS` |
| `CACHE_RECORD_IDENTITY_UNBOUND`                | `RECHECKED_PASS` |
| `CLAIM_DIGEST_PLACEHOLDER_ACCEPTED`            | `RECHECKED_PASS` |
| `COMMITTED_RENAME_PREIMAGE_OMITTED`            | `RECHECKED_FAIL` |
| `CONSERVATIVE_WIDENING_DEAD`                   | `RECHECKED_FAIL` |
| `RECHECKED_TOPIC_EVIDENCE_UNAUTHENTICATED`     | `RECHECKED_PASS` |
| `REVIEWER_BINDING_CENSUS_NOT_CANDIDATE_BOUND`  | `RECHECKED_FAIL` |
| `REVIEW_CENSUS_AND_CANDIDATE_PROOF_INCOMPLETE` | `RECHECKED_PASS` |
| `REVIEW_REUSE_AND_STREAM_CANONICALITY`         | `RECHECKED_PASS` |
| `REVIEW_SCOPE_CORE_IDENTITY_NOT_RECOMPUTED`    | `RECHECKED_PASS` |
| `REVIEW_STATE_TRANSITION_BYPASS`               | `RECHECKED_FAIL` |
| `SEMANTIC_OBLIGATION_POPULATION_UNCHECKED`     | `RECHECKED_PASS` |
| `STATE_AND_TRANSPORT_CHAIN_INCOMPLETE`         | `RECHECKED_FAIL` |

Candidate identity and convergence evidence each received `RECHECKED_FAIL`. The
literal Git identities match, but authoritative policy loading is not candidate-bound
and the exact materializations gate is red.

### R2-F001 through R2-F008

| Class                                                   | Disposition      | Result                                                                                                                   |
| ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `R2-F001 / AUTHORITATIVE_GATE_CANDIDATE_RED`            | `RECHECKED_FAIL` | Exact final candidate has a red authoritative gate.                                                                      |
| `R2-F002 / AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE` | `RECHECKED_FAIL` | Command closure is not recursively derived from workspace script and project semantics.                                  |
| `R2-F003 / AFFECTED_TEST_INPUT_POPULATION_INCOMPLETE`   | `RECHECKED_FAIL` | Deleted or renamed preimage loaders and indirect loader forms escape widening.                                           |
| `R2-F004 / RECHECKED_TOPIC_EVIDENCE_UNAUTHENTICATED`    | `RECHECKED_PASS` | Seven typed classes, self-reference refusal, raw-byte evidence, and role/path evidence were rechecked.                   |
| `R2-F005 / STATE_AND_TRANSPORT_CHAIN_INCOMPLETE`        | `RECHECKED_FAIL` | Persisted predecessor, payload, state-before, validation, and repair-population authentication remain incomplete.        |
| `R2-F006 / ACTIVE_CONTROL_CENSUS_ALLOWLIST_INCOMPLETE`  | `RECHECKED_PASS` | Exact current 55-control population and coordinated-declaration checks were rechecked.                                   |
| `R2-F007 / REVIEWER_BINDING_CENSUS_NOT_CANDIDATE_BOUND` | `RECHECKED_FAIL` | Policy and initial dispatch still consume mutable worktree bytes.                                                        |
| `R2-F008 / SEMANTIC_OBLIGATION_POPULATION_UNCHECKED`    | `RECHECKED_PASS` | Ten unique IDs, eight independent baseline paths, exact source digests, and baseline-pointer enforcement were rechecked. |

## Complete-class findings

### RUN2-F001 — authoritative exact-candidate roster is red

- Defect class: `AUTHORITATIVE_GATE_CANDIDATE_RED` (`R2-F001`).
- Severity: P1.
- Concrete evidence: the literal `materializations` roster command at the exact
  candidate returned exit 1 with `ROUND_INVALID`. The controller repairs that argv
  internally during convergence, so the declared command is not independently
  executable as OM-016 requires.
- Deterministic population query: enumerate
  `law/policy/round-close-controls.json.convergence.commands` in order and execute
  every exact `argv` from a clean detached exact-candidate checkout, retaining every
  terminal result.
- Complete affected population: all 16 roster IDs: formatting, preparation,
  action-registry, trace, repository-references, materializations, diff-check,
  ordinary, stage1, stage2, t4, t5, t6, changesets, coverage, and governance.
- Machine-checkable repair condition: all 16 literal argv arrays exit zero from the
  candidate root without hidden argument rewriting, and terminal evidence contains
  exactly those ordered 16 IDs even after a failure at any ordinal.

### RUN2-F002 — authoritative gate closure is not mechanically recursive

- Defect class: `AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE` (`R2-F002`).
- Severity: P1.
- Concrete evidence: `scripts/run-round-close-controls.mjs` reads only the root
  `package.json`. A `pnpm --filter <workspace> <script>` invocation is reduced to a
  label and `build` is hardcoded as `tsc`; the workspace package script is not read
  recursively. TypeScript project references and indirectly imported or spawned
  executable closure are not generally expanded. Focused tests cover nonempty
  declarations and one forged declaration, not this derived population.
- Deterministic population query: recursively resolve all 16 argv arrays through root
  and workspace scripts, filter selection, executable source and import graphs,
  TypeScript project references, generated outputs, environment and toolchain
  identities, and history-sensitive Git reads; compare that derived graph with the
  declared closure and freshness key.
- Complete affected population: all 16 gate rows; every reachable root script; every
  reachable workspace script in all 13 workspace packages; every referenced
  TypeScript project and output; every directly or indirectly invoked executable.
- Machine-checkable repair condition: changing any reachable workspace script,
  project reference, generated output, executable, or invocation edge changes the
  derived closure and key or fails validation. No script-name-to-program assumption
  can count as derivation.

### RUN2-F003 — base and preimage loader populations escape widening

- Defect class: `AFFECTED_TEST_INPUT_POPULATION_INCOMPLETE` (`R2-F003`).
- Severity: P1.
- Concrete evidence: `scripts/run-round-close-controls.mjs` scans ambiguous loaders
  only when the path exists in the current worktree. Deleted and renamed preimages are
  not loaded from the base Git object. Its regex classifier also misses destructured,
  indirect, applied, called, and computed nonliteral forms. Added tests cover six
  postimage forms but no deleted or renamed preimage.
- Deterministic population query: enumerate every status-aware candidate/base change
  record, load candidate and base/preimage blobs as applicable, parse every JS/TS
  module-loader reference and call form, and verify that unresolved forms select full
  suite plus whole coverage.
- Complete affected population: all tracked candidate paths; all deleted and renamed
  preimages; the 109 known runtime/test assets; every direct, aliased, destructured,
  wrapped, applied, bound, optional, computed, eval-based, `createRequire`,
  `require.resolve`, `import.meta.resolve`, and dynamic-import form.
- Machine-checkable repair condition: AST-based or equivalently conservative analysis
  scans exact candidate and base object bytes, and every unresolved loader in either
  image selects both `full-suite` and `full-coverage`.

### RUN2-F004 — state and transport chain remains incompletely authenticated

- Defect class: `STATE_AND_TRANSPORT_CHAIN_INCOMPLETE` (`R2-F005`).
- Severity: P1.
- Concrete evidence:
  - `previous_state_digest` is checked against a synthetic selected-field
    reconstruction instead of an exact persisted self-digested predecessor state.
  - State emission overwrites a supplied exact predecessor digest with that synthetic
    hash.
  - Transport reauthentication does not compare `payload_digest` or `validation`
    against actual payload and result bytes, and it only checks that
    `state_before_digest` has SHA-256 syntax.
  - Repair reauthentication checks an identity subset but does not reconstruct the
    complete repaired-class population at every consumption.
  - The exact-artifact regression is a source-string assertion rather than an
    executable adversary.
- Deterministic population query: mutate and re-self-digest every field across all 12
  allowed edges; attempts 0, 1, and 2; predecessor state and transition identities;
  transport payload, validation, state-before, and prior-attempt fields; result
  topics, findings, counts, and terminal fields; and repair-v2 classes and links.
- Complete affected population: all 12 policy edges; cycle 1 and cycle 2 state
  identities; every historical predecessor; attempts 0, 1, and 2; valid and invalid
  transport payloads; result identity, count, and terminal population; repair-v2
  links and classes; and `PASS`, `ESCALATION_REQUIRED`, and
  `REVIEW_TRANSPORT_BLOCKED`.
- Machine-checkable repair condition: persist or embed the exact prior self-digested
  state artifact for every transition; require `previous_state_digest` and
  `state_before_digest` to equal that artifact; authenticate transport payload and
  validation against exact bytes and a successful result; rerun full repair-class
  population validation on every read. Cycle 2 remains terminal on failure and Cycle
  3 remains impossible.

### RUN2-F005 — authoritative policy dispatch is worktree-mutable

- Defect class: `REVIEWER_BINDING_CENSUS_NOT_CANDIDATE_BOUND` (`R2-F007`).
- Severity: P1.
- Concrete evidence: `loadV4Context` always calls `loadPolicy`, which reads the
  worktree policy even when a literal candidate is supplied. Top-level dispatch reads
  mutable worktree policy before candidate resolution and can select the v3, v4, v5,
  or legacy handler from those bytes. Candidate-bound profile and mandate checks do
  not close that bootstrap boundary.
- Deterministic population query: independently dirty policy, profile, and every
  candidate mandate while HEAD remains fixed; invoke policy-check, entry-check,
  status, convergence, candidate proof, review-scope, and review-check with full,
  abbreviated, symbolic, and omitted revisions.
- Complete affected population: all seven authoritative consumers and all policy,
  profile, schema, and mandate authority inputs.
- Machine-checkable repair condition: a minimal immutable bootstrap resolves one
  literal candidate before dispatch; policy, profile, schemas, and mandate authority
  then load only via `git show <candidate>:<path>`. Dirty tracked substitutions cannot
  alter handler selection, schema, authority resolution, or verdict. Authoritative
  boundaries reject symbolic, abbreviated, omitted, and ambiguous candidates.

## Required stop

Review Run 1 and Review Run 2 are both consumed as substantive failures. This record
does not authorize another repair, a third review run, publication, merge, R-0007
entry, deployment, or release. Any continuation requires a separately named Owner
remediation campaign rather than a larger run number.
