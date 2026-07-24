---
title: Roles
sidebar_position: 1
slug: /roles
---

# Roles

> [Constitution Article 7](../reference/law.md) declares five human roles. Each role has a corresponding agent discipline (Article 8) with the same authority constraints. The authority chain (Article 9) governs how roles defer to one another when artifacts contradict.

## The authority chain

[Article 9](../reference/law.md): **Human > Constitution > Architect/Owner > Contracts > Engineer.**

Closer-to-code documents lose against higher-level documents when they contradict. A function-level docstring that contradicts an architecture ADR loses; an ADR that contradicts the Constitution loses; the Constitution itself loses only to the human Architect operating outside any session via `devai adopt upgrade`.

**This rule prevents the canonical failure mode of agents rewriting high-level documents to match code they have written.**

## The five roles

| Role | F-substrate authority | What you author | What you may NOT touch |
|---|---|---|---|
| [Owner](./owner.md) | F1 business tier | Journeys, use-cases, business rules, glossary terms (joint with Architect) | F1 engineering tier, F2 code, F3 tests, F5 harness |
| [Architect](./architect.md) | F1 engineering tier | Invariants, contracts, ADRs, ops specs, security specs, glossary (joint with Owner), README, BUILD-PLAN | F1 business tier, F2 code, F3 tests, F5 harness (except via `devai adopt upgrade`) |
| [Inspector](./inspector.md) | F3 tests | All `*.spec.ts` / `*.test.ts` / `tests/` / `e2e/` | F1 specs, F2 code, F5 harness |
| [Engineer](./engineer.md) | F2 code | All source under `apps/`, `libs/`, `packages/`, `db/migrations/`, `db/seeds/`, `iac/`, root build scripts | F1 specs, F3 tests, F5 harness |
| [Auditor](./auditor.md) | Read-only on all substrates | Reports, scorecards, backlogs, status assessments | Any commit that modifies F1, F2, F3, or F5 |

Each role's walkthrough page covers the operational details: what the role's session looks like, which CLI verbs are role-typical, common failure modes, and how the role interacts with the others.

## Session-boundary rule (Article 10)

**Within a single loop iteration, no discipline may both set its own reference and actuate against it.**

- Architect may not edit code.
- Engineer may not edit tests.
- Inspector may not edit specifications.

Cross-substrate work in a single task is therefore impossible by design. Coordinated cross-role work uses the [coupled-triplet pattern](./cross-role-coordination.md).

## Coupled triplets (Article 24)

Work that spans the authority chain is grouped into coupled triplets: an Architect task producing invariant changes, an Inspector task producing tests for those invariants, and an Engineer task producing code satisfying those tests. The three tasks share a `coupled_task_group` ID in the backlog.

Triplet branches pipeline along the authority chain (Architect → Inspector → Engineer). Merge order respects the chain. Locks are per-task; checkpoints synchronise across the pipeline.

The full mechanism is at [cross-role coordination](./cross-role-coordination.md); the binding articles are 24-26.

## Agent disciplines

Each human role has a corresponding agent discipline with the same authority constraints (Article 8). Agent disciplines may be specialised — Engineer subtypes for Backend, Frontend, DBA, UI/UX — but specialisations share the parent discipline's authority and protocol; they differ only in expertise prompts and tool access.

**Inspector and Auditor are non-extensible singleton disciplines**, to prevent sensor-calibration fragmentation and observation-authority fragmentation respectively. Owner, Architect, and Engineer are extensible.

See [agent disciplines](./agent-disciplines.md) for the discipline-to-skill mapping.

## How to declare your role

At session start, declare your role in the prompt you give the agent (or in the human-facing tool you're using). The harness records the declaration in `record/proofs/agent-runs/<run-id>.json`; subsequent writes are checked against the role's authority enumeration.

In practice: most adopter tooling auto-detects role from filesystem context (a session opening files under `apps/` defaults to Engineer; one opening `docs/theory/architecture/` defaults to Architect), but the declaration is explicit when ambiguous.

## See also

- [Constitution Articles 7-10](../reference/law.md) — roles, agent disciplines, authority chain, session boundary.
- [Substrates](../theory/framework/substrates.md) — F1-F5 with authority anchors.
- [Loop](../theory/framework/loop.md) — how roles interact through cycle stages.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/index.md (classification CURRENT).
