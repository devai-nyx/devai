---
adr_id: ADR-002
title: Real publish path — act-tier authority, session-grant, branch hygiene
status: accepted
date: 2026-05-24
authors: ["@aarusso"]
tags: [round-5, publish, act-tier, git, gh, session-grant]
---

# ADR-002 — Real publish path: act-tier authority, session-grant, branch hygiene

**Authority:** Architect.
**Related:** Constitution Articles 6 (authority), 17–19 (gates), 25 (locks), 32 (evidence chain), 36 (self-application). D-38 (permission-tier ladder: read / write / act). ADR-001 (autonomous loop — the first `SKILL-commit-push` consumer). DEC-0002 (verify-publish write-side ledger integration, R5-W1). Non-DEC follow-up #2 (R4 Closeout).

## Status

Accepted on 2026-05-24 (R5-W2).

## Context

R4 shipped the round-execution substrate: `SKILL-round-execute` composes audit → backlog → orchestrate → verify-publish in-process. The chain terminates at `verify-publish` with a materialized `Closeout.md` but does **not** commit, push, or open a PR. A human runs `git`/`gh` by hand at every round close.

This breaks the substrate's value proposition at the last mile. The whole point of the round canon is that a round closes itself when its gates are green; if the operator must hand-drive the commit/push/PR steps, the substrate is a recipe-emitter, not an executor.

The constraint that makes this hard: pushing and PR-opening mutate **remote state** the framework cannot easily unwind. Per D-38, `act` is the highest permission tier in the read / write / act ladder; the runtime currently refuses to load any skill whose tier exceeds the session grant. As of R5, **zero** skills declare `act` — the ladder is unused.

R5-W2 lands the first `act`-tier capability. This ADR records the decisions; R5-W3 wires the session-grant CLI surface; R5-W5 lands the integration tests.

## Decisions

### 1. Per-invocation tier escalation, not per-manifest declaration

`SKILL-commit-push` keeps `permission_tier: write` in its manifest. The `act`-tier capability is **conditional on inputs.push === true** at runtime, not declared statically. Rationale:

- Static `permission_tier: act` would force every invocation through `act`-tier enforcement even for the common case of "commit only, no push." That regresses ergonomics for the autonomous-loop consumer (ADR-001 §8) that has used the skill since Phase-9 with `write` semantics.
- Dynamic escalation matches how D-38 was actually written: "the runtime refuses to load a skill whose tier exceeds the session grant." A skill's declared tier is the *ceiling*; a particular invocation may operate beneath it.
- Single-skill multi-tier is reviewable: the same code path declares its escalation explicitly via the input shape.

The session-grant check (W3) happens at the CLI layer in the skill-run command, gating on `--allow-publish` regardless of the skill's manifest tier. The manifest stays `write`.

### 2. Session-grant model: `--allow-publish` opt-in per CLI session

W3 will add a `--allow-publish` flag to `devai skill-run`. When present, the flag sets `SkillContext.grants.publish = true`. `SKILL-commit-push` checks `ctx.grants?.publish === true` before honoring `inputs.push === true`; absent the grant, the skill returns `status:fail` with a usage hint.

The grant is **per-CLI-invocation**, not persistent. Each `skill-run` call independently requires the flag. Rationale:

- A persistent grant (in a config file or env-var) would mean "any future command in this session can push," which is the classic confused-deputy footgun.
- Per-invocation matches the kerberos-ticket pattern: one acquisition, one use, no expiration concerns.
- The flag is unambiguous in shell history and audit logs — `grep allow-publish` over a transcript surfaces every push attempt.

### 3. Default `publish: false` across the composer chain

`SKILL-round-execute` accepts `inputs.publish` and forwards it to `SKILL-round-verify-publish`, which forwards it to `SKILL-commit-push`. **Default is false at every layer.** A round closes with `Closeout.md` materialized but no commit/push/PR unless the operator opts in.

Rationale: the round substrate must be safe to dogfood. A first-time user running `devai skill-run SKILL-round-execute --inputs-file foo.json` MUST NOT accidentally publish a round to the remote. The flag must be explicit at composer-level, and the `--allow-publish` session-grant adds a second confirmation.

### 4. Branch hygiene: refuse dirty + refuse non-fast-forward, allow ahead-of-origin

Before any commit, `SKILL-commit-push` checks:

1. **Working tree is clean of unstaged changes outside `inputs.files`.** Refuse if any tracked file has unstaged modifications and is not in the `files` list. (Untracked files outside `inputs.files` are tolerated — they're explicitly out of scope.)
2. **Current branch fast-forward-merges to its upstream without conflict.** If the local branch has diverged from `origin/<branch>` (i.e., `git merge-base --is-ancestor` fails the other direction), refuse — the operator must rebase first.

**Crucially: "ahead of origin" is NOT a refusal condition.** The expected pre-push state is "local branch has N commits not on origin." Refusing that would block the very operation the skill exists to perform. This very repo is +N at every round close.

### 5. Final gate re-run at commit time

When `inputs.push === true`, the skill runs the 5 `MANDATORY_MIN_GATES` (lint, typecheck, test, docs-links, action-coverage) one final time **immediately before** the commit. Any red gate aborts the commit with `status:fail`.

Rationale: between `SKILL-round-verify-publish`'s gate-rerun and the actual push, the operator may have edited a file (e.g., touched up `Closeout.md`). The commit-time rerun catches that. Cost: ~30-60s for the gate suite; cheap insurance against a broken HEAD landing on `origin`.

For commit-only (no push), the gate re-run is opt-in via `inputs.run_final_gates: true`. Rationale: many use cases (the autonomous loop's `WIP: iter-N` commits) don't need a full gate re-run at every commit.

### 6. Dry-run mode mandatory

`inputs.dry_run: true` short-circuits every mutation. The skill returns `status:pass` with `evidence.commands: string[][]` listing the would-be `git`/`gh` commands. No filesystem state mutates, no remote state mutates.

Rationale: integration tests need a deterministic, side-effect-free mode. Operators need a way to preview what a real publish would do. Dry-run satisfies both.

### 7. `gh` CLI is the PR-open mechanism

When `inputs.open_pr === true` (requires `inputs.push === true`), the skill shells to `gh pr create --title <derived> --body-file <closeout-path>`. Title is derived from the closeout's first H1; body is the closeout file itself.

Rationale: every realistic DEVAI deployment already has `gh` (it's a hard CI dependency for many adopters). Reimplementing PR-open over the GitHub REST API would duplicate authentication, retry, and CI-detection logic that `gh` already handles correctly.

**Failure mode:** if `gh auth status` returns non-zero at skill start, the skill returns `status:fail` with a usage hint pointing at `gh auth login`. Dry-run mode skips the auth check (it doesn't actually invoke `gh`).

### 8. Sequential, not concurrent

`SKILL-commit-push` does not parallelize `git push` across remotes or PR-create across forks. The skill operates against `origin` only and the current branch only. Multi-remote / triangular-workflow scenarios are out of scope.

Rationale: composer concurrency (Non-DEC #1) is a separate ADR. The publish path's sequential semantics are independently correct and shippable today.

## Consequences

**Positive:**
- The round substrate becomes truly end-to-end. R6 dogfood can run `SKILL-round-execute --allow-publish` and produce a real commit + push + PR.
- D-38's `act` tier finally has a user. The runtime's tier-enforcement ladder is exercised, not theoretical.
- Default-false posture means existing consumers (the autonomous loop) see no behavior change.
- Dry-run mode enables deterministic integration tests against ephemeral git fixtures (R5-W5).

**Negative / Trade-offs:**
- Per-invocation tier escalation is less ergonomic to audit than per-manifest declaration. A reviewer asking "which skills can push?" must grep for `ctx.grants` consumers, not just manifest fields.
- The `gh` CLI dependency is now a hard requirement for the full publish path. Operators without `gh` get a `status:fail` and a hint. Dry-run mode still works (it doesn't invoke `gh`).
- A 30-60s gate re-run at commit time slows down each publish operation. Acceptable insurance; not a hot path.

## Alternatives Considered

1. **Static `permission_tier: act` on the manifest.** Rejected per decision 1 — would regress the autonomous loop's existing `write`-tier usage.
2. **Persistent session grant in `.devai/config/grants.json`.** Rejected per decision 2 — confused-deputy footgun.
3. **Bypass `gh` and use the GitHub REST API directly.** Rejected per decision 7 — duplicates auth/retry/CI-detection logic for no benefit.
4. **Auto-rebase on non-fast-forward.** Rejected — silent rebase on push is a known footgun (rewrites history without operator review). Refuse + delegate to operator.
5. **Defer to a separate `SKILL-push` + `SKILL-open-pr`.** Rejected — three skills coupled by a fragile chain. One skill with optional capabilities is testable as one unit; the inputs declare the intent.

## Affected Rules

- **D-38** (permission-tier ladder) — `SKILL-commit-push` becomes the first runtime user of `act` tier (per-invocation).
- **Constitution Article 6** (authority) — the publish path is `engineer`-authority (modifies code, opens PR) but `act`-tier (mutates remote). Authority-role and permission-tier are orthogonal axes; this is the first skill that exercises both at their highest values.
- **Article 32** (evidence chain) — every publish invocation persists `git`/`gh` command shapes + outputs to `.devai/state/skills/SKILL-commit-push/<run-id>.json`. Dry-run runs emit the same evidence shape with `mode: "dry-run"`.

## Next Steps

- **R5-W3:** Wire `--allow-publish` CLI flag → `SkillContext.grants.publish`. Integrate `SKILL-commit-push` into `SKILL-round-verify-publish` behind `inputs.publish === true`. Thread grants through `SKILL-round-execute` composer.
- **R5-W5:** Integration tests against ephemeral git fixtures (`mkdtempSync` + `git init`). Assert dry-run command shapes; assert refusal on dirty tree + non-FF.
- **R6 (dogfood):** First non-synthetic round driven by `SKILL-round-execute --allow-publish`. Per the R5 plan, R6 will be a small adopter improvement (e.g., per-skill autofix upgrade for `SKILL-fix-docs-links`).
