---
id: remediation-3-repair-handoff
title: Continuity record for the remediation campaign 3 complete-class repair
type: audit-record
status: active
date: 2026-07-30
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-017, DII-252, work/audit/R-0007-pre-entry/remediation-3-review-run-1.json]
---

# Continuity record — remediation campaign 3 complete-class repair

This record exists so the repair can resume from committed state rather than from reconstructed intent. It is reissued at each session boundary. It records what is proved, what is explicitly not proved, and what must not be repeated. It is **not** the causal red-evidence record; that is `remediation-4-red-evidence.json` at `beb37bb`, partially superseded at `fff4e8c`.

## Standing facts

| Item                  | Value                                                               |
| --------------------- | ------------------------------------------------------------------- |
| Worktree              | `/Users/aarusso/Development/stech/devaii-pre-r0007-remediation-3`   |
| Branch                | `codex/pre-r0007-remediation-3-ff5c805`                             |
| Campaign base         | `ff5c80574ee7fc670046bfec990fadedf3d89ce4`                          |
| Reviewed candidate    | `25d0c17d84eff057817ab5849912f77b86a4f311`                          |
| Review Run 1 verdict  | FAIL — 10 findings (8 P1, 2 P2), 61/61 topics, exact topic set true |
| Review Run 1 record   | `work/audit/R-0007-pre-entry/remediation-3-review-run-1.json`       |
| Record sha256         | `30fe3d9ea778dcdac774b10e633e18556707ee3e6bde9811bfde4b1af5ce54f7`  |
| Substantive runs used | 1 of 2                                                              |
| Substantive runs left | **1 — Review Run 2, the sole remaining run**                        |
| Review Run 3          | Forbidden by OM-017; failure of Run 2 goes to Owner escalation      |
| Current head          | `7b47eb39b23629c1d3d4a1c2a2e41351804bcc6f`                          |
| R-0007 standing       | **NOT STARTED** — `ENTRY_BLOCKED_DECLARATION_UNBOUND`               |

The branch has not been pushed and no pull request exists.

## Review Run 1 reconciliation, completed

- Artifact sha256 matches the value recorded at handoff.
- The declared `raw_session_sha256`
  `a7775f493ee1e4dad2f1cf8ebd69c0a7a1d3388f4c615d18bf1b58632ef723aa` matches the raw
  reviewer session bytes.
- The normalized `result` object is canonically digest-identical to the raw terminal
  record (`b605534a3dc7e6e288a0da064a1a0a9c7de628fb7d465e419444be26d8f1e330`).

**Provider identity.** Every assistant message in the raw session reports model
`claude-opus-5`. The `claude-haiku-4-5-20251001` usage of 2590 input and 22 output
tokens corresponds to no assistant turn in the transcript and is the CLI ancillary
session-titling call. It is structurally incapable of producing the 111,667 output
tokens attributed to `claude-opus-5`. The datum is retained, not discarded, and does
not bear on the verdict.

## Commits produced by this repair, in order

| Commit    | Role      | Content                                                         |
| --------- | --------- | --------------------------------------------------------------- |
| `5d40e95` | Auditor   | Preserve the Review Run 1 result                                |
| `875d6c4` | Architect | DII-252, `control_capabilities`, 42-class union matrix          |
| `5b6ff66` | Architect | Correction: predecessor artifact admitted, not required         |
| `4ded205` | Architect | Correction: R7 registry entries at origin cycle 1               |
| `37c2911` | Inspector | 24 adversaries plus the extracted review harness                |
| `dc56ce0` | Auditor   | This continuity record, first issue                             |
| `cb2033b` | Inspector | Remaining 25 adversaries; all 49 declared ids exist             |
| `36bf87e` | Inspector | Correction: implementation commit read from governed sequencing |
| `3e863e5` | Inspector | Correction: evidence ancestry scoped to this repair             |
| `beb37bb` | Auditor   | Causal red evidence, 45 failed / 4 passed of 49                 |
| `4964459` | Engineer  | F009 capabilities, F003 bootstrap, F007 readiness, F010 floor   |
| `e0e8c4a` | Engineer  | F004 fixpoint closure, F005 gate records                        |
| `3145bae` | Engineer  | F006 binding-flow loader classification                         |
| `1b9115f` | Inspector | Correction: harness repository root                             |
| `fff4e8c` | Auditor   | Superseding observation for six invalidated red cases           |
| `b06a7f7` | Inspector | Correction: fixture gate closure digest                         |
| `bb9f79c` | Engineer  | F001/F002 predecessor artifact authentication                   |
| `37727d6` | Auditor   | This record, second issue                                       |
| `54f7526` | Inspector | R7-001 repaired-class case made to discriminate                 |
| `14487d2` | Architect | R7-F011 declared: uncaught throw in an authoritative consumer   |
| `4c13d63` | Inspector | R7-F011 red, two contracts                                      |
| `2abff2a` | Engineer  | R7-F011 repaired; every consumer emits a structured result      |

Since the third issue the repair continued through the Architect close, the Auditor
pre-freeze attempt, and a detached-candidate verification phase that exposed further
defects. Commits after `2abff2a`, in order: `e13c51a` record third issue, `17bdb87`
remediation-1 adapted, `493928c` state-before corroboration, `47a52ad` record fourth
issue, `1fa4405` identity contract resolved, `e717a3d` identity implemented, `778b36a`
record fifth issue, `95eef75` and `747bc2a` predecessor artifacts retained, `d4a3e37`
writer and corroboration repair, `faa4d3b` lineage authentication, `cae574a` authentic
snapshots only, `2dc53cd` R2-F005 behavioural, `f806166` and `fb1a1ca` remediation-4
triage, `9e88cf9` guard audit and copy detection, `9038a7d` matrix closed, `41ce7a4`
sequencing bound, `9682bb8` sequencing conformed, `5fd6cd6` coverage budget, `e59d138`
certification, `2ade919` trace refresh, `488fe06` self-preparing gate, `8070440` derived
artifacts refreshed, `7b47eb3` ordering defect disclosed.

All role-pure. Many are corrections to earlier work in this same repair. They are
recorded rather than squashed, because the sequence they document is itself the evidence.

**This record was itself found corrupted after a power outage**: an orphaned paragraph
fragment survived an earlier incomplete text replacement and was committed, and the
standing facts cited a head twelve commits stale. A resuming session reading it would
have been misled about both the head and what remained. Repaired here.

## Class standing

| Class | Repair                                              | Standing                                              |
| ----- | --------------------------------------------------- | ----------------------------------------------------- |
| F001  | predecessor artifact, derived classes, no tautology | implemented; contracts cannot yet discriminate        |
| F002  | twelve edges, terminals, attempts                   | implemented; contracts cannot yet discriminate        |
| F003  | candidate-bound bootstrap, sixteen consumers        | implemented                                           |
| F004  | fixpoint closure derivation                         | implemented; contracts red until the graph is rebound |
| F005  | attestation verb, complete gate records             | implemented                                           |
| F006  | binding-flow loader classification                  | **green, 3 of 3**                                     |
| F007  | shared entry readiness                              | **green, 2 of 2**                                     |
| F009  | capability model, no decision-id literal            | **green, 2 of 2**                                     |
| F010  | registry-derived matrix floor                       | implemented                                           |
| F011  | no consumer terminates without a structured result  | **green, 2 of 2**                                     |
| F008  | prospective, consistent, immutable evidence         | procedural; ancestry enforceable since 3e863e5        |

Nothing is `GREEN_PROVED` in the matrix. No class is recorded closed.

## What is proved

- Minimum floor at `25d0c17`: `devai:prepare` pass, `pnpm vitest run` 165 files /
  1726 passed / 8 skipped, `git diff --check` clean.
- The controller contains no string literal matching `/DII-[0-9]+/`.
- `policy-check`, `entry-check` and `status` emit identical `entry_ready` for the same
  literal candidate, and `status` reports false while the B0 declaration is unbound.
- Every authoritative consumer rejects an omitted, symbolic or abbreviated candidate.
- All thirteen OM-017 loader families widen; six real repository scripts do not, and
  neither `path.resolve` nor a Promise `resolve` parameter widens.
- No authoritative consumer terminates without emitting a structured result. The general
  contract found the defect in four consumers — `smart-converge`, `review-scope`,
  `review-topic-count` and `envelope` — not only in the one where it was observed.
- The repaired-class population check is exercised for the reason it names: the case
  asserts `failed_checks` equals exactly `[repaired_class_population]`.
- Closure derivation reaches `tsconfig.base.json`, the nine depth-2 references, all
  thirteen projects’ output and root sets, programs outside the former allowlist, and
  surfaces `packages/cli/dist/bin.js` as a missing executable rather than dropping it.

## The 52 failures are dormant checks, not a regression

An earlier issue of this record framed the remediation-1 failures as a regression caused
by the state identity rewrite. **That framing was wrong and is withdrawn.**

Predecessor authentication was previously gated on `context.profile.decision_id ===
'DII-252'`-style specimen comparison, and every fixture profile is a synthetic fixture decision identifier. The block
was therefore **skipped entirely**. It has never run against these fixtures. The R7-F009
capability repair turned it on, correctly, and the fixtures have simply never satisfied
it.

This resolves a contradiction the earlier framing could not account for: how the suite
passed 143 of 143 at `5b6ff66` under a validator that would have rejected the same states.
It did not reject them. It never executed.

So the 52 failures are **previously-dormant checks now executing against fixtures built
while they were dormant**, not behaviour that used to work and stopped. The distinction
matters for what to do next: nothing needs reverting, and the fixtures need to satisfy a
contract they were never asked to satisfy before.

This is the third time a specimen gate turned out to be concealing fixture incompleteness
rather than merely disabling a check:

1. the closure digest the fixture never declared, exposed when the digest comparison
   became universal;
2. predecessor authentication the fixture never satisfied, exposed here;
3. the same mechanism gated six further behaviours, none of which had been exercised
   under any fixture profile.

Taken together this is independent evidence that the R7-F009 capability repair does real
work rather than renaming a condition. It is also a caution: **a green suite under the
specimen gates was not evidence those behaviours worked.** Any class whose only evidence
predates the capability repair should be treated as unproven until re-run.

### What the fixtures actually need

`previous_state_digest` binds the predecessor state artifact self-digest, per the DII-252
amendment. These fixtures construct states without ever retaining a predecessor artifact,
so there is no honest value to supply by patching a field. `stateChain` must retain a
predecessor state artifact under `review-states/<digest>.json` and reference it, in both
the shared harness and the inline copy in remediation-1. That is a change to fixture
semantics, not a field edit.

## Two unfounded claims, and the pattern behind them

- `4964459` states the bootstrap blast radius was contained, the same four failures as
  before. That was measured on **one** contract file. remediation-1 went from 143 passing
  to 139 failing and was not re-run after any Engineer tranche. The claim was wrong.
- `bb9f79c` attributes the five remaining R7-001 and R7-002 failures to test shape.
- The fourth issue of this record framed the 52 remediation-1 failures as a regression
  from the identity rewrite. They are dormant checks newly enabled by the capability
  repair. Withdrawn above. At
  least part of the cause was the state-before defect repaired at `493928c`, and the
  identity rewrite above. The attribution was premature.

The pattern in both, and in the loader contract that passed on a neighbouring family
evidence: **a single measurement generalised to a whole population.** The correction is
not more careful wording but re-running the affected population before making the claim.

## What is not proved, and must not be read as proved

- **Five of the six R7-001 and R7-002 cases do not discriminate.**
  `R7-001-REPAIR-POPULATION-DERIVED` was repaired at `54f7526` and is now pinned to the
  population check. The remaining five still need the same treatment: the fixture state
  must bind the repair and transport artifacts, and each assertion must name the specific
  check it depends on rather than a finding code.
- **The R7-004 contracts are red by construction.** The derived closure is now
  authoritative and deliberately disagrees with the stale declared digests in
  `work/rounds/R-0007/affected-test-graph.json`, which is Architect-owned. Four gates
  report `GATE_COMMAND_CLOSURE_DERIVATION_INVALID` until the Architect regenerates that
  graph in the sequencing step.
- **The 18 failing carried-class guards R7-011 through R7-020 are untriaged.** They
  cover prior findings that remain OPEN, so red is unsurprising, but no one has
  separated genuine defects from fixture-shape failures. They are not evidence.
- **Six of the 45 failures in `beb37bb` were infrastructure, not defects.** Superseded
  prospectively at `fff4e8c`; the original document is not edited.

## The dominant failure mode: passing for the wrong reason

Bringing one case to genuine green took four successive repairs, each revealed by fixing
the previous:

1. the fixture state never bound the repair artifact, so the branch was never entered;
2. `review-scope` was invoked without `--base` and terminated on an uncaught throw,
   emitting nothing, so the assertion saw an empty code list;
3. the state bound the pre-mutation digest, so the finding fired on `evidence_digest`;
4. deleting the only repaired class emptied the array, so the finding fired on schema
   `minItems`.

Each layer produced a plausible result. Three of the four would have been recorded as a
pass proving the derived class population, while proving nothing of the kind.

The generalisable rule: **`REVIEW_STATE_REPAIR_LINK_INVALID` covers eight sub-checks, so
asserting the finding code accepts a pass from any of them.** An assertion must name the
specific check it depends on. Several of the eighteen untriaged carried guards assert on
codes this way and should be expected to contain similar wrong-reason passes.

## Errors made in this repair, and what they cost

Seven defects were found in this repair’s own work. Each was caught by interrogating a
result rather than accepting it, and the two most damaging both looked like success.

1. `previous_state_artifact` marked required would have invalidated every persisted
   state artifact. Caught before propagating; corrected at `5b6ff66`.
2. R7 registry entries used the campaign number as `origin_cycle`. Corrected at
   `4ded205`.
3. `R7-008-EVIDENCE-IMMUTABLE-AFTER-IMPL` read the implementation commit from the
   document it policed — circular, and the same defect class as R7-F008 itself.
   Corrected at `36bf87e`.
4. `R7-008-EVIDENCE-ANCESTRY` was scoped from the campaign base, making it
   **unsatisfiable by construction**. An unsatisfiable contract is worse than a missing
   one: it would have sat red through the whole Engineer step and invited the
   conclusion that the ordering rule cannot be met. Corrected at `3e863e5`.
5. `git commit -Aqm` is invalid. Ten fixture commit sites were erroring silently, so
   several adversaries exercised an unmutated fixture. Corrected before `cb2033b`.
6. `R7-006-THIRTEEN-LOADER-FAMILIES` was cumulative and **passed**. One widening family
   satisfied the assertion for all later families. Isolated per family, it then
   reproduced exactly the four families Review Run 1 named. Corrected before `cb2033b`.
7. The extracted harness resolved the repository root one level too high, so the only
   six cases that build a fixture failed on ENOENT and were counted as intentional red.
   Corrected at `1b9115f`; the evidence was superseded, not rewritten, at `fff4e8c`.
   The margin was one commit: had the F001 implementation already been committed, the
   ordering would have been unrecoverable and those classes would have had to be
   declared unproven.

## Design decisions already taken, with their reasons

**Capabilities replace the decision specimen.** `law/policy/round-close-controls.json`
declares `control_capabilities`. The nine `DII-251` comparisons in the controller must
be replaced by capability reads. The Inspector contract asserts the complete controller
contains no string literal matching `/DII-[0-9]+/`, not a list of retired ids.

**The roster stays at sixteen.** R7-F005 requires the degraded `materializations` gate
to regain reviewer-binding, normative-source and control-provenance semantics, while
R7-F003 requires every authoritative consumer to reject a symbolic candidate. A static
policy argv cannot carry a 40-hex SHA, so a candidate-taking consumer cannot be placed
in the roster. The resolution is a **self-binding attestation gate**: argv
`["node","scripts/run-round-close-controls.mjs","control-attestation","--round","R-0007"]`,
which accepts no candidate, refuses a dirty tree, resolves the checked-out commit to one
literal identity, proves the working tree matches that commit's tree, and loads all
authority from that Git object. Any mutable byte fails it closed, so worktree
substitution cannot influence it. The gate id remains `materializations` so the ordered
population stays exactly sixteen.

**The matrix floor comes from the registry.** Only remediation-2 and remediation-3
matrices exist, so binding every campaign matrix cannot cover the 19 OPEN classes that
never had one (`F001`–`F008`, `C2-*`, `R1-*`). The union route was taken instead:
`work/rounds/R-0007/current-closure-matrix.json` carries 42 finding ids, equal to the
42 OPEN entries of the registry, collapsing to 21 distinct `defect_class_id`s so that
classes sharing a class share one real executable population. The controller must
enforce `matrix.finding_ids ⊇ registry.OPEN` and emit
`REMEDIATION_MATRIX_POPULATION_INCOMPLETE` otherwise; that check does not yet exist.

**R7-F003 is smaller than it reads.** `loadPolicy` and `validateDocument` already honour
`candidateBoundPolicy` and `candidateBoundRevision`. The defect is only that the
bootstrap sets them for three commands. The repair widens the bootstrap, drops the
worktree policy and profile read inside `resolveConsumerCandidateV8`, and replaces
`smart-converge`'s `git rev-parse` of `--head` with exact resolution.

## Anticipated Engineer implementation surfaces

Named per class in the matrix under `implementation_surfaces`:

```text
scripts/run-round-close-controls.mjs
law/policy/round-close-controls.json
law/policy/governed-sequencing.json
law/register/DECISIONS.md
law/schemas/affected-test-graph.schema.json
law/schemas/control-provenance.schema.json
law/schemas/remediation-closure-matrix.schema.json
law/schemas/review-obligations.schema.json
law/schemas/review-repair-evidence.schema.json
law/schemas/review-result.schema.json
law/schemas/review-state.schema.json
law/schemas/review-transport.schema.json
work/rounds/R-0007/affected-test-graph.json
work/rounds/R-0007/control-provenance.json
work/rounds/R-0007/review-obligations.json
.devai/config/round-close-controls.json
```

The derived `command_closure` digests in `work/rounds/R-0007/affected-test-graph.json`
are deliberately stale. They can only be regenerated after the fixpoint derivation
exists, in the Architect sequencing step.

## R7-F011, a class added during the repair

`review-scope` resolved `--base` through a throwing `git()` before any findings-based
emit, so an omitted base terminated the process with no output and no findings. A caller
received silence, indistinguishable from finding nothing wrong.

It was **not reported by Review Run 1**. It is present at the reviewed candidate
`25d0c17` and at `3e863e5`, before any Engineer commit of this repair, so it is
pre-existing rather than introduced. It was found only because five adversaries could not
discriminate and the cause was traced instead of assumed. The Owner directed repair under
DII-252 rather than deferral to Review Run 2.

The repair has two layers: a wrapper making `CONSUMER_TERMINATED_WITHOUT_RESULT` the
floor for every command, and a specific `REVIEW_SCOPE_BASE_REQUIRED` naming the
unresolvable revision. A catch-all alone would have traded a silence defect for a
vagueness defect.

**Open objection a reviewer may raise:** the wrapper could mask an unrelated future
defect by converting a crash into a finding. The narrower repair is per-site revision
validation at all six `option(--base) ?? ` call sites, retaining the wrapper only as
a backstop. This is recorded now rather than left to be discovered.

No schema was widened to accommodate the new class. A `provenance_note` field was
drafted, rejected by the registry schema, and dropped rather than loosening
`additionalProperties` — relaxing a floor to fit the document in hand is the defect
R7-F010 describes.

## Remaining sequence

1. Inspector — bind the repair and transport artifacts into the fixture state for the
   five remaining R7-001 and R7-002 cases, and pin each assertion to the specific check
   it depends on rather than a finding code; then re-observe them.
2. Inspector — triage the 18 failing carried-class guards, separating genuine defects
   from fixture-shape failures. Record which is which.
3. Architect — regenerate `work/rounds/R-0007/affected-test-graph.json` closure digests
   from the fixpoint derivation, bind the exact Inspector red, Auditor evidence and
   implementation SHAs into `law/policy/governed-sequencing.json`, and mark a class
   `GREEN_PROVED` only where its complete executable population is green.
4. Auditor — pre-freeze certification, including all sixteen literal commands from a
   clean detached candidate checkout after an offline frozen install.
5. Review Run 2 — a fresh read-only invocation with `--model claude-opus-5` and
   `--fallback-model ''`, from a new disposable candidate-only clone, **only** after the
   whole freeze checklist is true.

The freeze checklist is **not** satisfiable today. Six adversaries cannot discriminate,
the R7-004 contracts are red pending the graph rebind, and the carried guards are
untriaged. Review Run 2 is the sole remaining substantive run; a failure ends in Owner
escalation with no third run, so it must not be spent in this state.

## Boundaries honoured so far

`../devai` has not been fetched, configured, checked out, or modified. Nothing has been
deployed, published, tagged, released, or promoted. No real-stynx mutation occurred. No
closed R-0006 artifact was altered. No PASS evidence was manufactured, and no class is
recorded closed.
