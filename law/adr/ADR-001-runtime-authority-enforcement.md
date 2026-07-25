---
id: ADR-001
title: Runtime authority enforcement
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-003-runtime-authority-enforcement.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor ADR-003; ex-D-136; DII-120
affected_rules:
  - law/policy/authority-policy.json
  - law/policy/forbidden-actions.json
  - law/policy/glob-guards.json
---

# ADR-001. Runtime authority enforcement

## Status

Accepted and active in R-0003. It supersedes the named predecessor ADR in the successor
namespace; the predecessor file remains historical input, not concurrent law.

## Context

Path authority is a runtime safety property, not a prompt convention. A router-only
check, an implicit role, a caller-selected machine identity, or a replayable decision can
all authorize a different mutation from the one actually performed. CLI-only
enforcement also cannot claim control of editors, shells, or external agents without a
verified host adapter.

## Decision

Every registered mutation is authorized fail-closed against typed, materialized policy
at the final adapter boundary immediately before the effect. The authorization binds the
action, declared human role, trusted machine transition, repository, canonical target,
operation, consent, and current policy/Constitution digests. Decisions are single-use,
non-replayable, and invalid after their bound context changes.

Roles are explicit. Callers cannot select a machine principal or obtain implicit
elevation. Machine identity is derived only by a registered trusted transition. The
runtime reports `cli-only` honestly unless a separately verified host-enforcement
adapter proves a wider boundary.

The mutating-call-site denominator is mechanically derived from the registry and final
adapters. It permits zero unauthorized sites and zero exemptions, and its guard must
demonstrably fail on stale fixtures. Weakening any fail-closed authority property
requires a new Architect decision; changing Articles 6–10 also requires a constitutional
amendment.

## Consequences

All mutation paths pay an explicit authorization cost and fail when policy, identity,
consent, or target resolution is incomplete. New adapters and actions must enter the
derived denominator. External-tool control remains a stated boundary until attested.

## Alternatives Considered

Prompt-only discipline, router-only checks, default roles, reusable approvals, and
caller-supplied machine identities were rejected because each separates authorization
from the actual effect. Exempting “safe” call sites was rejected because exemptions make
the denominator non-total.

## Affected Rules

- `law/policy/authority-policy.json`
- `law/policy/forbidden-actions.json`
- `law/policy/glob-guards.json`
