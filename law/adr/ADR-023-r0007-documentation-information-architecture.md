---
id: ADR-023
title: R-0007 documentation information architecture
type: adr
status: active
date: 2026-08-07
authority: Architect
supersedes: [R-0007-PLAN#Canonical-reference-handoff-to-R-0009]
superseded_by: null
provenance:
  - OM-019; R-0007 plan; R-0007 Wave 3 Information Architect; R-0007 B1 output and documentation contracts
affected_rules:
  - law/policy/documentation-information-architecture.json
  - law/schemas/documentation-information-architecture.schema.json
  - work/rounds/R-0007/inventory/documentation-information-architecture.md
  - work/rounds/R-0007/inventory/migration-narrative.md
---

# ADR-023. R-0007 documentation information architecture

## Status

Accepted and active for the R-0007 canonical-reference handoff. This decision supersedes only
the provisional information-architecture setpoint in the R-0007 plan section identified by
the frontmatter token; the remainder of the plan stays active. It refines ADR-007's publication
authority split without superseding ADR-007. It governs the R-0007 descriptor and minimum
operator/migration contract; it does not activate R-0009 or declare the planned
user-documentation pages complete.

## Context

R-0007 changes the user grammar, makes tasks subordinate to rounds, introduces a closed
executor model and rostered model/runtime selection, and replaces copied suite and preset
membership with canonical machine descriptors. A prose-first documentation rewrite would
create a second mutable source and could describe a command, model, effect, or migration that
the candidate does not implement.

The current `docs/` tree also predates the R-0007 surface. R-0009 owns the complete semantic
rewrite, generated pages, site integration, and deploy-ready artifact, but it must receive a
deterministic handoff that names every required page, category, semantic field, and source.
R-0007 therefore needs enough operator and migration material to make its new surface safe
without claiming the later corpus already exists.

## Decision

`law/policy/documentation-information-architecture.json`, validated by
`law/schemas/documentation-information-architecture.schema.json`, is the canonical
information-architecture and routing policy for this handoff.

The planned R-0009 CLI reference contains exactly eleven pages under
`docs/reference/cli/`: overview, vocabulary, check suites, sense presets, sensor kinds,
inventory slices, adoption tiers, rounds/tasks/executors, authority/effects, migration, and
model/runtime. The paths in the policy are future planned targets, not present-tense claims.
No `docs` command or eighth public workflow is introduced.

The generated-reference checker reports exactly fifteen enumeration categories: check
suites, sense presets, inventory slices, adoption tiers, executor kinds, agent-selection
modes, roles, effects, verdicts, action lifecycles, surface tiers, sensor kinds, runtimes,
rostered models, and supported efforts. Each category routes to the exact policy, registry,
or schema pointer named in the policy. Category-specific ordering is itself declared in the
policy; most preserve source order, while model/runtime/effort identifiers use the UTF-8 order
already bound by the B1 descriptor contract. Page prose never owns one of those populations.

The content boundary is:

- generated reference renders mutable populations and their semantic records directly from
  canonical sources in the category-declared order;
- narrative explains mental models, distinctions, selection, and recovery and links to the
  generated tables instead of copying them;
- the migration reference is a deterministic projection of the complete old-to-new map,
  checked against the action registry, with a minimum safe operator narrative;
- historical spellings appear only in migration or explicitly historical material;
- a missing source, unresolved pointer, unknown projection, duplicate value, extra value, or
  incomplete semantic field fails closed.

Every generated value must carry all semantic fields listed by the policy: identity and
label, purpose, population or projection, prerequisites and tools, inputs and defaults,
output and verdict behavior, effects and consent, relative cost, positive and negative use
guidance, all non-pass outcome semantics, a new-grammar example, canonical link, and related
workflow. An inapplicable field requires an explicit reason; omission is not completeness.

R-0007 B5 may materialize canonical descriptors and minimum safe migration/operator guidance.
R-0007 acceptance may claim only a complete canonical handoff. Complete narrative user
documentation, generated-page/site integration, a deploy-ready site artifact, deployment,
and release remain outside this decision and behind R-0009's later entry and external-effect
boundaries.

## Consequences

R-0009 receives an exact page and category manifest instead of reconstructing information
architecture from prose. Runtime and documentation can be checked as ordered bijections, and
model availability, executor selection, authority, effects, and migration cannot drift into
independent documentation truth.

The handoff checker must understand canonical JSON pointers and the deterministic Markdown
migration-table projection. Adding or removing a page, category, semantic field, or source
route is therefore an Architect policy change. A narrative page cannot repair a missing
canonical value, and documentation completeness cannot grant release or deployment standing.

## Alternatives Considered

A single hand-authored CLI guide was rejected because it would copy mutable populations and
make drift review-dependent. Generating every word was rejected because conceptual guidance,
role/executor distinctions, and recovery explanations require authored narrative. Reusing the
current flat CLI page was rejected because it cannot express the new category boundaries or
the R-0007/R-0009 ownership split. Creating `devai docs` was rejected because the Owner froze
seven public workflow domains. Treating the R-0007 handoff as complete R-0009 documentation
was rejected as an authority and readiness overclaim.

## Affected Rules

- `law/policy/documentation-information-architecture.json`
- `law/schemas/documentation-information-architecture.schema.json`
- `work/rounds/R-0007/inventory/documentation-information-architecture.md`
- `work/rounds/R-0007/inventory/migration-narrative.md`
