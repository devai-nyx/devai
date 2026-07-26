---
id: SENSOR-NOTE-trace_resolution
title: Trace Resolution
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: trace_resolution
emitter: packages/sensors/src/trace-resolve.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Trace Resolution

This note binds the successor-local design standing for `trace_resolution`. Its canonical emitter
is `packages/sensors/src/trace-resolve.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: F1×T3.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
