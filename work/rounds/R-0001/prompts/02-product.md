# P2 — PRODUCT track (Architect executing recorded Owner marks · effort: medium)

Role: **Architect**, but your substance authority here is derivative: you EXECUTE the
Owner's recorded ratifications (`scratch/review/product-review.md`, all rows marked
2026-07-23). You make NO new product judgments — anything the marks don't cover goes to
your report as an Owner question, and you move on.

## Context to read first
`scratch/review/product-review.md` (REV-0006 — this IS your work order) ·
`product/README.md` · `scratch/pre-plan/02-meta-catalog.md` §product ·
`law/register/DECISIONS.md` §0 meta-rules.

## Tasks (each row of REV-0006, in table order)

1. Rows ratified as import: verify each journey still validates (suite covers it) — no
   content edits.
2. **JNY-007 supersession**: set JNY-007 `status` per its schema's vocabulary +
   `superseded_by: "JNY-014"`; JNY-014 gains `supersedes: ["JNY-007"]`; both keep
   provenance appends recording the Owner mark. Update the Article-12 seam test if it
   assumed 14 active journeys (superseded stays counted as a record, excluded from
   active-seam assertions — extend the test accordingly, coordinating via report since
   tests are Inspector turf: propose the exact diff in your report for P5 to apply, and
   mark the suite expectation change as a HANDOFF, not done).
3. **OM-001**: front-matter `status: superseded`, `superseded_by: null` + provenance
   line "completes with the predecessor (Owner mark 2026-07-23); attested-historical".
4. **use-cases ref-mapping (authorized W03 work)**: map each of the 12 UC steps to
   action identifiers using `scratch/pre-plan/03-cli-surface.md` as the vocabulary;
   where the successor CLI name is not yet settled (pre-P4), use the predecessor
   canonical path with a `provisional: true` marker per ref; remove or machine-stamp
   `generatedAt` per the ratified fix.
5. **Glossary touch-ups (ratified)**: GE-016 gains the experimental caveat sentence;
   GE-006/020/022 gain the adopter-path marking; provenance appends on all four.
6. **Vocabulary rider (ratified, draft status)**: author new GE entries for successor
   terms — work/, record/, proofs epoch, genesis attestation, population registry,
   DII namespace, record meta-structure — each `status: draft`, joint authority,
   linked via see_also; extend the glossary count assertion via P5 handoff.

## Acceptance
Suite green EXCEPT assertions you have flagged as P5 handoffs (list them precisely) ·
every change traceable to a REV-0006 row or the rider mark · role-pure commits.

Final message: `DONE / DEFERRED / HANDOFFS-TO-P5 / OWNER-QUESTIONS / COMMITS`.
