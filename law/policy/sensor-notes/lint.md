---
id: SENSOR-NOTE-lint
title: Lint
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: lint
emitter: packages/sensors/src/lint.ts
standing: cell
tiers: [BASELINE, SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Lint

This note binds the successor-local design standing for `lint`. Its canonical emitter
is `packages/sensors/src/lint.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: [object Object].

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
