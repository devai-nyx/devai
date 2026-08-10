# Figure 26 — Sensor taxonomy

## Purpose

The canonical sensor roster as a one-level tree: 58 kinds, one SensorReading envelope, nine families mirroring the aspect grid.

## Visual structure

- **Root box** (observer): "58 sensor descriptors / 60 reading kinds — one SensorReading envelope (Art. 32)".
- **3×3 grid of family boxes**, each colored by what it observes and listing representative kinds: Build health (plant), Inventory L0 (observer), Spec quality (ref), Test quality (sensor), Plant quality (plant), Harness/F5-self (harness), Runtime probes (ctrl), Drift & integrity (sup), Stochastic (human; "judge — tri-state, evaluator-independent").
- Thin arrows fan out from the root to every family box.
- Footer: families mirror the aspect grid; exactly one family is stochastic, and it is labeled.
- **Aspect**: ~1200×560.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::fig26_sensor_taxonomy`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-26-sensor-taxonomy.svg`.
