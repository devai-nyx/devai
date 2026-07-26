---
id: GOVERNED-SURFACE-POLICY
title: Governed action and package surface
type: policy
status: active
date: 2026-07-26
authority: Architect
provenance: [session-draft R-0004 B2, DII-162, R-0004-SURFACE-DISPOSITION]
---

# Governed action and package surface

## Action identity

`law/policy/action-registry.json` is the sole authority for public action paths,
internal bindings, lifecycle, disposition, effect, tier, and authority contract. The
public path is the permanent identity. A folded or tombstoned identity is never
reminted and must retain nonempty migration guidance.

The CLI, effects checker, sensors, generated documentation, and contract tests consume
byte-stable generated views of that registry. Generators compare UTF-8 bytes and do not
use host locale ordering. Generated files carry their canonical-source marker.

## Output and authority

Catalog and help output describe registered authority; they do not grant it. A write
action remains fail-closed until its authority contract, role, consent, and boundary
checks succeed. JSON output is the machine contract. Human output is a projection and
must not introduce an action, effect, or lifecycle absent from the registry.

## Sensor standing

Every live sensor kind resolves a successor-local design note under
`law/policy/sensor-notes/`. The nine diagnostic-only kinds remain diagnostic and the
fifty cell-bound kinds retain their measured bindings. Notes document standing; they
grant no filesystem, database, network, release, or publication authority.

## Package topology

The fixed release group is exactly, in UTF-8 byte order:

- `@devai-nyx/authority`
- `@devai-nyx/cli`
- `@devai-nyx/core`
- `@devai-nyx/effects-check`
- `@devai-nyx/evidence`
- `@devai-nyx/loop`
- `@devai-nyx/schemas`
- `@devai-nyx/sensors`
- `@devai-nyx/skills`
- `@devai-nyx/spec`
- `@devai-nyx/utils`

`@devai-nyx/core` is an implementation-free export façade over the other ten public
packages. It owns no runtime logic, performs no registration, and introduces no cycle.
Adapters and examples remain private and outside the fixed release group.

## Root process and workflow boundary

Root `build` and `test` invoke their supported porcelain routes with fixed argv. They
accept no caller-supplied command string and do not recursively invoke themselves.
Required tool absence fails closed. CI pins third-party actions to immutable 40-hex
commits with readable major-version annotations and prewarms every install job.

This policy authorizes no publication, deployment, tag, release, Pages mutation,
real-stynx write, R-0008 external action, R-0009 activation, or R-0010 observation.
