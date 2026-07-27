---
id: R-0005-ENTRY-INVENTORY
title: R-0005 evidence and lifecycle entry inventory
type: round-entry-inventory
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance: [R-0005-AUTHORIZATION; R-0005-PLAN; OM-002; OM-009; DII-201; PC-0005]
---

# R-0005 entry inventory

## Exact entry state

R-0005 opens from successor `origin/main` commit
`e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190`, the merge of PC-0005. The final-main
workflow at that commit completed all nine required jobs successfully. The predecessor
remains read-only, clean, and pinned at
`d76cd12d2241a1a28a32a0fe629c6531da7fe74d`.

The round executes in `.devai/worktrees/WT-R0005-evidence-lifecycle`. At entry, the
shared test floor reports 127 files, 1,171 passing tests, and eight declared skips.
Those green tests characterize the pre-R-0005 behavior; they do not prove the deferred
R-0005 contracts.

## Authoritative source census

| Surface                      | Authoritative entry sources                                                                                                                                                                       | Entry observation and required disposition                                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence chain               | `packages/evidence/src/evidence/chain.ts`, `packages/evidence/src/evidence/verb-evidence.ts`, `packages/cli/src/commands/evidence/*`, `law/schemas/evidence.schema.json`                          | One mutable JSON object at `record/proofs/chain.json` stores `head` plus `records`. R-0005 replaces this as the canonical proof path with per-round/per-kind JSONL epochs while retaining explicit compatibility only where governed.                       |
| Machine proof writers        | verb evidence hooks, `packages/cli/src/commands/govern/phase-close.ts`, sensor writers, actions-run evidence, and package-specific recorders under `packages/**`                                  | Every canonical proof mutation must pass a validated machine verb. No human-role batch may hand-author `record/`.                                                                                                                                           |
| Proof consumers              | chain verify/head commands, verb hooks, phase-close and phase-ledger commands, score computation, local-evidence verification, CI scripts/workflows, and contract/integration tests               | Consumers must agree on epoch paths, terminal heads, failure semantics, and compatibility boundaries. A second implicit chain source is forbidden.                                                                                                          |
| Local evidence               | `law/schemas/local-evidence-manifest.schema.json`, `packages/evidence/src/local-evidence/{config,source-hash,collect,verify,actions-run}.ts`, package exports, CLI commands, and workflow callers | Collection and verification exist, but reusable standing is not yet authorized. R-0005 binds producer and verifier to exact source hashes, required jobs, freshness, and exact subject; caller-selected evidence fails closed.                              |
| SWEEP                        | `law/policy/sensor-registry.json`, sensor runners under `packages/sensors`, scorecard/loop consumers, and sense/score CLI commands                                                                | The registry has 59 live entries and all 59 declare `SWEEP`. R-0005 must execute or honestly block every live SWEEP sensor and persist each result through the canonical writer.                                                                            |
| Prompt overlays              | skill manifests/adapters, `packages/skills/src/prompt-firewall/index.ts`, the `policy check prompt overlays` CLI path, and prompt-firewall tests                                                  | The bootstrap recorded 27 governed findings. R-0005 must record the bounded overlay rule and reach zero only for compliant composition; authority inversion remains a hard failure.                                                                         |
| Round lifecycle              | `packages/loop/src/round-lifecycle/index.ts`, `packages/cli/src/commands/round/lifecycle.ts`, phase-close records, and lifecycle tests                                                            | The current archive path moves intent and reads `record/proofs/closures`. R-0005 replaces it with append-in-place three-tree closure and the canonical `record/proofs/compliance/closures` contract.                                                        |
| Worktree lifecycle           | `packages/loop/src/loop/worktrees.ts`, worktree CLI commands, post-merge Auditor skill, registry state, runbooks, and tests                                                                       | Runtime still contains `scratch/worktrees` assumptions. Managed creation, adoption, listing, destruction, reaping, and post-merge observation must converge on `.devai/worktrees`; registry state remains under `.devai/state`.                             |
| Runtime boundaries           | `.gitignore`, `.devai/config/`, `.devai/pin/`, `.devai/state/.gitkeep`, `.devai/worktrees/.gitkeep`, initialization/scaffold paths, and ignore-boundary tests                                     | Config and pin are committed authorized materializations. State and worktree contents are ignored runtime data except for tracked sentinels. Cleanup may not delete committed material or unrelated human worktrees.                                        |
| Invariant anchor             | `law/schemas/invariant.schema.json`, all `law/invariants/*.json`, trace schemas and records, schema/spec validators, sensors, CLI validation, generators, and tests                               | All 34 invariant records use the legacy anchor-docs field `authority`; none uses `authority_docs`. Record metadata named `authority` is a different semantic field and is not renamed. Migration must be total across the anchor object and every consumer. |
| Prospective sequencing       | decision/commit range readers, governance and role-purity checks, red-first records, and the R-0002 disclosed exceptions                                                                          | No mechanical prospective law-first/red-first ledger guard closes BL-106. R-0005 must detect an implementation before its governing semantics or failing Inspector contract, while preserving immutable historical exceptions as disclosures.               |
| Documentation reconciliation | active decision descriptions, R-0002/R-0004 as-built maps, entry/exit measurements, and current audit pointers                                                                                    | BL-176 and BL-177 require commit-scoped historical wording, unambiguous base-versus-exit totals, and complete governed repair-cycle maps without rewriting immutable evidence.                                                                              |
| Anti-skip guard              | R-0004 anti-skip contract, governed test source trees, Vitest configuration, and declared-skip ledger                                                                                             | BL-178 requires scanning test sources where build-conditional skips can occur, rejecting undeclared additions while preserving the exact eight declared skips.                                                                                              |

## No-hidden-source declaration

The table above is the B0 mutation and consumption map. Later discovery of another
writer, consumer, lifecycle path, worktree root, invariant-anchor consumer, or sequence
ledger is a stop-and-amend event: the Architect must add it here before implementation
continues. Generated indexes may project these sources but may not become authority.

## Entry known-red posture

The entry floor is green because the deferred contracts are not yet fully executable.
B2 must first add focused failing Inspector contracts for proof-epoch integrity, SWEEP
totality, local-evidence trust boundaries, prompt overlays, clean observation, invariant
anchor totality, three-tree/worktree lifecycle, prospective sequencing, and anti-skip
source binding. A known-red declaration must name the exact failures and backlog items;
unrelated regression remains a stop.

## Standing ceiling

R-0005 may prove only that the evidence and lifecycle machinery is implemented and
tested. It may not claim evidence reuse, promotion, release readiness, package
publication, a tag, a GitHub Release, Pages deployment, external deployment,
real-stynx mutation, R-0008 external action, R-0009 activation, or R-0010 observation.
The independent Codex review authorized by OM-009 is reported as such and cannot be
represented as a Claude, Opus, or cross-provider review.
