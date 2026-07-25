---
id: R-0002-CLAUDE-OPUS-CLOSE-REVIEW-6
title: Sixth Claude Opus 5 exact-candidate close review
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [exact read-only claude-opus-5 review of d21a3f2c3345dfb1d235292562b6ad152110bfbf]
---

# Sixth Claude Opus 5 exact-candidate close review

## Invocation boundary

The review ran through literal `claude-opus-5`, effort `max`, plan permission mode, no
session persistence, and read-only repository tools. Edit, write, notebook, web-fetch,
and web-search tools were disabled. No fallback selector and no Fable model were used.
One attempted shell write to Claude's plan directory was denied by the configured
read-only tool boundary; no repository or disk mutation occurred.

Exact base: `cc0084ba38fb6d583f79fddd38554524714c4fa4`.

Exact candidate: `d21a3f2c3345dfb1d235292562b6ad152110bfbf`.

## Verdict

**FAIL.** The candidate may not advance to push or exact-SHA remote checks.

## Actionable findings

### High

1. The ignored PC-0003 template carries nonexistent batch commit
   `0b374c9cde9471440d290153c387509b9b5eca23`; the actual commit is
   `0b374c9f8ef82768eb421344853592498c09aeb7`. Production `closePhase`
   validates length but not that a supplied batch identity resolves to a Git commit,
   so it could emit false immutable provenance.

### Medium

2. The as-built audit boundary points to the fourth correction rather than the fifth,
   its provenance stops at review 3, and closing posture still requires the fifth
   review rather than the next seventh review.
3. The pnpm 10.0.0 integrity identity has no recorded derivation or local preparation
   execution. Listing alone does not prove the remote prewarm step will succeed.

### Low

4. Ordinary `validateTrace` checks only nonempty paths rather than using the shared
   contained executable-test primitive.
5. `FORBID-MUTATE-INVARIANTS` applies `.every()` to a possibly empty protected-path
   array; vacuous truth can suppress forbidden message evidence on an unrelated-path
   commit.
6. `--strict` help claims the default exits success on findings, while implementation
   already exits nonzero for findings and coverage gaps regardless of the flag.

## Confirmed repairs and boundaries

The reviewer independently confirmed the fifth-review Constitution,
committed-history, decision-resolution, automatic-CI, trace-sensor, freshness,
backlog, Corepack-roster, bootstrap-policy, closure-shape, ADR-diagnostic,
reference-regeneration, role-purity, later-residual, and nonclaim boundaries. It
re-derived all 155 repository-reference locators and the 34-invariant/119-test trace
population.

## Required disposition

Govern and repair BL-107 through BL-112 red-first and role-purely. Reopen DII-140,
regenerate deterministic projections, rerun exact-candidate checks, and obtain a fresh
read-only `claude-opus-5` review before push.

## Nonclaims

The maximum defensible claim remains: re-bound and operationally coherent; nothing
ratified, nothing released, no readiness or evidence standing.
