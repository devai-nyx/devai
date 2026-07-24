# Figure 3 — State decomposition by authority + lifecycle

**Source section:** devai-theory.md §3.1

## Purpose

A simple but load-bearing visual: 5 colored boxes side-by-side, one per substrate. The colors carry through the entire paper, so this figure functions as the visual key.

## Visual structure

- **Five equal-sized rounded rectangles** in a horizontal row inside a dashed group labelled 'State vector x(k)'.
- Each box uses its substrate's palette: F1 ref-blue, F2 plant-amber, F3 sensor-violet, F4 observer-teal, F5 harness-mustard.
- **Inside each**: the big short label (`F1`, `F2`, …) at 22pt bold, then a two-line caption: *specs (reference artifacts)*, *code (plant proper)*, *tests (sensors)*, *inventory (observer)*, *harness (audit trail)*.
- **Aspect**: wide and short, ~1080×240.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-03-state-decomposition.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-03-state-decomposition.md (classification CURRENT).
