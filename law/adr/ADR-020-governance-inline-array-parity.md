---
id: ADR-020
title: Governance inline-array parser parity
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: [DII-203]
superseded_by: null
provenance:
  - R-0005; KR-R5-029; ADR-019
affected_rules:
  - packages/loop/src/governance-ledger/index.ts
---

# ADR-020. Governance inline-array parser parity

## Status

Accepted and active in R-0005. This record governs only parser parity for sealed
decision history and supersession links.

## Context

The ADR validator accepts repository-established semicolon-separated inline arrays.
The historical governance-ledger parser split only comma-separated inline arrays, so a
valid multi-record `supersedes` list was read as one scalar and reverse links appeared
asymmetric.

## Decision

The governance-ledger YAML subset parser recognizes both commas and semicolons as inline
array separators. Empty elements are rejected by the downstream schema. Scalar parsing,
sealed-body comparison, lifecycle transitions, and every other history rule remain
unchanged.

## Consequences

The history sensor and ADR validator interpret the same committed frontmatter shape.
Canonical supersession remains fail-closed for missing or genuinely asymmetric links.

## Alternatives Considered

Rewriting sealed ADR history, changing a sealed successor list, or ignoring asymmetric
links were rejected because they would conceal rather than repair the parser mismatch.

## Affected Rules

The authoritative affected-rule list is the exact `affected_rules` frontmatter above.
