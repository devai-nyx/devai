---
id: ADR-003
title: Actions-run evidence promotion
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-005-actions-run-evidence-promotion.md; D-164/D-165 boundary set]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor ADR-005; ex-D-164; ex-D-165; GEN-0001; DII-120
affected_rules:
  - law/schemas/actions-evidence-gate-authorization.schema.json
  - law/schemas/local-evidence-manifest.schema.json
  - law/schemas/release-control.schema.json
---

# ADR-003. Actions-run evidence promotion

## Status

The mechanism is accepted and active. Its historical graduation standing is void and
must be re-earned in the successor; ratifying this ADR does not promote any evidence.

## Context

CI may reuse qualifying local evidence only when the reuse decision is independently
checkable and cannot self-authorize from the proposed head. The predecessor mechanism is
lawful design input, but its soak, streak, and graduation standing did not cross genesis.

## Decision

There is one evidence-promotion authority. A promotion authorization binds an exact
two-parent merge identity, eligible inputs, bounded reuse interval, validation outcomes,
and fail-closed disposition. Authorization is read only from the canonical record in the
first parent using `git show <base-sha>:<path>`; a head-only record cannot authorize its
own change. Missing, malformed, stale, revoked, or inapplicable authorization requires
full execution.

Source pull requests always run the full required checks. Revocation, including explicit
revocation or malformed authorization, restores full execution until a new complete
green streak satisfies the inlined thresholds. The weekly graduation conjunct runs with
promotion ignored. Required-check aggregation may not translate unjustified skips,
freshness failures, or unavailable observations into green.

No actor may manufacture pushes or dispatches to advance a soak or graduation window.
Promotion does not alter branch protection, review requirements, source-PR execution,
release authorization, publication consent, authority policy, security scanning, or the
meaning of any underlying sensor.

## Consequences

Evidence reuse is cheaper only after independently re-earned standing. Any ambiguity
falls back to full execution, and the successor begins with no promoted streak.

## Alternatives Considered

Head-authored authorization, one-parent assumptions, partial-success aggregation,
manual soak advancement, and inherited predecessor standing were rejected because they
permit self-certification or evidence laundering. Permanent prohibition was rejected
because bounded, independently validated reuse can preserve meaning.

## Affected Rules

- `law/schemas/actions-evidence-gate-authorization.schema.json`
- `law/schemas/local-evidence-manifest.schema.json`
- `law/schemas/release-control.schema.json`
