---
id: R-0006-CODEX-SUBSTITUTION-GOVERNANCE-FAILURE
title: R-0006 Codex substitution governed-sequencing failure
type: audit-report
status: active
date: 2026-07-28
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-013; smart convergence at exact candidate b3d323605834d1f8fea679920c2933701a96ee16]
---

# R-0006 Codex substitution governed-sequencing failure

Fresh smart convergence stopped at exact candidate
`b3d323605834d1f8fea679920c2933701a96ee16` when the `governance` task executed
`pnpm run ci:governance` and returned exit 1. The controller recorded task key
`c4497c3b50231075e635b4672187abb5d4e77d7ad589eed2760a36cc4bde4bea`, input digest
`36df416494a8345dcc628ba8290765d3ddc08bf64c3a9423d28cc22b3ab88863`, and outcome
`EXECUTED_FAIL`; it did not reuse the prior candidate's governance result.

Direct reproduction reached `pnpm run ci:sequencing` and returned the exact finding:

> implementation-binding 5c290bedf335d4cd65813370e26218588eb8ac2f: substantive
> Engineer commit must have exactly one binding; observed 0

The complete class is one substantive Engineer commit:
`5c290bedf335d4cd65813370e26218588eb8ac2f`, which materialized the canonical OM-013
review policy and aligned the workspace controller. The full-floor selector red existed
and was preserved before that commit, but its repairing Inspector commit
`7edc33b3a4c18e14d02c87ce51c7df0d9f35edf1` followed the Engineer commit; therefore it
cannot be relabelled as a qualifying prior semantic red. History is not rewritten.

Candidate `b3d323605834d1f8fea679920c2933701a96ee16`, its partial convergence run, and all
manifest, review, publication, and closure standing are invalid. This record claims no
repair, review PASS, publication, merge, PC-0007, closure, or release.
