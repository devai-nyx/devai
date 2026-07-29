---
id: R-0006-ENTRY-INVENTORY
title: R-0006 B0 contracts and coverage entry inventory
type: round-finding
status: active
date: 2026-07-27
authority: Architect
supersedes: null
superseded_by: null
provenance:
  [
    DII-211; R-0006-INDEPENDENT-REVIEW; R-0001-LAW-ALTITUDE-SWEEP; BL-026; BL-034; BL-035; BL-081; published entry-control head c6c9d4c11c99f63b54e21dd8f34e31a611a1856f,
  ]
---

# R-0006 B0 contracts and coverage entry inventory

## Boundary

This inventory freezes the state before B1 changes law or B2 adds substantive
contracts. The worktree was clean at exact subject
`c6c9d4c11c99f63b54e21dd8f34e31a611a1856f`, which descends from exact live base
`7cf325625307a630344efe971bceccb011560301`. The E5 review binds review candidate
`790126e0a048927562173ee1c295a44003e027e4`, manifest digest
`fb9e5341bc7ceace7e10a162597d3adb3582cd154006a7b1922c630a78bd7014`, and a literal
`claude-opus-5` PASS with zero P0 and zero P1 finding.

The complete machine-readable census is
`work/rounds/R-0006/b0-baseline.json` at SHA-256
`37e332965342a337a8e6275b403792cd86997733f103ee9c19e0b663ddf80094`. It records
every registry identity and every tracked package source path admitted by the
existing exclusion rules. Absent coverage entries are retained explicitly rather
than dropped.

## Action and output/error population

The canonical registry SHA-256 is
`2852fbd35197d8571535c97271a2f6ff38f63ea7fe6c9650d5d48e16206919a4` and contains
186 never-reminted identities: 147 `keep`, 38 `fold`, and one `tombstone`. Every row
is present in the B0 JSON with action id, internal binding, disposition, lifecycle,
effect, current output shape, and current error shape.

All 147 runnable actions are currently **uncontracted at the registry boundary** for
success output. Handlers emit heterogeneous JSON, human prose, or no stdout; the
shared `--format` option is injected into help but is not uniformly consumed. The
canonical `law/schemas/error.schema.json` exists, but common enforcement currently
covers authority-routing failures only; handler exceptions, usage failures, gate
failures, and dependency failures retain command-specific stderr and exit behavior.
Folded and tombstoned identities are not runnable and currently expose only router
migration/refusal behavior. No current registry row names an output schema, error
schema, success payload kind, or allowed error-code family. B2-B4 must close those
gaps without treating existing ad hoc emission as an authoritative contract.

## Operational-value extraction population

The complete R-0001 altitude-sweep population is retained. B1 will move the
operational values to canonical policy while leaving durable doctrine and deliberate
article anchors in the Constitution.

| Article | Current embedded operational value                                  | Canonical B1 home                                         |
| ------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| 1       | Primary stack names and exactly one resolved stack                  | framework operational policy: stack adapters              |
| 11      | Invariant id pattern, severity vocabulary, readiness-bearing subset | framework operational policy: invariants                  |
| 13      | Trace path and completeness mechanics                               | existing trace schema/policy; verify no duplicate remains |
| 14      | `change_policy` fields and approval flags                           | framework operational policy: invariant change            |
| 15      | Four triage tokens and routes                                       | control-loop operational policy: triage                   |
| 16      | Cycle A/B/C composition and counters                                | control-loop operational policy: cycles                   |
| 17      | Hard-gate inventory                                                 | control-loop operational policy: gates                    |
| 18      | Soft-gate rubric, evaluator separation, thresholds locator          | control-loop operational policy: soft gate                |
| 19      | Supported and experimental attempt counts and blocked token         | control-loop operational policy: iteration                |
| 21      | Escalation branch, notification, preservation, database handling    | control-loop operational policy: escalation               |
| 22      | RGR fields, branch/status tokens, worktree sequence                 | control-loop operational policy: RGR                      |
| 23      | Concrete model ladder ordering                                      | control-loop operational policy: model routing            |
| 24      | Triplet branch and merge/rebase choreography                        | control-loop operational policy: orchestration            |
| 25      | Lock key, priority bump, repeated-denial behavior                   | control-loop operational policy: locking                  |
| 26      | Checkpoint cadence                                                  | control-loop operational policy: orchestration            |
| 27      | Worktree root, cap, caches, lockfile fallback                       | control-loop operational policy: worktrees                |
| 28      | Integration branch name                                             | repository operational policy                             |
| 30      | Weakening metrics, 20% value, assertion floor, exemption            | existing thresholds plus test-weakening policy            |
| 31      | Quarantine metadata and eventual gate behavior                      | test/quarantine policy                                    |
| 32      | Concrete `SensorReading` fields                                     | existing sensor-reading schema                            |
| 34      | Auditor hook/cadence/worktree mechanics                             | control-loop operational policy: observation              |
| 37      | Prompt layers and fingerprint structure                             | existing prompt-composition schema/policy                 |
| 39      | `unknown`, `inconclusive`, confidence interval representations      | framework operational policy: result vocabulary           |
| 40      | Release/upgrade verb and client-pin mechanics                       | upgrade operational policy                                |

B1 must not copy a value into policy while leaving the same value normative in an
article. Existing schema-owned values remain schema-owned; the Constitution will keep
only the doctrine and reference the canonical operational source.

## Coverage denominator and exclusions

The normal command passed 83 files / 912 tests with seven declared skips. Its exact
raw totals are:

| Metric     | Covered |  Total | Reading | Floor |
| ---------- | ------: | -----: | ------: | ----: |
| Statements |  10,821 | 14,940 |  72.42% |   70% |
| Branches   |   7,867 | 12,615 |  62.36% |   60% |
| Functions  |   1,556 |  1,993 |  78.07% |   70% |
| Lines      |   9,984 | 13,396 |  74.52% |   70% |

The provider is V8. The test include set is exactly
`packages/*/tests/unit/**/*.test.ts` plus `tests/integration/**/*.test.ts`. The only
declared source exclusions are `**/dist/**`, `**/tests/**`, `**/*.config.ts`, and
`**/generated/**`. The config has no explicit source include. Its SHA-256 is
`6b5f121ff7e322604f4c58e7367dd4670bd663f1f52662ef47a5aa8d8d4b2e0a`; the
threshold-policy SHA-256 is
`19bff20b5d9531d15a30227fb958ea34be660d88655ef46e45888f1fc1559751`; and the raw
coverage-summary SHA-256 is
`fca78ab04c51d3e03b88cbc2f7e006c83a625cb53ee7e865e1781a268fa09343`.

The report contains 223 measured source paths. The tracked package-source population
remaining after those exact exclusions contains 377 paths, leaving 154 explicit
unmeasured paths. Of those, 150 are under `packages/cli/src`, one under
`packages/core/src`, and three under `packages/skills/src`. This is a loaded-module
denominator, not yet proof of a complete valid-source denominator. B6 must decide the
measurement question from behavior and provider semantics. It may add valid source
to measurement, but may not add an exclusion or reduce a threshold to preserve green.

## B0 disposition

B0 is complete when this inventory and its exact JSON remain schema-readable,
registry-complete, source-population-complete under the stated rules, and reproducible
from the frozen subject. It decides no B1 policy, closes no B2 red, changes no runtime
behavior, and makes no release, readiness, evidence-reuse, or promotion claim.
