# Figure 18 — Task lifecycle state machine

**Source section:** devai-theory.md §9

## Purpose

Per-task linearizable state machine over the lifecycle. Reads bottom-to-top as an L-shape with branches for RGR / cancellation / escalation off the in-progress state.

## Visual structure

- **Main horizontal chain** at the top: queued → ready → in_progress → checkpoint → pre_merge (ctrl-green).
- **Vertical chain** on the right: pre_merge → merging → completed.
- **Self-loop** on checkpoint labelled 'iter continues'.
- **Branch downward** from in_progress to _rgr_pending_ (human-red), with two outgoing arrows: 'RGR resolved' curving back up to in_progress (ctrl-green); 'RGR rejected' to _cancelled_.
- **Branch leftward** from in_progress to _escalated_ (human-red) labelled 'ladder exhausted'.
- **Aspect**: ~1100×540.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-19-task-lifecycle.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-19-task-lifecycle.md (classification CURRENT).
