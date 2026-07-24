# Skills (Layer 2)

**Authority:** Architect (Constitution Article 6) for the manifest contracts; per-skill authority varies (declared in each skill's `authority_role`).

DEVAI's Layer-2 skills are governed workflows that compose Layer-1 tools, may invoke an LLM, and emit evidence into `record/proofs/skills/<skill-id>/`. See [`../../docs/theory/architecture/tool-surface.md`](../../theory/architecture/tool-surface.md) for the two-layer split and rationale.

Skills are registered in [`packages/core/src/skills/index.ts`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/packages/core/src/skills/index.ts) as `SkillEntry` records and listed by `devai agent skill list`.

## Round-execute family (R2)

The round-execute family promotes SGP's `sgp-round-*` skills into DEVAI's universal substrate. The loop is **measure → plan → execute → compare**, materialized under `scratch/sessions/rounds/round-<N>/`:

| Skill | Phase | Doc |
|---|---|---|
| [`SKILL-round-audit`](./round-audit.md) | measure | Collect sensor readings, compute scorecard, write `audit/scratch.md`. |
| [`SKILL-round-backlog`](./round-backlog.md) | plan | Turn audit findings into a prioritized backlog and materialize orchestrator + worker prompts. |
| [`SKILL-round-orchestrate`](./round-orchestrate.md) | execute | Dispatch workers, gate each wave, invoke fix-up skills on failure. |
| [`SKILL-round-verify-publish`](./round-verify-publish.md) | compare | Re-run gates, diff scorecard vs baseline, and write a disposable local closeout. |
| [`SKILL-round-execute`](./round-execute.md) | driver | Executes one round end-to-end; composes the four phases; always stops at the disposable local close. (Renamed from SKILL-round-loop in R3-W2.) |

## Fix-up family

Gate-recovery skills invoked by the round orchestrator when a gate fails mid-wave:

| Skill | Gate | Doc |
|---|---|---|
| [`SKILL-fix-lint`](./fix-lint.md) | `sense lint` / `eslint .` | Runs `eslint --fix`; re-evaluates the gate. |
| [`SKILL-fix-build`](./fix-build.md) | `sense build` / `tsc -b` | Diagnoses; surfaces the SensorReading for downstream remediation. |
| [`SKILL-fix-test`](./fix-test.md) | `sense test --suite unit` | Diagnoses; surfaces the SensorReading. |

## Where else to look

- Round-prompts library: [`../../adopters/round-prompts/`](../../dev/round-workflow) (B0..B4 templates the skills consume).
- Tool-surface rationale: [`../../docs/theory/architecture/tool-surface.md`](../../theory/architecture/tool-surface.md).
- Skill manifest schema: [`../../law/schemas/skill-manifest.schema.json`](../../../law/schemas/skill-manifest.schema.json).
- Skill-roadmap (which skills land in which phase): [`../../docs/theory/architecture/skill-roadmap.md`](../../dev/skill-roadmap.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/skills/README.md (classification CURRENT).
