# Recipes

DEVAI v1.0rc ships seven host-invoked recipes. Recipes are prompt-and-permission
contracts for Codex and Claude; they are not CLI actions and cannot launch nested
models, publish artifacts, or widen their declared write scope.

| Recipe | Status | Purpose |
| --- | --- | --- |
| `devai-assess` | stable | Read-only health, inventory, and round assessment. |
| `devai-plan` | stable | Read-only change, initialization, and module planning. |
| `devai-fix` | stable | Explicit-file repair for lint, typecheck, build, test, and coverage failures. |
| `devai-docs` | stable | Write one named repository document within its variant scope. |
| `devai-scaffold` | stable | Generate bounded database, API, UI, test, documentation, or CI assets. |
| `devai-verify` | stable | Read-only change, documentation, and RC evidence review. |
| `devai-round` | preview | Coordinate local preview round state without publication. |

The canonical manifests and shared host-neutral bodies live under
`packages/skills/resources/recipes/`. Thin installers render only host-specific
front matter; they do not copy policy into adapters.

Every invocation selects one exact recipe and one manifest-declared variant. A host
must reject undeclared variants, effects, and paths. Local-write variants require the
explicit files or bounded patterns declared by that variant. The preview round recipe
writes only `.devai/state/round-runs/**`.

Deterministic work is implemented as typed operations rather than recipes. Recipes may
name operations, but the host calls those operations directly and remains responsible
for permission enforcement.
