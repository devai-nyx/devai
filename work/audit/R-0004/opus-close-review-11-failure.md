---
id: R-0004-OPUS-CLOSE-REVIEW-11-FAILURE
title: R-0004 eleventh exact-candidate Opus close-review failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-SOURCE-DECISION-SHA-CORRECTION
superseded_by: null
provenance: [Claude Opus 5 read-only review of e79b2830e1a0484e68f816f54de64ba852013d88; BL-182]
---

# R-0004 eleventh exact-candidate Opus close-review failure

The mandated review ran in one tracked terminal session against exact clean candidate
`e79b2830e1a0484e68f816f54de64ba852013d88` through literal model selector
`claude-opus-5`, effort `max`, plan permission mode, no fallback, and no Fable use. It
was strictly read-only and returned **`VERDICT: FAIL`**.

The review reproduced the complete green ladder and verified that the BL-181 production
guard resolves 253 governed identities as 245 local objects plus 8 exact path-scoped
historical specimens on the reviewed candidate. It found three record and contract
gaps:

1. DII-194 and the source-close handoff attach the later 245-local reading to source
   snapshot `fd99ab7deaa1702467b6d8f9c4d6a98f4372b87e`, whose exact reading is 252
   identities / 244 local / 8 classified. Snapshot `832da68` and the reviewed candidate
   read 253 / 245 / 8.
2. Active law claims that local identities are checked against a declared Git object
   kind and that wrong-kind objects fail closed. The implementation checks whether the
   identity resolves to any local Git object; no local expected-kind declaration exists.
   The actual enforced contract is local resolution or an exact path-scoped exception.
3. The BL-181 Inspector contract proves the production check is present and green but
   does not exercise rejection of an unresolved identity, an exception used outside its
   allowed paths, a stale allowed path, or a stale exception.

BL-182 blocks source push. Inspector must characterize the inaccurate active claims and
add hermetic rejection coverage. The owning authorities must reconcile each active
claim to the implemented resolve-or-exact-path-exception semantics, pair this failure
with a symmetric correction, and bind a fresh atomic closing decision before the full
ladder and another literal `claude-opus-5` review. Nothing was merged, closed,
published, released, deployed, or written to real stynx; every later human gate remains
closed.
