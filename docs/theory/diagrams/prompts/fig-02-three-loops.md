# Figure 2 — Three nested control loops

**Source section:** devai-theory.md §11

## Purpose

Visualize the central architectural claim: time-scale-separated nested loops where failure of an inner loop is *not* a system failure — it's a signal that the loop above must take over.

## Visual structure

- **Three horizontal bands**, top-to-bottom, each a dashed-outline subgroup labelled with its timescale.
- **Top band (human, red palette)**: *RGR — Reference Gap Report* on the left, *Human Architect* on the right; an arrow labelled 'RGR-NNNN' goes left-to-right.
- **Middle band (supervisor, amber palette)**: *Article-23 ladder* on the left, a 4-line summary box on the right enumerating Tiers 1–4.
- **Bottom band (controller, green palette)**: 5 small chips in a row — *sense*, *triage*, *score*, *act*, *re-sense* — with straight arrows between them and a curving 'next iteration' arrow returning from *re-sense* back to *sense*.
- **Inter-band escalation arrows** drawn dashed in the parent band's color: *if max_iter exhausted* (inner → outer), *if all tiers fail* (outer → outermost), and reciprocating *amended r(k) resumes paused task* from outermost back into the loops.
- **Aspect**: portrait-leaning landscape, ~980×560.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-02-three-loops.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-02-three-loops.md (classification CURRENT).
