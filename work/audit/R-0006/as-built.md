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
    DII-211; DII-212; DII-213; DII-214; DII-215; DII-216; DII-217; R-0006-ENTRY-INVENTORY; BL-026; BL-034; BL-035; BL-081; implementation snapshot 012fdb9a56f93bcc2a5eca126b43f5878a1f1928,
  ]
---

# R-0006 contracts and coverage depth as-built

## Boundary and verdict

R-0006 B0 through B7 are implemented and tested through exact pre-audit snapshot
`012fdb9a56f93bcc2a5eca126b43f5878a1f1928`. The B8 audit finds **no coverage or
semantics laundering**. The complete eligible package-source denominator is measured,
the four 70/60/70/70 floors and all four pre-existing exclusions are unchanged, all
186 action identities have an explicit disposition-correct output/error contract, the
24-row operational-value extraction has one canonical home per row, and mutation
strength remains separate from evidence aggregation.

This is an implementation as-built, not a B9 review or publication verdict. The exact
B9 implementation subject, two convergence passes, candidate-only clone, closure
rehearsal, candidate manifest, literal `claude-opus-5` review, review envelope,
published head, source PR, exact-head and exact-main CI, closure-only PR, closure merge,
and final exact-main CI remain serial gates. No release, package publication, tag,
GitHub Release, Pages deployment, external deployment, evidence promotion or reuse,
real-stynx mutation, predecessor mutation, or R-0007+ work is claimed.

## Backlog disposition before ceremony

| Record | As-built disposition         | Evidence                                                                                                                                                                               |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BL-026 | Implemented                  | The registry binds every identity to an explicit output and error contract; machine-mode runtime paths validate and emit the shared action-result envelope.                            |
| BL-034 | Implemented                  | DII-212 and `law/policy/operational-values.json` assign all 24 altitude-sweep rows one canonical operational home without creating a second policy setpoint.                           |
| BL-035 | Implemented as two decisions | DII-213 governs mutation selection and observations; DII-214 separately governs heterogeneous evidence aggregation. Neither can manufacture PASS from absent or uncheckable evidence.  |
| BL-081 | Implemented                  | Every one of the 140 traced test sources binds a positive assertion count and ordered assertion-site digest; the current projection totals 2,535 assertion sites across 34 invariants. |

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
denominator above the unchanged floors. The final repeated raw summary has SHA-256
`f418079a625ca796176821d25795f09b4dcaa964f8bbce854d884cb3372ff7e8`:

| Metric     | Final complete-denominator reading | Floor |
| ---------- | ---------------------------------: | ----: |
| Statements |           78.89% (17,669 / 22,395) |   70% |
| Branches   |           61.37% (11,897 / 19,384) |   60% |
| Functions  |             82.32% (2,530 / 3,073) |   70% |
| Lines      |           80.49% (16,408 / 20,385) |   70% |

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
corrected red first reading, the unchanged exclusions, and the exact denominator parity
are positive evidence against suspicious-zero filtering or arithmetic laundering.

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
test sources containing 2,535 projected assertion sites.

This is stronger than filename presence or documentary mention, but the audit does not
misstate assertion count as semantic sufficiency by itself. Invariant markers,
behavioral/adversarial tests, coverage, applicable validation strategies, and
independent review remain separate evidence.

## Role-pure batch map

| Batch | Role                  | Commit(s)                       | Result                                                                                                              |
| ----- | --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| B0    | Architect             | `6e3a2b9`                       | Froze the 186-action and 377-file entry population, including all 154 unmeasured files.                             |
| B1    | Architect             | `81ff63e`                       | Extracted operational values and separately decided mutation strength and evidence aggregation.                     |
| B2    | Inspector             | `a3e95af`                       | Preserved behavior-first red contracts for output closure and assertion-bearing trace depth.                        |
| B3    | Architect             | `e308b2a`                       | Defined the shared action envelope, per-action registry bindings, and trace-depth schema.                           |
| B4    | Engineer              | `a029265`, `58b175d`            | Implemented fail-closed machine envelopes and kept the output boundary effects-analyzable.                          |
| B5    | Inspector + Architect | `a8ab361`, `69145ad`, `bad45b4` | Added adversarial action/trace tests and materialized the assertion-bearing projection.                             |
| B6    | Architect + Engineer  | `9124f50`, `d41c648`, `8e7a44b` | Rejected the loaded-only denominator, included all valid source, and integrated real governed subprocess execution. |
| B7    | Inspector + Architect | `2ad1fc5`, `012fdb9`            | Proved runtime depth across T1-T6 and refreshed the exact 34-invariant / 140-test trace.                            |

Combined-role rows are serial role-pure commits, never shared-authority commits.

## Fresh B7 evidence

The ordinary workspace suite passed 140 files with 1,280 tests passing, eight declared
skips, and zero failures. The complete-denominator coverage command passed all four
floors with the exact numerator/denominator readings above. `pnpm run trace:check`
reported 34 invariants and 140 tests verified. `pnpm run devai:prepare` and
`git diff --check` passed before the final B7 commit. B8 reran `pnpm run devai:prepare`,
the full 140-file ordinary suite, `pnpm run trace:check`, and `git diff --check` before
its Auditor commit; B9 must generate fresh candidate-bound convergence evidence rather
than reuse these observations.
