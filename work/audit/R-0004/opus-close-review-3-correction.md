---
id: R-0004-OPUS-CLOSE-REVIEW-3-CORRECTION
title: R-0004 third exact-candidate Opus repair
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: R-0004-OPUS-CLOSE-REVIEW-3-FAILURE
superseded_by: null
provenance: [BL-163–165; Auditor 9810d80; Inspector b0af62c; Engineer ca6dff9; Architect c7d1807]
---

# R-0004 third exact-candidate Opus repair

BL-163 through BL-165 are locally implemented through role-pure red-first commits.
Inspector `b0af62c` first exposed both stale contract claims and the direct `sense build`
description mismatch: the focused contract failed two tests against the unchanged
candidate. Engineer `ca6dff9` then aligned only the command-definition literal with the
canonical fixed-recursive registry description, leaving the contract guard red.

Architect `c7d1807` corrected the active surface contract to the disposition-derived
`pnpm -r build` and `pnpm vitest run` argv and to the production-derived 55-schema canon.
DII-186 supersedes DII-185 only as the R-0004 source-closing judgment. Both focused
guards now pass: direct public command metadata equals the canonical registry, and the
active contract derives its argv/count claims from canonical sources rather than
independent constants.

No threshold, test source set, skip, assertion meaning, external gate, publication,
release, deployment, real-stynx write, or later-round boundary changed. The complete
ladder, package dry-runs, and a fresh exact-candidate literal `claude-opus-5` PASS remain
mandatory before source push.
