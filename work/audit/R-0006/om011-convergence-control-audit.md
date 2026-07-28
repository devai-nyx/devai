---
id: R-0006-OM-011-CONVERGENCE-CONTROL-AUDIT
title: R-0006 OM-011 convergence-control as-built audit
type: audit-report
status: active
date: 2026-07-28
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-011; DII-229; Owner f78755bf158bf491e5e1c01c94e9975ab04642c4; Architect caa6d583ddee74786c11fb6aedd56fc20e75e3b7 and 7d59fa0c03f763e3638771ab962be3f19ccd1252; Inspector 0215430f21649fb81650df312cbddef9e1e92b4c and 20a2e75885badbd4604cdd21ffb154a8c2beb9f3; Engineer ec68086260b0f9d5e13656c05504681ab253d1a7; Architect projection d6ea108e261b60776161770130771c98ce947495,
  ]
---

# R-0006 OM-011 convergence-control as-built audit

## Disposition

**PASS for the bounded OM-011 implementation before smart convergence and review-scope
generation.** This audit admits the implementation to the mandatory smart-convergence,
rehearsal, candidate-manifest, and review-scope generation sequence. It is not an
independent-review PASS and does not authorize review iteration 5 by itself.

The worktree was clean at the Owner interruption. The supposedly uncommitted
Inspector-owned provider change did not exist in the live worktree: the current provider
correction was already preserved in role-pure Inspector commit
`e284a6cb9b2d23eaf5713c34ecf29e324397b355`. No provider, coverage configuration,
threshold, denominator, or exclusion path changed in the OM-011 correction range.

## Role-pure implementation range

| Role                 | Commit                                     | Scope                                                          |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Owner                | `f78755bf158bf491e5e1c01c94e9975ab04642c4` | OM-011 only                                                    |
| Architect            | `caa6d583ddee74786c11fb6aedd56fc20e75e3b7` | DII-229, R-0006 plan/prompt, policy, and two schemas           |
| Inspector red        | `0215430f21649fb81650df312cbddef9e1e92b4c` | 16 failing freshness and review-census contracts               |
| Architect correction | `7d59fa0c03f763e3638771ab962be3f19ccd1252` | valid examples for the two canonical schemas                   |
| Engineer             | `ec68086260b0f9d5e13656c05504681ab253d1a7` | controller, package commands, schema roster, and policy mirror |
| Inspector green      | `20a2e75885badbd4604cdd21ffb154a8c2beb9f3` | 21 acceptance and adversarial cases                            |
| Architect projection | `d6ea108e261b60776161770130771c98ce947495` | caused trace refresh only                                      |

Every commit uses the exact `DEVAI <Role> <aarusso@nyxk.com.br>` identity and its
role-owned paths. The temporary stash used to isolate the schema-example correction was
popped and dropped; no stash or uncommitted file remains.

## Preserved red

Inspector red `0215430` failed all 16 focused cases before machinery. The full floor at
that boundary reported 151 passing files and five failing files: the 16 intended OM-011
behavioral failures plus five failures caused by the two new schemas not yet appearing
in the Engineer-owned roster. The exact commands, counts, defect, implementation paths,
and adversary classes are preserved in
`work/audit/R-0006/red-evidence-om011-convergence-controls.json`.

No failing output was relabelled green. A separate transient full-suite failure after
implementation was the new Inspector test's five-second harness timeout under load; the
focused behavior was green. Inspector green raised only that suite's timeout to thirty
seconds and expanded the adversaries, after which the complete floor passed.

## Freshness DAG population

The machine-derived policy contains exactly 16 freshness tasks and 16 ordered
convergence commands across nine named input sets. Every task key binds policy version,
task ID, exact argv and repository-relative cwd, worktree input entries and digests,
dependency keys, required output specifications, toolchain digest, and allowlisted
environment digest. Tracked modifications, untracked inputs, deletions, and renames are
represented in the input population; timestamps have no standing.

The only four task outcomes are `EXECUTED_PASS`, `SKIPPED_FRESH`, `EXECUTED_FAIL`, and
`BLOCKED`. Runtime cache is written only below ignored
`.devai/state/round-runs/<round>/close/freshness/`. A cache record must pass the canonical
schema, its self-digest, exact task key, PASS status, dependency freshness, and current
required-output byte digests. A failed execution overwrites any former PASS for that key;
malformed, stale, and tampered records execute rather than skip.

Local second-pass skips reuse only the exact effective PASS digest. A remote context
identified by `CI` or `GITHUB_ACTIONS` distrusts pre-existing local cache, executes the
complete first-pass gate set, and may reuse only results produced during that same
invocation for its immediate second pass.

The graph is deliberately conservative. Ordinary and tier tasks bind broad source,
test, helper, configuration, package, lockfile, TypeScript, Vitest, law, and tool inputs
where exact static dependency knowledge is incomplete. Unknown or dynamic relationships
therefore widen execution rather than create a skip.

## Coverage disposition

Coverage is one whole-only task. Its input set contains production, scripts, all test
and coverage-provider sources, package manifests and lockfile, workspace and TypeScript
configuration, the thresholds policy, and the close-control policy. Its required output
population includes the summary, statement-level artifact, and retained raw subprocess
evidence. Any missing or byte-changed retained output invalidates reuse. The
implementation contains no partial coverage merger and changes no 70/60/70/70 floor,
source set, denominator, or exclusion.

## Review-topic census

The following claim is derived from the complete governed B9 review-record population;
`policy-check` rejects any stale, missing, extra, or malformed value.

<!-- governed-current-claims:start -->

{"prior_b9_failure_records":7}
<!-- governed-current-claims:end -->

The policy names its requirement and controlling sources, every prior governed B9 Opus
failure record, the exact base-to-candidate changed-path population, and current plus
retained previous candidate manifests. The generator assigns stable topic IDs and
emits every required field: claim, governing paths, current/previous digest, changed
status, adversaries, prior findings, freshness proof, and required disposition.

The record verifier enforces a topic-to-disposition bijection, independent current digest
matching, substantive freshness reasoning for `REUSED_FRESH_PASS`, and rejection of
unknown, omitted, duplicated, failed, or blocked topics. Under OM-012 every positive
integer cycle is structurally admitted, while each FAIL still invalidates the candidate
and requires complete-class repair. Previous P0–P3 headings remain census topics after
repair.

## Validation read before this audit

- both new schemas and their examples compile under JSON Schema 2020-12;
- the canonical schema meta-gate passes all 60 schemas with no finding;
- the close-control policy and committed `.devai/config/` mirror are byte-identical;
- focused OM-011 acceptance passes 21/21 adversarial cases;
- ESLint, TypeScript no-emit, Prettier, and `git diff --check` pass for affected paths;
- `pnpm run devai:prepare` passes;
- `pnpm vitest run` passes 156 files and 1,479 tests with eight governed skips; and
- trace check passes 34 invariants across 156 test sources.

## Current limits and nonclaims

The final exact-candidate smart convergence, DB-backed gate execution, fresh coverage,
closure rehearsal, candidate-only manifest, and complete real-candidate review-scope
manifest occur after this audit commit so they can bind the audit itself. Until those
steps pass, there is no ready-to-review SHA.

No `claude-opus-5` invocation, fifth review, review PASS, review envelope, push, pull
request, remote exact-head CI, merge, exact-main CI, PC-0007, closure, release,
deployment, evidence promotion, threshold/exclusion change, real-stynx mutation,
predecessor mutation, or later-round authority is claimed.
