---
id: R-0004-SOURCE-DECISION-SHA-CORRECTION
title: R-0004 governed decision SHA binding correction
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-DECISION-SHA-FAILURE
superseded_by: null
provenance: [BL-181; Inspector 759014a; Engineer aee78a3 and 7b44322; Architect cb50655]
---

# R-0004 governed decision SHA binding correction

Architect `cb50655` re-read and corrected the two decision-register commit identities to
`dc64176ab75675a65e3c561576a2f5bb756b408f` and
`54e79a19a22e64ec8a6c6ea698087081872d70fd`. This Auditor batch applies those exact
source values to every active audit binding. The failure record preserves the rejected
identities as historical specimens.

Engineer `aee78a3` added a production check over standalone forty-hex identities in the
decision register and audit records and wired it into `ci:governance`. Architect
`cb50655` classified legitimate non-local commits, trees, transient merge objects, and
intentionally invalid historical specimens. Engineer `7b44322` constrains every
exception to exact allowed paths, so a historical specimen cannot excuse the same bad
identity in an active record.

The production check and focused BL-181 contract pass after these corrections. No
history was deleted, no threshold or assertion weakened, and no external gate moved.
The complete ladder, atomic closing decision, fresh literal `claude-opus-5` review, and
exact-head CI remain mandatory before merge.
