---
id: SENSOR-NOTE-llm_judge
title: Llm Judge
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: llm_judge
emitter: packages/sensors/src/judge.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Llm Judge

This note binds the successor-local design standing for `llm_judge`. Its canonical emitter
is `packages/sensors/src/judge.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: [object Object].

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
