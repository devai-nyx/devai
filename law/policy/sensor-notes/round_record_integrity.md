---
id: SENSOR-NOTE-round_record_integrity
title: Round Record Integrity
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: round_record_integrity
emitter: packages/cli/src/commands/sense/governance-ledger.ts
standing: diagnostic
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Round Record Integrity

This note binds the successor-local design standing for `round_record_integrity`. Its canonical emitter
is `packages/cli/src/commands/sense/governance-ledger.ts`; R-0004 does not change its measured runtime semantics.

Diagnostic-only; no cell binding.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
