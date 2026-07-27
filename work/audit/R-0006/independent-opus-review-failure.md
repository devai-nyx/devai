---
id: R-0006-INDEPENDENT-OPUS-REVIEW-FAILURE
title: R-0006 E0-E5 independent Opus review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-207; DII-208; DII-209; DII-210; candidate fcbeb2b69621d8de32fe90f34b8a1e1dbbb54cef; manifest b9bdd01306e29c1aaa6d1f41b8f401edd05eca92cbaee6716e9b0dd8c07f22ec,
  ]
---

# R-0006 E0-E5 independent Opus review failure

## Verdict and standing

**FAIL — four P1 blockers and no P0 blocker.** The mandatory read-only reviewer ran
with the literal `claude-opus-5` selector in plan mode with write tools denied. It
reviewed exact candidate `fcbeb2b69621d8de32fe90f34b8a1e1dbbb54cef` and
independently recomputed manifest digest
`b9bdd01306e29c1aaa6d1f41b8f401edd05eca92cbaee6716e9b0dd8c07f22ec`.
No file, ref, remote, pull request, or predecessor was mutated. This FAIL grants no
review-envelope, push, merge, closure, B0, or release standing.

## P1 findings and bounded repair

1. `work/audit/R-0006/entry-control-as-built.md` still described the superseded
   pre-repair candidate, manifest, identity count, convergence, and rehearsal. Refresh
   the E5 Auditor observation after the remaining repairs and before a fresh review.
2. `packages/schemas/tests/contract/governed-populations.contract.test.ts` compared a
   schema-directory enumeration with another enumeration of the same directory. Replace
   the tautology with independently sourced tracked, roster, and runtime populations.
3. `tests/KNOWN-RED-R0006.md` preserved the new seven-red observation but no tracked
   Inspector disposition recorded the exact post-repair green reading. Add it after the
   same-class sweep passes.
4. Negative coverage was absent for second-pass ignored/generated write drift, coverage
   byte drift, cross-pass result drift, caller-supplied reviewed SHA, and rejection by a
   configured rehearsal range checker. Add red-first Inspector adversaries; change
   implementation only if those adversaries disclose a real defect.

## Verified positives retained

Opus independently confirmed the 32-commit role-pure range, candidate tree cleanliness,
candidate-only identity resolution with 313 classified or reachable identities and no
alternates, exact policy mirror, all red-evidence digests and sequencing, two 16-gate
clean convergence passes including ordinary Vitest, identical coverage and workspace
digests, 72.42/62.36/78.07/74.52 coverage, forged-state rejection, production
phase-close rehearsal with an exact Machine-only range, manifest-bound review-envelope
logic, and the hard stop before B0. Those positives do not waive any P1.

## Explicit nonclaims

This record does not claim a PASS or current candidate readiness. It authorizes no B0,
push, merge, closure, publication, package release, deployment, evidence reuse or
promotion, predecessor mutation, real-stynx mutation, or R-0007+ work.
