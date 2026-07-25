---
id: ADR-012
title: Round execution semantics
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-ROUND-EXECUTE-SEMANTICS.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor round ADR; Constitution Article 42; DII-117; DII-120
affected_rules:
  - work/rounds/EXECUTION-CONTRACT.md
  - law/schemas/phase-closure.schema.json
  - law/policy/population-registry.json
---

# ADR-012. Round execution semantics

## Status

Accepted and active in R-0003.

## Context

A round combines authored intent, role-separated execution, independent observation,
remote integration, and machine closure. Treating a plan edit or source merge alone as
closure loses the exact proof boundary and can collide with historical numbering.

## Decision

Successor rounds use `R-NNNN` identifiers. Canonical plans and prompts live under
`work/rounds/R-NNNN/`; plan changes append dated amendments rather than rewriting
historical intent. Auditor observations live under `work/audit/R-NNNN/` and carry no
authority over the reference signal.

Execution is serial by authorized round and role-pure by path. Source changes merge only
after the exact candidate passes local gates, independent review where required, and
exact-SHA remote CI. A separate post-merge machine verb appends the immutable phase
closure record binding the source merge, declaration, closing decision, gate results,
validation criteria, release disposition, and proofs epoch. The closure-only PR and its
final exact-main CI complete the round.

Population and doctor checks prevent twin numbering, missing round records, reused
closure IDs, or a closure whose round identity disagrees with its governed plan.

## Consequences

Source integration and compliance closure remain distinct, inspectable events. Historical
plans are stable, corrections append, and an incomplete ceremony cannot claim closure.

## Alternatives Considered

Editing plans in place, combining source and closure in one self-referential commit,
closing from local CI, and carrying predecessor round numbers into the successor were
rejected because they weaken chronology or identity.

## Affected Rules

- `work/rounds/EXECUTION-CONTRACT.md`
- `law/schemas/phase-closure.schema.json`
- `law/policy/population-registry.json`
