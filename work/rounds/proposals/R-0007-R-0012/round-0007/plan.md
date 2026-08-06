---
id: R-0007-PROPOSED-RESEQUENCED-PLAN
title: CLI contract, round-subordinate tasks, and executor substrate
type: temporary-round-plan
status: draft-non-authoritative
date: 2026-08-02
source: work/rounds/R-0007
---

# R-0007 — CLI contract and executor substrate

## Objective

Use the pre-RC window to replace the oversized public CLI with seven workflow domains,
make tasks explicitly subordinate to rounds, and introduce executor-neutral task contracts
for deterministic routines, agents, humans, and composites. Stabilize canonical policies
and generated references needed by later convergence, documentation, and release rounds.

This round does **not** produce the full narrative user-documentation corpus. It produces
canonical registries, policy descriptors, schemas, machine reference data, and minimal
operator/migration guidance. Complete user-facing documentation moves to R-0009.

## Product setpoints

- Default domains: `init`, `doctor`, `check`, `sense`, `round`, `evidence`, `release`.
- `task` and `catalog` remain hidden plumbing; ordinary execution uses `round run`.
- Vocabulary: `suite`, `preset`, `kind`, `slice`, `tier`.
- `init apply harness` replaces `init apply f5`.
- Remote consent is `--write --publish`; publish never implies write.
- Sense presets: `baseline`, `structural`, `governed`, `sweep`.
- Check suites: `quick`, `standard`, `full`, `release`.
- Every new task has one `round_id` and one executor: `routine`, `agent`, `human`, or
  `composite`.
- Agent selection is `exact`, explicit allowlisted `preferred`, or named/versioned
  `policy`; no implicit fallback.
- Runtime/model/effort availability lives in an Architect-owned registry, not schema enums.
- Executor selection never grants authority; discipline/effect policy remains authoritative.

## Entry gates

- R-0006 is merged, closed, and green under the then-current execution contract.
- A new Owner mandate explicitly grants this breaking pre-RC scope and rebinds R-0007.
- Live registry/surface/version/publication state is re-derived; temporary counts are not law.
- Exact live base and DII identifier are unbound until entry.
- Predecessor checkout remains read-only; coverage floors remain 70/60/70/70.

## Batches

| Batch | Role                     | Work                                                                                                                                                       | Gate                              |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| B0    | Owner + Auditor          | Record grant; inventory action identities, consumers, effects, schemas, task records, models, and publication state                                        | exact baseline; no implementation |
| B1    | Inspector                | Red contracts for help, migration totality, vocabulary, suite/preset membership, round containment, executor union, routing, effects, and output envelopes | complete admitted defects red     |
| B2    | Architect                | Decide CLI IA, registry dispositions, task/executor/evidence schemas, suite/preset policy, model/runtime registry, and migration contract                  | one canonical meaning per term    |
| B3A   | Engineer                 | Implement executor substrate, registry resolver, four adapters/boundaries, legacy refusal, requested/resolved evidence                                     | no fallback or authority widening |
| B3B   | Engineer                 | Implement router/help and seven façades; keep task/catalog hidden                                                                                          | source/generated/binary parity    |
| B4    | Inspector                | Exhaust retained/folded/tombstoned routes, executor modes, effects, aggregates, and standalone behavior                                                    | no silent skips                   |
| B5    | Architect                | Produce canonical machine reference data and minimal migration/operator material consumed by R-0009                                                        | no duplicated mutable enumeration |
| B6    | Auditor + reviewer       | Audit complete populations, converge twice, independently review exact candidate                                                                           | every topic dispositioned         |
| B7    | Architect + machine verb | Close through then-authorized ceremony                                                                                                                     | no release or deployment claim    |

## Required contracts

- Every historical runnable identity has exactly one keep/fold/tombstone disposition,
  recomputed from the migration fixture.
- Legacy tasks cannot execute until explicitly mapped to round and executor; no inference
  from model tier, tags, prompt, prior run, or worktree.
- `routine` uses registered action or shell-free argv; `agent` binds roster/model/effort;
  `human` binds role and completion evidence; `composite` has same-round acyclic children.
- Requested executor data is immutable. Separate evidence records actual resolution,
  adapter/tool versions, prompt/input/output digests, fallback decision, usage, verdict,
  and references.
- Suite/preset membership and every enumerable category come from canonical machine policy.

## Acceptance

- Default help exposes exactly seven domains and hides task/catalog.
- All routes and migrations are total and fail closed.
- Every task belongs to exactly one round and has exactly one valid executor.
- Deterministic routines need no LLM; exact never substitutes; preferred uses only its
  explicit order; policy uses only a named/versioned router.
- Effects and consent are truthful, especially database migration and remote publication.
- Canonical suite/preset/model/runtime descriptors are deterministic and complete.
- Full tests, all tier gates, coverage floors, generated-view parity, and two-pass
  convergence are green.

## Stops and claim ceiling

Stop on missing authority, published 1.0/RC evidence, role impurity, guessed counts,
implicit task independence/fallback, unrostered model, executor-derived authority,
under-declared effects, predecessor mutation, test weakening, generated drift, or external
publication. Completion claims only a stabilized pre-RC CLI/executor contract; it does not
claim complete user documentation, release, deployment, or evidence promotion.
