---
id: R-0004-OPUS-CLOSE-REVIEW-8-FAILURE
title: R-0004 eighth exact-candidate Opus close-review failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-CI-ANSI-CORRECTION
superseded_by: R-0004-OPUS-CLOSE-REVIEW-8-CORRECTION
provenance:
  [Claude Opus 5 read-only review of f6a03a004ac255bd55ea26e9f97c9ad82d1bbb57; PR #6 run 30206695586; BL-180]
---

# R-0004 eighth exact-candidate Opus close-review failure

The mandated review ran in one tracked terminal session against exact clean candidate
`f6a03a004ac255bd55ea26e9f97c9ad82d1bbb57` through literal model selector
`claude-opus-5`, effort `max`, plan permission mode, no fallback, and no Fable use. It
was strictly read-only and returned **`VERDICT: FAIL`**.

Exact-head CI run `30206695586` had two R20 fingerprint divergences. Engineer `a0dc396`
repaired the first, `tests_passed: 1` becoming zero under colored summary text. The
second remained: raw ANSI-decorated `out_head` entered the deterministic fingerprint,
and the existing wall-clock mask could not match a start time interrupted by SGR bytes.
The prior correction truthfully preserved raw evidence but incorrectly concluded that
metric extraction was the only environment-dependent surface.

BL-180 is reopened. Inspector must first reproduce the fingerprint-level colored-text
failure. Engineer may normalize terminal presentation only inside the deterministic
R20 fingerprint view; raw sensor evidence must remain byte-for-byte. The baseline must
not be recaptured. The corrected test and known-red record must turn green before a
symmetric Auditor correction, an atomic next-closing-decision rebind, a complete ladder, another
literal `claude-opus-5` review, and repaired exact-head CI.

The review also identified two bounded reconciliation gaps to close in the same repair
cycle: `surface-disposition.json` retains the entry-era schema total 54 despite the
55-schema exit canon, and the 147-description statement must distinguish 144 literal
AST bindings from three exact init-factory-derived bindings unless the extractor is
generalized. Nothing was merged, closed, published, released, deployed, or written to
real stynx; all later human gates remain closed.
