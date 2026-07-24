# Sensor: `docs_drift` → F5×T3

## Property semantics

**T3 Coherence** (Constitution Article 5) for F5 (Harness): "do the harness's prose claims agree with the system they describe?" The harness includes the constitution, the session-start instructions, and the top-level orientation documents (Article 4, F5). Per Article 2, documents are the reference signal — a reference document making a factually wrong claim about the plant is reference-signal drift, the framework's highest-priority error class. This sensor exists because the D-108 audit found exactly that drift (Article 27's cap, CLAUDE.md's schema count, README's phase status) had persisted ~23 phases undetected: the 45-cell grid measured F5 structure and links but not the truth of machine-derivable prose claims.

## Operational definition

Deterministic cross-checks of machine-derivable claims against ground truth, all rooted at `--repo-root`:

1. **Schema-count claims.** Every match of `/(\d+)\s+JSON Schema files?/i` in `README.md` and `CLAUDE.md` must equal the count of `*.schema.json` files under `law/schemas/`. Mismatch → error finding.
2. **Decision-log range claims.** Every match of `/D-1\s*(?:…|\.{2,3})\s*D-(\d+)/` in `README.md` must have its upper bound equal to the highest `### D-<n>` heading in `law/register/DECISIONS.md`. Mismatch → error finding.
3. **Worktree-cap coherence.** The cap stated or implied in `law/constitution.md` Article 27 prose (a digit or number-word immediately following "capped at", if present) must equal the `WORKTREE_CAP = <n>` constant in `packages/core/src/loop/worktrees.ts`. Under the 0.3.0 text the constitution states no number (the value is policy), so the check passes vacuously; it exists to catch a future re-hard-coding. Mismatch → error finding.
4. **Constitution-version coherence.** The `**Version:**` header in `law/constitution.md` must equal the one in `.devai/constitution.md` (trivially true while the snapshot is a symlink; load-bearing for adopters with a pinned copy). Mismatch → error finding.

A claim pattern that matches nothing is not a failure — absence of a claim is the preferred state (live counts belong in CLI queries, not prose). Each absent claim produces an info finding so the reading shows what was checked.

`drift_count` = number of error findings.

## PASS / REVIEW / FAIL boundaries

- **PASS:** `drift_count === 0`.
- **FAIL:** `drift_count ≥ 1`. A factually wrong reference claim is binary — there is no "slightly wrong" count; REVIEW is not emitted by this sensor.

## Adopter overrides

- `extractor_params.docs_drift.claim_files: string[]` — files scanned for claims 1–2. Default `["README.md", "CLAUDE.md"]`.
- `extractor_params.docs_drift.schemas_dir: string` — default `law/schemas`.
- `extractor_params.docs_drift.worktree_cap_source: string | null` — path of the file carrying the `WORKTREE_CAP` constant; `null` disables check 3 (adopters don't carry DEVAI's core source). Default `null` for adopters; DEVAI's own invocation passes `packages/core/src/loop/worktrees.ts`.

## Out of scope

- **Phase-status / narrative claims** ("All N phases shipped"). Not machine-derivable without parsing prose semantics; remediated structurally instead (BUILD-PLAN restructure delegates status to one maintained section).
- **Test-count claims.** Suite counts change per commit; the remediation is to not hand-write them (D-108), not to chase them.
- **LLM-judged coherence of prose.** That is `llm_judge` / soft-gate territory; this sensor stays deterministic L0.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/sensors/docs_drift.md (classification CURRENT).
