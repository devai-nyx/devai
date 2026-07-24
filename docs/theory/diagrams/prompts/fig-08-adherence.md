# Figure 7 — Forward + reverse adherence

**Source section:** devai-theory.md §5.4

## Purpose

Two side-by-side projections showing how invariants project onto plant surfaces forward, and how plant surfaces project onto invariants reverse — both need to be 'onto' for full observability of the F1×F2 cross-section.

## Visual structure

- **Two dashed subgroups** side-by-side, each titled in its own label.
- **Left (Forward, r → y)**: *INV* (ref-blue) → *test* (sensor-violet) → *file* (plant-amber). Vertical arrow from INV to test labelled 'trace.json'; horizontal from test to file labelled 'runs against'.
- **Right (Reverse, plant → r)**: *code surface* (plant-amber) → *trace.json* (sensor-violet) → *INV claim* (ref-blue). Vertical up arrow labelled 'inv adherence-reverse'; horizontal labelled 'code_areas glob'.
- **Aspect**: ~1140×360.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-08-adherence.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-08-adherence.md (classification CURRENT).
