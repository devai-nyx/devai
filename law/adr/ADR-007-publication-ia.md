---
id: ADR-007
title: Publication information architecture
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-DOCS-IA.md; ADR-DOCS-GOVERNANCE.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor docs ADRs; succession dossier Part VII; DII-120
affected_rules:
  - docs/
  - law/
  - product/
  - work/
  - record/
---

# ADR-007. Publication information architecture

## Status

Accepted and active in R-0003. It rewrites the predecessor documentation layout for the
successor substrate instead of copying the old mixed-authority tree.

## Context

In the successor, law, product intent, round intent, Auditor observation, and machine
proofs have distinct path authorities. Treating them all as authored documentation would
erase those boundaries and create two canonical copies.

## Decision

Canonical law lives only in `law/`, Owner product intent only in `product/`, governed
round intent and observation in their respective `work/` subtrees, and machine evidence
only in `record/`. Publication may expose read-only synchronized views of law and proofs,
but those views are never authoring sources.

Human concepts live in `docs/`; developer runbooks in `docs/dev/`; adopter procedures in
`docs/adopters/`. The predecessor seven-section information architecture may organize
material inside `docs/` only. The public History surface begins with the genesis
attestation and links to the frozen predecessor. Versioned successor documentation begins
at 1.0.0 and does not relabel predecessor history as successor versions.

## Consequences

Every published page has a canonical source and authority class. Sync drift is detectable
and repaired from the canonical tree. Historical material remains discoverable without
becoming active successor law.

## Alternatives Considered

Keeping all canonical material under `docs/`, authoring the published mirror, duplicating
proofs, and continuing predecessor version numbering were rejected because they confuse
authority or history. Hiding the predecessor entirely was rejected because succession
requires an inspectable archive.

## Affected Rules

- `docs/`
- `law/`
- `product/`
- `work/`
- `record/`
