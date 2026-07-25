---
id: ADR-004
title: Independent completion evidence
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-006-independent-completion-evidence.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor ADR-006; Constitution Article 42; DII-120
affected_rules:
  - law/schemas/evidence.schema.json
  - law/schemas/agent-run.schema.json
  - law/schemas/phase-closure.schema.json
---

# ADR-004. Independent completion evidence

## Status

Accepted and active in R-0003. Historical predecessor campaign ledgers remain cited
history and are not copied into successor standing.

## Context

A worker's claim that its own task completed is not independent evidence. Validation can
also be vacuous when a strategy observes no meaningful target, shares the worker's
mutable state, or cannot prove the expected change boundary.

## Decision

Completion separates an untrusted witness from an independent validator. Every accepted
validation strategy is typed, non-vacuous, binds exact inputs and outcomes, and runs in a
container- or worktree-scoped isolation boundary appropriate to its effects. Recovery
leases prevent abandoned validators from holding resources indefinitely. Frame checks
bind repository, tree, task, strategy, and expected-diff manifest before judgment.

The mutating-skill population is mechanically derived, not maintained by a hand-curated
allowlist. Expected-diff manifests enumerate authorized result paths and reject missing
or extra mutation. Judge-only or otherwise independently uncheckable evidence never
establishes readiness. An Auditor closeout must state both that no readiness claim rests
solely on uncheckable evidence and that the campaign makes no readiness or autonomy
claim unless separately earned.

Mutation-strength obligations beyond the current strategies and cross-strategy
aggregation semantics remain separate future decisions; absence of those decisions
cannot be represented as a PASS.

## Consequences

Completion costs an independent observation and explicit frame. Unavailable validation
is an observation failure, never a verdict. Recovery and expected-diff evidence remain
inspectable after failure.

## Alternatives Considered

Worker self-attestation, semantic judge output as sole proof, shared mutable validation,
and empty-success strategies were rejected as independently uncheckable. Treating all
unimplemented strategies as failure was rejected in favor of explicit unknown or
unavailable observation without a readiness claim.

## Affected Rules

- `law/schemas/evidence.schema.json`
- `law/schemas/agent-run.schema.json`
- `law/schemas/phase-closure.schema.json`
