---
id: ADR-019
title: R-0005 reviewed lifecycle and sensor authority
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: [ADR-017; ADR-018]
superseded_by: null
provenance:
  - ADR-017; ADR-018; R-0005; KR-R5-017 through KR-R5-028
affected_rules:
  - .github/workflows/reusable-evidence-gate.yml
  - law/schemas/common-defs.schema.json
  - law/policy/governed-sequencing.json
  - packages/cli/src/authority/sense-run-child.ts
  - packages/cli/src/command-router.ts
  - packages/evidence/src/evidence/verb-evidence.ts
  - packages/evidence/src/local-evidence/subject.ts
  - packages/evidence/src/local-evidence/verify.ts
  - packages/loop/src/loop/worktrees.ts
  - packages/loop/src/round-lifecycle/index.ts
  - packages/skills/src/post-merge-auditor/index.ts
  - packages/skills/src/forbidden-actions/index.ts
  - packages/skills/src/prompt-firewall/index.ts
  - scripts/check-governed-sequencing.mjs
  - scripts/detect-conditional-skips.mjs
---

# ADR-019. R-0005 reviewed lifecycle and sensor authority

## Status

Accepted and active in R-0005. This record is the complete active successor to the
sealed ADR-017 and ADR-018 decisions.

## Context

R-0005's independent review and exit ladder exposed gaps in destructive-worktree
containment, round lifecycle, evidence identity, legacy proof writers, prompt scope,
post-merge attribution, governed sequencing, conditional-skip detection, CI association,
coverage-safe child planning, protected-path classification, and single-sensor authority.
ADR-017 governed the first repair set. ADR-018 separately governed the final read-only
sensor projection. An invalid intermediate edit to sealed ADR-017 was restored; this
canonical supersession preserves both historical bodies and supplies one active rule set.

## Decision

All bounded repair decisions and nonclaims in ADR-017 remain in force through this
successor: managed cleanup validates exact registered containment; declared rounds
round-trip and close idempotently; local evidence binds a source snapshot plus an exact
manifest-only trailer; legacy aggregate-chain writers fail closed; prompt exceptions
are exact; post-merge products are Auditor-attributable; sequencing binds exact prior
law and observed red evidence; conditional skips are syntax-detected; CI paths require
active ADR association; and child-authority tests use a pure production boundary without
weakening coverage.

ADR-018's bounded projection also remains in force. A public
`sense run <registered-kind>` invocation is non-mutating only when its exact generated
action-registry binding has `read` effects and no write or publish consent is present.
Presets, SWEEP, unknown or archived kinds, missing or divergent bindings, and non-read
children retain the parent `harness-write` authority contract.

## Consequences

The reviewed lifecycle corrections have a single active ADR association. Read-only CI
sensors can execute without fabricated role declarations while all proof-writing paths
remain authority-bound. The invalid intermediate ADR edit stays visible in history and
is repaired only through the permitted terminal transition.

## Alternatives Considered

History rewriting, silently restoring ADR-017 as active, mutating ADR-018 after sealing,
passing static human roles in CI, weakening the parent action, or dropping reviewed
corrections from the active rule set were rejected.

## Affected Rules

The authoritative affected-rule list is the exact `affected_rules` frontmatter above.
