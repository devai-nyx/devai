---
title: Adopters
sidebar_position: 1
slug: /adopters
---

# Adopters

> §5 is the adopter guide: install, declare a role, run the introspection, get a green scorecard, then operate the framework day-to-day. Read in the order below for a 1-hour walk-through, then use as reference.

## Curated reading order

| Step | Page                                                                                                                                                                 | Time   | Why                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 1    | [install](./install.md)                                                                                                                                              | 5 min  | Install the pinned npm package, authenticate GitHub Packages, verify adopter posture                          |
| 2    | [adoption profiles](./adoption-profiles.md)                                                                                                                          | 5 min  | Pick your tier first: tier1 gates+evidence, tier2 reference signal, tier3 supervised control (D-112/D-126)    |
| 3    | [first introspection](./first-introspection.md)                                                                                                                      | 5 min  | Brownfield path: `devai init apply-f5 --introspect`, then the seven L0 inventory sensors                      |
| 4    | [role declaration](./role-declaration.md)                                                                                                                            | 5 min  | The five-role authority model from an adopter's perspective                                                   |
| 5    | [pack resolution](./pack-resolution.md)                                                                                                                              | 5 min  | How `devai adopt pack resolve` matches your repo to a stack-adapter pack                                      |
| 6    | [CONVENTIONS](./CONVENTIONS.md)                                                                                                                                      | 10 min | The cross-repo canon: docs layout, identifiers, authority, language, work-break                               |
| 7    | [docs layout](./docs-layout.md)                                                                                                                                      | 5 min  | Your repo's `docs/` tree — what lands where, who authors it                                                   |
| 8    | [database layout](./database-layout.md)                                                                                                                              | 5 min  | Per-worktree DBs, shared template, advisory locks                                                             |
| 9    | [state layout](./state-layout.md)                                                                                                                                    | 5 min  | `record/proofs/` — what's transient, what's persisted, who writes                                             |
| 10   | [build-plan convention](./build-plan-convention.md)                                                                                                                  | 5 min  | The per-phase work/rounds/R-0001/plan.md structure adopters mirror                                            |
| 11   | [governed rounds](./governed-rounds.md)                                                                                                                              | 8 min  | Supported scratch, declaration, role-wave, and archive ceremony                                               |
| 11   | [round break](./round-break.md)                                                                                                                                      | 10 min | The round-break canon: Plan.md, prompts, logs, Closeout.md, gates                                             |
| 12   | [prompt header](./prompt-header.md)                                                                                                                                  | 5 min  | YAML frontmatter for every wave prompt (role, effort, model, vendor)                                          |
| 13   | [language policy](./language-policy.md)                                                                                                                              | 5 min  | English as the framework language; per-repo extensions                                                        |
| 14   | [thresholds](./thresholds.md)                                                                                                                                        | 5 min  | How to override scorecard thresholds in pack config                                                           |
| 15   | [sense-migrate-check](./sense-migrate-check.md)                                                                                                                      | 5 min  | Applying platform migrations against a clean Postgres                                                         |
| 16   | [lightweight CI](./lightweight-ci.md)                                                                                                                                | 5 min  | The "CI is freshness check, not value-producer" model                                                         |
| 16b  | [CI economy](./ci-economy.md)                                                                                                                                        | 10 min | Adopting ADR-CI-ECONOMY: evidence-first pipelines, the reusable evidence gate, runner economics, DB isolation |
| 17   | [scorecard N/A overrides](./scorecard-na-overrides.md)                                                                                                               | 5 min  | When (and when not) to declare F×T cells N/A on your repo                                                     |
| 18   | [mutation scenarios](./mutation-scenarios.md)                                                                                                                        | 10 min | Authoring mutation scenarios per ADR-MUTATION-SCENARIOS                                                       |
| 19   | [blueprint authoring](./blueprint-authoring.md)                                                                                                                      | 10 min | Greenfield path: Owner-authored module-blueprint, validate, plan, scaffolders                                 |
| 20   | [decisions ledger](./decisions-ledger.md)                                                                                                                            | 5 min  | The decisions ledger contract + `devai spec decision close`                                                   |
| 21   | [common pitfalls](./common-pitfalls.md)                                                                                                                              | 10 min | Operational gotchas surfaced during pilots, with workarounds                                                  |
| 22   | [migrating to 0.5](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/migrating-to-0.5.0.md)                             | 15 min | Agent-ready migration from the flat 0.4 CLI to the hierarchical 0.5 contract                                  |
| 23   | [authority enforcement migration](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/migrating-authority-enforcement.md) | 20 min | Materialize policy, migrate every mutating caller, observe shadow, and cut to binding                         |

Total: ~2.5 hours start-to-finish read. Most adopters skim sections they don't need and come back when something breaks.

## Brownfield vs greenfield

DEVAI supports two adoption paths:

- **Brownfield** — you have an existing repo. `devai init plan` previews the split bootstrap, `devai init apply-f5 --introspect --as-role architect --write` records the detected stack, `devai adopt pack resolve` selects a pack, and the seven L0 inventory sensors suggest invariants from the observed code. The first-introspection guide walks this path.
- **Greenfield** — you're starting fresh. The 15-invariant law-pack scaffold under `examples/law-pack/` is your starting point. The blueprint-authoring guide walks this path.

Both paths converge on the same operational shape: declared roles, gated merges, evidence chain, scorecard.

## Per-role views

If you know which role you'll be operating as:

- [Owner](../roles/owner.md) — business specs (journeys, use-cases) under F1.
- [Architect](../roles/architect.md) — engineering specs, invariants, contracts, ADRs under F1.
- [Inspector](../roles/inspector.md) — tests under F3.
- [Engineer](../roles/engineer.md) — code under F2.
- [Auditor](../roles/auditor.md) — read-only; reports, scorecards, backlogs.

## When you're stuck

- **Common pitfalls** — [common-pitfalls](./common-pitfalls.md) collects the operational issues most adopters hit, with workarounds.
- **`devai doctor`** — runs a self-check across all sensors; surfaces drift between config and reality.
- **RGR** — when the spec is silent or contradictory, emit an RGR via your discipline's CLI verb. Pauses your task; routes to Architect / Owner for resolution.

## See also

- [Framework reference](../theory) — what DEVAI is (the contract).
- [Roles](../roles) — authority anchors and walkthroughs.
- [Reference](../reference) — CLI, skills, schemas.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/index.md (classification CURRENT).
