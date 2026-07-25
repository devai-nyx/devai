# Skill roadmap

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-28](../../law/adr/README.md) — "Need-driven skill implementation order (soft)."

## Rule

Layer-2 skills (see [`tool-surface.md`](../theory/architecture/tool-surface.md)) ship in **need-driven** order, not complexity-driven order. The implementation sequence is:

```
triage → materialize-prompt → commit-push → compute-scorecard → compile-backlog →
feedback-iteration → fix-* → emit-rgr → compile-tests-from-docs → assess-state →
review-dry → mutation-test → elicit → align-docs
```

Each skill expands the framework's autonomy when shipped. Skills are added after the orchestrator demonstrably needs them, not before.

## Rationale

A complexity-driven order — simpler skills first to validate the pattern — was considered. Both orders were defensible. Need-driven won because:

- **The framework becomes useful earlier**, even if narrowly. Once `triage` and `materialize-prompt` exist, an Architect can run a partial loop manually and get value. With complexity-driven, the same Architect waits longer for any usable surface.
- **Each subsequent skill expands autonomy** rather than completing a checklist. By the time `mutation-test` ships (relatively late), the prior skills have already been exercised across hundreds of autonomous runs, so the mutation-test skill builds on validated infrastructure.
- **Real adoption pressure refines later skills.** `elicit` and `align-docs` are last because their requirements only become clear once the earlier skills have been operating in adopter repos — the elicitation flow needs the inventory to be real, and doc alignment needs the invariant catalog to be stable.

The cost of need-driven ordering: the first few skills bear more risk because the pattern is still being validated. This was acceptable because the contract-test discipline (every skill has an `agent_class` and `permission_tier`; every skill's tool dependencies are declared) was in place from day one.

## The order, annotated

|   # | Skill                           | Why this slot                                                                                                                                                |
| --: | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | `SKILL-triage`                  | The loop entry point per Article 17. Without triage, no other skill knows what to do.                                                                        |
|   2 | `SKILL-materialize-prompt`      | Article 37 mandates prompt composition. The orchestrator can't dispatch any LLM-backed skill without it.                                                     |
|   3 | `SKILL-commit-push`             | The autonomous loop needs to write commits. Authority firewall lives here.                                                                                   |
|   4 | `SKILL-compute-scorecard`       | The 5×9 grid is the gate. Computing it deterministically unlocks the gate machinery.                                                                         |
|   5 | `SKILL-compile-backlog`         | Once scoring exists, the failing cells become a backlog.                                                                                                     |
|   6 | `SKILL-feedback-iteration`      | The inner RGR iteration loop. Unlocks autonomous remediation.                                                                                                |
|   7 | `SKILL-fix-*`                   | A family. Each fix-* skill is a leaf the iteration loop dispatches to. Added as specific finding classes get common-enough to warrant skill-level treatment. |
|   8 | `SKILL-emit-rgr`                | When iteration caps trigger, escalation must emit an RGR.                                                                                                    |
|   9 | `SKILL-compile-tests-from-docs` | Once invariants stabilize, generating test scaffolds from them is high-leverage.                                                                             |
|  10 | `SKILL-assess-state`            | Snapshots support the Architect's review work.                                                                                                               |
|  11 | `SKILL-review-dry`              | Architectural review without mutation; depends on assess-state.                                                                                              |
|  12 | `SKILL-mutation-test`           | Mutation testing the Inspector substrate. Depends on the test suite being stable enough to mutate meaningfully.                                              |
|  13 | `SKILL-elicit`                  | Owner-facing elicitation. Requires the rest of the framework to be visibly useful before Owners engage.                                                      |
|  14 | `SKILL-align-docs`              | Doc alignment depends on a stable invariant catalog _and_ stable prose conventions. Last.                                                                    |

## Practical consequences

1. **New skill additions don't reorder this list.** They append. The roadmap is the historical ordering, not a re-derivable priority. If a new skill needs to go between two existing slots, that's a successor D-entry explaining the reordering.

2. **The `SKILL-fix-*` family is the only branch point.** New fix-* skills land whenever a finding class becomes common enough to justify dedicated handling. Each is a leaf — adding one doesn't change anyone else's slot.

3. **Skill manifests carry the slot context.** Each manifest's `description` cites the role this skill plays in the overall flow. This is what `SKILL-elicit`'s manifest means by "the Owner-elicitation entry point unlocked by SKILL 1–12 reaching maturity."

4. **Test coverage follows the slot order.** Early skills accumulate the most integration-test coverage because they've existed longest. Later skills inherit the patterns and ship with more tests per skill from day one.

## When to revisit

A successor D-entry would be needed if:

- A previously-deferred skill becomes urgent for reasons not foreseen in the original ordering (an adopter blockers, a security finding requiring elicitation before align-docs is ready, etc.). In that case the successor entry documents the resequence.
- A new skill class doesn't fit the implicit "expand autonomy" framing. For instance, a skill purely for adopter ergonomics that doesn't change autonomous loop behaviour would need its own home in the catalog, possibly a separate skill tier.
- The need-driven framing proves measurably worse than complexity-driven would have been. No evidence currently supports this; the framework's autonomy ratcheted up roughly linearly with each skill ship.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/skill-roadmap.md (classification CURRENT).
