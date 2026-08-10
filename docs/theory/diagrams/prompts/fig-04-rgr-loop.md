# Figure 4 — RGR loop (reference-modification feedback)

## Purpose

Establishes the RGR as the outermost-feedback path that modifies r, not u — the framework's only structured way for spec drift to occur, and the most important behavioral discipline.

## Visual structure

- **Linear left-to-right chain** of controller-tier boxes, then a vertical split to a human node and a reference-update node, then a return chain.
- Sequence: _Inner controller K_ → _emit RGR_ → _task paused_. Dashed arrow upward to _Human Architect_ (red palette). Human → _Reference r(k)_ (ref-blue), with arrow labelled 'Δr(k)'. Reference → _task resumes_ → back to _Inner controller K_.
- Label dashed wait-arrow 'wait for Δr'.
- **Aspect**: ~1100×320 landscape.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-04-rgr-loop.svg`.
