# Figure 7 — Forward + reverse adherence

## Purpose

Two side-by-side projections showing how invariants project onto plant surfaces forward, and how plant surfaces project onto invariants reverse — both need to be 'onto' for full observability of the F1×F2 cross-section.

## Visual structure

- **Two dashed subgroups** side-by-side, each titled in its own label.
- **Left (Forward, r → y)**: _INV_ (ref-blue) → _test_ (sensor-violet) → _file_ (plant-amber). Vertical arrow from INV to test labelled 'trace.json'; horizontal from test to file labelled 'runs against'.
- **Right (Reverse, plant → r)**: _code surface_ (plant-amber) → _trace.json_ (sensor-violet) → _INV claim_ (ref-blue). Vertical up arrow labelled 'inv adherence-reverse'; horizontal labelled 'code_areas glob'.
- **Aspect**: ~1140×360.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-08-adherence.svg`.
