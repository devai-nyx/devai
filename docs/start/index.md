---
title: DEVAI
sidebar_position: 1
slug: /
---

# DEVAI

> **A human-supervised governance and control harness for AI-assisted software
> development on a declared stack.** DEVAI treats software development as a
> discrete-time control system: documents are the reference signal, code is the
> plant under control, tests are sensors, humans or explicitly operated agents
> actuate, and DEVAI constrains that actuation through authority, gates, and
> auditable evidence.

## Who is this site for?

Pick the entry point that matches what you came here to do.

| You want to… | Start at |
|---|---|
| **Understand the theory** — why DEVAI uses control-theoretic vocabulary literally, not metaphorically | [§2 Theory](../theory/) — the metaphor map plus the unified theory document |
| **Adopt DEVAI in your repo** — install, declare a role, run the introspection, get a green scorecard | [§5 Adopters](../adopters/) — install → first introspection → packs → operations |
| **Operate as a role-holder** (Owner / Architect / Inspector / Engineer / Auditor) | [§4 Roles](../roles/) — authority chain, per-role walkthroughs, coupled-triplet coordination |
| **Reference a verb, skill, schema, or sensor** | [§6 Reference](../reference/) — auto-generated CLI / skills / schemas, plus scripts and examples |
| **Contribute to DEVAI itself, or audit its self-application** | [§7 Meta](../meta/) — Article-36 surface: self-scorecard, test matrix, dev process, build plan |

## Status

The current constitutional, package, authority, and lifecycle posture is
recorded on the [status page](status.md). Live action and skill inventories come
from `devai catalog actions` and `devai agent skill list`; schemas and tests are
queried from their registries rather than frozen as prose counts.

DEVAI applies itself per Article 36. The
[self-scorecard](../meta/self-scorecard.md) is current only when its displayed
subject, render, and deployment provenance passes the exact-SHA freshness
contract; missing or stale evidence remains visibly non-promoting.

## What this is

DEVAI provides rails on which multiple agents can write code, tests, and documentation concurrently against a shared codebase, while preserving the semantic intent of human authority and producing auditable evidence of every change.

The control-theoretic framing is not metaphorical. It governs how authority is allocated, how concurrency is mediated, how failures are routed, and how convergence is gated. See [§2 Theory](../theory/) for the metaphor map and the long-form treatment.

## What this is not

- A replacement for build, lint, test, or CI tooling. DEVAI wraps and coordinates these; it does not reimplement them.
- A code generator that turns prose into working software. DEVAI orchestrates feedback between specs, tests, and code; it does not bypass the need for any of them.
- A universal stack abstraction. NestJS + Angular + Postgres remains the primary
  reference stack; each adopter declares one stack, and additional stacks use
  explicit adapter packs with conservative capability claims.

## Reading order

A curated walk-through, in suggested order, lives at [Reading order](reading-order.md). For the impatient: install via the [adopter guide](../adopters/install.md), declare your [role](../adopters/role-declaration.md), preview with `devai init plan`, then run [`devai init apply-f5 --introspect --as-role architect --write`](../adopters/first-introspection.md) against your repo.
