---
id: R-0007-PRE-ENTRY-INDEPENDENT-MACHINERY-REVIEW-1-FAILURE
title: Independent pre-R-0007 machinery review cycle 1 failure
type: assessment
status: active
date: 2026-07-29
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-014; DII-246; base 722e8a3438f3534260ac4f24c3eecc59e76f905b; candidate a8eae6be040864790b4362edf03d17ca24efd0d9,
  ]
related_invariants: [INV-DEVAI-001; INV-DEVAI-002; INV-DEVAI-003; INV-DEVAI-017; INV-DEVAI-020]
---

# Independent pre-R-0007 machinery review cycle 1 failure

## Exact review subject and verdict

- Base: `722e8a3438f3534260ac4f24c3eecc59e76f905b`.
- Cycle-1 candidate: `a8eae6be040864790b4362edf03d17ca24efd0d9`.
- Reviewer: independent read-only `gpt-5.6-sol` control-machinery reviewer.
- Verdict: **FAIL**.
- Finding population: eight findings, two P0, five P1, and one P2.

The reviewer continued after blockers and returned the following complete defect-class
population. This record preserves the failure; it does not reinterpret any finding as
PASS.

## F-001 — P0 — BINDING-CENSUS-ABSENT

**Evidence.** `reviewerBindingFindings` in
`scripts/run-round-close-controls.mjs:2972-3015` opens only the mandate named by the
profile, checks `status` and `authority` with regular expressions, and accepts round and
model text through substring membership. It never enumerates the complete population of
active Owner mandates. The incomplete result is consumed by all three authority-facing
commands: `policy-check` at lines 3018-3050, `entry-check` at lines 3072-3083, and
`status` at lines 3895-3923.

**Deterministic population query.** Enumerate every tracked
`product/owner-mandates/OM-*.md` at the exact candidate, parse its structured identity,
authority, status, governed round, literal model selector, and no-fallback binding, then
select all active Owner bindings whose round is `R-0007`. Compare that complete set with
the profile reference and run the same query through `policy-check`, `entry-check`, and
`status`.

**Complete affected population.** Reviewer-binding resolution in `policy-check`,
`entry-check`, and `status`, including missing, duplicate, ambiguous, inactive,
conflicting, or substring-only mandates.

**Repair condition.** Replace profile-directed substring checking with a structural,
complete active-Owner-mandate census. Entry is ready only when the census resolves
exactly one active mandate containing the exact literal round and model binding and that
binding exactly matches the profile; zero or more than one bindings, ambiguity, conflict,
or fallback must fail closed consistently in all three commands.

## F-002 — P1 — AUTHORITATIVE-GATE-POPULATION-OMITTED

**Evidence.** `law/policy/round-close-controls.json` declares 16 authoritative
convergence commands, while `work/rounds/R-0007/affected-test-graph.json` declares 14
nodes. `smartConvergeV3` at `scripts/run-round-close-controls.mjs:3349-3474` executes the
graph population rather than proving the complete policy gate population and its
clean/head/no-write boundaries.

**Deterministic population query.** Run
`jq -r '.convergence.commands[].id' law/policy/round-close-controls.json | sort` and
compare it with
`jq -r '.nodes[].id' work/rounds/R-0007/affected-test-graph.json | sort`. Resolve every
aggregate node to its executable leaf commands; do not treat a differently named
aggregate as proof without an explicit equivalence edge.

**Complete affected population.** The omitted authoritative gate identities are
`action-registry`, `changesets`, `coverage`, `diff-check`, `formatting`,
`materializations`, `ordinary`, `preparation`, `repository-references`, `stage1`,
`stage2`, `t4`, `t5`, `t6`, and `trace`. Their invocation boundaries and the candidate
cleanliness, exact-head, no-write, or declared-equivalence checks are also absent from
the convergence proof.

**Repair condition.** The executable convergence population must cover every one of the
16 policy commands, either as the exact leaf or through a reviewed explicit equivalence
edge, and must machine-check each command's clean-tree, exact-head, no-write, and output
contract before emitting PASS or reuse.

## F-003 — P1 — CONSERVATIVE-WIDENING-DEAD

**Evidence.** `buildImpactPlan` at
`scripts/run-round-close-controls.mjs:3187-3252` considers unknown paths only after they
match the already narrow production/test population. Arbitrary governed unmatched paths
therefore disappear instead of widening. The declared dynamic-import and incomplete-
population fallbacks are not reached. Ordinary production or test changes select narrow
nodes without whole coverage. `changedPathPopulation` at lines 3086-3104 tries
`rev-parse WORKTREE` before worktree handling and includes unstaged plus untracked paths
but omits the staged population and status semantics needed for deletes and renames.

**Deterministic population query.** At the exact candidate, enumerate all tracked paths
with `git ls-tree -r --name-only
a8eae6be040864790b4362edf03d17ca24efd0d9 -- packages scripts tests`, classify them
against the graph population, node selectors, and shared-input selectors, and emit every
unclassified governed path. For worktree mode, union `git diff --name-status -z`,
`git diff --cached --name-status -z`, and
`git ls-files --others --exclude-standard -z`, preserving both sides of renames and
deletions.

**Complete affected population.** The reviewer census contained 393 production paths,
179 test paths, and 107 additional omitted helper, generator, configuration, or other
governed inputs. It also covers all staged, unstaged, untracked, deleted, and renamed
worktree inputs, every ambiguous dynamic load or missing graph edge, and every ordinary
source/test change relevant to the whole-coverage contract.

**Repair condition.** Prove complete governed-path classification. Any unknown owner,
unmatched governed input, dynamic-load ambiguity, incomplete population, or missing edge
must select the full authoritative suite; every coverage-relevant source or test change
must select whole coverage. `WORKTREE` planning must accept its sentinel identity and
must include the complete staged, unstaged, untracked, deleted, and rename population.

## F-004 — P1 — CACHE-RECORD-IDENTITY-UNBOUND

**Evidence.** `v3ReadCache` at
`scripts/run-round-close-controls.mjs:3162-3176` accepts a record from schema validity,
self-digest, and `EXECUTED_PASS`. `buildImpactPlan` at lines 3254-3315 recomputes current
identity fields but does not require the cached fields to equal that complete recomputed
identity. Output bytes are compared, while dependency keys are not accompanied by proof
that each dependency still has a valid fresh PASS.

**Deterministic population query.** For each of the 14 graph nodes, tamper one cached
field at a time—policy version, graph version, round, task ID, plan outcome, reasons,
changed inputs, fallback population, argv, cwd, task key, input manifest, dependency
keys, policy/graph/toolchain/environment digests, producing candidate, output identity,
or dependency PASS—then recompute the cache self-digest and request a warm plan.

**Complete affected population.** All 14 node cache records and every transitive
dependency record accepted through `REUSE_FRESH`.

**Repair condition.** Reuse requires exact equality between every current recomputed
identity field and its cached counterpart, byte-identical required outputs, and a
recursively valid fresh PASS for each dependency key. Any mismatch, missing proof,
malformed value, stale result, or tampering must force execution or conservative
blocking, never reuse.

## F-005 — P0 — REVIEW-CENSUS-AND-CANDIDATE-PROOF-INCOMPLETE

**Evidence.** `reviewScopeV3` at
`scripts/run-round-close-controls.mjs:3531-3673` builds topics only from registered
obligations and changed paths. The changed-path topic is hardcoded to
`R7-P0-CANDIDATE-IDENTITY` at line 3599. If the candidate manifest is missing or invalid,
lines 3621-3632 manufacture a digest from base, candidate, and tree instead of stopping.
The manifest is written directly at lines 3659-3662 rather than atomically.

**Deterministic population query.** Generate the scope for the exact candidate, remove
each required source class in turn, and require failure. The seven source classes are:
(1) registered obligations; (2) every changed path; (3) every controlling policy,
schema, mandate, and real candidate manifest; (4) every previous campaign finding
class; (5) current and previous candidate identities; (6) structured current claims;
and (7) impact-plan plus convergence evidence. Repeat with a missing, stale, or malformed
candidate manifest and with a non-R-0007 fixture.

**Complete affected population.** All seven mandatory review-census source classes,
every supported round profile, candidate-manifest identity, and the generated review
scope artifact.

**Repair condition.** Scope generation must be round-generic, require a valid exact-
candidate manifest, include all seven classes exactly and retain prior finding classes,
bind their digests atomically into one manifest, and fail rather than fabricate evidence
when any required class is missing, stale, or inconsistent.

## F-006 — P1 — REVIEW-REUSE-AND-STREAM-CANONICALITY

**Evidence.** Seven obligations declare `always-recheck` in
`work/rounds/R-0007/review-obligations.json`, but `reviewScopeV3` lines 3580-3582 allows
`REUSED_FRESH_PASS` for every unchanged obligation without consulting that policy.
`parseStructuredReviewResult` at
`scripts/run-round-close-controls.mjs:3676-3700` uses first-match header and terminal
records and filters recognized record types, so duplicate headers/terminals, unknown
records, records after a terminal, and a nonterminal tail can be ignored rather than
rejected.

**Deterministic population query.** Enumerate obligations with
`jq -r '.obligations[] | select(.reuse_policy == "always-recheck") | .obligation_id'
work/rounds/R-0007/review-obligations.json`; there must be seven and none may permit
reuse. Against JSONL parsing, inject duplicate or unknown headers, dispositions,
findings, and terminals; move the terminal before the last record; append a tail; and
break finding-to-topic and population linkage.

**Complete affected population.** The seven `always-recheck` obligations are
`R7-P0-AUTHORITY`, `R7-P0-REVIEWER-BINDING`, `R7-P0-DEPLOY-REFUSAL`,
`R7-P0-CANDIDATE-IDENTITY`, `R7-P1-AFFECTED-TESTS`, `R7-P1-REVIEW-CENSUS`, and
`R7-P1-TWO-CYCLE`. The stream population is every header, disposition, finding, and
terminal record and every referenced topic, finding class, affected population, and
repair condition.

**Repair condition.** Apply each obligation's reuse policy. `always-recheck` topics must
reject `REUSED_FRESH_PASS`; reusable topics must prove independent digest and evidence
freshness. JSONL must have one header first, one terminal last, exactly one disposition
per known topic, no unknown record types or trailing records, and complete identity,
finding, defect-class, population-query, affected-population, and repair-condition
linkage.

## F-007 — P1 — REVIEW-STATE-TRANSITION-BYPASS

**Evidence.** `reviewScopeV3` accepts cycle 1 or 2 directly at lines 3536-3542 without
checking the prior state. `reviewCheckV3` at lines 3719-3892 validates the current
manifest/result and then writes `PASS`, `REPAIR_REQUIRED`, or `ESCALATION_REQUIRED`, but
does not enforce the declared identity-bound transition path. Cycle 2 can therefore
start directly, reuse the same candidate, or follow a partial repair; semantic repair
does not invalidate all prior candidate evidence or PASS standing. Transport attempts
are keyed only by cycle at lines 3703-3717, not by candidate, manifest, and reviewer
identity.

**Deterministic population query.** Exercise every edge of the declared state machine
and every undeclared edge: direct cycle 2 from `DRAFT`, cycle 2 with the cycle-1
candidate, incomplete same-class repair, repaired tree with stale manifest/claims/
convergence, prior PASS after semantic mutation, and transport retries across candidate,
manifest, or reviewer identities.

**Complete affected population.** All states from `DRAFT` through `PASS`,
`REPAIR_REQUIRED`, and `ESCALATION_REQUIRED`; both substantive cycles; every semantic
candidate mutation; every candidate/manifest/reviewer-bound transport attempt; and all
stored PASS, convergence, rehearsal, claims, and review evidence.

**Repair condition.** Enforce an explicit transition table bound to exact base,
candidate, tree, profile, policy, manifest, and reviewer identity. Cycle 2 requires a
cycle-1 `REPAIR_REQUIRED`, a complete-class repair population, regenerated evidence, and
a different candidate. Any semantic/current-tree change invalidates all stale standing.
Transport retry accounting must be identity-bound, and every undeclared transition must
be mechanically refused.

## F-008 — P2 — CLAIM-DIGEST-PLACEHOLDER-ACCEPTED

**Evidence.** `claimsCheckV3` at
`scripts/run-round-close-controls.mjs:3477-3507` checks ledger mode, candidate equality,
non-null digests, and placeholder-looking source paths. It never runs the producer,
applies the deterministic extractor, recomputes the source/value digest, or verifies the
rendered location. The registry contains six claims, so replacing nulls with arbitrary
non-null digest strings can pass these checks.

**Deterministic population query.** Enumerate all six entries with
`jq -r '.claims[].claim_id' work/rounds/R-0007/current-claims.json`; for each claim,
substitute a syntactically valid but false producer, extractor, candidate, source digest,
value digest, rendered location, or rendered value and run `claims-check`.

**Complete affected population.** `suite.population`, `coverage.summary`,
`candidate.range`, `review.topic-population`, `site.artifact`, and `ci.exact-head`, with
their producer commands, deterministic extractors, source artifacts, values, rendered
locations, candidate SHA, and volatility classes.

**Repair condition.** For every claim, execute or verify the declared producer, apply
the deterministic extractor, recompute and compare source and value digests, bind the
exact candidate, and verify the rendered value at the declared location. Missing,
placeholder, stale, or inconsistent material must fail.

## Two-cycle standing and stop boundary

This is substantive machinery review cycle 1 and its standing is `REPAIR_REQUIRED`.
Exactly one complete-class repair phase may address the complete population of F-001
through F-008 together. After freezing one new candidate, exactly one complete cycle-2
review of the regenerated population is allowed. A cycle-2 failure requires Owner
escalation; a third substantive review cycle is forbidden.

R-0007 has not started. Its governed reviewer slot remains intentionally unbound, with
silent fallback forbidden. Deployment, publication, release, evidence promotion,
real-stynx mutation, and predecessor mutation remain unauthorized.
