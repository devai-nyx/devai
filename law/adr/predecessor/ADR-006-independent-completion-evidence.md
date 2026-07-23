---
adr_id: ADR-006
title: Independent completion evidence remains report-only
status: accepted
date: 2026-07-20
authors: ["@aarusso"]
tags: [completion-evidence, translation-validation, report-only, isolation, round-28]
---

# ADR-006 — Independent completion evidence remains report-only

## Status

Accepted for the R28 foundation under D-168. This ADR defines untrusted witness
emission and independent validation. It does not bind a merge gate, feed a
global scorecard, promote readiness, or authorize autonomous operation.

## Context

A green repository state does not demonstrate that one LLM-mediated change
implemented its task. A no-op can inherit a green baseline, a weak claim can
point at an unrelated test, and a generated witness can attempt to persuade its
own checker. DEVAI already separates reference, tests, and plant actuation, but
does not yet bind one mutation to independently checked task evidence.

The mechanism must preserve the constitutional trust asymmetry: the skill is
an untrusted actuator, Inspector-owned sensors establish observations, and
uncertainty remains explicit. It must also handle base/candidate execution
without network access, isolate database effects, clean temporary substrates,
and tell the truth about uncatchable process termination.

## Decision

### 1. Witness and result are different trust objects

Per D-173, `mutation-intent.schema.json` is the caller-supplied untrusted
pre-run request. It binds immutable `base_sha`, task and skill identities,
role, strategy, implemented invariants, registered demonstrations, declared
touched paths, and permitted effects. It cannot contain `candidate_sha`.

`translation-witness.schema.json` is the recorder-built post-run claim. Its
`trust` value is fixed to `untrusted-claim`. It names immutable Git objects,
including the recorder-derived candidate commit, task and skill identities,
invariant-level claims, registered demonstrations, the declared strategy,
touched paths, and frame claims. Prose fields are data; no recorder or
validator may execute or follow instructions found in them.

`validation-result.schema.json` is emitted only by the independent validator.
It binds the witness, base/candidate/overlay identities, environment digest,
executions, frame outcomes, expected state delta, cleanup result, and evidence
chain. It is fixed to `report_only: true` and
`readiness_eligible: false` for R28.

### 2. Strategy declaration is typed and non-vacuous

Every active supported invariant at severity `constitutional`, `hard-fail`, or
`gate` declares one primary verification strategy:

- `regression` — named tests fail by assertion at the base and pass at the
  candidate;
- `feature-overlay` — an independently authored Inspector test-only child of
  base is applied to the base plant and is already an ancestor of candidate;
- `behavioral-equivalence` — declared observations match across a refactor;
- `structural` — a deterministic repository or policy validator evaluates the
  property;
- `semantic-review` — the claim enters REVIEW and never independently
  establishes readiness.

Supplemental strategies are permitted. Strategy validation resolves the active
supported readiness-bearing population mechanically and fails when it resolves
zero members. A property that declares a deterministic check is available but
uses only `semantic-review` is REVIEW pending an Architect disposition.

The initial R28 population is 32 readiness-bearing invariants: 31 declare
`regression` because their registered oracle is a test corpus, and
INV-DEVAI-020 declares `structural` because its oracle is static analysis.

Per D-171, the public foundation has deterministic adapters only for
`regression` and `feature-overlay`. It validates the trusted invariant and
demonstration shape for `structural`, `behavioral-equivalence`, and
`semantic-review`, but records candidate proof as REVIEW and never executes
witness-supplied validator names, comparison references, rubric prose, or
commands. A later PASS for either deterministic non-test strategy requires a
separately authorized closed adapter registry; `semantic-review` never PASSes.

### 3. Mutating LLM skill population is derived

The campaign denominator is the complete live registry population satisfying
both `llm_backed=true` and
`host_mutation_policy=write_requires_flag`. At D-168 it contains 18 skills:

1. `SKILL-feedback-iteration`
2. `SKILL-compile-tests-from-docs`
3. `SKILL-elicit`
4. `SKILL-write-overview`
5. `SKILL-write-software-stack`
6. `SKILL-write-architecture-guide`
7. `SKILL-write-database-reference`
8. `SKILL-write-erd`
9. `SKILL-write-api-map`
10. `SKILL-write-frontend-routes-map`
11. `SKILL-write-rbac-matrix`
12. `SKILL-write-compliance-lgpd`
13. `SKILL-write-compliance-gdpr`
14. `SKILL-write-compliance-ccpa`
15. `SKILL-write-fp-report`
16. `SKILL-write-threat-model`
17. `SKILL-write-onboarding`
18. `SKILL-plan-blueprint`

This list is an entry observation, not a maintained constant. Runtime and tests
recompute the predicate from the canonical registry; any added or removed
member changes the denominator automatically.

### 4. Validator authority and effects are explicit

The canonical action is `verify translation`. It is Inspector-authorized and
requires explicit write consent because it records F5 state and provisions
temporary substrates. Its declared capabilities are:

- `fs:worktree-admin` for exact base/candidate/overlay materialization and
  cleanup;
- `db:read` and `db:write` for a separately named task database;
- `fs:f5-state` for leases, results, readings, and Article-32 evidence;
- `process:spawn` for registered test execution and the isolation runner.

The action may resolve a test only through trace plus registered suite
configuration. The witness cannot supply a command, executable, environment
override, database name, worktree path, or cleanup selector.

The read-only companion `spec validate invariant strategies` checks the
readiness population, non-vacuity, declaration shape, and semantic-only REVIEW
rule. It does not run a witness.

### 5. Supported isolation is Linux-container scoped

Supported execution uses an immutable Linux container image identity with its
network namespace disabled. Direct egress attempts must fail in Linux CI. The
repository worktree is mounted at an exact read/write mode selected by phase;
credentials unrelated to the isolated task are not inherited.

Native macOS sandboxing is best-effort and always records
`readiness_eligible: false`. A local denial does not widen the supported
platform claim. Database isolation means one Postgres database per validation
task on a shared cluster; it does not claim cluster isolation.

Per D-172, the result distinguishes the configured runner from proof actually
reached by the run. Only a test-backed Linux execution that invokes the trusted
container runner without an infrastructure-class execution failure records
`network_egress: denied`. macOS, non-test strategies, and runs that do not reach
that boundary record `not-proven`; their network frame is REVIEW rather than a
fabricated PASS.

### 6. Cleanup uses a durable lease and recovery sweep

Before provisioning, the validator writes a schema-derived lease containing
only the exact validation id, task id, worktree id/path, database name, base
identity, and creation time. Normal completion, failure, timeout, and catchable
termination remove both substrates in a `finally` boundary, verify absence,
then retire the lease.

`SIGKILL` and power loss cannot execute cleanup. Every invocation therefore
performs a bounded next-start scan of owned leases before new provisioning.
It removes only schema-valid exact targets. A malformed lease, target mismatch,
or failed removal is FAIL and blocks the new validation. There is no broad
glob-based deletion or caller-selected cleanup target.

### 7. Frames are independently recomputed

The validator recomputes, rather than trusts, witness structure; non-no-op
change; strategy-specific proof; scope; Article-6 authority; test weakening;
inventory confinement; declared versus inferred effects; infrastructure
health; network denial; strategy coverage; expected state delta; and cleanup.
Infrastructure and network are separate frames: a database, worktree, recovery,
or registered-execution infrastructure failure is not mislabeled as an egress
breach. Network PASS requires a reached test-backed Linux container invocation
under the trusted fixed `--network none` adapter; macOS and unreached/non-test
execution are REVIEW/`not-proven`. Regression executes the base and candidate
with unchanged test bytes. Feature-overlay requires an
Inspector test-only direct child of base, executes those exact bytes against
the base plant, requires candidate descent from the overlay, and verifies that
the candidate preserved the overlay tests. A crash, missing file, load error,
timeout, signal, or infrastructure failure is never accepted as the red
assertion proof.

The authority frame uses the constitutional role/path partition plus declared
repository extensions. Owner owns product specifications and the joint
glossary; Architect owns non-product documentation, the joint glossary,
`README.md`, and declared root governance; Inspector owns tests and test-intent
configuration; Engineer owns plant/tooling. No ordinary witness role owns the
Constitution, generated inventory, F5, or Auditor observation paths.
One typed classifier supplies both this authority verdict and the inferred
filesystem effect; a second table may not reinterpret an allowed path. The
test/test-intent classification has precedence over broader directory classes.

Linux isolation is positively reached, not inferred from a spawn attempt. The
fixed container entry wrapper emits a runtime-owned start marker from inside
the `--network none` container before it executes the registered command; the
host strips that marker from command output and records network PASS only when
the marker is present. A missing Docker binary, unavailable daemon/image/mount,
or missing marker is infrastructure FAIL and network REVIEW.

Strategy coverage is not a constant. Every implemented invariant resolves from
the trusted repository, declares the witness primary strategy, has a matching
primary demonstration kind, and—when test-backed—resolves every cited test
through the trusted trace. Unsupported non-test adapters produce REVIEW, not a
fabricated PASS.

The ordinary hard gate remains required. Completion evidence complements the
repository state sensors; it does not replace them.

### 8. Expected state is trusted policy, not witness content

The validator derives a per-run expected-diff manifest from trusted action
policy and exact ids. It may include only:

- the exact lease create/retire operation;
- the exact witness and validation-result records;
- the exact validation SensorReadings;
- the corresponding append-only evidence-chain records;
- the existing skill-run record that embeds the witness.

Per D-169, the existing skill-run record is resolved by scanning only the exact
trusted skill directory for a unique record containing the witness id. Its live
ISO-timestamp filename is preserved. The witness and caller cannot select that
path, and R28 does not invent or retrofit a parallel run-id namespace.

The result records expected, observed, and unexpected changes plus the manifest
digest. `observed` is derived from independently inspected repository state and
recorded lifecycle events; it is never populated by copying `expected`. The
schema permits unexpected items so a failing result can preserve the exact
evidence that made it fail. Any unexpected item forces FAIL. Temporary
worktrees and databases must be absent at completion and are not excused as
expected repository state.

### 9. Campaign and promotion boundaries remain separate

After the foundation ships, one read-only inspection at that exact main SHA may
select real backlog candidates without generating a commit or CI run. Closure
requires the complete derived mutating-skill population, at least five real
unrelated Auditor-selected tasks, independent validation of every witness,
Inspector adversarial review, an Auditor dossier, an Architect close, and the
post-shipping phase-closure record.

No task is manufactured to reach the floor. A different round requires its own
Owner authorization and declaring decision. Task results do not aggregate into
a global scorecard in R28, and neither a streak nor a pass count automatically
changes gates, readiness, or autonomy.

### 10. Candidate provenance is derived after one run

Per D-173, campaign actuation begins only in a dedicated clean worktree at the
intent's exact `base_sha`. The registered skill runs exactly once. A
deterministic non-LLM recorder derives the produced delta afterward and rejects
no-op, undeclared, wrong-authority, out-of-scope, inventory, F5-configuration,
input/evidence, byte-mismatch, and unexpected state changes.

The recorder constructs an immutable commit with `base_sha` as its sole parent
and a tree containing exactly the base plus accepted produced bytes. It then
builds the witness and stamps the recorder-derived `candidate_sha`; caller
candidate provenance is rejected. A namespaced ref or evidence branch retains
the candidate. Any subsequent evidence commit descends from it, changes no task
bytes, and contains only runtime-attributed skill/witness state. Failure
preserves exact evidence, never counts, and cleans only exact campaign-owned
substrates without moving, resetting, or deleting unrelated work or refs.

### 11. Every mutating denominator member emits candidate bytes

D-173's truthful recorder path applies to every live skill in the mechanically
derived denominator. A skill registered with `llm_backed=true` and
`host_mutation_policy=write_requires_flag` cannot satisfy that contract by
returning only in-memory evidence: the recorder must reject the resulting
no-op. `SKILL-elicit`, `SKILL-plan-blueprint`, and
`SKILL-compile-tests-from-docs` therefore emit deterministic task- or
invariant-keyed candidate artifacts within their existing declared authority
scopes. They refuse an existing output path instead of overwriting it. The
caller still cannot select candidate provenance, and runtime evidence remains
excluded from the candidate tree.

### 12. Real skill actuation stays inside the local-LLM authority adapter

Per D-174, `agent skill run` may invoke the existing authenticated host CLIs
only as typed non-publication remote targets: system `local-llm`, endpoint
`claude` or `codex`, operation `invoke`. The production host-process classifier
and the action's bounded policy selectors must describe that same target.

This permission does not authorize a shell, arbitrary executable, network
endpoint, credential access, publication, or additional filesystem scope. An
unrecognized process remains fail-closed. The integration contract exercises a
fixture subprocess through the production authority boundary so mock LLM
coverage cannot conceal selector drift.

### 13. Structured output carries the exact nested response schema

Per D-175, `response_format_json` alone requests only best-effort JSON. A local
CLI bridge may advertise structured output only when the caller supplies the
JSON Schema for the exact response envelope. Claude receives the schema inline.
Codex receives the same schema through a read-only packaged JSON asset because
its CLI accepts a file path; the bridge verifies object identity before
invocation and accepts only the final `agent_message` from the JSONL event
stream. It creates no schema or output scratch and gains no filesystem write
authority. Without a schema, the bridge omits the structured-schema argument
and parses the normal JSON result best-effort.

Every mutating LLM skill supplies a closed top-level schema through its shared
response-contract family. Arrays, their item objects, and consumed nested
properties are typed explicitly. Intentionally extensible payload bodies, such
as a draft blueprint, may remain open only at that named boundary. The existing
skill parser still validates the returned runtime shape. DEVAI does not coerce
JSON-encoded strings into arrays or objects after receipt.

Both selectors are completion-only. Claude has built-in tools and customizations
disabled and persists no session. Codex is ephemeral, ignores user/repository
instruction overlays, and runs in its read-only sandbox. The bridge cannot be
used as an undeclared editor or shell merely because the authenticated provider
CLI is agent-capable.

The first post-D-174 `SKILL-elicit` actuation is retained as excluded red
evidence: the generic schema admitted stringified nested arrays and the recorder
rejected the resulting no-op. No candidate, witness, or count was created. A
fresh epoch begins only after the D-175 correction ships and its exact first-main
CI and Release succeed.

### 14. Immutable evidence carries its trusted resolver closure

Per D-177, the evidence commit is portable validation input, not a pointer to
ambient ignored state. After the skill record, standalone witness, and agent
run are persisted, the recorder constructs an explicit runtime-attribution
closure. It validates every path and may force-add only those ignored
`.devai/state/**` records to the temporary evidence index. The resulting commit
must contain exactly one eligible skill record whose embedded witness is
byte-identical to the standalone witness used by the Linux resolver, plus the
exact agent-run attribution and any recorder-observed LLM usage state.

The evidence commit remains a sole child of the recorder-derived candidate and
cannot alter candidate task bytes or the user's branch/index. Inspector proof
checks resolution from an isolated checkout of the evidence tree. A witness
that resolves only in the producing worktree but not from the immutable
dispatched ref is missing evidence and fails closed.

### 15. Immutable evidence carries the exact task dependency

Per D-178, portable validation input also includes the exact task record named
by the witness at `.devai/state/tasks/<task_id>.json`. The recorder accepts only
that identity-derived path, requires an ordinary non-symlink file, validates it
against `task.schema.json`, and requires its `id` to equal the witness
`task_id`. Missing, malformed, mismatched, duplicate, or caller-selected task
state fails before an evidence ref is retained.

The task record is a pre-existing validator input, not candidate output. It is
excluded from the candidate tree, force-added only to the evidence child, and
recorded as a file read rather than a file written by the skill invocation.
This lets an isolated Linux checkout derive modules, substrates, invariant
scope, and strategy coverage from the same bytes the producing recorder used.

### 16. Linux red evidence is collected before it is rejected

Per D-179, the trusted Linux adapter materializes an empty `node_modules`
directory only when the disposable validation worktree lacks that exact nested
mount target and a shared dependency tree will be bound there. The directory is
removed after Docker returns or throws only when the adapter created it. The
repository, dependency tree, network, image, command envelope, timeout, and
runtime-owned isolation-marker contracts otherwise remain unchanged.

The non-secret workflow separates evidence collection from acceptance. A
unique schema-valid FAIL result is copied and uploaded with a `fail`
SensorReading and its actual cleanup summary before the final acceptance step
returns red. Collection never turns FAIL into REVIEW, while acceptance still
rejects FAIL frames, missing Linux isolation proof, incomplete cleanup, and
unexpected repository state.

### 17. Product-draft blueprint planning speaks with Owner authority

Per D-180, `SKILL-plan-blueprint` declares Owner authority because its bounded
candidate output is `docs/framework/product/draft/blueprints/<task_id>.json`.
That path remains an Article-6 Owner substrate. The shared translation
classifier is not widened with a skill-specific Architect exception.

The recorder validates the live skill authority against the mutation intent
before actuation. An Owner intent for the exact task-scoped blueprint draft may
proceed; an Architect intent fails before the provider is contacted. The skill
still drafts rather than ratifies, the Owner still curates the output, and the
candidate remains report-only and excluded from shipping disposition.

### 18. Codex CLI actuation uses a provider-supported default model

Per D-181, authenticated Codex CLI actuation defaults to `gpt-5.6-sol`.
An explicit caller-supplied model remains authoritative. This corrects only
the provider selector: the adapter remains ephemeral, ignores user and
repository instruction overlays, uses the read-only sandbox, supplies the
packaged response schema through `--output-schema`, and consumes final JSONL
output. It gains no shell, editor, network, or repository-write authority.

The E195-A epoch remains excluded because its caller note misstated the shipped
decision. E195-B retains its valid C1 local and Linux evidence as non-counting
evidence from an incomplete epoch; its C2 attempt remains a recorder-rejected
no-op with no candidate, witness, evidence commit, or retained ref. A wholly
fresh epoch may begin only after the selector correction ships and exact-main
CI and Release succeed.

### 19. Blueprint structured output is a closed minimal module core

Per D-182, the plan-blueprint response contract closes its nested `blueprint`
object around the minimum shape already required by the skill prompt:
`schemaVersion`, `id`, `module`, and `database.entities`. Module metadata,
entities, primary keys, and fields are explicitly typed and closed at every
object boundary. Optional module-blueprint sections remain absent when the
input cannot ground them; uncertainties remain explicit in `gaps` and
`follow_up_questions`.

This is a provider-neutral JSON response contract. DEVAI does not encode the
blueprint as a string, coerce provider output after receipt, relax the canonical
module-blueprint schema, or grant the CLI any new authority. The prior 93b
epochs remain excluded/incomplete; another campaign begins only after this
correction ships and exact-main CI and Release succeed.

### 20. Test weakening is measured from immutable base and candidate bytes

Per D-183, translation validation delegates changed test paths to the canonical
deterministic test-weakening sensor while the exact candidate checkout exists.
The sensor compares those bytes with the witness base. A new bounded candidate
test-plan file is additive and does not weaken prior evidence; assertion loss
or new disabled state in an existing test remains fail-closed. The caller
cannot provide the result, choose another baseline, or bypass feature-overlay
immutability.

The failed C3 result `VR-e4be799f2bfcbc7c` and Linux run `29916691624` remain
red evidence from an excluded epoch. No later success relabels them.

### 21. Feedback iteration applies source-grounded exact replacements

Per D-184, `SKILL-feedback-iteration` no longer asks a provider to reconstruct
an existing file as a whole-file response. Its closed structured-output
contract emits `{ path, find, replace }` entries. The host supplies bounded
source context only for exact caller-declared file scopes, refuses glob
expansion and out-of-worktree resolution, and never silently truncates a file.

The deterministic writer prepares the complete batch in memory, requires each
non-empty anchor to occur exactly once, rejects no-op and ambiguous changes,
and performs no write when any replacement is invalid. Re-sensing and task
acceptance remain mandatory after application. The experimental opt-in,
authority, explicit consent, recorder-derived provenance, report-only posture,
and independent validation boundary are unchanged.

The a15e epoch retains accepted C1-C3 evidence only as non-counting evidence
from an incomplete epoch. Its C4 destructive delta produced no candidate,
witness, evidence ref, or Linux run and remains excluded rather than repaired
or rerun.

### 22. Feedback validation subprocesses remain exact and non-publication

Per D-185, `agent skill run` may classify feedback iteration's mandatory
post-edit lint, typecheck, unit-test, and named Node test acceptance commands
only when the selected skill is `SKILL-feedback-iteration`. Each recognized
shape maps to a typed `local-validation` endpoint with operation `invoke` and
`publication=false`; the production classifier and bounded policy selectors
must agree.

This is not a shell or general command capability. A different skill,
executable, argument shape, test mode, or publication target remains refused.
The experimental opt-in, explicit write consent, manifest path scope,
recorder-derived candidate, and independent validation boundaries remain
unchanged. The a602a and a602b epochs are excluded and cannot contribute rows
to a later complete epoch.

### 23. Campaign acceptance evidence uses the conventional test suffix

Per D-186, R28's dedicated Node acceptance artifact is
`packages/cli/test/r28-campaign-evidence.test.mjs`. The prior filename lacked
the `.test` or `.spec` marker required by D-185's exact Node acceptance
classifier, so the 8496a epoch remains excluded after its sole feedback
attempt. Durable trace references and every later fresh-epoch acceptance
command use the renamed path.

D-186 does not widen the subprocess adapter. Absolute paths, parent traversal,
non-test filenames, unnamed test execution, different skills, and arbitrary
processes remain refused. A later epoch starts only from the correction's
verified shipping SHA with new mutation-intent IDs and a new overlay.

### 24. One complete fresh epoch satisfies the report-only campaign denominator

Per D-187, PR #98's verified shipping merge
`a74da82eb211861b714ee837b4e427aad3f79dc0` is the sole campaign origin.
Its exact-main CI `29943715656` and Release `29943715109` passed. The accepted
epoch uses role-separated frozen overlay
`b9c5a573d4a64f6359935d36965a050f677648ed`, runs each of the 18 mechanically
derived mutating skills exactly once across the five frozen task contracts,
and allocates nine rows to each supported local CLI family.

The immutable row ledger is:

| Intent | Skill | Provider | Candidate | Evidence | Linux run | Artifact |
| --- | --- | --- | --- | --- | ---: | ---: |
| MI-2801000000000315 | `SKILL-feedback-iteration` | Claude | `2244836b90d4708a1775a56a5e37ca55e67bee80` | `e91df14fb2f6719137dcc2a98df2b157a3011194` | 29945729138 | 8540062454 |
| MI-2801000000000312 | `SKILL-elicit` | Claude | `395d8a51e77548f29edfa5ca9c105d9300071578` | `71282b957e346c93ff687858e59463f9fe0ba44c` | 29945837834 | 8540105431 |
| MI-2801000000000313 | `SKILL-plan-blueprint` | Codex | `eff89c8d596e85cce3ebe3cbf239093dbc70a545` | `878d5f077b8ee485298387667a06e63822dae885` | 29945960781 | 8540154797 |
| MI-2801000000000314 | `SKILL-compile-tests-from-docs` | Codex | `effa3f74f86451d445c9233a37c0897df071ca80` | `9691c1e5c6e59f6c2395304e08ea15787c9c27c4` | 29946062915 | 8540191945 |
| MI-2801000000000316 | `SKILL-write-api-map` | Claude | `e757277139d182937189513698eff6ad89432ffb` | `b7affa9e91f756f74ff3ccd33fa8d8844aba1a55` | 29946247654 | 8540267539 |
| MI-2801000000000317 | `SKILL-write-architecture-guide` | Codex | `a25baf2d307bbee9903efc38e5015aa146d6de23` | `3eb6d95bbcb1b88748f1a4828a70903947f422b4` | 29946354785 | 8540314649 |
| MI-2801000000000318 | `SKILL-write-compliance-ccpa` | Claude | `7b6ae6bbecccde065049001c59fca1978cb5b652` | `2253093421e34d536dcc96793ad8ff95e0ccb862` | 29946543439 | 8540390007 |
| MI-2801000000000319 | `SKILL-write-compliance-gdpr` | Codex | `9a622c1dcef52f312d07e4f12d88b1237a3994bc` | `8ee7b760daccb6fd19a4498509df5b086a42daa8` | 29946681627 | 8540443347 |
| MI-2801000000000320 | `SKILL-write-compliance-lgpd` | Claude | `3e87b0b83768e3cbd2fb7f4afb3fc7fe1d54c3f8` | `ef01fff4a74acf455e3d842209785d8d8e1668bc` | 29946916757 | 8540538639 |
| MI-2801000000000321 | `SKILL-write-database-reference` | Codex | `0a93a9f6bc3ff323a85cac4a8db2e454cb53ab39` | `11a8735ecbba53c2aaba1a930e0d1ea59b97c475` | 29947041806 | 8540585339 |
| MI-2801000000000322 | `SKILL-write-erd` | Claude | `5c2e802f8b17d4d1e4228c8a63ca4b1c1b4d1174` | `0c785911b486c1f3766db3ae7d5e910895b67a03` | 29947164952 | 8540633604 |
| MI-2801000000000323 | `SKILL-write-fp-report` | Codex | `3e73e7374c3f9c1972e6811369e56c6683132052` | `e007d13c66379084e3d74218294aac61847d82cc` | 29947279628 | 8540679912 |
| MI-2801000000000324 | `SKILL-write-frontend-routes-map` | Claude | `a40de4ca1affaefe6042d9d025162fc63a375dcc` | `0fe34b5866bf71c75bc80713960eb59ebf960078` | 29947451340 | 8540744894 |
| MI-2801000000000325 | `SKILL-write-onboarding` | Codex | `141ccc834150ba6879541a9ec0a7081975eec5de` | `377fc61d97d490cc8821e846f03c1ce306a7d203` | 29947642853 | 8540826558 |
| MI-2801000000000326 | `SKILL-write-overview` | Claude | `e259b823bb4e40f7869bdbf7de90b015093c1625` | `16283874943572d65ffd6cbd4ed1c2633ac6cfc0` | 29947798596 | 8540885264 |
| MI-2801000000000327 | `SKILL-write-rbac-matrix` | Codex | `380194df462c0aa67474a6d3e044b299e83eaf9a` | `e505ddf5ce712c18de662dce499e9ca894fba2e2` | 29947912398 | 8540927485 |
| MI-2801000000000328 | `SKILL-write-software-stack` | Claude | `c6d82688470910ca2a4782ac82eb3b412f96edd8` | `ea01c1b13ade7b6d9509c45bf9ffecbd5481837e` | 29948069406 | 8540986318 |
| MI-2801000000000329 | `SKILL-write-threat-model` | Codex | `7691ad28552700792a65505050d092ca5e746a73` | `a19b437f66395586c71f05211b5f530d71e166ef` | 29948187536 | 8541034665 |

Every local result is `REVIEW` with thirteen passing frames and only the
best-effort native macOS network frame unresolved. Every independent non-secret
Linux result is `PASS` with all fourteen frames passing. Each result has a
unique witness, command hash, validation identity, successful workflow run,
retained unexpired artifact, complete cleanup summary, and empty unexpected
state. Schema and ancestry validation, live workflow/artifact re-query, the
adversarial provenance and isolation suite, and an independent read-only
cross-model audit found no blocker.

Two earlier post-shipping epochs remain excluded with zero accepted rows. The
first contaminated one unit test through a global provider override; the
second produced an exact source-replacement no-op before candidate sealing.
They are not repaired, combined, or reinterpreted. Older partial and failed
epochs retain their original dispositions under D-173 through D-186.

Acceptance is evidence completeness only. Candidate and task-output commits
remain unmerged and cannot establish product completion, package publication,
readiness, autonomy, or promotion. R28 closes only through a separate D-134
phase-closure record after this decision's merge SHA has successful exact-main
CI and Release evidence.

### 25. Documentation-only closeout requires an explicit Release observation carrier

Per D-188, PR #99 shipped D-187 as merge
`83be5ba9a45061aac45c602890051edb853ce974`, and exact-main CI
`29953969305` passed. GitHub created no Release run because the merge changed
only `BUILD-PLAN.md`, `CHANGELOG.md`, `DESIGN-DECISIONS.md`, and this ADR; none
is in the Release workflow's package/release path filter. An absent workflow is
not successful evidence and cannot satisfy D-187's pre-closure condition.

The correction adds one empty changeset with no package entries. It is a
Release observation carrier, not package-impact metadata: it triggers the
existing path-filtered workflow while declaring no version bump and no
publication. The corrective merge includes the already-shipped D-187 closeout
and becomes the closeout shipping SHA only after exact-main CI and Release both
succeed on that exact commit.

The `83be5ba9` observation remains incomplete and is not relabeled. R28 remains
open until the corrective merge is verified and a separate D-134 phase-closure
record binds it. This correction changes no campaign row, candidate, task,
package version, release disposition, readiness, autonomy, or R29 boundary.

## Consequences

- A skill can make falsifiable claims but cannot validate or authorize itself.
- No-op completion, pre-green tests, frame escape, injection, and crash-as-red
  have explicit failure surfaces.
- Linux container isolation is supportable without overstating native macOS.
- Hard crashes may leave temporary state briefly, but durable exact-id recovery
  makes the boundary observable and fail-closed on the next invocation.
- The two new schemas raise the canonical framework roster from 59 to 61.
- The D-173 mutation-intent contract raises the roster from 61 to 62 when its
  separately authorized Architect schema batch lands.
- R28 produces report-only evidence suitable for a later human decision; it
  produces no readiness or autonomy conclusion itself.
- Public validation must complete the independent pipeline; witness schema
  validity alone is never a PASS or REVIEW verdict.
- Schema-valid non-test strategies complete that pipeline as REVIEW until a
  separately authorized trusted adapter exists; untrusted reference strings
  are never executable capability.

## Alternatives Considered

- **Let the skill emit its own evidence verdict:** rejected because the actuator
  would certify itself.
- **Treat any non-zero base exit as red proof:** rejected because crashes and
  missing tests would become false success.
- **Run arbitrary witness commands:** rejected because witness content is an
  untrusted injection surface.
- **Claim native cross-platform isolation:** rejected because macOS controls are
  best-effort and cannot widen Linux-container evidence.
- **Rely only on `finally` cleanup:** rejected because uncatchable termination
  cannot execute it.
- **Bind the result immediately:** rejected because R28 is an observation and
  self-application round, not a gate-promotion round.

## Affected Rules

- Constitution Articles 2, 6, 7, 10, 17, 24, 27, 29, 30, 32, 36, 37, and 39.
- D-126, D-134, D-150 through D-167, and D-168 through D-188.
- `translation-witness.schema.json`, `validation-result.schema.json`, and
  `invariant.schema.json`; D-173 adds `mutation-intent.schema.json`.
