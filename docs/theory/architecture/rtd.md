# RTD manifest

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-41](../../../law/adr/README.md) — "Add `rtd-manifest.schema.json` + `devai spec rtd bundle` as an aggregate signed view (soft)."

## Rule

The **RTD manifest** is a hash-stamped aggregate view of DEVAI's specification surface at a point in time. It bundles:

- Glossary entries
- Invariants
- Trace
- RBAC declarations
- State machines
- Test specs
- Prompt-component hashes
- A rolled-up readiness verdict

…into a single signed envelope identified by `manifest_hash` and pinned to an integration HEAD.

`devai spec rtd bundle` produces the manifest. The 22+ underlying `spec validate` family commands continue to be the direct validators; the bundle is **additive**, a view, not a replacement.

## Rationale

Adopters, ADR authors, and external auditors repeatedly hit the same friction: citing "the DEVAI spec at commit X" meant pinning ~22 schema paths and trusting that the consumer would resolve each one. The pin was fragile — a rebase, a path rename, or a partial fetch could silently break the citation.

The bundle collapses this to a single hash. `RTD-MANIFEST sha256:abc…` is one citable artifact, integrity-checkable, that resolves the entire spec surface at a known commit. This is what unlocks:

- **ADR `rtd_manifest_ref:` front-matter.** An ADR can declare which spec snapshot it was written against. The reader can verify the manifest hash matches.
- **Law-pack distribution.** Clients pulling DEVAI's spec into their own repos get one fetchable artifact, not 22 path lookups.
- **External attestation flows.** Audit pipelines that sign DEVAI's spec for downstream consumers sign one envelope.

The bundle is also a useful diagnostic: comparing two manifests reveals exactly which slice of the spec surface changed between commits, without diffing 22 separate paths.

## Schema shape

`rtd-manifest.schema.json` declares:

| Field | Purpose |
|---|---|
| `schemaVersion` | Schema version this manifest is encoded against |
| `id` | `RTM-NNNN` sequential ID |
| `integration_head` | Git SHA the manifest was bundled against |
| `generated_at` | ISO-8601 timestamp |
| `components.glossary_hash` | Hash of canonicalized glossary content |
| `components.invariants_hash` | Hash of canonicalized invariant set |
| `components.trace_hash` | Hash of canonicalized trace |
| `components.rbac_hash` | (etc.) |
| `components.prompt_hashes` | Map of prompt-component → content hash |
| `readiness.ok` | Boolean — did every underlying `spec validate` verb pass? |
| `readiness.sub_verdicts` | Per-validator verdicts feeding the rolled-up readiness |
| `manifest_hash` | SHA-256 over the canonicalized whole |

Manifests are persisted to `record/proofs/rtd-manifests/RTM-NNNN.json` and indexed by integration_head + generated_at for retrieval.

## Invocation

```
devai spec rtd bundle [--output <path>] [--strict]
```

- `--output <path>`: write the manifest to a specific path in addition to the canonical persistence location.
- `--strict`: fail if any underlying `spec validate` verb produces a non-pass verdict. Without `--strict`, the manifest still bundles but `readiness.ok` is false.

The aggregator:

1. Reads each contract slice from its canonical location.
2. Hashes each slice's canonical form.
3. Runs each `spec validate` verb internally, capturing sub-verdicts.
4. Computes `manifest_hash` over the canonicalized whole.
5. Persists at `record/proofs/rtd-manifests/RTM-<id>.json`.

## Practical consequences

1. **`INV-DEVAI-001` claims `rtd bundle` as `measurable_via`.** The invariant covering "DEVAI applies to itself" requires the bundle to succeed on the framework's own spec.

2. **No backward-incompatible change to existing `spec validate` verbs.** The 22+ validators continue to ship standalone. Adopters who don't need bundling never touch the bundle command.

3. **ADR template carries an optional `rtd_manifest_ref:` field.** Old ADRs (written before D-41 landed) validate without it; new ADRs may include it for stronger spec-anchor citations.

4. **Schema count grew 33 → 34 when the bundle's schema landed.** Each future addition to the bundle's component list is a schema/manifest co-change recorded in a successor D-entry.

5. **Manifests are content-addressed.** Two bundles produced from the same integration HEAD will have identical `manifest_hash`; this enables content-based dedup of attestation artifacts.

## When to revisit

A successor D-entry would be needed if:

- The bundle's component list drifts from the underlying spec set. Adding a 23rd schema without adding it to the bundle's `components` would make the manifest's "spec surface" claim incomplete; both must move together.
- An empirical attestation workflow exposes a missing field in the manifest (e.g., adopter pipelines need a `signed_by` field for chain-of-custody). The schema would extend additively.
- The hash canonicalization rules change at the JSON-canonical layer (e.g., due to an `@devai-nyx/core/json-canon` revision). Manifests produced before and after would have different hashes for identical content; a transition decision would name the cutoff commit.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/rtd.md (classification CURRENT).
