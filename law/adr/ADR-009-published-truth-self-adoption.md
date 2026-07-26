---
id: ADR-009
title: Published truth and operational self-adoption
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-004-published-truth-operational-self-adoption.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor ADR-004; ex-D-134/139/140; DII-120
affected_rules:
  - law/schemas/release-control.schema.json
  - law/schemas/runtime-charter.schema.json
  - law/schemas/evidence.schema.json
---

# ADR-009. Published truth and operational self-adoption

## Status

Accepted and active in R-0003.

## Context

Repository source, built packages, remotely published packages, and a host installation
are different facts. A diagnostic that silently updates canonical state makes observation
an unauthorized mutation and can falsely declare the repository self-adopted.

## Decision

Source truth, package truth, published truth, and host-installed truth are distinct typed
boundaries with separate exact identities. Publication evidence proves only the artifact
and registry event it names. Operational self-adoption additionally requires a verified
host receipt binding repository, installed package, policy, Constitution, hook/adapter,
and exact source identity.

Diagnostics are read-only and non-recording. Persisting canonical state occurs only
through a registered mutation with role, consent, expected targets, and machine receipt.
Post-merge observation may attest facts after a merge but may not retroactively authorize
the merge or publish operation.

## Consequences

Claims state which boundary they establish. Drift between source, package, registry, and
host remains visible, and a check cannot repair its own inputs.

## Alternatives Considered

Treating a green source tree as deployed truth, allowing doctor commands to persist
repairs, and accepting unsigned host assertions were rejected because they collapse
authority boundaries. One undifferentiated “current version” field was rejected because
it cannot identify which truth changed.

## Affected Rules

- `law/schemas/release-control.schema.json`
- `law/schemas/runtime-charter.schema.json`
- `law/schemas/evidence.schema.json`
