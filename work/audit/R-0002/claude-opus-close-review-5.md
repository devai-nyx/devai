---
id: R-0002-CLAUDE-OPUS-CLOSE-REVIEW-5
title: Fifth Claude Opus 5 exact-candidate close review
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [exact read-only claude-opus-5 review of a8849d5df4ab61bc284749e5508d2d8c10aa0ae8]
---

# Fifth Claude Opus 5 exact-candidate close review

## Invocation boundary

The review ran through the literal `claude-opus-5` selector, effort `max`, plan
permission mode, no session persistence, and read-only repository tools. Edit, write,
notebook, web-fetch, and web-search tools were disabled. No fallback selector and no
Fable model were used. Claude Code telemetry reported the selected Opus model plus a
small internal Haiku routing charge; that implementation detail is disclosed rather
than represented as a user-selected fallback.

Exact base: `cc0084ba38fb6d583f79fddd38554524714c4fa4`.

Exact candidate: `a8849d5df4ab61bc284749e5508d2d8c10aa0ae8`.

The first buffered result contained the supplementary half of the review but omitted
its original finding list. Because the invocation used no session persistence, a
second read-only `claude-opus-5` invocation independently reconstructed one
self-contained report against the same exact candidate.

## Verdict

**FAIL.** The candidate may not advance to push or exact-SHA remote checks.

## Confirmed actionable findings

### High

1. `packages/sensors/src/docs-drift.ts` retains a private, fail-open Constitution
   parser. Missing Constitution bytes remove checks, and its legacy `Version` regex
   cannot parse the live `Candidate version` marker.
2. `packages/skills/src/forbidden-actions/index.ts` loses the protected source path for
   rename records. A rename out of `law/`, `product/`, governed work, proof, or
   materialized-policy paths can evade the protected-path rules.
3. Missing, empty, or pattern-less forbidden registries can still look clean.
   Registry-coverage checks count ids rather than executable patterns.
4. The real ADR roster is all draft, so sealed-history verification correctly has no
   sealed record to protect yet. This is expected pre-ratification, but the live-tree
   gate must prove the state explicitly and become non-vacuous when R-0003 activates
   records.
5. Decision-citation resolution compares bare `ADR-NNN` citations with slugged
   filenames and never loads DII headings. Its resolvable and checked sets are
   structurally disjoint on the production tree.
6. The required governance guards and T4–T6 round gates are absent from automatic
   pull-request CI. Workflow lint checks shape but not the required command roster.
7. Trace resolution accepts traversal, directories, and missing targets too weakly,
   and turns an unreadable invariant catalog into an empty passing population.
8. Scorecard freshness accepts arbitrarily small positive values and loads the
   materialized thresholds copy before canonical Architect policy, permitting stale
   failures to be downgraded out of a gating failure.

### Medium

9. The backlog’s compact disposition table says records are closed while the detailed
   inherited rows still say `Active`; BL-007 also needs its closed operational slice
   distinguished from its later population residual.
10. Forbidden-action evidence is empty for merge commits unless the diff is expanded,
    and the CLI verb exits success on findings unless `--strict` is supplied.
11. Corepack prewarm coverage is hard-coded to one workflow/four jobs and the
    repository’s second prepared pnpm version lacks an integrity digest.
12. Repository-reference action semantics remain vacuous. This is already governed by
    BL-080/R-0004 and does not authorize an R-0002 readiness claim.
13. Assertion bodies moved into `*-cases.ts` are outside the deterministic trace
    corpus. This is already governed by BL-081/R-0006 and narrows the current trace
    claim to executable wrapper markers.
14. PC-0002 Machine attribution and several early implementation fixes preceded the
    law or red tests that later governed them. Immutable history cannot be reordered;
    the exception must be disclosed and future sequencing mechanically enforced.
15. `devai init` prefers policy bytes from the adopter target over packaged canonical
    policy and copies them without schema validation.

### Low

16. Phase closure reads and dereferences operator JSON before validating its shape,
    and malformed existing closure records can crash id selection and ledger reads.
17. The ADR validator still emits obsolete `adr_id` guidance and skips later
    diagnostics after the short circuit.
18. Spec trace validation has containment, file-kind, discovery, and parse-error
    inconsistencies parallel to the sensor defect.
19. The ignored PC-0003 scratch template carries superseded DII-121, obsolete red
    coverage, and a predeclared Opus PASS. It is not candidate source, but it is unsafe
    operational input.
20. DII-138’s title and scope describe exact/fresh evidence even though the audit
    ladder and repository-reference artifact predate its final law-only commit.

## Refuted or bounded claims

- The review treated OM-003 as a runtime product-model restriction. OM-003 explicitly
  narrows only OM-002’s campaign Claude interaction selector. It does not remove
  supported Anthropic, Codex, or mock defaults from the shipped LLM abstraction.
  Finding H8 in the reconstructed report is therefore refuted.
- Draft ADRs are intentionally unsealed before R-0003. The absence of a live sealed
  record is not itself a false R-0002 state. The missing live-tree gate and broken
  citation resolver remain confirmed.
- The reference-action and assertion-body gaps were already disclosed and assigned to
  BL-080/R-0004 and BL-081/R-0006. They remain real residuals, not fresh R-0002
  completion claims.

## Required disposition

Govern confirmed defects, establish red-first contracts for each repaired enforcement
path, correct the audit/law close statements, and obtain another exact-candidate
read-only `claude-opus-5` review before push. No source or closure PR may advance on
this FAIL.

## Nonclaims

The maximum defensible claim remains: re-bound and operationally coherent; nothing
ratified, nothing released, no readiness or evidence standing. The fifth review shows
that even the operational-coherence claim requires another correction cycle before
R-0002 can close.
