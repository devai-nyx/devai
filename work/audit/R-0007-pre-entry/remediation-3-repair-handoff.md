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

This record exists so the repair can resume from committed state rather than from
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

| Commit    | Role      | Content                                                    |
| --------- | --------- | ---------------------------------------------------------- |
| `5d40e95` | Auditor   | Preserve the Review Run 1 result                           |
| `875d6c4` | Architect | DII-252, `control_capabilities`, 42-class union matrix     |
| `5b6ff66` | Architect | Correction: predecessor artifact admitted, not required    |
| `4ded205` | Architect | Correction: R7 registry entries recorded at origin cycle 1 |
| `37c2911` | Inspector | 24 red adversaries plus the extracted review harness       |

Three Architect commits were produced where the sequence anticipated one. Two are
corrections to errors made in the first. They are recorded rather than squashed.

## What is proved

- Minimum floor at `25d0c17` before the Auditor commit: `devai:prepare` pass,
  `pnpm vitest run` 165 test files / 1726 passed / 8 skipped, `git diff --check`
  clean. The interrupted floor named in the handoff was rerun from the beginning.
- Harness extraction disturbed nothing: `pre-r0007-remediation-1.red.contract.test.ts`
  passes 143 of 143 after the schema correction.
- `tests/contract/pre-r0007-remediation-4.red.contract.test.ts` is intentionally red
  against its own pre-implementation tree: **22 failed, 2 passed of 24**.
- The two passing cases are declaration-level only, satisfied by the Architect step:
  `R7-005-GATE-ID-AND-EXIT-CODE` and `R7-010-MATRIX-SUPERSET-OF-OPEN`. Their runtime
  halves are among the 22 red. Neither is counted as proof of its class.

## What is declared but not delivered

`work/rounds/R-0007/current-closure-matrix.json` declares 49 R7 test ids. 24 exist.
The following 25 must exist, and be red, before any Engineer implementation:

```text
R7-004-MISSING-EXECUTABLE-BLOCKS
R7-005-SIXTEEN-LITERAL-DETACHED
R7-005-SIXTEEN-RECORDS-EVERY-ORDINAL
R7-006-CANDIDATE-AND-PREIMAGE
R7-006-OWNED-SELECTOR-WIDENING
R7-011-BINDING-CENSUS-EXACT-ONE
R7-011-BINDING-CENSUS-FAIL-CLOSED
R7-012-NO-GATE-OMITTED
R7-012-ROSTER-DELETION-FAILS
R7-013-CACHE-RECORD-IDENTITY
R7-013-CACHE-SUBSTITUTION-FAILS
R7-014-CANDIDATE-PROOF-EXACT
R7-014-CENSUS-COMPLETE
R7-015-REUSE-REJECTED
R7-015-STREAM-CANONICAL
R7-016-CLAIM-DIGEST-EXACT
R7-016-NO-PLACEHOLDER-DIGEST
R7-017-COPY-PREIMAGE-READ
R7-017-RENAME-PREIMAGE-READ
R7-018-SCOPE-IDENTITY-RECOMPUTED
R7-018-SCOPE-IDENTITY-SUBSTITUTION-FAILS
R7-019-CENSUS-NO-ALLOWLIST
R7-019-CENSUS-TRANSITIVE
R7-020-OBLIGATION-SOURCE-DRIFT
R7-020-OBLIGATIONS-COMPLETE
```

Every class in the matrix is `RED_REQUIRED`. Nothing is `GREEN_PROVED`. No commit
claims a class closed.

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

## Traps observed, not to be repeated

**A test can pass for the wrong reason.** `R7-007-THREE-CONSUMERS-AGREE` and
`R7-007-STATUS-FALSE-WHILE-BLOCKED` initially passed. They passed only because a
malformed `origin_cycle` in the registry made `status` emit `PRIOR_FINDINGS_INVALID`,
which incidentally forced `entry_ready` false. After `4ded205` the defect reproduces
exactly — `policy-check` false, `entry-check` false with
`ENTRY_BLOCKED_DECLARATION_UNBOUND`, `status` **true** — and both cases correctly fail.
Any adversary that passes before implementation must be interrogated, not banked.

**A schema tightening can invalidate history.** Marking `previous_state_artifact`
required would have invalidated every already-persisted review-state artifact, because
no production writer emits it. The reviewer's condition is that the schema _admit_ the
field. Presence belongs to the controller under a capability, not to the schema.

**Watchers that grep their own command line never fire.** Several process waits used
`pgrep -f "pnpm vitest run"`, which matches the waiting shell itself. Wait on a captured
PID instead. No evidence was affected; only wall-clock was lost.

## Remaining sequence

1. Inspector — deliver the 25 missing adversaries and prove them red.
2. Auditor — record causal red evidence on the exact Inspector-red commit, with counts
   named accurately as suites versus files, before any implementation commit.
3. Engineer — repair all ten classes as one population; remove every `DII-NNN` literal;
   regenerate the `.devai/config` materialization.
4. Architect — bind exact SHAs, refresh derived closure digests, close the matrix only
   where the complete executable population is green.
5. Auditor — pre-freeze certification, including all sixteen literal commands from a
   clean detached candidate checkout.
6. Review Run 2 — a fresh read-only invocation with `--model claude-opus-5` and
   `--fallback-model ''`, from a new disposable candidate-only clone, only after the
   whole freeze checklist is true.

## Boundaries honoured so far

`../devai` has not been fetched, configured, checked out, or modified. Nothing has been
deployed, published, tagged, released, or promoted. No real-stynx mutation occurred. No
closed R-0006 artifact was altered. No PASS evidence was manufactured, and no class is
recorded closed.
