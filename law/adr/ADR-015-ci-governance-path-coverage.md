---
id: ADR-015
title: CI governance path coverage
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: [ADR-014]
superseded_by: null
provenance:
  - DII-176; DII-177; DII-178; BL-154; BL-155; ADR-014 sealed source; R-0004-ADR-SEAL-GOVERNANCE-FAILURE
affected_rules:
  - scripts/check-workflows.mjs
  - scripts/run-ci-stages.mjs
  - packages/skills/src/forbidden-actions/index.ts
  - law/policy/forbidden-actions.json
  - law/schemas/local-evidence-manifest.schema.json
  - .github/workflows/ci.yml
  - .github/workflows/round-gates.yml
---

# ADR-015. CI governance path coverage

## Status

Accepted and active through DII-178. Supersedes ADR-014 after preserving its sealed
body through a terminal lifecycle transition.

## Context

ADR-013 established fail-closed CI economy and live workflow bindings. ADR-014 added
exact active-ADR association for the workflow checker, but its sealed
`affected_rules` projection omitted the CI-stage runner and both live workflow paths.
Those omissions cannot be repaired by editing an active sealed body.

## Decision

CI rules remain classified as hard or advisory. Authority, protected paths, evidence
integrity, required source checks, and forbidden actions are hard and cannot be disabled
by profiles. Evidence reuse remains fail-closed, binds canonical manifest, hash,
command, environment, repository/tree, freshness, and producing-profile evidence, and
never applies to pull-request events.

Every remote workflow `uses:` entry must carry a 40-hex immutable commit SHA and a
readable version comment. Repository-local reusable workflow paths remain allowed. The
checker inspects every tracked workflow, independent of a release workflow's presence.

For `FORBID-CI-WITHOUT-ADR`, a changed CI path is covered only when at least one active
numbered successor ADR lists that exact repository-relative path in `affected_rules`.
Association derives from parsed frontmatter. Missing, malformed, superseded, or
unrelated ADRs do not cover a change. Exact-commit waivers are excluded.

The complete active path set is the two live workflows, the CI-stage runner, the
workflow checker, the forbidden-action scanner and policy, and the local-evidence
manifest schema named in this record's frontmatter.

## Consequences

Historical CI changes are associated with the active architectural rule without an
author-only bypass, and future unbound changes remain findings. ADR-014 becomes
terminally superseded without altering its sealed body.

## Alternatives Considered

Editing ADR-014 after seal and exact-commit waivers were rejected. Treating any ADR as
sufficient was rejected because it would not prove path-specific authority. Dropping
the CI-stage runner or workflows from coverage was rejected because they are governed
parts of the same hard gate.

## Affected Rules

- `scripts/check-workflows.mjs`
- `scripts/run-ci-stages.mjs`
- `packages/skills/src/forbidden-actions/index.ts`
- `law/policy/forbidden-actions.json`
- `law/schemas/local-evidence-manifest.schema.json`
- `.github/workflows/ci.yml`
- `.github/workflows/round-gates.yml`
