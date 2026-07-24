# Figure 16 — RGR loop with timescale callouts

**Source section:** devai-theory.md §11.2

## Purpose

Repeats Figure 4 (with slightly more detail in the wait-loop) emphasizing the timescale separation of the outermost loop.

## Visual structure

- **Same topology as Figure 4** but with: *Inner / outer loop* on the left (broader description), *Emit RGR-NNNN* (with agent-run subtitle), *task pause-rgr* (with state subtitle).
- **Up to human**: *Human Architect* (red) with subtitle 'amends invariant (version bump)'.
- **Reference update**: *r(k+T) = r(k) + Δr* — labelled formula in the box.
- **Back down**: *task resume-rgr*, then return to inner.
- Dashed wait-arrow labelled 'timescale: hours/days'.
- **Aspect**: ~1180×320.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-17-rgr-loop-redux.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-17-rgr-loop-redux.md (classification CURRENT).
