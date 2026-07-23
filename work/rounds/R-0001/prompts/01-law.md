# P1 — LAW track (Architect · effort: high)

Role: **Architect**. You may edit `law/**` and `work/rounds/`. You may NOT touch
`product/` content decisions (P2), code (P4), or tests (P5) beyond the contract tests
you must keep green. Everything stays `status: draft` — ratification is not yours.

## Context to read first
`law/constitution.md` (esp. the W01 ANNEX crosswalk) · `law/register/DECISIONS.md` §0
· `law/schemas/REGEN-STATUS.md` · `scratch/pre-plan/02-meta-catalog.md` (CTX-02)
· `scratch/pre-plan/06-schema-catalog.md` (CTX-06) · dossier Part IX §5.

## Tasks (in order)

1. **Altitude sweep (annex item 6)**: read all 42 articles; produce a findings list of
   operational values that should be policy (do NOT silently edit articles — apply only
   unambiguous mechanical fixes; judgment calls go to your report + backlog). Decide and
   record (as a draft register entry) the Article-42 placement: recommend KEEP Part XI
   (avoids renumbering the 55 imported anchors) unless you find a stronger reason.
2. **Examples backfill (W02.f-5)**: every roster schema gets ≥1 `examples` entry —
   FROM REALITY where instances exist (invariants, glossary, journeys, trace, policy
   files, PC-shape from predecessor `docs/meta/rounds/round-30/record.md` context,
   readings from `../devai/.devai/state/sensor-readings/` read-only); minimal authored
   examples only where no instance exists anywhere. GATE per batch: meta-gate
   noncompliant count strictly decreases; finish at zero.
3. **Defs alignment (the resolved determinations)**: rename `verdict_lower/upper` →
   `execution_status_core` / `verdict_core` (per the recorded resolution in common-defs
   $comment); rewire the two consumers; add the `joint` token to the role def and $ref it
   from glossary-entry.authority (the glossary near-native finding); update the invariant
   `authority` collision note to its decided rename (`authority_docs` — record as draft
   register entry) but do NOT execute that rename (it re-anchors trace; backlog it).
4. **Population registry (Part IX §5)**: author `law/policy/population-registry.json`
   (schema it: add `population-registry.schema.json` to the roster + roster test count
   bump) listing every append-able population with count/liveness/tombstone guard
   declarations — truthful about which guards exist today vs backlogged.
5. Keep `law/register/DECISIONS.md` current: every decision you make lands as a draft
   DII entry with provenance; every deferral as a backlog line in your report.

## Acceptance
Full suite green (count may grow, never shrink) · meta-gate 0 noncompliant ·
`check-schemas` linter 0 findings · every edit committed role-pure with verify-first.

Final message: `DONE / DEFERRED / DEFECTS-FOUND / COMMITS` per the orchestrator contract.
