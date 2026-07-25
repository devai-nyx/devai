---
title: Agent disciplines
sidebar_position: 7
---

# Agent disciplines

> [Constitution Article 8](../reference/law.md) mirrors each human role to an agent discipline with the same authority constraints. The agent's session sees the same role declaration, the same path-enforcement refusals, the same gate evaluations. The difference is that the agent's controller is a model; the human's controller is themselves.

## Discipline ↔ role

| Human role | Agent discipline | Extensible?        | Singleton? |
| ---------- | ---------------- | ------------------ | ---------- |
| Owner      | owner-agent      | Yes                | No         |
| Architect  | architect-agent  | Yes                | No         |
| Inspector  | inspector-agent  | **No** (singleton) | **Yes**    |
| Engineer   | engineer-agent   | Yes                | No         |
| Auditor    | auditor-agent    | **No** (singleton) | **Yes**    |

**Inspector** is singleton to prevent sensor-calibration fragmentation: if two Inspectors graded the same test differently, the framework would have no canonical reading. **Auditor** is singleton to prevent observation-authority fragmentation: the framework cannot have two contradictory views of its own state.

Owner, Architect, and Engineer are extensible — multiple disciplines may share the parent role's authority and protocol, differing only in expertise prompts and tool access.

## Engineer subtypes

Engineer is the most-extended discipline. Common subtypes:

- **engineer-backend** — NestJS service code, Postgres migrations, server-side TypeScript.
- **engineer-frontend** — Angular component code, browser-side TypeScript, CSS / SCSS.
- **engineer-dba** — Postgres schema design, advisory locks, query optimisation. Migration patterns.
- **engineer-uiux** — Angular UI logic, accessibility, design-token enforcement.

All subtypes inherit Engineer's F2 authority (anything under `apps/`, `libs/`, `packages/`, `db/`, `iac/`). They cannot edit F1 specs, F3 tests, or F5 harness — only the spec-prompt and tool-access subset that scopes their work.

A new Engineer subtype is declared in pack config; the orchestrator dispatches subtype-aware tasks (`engineer-backend` for `apps/api/**`, `engineer-frontend` for `apps/web/**`) based on the task's `target_modules`.

## Architect specialisations

Architect specialisations are typically domain-specific:

- **architect-security** — security invariants, threat models, forbidden actions.
- **architect-data** — schema design, data-model invariants, F1×T6 cells.
- **architect-platform** — runtime stack, infrastructure invariants.

A new specialisation is declared similarly; the orchestrator dispatches by the task's domain (an Architect task touching `docs/theory/architecture/security-*` goes to architect-security if declared).

## Owner specialisations

Owner specialisations are less common but supported for repos with distinct product domains:

- **owner-revenue** — pricing, billing, customer-facing journey authorship.
- **owner-platform** — internal-tooling user stories, ops journeys.

## Discipline-to-skill mapping

Each discipline invokes a subset of the [skill catalog](../reference/skills) appropriate to its authority. For example:

- **engineer-agent** invokes `SKILL-fix-lint`, `SKILL-fix-typecheck`, `SKILL-fix-test`, `SKILL-feedback-iteration`, etc.
- **inspector-agent** invokes `SKILL-author-test`, `SKILL-verify-mutation`, `SKILL-test-weakening-check`.
- **architect-agent** invokes `SKILL-author-invariant`, `SKILL-validate-trace`, `SKILL-emit-rgr`.
- **auditor-agent** invokes `SKILL-compute-scorecard`, `SKILL-assess-state`, `SKILL-refresh-backlog`.

The mapping is enforced by the prompt-firewall mechanism ([Article 37](../reference/law.md) + the `check prompt-overlays` sensor): a skill manifest declares its `allowed_write_scopes`, and the firewall rejects any skill invocation that asks an agent to write outside its discipline's authority.

## When to add a subtype

Add a new agent subtype when the parent discipline's protocol no longer fits the work cleanly:

- Multiple Engineer subtypes converging on the same file with different rationales → the file's authority is split; consider whether the file should be refactored.
- An Architect subtype repeatedly emitting RGRs because a domain isn't covered → the constitution may need an article on that domain.
- A new domain that doesn't fit any existing discipline → file an ADR proposing the new discipline; ratify before invoking.

Adding a subtype is **cheap** (pack config + prompt template) — but adding the wrong subtype creates a discipline that competes with an existing one and surfaces as scorecard drift.

## See also

- [Constitution Article 8](../reference/law.md) — discipline rules.
- [Roles index](./index.md) — the human/discipline mirror.
- [Skill catalog](../reference/skills) — what each discipline invokes.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/agent-disciplines.md (classification CURRENT).
