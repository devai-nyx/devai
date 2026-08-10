# Figure 9 — Inner-loop iteration (sequence diagram)

## Purpose

Per-iteration sequence: who calls whom in one inner-loop pass. Visually distinct from the flowchart-style diagrams; uses sequence-diagram conventions.

## Visual structure

- **Sequence-diagram layout** with six actors as colored heads across the top, vertical dashed lifelines descending.
- Actors (left to right): _LoopCtrl_ (ctrl), _Plant_ (plant), _Sens_ (sensor), _Obs_ (observer), _Tri_ (observer), _LLM K_π_ (ctrl).
- **Numbered messages** from top to bottom:
- 1. LoopCtrl → Sens: sense (parallel where possible)
- 2. Sens → Obs: y(k) (dashed return)
- 3. Obs → Tri: ŷ(k) per failing channel
- 4. Tri → LoopCtrl: classification per failure (dashed)
- 5. LoopCtrl → LoopCtrl: score compute → assess (self-loop)
- 6. alt branch: assessment = pass → success (self-loop)
- 7. LoopCtrl → LLM: feedforward composer + e(k)
- 8. LLM → Plant: u(k) within U_allowed (dashed)
- 9. Plant → LoopCtrl: state changed; advance k (dashed)
- 10. LoopCtrl → Sens: re-sense (next iteration)
- **Aspect**: ~1100×720, tall enough to space the lifeline events comfortably.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-10-inner-loop-sequence.svg`.
