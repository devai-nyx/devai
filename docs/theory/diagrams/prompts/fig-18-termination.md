# Figure 17 — Termination guarantee decision tree

**Source section:** devai-theory.md §7.4

## Purpose

Every path through the inner loop reaches one of four explicit terminal states; there is no silent-loop path.

## Visual structure

- **Decision tree** with _Inner loop k=0_ at the top, branching down to _Iteration k_ (central decision diamond / box).
- **Four branch outcomes**:
- - assess=pass → SUCCESS (ctrl-green)
- - k = N_max → Article-23 ladder (sup-amber)
- - budget → BUDGET_EXHAUSTED (human-red)
- - triage = reference-gap → RGR_PENDING (human-red)
- **Below the ladder**: split into _switch π → next tier_ (sup) which dashed-returns to Iteration k, and _ESCALATION (Art 19)_ (human-red).
- **Aspect**: ~1080×480, vertical.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-18-termination.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-18-termination.md (classification CURRENT).
