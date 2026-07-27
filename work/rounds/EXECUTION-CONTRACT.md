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
    OM-002; OM-003; OM-010; Constitution Articles 6–10 and 27; R-0001 rehearsal lessons; R-0002-PREFLIGHT-AUDIT; R-0006-PREFLIGHT-ALIGNMENT-AUDIT,
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
- after quota recovery, ask Claude Opus 5 through the explicit `claude-opus-5` selector
  for an independent read-only close review and resolve every actionable finding; no fallback
  to another model is permitted;
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
