# Figure 22 — Effect gate: declared ⊇ inferred

## Purpose

The capability seam's design-time half: the static reachability analyzer's inferred effect set checked against the manifest's declared set, fail-closed, before the coverage gate.

## Visual structure

- **Left group "Design time"**: Action manifest (ref) with declared effects; Action implementation (plant) noting the 23-template subprocess F1 contract; Static reachability analyzer (observer, `@devai-nyx/effects-check`) fed by the implementation ("reachable sinks").
- **Center**: CI gate box (sup) labelled `declared ⊇ inferred — fail-closed`, receiving "declared set" from the manifest and "inferred set" from the analyzer.
- **Right**: green "Merge lane continues" (capability necessary, never sufficient) vs red "Build fails before coverage" (ultra vires: undeclared effect reachable).
- **Below gate**: Runtime seam box (harness) connected by a dashed "defense in depth" arrow — role ∩ policy ∩ consent still bind.
- **Aspect**: ~1180×480.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::fig22_effect_gate`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-22-effect-gate.svg`.
