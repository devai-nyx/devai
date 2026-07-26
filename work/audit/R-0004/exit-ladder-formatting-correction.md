---
id: R-0004-EXIT-LADDER-FORMATTING-CORRECTION
title: Exact-candidate cross-authority formatting correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-EXIT-LADDER-FORMATTING-FAILURE
superseded_by: null
provenance:
  [
    BL-143; DII-169; Architect e1b952bf023cd779bc4c3c18b11d71c32c1e70eb; Engineer b8d6c9827ed9629970c32606729cb3a5fe6f061f; Inspector b3be1720be63edd5ca88b74ce5a7a140e546c435,
  ]
---

# Exact-candidate cross-authority formatting correction

BL-143 is locally implemented through separate role-pure commits. Architect `e1b952b`
formats only the reported authoritative `law/` sources while recording DII-169.
Engineer `b8d6c98` formats the reported production files, teaches the action-registry
generator to apply the repository's exact Prettier contract, and regenerates all three
owned views. Inspector `b3be172` formats only the two reported test-support files.

The focused 26-test forbidden-action suite, focused lint and type-check, standalone
formatter check over the complete repository, and action-registry byte check pass. The
repository-reference projection is expectedly stale because role-pure formatting moved
tracked source locators; this is the ordinary BL-064 deterministic transition, not a
behavioral failure. Architect must regenerate that projection, bind this correction in
a later source-closing decision, and restart the complete exact-candidate ladder.

No assertion meaning, behavior, threshold, skip, release boundary, or external human
gate changed.
