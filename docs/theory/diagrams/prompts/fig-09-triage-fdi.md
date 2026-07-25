# Figure 8 — Triage as a fault-detection-and-isolation block

**Source section:** devai-theory.md §7.2

## Purpose

Triage as the FDI block atop the observer: every failing reading is classified into one of four buckets, each routing to a different authority.

## Visual structure

- **Input** on the left (sensor palette): _y(k): failing SensorReading_.
- **Center** (observer palette): _Triage classifier_ with subtitle 'FDI block'.
- **Four outputs on the right**, color-coded by destination authority:
- - 'plant-bug' → _Backlog (controller actuates next)_ (ctrl-green)
- - 'sensor-error' → _Inspector revisits (actuate F3, not F2)_ (sensor-violet)
- - 'policy-issue' → _Architect revisits (modify thresholds)_ (ref-blue)
- - 'reference-gap' → _Emit RGR (escalate, pause)_ (human-red)
- Each arrow curves toward its target and carries the classification label.
- **Aspect**: ~1140×440.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-09-triage-fdi.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-09-triage-fdi.md (classification CURRENT).
