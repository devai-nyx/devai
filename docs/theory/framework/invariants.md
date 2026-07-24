---
title: Invariants
sidebar_position: 9
---

# Invariants

> [Constitution Article 11](../../reference/law.md) declares the invariant the atomic unit of Architect-authored specification. Every test references one or more invariants. Every scorecard computation is ultimately reducible to invariant-level measurements. Invariants are the framework's control setpoints.

## Shape

An invariant has:

- **A unique ID** of the form `INV-<DOMAIN>-<NNN>` (e.g., `INV-AUTH-014`).
- **A severity** — one of `must` or `should`. `must` is non-negotiable; `should` is graded into the scorecard with finite weight.
- **A type** — `invariant`, `forbidden-action`, `obligation`, `policy`. The type governs how sensors probe the invariant.
- **A canonical statement** — the prose form, written in CNL (controlled natural language) per the authoring guide under [`arch/invariant-authoring.md`](../architecture/invariant-authoring.md).
- **A rationale** — why the invariant exists. Linked to ADRs where relevant.
- **A scope** — path globs declaring which substrate(s) the invariant applies to.
- **A `change_policy`** — per-invariant mutability rules (see below).
- **A verification declaration** — `measurable_via`: the sensor kinds that score this invariant.
- **Authority anchors** — back-pointers to the source documents (Owner journey, Architect ADR, security policy) that justify the invariant's existence.

The full schema is at `law/schemas/invariant.schema.json`.

## Trace (Article 13)

Trace is the F1 artifact that maps each invariant to:

- The Owner or Architect documents that justify it (authority anchors).
- The tests that probe it (test references with reliability metadata: flaky, quarantine, drift markers).
- The code areas that implement it (path globs).

Trace lives at `law/trace.json` under Architect authority. **Inspector and Engineer consume trace but never edit it.** Trace completeness ratios — invariants with at least one mapped test, tests anchored to invariants, code regions claimed by invariants — are deterministic gate inputs.

## Per-invariant change policy (Article 14)

Each invariant declares its own mutability rules in a `change_policy` field:

- **`requires_human_approval`** — boolean. When true, the orchestrator requires explicit human approval before any change to this invariant lands, even within an authorised Architect session.
- **`test_weakening_allowed`** — boolean. When false, any AST-diff weakening of a test referencing this invariant is unjustified regardless of magnitude (overrides the default thresholds from Article 30).
- **`couples_with`** — list of other invariants that must be updated together. Used for cross-cutting concerns (e.g., a Security invariant coupled with the corresponding Audit invariant).
- **`migration_required`** — when changing this invariant requires a database / API migration, the migration's scaffolding is auto-generated and linked.

This **grades the authority chain at invariant granularity**. A security-critical invariant can require human approval to modify even within an authorised Architect session. A spec invariant for an internal tool can be changed freely by any Architect.

## Authoring discipline

The authoring guide at [`arch/invariant-authoring.md`](../architecture/invariant-authoring.md) covers the operational how-to: CNL grammar, ID assignment, severity selection, scope declaration, `measurable_via` selection.

The taxonomy at [`arch/invariant-taxonomy.md`](../architecture/invariant-taxonomy.md) covers domain-by-domain conventions: which `<DOMAIN>` ID prefix to use, when an invariant should be a `forbidden-action` vs an `obligation`, etc.

## Validation

- `devai spec validate invariants` — schema + cross-reference validation per invariant file.
- `devai spec validate trace` — every invariant has at least one trace entry; every trace entry references a real invariant.
- `devai spec validate action coverage` — every CLI action is claimed by at least one invariant's `measurable_via`. Coverage gaps are flagged.
- `devai spec validate all` — runs all of the above.

## Aggregate invariants and rollups

Invariants aggregate into domain rollups. The scorecard's `Spec × Coverage` (F1 × T1) cell, for example, is computed from per-domain invariant rollups: domains with severity-`must` invariants present score higher than those with only `should` invariants.

The aggregate-invariant mechanism is documented at [`arch/invariant-authoring.md`](../architecture/invariant-authoring.md); rollups are computed at `sense-spec-depth` and `sense-spec-alignment` runs.

## See also

- [Constitution Articles 11-14](../../reference/law.md) — invariant binding text, trace, change policy.
- [`docs/theory/architecture/invariant-authoring.md`](../architecture/invariant-authoring.md) — operational authoring guide.
- [`docs/theory/architecture/invariant-taxonomy.md`](../architecture/invariant-taxonomy.md) — domain conventions.
- [Test policy](./test-policy.md) — how tests reference invariants and how weakening is gated.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/invariants.md (classification CURRENT).
