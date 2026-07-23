---
id: PRODUCT-README
title: Product tier — Owner-authored business setpoints
type: index
status: draft
date: 2026-07-23
authority: Owner
supersedes: null
superseded_by: null
provenance: [rewrite of the predecessor stub per REV-0006 ("Content is deferred" above 14 journeys was stale)]
---

# Product tier (F1-business, Owner authority)

The Owner's setpoints: what the framework must do for whom, in structured natural
language. Not invariants — this tier binds only through explicit compilation to
Architect-tier law (Article 12; see compilation.md).

- `journeys/` — 14 operator journeys (JNY-001..014; JNY-002/003 lifecycle: experimental)
- `use-cases/` — sensor-consumed CLI use-case bundle (inventory-coverage input)
- `owner-mandates/` — standing Owner mandates (OM-*)
- `stories/`, `rules/` — reserved, empty at genesis

Every artifact carries §5.1 record fields natively (JSON: schema fields; markdown:
front-matter). The seam guard: no active invariant may anchor solely on a
superseded/tombstoned artifact here.
