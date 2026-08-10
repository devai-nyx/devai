# Figure 15 — Article-23 ladder (supervisory state machine)

## Purpose

The four-tier escalation as discrete gain scheduling. Each tier is a distinct controller configuration π_i; transitions trigger on inner-loop verdicts.

## Visual structure

- **Row of four tier boxes** across the top: Tier 1 (default), Tier 2 (bumped same family), Tier 3 (cross-family), Tier 4 (escalation). Use sup palette for tiers 1–3 and human palette for tier 4.
- Horizontal arrows between adjacent tiers labelled 'iter cap'.
- **Below**, four terminal-state boxes in a row: SUCCESS (ctrl-green), BUDGET_EXHAUSTED (human-red), RGR_PENDING (human-red), ESCALATION (human-red).
- **Dashed colored arrows** from each tier (1–3) to SUCCESS / BUDGET / RGR — they can fire from any active tier. Tier 4 → ESCALATION solid arrow.
- Italic caption at the bottom: 'success · budget · RGR-pending transitions can fire from any active tier'.
- **Aspect**: ~1100×520.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-16-article23-ladder.svg`.
