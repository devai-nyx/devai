# Figure 10 — Three-layer input saturation

**Source section:** devai-theory.md §4.5

## Purpose

Defense-in-depth for u ∈ U_allowed: each of three layers can independently reject an out-of-scope edit. The diagram surfaces the redundancy.

## Visual structure

- **Five boxes in a horizontal chain**: _LLM proposes u_k_ → _Layer 1 (prompt overlay)_ → _Layer 2 (skill runtime)_ → _Layer 3 (git pre-commit)_ → _Apply to plant_.
- **Below**, a _Refused_ box (forbidden-red) — three dashed red arrows fall from L1, L2, L3 toward it, labelled 'violation' on one of them.
- **Aspect**: ~1180×320.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-11-input-saturation.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-11-input-saturation.md (classification CURRENT).
