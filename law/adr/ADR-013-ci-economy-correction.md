---
id: ADR-013
title: CI economy workflow correction
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-005]
superseded_by: null
provenance:
  - DII-149; DII-152; BL-122; BL-128; ADR-005 sealed source; R-0003 Opus review
affected_rules:
  - law/schemas/local-evidence-manifest.schema.json
  - law/policy/forbidden-actions.json
  - .github/workflows/ci.yml
  - .github/workflows/round-gates.yml
---

# ADR-013. CI economy workflow correction

## Status

Accepted and active through DII-153. Supersedes ADR-005 solely to correct live workflow
bindings after seal.

## Context

CI cost can be reduced only without weakening hard authority, provenance, or safety
rules. ADR-005 established that doctrine but bound it to a predecessor workflow path
that does not exist in this repository. Its active seal prevents editing that body.

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

The live workflow bindings for this repository are `.github/workflows/ci.yml` and
`.github/workflows/round-gates.yml`.

## Consequences

Fast paths remain explainable and fail closed. Maintainers can distinguish an advisory
cost optimization from a hard safety contract, every reused result is traceable to the
exact producing context, and the ADR points to workflows that actually exist.

## Alternatives Considered

Mutating sealed ADR-005 was rejected because active ADR bodies are immutable. Leaving
the nonexistent workflow binding active was rejected because it would misstate the
governed implementation. Weakening the CI doctrine was rejected because the correction
is limited to repository-local workflow bindings.

## Affected Rules

- `law/schemas/local-evidence-manifest.schema.json`
- `law/policy/forbidden-actions.json`
- `.github/workflows/ci.yml`
- `.github/workflows/round-gates.yml`
