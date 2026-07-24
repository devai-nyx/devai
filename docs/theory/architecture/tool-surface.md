# Tool surface

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchors:** [D-26](../../../law/adr/README.md) established the
two-layer surface; [D-129](../../../law/adr/README.md) established the current
hierarchical CLI contract. Historical count estimates in D-26/D-36 remain
forensic records, not current inventory.

## Rule

DEVAI exposes two distinct layers:

- **Actions** are registered CLI operations. They declare authority, effects,
  lifecycle, consent, and invariant coverage. Most are deterministic; actions
  that bridge to an LLM or host operation still remain governed by their
  explicit contract rather than becoming an implicit agent.
- **Skills** are governed compositions of actions. A skill may invoke an LLM,
  but its manifest still declares authority role, lifecycle, write scopes,
  mutation policy, and evidence behavior.

The live inventories are generated, not counted in this page:

```bash
devai catalog actions
devai agent skill list
devai spec validate action coverage
```

Generated command documentation under [`../../reference/cli/`](../../reference/cli.md)
is derived from the same registry. A hand-maintained number here would be a
second source of truth.

## Supported and experimental surfaces

Every action and skill declares `supported`, `experimental`, or `retired`
lifecycle provenance. Experimental entries are visible and auditable, but they
do not promote supported readiness.

Direct skill invocation is human-operated through `devai agent skill run`.
Mutation-capable skills require `--write`; remote publication also requires
`--allow-publish`. Experimental writers additionally require the applicable
feature flag and `--experimental`. The experimental autonomous loop can select
only its bounded lifecycle-eligible surface and must stop for human review; it
does not merge, publish, complete work, or destroy recoverable state.

## Contract consequences

1. **Use the hierarchical grammar.** Adopters integrate through the generated
   `devai <domain> <noun> <verb>` paths. Removed flat paths are not a
   compatibility surface while DEVAI remains pre-1.0.
2. **Effects fail closed.** A registered action has an explicit effect contract;
   unknown actions cannot silently inherit `read` semantics.
3. **Authority is scoped honestly.** DEVAI enforces mutations within its
   CLI/runtime boundary. Arbitrary shell, editor, and host-agent enforcement is
   claimed only through a verified host adapter.
4. **Read observations stay read-only.** Durable readings and evidence-chain
   appends use explicit role-declared, write-consented recording actions.
5. **Coverage is mechanical.** `devai spec validate action coverage` fails when
   a registered action lacks invariant coverage; generated reference drift is
   separately byte-checked.

## Why two layers remain useful

The split prevents atomic operations and orchestration policy from collapsing
into one ambiguous abstraction. Actions remain individually testable and
scriptable. Skills make sequencing, prompts, budgets, scopes, and evidence
requirements explicit. A successor decision is required if that boundary stops
being mechanically distinguishable.

## See also

- [`cli-grammar.md`](../../reference/cli-grammar.md) — hierarchical command grammar.
- [`../../reference/cli/`](../../reference/cli.md) — generated action reference.
- [`../../reference/skills/`](../../reference/skills) — generated skill
  reference with lifecycle labels.
- [`../../meta/security/authority-enforcement.md`](../../dev/security/authority-enforcement.md)
  — exact enforcement boundary.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/tool-surface.md (classification CURRENT).
