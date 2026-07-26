---
id: SENSOR-NOTE-security_scan
title: Security Scan
type: sensor-design-note
status: active
date: 2026-07-26
authority: Architect
sensor_kind: security_scan
emitter: packages/sensors/src/security-scan.ts
standing: cell
tiers: [SWEEP]
provenance: [session-draft R-0004 B2, DII-162]
---

# Security Scan

This note binds the successor-local design standing for `security_scan`. Its canonical emitter
is `packages/sensors/src/security-scan.ts`; R-0004 does not change its measured runtime semantics.

Bound cells: F2×T6.

The sensor emits evidence only through its registered cells or diagnostic surface. Any
future change to identity, standing, tier, or emitter requires an Architect disposition
before implementation. This note grants no mutation or release authority.
