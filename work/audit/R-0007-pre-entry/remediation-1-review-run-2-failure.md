---
id: R-0007-PRE-ENTRY-REMEDIATION-1-REVIEW-RUN-2-FAILURE
type: audit
status: current
date: 2026-07-29
authority: Auditor
round: R-0007
---

# Remediation campaign 1 independent review run 2 — failure

## Exact reviewed subject

- Remediation base: `5068e5f5b56dd15cd733c9c5d2663b09b2f43c13`.
- Reviewed candidate: `0dbe660db28261287690ea88762407a8d92ba490`.
- Reviewed tree: `f9c1a25d971a186f0229e896c1c90d606545f321`.
- Candidate-only clone: `/tmp/devaii-remediation-review2.QUzRd7`, clean and detached
  at the exact candidate before and after review.
- Merge base: the supplied remediation base.
- Reviewed range: 50 changed files and 50 change records; no rename or copy records.
- Reviewer model: `gpt-5.6-sol`, independent read-only machinery reviewer only.
- Provider provenance: externally orchestrated Codex task; repository machinery does
  not claim provider-signed model provenance.

Closed `work/rounds/R-0006/**` and `work/audit/R-0006/**` had zero byte or path
differences. The independent commit role/path census found no violation and the policy
materialization equaled the canonical policy byte-for-byte.

## Terminal result

`RUN_2_RESULT: FAIL`. The reviewer accounted for every requested original topic,
Run-1 defect class, and later compatibility class and continued after blockers. Eight
P1 defect classes remain; no P0 was found. No topic used `REUSED_FRESH_PASS` and no
topic was `BLOCKED`.

This consumes the final substantive remediation review run authorized by OM-015. The
campaign is now `ESCALATION_REQUIRED`. A third substantive review run, another repair
phase, publication, merge, or R-0007 entry is not authorized.

## Complete finding population

### R2-F001 — AUTHORITATIVE_GATE_CANDIDATE_RED (P1)

The exact authoritative formatting command fails on one file.

- Evidence: `pnpm exec prettier --check .` reports
  `law/policy/governed-sequencing.json`.
- Deterministic population query: run the exact policy formatting command at the
  detached candidate.
- Complete affected population: `law/policy/governed-sequencing.json`.
- Repair condition: format the file in an Architect-owned commit and prove the exact
  formatting command green from a clean detached candidate.

### R2-F002 — AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE (P1)

Freshness profiles are checked for nonempty selectors and probes, but are not
mechanically compared with recursively expanded command semantics. Concrete gaps
include formatting assets, preparation project references and outputs,
materialization schemas and registries, and Vitest fixtures and runtime prompt assets.

- Evidence: `scripts/run-round-close-controls.mjs:444` and
  `work/rounds/R-0007/affected-test-graph.json:316-419`.
- Deterministic population query: recursively expand all 16 policy commands through
  `package.json`, enumerate actual file, tool, environment, dependency-output, and
  persistent-output reads, and compare each command with its sole freshness profile.
- Complete affected population: formatting, preparation, action-registry, trace,
  repository-references, materializations, diff-check, ordinary, stage1, stage2, t4,
  t5, t6, changesets, coverage, and governance.
- Repair condition: generate or mechanically validate every profile from effective
  command dependencies; changing or removing any effective input, executable,
  dependency output, environment input, or persistent output prevents reuse.

### R2-F003 — AFFECTED_TEST_INPUT_POPULATION_INCOMPLETE (P1)

The graph's production/test population recognizes package source/scripts and test
TypeScript or MJS files only. Unknown fallback therefore does not see other tracked
runtime and test assets. Dynamic loading detection covers only one variable-import
shape.

- Evidence: `work/rounds/R-0007/affected-test-graph.json:5` and
  `scripts/run-round-close-controls.mjs:3573-3595`.
- Deterministic population query: enumerate every tracked package prompt, template,
  and fixture asset plus every computed module-load syntax; prove each selects a shard
  or full-suite and whole-coverage fallback.
- Complete affected population: 109 tracked non-TypeScript/MJS package assets (four
  CLI JSON fixtures, one effects-check fixture `tsconfig.json`, and 104 skills prompt
  or test-fixture files), plus template-literal imports, `require(expr)`,
  `import.meta.resolve(expr)`, and equivalent computed loader wrappers.
- Repair condition: include all runtime/test assets in graph populations, apply unknown
  detection to every changed tracked path, and use resolver/AST discovery or widen
  every unproved loader to full suite and whole coverage.

### R2-F004 — RECHECKED_TOPIC_EVIDENCE_UNAUTHENTICATED (P1)

An unresolved evidence reference is converted into a deterministic digest of its
reference string and the literal `mechanical-evidence-obligation`; this authenticates
prose rather than evidence bytes or a gate result.

- Evidence: `scripts/run-round-close-controls.mjs:8505`.
- Deterministic population query: regenerate the exact-range topic set, resolve every
  `source_ref` and `required_evidence`, and classify each proof as artifact-backed or
  synthetic.
- Complete affected population: 82 of 83 deterministic topics contain synthetic
  evidence: 10 semantic obligations, 50 changed paths, one active-control topic, six
  current claims, 14 prior defect classes, and one convergence topic. Only candidate
  identity is fully artifact-resolved.
- Repair condition: unresolved evidence forces `BLOCKED` or failure; every disposition
  binds candidate blobs, authenticated runtime artifacts, or independently validated
  task records. A prose/reference digest cannot satisfy evidence authentication.

### R2-F005 — STATE_AND_TRANSPORT_CHAIN_INCOMPLETE (P1)

History validation does not authenticate every predecessor state or recompute every
transition cycle. Persisted transport identity is not compared in full with the
pre-attempt state; persisted result identity and terminal counts are not fully
rechecked; persisted repair evidence is not schema- and v2-link-revalidated when a
state consumes it.

- Evidence: `scripts/run-round-close-controls.mjs:7990-8156`.
- Deterministic population query: mutate and re-self-digest every transition
  cycle/predecessor field, transport identity/state-before field, result
  identity/count field, and repair-v2 link across all allowed edges and attempts.
- Complete affected population: all 12 allowed transition edges and cycle/predecessor
  links; all transport identity fields and attempts; result identity, scope, reviewer,
  census, terminal, and count links; failure state/result/transition/transport,
  candidate manifest/scope, and repair-v2 links.
- Repair condition: independently reconstruct every transition and predecessor state;
  compare every transport field with its exact pre-attempt state; rerun full result
  authentication; schema- and link-validate repair evidence whenever consumed.

### R2-F006 — ACTIVE_CONTROL_CENSUS_ALLOWLIST_INCOMPLETE (P1)

Owner controls still derive from profile `additional_controls`; decision resolution
compares a policy list with itself, hardcodes decision IDs, and digests a policy
materialization rather than the decisions register. Referenced prior-finding sources
are not traversed into the census.

- Evidence: `scripts/run-round-close-controls.mjs:5544-5569`,
  `law/policy/round-close-controls.json:373`, and
  `work/rounds/R-0007/close-control-profile.json:27`.
- Deterministic population query: parse exact-candidate policy, profile, and decision
  provenance transitively; compare resolved identities and raw blob digests with the
  generated census.
- Complete affected population: DII-246, transitive DII-247, DII-248, all applicable
  active Owner mandates, 18 policy schemas, policy/profile/graph/registries,
  declaration when bound, authorization, plan, orchestrator, execution contract, and
  both referenced prior-review manifests.
- Repair condition: remove hardcoded decision IDs and profile allowlist authority;
  traverse structured exact-candidate provenance, digest actual source blobs, emit
  stable unique identities for the full population, and reject unresolved, inactive,
  or extra controls.

### R2-F007 — REVIEWER_BINDING_CENSUS_NOT_CANDIDATE_BOUND (P1)

Reviewer binding defaults to `WORKTREE`; `policy-check` and `status` use that default
and read mutable tracked bytes instead of an explicit exact candidate.

- Evidence: `scripts/run-round-close-controls.mjs:5279`,
  `scripts/run-round-close-controls.mjs:5770`, and
  `scripts/run-round-close-controls.mjs:9246`.
- Deterministic population query: dirty every mandate and profile binding independently
  while HEAD remains unchanged; invoke all binding consumers.
- Complete affected population: `policy-check` and `status` are mutable-worktree-bound;
  `entry-check`, convergence, and candidate proof correctly pass an exact commit.
- Repair condition: eliminate the `WORKTREE` default for authority; every caller passes
  and verifies an explicit candidate SHA, and dirty substitutions cannot change
  resolution.

### R2-F008 — SEMANTIC_OBLIGATION_POPULATION_UNCHECKED (P1)

Policy promises an unregistered-obligation lint, but the Markdown scanner is used only
by the legacy handler. The v5 topic builder consumes the registry without checking
governing mandates and contracts for omissions.

- Evidence: `law/policy/round-close-controls.json:176` and
  `scripts/run-round-close-controls.mjs:2064,7144`.
- Deterministic population query: delete each registry row and introduce an
  unregistered normative requirement in each governing source; regenerate scope.
- Complete affected population: all 10 registered obligations plus unregistered
  requirements in OM-014, OM-015, the execution contract, R-0007 authorization, plan,
  orchestrator, and AGENTS authority.
- Repair condition: bind stable machine-resolvable obligation IDs into authoritative
  sources or execute a v5 unregistered-requirement lint; deleting or adding an
  obligation changes the validated population or fails scope generation.

## Complete topic accounting

The reviewer recorded 41 exactly-once dispositions: 21 `RECHECKED_PASS`, 20
`RECHECKED_FAIL`, zero `REUSED_FRESH_PASS`, and zero `BLOCKED`.

The passing population includes R-0006 hardcoding and byte immutability, unbound
preparation versus sole-reason entry failure, atomic PASS-only cache, stale/malformed/
tampered cache invalidation, remote-full execution, exact-once dispositions,
structured result truncation resistance, current-claim identity, candidate
invalidation, cycle-3 and transport exhaustion, role-pure sequencing, committed rename
preimages, core review-scope identity, affected-execution/cache/downstream schema
alignment, resolved-evidence deduplication, late sequencing, and historical R-0006
assertions.

The failing population maps exactly to R2-F001 through R2-F008 above, including the
still-open Run-1 classes R1-F001, R1-F003, R1-F005, and R1-F006. Run-1 classes R1-F002
and R1-F004 passed their complete rechecks.

## Independently recomputed evidence

- Exact Git candidate, tree, merge-base, range, role/path, mirror, and R-0006
  immutability queries: complete.
- Focused combined control population: 5 files and 153/153 tests passed.
- Preparation policy: PASS.
- Entry: failed solely with `ENTRY_BLOCKED_REVIEWER_UNBOUND`.
- Sequencing: PASS for 90 commits.
- `git diff --check`, action registry, trace, repository references, SHA references,
  workflow checks, and ESLint: PASS.
- Authoritative formatting: FAIL for one file, as R2-F001 records.

## Mandatory transition

The remediation campaign is `ESCALATION_REQUIRED`. OM-015's two substantive review
runs are exhausted. Do not repair these classes or perform review run 3 without a
fresh, separately named Owner-authorized remediation campaign.

R-0007 is **NOT STARTED** and its governed reviewer slot remains unbound. No PR, merge,
deployment, publication, release, evidence promotion, real-stynx mutation, or
predecessor mutation is authorized by this failed campaign.
