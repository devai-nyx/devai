---
id: SENSOR-NOTE-test_weakening_review
title: Test Weakening Review
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: test_weakening_review
emitter: packages/sensors/src/test-weakening.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Test Weakening Review

This note binds the successor-local design standing for `test_weakening_review`. Its canonical emitter
is `packages/sensors/src/test-weakening.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: F3×T9.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
