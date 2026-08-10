# Figure 23 — Host seam path domains (Article 6)

## Purpose

The capability seam's runtime half: every governed mutation crosses a capability module bound to one Article-6 path domain; cross-domain writes are refused.

## Visual structure

- **Top**: Governed action box (ctrl; role declared, consent recorded) with an arrow down into the seam.
- **Middle**: a full-width harness-colored bar labelled HOST SEAM — capability modules, cross-domain assertion, binds on final canonical target (D-157).
- **Bottom row**: five domain boxes in substrate colors — F1 specs, F2 plant, F3 sensors, F4 inventory (regen-only), F5 state (append-only ledger) — each fed from the seam.
- One red forbidden arrow between two domain boxes labelled "cross-domain write".
- Footer note: distinct read/write wrappers per domain; Postgres read/write split; under-declared effect reporting fails closed.
- **Aspect**: ~1180×470.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::fig23_path_domains`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-23-path-domains.svg`.
