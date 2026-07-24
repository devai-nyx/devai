# Figure 19 — Reference-disturbance handling (sequence)

**Source section:** devai-theory.md §11.2

## Purpose

Sequence diagram for an Architect amendment: how the loop detects and adapts to a new invariant version mid-task.

## Visual structure

- **Four-actor sequence-diagram**: *Architect* (ref-blue), *Catalog* (ref-blue), *Task* (ctrl-green), *Loop* (ctrl-green).
- **Messages**:
-   1. Architect → Catalog: bump INV-AUTH-007 from v1.0.0 to v1.1.0
-   2. Catalog → Loop: r_AUTH-007 changed
-   3. Loop → Loop: re-sense with new r (self-loop)
-   4. Loop → Task: task was rgr_pending → detect superseding version (dashed)
-   5. Task → Loop: resume from last checkpoint
-   6. Loop → Loop: continue iteration (self-loop)
- **Aspect**: ~1100×540.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-20-reference-disturbance.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-20-reference-disturbance.md (classification CURRENT).
