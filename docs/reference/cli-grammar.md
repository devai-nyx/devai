# CLI grammar

> **Superseded (Round 16, D-129).** This document describes the 0.4 two-level `<noun> <verb>` grammar. DEVAI 0.5 replaced it with a registry-derived, arbitrary-depth command tree — see [`law/adr/ADR-CLI-INFORMATION-ARCHITECTURE.md`](../../law/adr/README.md) and D-129. The 0.4 noun table below (e.g. `inv`, `task`, `loop`, top-level `upgrade`) no longer matches the shipped surface; the "two-level nesting only" rule is retired (the "three-level nesting becomes load-bearing" revisit trigger in fact fired). The rationale for noun-first grouping remains valid history.

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-27](../../law/adr/README.md) — "Noun-verb subcommand grouping (soft)"; superseded by D-129.

## Rule

DEVAI's command surface uses **noun-verb** subcommand grouping:

```
devai <noun> <verb> [args] [flags]
```

Examples:

- `devai inventory modules` (inventory the modules)
- `devai sense test` (run the test sensor)
- `devai work task spawn TASK-0042` (spawn a worktree for the task)
- `devai govern score compute --ref HEAD` (compute the scorecard)
- `devai agent prompt compose --pc PC-0001` (compose a prompt)
- `devai policy check prompt overlays` (run the prompt-overlay validator)

The verb is always last. A `devai <noun>` invocation without a verb prints the available verbs for that noun.

## Rationale

Flat verb-noun (`devai list-modules`, `devai run-tests`, `devai spawn-task`) was considered. It works at small scale: when there are ~10 commands, the flat namespace is fine. DEVAI exposes a registry-derived command surface guarded for catalog/documentation parity; prose does not carry a command count. At that scale flat naming breaks down:

- **Discovery degrades.** `devai --help` listing every verb-prefixed command is unscannable. With noun grouping, top-level help shows ~12 nouns; drilling into one noun shows that noun's verbs (typically 3–8).
- **Cognitive clustering fails.** Verb-noun forces alphabetical ordering by verb, scattering related commands (`build-prompt` and `compose-prompt` would be far apart). Noun-noun grouping keeps the related commands adjacent.
- **Typed-command length is worse.** `devai inventory suggest` is no longer than `devai inventory-suggest` once the top-level noun is learned, since tab completion handles the noun.

The noun-verb pattern also matches DEVAI's substrate/aspect taxonomy from the scorecard. The nouns _are_ the conceptual axes:

| Noun       | Concept                                              |
| ---------- | ---------------------------------------------------- |
| `inv`      | F4 inventory                                         |
| `sense`    | Sensors emitting findings                            |
| `spec`     | F1 specification validators                          |
| `task`     | Task lifecycle                                       |
| `worktree` | Worktree lifecycle (F5)                              |
| `db`       | Database isolation                                   |
| `lock`     | Module-level locks                                   |
| `score`    | Scorecard computation                                |
| `triage`   | Triage classification                                |
| `prompts`  | Prompt composition (Article 37)                      |
| `loop`     | Autonomous loop control                              |
| `check`    | Discrete validators (auth, overlays, evidence chain) |
| `docs`     | Doc generation / link validation                     |
| `rtd`      | RTD manifest bundle                                  |
| `skill`    | Layer-2 skill invocation                             |
| `actions`  | Self-describing action catalog                       |
| `init`     | Initialization (only top-level verb)                 |
| `upgrade`  | Framework upgrade (only top-level verb)              |

`init` and `upgrade` are the two exceptions — they're not nested under a noun because they apply at the repo level, not within a substrate.

## Practical consequences

1. **Adding a command picks the right noun first.** A new validator goes under `check`. A new sensor goes under `sense`. A new doc operation goes under `docs`. The choice is rarely ambiguous because the noun catalog matches DEVAI's substrate taxonomy.

2. **`devai catalog actions` returns the full catalog in noun-verb shape.** The byte-identical contract test (`docs/reference/cli/ is byte-identical to what \`docs cli\` would regenerate`) enforces that every command in the catalog also has a doc page under `docs/reference/cli/<noun>/<verb>.md`.

3. **Two-level nesting only.** No `devai inventory modules suggest` (three levels). The pattern is consistently `<noun> <verb>`, and verbs may carry positional arguments and flags but not further sub-verbs.

4. **Top-level commands (without a noun) are rare and require justification.** `init` and `upgrade` qualify because they apply to the framework itself, not to one of its substrates. Adding a third top-level command requires a D-entry.

5. **`cac`'s sub-command API maps cleanly to noun-verb.** Each noun is registered as a sub-command namespace; each verb registers within it. See [`runtime-stack.md`](../theory/architecture/runtime-stack.md).

## When to revisit

A successor D-entry would be needed if:

- The noun catalog itself proves unstable — e.g., if two nouns repeatedly produce ambiguous placement for new commands. So far the substrate-matching has kept noun choice deterministic.
- Three-level nesting becomes load-bearing. This would imply a substrate is large enough to warrant its own sub-grouping, which would also indicate that substrate should probably be a separate framework, not a nested area of DEVAI.
- The flat verb-noun pattern proves measurably easier in adopter usability tests. No evidence currently supports this.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/cli-grammar.md (classification STALE).
