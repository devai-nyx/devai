---
id: R-0003-CLAUDE-OPUS-CLOSE-REVIEW
title: First independent R-0003 exact-candidate close review
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0003; DII-151; exact candidate 1ea33baa0bef40372719d3a8c5bdd5070795daf4; claude-opus-5 read-only close review,
  ]
---

# First independent R-0003 exact-candidate close review

## Execution boundary

The review ran in one tracked terminal session against exact clean candidate
`1ea33baa0bef40372719d3a8c5bdd5070795daf4` through literal model selector
`claude-opus-5`, effort `max`, plan permission mode, no fallback, and no Fable use. The
reviewer made no repository change and used no network. Claude Code reported version
2.1.205 and session `6fa0614a-5944-4e34-bd52-6ac7b9f26478`.

## Verdict

**FAIL.** The source PR did not advance. The Auditor independently reproduced the six
blocking classes and governs them as BL-120 through BL-123. Four useful nonblocking
observations are also promoted to bounded R-0003 repairs as BL-124 through BL-127 so
the next review receives the complete corrected surface rather than known residue.

## Confirmed blockers

1. **BL-120 — founding provenance and crosswalk totality.** The predecessor terminal
   Constitution is 0.8.0, while the successor wrapper, crosswalk, and DII-148 call it
   0.6.0. Crosswalk rows 18 and 30 omit the scorecard-to-config threshold-path delta;
   row 7 describes only an output-path correction while omitting removed predecessor
   transfer, seal, non-commit, and durable-scope rules. The annex also says all six
   deltas have inline markers when only three do.
2. **BL-121 — decision-register authority boundary.** The file wrapper still declares
   the whole register a wireframe with no authority and dates its entries 2026-07-23,
   while DII-150 and DII-151 are active and the Constitution relies on DII-150. The
   container must become active without laundering its still-draft entries.
3. **BL-122 — ADR resolution.** ADR-005 names a nonexistent successor workflow in
   `affected_rules`, contradicting DII-149's resolution claim. Six ADR `supersedes`
   lists use semicolons even though the production parser splits on commas, collapsing
   multiple sources into one opaque token.
4. **BL-123 — glossary lifecycle wording.** The glossary README says already-active
   GE-006/016/020/022 were activated in R-0003. They were retained and jointly
   reviewed; a corrective Owner mark and Architect wording must preserve that fact.

## Promoted residuals

1. **BL-124:** `.devai/pin/versions.json` still calls the Constitution a 0.6.0
   predecessor seed and itself a wireframe stub after ratification.
2. **BL-125:** live R-0003 provenance depends on ephemeral REV-0001, REV-0003, and
   REV-0006 scratch inputs without durable repository copies.
3. **BL-126:** the as-built omits one B1 projection side effect and its full ladder is
   bound to the pre-close-decision snapshot; a correction audit must bind the repaired
   exact candidate and all new role-pure batches.
4. **BL-127:** repository-reference regeneration has no check mode and hardcodes the
   superseded R-0002 audit output path even though the current contract can compare the
   projection independently.

## Verified nonfindings

The reviewer recomputed the Constitution, genesis-attestation, and authority-policy
digests; verified policy byte identity, timestamp alignment, all 42 anchors, 34/34
trace resolution, the 157-entry reference projection, unchanged coverage floors, test
strengthening, role purity, and absence of predecessor writes. It found no release,
deployment, publication, readiness, promotion, or re-earned-standing claim.

## Required re-close

Repair BL-120 through BL-127 through red-first, role-pure commits and append-only
decisions. Re-run the complete exact-candidate ladder, then obtain a fresh independent
read-only `claude-opus-5` verdict before source push. PC-0004 and R-0004 remain blocked.
