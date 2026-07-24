# Figure 4 — RGR loop (reference-modification feedback)

**Source section:** devai-theory.md §7.5

## Purpose

Establishes the RGR as the outermost-feedback path that modifies r, not u — the framework's only structured way for spec drift to occur, and the most important behavioral discipline.

## Visual structure

- **Linear left-to-right chain** of controller-tier boxes, then a vertical split to a human node and a reference-update node, then a return chain.
- Sequence: *Inner controller K* → *emit RGR* → *task paused*. Dashed arrow upward to *Human Architect* (red palette). Human → *Reference r(k)* (ref-blue), with arrow labelled 'Δr(k)'. Reference → *task resumes* → back to *Inner controller K*.
- Label dashed wait-arrow 'wait for Δr'.
- **Aspect**: ~1100×320 landscape.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-04-rgr-loop.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-04-rgr-loop.md (classification CURRENT).
