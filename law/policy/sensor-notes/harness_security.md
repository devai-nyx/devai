---
id: SENSOR-NOTE-harness_security
title: Harness Security
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: harness_security
emitter: packages/sensors/src/harness-security.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Harness Security

This note binds the successor-local design standing for `harness_security`. Its canonical emitter
is `packages/sensors/src/harness-security.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: F5×T6.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
