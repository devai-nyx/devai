# Figure 1 — Top-level signal flow

**Source section:** devai-theory.md §11

## Purpose

The control-engineer's reading of DEVAI as a feedback loop with three additions over textbook (exogenous inputs not in the inner loop; supervisor switching K_i; non-trivial observer).

## Visual structure

- **Three subgroups** drawn as dashed-outline boxes with uppercase titles in the top-left: 'Exogenous inputs' (left), 'Control plane' (center), 'Plant' (top-right), 'Observation' (bottom-right). 'Observation' and 'Plant' are visually grouped to the right; 'Control plane' fills the center column.
- **Exogenous inputs**: three neutral chips stacked — *Business intent*, *Engineering intent*, *Environmental disturbances*.
- **Control plane**: *Reference r(k)* (ref palette, subtitle 'invariant catalog + severity Q') → *Supervisor — Article-23 ladder* (sup palette, top of column) and *Inner controller K* (ctrl palette, bottom of column). A Σ summing junction sits to the left of the controller, between r and K.
- **Plant**: *Plant P(k)* with subtitle 'codebase + harness state' (plant palette).
- **Observation**: *Sensors h(·)* with subtitle 'tests · type-check · build · probes' (sensor palette) feeding *Observer* with subtitle 'inventory + scorecard' (observer palette).
- **Arrows**: business + engineering intent → reference; environmental → plant (with curve); reference → Σ (labelled 'r(k)'); observer → Σ feedback path (labelled 'y(k)'); Σ → controller (labelled 'e(k)'); supervisor → controller (labelled 'K_i selection'); controller → plant (labelled 'u(k) — file edits'); plant → sensors → observer (vertical chain).
- **Aspect**: landscape, ~1200×540, generous internal whitespace, every arrow with a label for the control engineer.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-01-system-overview.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-01-system-overview.md (classification CURRENT).
