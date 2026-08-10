# Figure 11 — Feedforward composition (layered detail)

## Purpose

Companion to Figure 5: shows the six prompt-composition layers and the deterministic stack hash that fingerprints them.

## Visual structure

- **Left column**: six small chips stacked vertically — _Global prompt_, _Role prompt_, _Discipline prompt_, _Task prompt_, _Payload — e(k) + INV + code_, _Overlay (optional)_. Each chip carries its `body_sha256` field as a subtitle.
- **Center**: _Composer_ with subtitle 'canonical order' (ctrl palette).
- **Top-right**: _stack_sha256_ with subtitle 'deterministic hash' (ctrl palette).
- **Bottom-right**: _LLM controller K_ (ctrl palette).
- Curved-Bezier arrows from each left chip into the composer (mild fan-in curves to avoid overlap). Composer → stack hash → LLM (labelled 'prompt stack').
- **Aspect**: ~1100×480.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-12-feedforward-layers.svg`.
