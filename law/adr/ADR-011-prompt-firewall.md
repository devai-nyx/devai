---
id: ADR-011
title: Prompt firewall
type: adr
status: superseded
date: 2026-07-25
authority: Architect
supersedes: [ADR-FIREWALL-OVERLAPS-GLOB-AWARE.md; ADR-FIX-SKILL-AUTOFIX-FIREWALL-EXEMPTION.md]
superseded_by: ADR-016
provenance:
  - REV-0003 disposition map; predecessor firewall ADRs; DII-120
affected_rules:
  - law/policy/forbidden-actions.json
  - law/policy/glob-guards.json
  - law/schemas/prompt-composition.schema.json
---

# ADR-011. Prompt firewall

## Status

Accepted and active in R-0003.

## Context

Prompt composition can ask an agent to write outside its discipline even when runtime
authority later blocks the effect. Early detection improves safety and gives precise
review feedback, but it must not be mistaken for the final runtime boundary.

## Decision

The prompt firewall compares the composed agent class, permission tier, and declared
write scopes with the static constitutional path-prefix table, including `law/` and
`record/`. It rejects reserved-path conflicts and material glob overlaps before a prompt
is dispatched. Overlap checks remain load-bearing for extension and nested scopes even
though core authority uses static prefixes.

A registered fix-skill may describe an autofix only within its already authorized target
scope; that narrow classification prevents diagnostic wording from being treated as an
independent cross-role write request. It never exempts the eventual mutation from final
adapter authority, effect, consent, or expected-diff enforcement.

## Consequences

Unsafe prompt intent fails early and deterministically. Runtime authority remains the
decisive control, and extension globs cannot shadow reserved roots.

## Alternatives Considered

Relying only on runtime denial, substring matching, blanket rejection of all autofix
language, and granting fix skills a firewall bypass were rejected as either too late,
imprecise, or unsafe. Removing overlap analysis was rejected because additive extension
scopes still use globs.

## Affected Rules

- `law/policy/forbidden-actions.json`
- `law/policy/glob-guards.json`
- `law/schemas/prompt-composition.schema.json`
