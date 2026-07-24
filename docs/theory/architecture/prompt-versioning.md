# Prompt versioning

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-35](../../../law/adr/README.md) — "Version prompts with skills (soft)."

## Rule

Skill prompt templates version **alongside** skill code, in the same commit and the same release. A skill's behaviour is the join of its code path and its prompt content; both move together or neither moves.

The mechanics:

- Each skill manifest (under `.devai/skills/`) declares its prompt template and a content hash of that template.
- Layer-1 `devai agent prompt compose` records the composed prompt's component hashes as a `prompt-composition` record per Article 37.
- A PR that changes prompt content without bumping the skill's manifest version is rejected by the contract test.
- A PR that bumps the skill code without re-pinning the prompt hash is also rejected.

## Rationale

Version-independent prompts were considered (prompts as a separate artifact bumped independently of skill code). Rejected because a prompt change *is* a behaviour change, and a behaviour change *is* a skill change. Treating them as independently versionable would mean:

- Two coupled commits to land any meaningful behavioural change.
- A skill version that doesn't pin its prompt — making "what behaviour did SKILL-X@v1.2 actually have?" unanswerable without correlating timestamps.
- A hot-fix surface that could update prompts in production without going through skill-level review.

The third concern is the load-bearing one. DEVAI's autonomous loop runs skills under authority constraints (see [`prompt-firewall.md`](./prompt-firewall.md)). If a prompt could change in production without code review, an adopter or operator with access to the prompt registry could silently expand a skill's effective authority — bypassing the firewall.

Co-versioning makes that impossible: the prompt is part of the skill, and changing it requires the same review path as changing the skill's code.

## Practical consequences

1. **Skill manifest `prompt_hash` is mandatory.** Each skill's manifest carries a SHA-256 of its canonical prompt template. The contract test validates the hash matches the file on disk.

2. **`devai agent prompt compose` records component hashes.** The composed prompt is a layered structure (global → role → task → payload); each layer's hash is recorded in the `prompt-composition` record. Drift in any layer is detectable per Article 37.

3. **`devai agent prompt freeze` exists for governed-loop scenarios.** When a long-running governed loop is in flight, an operator can pin the prompt fingerprints so an in-progress run is not affected by a prompt update mid-run. The freeze is recorded; it expires when the run completes.

4. **Hot-fixing prompts** uses the same release discipline as hot-fixing code. There is no separate "prompts-only" release channel.

5. **Versioning is monotonic.** Skill versions only increase. A prompt revert to a prior version requires a forward-going version bump that re-pins the older hash. This preserves the audit chain.

## Where to look

- Skill manifests: `.devai/skills/SKILL-*/manifest.json`.
- Prompt templates: alongside each manifest, in `prompt.md` (or `prompt.<role>.md` for role-specialized variants).
- Composition records: `record/proofs/prompts/PC-<id>.json`, persisted on every dispatch.
- The firewall validator that consumes both: see [`prompt-firewall.md`](./prompt-firewall.md).

## When to revisit

A successor D-entry would be needed if:

- A prompt-only hot-fix surface becomes necessary for incident response (e.g., a discovered prompt-injection vector requires patching faster than a full skill release allows). Even then, the right answer is probably "make the release process faster," not "decouple prompts from skills."
- Skills grow to the point where a single skill carries multiple prompt templates with independent lifecycles. This is currently avoided by keeping skills narrow; a skill that needs multiple lifecycles probably needs to be split.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/prompt-versioning.md (classification CURRENT).
