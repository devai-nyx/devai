# Figure 13 — Prompt firewall as topology check

**Source section:** devai-theory.md §4.5

## Purpose

Layer 1 of the input-saturation defense: catches authority-inverting overlays *before* the LLM is called, complementing the actuation-layer checks of Figure 10.

## Visual structure

- **Linear chain**: *Prompt overlay declaration* (ref-blue) → *devai policy check prompt overlays* (sup-amber, subtitle 'topology check') → *Composer* (ctrl-green).
- **Four side-branches** dashed off the firewall to red rejection boxes (forbidden palette), each labelled with a specific finding code:
-   - 'authority inversion'
-   - 'read-tier with write scopes'
-   - 'ops-agent writes tests'
-   - 'joint-reserved without review-agent' (this one in amber not red — a warning, not a block)
- **Main arrow** from firewall to composer labelled 'valid'.
- **Aspect**: ~1180×420.

## Authoring notes

Authored via `docs/theory/diagrams/render-figures.py::see file`.
Re-rendering: `python3 docs/theory/diagrams/render-figures.py`.
Output: `docs/theory/diagrams/svg/fig-14-prompt-firewall.svg`.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/diagrams/prompts/fig-14-prompt-firewall.md (classification CURRENT).
