---
id: SENSOR-NOTE-action_effect_inference
title: Action Effect Inference
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: action_effect_inference
emitter: packages/sensors/src/action-effect-inference.ts
standing: diagnostic
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Action Effect Inference

This note binds the successor-local design standing for `action_effect_inference`. Its canonical emitter
is `packages/sensors/src/action-effect-inference.ts`; R-0004 does not change its measured runtime semantics.

Diagnostic-only; no cell binding.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
