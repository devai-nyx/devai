# Test weakening

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-56](../../../law/adr/README.md) — "Test-weakening config is per-project; D-21 defaults apply on absence (locked, supersedes D-21's 'defaults-only' implication)."

## Rule

DEVAI's test-weakening detector watches for **silent degradation of the Inspector substrate**: scenarios where a PR reduces the assertion density or assertion strictness of an existing test without an accompanying invariant change.

The detector has tunable thresholds:

- `threshold_ratio` — flag if the new test asserts < `(1 - threshold_ratio) × old`. Default `0.20` (i.e., 20% drop is the flag threshold).
- `absolute_floor` — flag if the new test has fewer than `absolute_floor` assertions regardless of ratio. Default `1`.
- `ignored_paths` — regex list of paths exempt from the check (e.g., test fixtures during a restructure).
- `split_not_weaken` — when a test is split into multiple smaller tests whose union retains the original assertion count, the split is not flagged.

Each adopter project can override these defaults independently via `.devai/config/test-weakening.json`, schema-validated against `test-weakening-config.schema.json`. Absent file → D-21 defaults apply byte-identically to pre-Phase-16.F behaviour.

## Rationale

D-21 originally established the detector and noted thresholds were _intended_ to be tunable. The Phase-16.F realization was that tunable-in-intent had to be tunable-in-fact: hardcoded defaults meant any adopter whose test culture differed from canonical DEVAI's hit either:

- **False positives** if the defaults were stricter than the project's reality (mostly small projects with low assertion density).
- **False negatives** if the defaults were looser than the project's reality (mostly governance-heavy projects with high assertion density and meaningful drift below the 20% threshold).

The config surface resolves both. The defaults remain the canonical-DEVAI tuning; adopters tighten or loosen as their own culture demands.

D-56 also locks in the **error semantics**: values clamp into safe ranges on load (`threshold_ratio` clamped to `[0, 1]`; `absolute_floor` clamped to non-negative). A malformed config doesn't kill the detector — it logs the clamping and continues. The principle: monitoring should fail open, not fail closed.

## Practical consequences

1. **Loader entry point:** `loadTestWeakeningConfig(repoRoot)` in `packages/sensors/src/test-weakening-config.ts`. Reads `.devai/config/test-weakening.json` if present, returns canonical defaults otherwise.

2. **Schema:** `law/schemas/test-weakening-config.schema.json` declares the shape:

   ```json
   {
     "threshold_ratio": { "type": "number", "minimum": 0, "maximum": 1 },
     "absolute_floor": { "type": "integer", "minimum": 0 },
     "ignored_paths": { "type": "array", "items": { "type": "string", "format": "regex" } }
   }
   ```

3. **Schema count grew 34 → 35** when this config schema landed. The bump is recorded in D-56 and rolls into the canon described in [`../contracts/README.md`](../../reference/contracts/README.md).

4. **Adopters tighten or loosen without forking canonical DEVAI.** A governance-heavy project may set `threshold_ratio: 0.05` (flag any 5% drop); a small project may set `0.40` (only flag larger drops).

5. **`ignored_paths` exempts legitimate restructures.** During a code reorganization that legitimately deletes some tests (e.g. the deleted code was itself dead), the matching test paths can be added to `ignored_paths`. The exemption is reviewed in PR like any config change.

6. **Pre-Phase-16.F behaviour is preserved** for repos without the config file. No migration is needed; the absent-file path is the byte-identical fallback.

## Authority and overrides

A test weakening flagged by the detector is a **REVIEW** verdict by default, not a hard fail. The Inspector substrate's Article-24 authority constraint says an Inspector acting alone cannot weaken a test independently: relaxation requires either an Architect invariant change (Article 24) or an RGR (Article 22).

The detector's findings feed:

- **Triage classification**, which decides whether the finding gates the merge.
- **The scorecard's Discipline column (T9)** for the Inspector substrate.

A `test-weakening-override` annotation in the test file can suppress an individual finding when justified, with the override recorded as evidence. Pattern matches DEVAI's `law-override` mechanism (see D-38's consequence #4) but is distinct in scope.

## History

D-21 established the detector with hardcoded thresholds and the _intent_ of per-project tuning.
D-56 realized that intent: shipped the config surface, the loader, the clamping, and the absence-fallback.

D-21 is preserved in `law/register/DECISIONS.md` as the originating record (with strikethrough on its "defaults-only" implication). The supersession is the standard pattern; D-21's reasoning about why the detector matters at all stays load-bearing.

## When to revisit

A successor D-entry would be needed if:

- Empirical evidence shows the default thresholds are wrong for the typical adopter shape (e.g., most adopters override `threshold_ratio` upward, suggesting `0.20` is too strict as a default).
- A new dimension of weakening becomes important — e.g., reduction in assertion _type_ (deep equality → shallow), or reduction in test runtime coverage. Either would extend the schema and likely warrant its own D-entry.
- The clamping behaviour proves problematic in practice (a real config bug masked by silent clamping). Currently the log-and-continue posture has been correct.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/test-weakening.md (classification CURRENT).
