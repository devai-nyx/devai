---
id: R-0006-INDEPENDENT-CODEX-REVIEW-FAILURE
title: R-0006 E0-E5 independent Codex diagnostic review failure
type: audit-report
status: active
date: 2026-07-27
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    OM-010; DII-207; DII-208; DII-209; candidate 2f423bbde5dab29840561f6b23b2d4f92e89e024; manifest c45beb2461df0e9ee4bb7eeec64cd3d67e01119c4cf0e2797be96b39f1ad0afa,
  ]
---

# R-0006 E0-E5 independent Codex diagnostic review failure

## Verdict and standing

**FAIL — six P1 blockers.** This read-only Codex review is preserved as diagnostic
failure evidence. It is not the execution contract's mandatory final review because
that review requires the literal `claude-opus-5` selector with no fallback. No PASS,
review-envelope standing, push, merge, closure, or B0 authority follows from this
record.

The reviewed candidate was `2f423bbde5dab29840561f6b23b2d4f92e89e024`
with internally recomputed manifest digest
`c45beb2461df0e9ee4bb7eeec64cd3d67e01119c4cf0e2797be96b39f1ad0afa`.
The reviewer made no file, commit, ref, pull-request, or remote mutation.

## P1 findings and complete repair boundary

1. Convergence accepted a caller-named head without proving the checkout was that head,
   ignored relevant generated writes, and compared no semantic result equivalence
   between passes.
2. The policy omitted the ordinary `pnpm vitest run` floor from each convergence pass.
3. A caller could forge well-formed ignored convergence, rehearsal, and coverage state;
   manifest construction did not revalidate exact pass shape, ordered commands,
   outcomes, clean boundaries, coverage provenance, or rehearsal ancestry.
4. Closure rehearsal checked prerequisite-file existence but manually wrote an invalid
   placeholder instead of invoking the production phase-close verb and checking its
   exact Machine-only range.
5. The review envelope trusted caller-selected `--reviewed-sha` and did not validate an
   exact PASS record binding the required reviewer model, candidate, and manifest digest.
6. Semantic non-vacuity was syntactic: nonexistent wildcard populations and drift in
   additional governed mirror pairs could pass.

The same-class sweep is the complete close-control script, canonical policy and mirror,
all E1/E4 entry-control cases, manifest/rehearsal/convergence ignored state, and exact
review-envelope record semantics. The repair may not enter R-0006 B0 or change public
action behavior, coverage floors/exclusions, release state, predecessor state, or
real-stynx.

## Verified positives retained

The reviewer independently confirmed the exact live base and green PR 11 exact-main
run, all 23 then-current role-pure commits, red-evidence hashes and sequencing, clean
candidate-only manifest resolution, the existing manifest's internal digest, the B0
hard stop, and a clean worktree. Those positives do not offset or waive any P1.
