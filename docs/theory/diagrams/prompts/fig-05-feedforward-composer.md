# Figure 5 — Feedforward composition (first introduction)

**Source section:** devai-theory.md §7.6

## Purpose

Introduces the feedforward path: how CNL-shaped reference + repo introspection + iteration history compose into the prompt the LLM controller sees, augmented by the current error from the observer.

## Visual structure

- **Three inputs on the left**: *r(k) — invariants* (with CNL extraction label on the arrow), *repo introspection* (subtitle 'Phase 11.D'), *prior agent-runs* (subtitle 'F5 substrate', labelled 'continuity').
- **Composer box** in the center — large, ctrl palette, two-line title '*Feedforward composer / SKILL-feedback-iteration · prompt-composition.schema.json*'.
- **LLM controller K** on the right (ctrl palette).
- **Plant** below LLM (plant palette).
- **Error feedback** from the observer enters the LLM from below-left labelled 'current error' with a slight curve.
- Arrows: composer → LLM labelled 'prompt stack'; LLM → plant labelled 'u(k)'.
- **Aspect**: ~1100×360.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-05-feedforward-composer.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-05-feedforward-composer.md (classification CURRENT).
