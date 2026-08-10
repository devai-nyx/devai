# Figure 3 — State decomposition by authority + lifecycle

## Purpose

A simple but load-bearing visual: 5 colored boxes side-by-side, one per substrate. The colors carry through the entire paper, so this figure functions as the visual key.

## Visual structure

- **Five equal-sized rounded rectangles** in a horizontal row inside a dashed group labelled 'State vector x(k)'.
- Each box uses its substrate's palette: F1 ref-blue, F2 plant-amber, F3 sensor-violet, F4 observer-teal, F5 harness-mustard.
- **Inside each**: the big short label (`F1`, `F2`, …) at 22pt bold, then a two-line caption: _specs (reference artifacts)_, _code (plant proper)_, _tests (sensors)_, _inventory (observer)_, _harness (audit trail)_.
- **Aspect**: wide and short, ~1080×240.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-03-state-decomposition.svg`.
