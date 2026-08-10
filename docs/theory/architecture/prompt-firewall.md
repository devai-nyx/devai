# Prompt-overlay firewall

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-42](../../../law/adr/README.md) — "Add `devai policy check prompt overlays` discrete validator; keep unified firewall verdict (soft)."

## Rule

`devai policy check prompt overlays` is the discrete validator that inspects prompt content for **authority inversion** — situations where a layered prompt component (e.g., a Constructor overlay) attempts to grant the consuming skill write access to paths reserved to a different role by Constitution Article 6.

The validator reads `prompt-composition` records, walks the layered components, intersects each layer's declared `allowed_write_scopes` against the authority model derived from the skill's `agent_class`, and emits findings into the **unified `firewall-verdict.schema.json` verdict** when a violation is found.

The unified firewall verdict is **not split** into separate semantic/policy/prompt sub-verdicts. The validator is discrete; the verdict is unified.

## Rationale

Two designs were considered:

1. **Three-firewall split:** semantic / policy / prompt as separate verdicts with separate schemas. Adopted by the sibling exploration (`../../tools/devai`, deleted per D-46).
2. **Unified verdict with discrete validators:** one verdict schema, multiple validators feeding it. Canonical DEVAI's choice.

The unified verdict won because:

- **Findings have the same downstream consumer:** the loop's escalation step + the soft-gate evaluator. Forcing three verdict shapes meant three parsing paths in the consumer for no semantic gain.
- **The verdict's role is risk classification, not phase categorization.** Whether a finding came from a "prompt overlay" or a "semantic check" is provenance metadata, not a structural concern of the verdict.
- **The split scaled badly:** as new validator categories emerged, the three-firewall pattern wanted a fourth/fifth/etc. The unified verdict accommodates new validators by adding finding codes, not new schemas.

The discrete validator (`devai policy check prompt overlays`) is the part of the sibling's design that _was_ adopted, because the gap it closes is real and not covered by any other validator: a Constructor overlay that quietly adds `docs/theory/architecture/**` to `allowed_write_scopes` would otherwise slip past every check.

## The gap this closes

Before D-42, the prompt-composition pipeline recorded:

- Component hashes (per Article 37).
- The composed prompt content (for audit).

What it did **not** do: inspect the prompt content for authority claims. A Constructor overlay declaring `allowed_write_scopes: ["docs/theory/architecture/**"]` would be hashed, composed, and dispatched — and only later, when the skill attempted a write, would the path-based authority guard reject it.

`devai policy check prompt overlays` makes the rejection happen **earlier and explicitly**, with a finding citing the offending overlay and scope. This matters as more skills are LLM-backed: prompt drift becomes a real attack surface, and detection at compose-time is cheaper than detection at write-time.

## Reserved paths

The validator's authority model treats the following paths as reserved by role:

| Path                                                 | Reserved to                                     |
| ---------------------------------------------------- | ----------------------------------------------- |
| `law/constitution.md`                                | Architect (Article 40 governs amendments)       |
| `law/schemas/**`                                     | Architect (F1)                                  |
| `docs/reference/contracts/**`                        | Architect (F1)                                  |
| `docs/theory/architecture/**`                        | Architect (F1)                                  |
| `law/adr/**`                                         | Architect (F1)                                  |
| `docs/dev/operations/**`                             | Architect (F1)                                  |
| `docs/dev/security/**`                               | Architect (F1)                                  |
| `product/**`                                         | Owner (F1)                                      |
| `law/glossary/**`                                    | Architect + Owner joint (F1)                    |
| `.devai/config/**`                                   | Architect / harness only                        |
| `db/migrations/**`                                   | Engineer (F2)                                   |
| `tests/**`, `e2e/**`, `**/*.spec.ts`, `**/*.test.ts` | Inspector (F3)                                  |
| `record/derived/inventory/**`                        | F4 (no human or agent writes; regenerated only) |
| `.devai/` (excluding `inventory/` and `worktrees/`)  | F5 — modified via `devai adopt upgrade` only    |

A Constructor / coding-agent / write-tier overlay that names any of these paths in `allowed_write_scopes` produces a finding with `code: PROMPT_OVERLAY_AUTHORITY_INVERSION` and the offending overlay + scope cited.

## Invocation

```
devai policy check prompt overlays [--pc <PC-id> | --pc-dir <path>] [--strict]
```

- `--pc <PC-id>`: validate one composition record.
- `--pc-dir <path>`: validate every record under a directory (default: `record/proofs/prompts/`).
- `--strict`: any finding fails the exit code; without it, findings emit a verdict but exit 0.

Authority: `policy_firewall` permission tier.

Module: `@devai-nyx/core/prompt-firewall`.

## Practical consequences

1. **CI runs the validator on every PR.** A PR that modifies a skill manifest or overlay must produce a clean verdict.

2. **Findings feed the unified verdict.** `firewall-verdict.schema.json`'s `findings[]` array carries the result; downstream consumers (loop escalation, soft-gate evaluator) handle prompt-overlay findings identically to other firewall findings.

3. **Client-specific reservations extend the path list via config.** Adopters with their own role-reserved paths can declare them in `.devai/config/prompt-firewall.json`; the validator merges canonical reservations with client extensions.

4. **The validator is one of many `devai policy check` enforcers.** The registry of cross-cutting policy checks is intentionally small; domain-specific flags belong in consumer projects. See D-37/D-38 for the law / consumer-chain framing.

## When to revisit

A successor D-entry would be needed if:

- The unified verdict shape proves insufficient for some validator's findings. So far the `firewall-verdict.findings[]` array has absorbed every new validator with just a new `code` value.
- A real prompt-injection vector emerges that the overlay model doesn't cover (e.g., dynamic content inserted by a tool call). The validator would extend, the schema might extend, but the unified-verdict choice would still hold.
- The path-reservation list grows large enough to need its own schema. Currently the reservations are a fixed list + client extensions; growth to dozens of reservations might warrant promoting them.
