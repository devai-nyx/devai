# Figure 14 — Controllable subspace 𝒞(k)

**Source section:** devai-theory.md §11.4

## Purpose

Visualizes that the controller's reach is deliberately bounded: 𝒞(k) ⊆ span(F2) ∪ span(F5⁺) by the forbidden-edge topology.

## Visual structure

- **Left group**: 'State space 𝒳' — six small substrate boxes (F1 r(k), F2 plant, F3 sensors, F4 x̂(k), F5⁺ append-only, F5⁻ past records) using their substrate palettes.
- **Right top group**: 'Controllable subspace 𝒞(k)' (ctrl-green border) — two filled boxes labelled F2 and F5⁺, drawn larger to suggest 'these are the actuable subspaces'. Arrows from the corresponding state-space boxes flow into them.
- **Right bottom group**: 'Outside 𝒞(k)' (forbidden-red border) — one box containing a multi-line list:
- - 'F1 (forbidden)'
- - 'F3 (forbidden)'
- - 'F4 (derived, not actuated)'
- - 'F5⁻ (forbidden — retro)'
- Each excluded state-space box has a dashed red arrow into this 'outside' group.
- **Aspect**: ~1080×460.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-15-controllable-subspace.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-15-controllable-subspace.md (classification CURRENT).
