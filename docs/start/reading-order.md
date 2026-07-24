---
title: Reading order
sidebar_position: 3
---

# Reading order

A curated path through the published documentation, in the order most readers will find useful. Skip freely; come back when you need depth.

## For new adopters

A 30-minute walk-through to get oriented before installing.

| Step | Read | Time | Why |
|---|---|---|---|
| 1 | [What is DEVAI?](./what-is-devai.md) | 5 min | One-paragraph framing + the five substrates and five roles |
| 2 | [Theory — the metaphor map](../theory) | 10 min | The control-theoretic vocabulary made literal; routes to the unified theory document |
| 3 | [Adopters — install](../adopters/install.md) | 5 min | Clone DEVAI, install the CLI, verify gates green |
| 4 | [Adopters — role declaration](../adopters/role-declaration.md) | 5 min | The five-role authority model from an adopter's perspective |
| 5 | [Adopters — first introspection](../adopters/first-introspection.md) | 5 min | The brownfield path: role-separated bootstrap, `init apply-f5 --introspect`, and the seven L0 inventory sensors |
| 6 | [Adopters — pack resolution](../adopters/pack-resolution.md) | 5 min | How `devai adopt pack resolve` matches your repo to a stack-adapter pack |

After this, the rest of [§5 Adopters](../adopters) is reference material — read what you need when you need it.

## For role-holders

If you've declared a role at session start, read your role's walkthrough first:

- [Owner](../roles/owner.md) — business specs (journeys, use-cases) under F1
- [Architect](../roles/architect.md) — engineering specs, invariants, contracts, ADRs under F1
- [Inspector](../roles/inspector.md) — tests under F3
- [Engineer](../roles/engineer.md) — code under F2
- [Auditor](../roles/auditor.md) — read-only; produces reports, scorecards, backlogs

Then read cross-role coordination (under §4 Roles) for the coupled-triplet pattern that handles cross-substrate work.

## For theorists

The control-theoretic framing is binding on every later artifact. Read in this order:

| Read | Time | Why |
|---|---|---|
| [Theory landing — the metaphor map](../theory) | 10 min | One-screen mapping of DEVAI vocabulary to control-theory vocabulary, with Constitution-article anchors |
| Synthesis paper (under §2 Theory) | ~30 min | Long-form architectural argument citing the decision log; the recommended long-form read |
| Control-engineering paper (under §2 Theory) | ~45 min | Formal-model companion with Mermaid diagrams + LaTeX math; the preferred read for control engineers |
| [Constitution](../reference/law.md) | ~30 min | Forty immutable axioms; cite by article number |

## For contributors and auditors of DEVAI itself

DEVAI applies to itself per [Article 36](../reference/law.md). Reading [§7 Meta](../dev) is how you understand what DEVAI does *with* itself:

| Read | Why |
|---|---|
| [Meta landing](../dev) | Article-36 framing; what's in §7 and why it's separate from §3 Framework |
| [Self-scorecard](./status.md) | The exact-input projection contract; treat it as current only when its subject/render/freshness provenance matches the active candidate |
| [Test matrix](../dev/index.md) | Suite structure and what each suite probes; fresh round evidence carries current pass/fail status |
| Dev process (under §7 Meta) | Session boundary, round-break canon, per-batch verification |
| [Build plan](../dev/round-ledger.md) | Per-phase implementation plan with prefix-index navigation |
| [Decision log](../reference/decisions-index.md) | D-1 through current; one rationale per decision |

## For everyone else (the CLI/skills/schemas reference)

[§6 Reference](../reference) is auto-generated:

- [CLI](../reference/cli.md) — every verb, with authority tag, description, and per-action options
- [Skills](../reference/skills) — skill manifests with inputs / outputs / authorship
- [Schemas](../../law/schemas) — every JSON Schema browsable inline (under Framework because contracts are framework-tier)
- Scripts (under §6 Reference) — `pnpm` scripts and `scripts/*.mjs` utilities
- Sensors quick-ref (under §6 Reference) — sensor kinds organised by substrate and transversal
- Examples (under §6 Reference) — packs and fixtures under `examples/`

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/start/reading-order.md (classification CURRENT).
