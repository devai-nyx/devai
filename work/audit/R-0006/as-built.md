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
    DII-211–230; OM-011; R-0006-ENTRY-INVENTORY; BL-026; BL-034; BL-035; BL-081; R-0006-COVERAGE-DEPTH-EVIDENCE; R-0006-RETAINED-COVERAGE-FIXPOINT-RED-EVIDENCE; R-0006-BRANCH-COVERAGE-INTEGRITY-RED-EVIDENCE; R-0006-HONEST-BRANCH-COVERAGE-DEPTH-RED-EVIDENCE; R-0006-EXACT-LOCATION-COLLISION-RED-EVIDENCE; R-0006-SUBPROCESS-LOCATION-AGGREGATION-RED-EVIDENCE; R-0006-INDEPENDENT-OPUS-B9-REVIEW-5-FAILURE; implementation subject e284a6cb9b2d23eaf5713c34ecf29e324397b355; trace projection cef0540a70a62de2222078c63455cd763fa92703; sequencing binding 5fb17269fe3b17cf4d0de9733b6fd3b1146106d9; fifth-review failure evidence 2e02d31c9504d4ee63dbe05f40084466292aff99,
  ]
---

# R-0006 contracts and coverage depth as-built

## Boundary and verdict

R-0006 B0 through B7 and the final B9 coverage correction are implemented and tested
through exact implementation subject `e284a6cb9b2d23eaf5713c34ecf29e324397b355`;
its caused trace projection is exact Architect commit
`cef0540a70a62de2222078c63455cd763fa92703`. B8 and the B9
exit-ladder corrections are audited through that projection. The audit finds **no
coverage or semantics laundering**. The complete eligible package-source denominator is measured,
the four 70/60/70/70 floors and all four pre-existing exclusions are unchanged, all
186 action identities have an explicit disposition-correct output/error contract, the
24-row operational-value extraction has one canonical home per row, and mutation
strength remains separate from evidence aggregation. All mandatory B9 Opus FAILs,
every exact-hit and collision-semantics correction, every honest post-correction red,
and every governed R-0006 historical sequencing exception remain visible rather than
being relabelled green.

The following block is the sole current numeric authority in this audit for its named
volatile populations. `policy-check` derives every value from canonical machine sources
and rejects drift, missing or extra fields, malformed blocks, and unbound current numeric
prose.

<!-- governed-current-claims:start -->

{"trace_invariants":34,"trace_test_sources":156,"trace_assertion_sites":2857,"r0006_sequencing_exception_entries":5,"r0006_sequencing_exception_commits":6,"operational_direct_rows":17,"operational_distinct_direct_value_homes":16,"operational_total_value_homes":17}
<!-- governed-current-claims:end -->

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
| BL-081 | Implemented                                | Every traced test source binds a positive assertion count and ordered assertion-site digest; the governed claim block above is derived from `law/trace.json`.                              |

Backlog closure standing remains subject to B9 review, publication, exact-main CI, and
the closure-only machine verb.

## Coverage denominator audit

B0 at exact subject `6e3a2b9f7f5c76b742a546be0f9dd2fc6dfece06` preserved the
then-current loaded-module report instead of silently treating it as whole-source
evidence. That report covered 223 of 377 eligible source files and omitted
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
The second mandatory Opus review later rejected a containment-based subprocess
numerator and required exact-location measurement. DII-222 and the Inspector repair
preserve explicit zero hits, emit statement-level JSON, and retain 191 raw subprocess
V8 JSON inputs. The first honest exact-hit reading was red; behavior-bearing Inspector
depth tests then raised that same denominator above the unchanged floors. At exact
reviewed candidate `ab4721b09ef3dde327c5d660fdf78b542cc85a66`, the candidate-bound
raw summary has SHA-256
`ac29412270641af7c8f3ca8276fcf3ae4cc48a81c425fe904c185f4c7c79e08c`:

| Metric     | Final complete-denominator reading | Floor |
| ---------- | ---------------------------------: | ----: |
| Statements |           71.87% (16,094 / 22,393) |   70% |
| Branches   |           60.15% (11,659 / 19,382) |   60% |
| Functions  |             80.67% (2,479 / 3,073) |   70% |
| Lines      |           73.27% (14,936 / 20,383) |   70% |

At exact reviewed candidate `ab4721b09ef3dde327c5d660fdf78b542cc85a66`, the tracked
population contains 378 eligible files and the final JSON summary contains all 378. The
increase from B0 is the new shipped Engineer source
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
only opted-in `NODE_V8_COVERAGE` process records, rejects malformed records, discards
non-file records, source-maps real executed child ranges, and merges only complete exact source
locations into Vitest's canonical TypeScript statement, branch, and function map.
Explicit zero-hit locations remain zero; containment, nearest-range, and line inference
are forbidden. Complete canonical parent locations are unique; same-kind subprocess
observations that source-map to one canonical location are summed before one exact
application. It never adds a file or location to, or removes one from, that canonical
map; the explicit 378-file include therefore remains the denominator. The stable
candidate-bound summary digest is
`ac29412270641af7c8f3ca8276fcf3ae4cc48a81c425fe904c185f4c7c79e08c`.
The statement-level artifact is retained run evidence but is byte-unstable and has no
durable cross-run digest. This is auditable execution observation, not synthetic line
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
declared skips, and the complete 378-file denominator remained green at its
then-recorded reading. The second Opus review later rejected that numerator.

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
A fresh complete coverage run retained the exact 378-file denominator and its
then-recorded reading, then left the raw directory absent. The second Opus review later
rejected that numerator. The ordinary 140-file / 1,280-test / eight-skip floor, root
typecheck, repository-wide formatting, and diff check also passed. The two
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

The second literal `claude-opus-5` B9 review at candidate
`b9d300913ef92e1af72e7fc8f24d54d9134dc6c2` returned FAIL with one P0, one P1,
and three P2 findings. Its immutable record is
`work/audit/R-0006/independent-opus-b9-review-2-failure.md`. The P0 finding exposed
containment-based subprocess coverage inflation; the P1 found stale as-built coverage
evidence; the P2 set found stale exception, governed-range, trace, test, and phase
claims. DII-222 requires exact hits and auditable raw evidence. Inspector
`4edba5b80369087fe9f0e875584f7812ab210886` repaired the provider, and the first
honest complete reading then failed the unchanged statements, branches, and lines
floors. Inspector `77da3986d424b8d0467f087f76d259d31b6cca37` closes that real gap
with behavior-bearing tests only; Architect `586fafab2c5cb28b97937fa14ac32e2e9000fff4`
refreshes the caused trace projection. That exact historical result passed 153 files
and 1,441 tests with eight declared skips at statements 71.33% (15,975/22,393),
branches 60.12% (11,654/19,382), functions 80.34% (2,469/3,073), and lines 72.78%
(14,835/20,383), with summary digest
`7c394f2c539b5844349f95ec4e8073065689e7f3cc415a9f7ea28fcc52883f0b`.
The third review later invalidated its branch numerator; it is historical evidence, not
the current table. No prior candidate, convergence state, rehearsal, manifest, or
review has standing after these corrections.

The first convergence attempt after DII-223 then ran all 16 ordered gates green in both
passes with clean boundaries, identical summary digest, and equivalent outcomes, but
failed `CONVERGENCE_WRITE_DETECTED`. Its workspace digests changed solely because the
DII-222-mandated statement artifact and PID/time-named raw subprocess inputs are
per-run runtime evidence. Inspector `ebf10882d2ea55d83a773cd88c3c9b667fd42c91`
and `b3186cbd3579ade5321ce8f42686e10d4dabf967` plus Auditor evidence preserve
that red. DII-224 permits only the two exact runtime artifact paths to be normalized;
Engineer `bad810ca82b4b958399860534e12a98e42a2c5c0` implements the policy-derived
boundary, and Inspector `ce61864e29c1a04b57dd37ae482f7c42aa08a6b0` proves absent,
broad, expanded, summary-byte, command-result, ordinary scratch, and other workspace
drift still fail closed. The full suite now passes 1,443 tests with eight skips, and the
then-current coverage reading remained unchanged. The failed convergence has no standing.

The third literal `claude-opus-5` B9 review at candidate
`3c6c2d3bdde6bc6d505a6a29fb92d120a36c0050` returned FAIL with one P0, three P1,
nine P2, and four P3 findings. Its immutable record is
`work/audit/R-0006/independent-opus-b9-review-3-failure.md`. The P0 showed that empty
Istanbul implicit-branch locations collapsed to one merge key, cross-attributing at
least 97 false covered branches. The P1 set found a runtime-variable artifact digest
presented as durable evidence, a live coverage object additively merged into itself,
and focused tests that did not exercise branch or retention behavior. Inspector
`f93d8f6508706b3bbb9c9bd423581512626bf88f` preserves four exact red failures;
Inspector `2087572909813282086a48a823017e3ed74f39cf` rejects incomplete location keys,
mutates the live map without re-adding it, filters every return path, fails on malformed
raw inputs, and exposes behaviorally tested retention. The first honest corrected
reading then failed only branches at 59.62% (11,557/19,382), 73 short of the unchanged
floor. Inspector `a7814b4384c20dbbe33c830649a52f94ae5e36c5` adds ten
behavior-bearing workflow-parser and data-probe tests; Architect
`694bc725f869947c443def37e7eebad22ab83442` refreshes the caused trace. The current
reading above is green without threshold, exclusion, denominator, source, generated,
skip, or assertion-mechanism change. Runtime-variable raw artifacts remain retained but
are no longer represented as stable byte identities.

The fourth literal `claude-opus-5` B9 review at candidate
`c7ab49f5fbeffae3d8f58be0137f4c8f11d356fa` returned FAIL with zero P0, one P1,
one actionable P2, and two actionable P3 findings. Its immutable record is
`work/audit/R-0006/independent-opus-b9-review-4-failure.md`. The P1 and P2 exposed the
stale digest paragraph and historically ambiguous second-review paragraph corrected in
this sweep. The P3 set required executing repeat-merge proof and an enforced canonical
location collision invariant. Inspector `9b8b288bf83dea1342d1b7084a2253a4fd16e78a`
preserves the first red, and DII-226 requires unique canonical parent locations.
Inspector `912092f0d3d042fd932b077aa3bd06089de11bb2` made the initial focused contract
green, but the unchanged coverage command honestly failed because legitimate
subprocess branch observations converged at exact location `404:9:406:3`. Inspector
`9fe038682f35674f8cfe26eda6c3e271eb2ee21c` and Auditor
`968099c2582e8812bb1bcd6e6de9cbdb3985336d` preserve the refined aggregation red.
DII-227 retains parent uniqueness while requiring same-kind subprocess observations to
sum before one exact application. Inspector
`e284a6cb9b2d23eaf5713c34ecf29e324397b355` made all eight focused cases green. At
that exact implementation boundary, the ordinary and unchanged coverage suites passed
155 files and 1,458 tests with eight skips, and Architect
`cef0540a70a62de2222078c63455cd763fa92703` refreshed the caused trace to 34
invariants, 155 test sources, and 2,784 lexical assertion sites. Those readings are
historical and bound to those exact subjects; they are not the current candidate
population.

The governed claim block derives the R-0006 sequencing-exception entry and
commit populations directly from `law/policy/governed-sequencing.json`. Separately, the
role-path policy contains exact historical classifications. These are distinct controls
and grant no prospective bypass.

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

At exact reviewed candidate `ab4721b09ef3dde327c5d660fdf78b542cc85a66`, the non-keep
census asserts exact `router-only` output and error modes for all 39 rows. A
registry-derived folded alias and the tombstone are both executed and prove
exit 2, empty stdout, and one structured stderr refusal. The kept-action envelope is
tested generically plus across the existing public-read and command suites, but this
audit does not claim a dedicated end-to-end invocation for each of the 147 kept
identities. Contract totality and per-identity invocation coverage are distinct.

## Law extraction and evidence semantics

`law/policy/operational-values.json` contains the complete 24-row altitude-sweep
population: 17 rows carry values directly and seven point to an existing canonical
schema or policy. The direct rows resolve to 16 distinct direct `values` homes; the
seventeenth `values` home, `triage_routes`, is reached by a reference row. The governed
block derives all three populations and preserves the invariant of one independently
editable canonical home per row. DII-212 keeps constitutional doctrine and deliberate
anchors while making each concrete operational spelling a single setpoint.

DII-213 and DII-214 remain deliberately separate:

- Mutation selection must be nonempty, exact-candidate-bound, and complete. PASS needs
  every required scenario, every required critical kill, zero runtime/infrastructure
  errors, score at least 60, survivors at most 50, and an independently checkable
  report. A surviving required critical mutant or threshold breach is FAIL only after
  a valid observation exists. Missing, invalid, stale-subject, incomplete, unavailable,
  crashed, timed-out, or independently uncheckable evidence is UNKNOWN and blocks a
  required readiness conclusion.
- Evidence aggregation derives a nonempty required population from policy. A fresh
  readiness-bearing FAIL dominates; otherwise any absent, stale, UNKNOWN, unavailable,
  conflicting, judge-only, erroneous, or independently uncheckable required member
  yields UNKNOWN. PASS requires one fresh independently checkable PASS for every
  required member. Omission and filtering never supersede evidence, and N/A requires a
  visible policy-declared reason and may not empty a readiness population.

Neither mutation PASS nor judge assessment can establish readiness alone. Evidence
reuse and promotion remain disabled.

## Trace-depth audit

The trace schema and generator require a positive `assertion_count` and SHA-256
`assertion_digest` for every test-corpus row. The generator derives both from exact
tracked bytes and rejects missing sources, zero assertion sites, unsupported or
ambiguous forms, and digest drift. The governed claim block derives the trace
population directly from `law/trace.json`.

This is stronger than filename presence or documentary mention, but the audit does not
misstate assertion count as semantic sufficiency by itself. Invariant markers,
behavioral/adversarial tests, coverage, applicable validation strategies, and
independent review remain separate evidence.

## Role-pure batch map

| Batch                     | Role                                       | Commit(s)                                                                                                    | Result                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0                        | Architect                                  | `6e3a2b9`                                                                                                    | Froze the 186-action and 377-file entry population, including all 154 unmeasured files.                                                                                                                                                         |
| B1                        | Architect                                  | `81ff63e`                                                                                                    | Extracted operational values and separately decided mutation strength and evidence aggregation.                                                                                                                                                 |
| B2                        | Inspector                                  | `a3e95af`                                                                                                    | Preserved behavior-first red contracts for output closure and assertion-bearing trace depth.                                                                                                                                                    |
| B3                        | Architect                                  | `e308b2a`                                                                                                    | Defined the shared action envelope, per-action registry bindings, and trace-depth schema.                                                                                                                                                       |
| B4                        | Engineer                                   | `a029265`, `58b175d`                                                                                         | Implemented fail-closed machine envelopes and kept the output boundary effects-analyzable.                                                                                                                                                      |
| B5                        | Inspector + Architect                      | `a8ab361`, `69145ad`, `bad45b4`                                                                              | Added adversarial action/trace tests and materialized the assertion-bearing projection.                                                                                                                                                         |
| B6                        | Architect + Engineer                       | `9124f50`, `d41c648`, `8e7a44b`                                                                              | Rejected the loaded-only denominator, included all valid source, and integrated real governed subprocess execution.                                                                                                                             |
| B7                        | Inspector + Architect                      | `2ad1fc5`, `012fdb9`                                                                                         | Proved runtime depth across T1-T6 and refreshed the exact 34-invariant / 140-test trace.                                                                                                                                                        |
| B8                        | Auditor                                    | `c5b2c77`                                                                                                    | Recorded denominator, exclusion, threshold, contract-totality, law-extraction, and evidence-semantics findings without publication standing.                                                                                                    |
| First B9 correction       | Inspector + Architect                      | `0cf442d`, `69ac5ab`                                                                                         | Closed formatting/typecheck nondeterminism, disclosed three immutable sequencing defects, and refreshed trace; the failed candidate retains no standing.                                                                                        |
| Convergence cleanup       | Inspector                                  | `86566d9`                                                                                                    | Removed ephemeral PID-named child coverage inputs after merging real hits, preserving the denominator while making the no-write proof reproducible.                                                                                             |
| Stage-2 stabilization     | Inspector + Architect                      | `2b5cf2d`, `4ba8d7b`                                                                                         | Bound the full public CLI bootstrap test to 15 seconds after its observed 5-second load timeout and refreshed only its caused assertion digest.                                                                                                 |
| Manifest correction       | Inspector + Auditor + Architect + Engineer | `fb37d09`, `cfcd286`, `ac97a17`, `b51de82`, `6f20e14`, `bef3c9f`                                             | Preserved the role-boundary red, added exact historical classification, hardened adversaries, bound sequencing, and refreshed trace without changing role ownership.                                                                            |
| Final Opus correction     | Auditor + Inspector + Architect + Engineer | `fc454ea`, `a1bedaa`, `6887b1f`, `0cb264b`, `fb829c3`, `63b2238`, `8e5b3db`, `575bdc5`                       | Preserved the five-P1 FAIL, closed population scanning and exception disclosure, tightened router-only proof, recorded green dispositions, and disclosed the final sequencing defect.                                                           |
| Second Opus correction    | Auditor + Inspector + Architect            | `89d7463`, `49a89b4`, `5878c28`, `7a94d38`, `4edba5b`, `3a2f94f`, `77da398`, `586fafa`                       | Preserved the P0/P1/P2 FAIL, replaced containment inference with exact hits, retained auditable artifacts, preserved the honest red, added behavioral depth, and refreshed trace.                                                               |
| Final fixpoint correction | Inspector + Auditor + Architect + Engineer | `ebf1088`, `e4335b7`, `5260972`, `b3186cb`, `60d0cbf`, `bad810c`, `ce61864`, `f677cd8`, `5fb1726`            | Preserved the all-gates-green convergence FAIL, normalized only exact runtime coverage artifacts, rejected broad policy, refreshed the final trace and close projection, and bound the Engineer implementation to its exact law and red source. |
| Third Opus correction     | Auditor + Inspector + Architect            | `dc5e80c`, `f93d8f6`, `2ee1166`, `2087572`, `05d883e`, `a7814b4`, `694bc72`                                  | Preserved the P0/P1/P2/P3 FAIL and E0-E5 PASS, removed degenerate branch cross-attribution and additive self-merge, retained an honest 59.62% branch red, added behavior-only depth, and refreshed trace.                                       |
| Fourth Opus correction    | Auditor + Inspector + Architect            | `9a0443c`, `9b8b288`, `dbb1ea5`, `c47938e`, `912092f`, `9fe0386`, `968099c`, `4c89a89`, `e284a6c`, `cef0540` | Preserved the P1/P2/P3 FAIL, proved cumulative repeat merge, enforced canonical-parent uniqueness, preserved the live subprocess-collision red, defined same-kind aggregation, and refreshed trace.                                             |

Combined-role rows are serial role-pure commits, never shared-authority commits.

## Fifth-review evidence and complete-class correction

At rejected cycle-1 review candidate
`93894da782af3943e2447f43e81e5e69cbdc73fa`, the ordinary workspace suite passed 156
files with 1,479 tests passing, eight declared skips, and zero failures. The complete
378-file denominator passed at statements 16,094/22,393 (71.87%), branches
11,659/19,382 (60.15%), functions 2,479/3,073 (80.67%), and lines 14,936/20,383
(73.27%), with stable summary digest
`ac29412270641af7c8f3ca8276fcf3ae4cc48a81c425fe904c185f4c7c79e08c`. Trace verified
34 invariants, 156 test sources, and 2,839 lexical assertion sites. The exact governed
range contained 131 commits: 40 Architect, 39 Auditor, 13 Engineer, 38 Inspector, and
one Owner commit.

Literal `claude-opus-5` cycle 1 independently reproduced those readings and the complete
207-topic census, then returned FAIL because this active as-built and the active
source-close handoff still presented older readings as current and omitted the fifth
sequencing-exception commit. Auditor `2e02d31c9504d4ee63dbe05f40084466292aff99`
preserves all 207 dispositions and the exact four-topic failure. This same-class sweep
updates every current Auditor-owned occurrence while retaining older values only inside
exact-subject historical narratives and immutable review/evidence records.

The repair at exact cycle-1 candidate
`93894da782af3943e2447f43e81e5e69cbdc73fa` invalidated every earlier convergence,
rehearsal, and manifest. Its corrected successor had to pass fresh smart convergence,
rehearsal, candidate-manifest, and review-scope generation. No earlier PASS or task
result could be carried across changed inputs except through an OM-011-valid content
address. OM-012 now governs any later repair-and-review continuation.

## Seventh-review complete-class correction

Literal `claude-opus-5` cycle 3 independently regenerated the exact 238-topic census
for rejected candidate `ee98663d639f7728ef07a3d097310659777b92ab` and returned FAIL
on three topics. Auditor `aa57003e76b8f20a9852fd17499260739f4865bb` preserves all
235 passing and three failing dispositions. The defect was one complete class: the
active Architect source-close handoff was outside the enumerated current-claim document
population and therefore retained stale trace and prior-review readings after the two
Auditor documents had been reconciled.

Inspector `c4c1758ccf40a7269721b7cacde1a2fafa6cdbec` preserves the missing-population
red, including a stale-block behavioral adversary. Auditor
`ee09665867b7d1b2ebe6725cb43b47493488e1fa` binds the full-floor red and exact
prospective repair paths. Architect `17eb61fce741336f97da10d9b0734a0479cee40d`
extends the same machine-derived block contract to the source-close handoff, exact-binds
historical quantitative prose, and regenerates the trace projection. This audit
reconciles the resulting projection only through the governed block above. Engineer
`508ce0ec00915133a349c51ee7c1ce2b753c1b33` materializes the canonical policy
byte-for-byte; Architect `1f6f95fc7c97b4f9081aad1d9e183d01f85b6ed1` binds that
implementation prospectively to the exact Inspector red and Auditor artifact without a
sequencing exception.

At exact Engineer subject `508ce0ec00915133a349c51ee7c1ce2b753c1b33`, the focused
smart-convergence contract passes 24/24 and the complete ordinary floor passes 156 test
files with 1,483 tests passing and eight governed skips. At exact Architect subject
`1f6f95fc7c97b4f9081aad1d9e183d01f85b6ed1`, canonical policy-check, trace check, and
governed sequencing pass; the sequencing gate observes 163 commits. These values are
exact-subject validation history. They authorize a fresh reacceptance decision and
fresh candidate machinery only; they do not restore the invalidated cycle-3 candidate
or claim review PASS, publication, merge, closure, release, or later-round standing.
