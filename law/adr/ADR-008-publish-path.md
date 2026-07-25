---
id: ADR-008
title: Publish path and package continuity
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-002-real-publish-path.md; ADR-LOCAL-PUBLISH-WORKFLOW.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor publish ADRs; ex-D-114/118/119/121/122/127/128; DII-120
affected_rules:
  - .changeset/config.json
  - package.json
  - pnpm-workspace.yaml
  - law/constitution.md
---

# ADR-008. Publish path and package continuity

## Status

Accepted and active in R-0003. It defines a possible release path but authorizes no
release or publication.

## Context

Succession preserves the `@devai-nyx` package namespace while starting successor law and
evidence standing anew. Publishing must keep all framework packages, generated schemas,
packs, package metadata, and vendored Constitution bytes mutually consistent.

## Decision

GitHub Packages is the canonical package registry and `@devai-nyx` remains the package
scope. The eleven-package workspace releases as one fixed Changesets group. Prepack
stages all required packs and schemas into distributable artifacts before package
verification. A release candidate is exercised through the registered local publish
workflow before any remote actuation.

The production release verb machine-manages adopter `devai_version`. Vendored
Constitution content is pinned by version and SHA-256 checksum; an adopter upgrade is
explicit. The first external successor release must include registry-supported provenance
attestation in addition to the repository evidence chain. Publish always requires the
separate human release gate and explicit publication consent.

## Consequences

Packages cannot drift independently, and adopters can verify the exact Constitution and
framework version installed. Release preparation remains testable without publishing.

## Alternatives Considered

npmjs as canonical registry, independent package versions, runtime schema fetching,
implicit adopter upgrades, and publishing without a local pack test were rejected for
continuity or reproducibility reasons. Treating this ADR as release authorization was
rejected because policy and human gates are separate.

## Affected Rules

- `.changeset/config.json`
- `package.json`
- `pnpm-workspace.yaml`
- `law/constitution.md`
