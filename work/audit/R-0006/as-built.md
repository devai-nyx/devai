---
id: R-0006-AS-BUILT
title: R-0006 contracts and coverage depth as-built
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    DII-211; DII-212; DII-213; DII-214; DII-215; DII-216; DII-217; DII-218; DII-219; DII-220; DII-221; R-0006-ENTRY-INVENTORY; BL-026; BL-034; BL-035; BL-081; implementation snapshot 012fdb9a56f93bcc2a5eca126b43f5878a1f1928; exit-ladder correction snapshots 69ac5ab52444cac4ced11bd7a8b353e0403ab86d,
    4ba8d7bf6b4225b665798e43e98a50469aabbed3; bef3c9f7d1ce826fdb5e9cecabfc4e65a7e067db; 575bdc50921f5511c65472a756fb04fceb000e5a,
  ]
---

# R-0006 contracts and coverage depth as-built

## Boundary and verdict

R-0006 B0 through B7 are implemented and tested through exact implementation snapshot
`012fdb9a56f93bcc2a5eca126b43f5878a1f1928`. B8 and the B9 exit-ladder corrections
are audited through exact pre-amendment snapshot
`575bdc50921f5511c65472a756fb04fceb000e5a`. The audit finds **no coverage or
semantics laundering**. The complete eligible package-source denominator is measured,
the four 70/60/70/70 floors and all four pre-existing exclusions are unchanged, all
186 action identities have an explicit disposition-correct output/error contract, the
24-row operational-value extraction has one canonical home per row, and mutation
strength remains separate from evidence aggregation. The first B9 convergence FAIL and
its three immutable sequencing defects remain visible rather than being relabelled
green.

This is an implementation as-built, not a B9 review or publication verdict. The exact
B9 implementation subject, two convergence passes, candidate-only clone, closure
rehearsal, candidate manifest, literal `claude-opus-5` review, review envelope,
published head, source PR, exact-head and exact-main CI, closure-only PR, closure merge,
and final exact-main CI remain serial gates. No release, package publication, tag,
GitHub Release, Pages deployment, external deployment, evidence promotion or reuse,
real-stynx mutation, predecessor mutation, or R-0007+ work is claimed.

## Backlog disposition before ceremony

| Record | As-built disposition                       | Evidence                                                                                                                                                                                   |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BL-026 | Implemented with bounded behavioral census | The registry binds all identities to exact contracts; tests prove shared kept-action envelopes plus folded/tombstoned refusal, without claiming one end-to-end invocation per kept action. |
| BL-034 | Implemented                                | DII-212 and `law/policy/operational-values.json` assign all 24 altitude-sweep rows one canonical operational home without creating a second policy setpoint.                               |
| BL-035 | Implemented as two decisions               | DII-213 governs mutation selection and observations; DII-214 separately governs heterogeneous evidence aggregation. Neither can manufacture PASS from absent or uncheckable evidence.      |
| BL-081 | Implemented                                | Every one of the 140 traced test sources binds a positive assertion count and ordered assertion-site digest; the current projection totals 2,552 assertion sites across 34 invariants.     |

Backlog closure standing remains subject to B9 review, publication, exact-main CI, and
the closure-only machine verb.

## Coverage denominator audit

B0 preserved the then-current loaded-module report instead of silently treating it as
whole-source evidence. That report covered 223 of 377 eligible source files and omitted
154 valid shipped files: 150 in CLI, one in core, and three in skills. Its raw reading
passed only against that incomplete population:

| Metric     | B0 loaded-module reading | Floor |
| ---------- | -----------------------: | ----: |
| Statements | 72.42% (10,821 / 14,940) |   70% |
| Branches   |  62.36% (7,867 / 12,615) |   60% |
| Functions  |   78.07% (1,556 / 1,993) |   70% |
| Lines      |  74.52% (9,984 / 13,396) |   70% |

DII-217 correctly rejected that denominator. Adding the explicit complete source
include exposed the expected red first reading—48.33% statements, 40.59% branches,
50.66% functions, and 48.99% lines—rather than restoring the loaded-only shortcut.
Behavioral tests and governed subprocess observation then raised the same complete
denominator above the unchanged floors. After the exit-ladder type correctness repair,
the fresh raw summary has SHA-256
`668853a175141f371d61ae7f01f2b246f885f3fc2abdc9e403a9d0eb25a75801`:

| Metric     | Final complete-denominator reading | Floor |
| ---------- | ---------------------------------: | ----: |
| Statements |           78.89% (17,668 / 22,395) |   70% |
| Branches   |           61.35% (11,894 / 19,384) |   60% |
| Functions  |             82.32% (2,530 / 3,073) |   70% |
| Lines      |           80.48% (16,407 / 20,385) |   70% |

The current tracked population contains 378 eligible files, and the final JSON summary
contains all 378. The increase from B0 is the new shipped Engineer source
`packages/cli/src/action-output.ts`; it joined automatically under the explicit include
and was not removed from the denominator.

### Include, exclusion, and provider findings

The canonical source include is now
`packages/*/src/**/*.{ts,tsx,js,mjs,cjs}`. The exclusions remain byte-for-byte the
same four classes recorded at B0:

- `**/dist/**`
- `**/tests/**`
- `**/*.config.ts`
- `**/generated/**`

The threshold policy still reads lines 70, branches 60, functions 70, and statements 70. No valid source was renamed, moved under an exclusion, or relabelled generated to
obtain PASS. The test population expanded from unit plus integration to the complete
T1-T6 source classes: package unit and contract tests plus root contract, integration,
regression, end-to-end, and containment tests.

Vitest's parent worker cannot observe CLI child processes. The custom provider admits
only opted-in `NODE_V8_COVERAGE` process records, discards malformed and non-file
records, source-maps real executed child ranges, and projects only positive observed
hits onto Vitest's already-created canonical TypeScript statement, branch, and function
locations. It never adds a file or location to, or removes one from, that canonical map;
the explicit 378-file include therefore remains the denominator. Both final executions
produced identical summary bytes. This is execution observation, not synthetic line
credit.

The report retains genuinely low and zero-covered valid files. Their presence, the
corrected red first reading, the unchanged exclusions, the exact denominator parity,
and the small observable reading change after the type-check behavior became green are
positive evidence against suspicious-zero filtering or arithmetic laundering.

## First B9 convergence failure and correction

The first B9 convergence attempt at exact candidate
`c5b2c770107fc7684d689d4158ecb092aab2969d` failed closed on its first pass and wrote
no valid convergence state. Formatting found four Inspector-owned files. Stage 1 found
16 root TypeScript errors in the new tests and coverage provider. Governance found
three substantive Engineer commits with zero sequencing binding. Ordinary tests,
stage 2, T4-T6, changesets, and complete coverage remained green, but a partial green
set cannot override any failed required gate.

Inspector `0cf442d310f1be130e90a85a7622f7950e06f83f` made all new tests and provider code
repository-formatted and root-typecheck clean, supplied a local type contract for the
untyped V8 merger, and made the public type-check action assertion follow its actual
deterministic green result. A fresh ordinary run passed 140 files / 1,280 tests / eight
declared skips, and the complete 378-file denominator remained green at the exact
readings above.

DII-218 records the sequencing result without inventing retrospective compliance:

- `a0292658a7322066ba70b91c80f0c3d751ab69dc` and
  `58b175d3b751c52fe55a97aa17b78f2c55e14d2c` followed the B2 failing action contract
  and DII-215, but the immutable red source did not literally bind every implementation
  path later changed.
- `8e7a44b70a3e13b85293de48af8284889daea7e3` followed DII-217 and the observed
  corrected whole-source red reading, but lacked a prior committed Inspector source
  plus durable Auditor JSON binding every exact changed path.

The policy therefore lists only these exact immutable commits as historical commit
exceptions. They grant no prospective bypass. After Architect
`69ac5ab52444cac4ced11bd7a8b353e0403ab86d` added the disclosures and refreshed the
caused trace projection, governed sequencing passed all 52 commits, trace verified 34
invariants / 140 tests, root typecheck passed, repository-wide Prettier passed, and the
ordinary suite remained green. All prior convergence, rehearsal, and manifest state is
stale; B9 must restart from the post-amendment candidate.

The next fresh attempt at exact candidate
`3c8f2fb3f90ee2c506e2a29edd03499cf642e04e` passed 15 of 16 first-pass gates but
returned exit 1 for stage 2, so it also produced no valid convergence state. Formatting,
preparation, projections, diff, ordinary tests, stage 1, T4-T6, changesets, complete
coverage, and governance all passed at that exact candidate. An immediate untouched
standalone rerun of the same stage-2 command passed: build was green, T1 passed 78 files
and 866 tests, and T2 passed 44 files and 326 tests with one declared skip. This is
evidence of intermittent stage-2 instability, not permission to reuse the failed pass
or omit the gate. B9 still requires two fresh exact-candidate passes, and independent
review must challenge this observation rather than treating a later green run as proof
that the failure did not occur.

The following attempt at exact candidate
`eb19bd6a1d31242ef5f9a49df8ac54a21f9c104e` ran all 16 gates green in both passes,
with identical coverage summary digest
`668853a175141f371d61ae7f01f2b246f885f3fc2abdc9e403a9d0eb25a75801`
and equivalent ordered outcomes, but still failed closed because the relevant-workspace
digest changed between passes. Inspection found 189 ignored raw child-process coverage
files under `scratch/coverage/t1-t6-child-v8`; their names encode process IDs and times,
so retaining them made the no-write proof nondeterministic even though the merged
coverage bytes were stable.

Inspector `86566d9033c348da099b935498b829faeb19ac6e` now removes that ephemeral raw directory
in a `finally` boundary after real child hits have been merged into the canonical map.
A fresh complete coverage run retained the exact 378-file denominator and readings
above, then left the raw directory absent. The ordinary 140-file / 1,280-test / eight-skip
floor, root typecheck, repository-wide formatting, and diff check also passed. The two
green-but-drifting passes remain failed evidence and cannot be reused; B9 must converge
again at the new exact candidate.

The next attempt at exact candidate
`4935dad75f46c7af370a020cdfe9007b2594da3e` again failed stage 2 on its first pass.
A diagnostic execution of the unchanged convergence command exposed the retained
failure output: the public CLI bootstrap test reached Vitest's default 5,000 ms timeout
while importing the complete governed CLI surface under the full serial gate load.
Five standalone stage-2 runs and five focused executions passed, so the prior green
observations did not identify or erase the load-sensitive bound. Inspector
`2b5cf2d9f1005668485170fd712c1e0017ac1f47` assigned only that full-bootstrap test a
15,000 ms limit without changing its governed-surface, exit-code, help, domain, or
channel assertions. It then passed five consecutive focused runs, the ordinary suite,
stage 2, root typecheck, formatting, preparation, and diff check. Architect
`4ba8d7bf6b4225b665798e43e98a50469aabbed3` refreshed the caused assertion digest;
trace still verifies 34 invariants and 140 test sources. This is a deterministic
resource allowance for the same assertion contract, not a skipped test, retry, or
semantic relaxation. The failed candidate retains no standing.

At exact candidate `970651a5f49fa6e2bb7f979d53371a147ef0e109`, fresh convergence
subsequently passed all 16 gates in both passes. Both passes were clean before and
after, retained coverage digest
`668853a175141f371d61ae7f01f2b246f885f3fc2abdc9e403a9d0eb25a75801`,
and produced identical relevant-workspace digest
`74d291caeb797feb4229cab9144b19f4bc0735d8916c0ddbce20186ccfde1383`.
The candidate-only closure rehearsal also passed and exercised the production phase
verb with schema-valid, exact-range output.

The following candidate-manifest attempt nevertheless failed closed and wrote no new
valid manifest. Its whole governed-range role map found two immutable B6 Engineer
commits that touched Inspector-owned paths: `d41c648b184ae63c2ed473ae1a44725eb3cb26dc`
changed `tests/config/t1-t3.coverage.config.ts`, while
`8e7a44b70a3e13b85293de48af8284889daea7e3` changed that path and
`tests/config/subprocess-v8-coverage-provider.ts` alongside Engineer-owned files. The
manifest returned `ROLE_PATH_VIOLATION` for both commits and
`MANIFEST_SCHEMA_INVALID`; green convergence and rehearsal do not override that
result. Any correction must name only those exact historical commits and mismatched
paths, reject stale or overbroad use, and retain the standing `tests/**` Inspector
boundary. The candidate has no review or publication standing.

DII-219 retains that failure and classifies the immutable history without moving the
role boundary. Canonical and materialized policy now name only the two full commits,
their actual Engineer role, the exact one-path and two-path unauthorized sets, the
governing decision, and nonempty reasons. Engineer
`b51de82cf519ad47e29e15ad0960ffdfd7e99c2d` implements exact-set validation; it rejects
duplicate or malformed entries, globs, absent commits, wrong roles, unresolved
decisions, omitted paths, unused extra paths, and already-authorized paths. Inspector
`6f20e14138d32460e4b67b56ae0d79828ff07520` proves the valid exact case plus wrong-role,
unresolved-decision, out-of-range-commit, glob, and extra-path adversaries. Architect
`bef3c9f7d1ce826fdb5e9cecabfc4e65a7e067db` binds the prior red and durable Auditor
observation to both implementation paths and refreshes the caused trace digest.
Governed sequencing then passed all 67 commits. The original role-path findings remain
true historical evidence; only their exact closed classification now permits a fresh
manifest to describe the range.

The first literal `claude-opus-5` B9 review at candidate
`c0f49afc9013d61e5d528067c60057adea3c745e` returned FAIL with five P1 blockers and
zero P0. Its immutable record is
`work/audit/R-0006/independent-opus-b9-review-failure.md`. The repair now scans actual
tracked files in every configured semantic population, proves exact router-only modes
and folded/tombstoned runtime refusal, discloses DII-219 exceptions in manifest rows,
records both final red dispositions, and re-reads the trace total. The complete suite
passes 1,290 tests with eight skips. DII-221 separately preserves the real missing
literal Inspector-path binding on Engineer `63b2238ddf22e542ba3e755108477ddd903ea137`;
its exact historical sequencing exception grants no prospective bypass. All prior
convergence, rehearsal, manifest, and review evidence is stale for the new candidate.

## Action output and error totality

The canonical registry remains 186 never-reminted identities: 147 `keep`, 38 `fold`,
and one `tombstone`. Every row has both an `output_contract` and an `error_contract`.
All 147 runnable rows require the shared closed `action-result.schema.json` envelope:
success is one `ok: true` object on stdout and failure is one `ok: false` object on
stderr carrying `error.schema.json`; the opposite channel stays empty. Registry-bound
payload schemas are validated when present. Action identity is taken from the
canonical binding, not inferred from prose or caller argv.

The 39 folded or tombstoned rows are explicitly `router-only` with no success or error
channel. Counting them as runnable would be false totality; their migration/refusal
route is their only supported behavior. Adversarial tests cover malformed payloads,
unknown identities, structured handler failures, usage failures, opposite-channel
silence, and the common command harness. Human rendering remains presentation and is
not used as machine evidence.

The non-keep census now asserts exact `router-only` output and error modes for all 39
rows. A registry-derived folded alias and the tombstone are both executed and prove
exit 2, empty stdout, and one structured stderr refusal. The kept-action envelope is
tested generically plus across the existing public-read and command suites, but this
audit does not claim a dedicated end-to-end invocation for each of the 147 kept
identities. Contract totality and per-identity invocation coverage are distinct.

## Law extraction and evidence semantics

`law/policy/operational-values.json` contains the complete 24-row altitude-sweep
population: 17 values are carried directly and seven point to an existing canonical
schema or policy. The 17 direct value groups are held once under the policy's `values`
object. DII-212 keeps constitutional doctrine and deliberate anchors while making each
concrete operational spelling a single independently editable setpoint.

DII-213 and DII-214 remain deliberately separate:

- Mutation selection must be nonempty, exact-candidate-bound, and complete. PASS needs
  every required scenario, every required critical kill, zero runtime/infrastructure
  errors, score at least 60, survivors at most 50, and an independently checkable
  report. A surviving required critical mutant or threshold breach is FAIL only after
  a valid observation exists. Missing, invalid, stale-subject, incomplete, unavailable,
  crashed, timed-out, or independently uncheckable evidence is UNKNOWN and blocks a
  required readiness conclusion.
- Evidence aggregation derives a nonempty required population from policy. A current
  readiness-bearing FAIL dominates; otherwise any absent, stale, UNKNOWN, unavailable,
  conflicting, judge-only, erroneous, or independently uncheckable required member
  yields UNKNOWN. PASS requires one current independently checkable PASS for every
  required member. Omission and filtering never supersede evidence, and N/A requires a
  visible policy-declared reason and may not empty a readiness population.

Neither mutation PASS nor judge assessment can establish readiness alone. Evidence
reuse and promotion remain disabled.

## Trace-depth audit

The trace schema and generator require a positive `assertion_count` and SHA-256
`assertion_digest` for every test-corpus row. The generator derives both from exact
tracked bytes and rejects missing sources, zero assertion sites, unsupported or
ambiguous forms, and digest drift. The current trace verifies 34 invariants and 140
test sources containing 2,552 projected assertion sites.

This is stronger than filename presence or documentary mention, but the audit does not
misstate assertion count as semantic sufficiency by itself. Invariant markers,
behavioral/adversarial tests, coverage, applicable validation strategies, and
independent review remain separate evidence.

## Role-pure batch map

| Batch                 | Role                                       | Commit(s)                                                                              | Result                                                                                                                                                                                |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0                    | Architect                                  | `6e3a2b9`                                                                              | Froze the 186-action and 377-file entry population, including all 154 unmeasured files.                                                                                               |
| B1                    | Architect                                  | `81ff63e`                                                                              | Extracted operational values and separately decided mutation strength and evidence aggregation.                                                                                       |
| B2                    | Inspector                                  | `a3e95af`                                                                              | Preserved behavior-first red contracts for output closure and assertion-bearing trace depth.                                                                                          |
| B3                    | Architect                                  | `e308b2a`                                                                              | Defined the shared action envelope, per-action registry bindings, and trace-depth schema.                                                                                             |
| B4                    | Engineer                                   | `a029265`, `58b175d`                                                                   | Implemented fail-closed machine envelopes and kept the output boundary effects-analyzable.                                                                                            |
| B5                    | Inspector + Architect                      | `a8ab361`, `69145ad`, `bad45b4`                                                        | Added adversarial action/trace tests and materialized the assertion-bearing projection.                                                                                               |
| B6                    | Architect + Engineer                       | `9124f50`, `d41c648`, `8e7a44b`                                                        | Rejected the loaded-only denominator, included all valid source, and integrated real governed subprocess execution.                                                                   |
| B7                    | Inspector + Architect                      | `2ad1fc5`, `012fdb9`                                                                   | Proved runtime depth across T1-T6 and refreshed the exact 34-invariant / 140-test trace.                                                                                              |
| B8                    | Auditor                                    | `c5b2c77`                                                                              | Recorded denominator, exclusion, threshold, contract-totality, law-extraction, and evidence-semantics findings without publication standing.                                          |
| First B9 correction   | Inspector + Architect                      | `0cf442d`, `69ac5ab`                                                                   | Closed formatting/typecheck nondeterminism, disclosed three immutable sequencing defects, and refreshed trace; the failed candidate retains no standing.                              |
| Convergence cleanup   | Inspector                                  | `86566d9`                                                                              | Removed ephemeral PID-named child coverage inputs after merging real hits, preserving the denominator while making the no-write proof reproducible.                                   |
| Stage-2 stabilization | Inspector + Architect                      | `2b5cf2d`, `4ba8d7b`                                                                   | Bound the full public CLI bootstrap test to 15 seconds after its observed 5-second load timeout and refreshed only its caused assertion digest.                                       |
| Manifest correction   | Inspector + Auditor + Architect + Engineer | `fb37d09`, `cfcd286`, `ac97a17`, `b51de82`, `6f20e14`, `bef3c9f`                       | Preserved the role-boundary red, added exact historical classification, hardened adversaries, bound sequencing, and refreshed trace without changing role ownership.                  |
| Final Opus correction | Auditor + Inspector + Architect + Engineer | `fc454ea`, `a1bedaa`, `6887b1f`, `0cb264b`, `fb829c3`, `63b2238`, `8e5b3db`, `575bdc5` | Preserved the five-P1 FAIL, closed population scanning and exception disclosure, tightened router-only proof, recorded green dispositions, and disclosed the final sequencing defect. |

Combined-role rows are serial role-pure commits, never shared-authority commits.

## Fresh pre-review evidence

The corrected ordinary workspace suite passed 140 files with 1,290 tests passing,
eight declared skips, and zero failures. The complete-denominator coverage command
passed all four floors with the exact numerator/denominator readings above. Root
typecheck, repository-wide Prettier, governed sequencing across 77 commits,
`pnpm run trace:check` at 34 invariants / 140 tests, `pnpm run devai:prepare`, and
`git diff --check` passed after the first B9 correction. The focused public bootstrap
test passed five consecutive runs after its scoped timeout repair, and stage 2, root
typecheck, preparation, formatting, diff check, ordinary tests, and trace verification
passed before this amendment. This amendment will rerun the mandatory commit floor;
B9 must then generate fresh candidate-bound convergence evidence rather than reuse any
earlier observation. The refreshed trace contains 2,552 projected assertion sites
across the same 34 invariants and 140 test sources.
