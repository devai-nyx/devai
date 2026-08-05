---
id: R-0007-PRE-ENTRY-REMEDIATION-1-REVIEW-RUN-1-FAILURE
type: audit
status: current
date: 2026-07-29
authority: Auditor
round: R-0007
---

# Remediation campaign 1 independent review run 1 — failure

## Exact reviewed subject

- Failed predecessor candidate/base:
  `5068e5f5b56dd15cd733c9c5d2663b09b2f43c13`.
- Reviewed candidate: `42ecafda98086ec5d89c738685a342e6a2323299`.
- Reviewed tree: `df166023137b3de9cac569401c64eefb70e61d37`.
- Candidate-only clone: `/tmp/devaii-remediation-review1.8udigx`, clean before and
  after review.
- Reviewed range: 31 commits and 38 changed paths; base ancestry verified.
- Reviewer model: `gpt-5.6-sol`, independent read-only machinery reviewer only.
- Provider provenance: externally orchestrated Codex task; repository machinery does
  not claim provider-signed model provenance.

## Terminal result

`RUN_1_RESULT: FAIL`. The reviewer accounted for every requested changed and unchanged
topic and continued after the first blocker. One P0 and five P1 defect classes remain.
This consumes remediation review run 1 under OM-015. One complete-class repair phase
and one final substantive run 2 remain authorized.

The dependency-free candidate clone could not resolve `ajv` through an external Vitest
runner, so no test result was inferred from that attempt. All findings below are
source-level bypasses and do not depend on that environmental limitation.

## Complete finding population

### R1-F001 — AUTHORITATIVE_GATE_FRESHNESS_KEY_INCOMPLETE (P1)

All 16 authoritative gates use the same narrow semantic-source population. It omits
effective inputs such as Markdown, package manifests, the lockfile, workspace and test
configuration, workflows, generated outputs, and gate-specific tool versions. Cache
records also declare `outputs: []`, so reuse never compares required outputs.

- Evidence: `law/policy/round-close-controls.json:110-135,396-404` and
  `scripts/run-round-close-controls.mjs:3689-3770`.
- Deterministic population query: expand every `convergence.commands` package script,
  enumerate its effective read/write paths and executable versions, and compare them
  with each task's input selectors, dependency keys, toolchain, and outputs.
- Full affected population: formatting, preparation, action-registry, trace,
  repository-references, materializations, diff-check, ordinary, stage1, stage2, t4,
  t5, t6, changesets, coverage, and governance.
- Repair condition: each gate has complete versioned effective-input selectors,
  gate-specific toolchain fingerprints, dependency keys, and required outputs; any
  changed/missing input, tool, dependency, or output forces execution.

### R1-F002 — COMMITTED_RENAME_PREIMAGE_OMITTED (P1)

Committed range planning and review topics use `git diff --name-only`, which retains
only a rename destination. Only worktree changes use status-aware NUL parsing.

- Evidence: `scripts/run-round-close-controls.mjs:3162-3192,3328-3393,5385-5420`.
- Deterministic population query: parse
  `git diff --name-status -z -M --find-renames <base> <candidate>` and match both paths
  from every `R*` record against node, shared-input, coverage, fallback, and review
  selectors.
- Full affected population: governed-to-ungoverned, cross-package, cross-shard,
  shared-to-nonshared, coverage-to-noncoverage renames and every omitted preimage topic.
- Repair condition: committed ranges retain both rename paths and tests prove the union
  of preimage and postimage invalidations and changed-path topics.

### R1-F003 — RECHECKED_TOPIC_EVIDENCE_UNAUTHENTICATED (P1)

For `RECHECKED_PASS`, `RECHECKED_FAIL`, and `BLOCKED`, runtime validation authenticates
only `recomputed_digest`. It does not independently recompute the input manifest,
evidence manifest and digest, task keys, or evidence references as it does for reuse.

- Evidence: `law/schemas/review-result.schema.json:45-104`,
  `scripts/run-round-close-controls.mjs:5763-5770`, and
  `tests/contract/pre-r0007-remediation-1.red.contract.test.ts:865-889`.
- Deterministic population query: independently substitute each proof field for every
  non-reuse disposition, retain valid self-digests, and invoke `review-check`.
- Full affected population: all obligation, changed-path, active-control,
  current-claim, prior-finding, candidate-identity, and convergence topics using a
  non-reuse disposition.
- Repair condition: all dispositions independently recompute exact current inputs,
  evidence, task keys, and evidence references and reject arbitrary or stale proofs.

### R1-F004 — REVIEW_SCOPE_CORE_IDENTITY_NOT_RECOMPUTED (P0)

`review-check` recomputes subordinate digests but does not authenticate the scope's
round, cycle, review candidate, candidate tree, policy version, or previous candidate
manifest digests against the invocation and proof.

- Evidence: `scripts/run-round-close-controls.mjs:5567-5571,5735-5738,5760`.
- Deterministic population query: mutate and re-self-digest each of the six fields in
  an otherwise valid scope, then invoke `review-check` for the original candidate.
- Full affected population: `round`, `cycle`, `review_candidate`, `candidate_tree`,
  `policy_version`, and `previous_candidate_manifest_digests`.
- Repair condition: independently recompute every field; wrong-identity scopes fail
  without consuming a transport attempt or allowing a state transition.

### R1-F005 — STATE_AND_TRANSPORT_CHAIN_INCOMPLETE (P1)

Nonterminal active states are not bound to their matching cycle or canonical history,
the persisted transport artifact is not authenticated by `readAuthenticatedStateV4`,
and a valid result may transition without authenticating prior transport attempts.

- Evidence: `law/policy/round-close-controls.json:280-309` and
  `scripts/run-round-close-controls.mjs:5611-5627,5740-5795`.
- Deterministic population query: cross-product all state enums with cycles 1/2,
  canonical/noncanonical histories, transport attempts 0/1/2, and missing, malformed,
  tampered, or cross-identity transport records through `status`, `review-scope`, and
  `review-check`.
- Full affected population: cycle-1/2 active-state inversions, inconsistent
  `REPAIR_REQUIRED`, active states with unauthenticated attempts, transport-blocked
  states without matching evidence, and result transitions after missing/tampered
  transport.
- Repair condition: schema and runtime bind state/cycle/history; every predecessor
  state, result, transport, and repair digest is authenticated; nonzero attempts and
  transport terminals require the exact persisted chain.

### R1-F006 — ACTIVE_CONTROL_CENSUS_ALLOWLIST_INCOMPLETE (P1)

The generated complete active-control census is only the profile allowlist plus four
round files. It does not derive governing decisions, policy schemas, or structured
registries from the exact candidate tree.

- Evidence: `work/rounds/R-0007/close-control-profile.json:19-25` and
  `scripts/run-round-close-controls.mjs:5386-5387`.
- Deterministic population query: resolve active mandates and decisions plus every
  `policy.schemas` path, graph, registry, and manifest source, then compare the exact
  set and raw-byte digests with the active-control topic.
- Full affected population: DII-246, DII-248, every close-policy schema, the affected
  graph, obligation registry, current-claim registry, and prior-finding registry.
- Repair condition: derive the structured candidate-tree population, fail unresolved,
  duplicate, or inactive controls, and bind the complete exact set and byte digests.

## Mandatory transition

Repair all six classes together. Freeze a distinct candidate and perform one complete
run 2. A run-2 failure returns to `ESCALATION_REQUIRED`; a third remediation review is
forbidden without fresh Owner authority.

R-0007 is **NOT STARTED** and its governed reviewer slot remains unbound. No deployment,
publication, release, evidence promotion, real-stynx mutation, or predecessor mutation
is authorized.
