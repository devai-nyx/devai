# Sensor: `plant_coherence` → F2×T3

## Property semantics

**T3 Coherence** (Constitution Article 5): "the artifact's parts fit together — naming, structure, and layering are consistent and predictable." For F2 (Plant), this means the source-tree obeys self-consistent conventions: file names within a directory follow a single casing style; module layout reads as intentional rather than accidental.

## Operational definition

For each non-leaf source directory (default scan: `packages/*/src/**`), classify each source-file basename (stripped of extension) into one of:

- **kebab-case:** `[a-z0-9]+(-[a-z0-9]+)*`
- **snake_case:** `[a-z0-9]+(_[a-z0-9]+)+` (must have at least one underscore to distinguish from single-word lowercase)
- **camelCase:** `[a-z][a-zA-Z0-9]*` containing ≥ 1 uppercase letter
- **PascalCase:** `[A-Z][a-zA-Z0-9]*`
- **other:** anything else.

A directory is *coherent* if all classified files belong to the same case bucket (single-word lowercase files count as kebab-case). A directory is *incoherent* if ≥ 2 buckets each contain ≥ 1 file.

## PASS / REVIEW / FAIL boundaries

- **PASS:** every scanned directory is coherent.
- **REVIEW:** 1-3 directories are incoherent.
- **FAIL:** ≥ 4 directories are incoherent.

Findings cite each incoherent directory + the buckets present.

## Adopter overrides

- `extractor_params.plant_coherence.source_globs: string[]` — override the file scan. Default `['packages/*/src/**']`.
- `extractor_params.plant_coherence.max_review_incoherent: number` — REVIEW/FAIL boundary on count. Default `3`.

## Out of scope

- **Import-graph cycles.** Already covered by the dep-graph SR (Phase 17.B-onward). A future sub-cell could refine but adds little marginal signal.
- **Directory-naming consistency itself.** Could refine — defer.
- **Cross-package layering rules.** Substrate-level architectural coherence is its own concern.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/sensors/plant_coherence.md (classification CURRENT).
