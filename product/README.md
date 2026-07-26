---
id: PRODUCT-README
title: Product tier — Owner-authored business setpoints
type: index
status: draft
date: 2026-07-23
authority: Owner
supersedes: null
superseded_by: null
provenance:
  [
    rewrite of the predecessor stub per REV-0006 ("Content is deferred" above 14 journeys was stale),
    REV-0006 Owner marks applied 2026-07-23 (JNY-007 supersession; OM-001 attested-historical; use-case refs mapped),
    OM-002 active successor completion mandate recorded 2026-07-24,
    OM-003 active Claude-review model rider recorded 2026-07-24,
    OM-004 active bounded coverage-strengthening rider recorded 2026-07-24,
    OM-005 active quota-window coverage-doubling rider recorded 2026-07-24,
    OM-006 active BL-017 ownership reconciliation recorded 2026-07-25,
    OM-007 active R-0002 final-review exception recorded 2026-07-25,
    OM-008 active R-0004 final-review exception recorded 2026-07-26,
    OM-009 active R-0005 independent Codex-review substitution recorded 2026-07-26,
  ]
---

# Product tier (F1-business, Owner authority)

The Owner's setpoints: what the framework must do for whom, in structured natural
language. Not invariants — this tier binds only through explicit compilation to
Architect-tier law (Article 12; see compilation.md).

- `journeys/` — journey records JNY-001..014 (JNY-007 is superseded by JNY-014; JNY-002/003 lifecycle: experimental)
- `use-cases/` — sensor-consumed CLI use-case bundle (inventory-coverage input)
- `owner-mandates/` — Owner mandate records (OM-001 is attested-historical;
  OM-002 is the active successor completion mandate; OM-003 is its active
  Claude-review model rider; OM-004 authorizes bounded pre-review coverage
  strengthening without closing BL-017; OM-005 requires iteration until every
  OM-004 reading is doubled; OM-006 records the resulting BL-017 closure; OM-007
  authorizes the scoped R-0002 final-review exception and continuous two-PR closure;
  OM-008 authorizes the scoped R-0004 final-review exception and source-closure
  ceremony; OM-009 replaces only R-0005's unavailable Claude close review with an
  independent read-only Codex-agent review)
- `stories/`, `rules/` — reserved, empty at genesis

Every artifact carries §5.1 record fields natively (JSON: schema fields; markdown:
front-matter). The seam guard: no active invariant may anchor solely on a
superseded/tombstoned artifact here.
