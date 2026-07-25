# Round-prompts library (B0–B4)

**Authority:** Architect (DEVAI R2 / W12). Adopted from SGP's `docs/gov/prompts/B0..B4` and made repo-agnostic.

This library holds the operational templates that the [round-execute skill](../../reference/skills/round-execute.md) drives. Each template is a markdown document the round-runner (human or agent) reads when executing the phase it documents.

## Reading order

| File                                           | Phase   | Skill                                                                          | When to read                                                            |
| ---------------------------------------------- | ------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [B0-audit.md](./B0-audit.md)                   | measure | [`SKILL-round-audit`](../../reference/skills/round-audit.md)                   | Round opens. Snapshot the state.                                        |
| [B1-backlog.md](./B1-backlog.md)               | plan    | [`SKILL-round-backlog`](../../reference/skills/round-backlog.md)               | Audit complete. Materialize the backlog.                                |
| [B2-wave-plan.md](./B2-wave-plan.md)           | plan    | [`SKILL-round-backlog`](../../reference/skills/round-backlog.md)               | Backlog drafted. Group into waves with effort hints.                    |
| [B3-orchestrate.md](./B3-orchestrate.md)       | execute | [`SKILL-round-orchestrate`](../../reference/skills/round-orchestrate.md)       | Worker prompts materialized. Drive the wave loop.                       |
| [B4-verify-publish.md](./B4-verify-publish.md) | compare | [`SKILL-round-verify-publish`](../../reference/skills/round-verify-publish.md) | Round work complete. Verify and close the disposable workspace locally. |

## How to import into an adopter

The templates are **repo-agnostic**. Adopters use them in one of two ways:

1. **Copy** — `cp -r docs/adopters/round-prompts /<adopter>/docs/gov/prompts/`. Edit placeholders inline. Loses the link back to DEVAI's canonical version when the canon updates.
2. **Symlink** — `ln -s ../../../devai/docs/adopters/round-prompts /<adopter>/docs/gov/prompts/`. The adopter's `docs/gov/prompts/` always tracks DEVAI's canon. Recommended for TEAT-style delegation (`gov/` delegated to a sibling DEVAI checkout per [`../docs-layout.md`](../../adopters/docs-layout.md)).

Either way, the templates' `{{placeholders}}` resolve from the adopter's `.devai/config/project.json`. The mapping is documented at the top of each template.

## Placeholder conventions

The templates use `{{snake_case}}` for repo-specific identifiers. The canonical source of values is the adopter's `.devai/config/project.json`. Common placeholders:

| Placeholder                | Source                                   | Example                 |
| -------------------------- | ---------------------------------------- | ----------------------- |
| `{{repo_name}}`            | `project.name`                           | `stynx`, `pec`, `teat`  |
| `{{build_cmd}}`            | `project.commands.build`                 | `pnpm build`            |
| `{{lint_cmd}}`             | `project.commands.lint`                  | `pnpm lint`             |
| `{{typecheck_cmd}}`        | `project.commands.typecheck`             | `pnpm typecheck`        |
| `{{test_cmd}}`             | `project.commands.test`                  | `pnpm test`             |
| `{{integration_test_cmd}}` | `project.commands.test_integration`      | `pnpm test:integration` |
| `{{round_n}}`              | runtime input from `SKILL-round-execute` | `3`                     |

If a placeholder is missing from `project.json`, the round-runner SHOULD halt and ask the operator rather than guessing a default.

## See also

- Round-execute skills: [`../../reference/skills/`](../../reference/skills).
- DEVAI's adopter docs: [`../`](../../adopters).
- Source: SGP `docs/gov/prompts/B0..B4` (SGP-flavored); these are the repo-agnostic re-authorings.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-prompts/README.md (classification DUPLICATE).
