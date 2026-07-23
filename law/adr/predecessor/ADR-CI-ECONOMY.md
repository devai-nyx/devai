---
adr_id: ADR-CI-ECONOMY
title: CI economy — evidence-first pipelines, trust boundaries, runner economics, DB isolation
status: accepted
date: 2026-07-10
authors: ["@aarusso"]
tags: [ci, evidence, workflows, economics, cross-repo, round-ci-economy]
---

# ADR-CI-ECONOMY — the cross-repo CI-economy law

**Authority:** Architect.
**Related:** Constitution Article 2 (control-theoretic frame), Article 16 (cycle levels), Article 17 (hard gate), Article 29 (test as sensor), Article 32 (sensor adapter uniformity / evidence), Article 36 (DEVAI applies to itself), Article 39 (explicit uncertainty over false precision). Decision-log lineage: D-101 + D-103 ("CI is a freshness check, not a value-producer"), D-114 (registry cutover that made devai/stynx public). Companion laws: [`ADR-DOCS-GOVERNANCE.md`](ADR-DOCS-GOVERNANCE.md) (rule-family precedent: one cross-repo law, one `devai check` enforcement verb), [`ADR-LOCAL-PUBLISH-WORKFLOW.md`](ADR-LOCAL-PUBLISH-WORKFLOW.md) (single-source-verb discipline this ADR extends to workflow jobs). Adopter guide: `docs/adopters/ci-economy.md`. Enforcement substrates: `devai check ci-economy` (this round) and `.github/workflows/reusable-evidence-gate.yml` (this round).

## Status

Accepted on 2026-07-10 (CI-economy round, Phase 1 / DEVAI side). The reusable workflow and the `check ci-economy` sensor ship in the same round. stynx consumes both in Phase 2 (collapse of its five duplicated `evidence-gate` jobs, DB-isolation implementation in its tier gate). PEC, TEAT and senatran adopt per the adopter guide in later rounds.

Amended 2026-07-10 (D-116): Decision 8 rule 4 (`ci-economy.evidence-gate-wired`) is now profile-conditioned — hard under the (default) `full` CI-economy profile, advisory under an explicit `ci_economy.profile: "gate-staged"` declaration in `.devai/config/project.json`. The original text made rule 4 unconditionally hard while the Consequences section promised the incremental-adoption cohort rules 1–3 only; the staging is now a mechanism, not prose.

## Context

The 2026-07 alignment cycle measured where the account's GitHub Actions spend actually went: more than 98% of it was one repository (stynx), and the spend decomposed into four independently fixable causes — macOS matrix legs running at 10× Linux pricing on every pull request; workflows with no path filters re-running everything on every docs edit; a Dependabot rebase storm re-triggering full matrices dozens of times a day; and an `evidence-gate` job hand-duplicated across five workflow files (`ci.yml`, `evidence.yml`, `docs.yml`, `reference-apps.yml`, `release-prep.yml`), each copy drifting independently.

The same cycle produced two facts that make a structural law possible now:

1. **The evidence substrate exists on both sides.** DEVAI owns a hash-chained evidence ledger (`.devai/state/evidence-chain.json`, Article 32) and a canonical local test-run recorder (`devai record-run --tier <t> --chain`) that binds a command, its exit code, its log and its git commit into a tamper-evident chain. stynx independently prototyped an evidence short-circuit (`scripts/evidence/verify-local-evidence.mjs` + the `LOCAL_EVIDENCE_TRUSTED_ACTORS` repo variable): commits carrying a valid, fresh, source-hash-bound local-CI manifest skip the heavy remote jobs. The prototype works; what it lacks is a law and a single implementation.
2. **devai and stynx are now public repos** (D-114 aftermath), so their Linux minutes are free and — decisively for this ADR — a public devai can export reusable workflows that private consumer repos (PEC, TEAT, SGP) may `uses:` reference.

One more failure class belongs in this law because it corrupts the *sensors* rather than the bill: stynx's tier gate runs 24 packages' integration suites concurrently against **one shared Postgres service container**. The cycle logged three distinct contention flakes from this (a soft-delete suite timing out at 30s, an i18n migration ECONNRESET, and flow api-matrix failures ×2). The tactical fix — inflating the timeout to 120s — treats a sensor-calibration problem as a patience problem. Per Article 29 a test is a sensor; a sensor whose reading depends on unrelated suites' load is mis-calibrated by construction, and every flake it produces erodes exactly the trust that evidence-first pipelines depend on.

The control-theoretic reading (Article 2): remote CI re-running everything on every event treats the *measurement subsystem* as free, and it is not. The framework already decided (D-101, D-103) that comprehensive measurement is produced locally by the Inspector and carried across the local/CI boundary by the evidence chain; CI's job is freshness-checking and re-verification. This ADR extends that decision from DEVAI's own repo to a cross-repo law, adds the trust boundary that makes the short-circuit safe, and prices the remaining remote runs deliberately.

## Decisions

Eight enumerated decisions. 1–2 define the evidence-first pipeline shape, 3–4 the trust boundary, 5 the runner-economics rules, 6 the DB-isolation contract, 7 the single-source reusable workflow, 8 enforcement.

### Decision 1 — Evidence-first pipelines: heavy tiers run locally and are recorded; remote CI verifies

Every governed repo classifies its CI work into two tiers:

- **Cheap deterministic gates** — lint, typecheck, build, unit tests, schema/contract validation, evidence verification. These run remotely on every push and pull request, always, on Linux runners. They are the Cycle-A/B backbone (Article 16) and are never skipped by evidence mode.
- **Heavy tiers** — integration, e2e, mutation, comprehensive coverage, perf. These run **locally**, are recorded via `devai record-run --tier <tier> --cmd <cmd> --chain` (or, transitionally, a repo-local recorder emitting an equivalent SHA/source-bound manifest), and the resulting records are **committed with the PR**. Remote CI verifies the evidence instead of re-running the work.

The evidence record binds: the command, the exit code, the captured log, the tier, the timestamp, and the git commit of the tree it ran against; `--chain` appends the record to the Article 32 hash chain so it cannot be silently rewritten later.

### Decision 2 — Fallback semantics: the gate never silently opens

The evidence gate has exactly three outcomes, and none of them is "quietly skip":

1. **No evidence claimed** → `evidence_mode=false` → remote CI runs the heavy tiers itself, exactly as a pre-law pipeline would. Absence of evidence is not a violation; it is the fallback path, and it must remain fully wired (the heavy jobs stay in the workflow, gated by the output, never deleted).
2. **Evidence claimed and valid** (fresh, bound to this commit/tree, required tiers green, actor trusted, no policy-sensitive paths touched) → `evidence_mode=true` → heavy jobs skip with an explicit, visible SKIPPED status attributable to the gate's output.
3. **Evidence claimed but invalid** — stale, wrong commit/tree, missing required tier, failed tier, untrusted actor, or touching forbidden paths — → the gate job **fails the workflow**. A false evidence claim is a governance violation and must surface loudly (Article 39: explicit uncertainty, never silent); it does not degrade to case 1, because degrading would make a forged-but-sloppy claim cost nothing.

### Decision 3 — Trust boundary: SHA-bound, actor-listed, age-limited, path-guarded

Evidence mode is only as safe as its trust boundary. Four conditions, all mandatory:

1. **Commit binding.** Evidence must bind to the exact tree it claims to cover — by commit SHA, by a source-tree content hash, or both. Evidence for any other tree is invalid for this one.
2. **Trusted-actor allowlist.** Only commits pushed by actors on an explicit allowlist (repo variable `LOCAL_EVIDENCE_TRUSTED_ACTORS`, or the reusable workflow's `trusted-actors` input) may enter evidence mode. The list names humans/bot identities whose local environments are governance-audited; an empty or absent list disables evidence mode entirely.
3. **Freshness.** Evidence carries a max age (default 24 hours). Older evidence is invalid (case 3 above), because the toolchain underneath it may have moved.
4. **Policy-path guard.** A commit that modifies the CI workflows, the evidence tooling, or the trust configuration itself cannot ride evidence mode — those changes always run full remote CI. Otherwise the gate could be weakened in the same commit that exploits the weakening.

### Decision 4 — Scheduled full remote audit: trust, but re-measure weekly

Every repo using the evidence short-circuit MUST carry a scheduled **audit workflow** that re-runs all heavy tiers remotely, for real, ignoring evidence mode:

- **Cadence: weekly** (plus `workflow_dispatch` for on-demand runs). Not daily — a daily full matrix is precisely the spend this law removes, and Decision 5(iv) forbids it.
- **Quiescence guard.** If no new commits landed on the audited branch since the last successful audit, the audit exits green without running the tiers. This keeps the framework quiescent when integration is quiet (the same disposition Article 34 imposes on the Auditor) and keeps the cron from becoming scheduled waste.
- **Revocation on red.** An audit failure means local evidence and remote reality have diverged: the repo MUST treat the short-circuit as revoked (empty the trusted-actor list or set the gate to force-run) until the audit is green again. Trust is re-earned by a green full run, not by the next green local manifest.

This is the loop's periodic sensor recalibration: the short-circuit is an inference ("local evidence predicts remote green"), and the audit is the experiment that keeps the inference honest.

### Decision 5 — Runner economics: four pricing rules

1. **No macOS runners in any workflow triggered by `pull_request`.** macOS minutes bill at 10× Linux. Platform-specific legs live behind `workflow_dispatch`, `release` events, or the weekly audit — never in the per-PR hot path. (A repo whose *product* is macOS software may write a documented exception ADR; none of the governed repos qualifies.)
2. **Every `pull_request`-triggered workflow declares a `concurrency` group with `cancel-in-progress: true`.** A superseded push must cancel the superseded run. This is also the structural fix for rebase storms (Dependabot or otherwise): N rapid pushes cost ~1 run, not N.
3. **Path filters wherever content is not gate-consumed.** Workflows whose gates do not read a class of files (`paths-ignore: ['**.md', 'docs/**']` being the canonical case) MUST filter it. The inverse also binds: repos where prose *is* a tested artifact (DEVAI itself — `sense docs-drift` reads README/CLAUDE.md/CONSTITUTION.md, `docs links` walks `docs/`, the action-coverage contract pins `docs/reference/cli/` byte-identity) MUST NOT add filters that blind the gates. Path filtering is a judgment rule: the sensor (Decision 8) reports it as advisory, not hard-fail.
4. **No daily crons, and no cron that fails by design.** Scheduled workflows run at most weekly, and every scheduled workflow must be able to exit green when its preconditions are absent (missing secret → explicit green skip with a notice, not a red run). A cron that is red every morning trains humans to ignore red — sensor damage worse than the minutes it burns.

### Decision 6 — DB isolation for concurrent integration tiers

**Contract: two test suites that may execute concurrently MUST NOT share a mutable database.** Either implementation satisfies the contract:

- **(a) Per-package ephemeral databases.** The tier orchestrator provisions one database per package (or per suite) — created from a migrated template (`CREATE DATABASE <pkg_db> TEMPLATE <tpl>`) or migrated from empty — injects the connection into that suite's environment, and drops it afterwards. DEVAI's own substrate already carries the pattern (`devai db provision`, per-worktree databases, the shared-template rebuild verb); stynx's Phase-2 implementation applies it inside its tier gate against the single CI Postgres *service* (many databases, one server — the isolation unit is the database, not the container).
- **(b) Serialized DB-heavy suites.** Suites that touch the database run with concurrency 1 (non-DB suites still parallelize freely). Correct, simpler, slower — acceptable where the DB-heavy subset is small.

What does **not** satisfy the contract: inflating timeouts (stynx's soft-delete 30s → 120s masked contention rather than removing it — three distinct flake classes in one cycle: soft-delete timeout, i18n ECONNRESET, flow api-matrix ×2), retry-on-flake wrappers, or quarantining the victims (Article 31 quarantine is for genuinely non-deterministic tests, not for tests made non-deterministic by a shared-resource design choice). Per Article 29, a reading that depends on unrelated suites' load is a mis-calibrated sensor; contention flakes also poison the evidence chain this law depends on — a "local green, remote flake" history is indistinguishable from untrustworthy evidence.

### Decision 7 — One reusable evidence-gate workflow, exported by DEVAI

DEVAI exports `.github/workflows/reusable-evidence-gate.yml` (`on: workflow_call`) as the **single implementation** of the evidence gate. Consumer repos reference it:

```yaml
evidence-gate:
  uses: devai-nyx/devai/.github/workflows/reusable-evidence-gate.yml@main
```

and gate heavy jobs on `needs.evidence-gate.outputs.evidence_mode != 'true'`. Consumer repos MUST NOT maintain per-workflow copies of the gate job — the same single-source discipline ADR-LOCAL-PUBLISH-WORKFLOW Decision 1 imposes on the publish verb, for the same reason: a gate fix must ship to every consumer as one commit in one repo, not as N hand-synchronized edits (stynx's five drifting copies are the exhibit). devai is a public repo, so private consumers can `uses:`-reference the workflow without access configuration. Consumers pin `@main` or a SHA per their own pinning policy; the workflow's interface (inputs/outputs) is a published contract and changes to it are breaking changes handled like any other DEVAI release surface.

### Decision 8 — Enforcement: `devai check ci-economy`

A new policy-firewall verb, `devai check ci-economy`, validates a repo's `.github/workflows/` against the law's **mechanical** rules, hard-fail on violation:

1. `ci-economy.concurrency-cancel` — every `pull_request`-triggered workflow declares `concurrency` with `cancel-in-progress: true` (Decision 5.2).
2. `ci-economy.no-macos-on-pr` — no macOS runner reference reachable from a `pull_request` trigger (Decision 5.1).
3. `ci-economy.no-triple-trigger` — no workflow triggered by all three of `pull_request` + `push` + `schedule` (the same content billed three ways; audits are separate schedule-only workflows per Decision 4).
4. `ci-economy.evidence-gate-wired` — at least one workflow wires the evidence substrate: a `uses:` of the reusable gate, an `evidence-gate` job, a local-evidence verifier invocation, or an evidence-chain verification step (Decisions 1–2). **Severity is profile-conditioned** (amended by D-116): this rule is hard only when the repo is on the **full** CI-economy profile — `ci_economy.profile: "full"` in `.devai/config/project.json`, which is also the default when the key (or the file) is absent, so the rule stays strict unless a repo explicitly declares otherwise. A repo on the incremental-adoption path declares `ci_economy.profile: "gate-staged"`, which downgrades this rule — and only this rule — to **ADVISORY**: the finding is still evaluated and still reported on every run, never silently dropped. `gate-staged` is a staging declaration, not an exemption: graduating to `full` is expected as soon as the repo wires the gate (adopter-guide step 2), and the declaration lives in the tracked config file precisely so the staging state is a visible, reviewable fact rather than something implied by prose. Rules 1–3 are hard under both profiles.

Judgment rules — path-filter opportunities, cron cadence, macOS cost outside PR paths, the existence of a scheduled audit, shared-DB service heuristics — are emitted as **advisory** findings (exit 0), because their correct resolution depends on what the repo's gates consume (see Decision 5.3's inverse case). Per Article 36 the verb runs against DEVAI's own workflows in DEVAI's own CI.

## Consequences

- The per-PR remote bill for a compliant repo collapses to the cheap deterministic tier plus one small gate job; heavy compute happens once, locally, instead of N times remotely — and is *recorded* instead of re-derived, strengthening the Article 32 audit trail rather than weakening it.
- The weekly audit converts "we skipped the heavy tiers" from an act of faith into a bounded inference with a measured re-grounding cadence; the price is one full matrix per active week per repo.
- stynx Phase 2 deletes five hand-copied gate jobs for five one-line `uses:` references; future gate-policy changes ship from devai as single commits.
- The DB-isolation contract removes the contention-flake class at its root, which also protects the evidence short-circuit's credibility (flaky remote reruns would otherwise keep "disproving" honest local evidence).
- New failure surface, accepted deliberately: a compromised trusted actor or a stale-toolchain local environment can push green evidence for a tree remote CI would have failed. Bounded by Decision 3 (SHA binding, 24h age, path guard), detected by Decision 4 (weekly audit + revocation), and no worse than the pre-existing trust already placed in those same actors' merge rights.
- Repos not yet on the evidence substrate (PEC, TEAT, senatran) adopt incrementally through the Decision 8 mechanism, not through prose sequencing: each declares `ci_economy.profile: "gate-staged"` in its `.devai/config/project.json`, which keeps rules 1–3 hard immediately while rule 4 reports as advisory; wiring the gate (adopter-guide step 2) and flipping the declaration to `"full"` (or deleting it) completes adoption. A repo that has made no declaration is held to the full profile — the staging state is a tracked, reviewable config fact, never an implicit one.

## Alternatives Considered

- **Keep per-repo gate copies, publish a template.** Rejected: templates drift the moment they are pasted — stynx's five copies *were* the template experiment. Single-source `workflow_call` is what makes fixes atomic.
- **Self-hosted runners to make heavy tiers cheap remotely.** Rejected for now: trades a billing problem for an ops + security-surface problem (public repos + self-hosted runners is a hostile-PR execution vector); revisit only if local-evidence discipline proves unsustainable.
- **Daily full audit instead of weekly.** Rejected: the audit's purpose is re-grounding trust, and the cycle's data shows drift is measured in weeks, not hours; daily re-runs would recreate the spend this law removes (Decision 5.4).
- **Silent fallback on invalid evidence (degrade case 3 to case 1).** Rejected: it prices a forged or sloppy evidence claim at zero and hides the signal that the trust boundary was probed (Article 39).
- **Fixing contention with bigger timeouts / retries / quarantine.** Rejected as sensor falsification in slow motion; see Decision 6.
- **One shared Postgres with per-suite schemas instead of per-suite databases.** Rejected as the default: schema-level isolation leaks through extensions, roles, sequences and cross-schema grants, and diverges from the production shape the migrations assert; the database is the smallest unit that keeps migrations byte-identical to production. (A repo may still choose it via an exception ADR if its migrations are schema-scoped by design.)

## Affected Rules

- **New rule family `ci-economy.*`** (hard: `concurrency-cancel`, `no-macos-on-pr`, `no-triple-trigger`; hard under the `full` profile / advisory under `gate-staged` (D-116): `evidence-gate-wired`; advisory: path-filter, cron-cadence, macos-cost, scheduled-audit, db-isolation heuristics) — enforced by `devai check ci-economy`, profile read from `project-config.ci_economy.profile`.
- **Extends** the D-101/D-103 lightweight-CI doctrine from DEVAI-repo practice to cross-repo law (`docs/adopters/lightweight-ci.md` remains the DEVAI-shape reference; `docs/adopters/ci-economy.md` is the adoption guide for this law).
- **Interacts with** ADR-DOCS-GOVERNANCE rule 8 (`no-ci-publish`): docs publishing stays a local act; this ADR does not reopen it.
- **Does not amend** the Constitution: Articles 16/17 gate semantics are unchanged — what moves is *where* the heavy sensors execute and how their readings travel (Article 32), which was already F5 policy territory.
