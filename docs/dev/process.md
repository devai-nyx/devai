---
title: Dev process
sidebar_position: 3
---

# Dev process

> How DEVAI is itself developed. Session boundary, round-break canon, per-batch verification, the five roles applied to this repo.

## Session boundary

Every contributor session opens with role declaration. The role determines authority (per [Article 6](../reference/law.md)). For DEVAI's own development:

- The repo's `CLAUDE.md` establishes the session-start protocol for Claude Code sessions.
- The repo's `AGENTS.md` does the same for other agents.
- Both are loaded at session start and require role declaration before any
  non-read action. DEVAI mechanically enforces the declaration for mutations
  crossing its CLI/runtime boundary; unrestricted shell/editor/agent writes
  remain advisory unless a verified host adapter is declared.

Cross-role work requires **a session boundary**: commit, declare a new role, then continue. Do not silently switch authority. This is the practical enforcement of [Article 10](../reference/law.md)'s within-iteration separation rule.

## The round-break canon

DEVAI's own work is organised into **rounds**. Each round:

- Has a committed `work/rounds/R-NNNN/plan.md` declaring goal + scope + waves.
- Has `work/rounds/R-NNNN/prompts/00-orchestrator.md` declaring gates + dispatch sequencing.
- Has per-wave governed prompts under `work/rounds/R-NNNN/prompts/`.
- Keeps runtime wave logs and composer closeout under ignored
  `.devai/state/round-runs/R-NNNN/`.
- Keeps attributable observations under `work/audit/R-NNNN/` and machine closure
  under `record/proofs/compliance/closures/`.

The full canon lives at [adopters/round-break](../adopters/round-break.md). DEVAI eats its own dogfood here: R14 itself (the round that established the published IA) used the canon and produced these very artifacts.

## Per-batch verification

At minimum, run the four fast local gates before declaring a sub-batch ready:

1. `pnpm lint` — ESLint.
2. `pnpm typecheck` — `tsc -b && tsc --noEmit -p tsconfig.typecheck.json` (two-pass).
3. `pnpm test` — unit suite.
4. `pnpm test:integration` — integration suite (the only suite that walks the CLI surface end-to-end; Phase 37 finding).

The close chain is wider: deterministic merged coverage, regression, contract,
smoke, supported E2E, experimental containment, trace, action coverage,
documentation governance, and authority-mutator checks also bind the final
candidate. Sensor readings are evidence, not substitutes for the commands they
claim to observe.

See [framework/test-policy](../theory/framework/test-policy.md) for the policy framing including the Phase 33 IO-shape heuristic for coverage estimation.

## The five roles in DEVAI's own development

Per [Article 7](../reference/law.md), every commit on DEVAI declares a role. Practical examples:

- **Owner** — declares product intent, mandates, journeys, use cases, and
  publication authority.
- **Architect** — owns invariants, contracts, ADRs, governance, and reference
  documentation.
- **Inspector** — owns tests and adversarial acceptance contracts.
- **Engineer** — owns production code, scripts, workflows, and implementation
  fixes within the approved reference.
- **Auditor** — observes independently and may write only the constitutionally
  enumerated audit/attestation paths. A verified post-merge host adapter can
  derive the bounded automatic observation transition without fabricating a
  human Auditor declaration.

## Round naming and sequencing

DEVAI uses two parallel numberings:

- **Phases** (0 through 39 at time of writing) — substrate-level work. Each phase is a coherent set of capabilities (e.g., Phase 4 — sensor execution; Phase 13 — user docs).
- **Rounds** — work organised through the round-break canon after phase
  numbering closed. Query `work/rounds/R-0001/plan.md` and `work/rounds/` rather than relying
  on a prose endpoint count.

The [build plan](./round-ledger.md) records the current phase + recent rounds with their closing commit SHAs.

## Contributor onramp

A new contributor:

1. Reads `CLAUDE.md` at the repo root.
2. Reads [Constitution](../reference/law.md) end-to-end (~30 min).
3. Reads [adopters/round-break](../adopters/round-break.md) (round-break canon).
4. Reads the current [build plan](./round-ledger.md) Status section.
5. Picks an open task from the [decision log](../reference/decisions-index.md) (look for "TBD" or "follow-up" entries).
6. Declares their role at session start. Proceeds.

The path-rewrite scripts under `scripts/` are reusable; adopters migrating from constitution 0.1.1 to 0.2.0 can study them as a worked example.

## See also

- [`CONTRIBUTING.md`](./contributing.md) — the practical contributor workflow.
- [Build plan](./round-ledger.md) — current phase + recent rounds.
- [Decision log](../reference/decisions-index.md) — design rationales.
- [Adopters → round break](../adopters/round-break.md) — full round-break canon.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/dev-process.md (classification CURRENT).
