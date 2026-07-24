# Figure 11 — Feedforward composition (layered detail)

**Source section:** devai-theory.md §7.6

## Purpose

Companion to Figure 5: shows the six prompt-composition layers and the deterministic stack hash that fingerprints them.

## Visual structure

- **Left column**: six small chips stacked vertically — *Global prompt*, *Role prompt*, *Discipline prompt*, *Task prompt*, *Payload — e(k) + INV + code*, *Overlay (optional)*. Each chip carries its `body_sha256` field as a subtitle.
- **Center**: *Composer* with subtitle 'canonical order' (ctrl palette).
- **Top-right**: *stack_sha256* with subtitle 'deterministic hash' (ctrl palette).
- **Bottom-right**: *LLM controller K* (ctrl palette).
- Curved-Bezier arrows from each left chip into the composer (mild fan-in curves to avoid overlap). Composer → stack hash → LLM (labelled 'prompt stack').
- **Aspect**: ~1100×480.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-12-feedforward-layers.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-12-feedforward-layers.md (classification CURRENT).
