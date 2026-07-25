# Figure 12 — Forbidden feedback paths

**Source section:** devai-theory.md §4.5

## Purpose

Central diagram for §9. Shows permitted (solid) and forbidden (red dashed × marker) edges in the signal-flow graph.

## Visual structure

- **Six nodes laid out in a roughly hexagonal arrangement**: _r(k) — F1 specs_ (top center), _Plant — F2_ (mid center), _Sensors — F3_ (mid left), _Observer_ (lower left), _Inner K_ (mid right), _Evidence — F5_ (lower right), _Auditor (read-only)_ (below Evidence). A Σ summing junction sits between Observer and Inner K.
- **Permitted edges (solid arrows with labels)**: K → Plant labelled 'u(k) ∈ U_allowed'; Plant → Sens; Sens → Obs labelled 'y(k)'; Obs → Σ labelled 'x̂'; r → Σ labelled 'r'; Σ → K labelled 'e(k)'; K → Evid labelled 'emit'; Evid → Auditor labelled 'audit (read)'.
- **Forbidden edges (red dashed with ✕ marker, label FORBIDDEN)**: Plant → r (vertical), Sens ↔ Plant (both directions), K → Evid retro-edit (slight curve to indicate it's the retro-direction, not the append direction).
- **Aspect**: ~1100×580, square-ish.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-13-forbidden-paths.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-13-forbidden-paths.md (classification CURRENT).
