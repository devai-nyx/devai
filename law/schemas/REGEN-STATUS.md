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

Canonical corpus after the R-0004/B2 action-identity authority: **55 files** = the
R-0001 54-file corpus plus `action-registry.schema.json`. The action-registry package
roster and recursive-canon wiring are the role-separated R-0004/B3 Engineer handoff.
Archived: 15 under predecessor-archive/ (excluded from count, gate, exports).

**COUNT CORRECTION vs earlier drafts**: CTX-06/Part VIII said "45+1=46" while also ruling
the two edge cases import-with-bindings. Correct figures: 48 contract schemas + 3
infrastructure = 51 roster files. Corpus figures updated.

| Improvement               | Status                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. common-defs layer      | Execution-status and judgment-verdict definitions are separately named; validation-result consumers are rewired; glossary authority references the shared role vocabulary including `joint`. Broader vocabulary rewiring remains W02. |
| 2. registry-derived enums | Sensor-kind authority is `law/policy/sensor-registry.json`. Action identity, effect, tier, disposition, and authority are now canonical in `law/policy/action-registry.json`; generated runtime consumers are the R-0004/B3 handoff.  |
| 3. record-meta fragment   | Written, exampled, $refs common-defs.                                                                                                                                                                                                 |
| 4. schema_version         | ALL 55/55 versioned 1.0.0; $schema + $id normalized to the devai.nyxk.com.br namespace.                                                                                                                                               |
| 5. validated examples     | 55/55 canonical schemas have declared examples. The new action-registry example awaits the role-separated B3 roster wiring.                                                                                                           |
| 6. meta-schema + linter   | `meta.schema.json` is written and the package implements the current recursive canon checks. R-0001/P1 gate: zero meta noncompliance and zero canon findings after roster wiring.                                                     |

Honest state: improvements 1 (named core vocabularies), 2 at the law authority layer,
3, 4, 5, and the current slice of 6 are applied. All live sensor design notes now
resolve successor-locally. Generated action consumers, the recursive schema command,
and runtime parity enforcement remain the B3 handoff. Population enforcement state
remains explicit in the population registry.
