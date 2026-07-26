---
id: SENSOR-NOTE-runtime_probe_data
title: Runtime Probe Data
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: runtime_probe_data
emitter: packages/sensors/src/runtime-probe-data.ts
standing: diagnostic
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Runtime Probe Data

This note binds the successor-local design standing for `runtime_probe_data`. Its canonical emitter
is `packages/sensors/src/runtime-probe-data.ts`; R-0004 does not change its measured runtime semantics.

Diagnostic-only; no cell binding.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
