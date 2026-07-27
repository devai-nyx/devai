# Architecture specifications

**Authority:** Architect (Constitution Article 6).

This directory holds Architect-authored engineering specifications: invariants under `invariants/`, the trace mapping in `trace.json`, and architecture notes. Invariants are the atomic Architect-authored spec unit per Article 11; each declares severity, type, scope, change policy, verification, and authority anchors.

## Architecture reference docs

| Doc                                                  | What it covers                                                                                   | Forensic anchor |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------- |
| [`reference-stack.md`](./reference-stack.md)         | Primary NestJS + Angular + Postgres reference stack and the declared-stack adapter-pack boundary | D-5, Article 1  |
| [`persistence.md`](./persistence.md)                 | Raw SQL migrations, no ORM — and why                                                             | D-16            |
| [`runtime-stack.md`](./runtime-stack.md)             | TS strict, ESM, pnpm, Vitest, `cac`, `ajv`, `json-schema-to-typescript`                          | D-29            |
| [`id-scheme.md`](./id-scheme.md)                     | Three-shape ID scheme (sequential, date-stamped, content-hash)                                   | D-32            |
| [`tool-surface.md`](./tool-surface.md)               | Two-layer action + skill contract; live inventories come from the CLI catalogs                   | D-26, D-129     |
| [`cli-grammar.md`](../../reference/cli-grammar.md)   | Noun-verb subcommand grouping, with the noun catalog                                             | D-27            |
| [`skill-roadmap.md`](../../dev/skill-roadmap.md)     | Need-driven order of Layer-2 skill ships                                                         | D-28            |
| [`prompt-versioning.md`](./prompt-versioning.md)     | Prompt templates version alongside skill code                                                    | D-35            |
| [`prompt-firewall.md`](./prompt-firewall.md)         | `devai policy check prompt overlays` + the path-reservation model                                | D-42            |
| [`rtd.md`](./rtd.md)                                 | `rtd-manifest.schema.json` + `devai spec rtd bundle` aggregate view                              | D-41            |
| [`test-weakening.md`](./test-weakening.md)           | Detector + per-project config (`.devai/config/test-weakening.json`)                              | D-21, D-56      |
| [`sensor-inputs.md`](./sensor-inputs.md)             | R26 report-only input-spec, derived-glob, digest, and materialization contracts                  | D-161           |
| [`invariant-taxonomy.md`](./invariant-taxonomy.md)   | Core + client invariant domain set                                                               | D-9             |
| [`invariant-authoring.md`](./invariant-authoring.md) | The CNL discipline for authoring invariants                                                      | —               |

For database operations (per-task DB provisioning, template rebuild) see [`../../meta/ops/db-isolation.md`](../../dev/operations/db-isolation.md). For full-production DB/LLM test defaults and hermetic opt-outs, see [`../../meta/ops/testing.md`](../../dev/operations/testing.md).

## Active invariants

The invariant directory is a live corpus, not a hand-maintained count. Query and
validate it through the same runtime surface used by adopters:

```bash
devai spec validate invariants --format human
find law/invariants -maxdepth 1 -name 'INV-*.json'
```

## Trace

[`trace.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/arch/trace.json) declares which tests probe each invariant. Per
Constitution Article 13, every invariant must have valid test references and
every governed test file must declare valid invariant coverage. Run
`devai spec validate test trace --format human` for the current corpus and its
supported/experimental lifecycle split; this page deliberately does not copy a
point-in-time count.

## Validation

Run `devai spec validate invariants` to check this directory's invariants,
`devai spec validate test trace` to check the complete test mapping, and
`devai spec validate all` for the aggregate F1 validation contract. The
aggregate surface evolves with registered validators, so its live output is the
inventory rather than a count copied into prose.

## Responsibility boundaries

This directory contains current F1 architecture specifications. Governed round intent
and prompts remain in place under `work/rounds/R-NNNN/`; disposable backlog proposals,
orchestration logs, and local closeout remain under
`.devai/state/round-runs/R-NNNN/`; attributable Auditor observations live under
`work/audit/R-NNNN/`; and machine compliance closures live under
`record/proofs/compliance/closures/`. None of those paths is architecture authority.
Canonical D-records and ADRs live under
[`../../meta/adr/`](../../../law/adr/README.md). Their authority is determined by
the Constitution and each record's frontmatter; the generated projections are
navigation surfaces, not competing sources.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/README.md (classification CURRENT).
