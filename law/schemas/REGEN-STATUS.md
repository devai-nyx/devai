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

Roster: **51 files** = 47 imported contract schemas (CORE 26 + ADOPTER 10 + INTERNAL 9
+ the 2 bind-never-ghost edge cases) + genesis-attestation + 3 infrastructure schemas
(common-defs, record-meta, meta). Archived: 15 under predecessor-archive/ (excluded from
count, gate, exports).

**COUNT CORRECTION vs earlier drafts**: CTX-06/Part VIII said "45+1=46" while also ruling
the two edge cases import-with-bindings. Correct figures: 48 contract schemas + 3
infrastructure = 51 roster files. Corpus figures updated.

| Improvement | Status |
|---|---|
| 1. common-defs layer | File written (verdict both-casings pending the W02 one-enum-vs-two-fields determination; severity/roles/substrates/lifecycles/patterns single-sourced). $ref rewiring: DEMONSTRATIVE ONLY (invariant.severity). Full rewiring = W02 (must not prejudge casing decision). |
| 2. registry-derived enums | NOT applied (requires the sensor/action registries, W05 artifacts). Marker convention reserved. |
| 3. record-meta fragment | Written, exampled, $refs common-defs. |
| 4. schema_version | ALL 51/51 versioned 1.0.0; $schema + $id normalized to the devai.nyxk.com.br namespace. |
| 5. validated examples | 6/51 have examples (genesis, record-meta, common-defs, meta, invariant [real INV-AUTH-001 instance], glossary-entry [real GE-001]). Remaining 45: W02 authoring work — the meta-schema gate is RED over them by design until then. |
| 6. meta-schema + linter | meta.schema.json written (thin gate, self-compliant). `check schemas` linter: NOT implemented (W02/W05 code). |

Honest state: improvements 3/4/6-declarative are fully applied; 1/5 demonstratively;
2/6-linter await their registries and code. The red examples gap is deliberate — fake
examples would violate the canon harder than missing ones.
