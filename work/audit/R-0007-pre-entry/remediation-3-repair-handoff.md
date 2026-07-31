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
reconstructed intent. It records what is proved, what is declared but not yet
delivered, and what must not be repeated. It is **not** the causal red-evidence
record required by the role-pure sequence; that record does not yet exist.

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
| Current head          | `bb9f79cd5332e8396f847f187b7c72a86986eb09`                          |
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

Seventeen commits, all role-pure. Seven are corrections to earlier work in this same
repair. They are recorded rather than squashed, because the sequence they document is
itself the evidence.

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
- Closure derivation reaches `tsconfig.base.json`, the nine depth-2 references, all
  thirteen projects’ output and root sets, programs outside the former allowlist, and
  surfaces `packages/cli/dist/bin.js` as a missing executable rather than dropping it.

## What is not proved, and must not be read as proved

- **The six R7-001 and R7-002 cases do not discriminate.** `stateChain` builds a state
  whose `repair_evidence_digest` and transport linkage are unset, so the controller
  never enters the repair or transport branches those assertions target. They fail, but
  not for the reason they claim. Inspector work must bind those artifacts into the state
  before the cases mean anything.
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

## Remaining sequence

1. Inspector — bind repair evidence and transport linkage into the fixture state so the
   six R7-001 and R7-002 cases discriminate; then re-observe them.
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
