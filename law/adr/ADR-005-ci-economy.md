---
id: ADR-005
title: CI economy
type: adr
status: superseded
date: 2026-07-25
authority: Architect
supersedes: [ADR-CI-ECONOMY.md]
superseded_by: ADR-013
provenance:
  - REV-0003 disposition map; predecessor ADR-CI-ECONOMY; ex-D-115..117; DII-120
affected_rules:
  - law/schemas/local-evidence-manifest.schema.json
  - law/policy/forbidden-actions.json
  - .github/workflows/reusable-evidence-gate.yml
---

# ADR-005. CI economy

## Status

Accepted and active in R-0003.

## Context

CI cost can be reduced only without weakening hard authority, provenance, or safety
rules. A reusable gate that silently opens when evidence is missing would turn economy
into an authorization bypass.

## Decision

CI rules are classified as hard or advisory. Hard rules include authority, protected
paths, evidence integrity, required source checks, and forbidden actions; profiles may
not disable them. Gate-staged profile conditioning may downgrade only the explicitly
registered advisory rule 4.

Local evidence reuse uses the canonical manifest schema and separate collect and verify
verbs. Verification binds hashes, commands, environment, repository/tree identity,
freshness, and the profile that produced the evidence. Pull-request events never enter
evidence mode. Missing, malformed, stale, or mismatched evidence closes the reusable
gate and requires ordinary execution. The forbidden-path floor is monotonic: local or
profile configuration may add protection but never remove the framework minimum.

## Consequences

Fast paths remain explainable and fail closed. Maintainers can distinguish an advisory
cost optimization from a hard safety contract, and every reused result is traceable to
the exact producing context.

## Alternatives Considered

Skipping all expensive jobs, allowing profiles to redefine hard rules, treating missing
evidence as success, and accepting PR-produced local manifests were rejected as silent
gate weakening. Running every advisory check everywhere was rejected because staged
economy can preserve the hard floor.

## Affected Rules

- `law/schemas/local-evidence-manifest.schema.json`
- `law/policy/forbidden-actions.json`
- `.github/workflows/reusable-evidence-gate.yml`
