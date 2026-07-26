---
id: ADR-006
title: CLI information architecture
type: adr
status: active
date: 2026-07-25
authority: Architect
supersedes: [ADR-CLI-INFORMATION-ARCHITECTURE.md]
superseded_by: null
provenance:
  - REV-0003 disposition map; predecessor ADR-CLI-IA; ex-D-26; ex-D-27; ex-D-129; DII-120
affected_rules:
  - law/policy/domains.json
  - law/policy/population-registry.json
  - law/policy/sensor-registry.json
---

# ADR-006. CLI information architecture

## Status

Accepted and active in R-0003.

## Context

Hand-wired routers and duplicated action catalogs drift. The CLI needs a stable human
grammar while allowing registered actions and sensors to grow without hidden aliases or
unmeasured surface changes.

## Decision

One schema-backed action registry derives action identity, hierarchical routing, help,
and catalog output. The public grammar is noun then verb. Unknown routes and invalid
arguments fail closed with usage exit 2. Mutating actions require explicit `--write`;
publishing actions additionally require explicit `--allow-publish`. Removed legacy names
are tombstoned rather than retained as aliases.

Each manifest action declares a porcelain or plumbing tier. The bounded root help shows
porcelain only; domain and leaf help expose the appropriate registered surface. Action
count, liveness, uniqueness, and tombstones are guarded as a population. Sensing extends
through the sensor registry, not special router branches; sensor descriptors bind to the
registered sensing action.

## Consequences

Documentation, routing, and inventory can share exact identities. Adding a command or
sensor requires a registry record and passes population guards. Users receive explicit
consent boundaries and predictable usage failures.

## Alternatives Considered

Independent router definitions, verb-first commands, implicit write consent, legacy
aliases, and sensor-specific routing were rejected because they multiply identity and
drift surfaces. Showing all plumbing at the root was rejected as unbounded public noise.

## Affected Rules

- `law/policy/domains.json`
- `law/policy/population-registry.json`
- `law/policy/sensor-registry.json`
