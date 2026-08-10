# Diagram prompts

This directory contains visual briefs for the framework diagrams. Each `.md` file
describes one figure in enough detail that the SVG can be re-authored without
reference to the existing implementation.

## Pipeline

```
docs/theory/diagrams/prompts/fig-NN-*.md   (brief — committed; canonical intent)
                  ▼
docs/theory/diagrams/render-figures.py     (composes via svgkit.py — committed)
                  ▼
docs/theory/diagrams/svg/fig-NN-*.svg      (output — committed for portability)
                  ▼
docs/theory/framework/*.md                 (references selected SVGs)
```

## Visual vocabulary

Every figure draws from a shared palette and shape kit defined in `svgkit.py`:

| Substrate / role | Stroke    | Fill      | Used for                                 |
| ---------------- | --------- | --------- | ---------------------------------------- |
| `ref`            | `#1F4E79` | `#E8F0FF` | F1 specs · reference signal · invariants |
| `plant`          | `#AA5500` | `#FFF3E0` | F2 code · plant proper                   |
| `sensor`         | `#663388` | `#F5E8FF` | F3 tests · sensors                       |
| `observer`       | `#226666` | `#E8F8F0` | F4 inventory · observer                  |
| `harness`        | `#886600` | `#F8F0D8` | F5 evidence · audit trail                |
| `ctrl`           | `#226622` | `#E8FDE8` | controller · loop primitives             |
| `sup`            | `#AA8800` | `#FFF8D8` | supervisor · ladder · gating             |
| `human`          | `#AA2222` | `#FFE8E8` | human / outermost / RGR escalation       |
| `forbidden`      | `#AA2222` | `#FFE8E8` | forbidden edges (red dashed with ✕)      |
| `neutral`        | `#374151` | `#F3F4F6` | exogenous inputs · unclassified          |

Common primitives:

- **Box** — rounded rectangle (12px radius), 2px stroke, soft drop shadow, sans-serif label.
- **Sigma** — summing-junction circle for error nodes (Σ).
- **Arrow** — straight or quadratic-Bezier; arrowhead marker; optional dashed style; optional inline label with white halo for legibility.
- **Forbidden marker** — red dashed line with a circled `✕` at midpoint, no arrowhead.
- **Group label** — dashed-outline subgroup box with uppercase title in the top-left.

Typography: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Sizes 11–18pt. Label hierarchy: bold-first-line for primary node labels; smaller italic for subscripts.

## Figure index

The prompt filename and corresponding SVG filename provide the stable mapping.

## Authoring a new figure

1. Write the brief at `prompts/fig-NN-<slug>.md` covering: purpose, structure, palette, key arrows, callouts.
2. Add a `figNN_<slug>()` function in `render-figures.py` composing the diagram from `svgkit` primitives.
3. Register it in the `FIGURES` list at the bottom of `render-figures.py`.
4. Run `python3 docs/theory/diagrams/render-figures.py`; the SVG lands under `docs/theory/diagrams/svg/`.
5. Reference the SVG from the relevant framework document with a document-relative
   Markdown image.
