# Figure 1 — Top-level signal flow

## Purpose

The control-engineer's reading of DEVAI as a feedback loop with three additions over textbook (exogenous inputs not in the inner loop; supervisor switching K_i; non-trivial observer).

## Visual structure

- **Three subgroups** drawn as dashed-outline boxes with uppercase titles in the top-left: 'Exogenous inputs' (left), 'Control plane' (center), 'Plant' (top-right), 'Observation' (bottom-right). 'Observation' and 'Plant' are visually grouped to the right; 'Control plane' fills the center column.
- **Exogenous inputs**: three neutral chips stacked — _Business intent_, _Engineering intent_, _Environmental disturbances_.
- **Control plane**: _Reference r(k)_ (ref palette, subtitle 'invariant catalog + severity Q') → _Supervisor — Article-23 ladder_ (sup palette, top of column) and _Inner controller K_ (ctrl palette, bottom of column). A Σ summing junction sits to the left of the controller, between r and K.
- **Plant**: _Plant P(k)_ with subtitle 'codebase + harness state' (plant palette).
- **Observation**: _Sensors h(·)_ with subtitle 'tests · type-check · build · probes' (sensor palette) feeding _Observer_ with subtitle 'inventory + scorecard' (observer palette).
- **Arrows**: business + engineering intent → reference; environmental → plant (with curve); reference → Σ (labelled 'r(k)'); observer → Σ feedback path (labelled 'y(k)'); Σ → controller (labelled 'e(k)'); supervisor → controller (labelled 'K_i selection'); controller → plant (labelled 'u(k) — file edits'); plant → sensors → observer (vertical chain).
- **Aspect**: landscape, ~1200×540, generous internal whitespace, every arrow with a label for the control engineer.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-01-system-overview.svg`.
