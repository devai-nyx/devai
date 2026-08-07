---
id: ADR-021
title: R-0007 workflow CLI contract and migration
type: adr
status: active
date: 2026-08-07
authority: Architect
supersedes: [R-0007-PLAN#Owner-set-product-direction; R-0007-PLAN#Target-surface]
superseded_by: null
provenance:
  - OM-019; R-0007 B0 inventory; R-0007 B1 red contracts; R-0007 plan; ADR-006; ADR-010
affected_rules:
  - law/policy/action-registry.json
  - law/schemas/action-registry.schema.json
  - law/policy/authority-policy.json
  - law/schemas/authority-policy.schema.json
  - law/policy/subprocess-effects.json
  - law/schemas/subprocess-effects.schema.json
  - work/rounds/R-0007/inventory/old-to-new-command-map.md
---

# ADR-021. R-0007 workflow CLI contract and migration

## Status

Accepted and active in R-0007 B2. This ADR supersedes only the provisional CLI direction
and target-surface sections named in frontmatter. It does not supersede ADR-006,
ADR-010, or any other numbered ADR; it applies their registry, fail-closed routing,
capability-ceiling, and inferred-effect rules to the R-0007 surface.

## Context

The admitted CLI exposed 147 runnable actions across seventeen top-level domains, with
most useful behavior reachable only through plumbing-shaped names. Several declarations
were also weaker or broader than implementation: `sense migrate check` can write a
database, while release-status and evidence chain-head inspection are reads. The old
`--allow-publish` spelling obscured that local mutation consent and remote-publication
consent are separate decisions.

R-0007 is the pre-RC breaking-change window. Its one-to-one migration inventory covers
every admitted runnable identity and preserves the existing 39 retired identities. A
new action ID is minted only for a canonical successor route; an old identity is never
renamed in place or reminted later.

## Decision

Default help exposes exactly seven porcelain domains in this order: `init`, `doctor`,
`check`, `sense`, `round`, `evidence`, and `release`. Expanded help additionally exposes
only hidden `task` and `catalog` plumbing. Every runnable action under a default domain
is porcelain; every runnable `task` or `catalog` action is plumbing. Folds and
tombstones are router-only records: they can return exact migration guidance but can
never dispatch an implementation binding.

The binding migration creates exactly 42 runnable actions, 169 folds, and 11 tombstones
across 222 never-reminted identities. The runnable population consists of 31 porcelain
actions and 11 hidden plumbing actions. These counts are derived from the ordered
registry and the 147-row migration bijection; prose is disclosure, not an independent
enumeration authority.

`sense run <kind>` is one parameterized CLI action. Sensor kinds remain values in the
sensor registry, not action identities. Each selected kind has a canonical resolved
effect contract. The generic `sense run` action declares the maximum `remote-write`
ceiling, but the runtime must resolve the named kind before authority and consent and
must enforce that kind's narrower-or-equal contract. A generic ceiling, executor kind,
model capability, suite, or preset never grants authority.

Effects are capability upper bounds with these corrected cases:

- `sense migrate` is `local-write`, declares `db:write`, and requires Engineer
  `--write` consent;
- `release status` is read-only and neither persists release evidence nor requires
  write consent;
- `evidence verify --scope chain --show-head` is read-only chain inspection;
- `check --only translation` retains the translation validator's actual local DB and
  workspace write ceiling despite its report-only verdict standing; and
- `release publish docs` is `remote-write` and retains the release-controller boundary.

The public publication flag is `--publish`. Internally the authority policies retain
the `allow_publish` Boolean as the resolved consent bit. It is true only when the caller
explicitly supplied `--publish`. `--publish` never implies `--write`, `--write` never
implies `--publish`, and a resolved `remote-write` invocation requires both. Merely
possessing a publication-capable rule, capability ceiling, or remote adapter never
satisfies either consent input.

The old-to-new inventory is the exact migration source for all 147 formerly runnable
routes and all vocabulary spellings. Unknown, folded, tombstoned, `f5`, `--profile`,
`--set`, and `--allow-publish` inputs fail before dispatch with usage exit 2 and exact
guidance. Historical identities and their original authority/effect evidence remain in
the registry as retired records; only canonical `keep` entries participate in runtime
registration and resolved authority policy.

## Consequences

The Engineer must derive routing, bounded help, expanded help, migration refusal, the
action catalog, effect projections, and resolved authority rules from the canonical
registry. Source, generated views, registered handlers, and the built catalog must be
ordered bijections over their applicable populations. A generated view may be stale
between this Architect setpoint and its authorized Engineer materialization, but it
cannot gain standing by silently retaining the former count guard.

Parameterized façades must resolve their member before execution. They may advertise a
conservative maximum effect, but may not require a read-only member to inherit unrelated
write authority, nor allow a write-capable member to inherit a read-only consent path.
`round run` and hidden task plumbing authorize orchestration only; task discipline and
the separately resolved executor contract remain the authority sources for task work.

The full narrative user corpus and deploy-ready site remain R-0009 scope. R-0007 owns
the machine registry and the minimum exact migration/operator contract only. Nothing in
this decision authorizes a publication, package release, tag, deployment, evidence
promotion, predecessor mutation, or real-adopter mutation.

## Alternatives Considered

Keeping the seventeen-domain surface was rejected because it preserves the admitted
navigation and automation burden. Compatibility aliases were rejected because they
would dispatch retired identities and create two live grammars. Minting one action per
sensor kind was rejected because kinds are extensible registry values under the single
`sense run <kind>` grammar. Treating every parameterized invocation as the generic
maximum was rejected because ceilings are not authority and would unnecessarily grant
or demand unrelated effects. Letting either consent flag imply the other was rejected
because local mutation and remote publication are independent decisions.

## Affected Rules

- `law/policy/action-registry.json`
- `law/schemas/action-registry.schema.json`
- `law/policy/authority-policy.json`
- `law/schemas/authority-policy.schema.json`
- `law/policy/subprocess-effects.json`
- `law/schemas/subprocess-effects.schema.json`
- `work/rounds/R-0007/inventory/old-to-new-command-map.md`
