---
id: ADR-018
title: Single-sensor read authority projection
type: adr
status: superseded
date: 2026-07-26
authority: Architect
supersedes: [DII-202; DII-203]
superseded_by: ADR-019
provenance:
  - R-0005; KR-R5-028; ADR-017
affected_rules:
  - packages/cli/src/command-router.ts
---

# ADR-018. Single-sensor read authority projection

## Status

Accepted and active in R-0005. This record governs only the command-boundary mismatch
exposed by the strict governance ladder after the independent-review repair batch.

## Context

The public `sense run` action is correctly classified as `harness-write` because presets
and SWEEP may create proof epochs. The command router also supports
`sense run <registered-kind>` as a compatibility projection to one internal sensor.
That bounded form was still authorized as the write-capable parent even when the exact
registry-derived child was read-only, so deterministic CI readings failed before
dispatch with `AUTHORITY_DECLARATION_MISSING`.

## Decision

A public `sense run <registered-kind>` invocation is non-mutating only when its exact
generated action-registry binding has `read` effects and the invocation carries no
write or publish consent. The bounded single-sensor projection may use the read
authority boundary. Presets, SWEEP, unknown or archived kinds, missing or divergent
bindings, and every non-read child retain the parent `harness-write` authority contract.

The projection derives both kind and effect from generated governed registries. It does
not maintain an independent allowlist and does not weaken aggregate proof authority.

## Consequences

Read-only CI sensors execute without fabricated human declarations. Write-capable
aggregate and child behavior remains fail-closed. Registry drift also fails closed.

## Alternatives Considered

Passing a static human role in CI, classifying every single sensor as read-only, or
weakening the parent action effect were rejected because each would misstate or bypass
the governed authority contract.

## Affected Rules

The authoritative affected-rule list is the exact `affected_rules` frontmatter above.
