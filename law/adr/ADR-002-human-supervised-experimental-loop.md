---
id: ADR-002
title: Human-supervised baseline and the experimental loop
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-HUMAN-SUPERVISED-EXPERIMENTAL-LOOP.md; ADR-001-autonomous-loop.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor supervised/autonomous ADRs; ex-D-126; DII-120
affected_rules:
  - law/policy/authority-policy.json
  - law/policy/forbidden-actions.json
---

# ADR-002. Human-supervised baseline and the experimental loop

## Status

Accepted and active in R-0003. The predecessor autonomous-loop design is preserved only
as historical direction; it does not define the supported operating mode.

## Context

DEVAI is a human-directed harness. Conflating constrained tooling with an autonomous
controller would inflate both authority and readiness claims. Research on bounded
automation remains useful only when it cannot silently become the production default.

## Decision

Humans or explicitly operated external agents choose and actuate supported work; DEVAI
constrains, observes, and records it. DEVAI does not invent, dequeue, modify, merge, or
publish work on its own in the supported mode.

An experimental controller requires three simultaneous opt-ins: enabled F5 feature
policy, an explicit `--experimental` invocation, and explicit write consent. Ordinary
authority, capability, evidence, iteration, and publication gates remain in force.
Experimental outputs and observations are labeled experimental and never establish
supported readiness. Terminal outcomes preserve branches, worktrees, evidence, and
recovery instructions; they do not discard recoverable work.

## Consequences

The supported product boundary stays small and auditable. Experimental automation can be
measured without inheriting production claims, and every transition back to supported
operation is deliberate.

## Alternatives Considered

Default autonomy, a single feature flag, and treating experimental success as supported
evidence were rejected because they erase human initiation or evidence provenance. A
total ban on experiments was rejected because bounded research is compatible with the
constitutional boundary.

## Affected Rules

- `law/policy/authority-policy.json`
- `law/policy/forbidden-actions.json`
