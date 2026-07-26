---
id: ADR-014
title: CI checker ADR association
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: []
superseded_by: null
provenance:
  - DII-171; DII-174; BL-151; BL-154; R-0004-OPUS-CLOSE-REVIEW-FAILURE; R-0004-CORRECTED-CANDIDATE-GOVERNANCE-FAILURE
affected_rules:
  - scripts/check-workflows.mjs
  - packages/skills/src/forbidden-actions/index.ts
  - law/policy/forbidden-actions.json
---

# ADR-014. CI checker ADR association

## Status

Accepted and active through DII-175.

## Context

The first R-0004 exact-candidate review found that the production workflow checker did
not validate every remote action reference. DII-171 and BL-151 authorized the bounded
repair, but the strict `FORBID-CI-WITHOUT-ADR` gate correctly found that the checker
path itself had no explicit active ADR association. The existing scanner recognizes the
path syntactically but cannot distinguish a governed checker repair from an ungoverned
gate change.

## Decision

Every remote workflow `uses:` entry must carry a 40-hex immutable commit SHA and a
readable version comment. Repository-local reusable workflow paths remain allowed and
need no remote version comment. The checker must inspect every workflow file tracked by
the repository rather than depend on a release workflow being present.

For `FORBID-CI-WITHOUT-ADR`, a changed CI path is covered only when at least one active
numbered successor ADR lists that exact repository-relative path in `affected_rules`.
The association is derived from parsed frontmatter, not prose or commit-message claims.
Missing, malformed, superseded, or unrelated ADRs do not cover the change. Exact-commit
waivers are not part of this decision.

## Consequences

The workflow checker repair is machine-associated with architectural authority, and the
same scanner remains fail-closed for future unbound CI changes. CI policy can evolve
without treating the mere existence of any ADR as sufficient authorization.

## Alternatives Considered

An exact-commit waiver was rejected because it would hide rather than repair the absent
association. Treating DII-171 prose as an ADR was rejected because the forbidden rule
requires an ADR artifact. Allowing all Engineer CI changes was rejected because role
identity alone does not establish architectural authorization.

## Affected Rules

- `scripts/check-workflows.mjs`
- `packages/skills/src/forbidden-actions/index.ts`
- `law/policy/forbidden-actions.json`
