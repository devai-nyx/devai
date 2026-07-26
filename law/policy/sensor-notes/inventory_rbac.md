---
id: SENSOR-NOTE-inventory_rbac
title: Inventory Rbac
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: inventory_rbac
emitter: packages/sensors/src/inventory-rbac.ts
standing: cell
tiers: [TIER2, SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Inventory Rbac

This note binds the successor-local design standing for `inventory_rbac`. Its canonical emitter
is `packages/sensors/src/inventory-rbac.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: [object Object], [object Object].

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
