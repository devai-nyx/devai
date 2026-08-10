# Figure 6 — Observer pipeline

## Purpose

The three-stage observer with reference-comparison junction at the end. Conveys that y(k) and r(k) aren't directly comparable; an observer reconstructs an estimate.

## Visual structure

- **Horizontal pipeline**: _y(k) SensorReadings_ (sensor palette) → _Inventory regen_ → _Scorecard compute_ → _Assessment_ → _x̂(k)_ (state estimate, observer palette).
- **Σ summing junction** to the right of x̂, with the reference _r(k)_ feeding from above.
- Σ → downward arrow labelled 'e(k)' indicating the error output.
- **Aspect**: very wide and short, ~1180×240.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-06-observer-pipeline.svg`.
