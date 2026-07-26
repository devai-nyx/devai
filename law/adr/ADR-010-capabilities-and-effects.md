---
id: ADR-010
title: Declared capabilities and subprocess effects
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-MUTATION-SCENARIOS.md; ADR-EFFECTS content]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor mutation ADR; ex-D-150..158; DII-120
affected_rules:
  - law/policy/subprocess-effects.json
  - law/schemas/subprocess-effects.schema.json
  - law/policy/authority-policy.json
---

# ADR-010. Declared capabilities and subprocess effects

## Status

Accepted and active in R-0003.

## Context

Subprocesses can mutate files, repositories, hosts, or remotes even when the calling
action appears read-only. A declared capability is useful for review but cannot prove
that implementation effects are no broader than declared.

## Decision

Every action declares a capability superset. Build-time and contract-time inference
derives actual direct and transitive effects; inferred effects must be a subset of the
declaration or validation fails closed. Declaring a capability is necessary but never
sufficient authorization for execution.

One Architect-owned, schema-backed subprocess-effects registry is canonical and is
materialized only by the registered upgrade transition. The runtime effect gate executes
after build/contracts establish the resolved graph and before the final adapter effect.
Filesystem path-domain assertions bind the final adapter's canonical target, not merely
router arguments. Consent is derived from resolved effects; for example,
`fs:worktree-admin` implies harness-write consent and cannot be downgraded by a caller.

## Consequences

New subprocesses, wrappers, and transitive effects must be declared and inferred. Broad
declarations remain reviewable but do not authorize a concrete operation. Registry drift
or incomplete inference blocks the action.

## Alternatives Considered

Trusting action names, declarations without inference, router-only path checks, and
caller-selected consent were rejected because subprocess behavior can bypass them.
Inferring effects without an authored ceiling was rejected because it cannot express
intended authority.

## Affected Rules

- `law/policy/subprocess-effects.json`
- `law/schemas/subprocess-effects.schema.json`
- `law/policy/authority-policy.json`
