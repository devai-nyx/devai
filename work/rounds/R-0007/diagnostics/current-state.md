---
id: R-0007-PROPOSED-DIAGNOSTICS
title: Current CLI surface diagnostics
type: diagnostic
status: draft
date: 2026-07-31
authority: Auditor
---

# Current-state diagnostics

> Read-only observation captured for planning. Re-verify every value at authorized entry.

## Principal finding

The implementation modules are capable, but the user-facing CLI exposes internal
subsystems as product concepts. The canonical action registry declares 147 runnable
actions: 34 porcelain and 113 plumbing. Users encounter adoption, agent, catalog, docs,
evidence, experimental, governance, inventory, policy, release, round, sensing,
specification, verification, and work-management taxonomies.

## Current defects and design pressure

- Default documentation is intentionally stale while the live registry and router are authoritative.
- The checked-in/built local binary observed during planning exposed 146 actions while source law registered 147; `policy check schemas` was absent from that binary.
- `sense migrate check` is declared read-only but applies SQL, creates migration bookkeeping, and may create roles.
- `tier1` and `baseline` expand to the same sensor batch.
- `all` and `tier3` expand to the same sensor batch.
- Sensor selection uses `set`; adoption maturity and other policy use `profile`; both terms are overloaded.
- F5 is an internal substrate name exposed as onboarding vocabulary.
- `--allow-publish` is more verbose than necessary, although the independent remote-consent boundary is sound.
- Task records can currently be created without a round, weakening the governed aggregate model.
- The current task schema expresses only optional `model_tier` values
  (`default`/`bumped`/`fallback`). It does not define an executor kind,
  runtime/provider, exact model, reasoning effort, or requested-versus-resolved
  execution contract.
- Exact family/model appears separately in prompt-composition records; skill manifests
  carry default family and agent class; wave prompt headers parse loose
  model/vendor/effort hints while agent CLI dispatch remains reserved. These fragments
  do not form one enforceable task contract.
- The runtime `TaskRecord` type does not expose the schema's optional `model_tier`,
  demonstrating schema/type/runtime drift that the executor wave must eliminate.
- Low-level DB, lock, worktree, session, and janitor commands compete with user intent.
- The action registry’s permanent-identity machinery makes retirement safe, but requires complete migration and tombstone evidence.

## Recommended diagnosis

The correction should preserve libraries and governed adapters while replacing public
subsystem navigation with workflow façades. This is a breaking grammar correction, not
only a help-page change. Documentation must become a first-class acceptance surface:
users need semantic guidance for every named category, not only generated command syntax.
The round/task correction also requires a typed executor substrate: deterministic,
agentic, human, and composite work must share containment, authority, evidence, and
failure semantics while preserving their distinct execution mechanisms.

## Current nonclaims

This diagnostic does not prove live release standing, adopter command usage, current
remote CI state, or authorization for R-0007. Those are mandatory live entry checks.

## GitHub Actions and commit-floor diagnosis (OM-021 amendment)

- `.github/workflows/ci.yml` repeats checkout, Node setup, package-manager prewarm, Corepack,
  and frozen pnpm installation in static, fast, changesets, coverage and governance jobs; the
  three round-gate jobs repeat the same setup again. No pnpm store cache is declared.
- `ci.yml` cancels superseded runs for every event under one ref-based concurrency group, while
  `round-gates.yml` is non-cancelling. Entry must distinguish feedback cancellation from
  non-cancellable main/frozen-candidate/round-close evidence.
- `round-gates.yml` and `reusable-evidence-gate.yml` already use `workflow_call`, but setup,
  permissions, identity-bearing inputs, reports, artifacts and timing are not yet one canonical
  execution contract.
- The current standing commit floor runs `pnpm vitest run` for every commit regardless of
  changed-path risk. The affected-test graph and command-closure machinery provide inputs for
  classification, but no machine command currently emits one of the four OM-021 validation
  classes with a total selected/omitted-command explanation and cold-sentinel failover.
- These observations identify candidates, not accepted savings. Live GitHub plan/features,
  cache/runner limits, required checks and paired critical-path timings remain entry-run facts.
