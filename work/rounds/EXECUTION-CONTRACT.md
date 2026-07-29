---
id: ROUND-EXECUTION-CONTRACT
title: Shared execution contract for R-0002 through R-0010
type: execution-contract
status: draft
date: 2026-07-27
authority: Architect
supersedes: null
superseded_by: null
provenance:
  [
    OM-002; OM-003; OM-010; OM-014; DII-246; Constitution Articles 6–10 and 27; R-0001 rehearsal lessons; R-0002-PREFLIGHT-AUDIT; R-0006-PREFLIGHT-ALIGNMENT-AUDIT,
  ]
---

# Shared execution contract

Every round orchestrator must load and obey this file. A round plan may narrow it but
may not weaken it.

## Live entry preflight

Before mutation:

1. read OM-002, OM-003, the consolidated audit/backlog, this contract, the round
   authorization, the round plan, and the round prompt;
2. treat a conditional grant as PENDING until its predecessor close and entry condition
   are independently re-verified, then verify the authorization’s exact phase is
   GRANTED; PENDING means stop;
3. verify GitHub authentication without printing credentials;
4. fetch the successor remote, assert the chosen base equals live `origin/main`, inspect
   open PRs and required checks, and create a dedicated `codex/` branch/worktree;
5. assert the main checkout and round worktree were clean at their respective boundaries;
6. assert `../devai` is clean and its origin is
   `https://github.com/devai-nyx/devai-original.git`, but do not fetch, configure,
   checkout, or otherwise write there;
7. read terminal predecessor evidence only through immutable GitHub objects at
   `05dd242bf72334bfd683096aed380e8240b6b9aa`;
8. run `pnpm install --frozen-lockfile`, `pnpm run devai:prepare`, and the round’s entry
   tests before opening its declaration decision.

Any drift that changes scope is reported to the Owner. Cheap live facts are refreshed;
stale values are never copied from an earlier report.

## Authority and commits

- Use one role per batch and commit:
  `git -c user.name="DEVAI <Role>" -c user.email="aarusso@nyxk.com.br"`.
- Owner batches modify only Owner paths; Architect batches only Architect paths;
  Engineer batches only plant/tooling paths; Inspector batches only tests; Auditor
  batches only `work/audit/`.
- `record/` is never hand-edited. A validated executing verb appends it, and the session
  that ran the verb commits the product with machine provenance preserved.
- OM-002 mandates `.devai/config/` and `.devai/pin/` as committed machine outputs
  derived from Architect-owned sources; the executing Engineer session runs the
  authorized materializer and commits those bytes. R-0002 must establish and later
  rounds must preserve `.devai/state/` and `.devai/worktrees/` as ignored runtime state
  except for tracked `.gitkeep` sentinels.
- New decisions use the next gapless DII identifier re-read from the register. Plans do
  not reserve IDs.
- At round start, the Architect appends a declaration decision binding the exact base,
  scope, plan digest, claims ceiling, and known-red posture. At close, a later Architect
  decision cites the final audit. The closure verb binds both.
- Do not edit closed R-0001 artifacts or PC-0001. Corrections are new records with
  explicit supersession.

## Red-first sequence

For behavior changes, use:

1. Inspector failing contract that proves the defect;
2. Architect/Owner authority or setpoint decision where required;
3. Engineer implementation and generated materialization;
4. Inspector acceptance and adversarial cases;
5. Auditor current-state observation.

Existing exact known-red guards remain until the closing change lands. Count changes are
diagnosed, never silently refreshed. Tests are not changed to accommodate broken code.

## Verification

Read output before every commit. The minimum commit floor is:

```text
pnpm run devai:prepare
pnpm vitest run
git diff --check
```

Run affected build, lint, typecheck, formatting, schema, production-command, docs, and
tier gates in addition. The round exit floor is:

```text
pnpm run ci:stage1
pnpm run ci:stage2
pnpm run test:t4
pnpm run test:t5
pnpm run test:t6
pnpm run ci:changesets
pnpm exec prettier --check .
```

`pnpm run test:coverage:t1-t3` is run and quoted at every close. BL-017 closed in
R-0002 after every unchanged 70/60/70/70 floor passed. Provider, collection, test,
threshold, or any other failure blocks every later round. Each round plan names any
additional production commands required by its scope.

A command that cannot run is a blocker or a newly governed defect, never a green skip.
Declared DB skips remain skips only under their existing contract and are exercised with
the configured PostgreSQL service at release-candidate time.

## Prospective affected-test convergence for R-0007 through R-0009

OM-014, OM-015, and DII-246 through DII-248 replace R-0006's round-specific close wrapper prospectively with a
generic policy and schema-validated per-round profile. No engine default may supply a
round, mandate, audit path, or reviewer model. The profile binds the round sources,
explicit affected-test graph, semantic obligations, current claims, runtime paths,
review budget, and reviewer authorization.

Local convergence may reuse only a structurally valid content-addressed PASS whose key
binds the command, working directory, complete transitive input manifest, dependency
keys and still-fresh dependency PASS results, output digests, environment, toolchain,
policy, and graph. The ordered policy command roster remains the mandatory
authoritative convergence population; the affected-test graph is a supplemental local
precision population and cannot omit or substitute a policy gate. Both passes bind one
stable exact head, start and finish clean, prohibit second-pass writes, and produce
semantically equivalent result populations. Changed tests execute
themselves and changed sources execute every transitively dependent shard. Unknown,
dynamic, or incomplete proof widens to the full suite. Dirty, untracked, deleted, and
renamed inputs participate; timestamps alone do not. Remote CI trusts no local cache,
and coverage is wholly executed or wholly reused without partial merging.

Preparation may accept an unbound reviewer slot only while reporting
`ENTRY_BLOCKED_REVIEWER_UNBOUND`. Entry requires exactly one active Owner mandate that
contains the structured `devai_reviewer_binding` marker and binds the round to one
literal independent read-only model. The engine performs a complete census of all
tracked active Owner mandates; prose substrings have no authority. Missing, inactive,
ambiguous, or conflicting bindings stop entry; silent fallback is forbidden.

Only a complete schema-valid structured binding marker enters that census. A marker
binds its own mandate ID and active status as well as the exact round, model, role,
census, budget, retry limit, and forbidden fallback. General mandate prose, round-name
substrings, and partial or malformed marker-shaped objects have no binding authority.

Review scope is generated from registered obligations, exact changes, active controls,
current claims, prior finding classes, candidate identities, and convergence evidence.
An authentic exact-candidate manifest is required before scope generation; the
controller never fabricates one. Materialized current claims are recomputed from their
resolved producer, complete source manifest, deterministic extraction, canonical value
digest, and rendered locations. Revalidation also authenticates producer output and
each rendered location's current content and verification digests; one absent, stale,
placeholder, or mismatched proof fails the entire ledger.
Every changed and unchanged topic receives exactly one structured disposition. Fresh
reuse still requires independent recomputation of the current topic-input manifest,
referenced-evidence manifest and digest, and every required task-freshness key. Finding
IDs are globally unique across the canonical JSON or JSONL stream. Malformed,
truncated, duplicate, omitted, unknown, or identity-mismatched results are invalid.

Scope generation requires the independently authenticated convergence record named by
the candidate manifest. Both artifacts share an independently recomputed candidate-
identity digest. The convergence record binds exact base, candidate and tree plus two
complete ordered passes over every authoritative gate; each pass has clean boundaries,
exactly-once result, output and task-key digests, and one semantic-population digest,
while pass 2 has no writes. Missing, partial, stale, malformed, substituted, or
cross-digest-mismatched convergence has no fallback and invalidates scope atomically.

Cycle 1 exhausts the complete population and continues after blockers. One role-pure
repair phase closes every reported class and regenerates every invalidated artifact.
Cycle 2 reviews the complete new population. Cycle-2 failure becomes
`ESCALATION_REQUIRED`; cycle 3 is refused. One invalid transport attempt may retry the
unchanged cycle; a second becomes `REVIEW_TRANSPORT_BLOCKED`. Continued work then
requires a separately named remediation campaign and fresh Owner authority.

Every state, transport, result, candidate, scope, and repair-evidence record is schema-
validated, self-digested, exact-identity bound, and linked to its predecessor. The
controller verifies the full transition chain, not only the current state label. A
second review after repair requires the authenticated first failure and its exact
candidate, manifest, scope, result and state, a distinct regenerated candidate, and a
complete-class repair record covering every failed class and affected instance.
`PASS`, `ESCALATION_REQUIRED`, and `REVIEW_TRANSPORT_BLOCKED` have no outgoing edge.

## Candidate identity, convergence, and review freeze

Every source close distinguishes three Git identities:

- `implementation_subject` is the last commit that changes semantic law, product,
  plant, or tests. Auditor evidence and deterministic projections are not the
  implementation subject.
- `review_candidate` is the complete source candidate submitted to an independent
  read-only review. It includes final current documentation, as-built evidence,
  source-close handoff, and closing decision, and it descends from
  `implementation_subject`.
- `published_head` is the exact head proposed for source publication. It equals
  `review_candidate` plus only the mechanically bounded review envelope below.

Before final review, the candidate must converge twice consecutively. Each pass starts
clean and runs repository formatting checks, `devai:prepare`, every deterministic
projection in no-write/check mode, the minimum commit floor, the complete exit floor,
coverage, affected production commands, and governed reference checks. The second pass
immediately repeats the same ordered suite without a commit or edit between passes and
must make no tracked or untracked write. A write, changed result, or dirty boundary
restarts convergence from a newly committed candidate.

The final review binds the exact `review_candidate`. After PASS, the mutation freeze
prohibits every law, product, plant, test, current-documentation, as-built, source-close,
or closing-decision change. Any such change invalidates PASS and requires convergence
and a fresh independent review of the new exact candidate.

The only permitted post-PASS review envelope is:

1. the exact Auditor-owned review record for that PASS; and
2. deterministic Architect-owned projection regeneration caused solely by references
   introduced by that exact review record.

The envelope may not change a generator, policy, test, source locator unrelated to the
review record, or any other source. Its commits and paths are enumerated mechanically,
and projection output is checked against regeneration from `review_candidate` plus the
review record. Any other delta invalidates PASS. `published_head` must then pass both
consecutive convergence passes, including the second no-write/clean pass, before push.

A review finding is dispositioned before PASS. A genuinely nonblocking finding is
either placed under an already-valid governed later-work record or repaired before the
reviewer issues PASS. Repair after PASS while retaining that PASS is forbidden. After
any finding, the owning role sweeps the complete same-class population or invariant,
records the sweep boundary, repairs every in-scope instance, reconverges, and obtains a
fresh review; a point correction alone cannot return to review.

Shared-object-store resolution is not publishability evidence. Every governed Git
identity in `published_head` must resolve in an isolated candidate-only clone whose
object database and refs contain only history reachable from that candidate and use no
alternates, or be classified as an exact historical specimen with its precise paths.
The same reference checks run in that clone. A local pass followed by a clean-clone
failure is a source failure, never an environment exception.

## Review, push, and merge

Before push:

- inspect the complete diff and role attribution;
- prove every backlog item in scope has acceptance evidence or remains blocking;
- record exact `implementation_subject`, `review_candidate`, `published_head`, bounded
  envelope commits and paths, both convergence passes, and the candidate-only clone
  result;
- rehearse source ancestry and the closure-only PC branch in an isolated clone before
  final review; the rehearsal must prove that the source merge ancestry exposes every
  governed prerequisite and that a PC-only branch passes its exact range checks;
- ask the independently selected close reviewer for a read-only exact-candidate review
  and resolve every actionable finding; OM-013 replaces the otherwise-required
  `claude-opus-5` selector with explicit `gpt-5.6-sol` for R-0006 only and does not
  weaken any review-content, verdict, or evidence requirement; R-0007 through R-0009
  instead require exactly one later active Owner model binding before entry;
- leave no untracked product or evidence artifacts.

After push, inspect the exact candidate’s GitHub checks. Merge only when every required
check is green for that SHA. BL-017 closed in R-0002 only after the unchanged
70/60/70/70 floors passed; no source or exact-main red remains authorized.

## Closure and rollback

An Auditor writes the as-built before the closing decision. The close uses two explicit
PR boundaries:

1. the source PR contains all scoped work, as-built, and closing decision; after merge,
   verify its all-green exact-main run;
2. from that merged SHA, the repaired machine closure verb appends the next PC record on
   a closure-only branch; merge that closure PR and verify final exact-main state.

The PC record binds the source merge SHA, names all gates and the honest non-release
disposition, and never pretends the later closure-only SHA was the tested source
candidate. Any red gate blocks the ceremony rather than becoming an exception.

The isolated ceremony rehearsal is non-standing evidence. It must not publish a branch
or preserve a rehearsal object as a governed identity, and its generated PC bytes are
discarded. Only the production closure verb run after the all-green source merge and
exact-main CI may append the real closure record.

Rollback is batch-local: revert the last role-pure batch or abandon its branch before
continuing. Never use destructive reset against a dirty or shared worktree. Preserve
evidence needed to explain the failure.

Until BL-050 closes, do not invoke the current `round archive` implementation. After
BL-050, close uses the amended-in-place three-tree semantics and never moves committed
round intent.

## Universal stops

Stop on:

- any attempted predecessor or real-stynx mutation;
- a missing or ambiguous Owner decision;
- a frozen-value mismatch;
- a threshold, floor, permission, or adversarial test being weakened;
- role impurity;
- an uncatalogued deferral;
- external publish, tag, Release, or Pages action without the specific later grant;
- evidence promotion or R-0010 streak opening without its fresh Owner mandate.
