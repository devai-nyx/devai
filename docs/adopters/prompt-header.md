# Prompt header — metadata spec

**Authority:** Architect (cross-repo). Cited from [round-break.md §6](./round-break.md#6-prompt-header-metadata) and [CONVENTIONS.md §7](./CONVENTIONS.md#7-work-break-rounds-waves-phases-steps).
**Applies to:** every prompt file under any round's `prompts/` directory — orchestrator and waves alike.

## Format

YAML front matter at the top of the file, between two `---` fences. No blank line above; one blank line below before the `# Title`.

```yaml
---
role: owner | architect | inspector | engineer | auditor
effort: low | medium | high
model: <id>     # optional
vendor: <id>    # optional
---

# R<n>-W<m> — <slug>

...prompt body...
```

## Fields

### Required

| Field | Type | Values |
|-------|------|--------|
| `role` | enum | `owner` \| `architect` \| `inspector` \| `engineer` \| `auditor` |
| `effort` | enum | `low` \| `medium` \| `high` |

### Optional

| Field | Type | Notes |
|-------|------|-------|
| `model` | string | A specific model identifier. **Use only when distinction matters.** |
| `vendor` | string | A specific provider identifier (e.g. `anthropic`, `openai`). **Use only when distinction matters.** |

## Semantics

### `role`

The authority under which the prompt operates. The five-role authority model (see [CONVENTIONS.md §6](./CONVENTIONS.md#6-authority) and CLAUDE.md):

- `owner` — modifies business-tier specs under `product/`.
- `architect` — modifies law/constitution.md, schemas under `law/schemas/`, engineering specs under `docs/{eng,arch,adr,contracts,ops,security}/`, README.md; joint with Owner over `law/glossary/`.
- `inspector` — modifies tests.
- `engineer` — modifies code under `packages/` and configuration files.
- `auditor` — read-only; produces reports.

Orchestrator prompts typically declare `role: architect` (coordinating + dispatching is architectural work). Wave prompts declare the role appropriate to the wave's deliverables.

### `effort`

The agent execution effort level. Maps to how much reasoning depth, iteration, and tool-call budget the wave warrants:

| Level | When to use |
|-------|-------------|
| `low` | Mechanical edits, single-file changes, renames, doc-rot fixes, scaffold-only work, retroactive bookkeeping. |
| `medium` | New schemas / verbs / adopter docs; multi-file refactors; non-trivial test additions; catalog-filling families. |
| `high` | New skill compositions, cross-substrate work, architecturally novel code, anything where the right answer isn't obvious from the prompt. |

**Authoring guidance: target the lowest reasonable effort.** Authoring earnest means naming the actual minimum, not the safe-maximum. A wave authored as `medium` when `low` would suffice wastes budget and signals the wrong urgency.

### `model` and `vendor`

Both optional and rarely used. Pin them only when the distinction materially affects the wave's outcome:

- A wave that exercises a model-specific behavior (e.g., testing prompt-caching against a specific Claude model version).
- A wave that requires a specific tool surface only one vendor exposes.
- A wave that benchmarks one model against another.

Default: omit both. The harness picks the appropriate model based on `role` + `effort` + global config.

## Worked examples

### Orchestrator prompt (low effort, architectural)

```yaml
---
role: architect
effort: low
---

# R3 — Orchestrator
...
```

### Low-effort wave (mechanical edit)

```yaml
---
role: engineer
effort: low
---

# R3-W2 — rename SKILL-round-loop → SKILL-round-execute
...
```

### Medium-effort wave (new contract)

```yaml
---
role: architect
effort: medium
---

# R3-W4 — state-extensions contract + adopter doc
...
```

### High-effort wave (novel composition)

```yaml
---
role: engineer
effort: high
---

# R5-W3 — implement SKILL-round-execute real composition
...
```

### Exceptional case — model/vendor pin

```yaml
---
role: inspector
effort: medium
model: claude-opus-4-7
vendor: anthropic
---

# R7-W2 — verify prompt-caching behaviour against Opus 4.7 (regression suite)
...
```

The pin is justified because the test specifically targets one model's caching semantics; running it on a different model would not exercise the gated behaviour.

## Authoring discipline

- Front matter is **mandatory** for every prompt under `prompts/`. Missing or malformed headers should fail the round at close (treat as a gate failure — `prompt-headers` gate, scope-conditional on rounds that author prompts).
- One blank line between the closing `---` and the first heading. Lint rule.
- Fields beyond the four documented here are not permitted. Add through ADR + canon revision if a fifth field is genuinely needed.

## Cross-references

- Anchor: [CONVENTIONS.md §7](./CONVENTIONS.md#7-work-break-rounds-waves-phases-steps).
- Operational playbook: [round-break.md](./round-break.md).
- Role definitions: [CONVENTIONS.md §6](./CONVENTIONS.md#6-authority), [CLAUDE.md](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/CLAUDE.md) (authority section).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/prompt-header.md (classification CURRENT).
