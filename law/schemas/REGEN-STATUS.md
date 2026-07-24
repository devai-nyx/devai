---
id: SCHEMA-REGEN-STATUS
title: Schema regeneration status (wireframe)
type: index
status: draft
date: 2026-07-23
authority: wireframe regeneration; W02 completes
provenance: [CTX-06, dossier Part VIII W02.a-f, schema audits 2026-07-23]
---

# Schema regeneration status

Canonical corpus after the R-0001/P4 law prerequisite: **54 files** = the 51-file
imported roster plus `population-registry.schema.json`, `error.schema.json`, and
`sensor-registry.schema.json`. The package roster/count guard wiring for the two P4
schemas is a role-separated P4 handoff. Archived: 15 under predecessor-archive/
(excluded from count, gate, exports).

**COUNT CORRECTION vs earlier drafts**: CTX-06/Part VIII said "45+1=46" while also ruling
the two edge cases import-with-bindings. Correct figures: 48 contract schemas + 3
infrastructure = 51 roster files. Corpus figures updated.

| Improvement | Status |
|---|---|
| 1. common-defs layer | Execution-status and judgment-verdict definitions are separately named; validation-result consumers are rewired; glossary authority references the shared role vocabulary including `joint`. Broader vocabulary rewiring remains W02. |
| 2. registry-derived enums | Sensor-kind authority is now `law/policy/sensor-registry.json`; runtime enum/map/tier derivation is a role-separated P4 handoff. Action-registry derivation remains later work. |
| 3. record-meta fragment | Written, exampled, $refs common-defs. |
| 4. schema_version | ALL 54/54 versioned 1.0.0; $schema + $id normalized to the devai.nyxk.com.br namespace. |
| 5. validated examples | 54/54 canonical schemas have declared examples. The 52 rostered schemas retain the green P1 example gate; the two P4 schemas validate directly and await role-separated roster wiring. |
| 6. meta-schema + linter | `meta.schema.json` is written and the package implements the current recursive canon checks. R-0001/P1 gate: zero meta noncompliance and zero canon findings after roster wiring. |

Honest state: improvements 1 (named core vocabularies), 3, 4, 5, and the current slice of
6 are applied. The sensor registry exists, but its package consumers remain the P4
handoff; broader common-vocabulary and action-registry rewiring remain later work.
Population enforcement state remains explicit in the population registry.
