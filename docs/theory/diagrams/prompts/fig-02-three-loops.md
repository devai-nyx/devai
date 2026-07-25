# Figure 2 — Three nested control loops

**Source section:** devai-theory.md §11

## Purpose

Visualize the central architectural claim: time-scale-separated nested loops where failure of an inner loop is _not_ a system failure — it's a signal that the loop above must take over.

## Visual structure

- **Three horizontal bands**, top-to-bottom, each a dashed-outline subgroup labelled with its timescale.
- **Top band (human, red palette)**: _RGR — Reference Gap Report_ on the left, _Human Architect_ on the right; an arrow labelled 'RGR-NNNN' goes left-to-right.
- **Middle band (supervisor, amber palette)**: _Article-23 ladder_ on the left, a 4-line summary box on the right enumerating Tiers 1–4.
- **Bottom band (controller, green palette)**: 5 small chips in a row — _sense_, _triage_, _score_, _act_, _re-sense_ — with straight arrows between them and a curving 'next iteration' arrow returning from _re-sense_ back to _sense_.
- **Inter-band escalation arrows** drawn dashed in the parent band's color: _if max_iter exhausted_ (inner → outer), _if all tiers fail_ (outer → outermost), and reciprocating _amended r(k) resumes paused task_ from outermost back into the loops.
- **Aspect**: portrait-leaning landscape, ~980×560.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-02-three-loops.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-02-three-loops.md (classification CURRENT).
