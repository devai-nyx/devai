# Figure 6 — Observer pipeline

**Source section:** devai-theory.md §11.3

## Purpose

The three-stage observer with reference-comparison junction at the end. Conveys that y(k) and r(k) aren't directly comparable; an observer reconstructs an estimate.

## Visual structure

- **Horizontal pipeline**: *y(k) SensorReadings* (sensor palette) → *Inventory regen* → *Scorecard compute* → *Assessment* → *x̂(k)* (state estimate, observer palette).
- **Σ summing junction** to the right of x̂, with the reference *r(k)* feeding from above.
- Σ → downward arrow labelled 'e(k)' indicating the error output.
- **Aspect**: very wide and short, ~1180×240.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-06-observer-pipeline.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-06-observer-pipeline.md (classification CURRENT).
