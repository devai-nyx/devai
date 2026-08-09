---
id: R-0007-AS-BUILT
title: R-0007 exact-candidate as-built and pre-freeze audit
type: audit
status: active
date: 2026-08-09
authority: Auditor
round: R-0007
candidate: 376f7e3237d2ef6e1ffac44c526daeefe16352bb
declared_base: 9b435e5ca479a837baffe2b597c8ba582fec08f4
---

# R-0007 as-built and pre-freeze audit

## Disposition

**PRE-FREEZE BLOCKED.** This record is the Auditor's current-tree observation before
convergence and independent review. It does not claim convergence, review, closure,
publication, release, deployment, site readiness, authenticated result reuse, or R-0008
standing. The exact subject cannot enter convergence until the blocking classes below are
resolved under the named authority.

## Exact subject and boundaries

- Candidate and worktree `HEAD`:
  `376f7e3237d2ef6e1ffac44c526daeefe16352bb`.
- Candidate worktree was clean at the audit boundary.
- DII-257 declared base and cached `origin/main`:
  `9b435e5ca479a837baffe2b597c8ba582fec08f4`.
- The declared base is an ancestor of the candidate.
- `policy-check`, `status`, and `entry-check`, each invoked with the same literal candidate,
  exited zero.
- No push, pull request, merge, package publication, tag, GitHub Release, deployment,
  evidence promotion, real-stynx mutation, predecessor mutation, or R-0008 implementation
  was performed by this audit.

The positive entry posture does not override a later affected gate or contradictory
normative source. `AGENTS.md`, the shared execution contract, OM-017, OM-018, OM-019, OM-021,
the R-0007 plan, and the active close profile remain the controlling population.

## Blocking findings

### AB-F001 — P0 — REVIEWER_PROMPT_DRIFT_FROM_OWNER_SELECTOR

**Evidence.** OM-017's `Exact reviewer model binding` section and
`work/rounds/R-0007/close-control-profile.json#/reviewer` bind the governed R-0007 close
review to literal `claude-opus-5`, independent read-only, with fallback forbidden.
`work/rounds/R-0007/prompts/00-orchestrator.md#Mandatory reads and entry` says that the
selector lives only in that mandate and profile and may not be inferred or substituted.
`work/rounds/R-0007/prompts/09-audit-review-close.md`, however, assigns the independent
reviewer to `gpt-5.6-sol`.

**Complete affected population.** Independent reviewer selection, invocation identity,
review transport, review result, PASS standing, closing decision, and every downstream
candidate or publication claim.

**Disposition and authority.** BLOCKED pending Architect repair, not Owner escalation.
OM-017 already supplies the controlling exact selector and expressly forbids a competing
active selector. Architect must align the subordinate prompt to literal `claude-opus-5`.
The governed review must then use that selector with no fallback. No review under
`gpt-5.6-sol` can establish governed R-0007 PASS on the current authority.

### AB-F002 — P0 — PRE_OM_019_SITE_CLAIM_REMAINS_LOAD_BEARING

**Evidence.** OM-019 rebinds R-0007 to CLI/executor scope and assigns product semantics,
complete user documentation, site integration, and the deploy-ready artifact to R-0009.
The current R-0007 plan states that R-0007 does not claim complete narrative documentation
or a deploy-ready site. Despite that rebinding:

- `work/rounds/R-0007/current-claims.json` still declares pre-review claim
  `site.artifact`, requiring `runtime-inputs.pre-review.site_artifact_path`; and
- `work/rounds/R-0007/review-obligations.json` still says that the R-0007 artifact may be
  deploy-ready and binds candidate identity to a site artifact.

The latter registry also describes five planned projections, while the current canonical
handoff is governed by the post-OM-019 documentation information architecture.

**Complete affected population.** Claim-registry materialization, pre-review runtime inputs,
candidate manifest, review-topic generation, deploy-refusal and candidate-identity
obligations, current-claim dispositions, documentation-completeness denominator, and review
scope.

**Disposition and authority.** BLOCKED. Architect must correct the normative round inputs
under `work/rounds/R-0007/current-claims.json` and
`work/rounds/R-0007/review-obligations.json`, then refresh every mechanically derived digest
or provenance value, including `review-obligation-baseline.json` and
`control-provenance.json`. The repair must remove the R-0009 site artifact from the R-0007
pre-review population and retain an honest canonical-reference/no-site/non-release claim.

### AB-F003 — P0 — GOVERNED_SEQUENCING_AND_IMPLEMENTATION_MANIFEST_RED

**Evidence.** On the exact candidate, the literal affected gates report:

```text
pnpm run ci:sequencing
governed sequencing: FAIL
18 substantive R-0007 Engineer commits have zero binding owners

node scripts/check-implementation-path-manifest.mjs
implementation-path manifest: FAIL
109 exact commit-path members across those same 18 commits are absent from every Inspector
implementation-path manifest present in each commit's parent
```

The complete commit population and its manifest-violation count is:

```text
4a2f8a448db576957ece984c9611a19383525be1   2
e173023f275614ad25001c84b70886ff3e85e7b1   2
036edf4e9d4031d8e44eb72ef33dfeaf9e944d4a   3
60b29f8d2442176592c136cc5e5720532304bc16   2
952b33ef7eeb28b00b54d07be860b8e17cb95200   1
a1860416252aee63830321025b966471f1c36380   1
3104ac789f00058e842fad2fac56646fa4f83664   9
e0ea48e456ba4b8f2121cf0841e1480c94584298   9
6cd45d09b4f09b4d566013e05cd521455100ddb2  13
3aac8173b9be76e94cfb7efedecd36adf116b62e   7
c0621d31c16ca59b388984d896c6fd196ea2ba4f   3
9fb02c3da078fd3af312482590d6da1c803a5b3d   2
ff076d203338c3d6b40108342e3ef25d9a4e785e   8
0763eb3c1bb393761f0e6fb9149d76252586a740   1
3ac6fc6f3d9069915326c3778c96318d23c51ab4  41
9717369fb0533a5c65380ff37dce420128bf2782   2
5c741cd5f3a8ecf6019cf61d34dee9e1d9e7de68   1
c951ccf1b88e85fd8cd3ca8b2c465208083336a7   2
```

The gate is expressly retained by OM-018's `Control-surface freeze`; OM-017 requires
red-before-implementation and prospectively exact implementation-path binding; `AGENTS.md`
requires affected gates before committing. A manifest created now cannot become present in
an historical commit's parent. In particular, the acceptance commits for complete failed-task
resource rollback (`1143a68e7b8c05f5c2368188f05e0b331bb64aeb`), the non-mutating tier
plan (`0dcea78790af196e2e2803149b2c901d26deb735`), and publish-telemetry containment
(`376f7e3237d2ef6e1ffac44c526daeefe16352bb`) follow their respective Engineer repairs
`9717369fb0533a5c65380ff37dce420128bf2782`,
`5c741cd5f3a8ecf6019cf61d34dee9e1d9e7de68`, and
`c951ccf1b88e85fd8cd3ca8b2c465208083336a7`. Those three cannot be relabeled as prior
Inspector red.

**Complete affected population.** Every substantive implementation path in all 18 commits,
its prior Inspector manifest population, exact failing-red observation, Architect law
predecessor, role attribution, and the `ci:sequencing`, implementation-path-manifest, and
`ci:governance` consumers.

**Disposition and authority.** BLOCKED on the exact candidate. Current history cannot
mechanically satisfy the parent-tree manifest condition through a forward Inspector or
Architect commit. After this red observation, the Owner authorized an exact-18-commit,
history-preserving disposition in the active task, with the prospective gate unchanged and
publication still forbidden. That resolves the authority question but does not turn either
gate green. Inspector must first preserve the exception-mechanism red; Architect must
materialize the exact disclosure and distinguish the three actual ordering defects from the
15 manifest-only historical defects; Engineer may then teach the manifest checker to accept
only the exact Owner-dispositioned population if required. No role may manufacture prior
causality.

### AB-F004 — P0 — CLOSURE_MATRIX_STILL_DECLARES_FULL_ROUND_BLOCKED

**Evidence.** The close profile binds
`work/rounds/R-0007/current-closure-matrix.json`. Its current `full_round_closure.verdict` is
`BLOCKED`: 36 pre-entry classes are `GREEN_PROVED`, while the exact 14-member blocked
population remains `RED_REQUIRED` and `b0-dependent`:

```text
C2-F007, F003, F007, R1-F005, R2-F005, R3-F004, R7-F001, R7-F002, R7-F005,
R7-F014, R7-F015, R7-F016, R7-F017, R7-F018
```

The immutable prior-finding registry separately retains 45 source findings with no status
field; the closure matrix, not that registry, carries their current dispositions. The matrix
does not yet incorporate exact B1-B6 evidence, OM-019's R-0008 activation rebind, or the
still-unproved R7-F005 property in AB-F007.

**Complete affected population.** All bound prior findings and closure-matrix classes, with
special attention to state/transport, conservative widening, literal gate executability,
cache/artifact authority, workflow DAG/concurrency, classified validation, cold-sentinel
failover, and optimization measurement.

**Disposition and authority.** BLOCKED. Architect must update the bound structured records
from exact, independently checked B1-B7 evidence or leave each unproved class blocking. An
Auditor prose statement cannot override their machine-readable state.

### AB-F005 — P0 — PRE_OM_019_R7_ACTIVATION_BINDING_REMAINS_LOAD_BEARING

**Evidence.** OM-019 assigns performance activation and rollback to R-0008 while R-0007
retains only the controls needed to close its own work honestly. Nevertheless,
`law/policy/commit-validation.json#/activation` still carries the pre-rebinding B7 boundary:
it requires `work/audit/R-0007/ci-optimisation-benchmark.json`, semantic-population equality
first, and three baseline plus three candidate observations for each cold-miss and warm-hit
state on the same exact candidate and runner class before R7-F018 closure or R-0007 round
close. `work/rounds/R-0007/review-obligations.json` and the current closure matrix retain the
same stale requirement. The evidence file does not exist, and the current GitHub inventory
correctly identifies its single exact-main observation as an insufficient descriptive
baseline.

DII-257 simultaneously keeps this candidate local and defers push, pull request, merge, and
source reconciliation until after R-0008. A local-only candidate cannot produce the required
candidate GitHub-workflow sample on the bound runner class. This does not create authority to
publish; it demonstrates that the pre-OM-019 R-0007 activation binding is stale.

**Complete affected population.** The feature census's adopted-but-not-active features,
classifier activation, dependency-cache activation, cold and warm samples, semantic
population comparison, critical-path median, rollback proof, R7-F018, and the round-close
precondition.

**Disposition and authority.** BLOCKED pending Architect repair, not Owner escalation.
OM-019 already rebinds activation, cross-gate authentication, false-green adversaries, and
rollback to R-0008. Architect must align the R-0007 policy, obligation, and closure records to
that mandate: R-0007 may prove only the implemented fail-closed foundation, must leave
narrowing and cache acceleration disabled, must defer R7-F018 activation/measurement to
R-0008, and must make no saving or activation claim. No external run is authorized or needed
to make that scope correction. The affected normative population includes the R-0007 plan,
prompt 09, `law/policy/commit-validation.json`, `review-obligations.json`, and
`current-closure-matrix.json`, plus every derived digest or projection of those sources.

### AB-F006 — P1 — OM_018_CONTROLLER_DECOMPOSITION_BATCH_OMITTED

**Evidence.** OM-018's `What moves into R-0007` section expressly moves decomposition of
`scripts/run-round-close-controls.mjs` into R-0007 governed batch work. The committed
`work/rounds/R-0007/om-018-deferrals.json` records the same destination. The current
post-OM-019 plan and orchestrator contain no batch that discharges or lawfully redispositions
that work; no commit after the DII-257 opening base changes the controller; and the exact
candidate still carries the controller as one 11,396-line file.

**Complete affected population.** The complete controller, including policy/profile loading,
candidate resolution, claim materialization, impact/freshness planning, convergence command
execution, review-scope construction, review transport/state persistence, result validation,
and command dispatch. A partial extraction cannot disposition the mandate's unqualified
decomposition obligation.

**Disposition and authority.** BLOCKED pending governed batch repair, not Owner escalation.
Existing OM-018 and OM-019 authority is sufficient to decompose the R-0007 close control
needed for honest local close. Architect must first bind the module boundaries and update the
canonical plan; Inspector must preserve discriminatory red contracts before Engineer
extraction; Engineer must preserve literal argv, candidate identity, state, and output
semantics; Auditor must re-census the complete result. Deferring or waiving this obligation
beyond R-0007 would require a new Owner disposition, but implementing it in R-0007 does not.

### AB-F007 — P1 — INDEPENDENT_PER_COMMAND_COLD_EXECUTABILITY_UNPROVED

**Evidence.** OM-018 and `work/rounds/R-0007/om-018-deferrals.json` retain the lost R7-F005
property as R-0007 work: every one of the sixteen authoritative commands must exit zero when
started independently in its own freshly installed detached clone, without relying on
outputs from an earlier roster row. OM-020 later requires the scheduler repair to retain that
same independent freshly installed detached-checkout proof. The former self-reentrant
`R7-005-SIXTEEN-LITERAL-DETACHED` contract was deliberately deleted because it recursively
caused four roster traversals. The exact candidate contains no executable test carrying that
identity and no replacement non-reentrant per-command evidence. The reported B6 floor and
the pre-entry ordered sixteen-row run establish different, weaker properties.

**Complete affected population.** All sixteen literal convergence command identities and
argv arrays; sixteen independent detached candidate checkouts and frozen installations; the
required inputs, outputs, environment, and exit of each isolated row; and the absence of
dependency on artifacts emitted by any other row.

**Disposition and authority.** BLOCKED pending Inspector proof under existing Owner
authority. The proof must live outside every suite that the sixteen-row roster itself invokes,
must preserve literal argv and independent fresh-install semantics, and must retain every
terminal exit. Any attempt to substitute one sequential clone, shared outputs, recursive
suite execution, argument injection, timeout inflation, or a smaller population does not
close R7-F005. Waiving or weakening the property would require a new Owner disposition.

### AB-F008 — P0 — COVERAGE_PROFILE_B6_TIMEOUTS

**Evidence.** The original literal coverage process terminated with exit 1 after 2,751.32
seconds: three failed and 196 passed files; three failed, 1,870 passed, and eight skipped
tests. That run has no exact-candidate evidence standing because this audit file was created
and initially remained unformatted in the same worktree while the run was active; the third
failure observed that concurrent mutation. It is retained only as an invalidated terminal
attempt, not as current coverage or cleanliness evidence.

Two separate focused reproductions under the coverage configuration isolate the genuine
candidate defects without relying on that invalid run:

- `R7-B6-ENUMERATION-PARITY-006` in
  `tests/contract/r0007-b6-enumeration-parity-runtime-structure.contract.test.ts` times out at
  its original five-second budget. The complete three-test file passes only under a
  diagnostic explicit 60-second budget.
- `R7-B6-USABILITY-EXAMPLES-008` in
  `tests/e2e/r0007-b6-usability-examples-routing.e2e.test.ts` times out at its explicit
  90-second budget. The exact case passes only under a diagnostic explicit 180-second budget.

The diagnostic timeout overrides demonstrate that the assertions can complete; they are not
authorized repairs and do not make the literal coverage gate green.

**Complete affected population.** The two exact B6 cases above under the custom subprocess-V8
coverage provider, their complete inventory-member and canonical copy/paste-example
populations, the unchanged per-test budgets, all selected coverage files/tests, the four
70/60/70/70 thresholds, terminal report generation, exact-candidate cleanliness, and final
exit.

**Disposition and authority.** BLOCKED pending the already authorized bounded Engineer
repair and a clean Inspector rerun. OM-020 forbids a timeout increase, worker-environment
override, skipped/sharded member, cache substitute, coalesced proof, or reduced population as
the repair. Engineer must make both cases complete inside their original budgets without
changing test semantics; Inspector must rerun the focused original-budget reds and the
literal full coverage command from a dedicated clean worktree. No metric or threshold from
the invalidated attempt may be cited.

## Repair authority census

After the red census, the Owner authorized the exact AB-F003 historical disposition and all
other role-only local close actions listed here. The authorization permits repair; it does not
waive a gate, prove a class, authorize publication, or change role-path ownership.

| Finding                                           | Required next authority                                                                                                            | Owner choice required?                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| AB-F001 reviewer prompt drift                     | Architect aligns prompt 09 to OM-017; reviewer later uses literal `claude-opus-5`                                                  | no                                                                                       |
| AB-F002 stale site claim                          | Architect removes R-0009 site/deploy-ready inputs from the R-0007 claim and obligation population                                  | no                                                                                       |
| AB-F003 historical manifest/sequencing failure    | Inspector, Architect, and Engineer implement only the exact authorized exception mechanism while preserving the prospective rule   | **granted after this red observation; no further Owner choice in the authorized bounds** |
| AB-F004 stale closure/prior-finding records       | Architect reclassifies each exact class only after current evidence; any unproved member remains blocking                          | no                                                                                       |
| AB-F005 stale activation binding                  | Architect aligns R-0007 to OM-019's disabled/deferred/no-saving boundary                                                           | no                                                                                       |
| AB-F006 omitted controller decomposition          | Architect binds the omitted batch, Inspector supplies red, Engineer decomposes without semantic change, Auditor rechecks           | no, unless it is waived or moved out of R-0007                                           |
| AB-F007 missing independent literal-command proof | Inspector executes the non-reentrant sixteen-member isolated proof and records every exit                                          | no, unless the property is waived or weakened                                            |
| AB-F008 coverage-profile B6 timeouts              | Engineer repairs both exact cases within their original budgets; Inspector reruns focused reds and the clean literal coverage gate | no                                                                                       |

No forward-created Inspector manifest can satisfy AB-F003 because the gate reads each
Engineer's parent tree. History rewriting is not authorized. Therefore the now-authorized
exact historical exception is the only history-preserving closure design identified by this
audit; it must not alter the rule for any future Engineer commit.

## Prompt 09 topic census

Each prescribed audit topic has exactly one current pre-freeze disposition. `PASS-AS-BUILT`
means the exact B6 candidate and its complete reported floor support the observation; it does
not mean convergence, independent review, or round close has occurred.

| Prompt 09 topic                                                                                                        | Disposition                        | Exact support or blocker                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| authorization and live pre-RC standing                                                                                 | `BLOCKED`                          | AB-F001 through AB-F008; entry checks remain green but do not override affected red gates                                                                      |
| exact action and historical counts                                                                                     | `PASS-AS-BUILT`                    | canonical action registry and exact Git/source census re-read below                                                                                            |
| complete 147-row migration disposition                                                                                 | `PASS-AS-BUILT`                    | one-to-one migration contracts and B6 migration/reference acceptance                                                                                           |
| seven-domain help and hidden plumbing                                                                                  | `PASS-AS-BUILT`                    | live default and expanded help plus surface contracts                                                                                                          |
| suite, preset, kind, slice, and tier policy/runtime/docs parity                                                        | `PASS-AS-BUILT`                    | B6 enumeration bijection/runtime-structure acceptance and canonical sources                                                                                    |
| round-task containment, executor dispatch, model routing, execution evidence, migration refusal, and resource rollback | `PASS-AS-BUILT`                    | B1/B4 executable contracts, B3A/B3B implementation, and final rollback repair on this candidate                                                                |
| actual capability/effect consistency                                                                                   | `PASS-AS-BUILT`                    | B4 authority/effect acceptance and source registry census                                                                                                      |
| output/error totality                                                                                                  | `PASS-AS-BUILT`                    | output contracts plus final publish-telemetry repair and B6 acceptance                                                                                         |
| user-document completeness and example validity                                                                        | `PASS-AS-BUILT-WITH-R0009-CEILING` | canonical machine/minimum operator handoff is covered; full narrative/site completeness is excluded by OM-019 and AB-F002 must remove stale inputs             |
| full gates, coverage floors, generated parity, and clean state                                                         | `BLOCKED`                          | B6 ordinary floor and generated checks passed, but AB-F003/AB-F006/AB-F007/AB-F008 require repair; B7 convergence and final coverage evidence are not complete |
| GitHub Actions feature dispositions, trust, DAG, concurrency, event mapping, and cost claims                           | `BLOCKED`                          | implemented fail-closed foundation is covered; stale activation/measurement obligations require AB-F004/AB-F005 correction                                     |
| four-class derivation, adversarial widening, bootstrap, sentinel failover, machine evidence, and paired benchmark      | `BLOCKED`                          | classifier/sentinel foundation is covered and disabled; paired activation/benchmark belongs to R-0008 under AB-F005                                            |
| removed-capability and non-release disclosure                                                                          | `PASS-AS-BUILT-WITH-SCOPE-REPAIR`  | migration/tombstone and non-release disclosures are present; AB-F002 must remove the contradictory site claim                                                  |

## Bound structured population census

The following values were parsed again from the exact candidate rather than copied from an
earlier audit:

- The review-obligation registry contains 12 obligations: seven P0, four P1, and one P2. All
  12 are `always-recheck`, and the registry binds 13 normative sources. AB-F002 affects the
  exact obligation members `R7-P0-DEPLOY-REFUSAL`, `R7-P0-CANDIDATE-IDENTITY`, and
  `R7-P1-GENERATED-IDENTITY`; the other nine retain their current meaning.
- The current-claim ledger contains six claims: five pre-review and one post-publication.
  `site.artifact` is the one invalid R-0007 pre-review member identified by AB-F002. The
  post-publication `ci.exact-head` claim remains unavailable under the local-only boundary
  and is not used for this pre-freeze audit.
- The prior-finding registry contains 45 immutable source findings: six P0, 35 P1, and four
  P2. It has no closure-state field. The bound current matrix contains 50 class rows: 36
  `GREEN_PROVED` pre-entry rows and the 14 `RED_REQUIRED` rows enumerated in AB-F004.
- The affected-test graph contains 15 test nodes and one 16-member identity for each of the
  authoritative-gate, gate-freshness-profile, and command-closure populations. These counts
  do not satisfy AB-F007's missing independent execution evidence.
- Control provenance binds 11 decisions, seven Owner mandates, five manifest roots, five
  derived sources, and 13 normative source roots. Any Architect repair must regenerate and
  revalidate these exact populations rather than hand-editing a digest.
- Governed sequencing contains 46 normal bindings and 13 exact historical-commit exception
  records. None owns any of AB-F003's 18 commits. The sequencing checker recognizes those
  exact exceptions; the implementation-path-manifest checker currently does not, which is
  why an Owner-authorized exception repair may require bounded Engineer checker support.

## Positive as-built observations retained pending repair

These observations are exact-candidate facts, not closure standing:

- The action registry contains 222 never-reminted identities: 42 supported keeps, 169
  folds, and 11 tombstones. The supported surface is 31 porcelain actions and 11 hidden
  plumbing actions.
- The opening-base migration map states and executable acceptance tests bind all 147
  formerly runnable identities to exactly one disposition.
- Default help exposes exactly seven domains: `init`, `doctor`, `check`, `sense`, `round`,
  `evidence`, and `release`; expanded help adds only hidden `task` and `catalog` plumbing.
- Canonical policy carries four check suites, four sense presets, 59 registered sensor kinds,
  12 inventory slices, three adoption tiers, four executor kinds, three selection modes,
  four runtimes, five rostered models, and seven supported effort values. These are source
  populations for the exact candidate and must be re-read after any repair.
- The GitHub Actions feature registry contains 37 exact dispositions: 20 `adopt`, nine
  `defer`, and eight `reject`. Only five members are `active-existing`; 15 adopted members
  remain `policy-adopted-not-active`. The four-file workflow lint passes, and none of those
  facts is an activation or saving claim.
- The complete B6 Vitest floor reported 199 files, 1,873 passed tests, and eight governed
  skips. That result does not satisfy the separate red governance gates above and does not
  substitute for the two clean convergence passes.
- The canonical R-0007 documentation is a minimum operator/migration handoff to R-0009 and
  consistently disclaims complete narrative documentation, deploy-ready site, release, and
  publication standing.

## Gate ledger at this audit point

| Gate or proof                                  | Exact-candidate disposition                        |
| ---------------------------------------------- | -------------------------------------------------- |
| clean worktree and base ancestry               | PASS                                               |
| policy-check / status / entry-check            | PASS                                               |
| complete B6 Vitest floor reported by Inspector | PASS                                               |
| governed sequencing                            | FAIL — AB-F003                                     |
| implementation-path manifest                   | FAIL — AB-F003                                     |
| B7 paired CI benchmark                         | STALE R7 PREREQUISITE — AB-F005                    |
| current-claims scope                           | FAIL — AB-F002                                     |
| machine closure matrix                         | BLOCKED — AB-F004                                  |
| controller decomposition                       | MISSING — AB-F006                                  |
| independent per-command cold proof             | MISSING — AB-F007                                  |
| literal full coverage                          | INVALIDATED EXIT 1; focused timeout reds — AB-F008 |
| reviewer prompt                                | DRIFT — AB-F001                                    |
| convergence pass 1                             | NOT STARTED                                        |
| convergence pass 2                             | NOT STARTED                                        |
| exact-candidate independent review             | NOT STARTED                                        |
| R-0007 close                                   | NOT AUTHORIZED ON THIS SUBJECT                     |

Any semantic, normative, test, current-documentation, or audit repair changes the candidate
and invalidates the exact-subject observations that depend on it. The next Auditor pass must
re-read the complete population from the repaired exact candidate.
