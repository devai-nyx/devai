---
id: SENSOR-NOTE-migration_check
title: Migration Check
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: migration_check
emitter: packages/sensors/src/migrate-check.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Migration Check

This note binds the successor-local design standing for `migration_check`. Its canonical emitter
is `packages/sensors/src/migrate-check.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: F2×T4.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
