---
adr_id: ADR-MUTATION-SCENARIOS
title: Mutation scenario contract — scenario unit, schema, runner/verifier boundary, versioning
status: accepted
date: 2026-05-25
authors: ["@aarusso"]
tags: [round-11, mutation, scenarios, verify-mutation, adopter-contract]
---

# ADR-MUTATION-SCENARIOS — DEVAI-owned mutation scenario contract

**Authority:** Architect.
**Related:** Constitution Articles 6 (substrate authority-by-path), 29 (test as sensor), 32 (sensor adapter uniformity), 36 (DEVAI applies to itself), 38 (JSON canon), 39 (explicit uncertainty over false precision). D-A-44 (this entry). Resolves TEAT G3 from `align/proposals/teat-to-devai.md`.

## Status

Accepted on 2026-05-25 (R11-W1.01). Worker 02 (R11-W2) authors the scenario JSON Schema; worker 03 implements the `devai mutation run` CLI; worker 04 spikes TEAT migration. The companion adopter guide lives at `docs/adopters/mutation-scenarios.md` (authored by worker 02).

## Context

TEAT Round 3 retired several adopter scripts in favor of DEVAI CLI surfaces (`record-run`, `evidence-emit`, `render-matrix`, `verify-mutation`). Mutation verification was the one place this could not complete: TEAT renamed `scripts/verify-mutation-baseline.ts` to `scripts/run-teat-mutation-scenarios.ts` and still runs that adopter-owned producer before invoking `verify-mutation`. The script does two cleanly-separable jobs:

1. **Domain-specific scenario data.** A list of `MutationScenario` records with TEAT legal-domain naming (`ait-finalize-status-guard`, `evidence-upload-method`, `mobile-encrypted-store-required`), each binding a target file, a `find`/`replace` literal pair, a tier (`tier1`/`tier2`/`tier3`), and the vitest specs expected to detect the mutation. There are 27 of them in commit `45fef834`.

2. **Generic mutation runner/reporting mechanics.** Read original file → write mutated file → run named test specs → time the run → classify the outcome (`Killed`/`Survived`/`Timeout`/`RuntimeError`) → restore the file → aggregate per-package/system scores → emit `reports/mutation/mutation.json` (Stryker-compatible) AND `.devai/state/mutation/current.json` (the file `verify-mutation` consumes). None of this is TEAT-specific.

DEVAI's current `verify-mutation` (`packages/cli/src/commands/verify/mutation.ts`) consumes the second output and compares it against a baseline + `thresholds.json`. It accepts either DEVAI's flat shape (`mutation_score`/`survived`) or a Stryker-style `metrics.mutationScore`. The contract upstream of `verify-mutation` — *how the current.json gets produced* — is undefined; every adopter currently rolls their own.

Per Article 36, a framework that requires every adopter to ship a bespoke mutation producer has not applied itself to its own development. Per Article 32 (sensor adapter uniformity), the mutation sensor's *input* shape (scenarios) deserves the same normalization that its output shape already has.

This ADR fixes the contract upstream of `verify-mutation` without breaking `verify-mutation` itself.

## Decisions

### Decision 1 — Scenario unit: directory of file-per-scenario JSON, glob-matched

**Decision.** Scenarios live as one JSON file per scenario in a configurable directory tree, default `tests/mutation/scenarios/**/*.json`. The directory and glob are configurable through `.devai/config/mutation.json` (key: `scenarios_glob`). Each file is one `MutationScenario` object. Adopters MAY group files into subdirectories by domain or tier; DEVAI does not interpret subdirectory names.

**Rationale.** File-per-scenario is the only unit that scales to TEAT's 27 scenarios today and to a hundred without producing an unreviewable mega-file. It also lets `git blame` and code review attribute each scenario individually, which the single-registry-array alternative cannot. Glob-matching keeps DEVAI ignorant of adopter naming conventions (Decision 4). JSON (not YAML) is required by the locked stack choices in `DESIGN-DECISIONS.md` and by Article 38 (JSON canon).

**Alternatives considered.**
- **(b) Single registry file** (e.g., `tests/mutation/scenarios.json` with a top-level array) — rejected: review friction at scale, large diffs on additions, and the single-writer bottleneck makes it hard to land independent scenarios in parallel waves.
- **(c) YAML files** — rejected: violates the JSON canon (Article 38) and the locked stack choice. Adopter convenience does not outweigh consistency with the other 22 contract schemas under `docs/framework/schemas/`.
- **(d) TypeScript scenario modules** (current TEAT approach) — rejected: every adopter must compile and version-pin TS tooling just to declare scenarios. The whole point of this ADR is that data should be data.

### Decision 2 — Schema shape

**Decision.** Each scenario file conforms to `docs/framework/schemas/mutation-scenario.schema.json` (authored by worker 02 per this ADR). Required fields:

```json
{
  "schema_version": "1.0.0",
  "id": "AIT-001",
  "kind": "mutation",
  "target": {
    "file": "domain/ait-ait-lifecycle/api/src/.../ait-commands.service.ts",
    "symbol": "AitCommandsService.finalize"
  },
  "mutations": [
    {
      "type": "string-replace",
      "find": "const ait = await this.requireAitStatus(id, ['draft']);",
      "replace": "const ait = await this.requireAitStatus(id, ['issued']);",
      "mutator_name": "ArrayDeclaration"
    }
  ],
  "expectations": [
    {
      "assertion": "tests-detect",
      "specs": ["tests/unit/domain/wave2-legal-commands.spec.ts"],
      "threshold": { "status": "Killed" }
    }
  ],
  "domain_tags": ["tier1", "ait-lifecycle"],
  "rationale": "Finalization MUST accept only draft AITs."
}
```

**Required fields:** `schema_version`, `id`, `kind` (literal `"mutation"`), `target`, `mutations` (≥1), `expectations` (≥1).

**Optional fields:** `target.symbol`, `target.invariant_ref` (cross-link to an invariant id from `docs/framework/schemas/invariant.schema.json`), `domain_tags`, `rationale`.

**`mutations[].type` values (v1.0.0):** `string-replace` (literal find/replace, one occurrence required), `regex-replace` (single-occurrence regex). The schema reserves `ast-mutator` for a future v1.1 that delegates to a named mutator with a payload (e.g., Stryker mutator names).

**`expectations[].assertion` values (v1.0.0):** `tests-detect` (named specs must fail when the mutation is applied — i.e., the mutant is `Killed`), `tests-tolerate` (named specs must continue to pass — used to assert that a mutation in non-load-bearing code does NOT regress tests).

**Rationale.** Per Article 32 (sensor adapter uniformity), the shape is a normalized envelope: `id`/`kind` for routing, `target` for *where*, `mutations` for *what changes*, `expectations` for *what the sensor must observe*. Per Article 39, the schema separates the three with named keys instead of overloading one "scenario" object — operators read what each field means from the field name. The shape generalizes the TEAT script's `find`/`replace`/`specs` triple without inheriting any TEAT-specific vocabulary.

**Alternatives considered.**
- **Single flat record** (TEAT's current `MutationScenario` interface) — rejected: conflates `target`, `mutation`, and `expectation` into sibling string fields, which forces the schema to grow horizontally for every new dimension (timeout, multi-spec OR semantics, multi-mutation atoms).
- **Stryker config passthrough** (let adopters embed a Stryker `mutator` block) — rejected: couples DEVAI to Stryker's schema, and Stryker's own shape is geared at AST mutators per file, not at named scenarios with expectations.
- **Inline test code** (each scenario carries a test snippet) — rejected: violates Inspector authority (Article 6 — tests live under `tests/`, not under scenario JSON).

### Decision 3 — Runner-vs-verifier boundary: DEVAI supports both

**Decision.** `verify-mutation` remains a pure verifier (consumes `current.json`, compares to baseline + thresholds, emits a verdict). A new `devai mutation run` command produces `current.json` from scenarios. The two are independent: an adopter may use either, both, or neither.

`devai mutation run` has two modes selected by `.devai/config/mutation.json`:

1. **Built-in runner** (default). DEVAI implements `string-replace` and `regex-replace` mutators in-process: read file → apply mutation → invoke a configured test command → restore file → classify outcome. The configured test command lives under `mutation.test_command` in `.devai/config/mutation.json` (e.g., `pnpm exec vitest run --config vitest.config.ts`). The runner appends `expectations[].specs` as positional arguments.

2. **Adopter-declared mutator adapter** (`--mutator <module>` or `mutation.mutator` in config). DEVAI dynamically imports an adopter ESM module exporting `default: (scenario, ctx) => Promise<MutantReport>`. This is the escape hatch for adopters whose mutation semantics exceed `string-replace` (e.g., AST mutators, multi-file atomic mutations, custom timing requirements). The adapter is responsible for produc­ing one `MutantReport` per scenario; DEVAI aggregates.

Both modes emit the same `.devai/state/mutation/current.json` shape that `verify-mutation` already consumes (Decision 6).

A third path is preserved unchanged: **external producer**. An adopter that already runs Stryker, Pitest, or any other framework can write `current.json` themselves and skip `devai mutation run` entirely. `verify-mutation` does not care how `current.json` was produced.

**Rationale.** Per Article 32, the sensor (verify-mutation) and the producer (run-mutation) are separate substrates with separate authorities. Decoupling lets DEVAI ship a useful default runner for adopters who want one, without forcing it on adopters who have invested in alternative tooling. The adopter adapter slot is what makes the contract universal: any scenario expressible in JSON can be executed by an adopter-owned mutator if the built-in is insufficient.

**Alternatives considered.**
- **Runner-only (no verifier separation)** — rejected: breaks the substantial existing investment in `verify-mutation` and the externally-produced `current.json` path that TEAT/Stryker users rely on. Violates Article 36 (don't break our own pilots).
- **Verifier-only (refuse to run mutations in-process)** — rejected: leaves the "every adopter ships a producer" problem unsolved. The whole motivation for this ADR is to remove that requirement.
- **Single mode (built-in runner is the only path)** — rejected: forces adopters with non-string mutators to either downgrade their mutation strategy or maintain a parallel runner. The adapter slot costs little and prevents lock-in.

### Decision 4 — Domain content isolation: schema is domain-agnostic; adopter brings names/strings

**Decision.** No DEVAI schema field, error message, default value, or CLI surface contains domain-specific vocabulary. Specifically:

- The `id` field is an opaque string. DEVAI does not parse it (no `AIT-` prefix interpretation; no tier inference from id).
- The `domain_tags` field is a free-form `string[]`; DEVAI uses it only for filtering (`devai mutation run --tag tier1`) and reporting. Tag values are adopter-defined.
- The `target.symbol` and `target.invariant_ref` fields are adopter-resolved strings. DEVAI does not validate symbol names against any language model; the invariant ref is cross-checked against the adopter's invariant inventory only when the inventory is configured.
- The `rationale` field is free-form prose. DEVAI does not parse it.

`docs/adopters/mutation-scenarios.md` explains the convention by example, citing TEAT's tiers (`tier1`/`tier2`/`tier3`) and naming as one valid pattern among many. DEVAI itself ships no examples that contain legal/medical/financial domain vocabulary.

**Rationale.** Per Article 6 (substrate authority-by-path), `docs/framework/schemas/` is Architect-owned framework substrate; adopter terminology is Owner-owned product substrate (`docs/framework/product/`). Mixing them under `docs/framework/schemas/` would break authority separation. Per Article 36, DEVAI's self-application must be expressible in the same schema as TEAT's (DEVAI mutates its own `packages/core/src/skills/index.ts` for self-testing); a schema that names AITs cannot do that.

**Alternatives considered.**
- **Convention-by-naming** (e.g., DEVAI honors `tier1`/`tier2`/`tier3` as first-class) — rejected: TEAT's tier model is one of many; SGP and PEC may have different tier semantics. Encoding TEAT's choice as DEVAI default is exactly the leak this decision rules out.
- **Schema extensibility hook** (e.g., `domain_extensions: object`) — rejected: invites schema sprawl. Adopters can fold domain data into `domain_tags` (filtering) and `rationale` (documentation) without a new field.

### Decision 5 — Versioning: per-file `schema_version`; DEVAI supports the last two; deprecation policy

**Decision.** Every scenario file declares `schema_version` (semver string). DEVAI's loader supports the current major version AND the immediately previous major version. Older versions emit a load error with a migration pointer.

Within a major version, additive fields (new optional keys, new `mutations[].type` or `expectations[].assertion` values) bump the minor version. Breaking removals, renames, or required-field changes bump the major version AND require a new ADR (Decision 7).

**Deprecation policy.** When DEVAI ships version N+1, version N is marked `deprecated` in the CHANGELOG and in a load-time warning. Version N is removed at version N+2. Adopters get one full major-version cycle to migrate. Removal of support for a deprecated version is itself a CHANGELOG entry but does not require its own ADR (the original deprecation ADR governs).

**Mixed versions in a single repo.** Permitted. DEVAI loads each scenario file independently; a repo migrating gradually MAY have `1.0.0` and `1.1.0` scenarios side-by-side. `2.0.0` and `1.x` MAY coexist during the N+1 transition; `3.0.0` and `1.x` together are a load error.

**Rationale.** Per Article 39 (explicit uncertainty over false precision), an unversioned schema file is one whose contract is read implicitly from whichever code version the operator happens to be running. Per Article 36, DEVAI must be migratable in place; the two-version support window is the minimum that lets a multi-adopter ecosystem upgrade asynchronously.

**Alternatives considered.**
- **No versioning** (rely on `package.json` version of `@devai-nyx/cli`) — rejected: scenarios live in the adopter repo on the adopter's update cadence; DEVAI's release cadence is decoupled.
- **Support every historical version forever** — rejected: unbounded compatibility surface; the load path complicates with every minor.
- **Single-version-only** — rejected: a flag-day upgrade across all DEVAI adopters for every schema change is not realistic.

### Decision 6 — Backward compatibility: `devai mutation run` emits the existing `current.json` shape

**Decision.** `devai mutation run` writes `.devai/state/mutation/current.json` in the exact shape `verify-mutation` already consumes:

```json
{
  "schemaVersion": "1.0.0",
  "mutation_score": 100.0,
  "survived": 0,
  "report_path": "reports/mutation/mutation.json"
}
```

It MAY also write the richer Stryker-compatible report to the `report_path` location for adopters who want a per-mutant HTML report. The richer report is OPTIONAL; `verify-mutation` consumes only the flat fields. Every field `verify-mutation` reads today (`mutation_score`, `survived`, `metrics.mutationScore`, `metrics.survived`) continues to be read; no field is removed from `current.json`.

**Adopter migration:**

- **TEAT** — can delete `scripts/run-teat-mutation-scenarios.ts` by translating its 27 `MutationScenario` records to 27 JSON files under `tests/mutation/scenarios/` (worker 04 spike). The `package.json` script becomes `devai mutation run && devai verify-mutation --current .devai/state/mutation/current.json --thresholds .devai/config/thresholds.json --human`. The existing `verify-mutation` invocation is unchanged.
- **Adopters with external producers (Stryker/Pitest)** — no change required. They continue to write `current.json` themselves and run `verify-mutation`. They MAY adopt the scenario format later or never.
- **DEVAI itself (Article 36)** — adds at least one self-applied mutation scenario under `tests/mutation/scenarios/` covering a critical path in `packages/core` (which one is worker 03's choice; the point is DEVAI exercises its own contract).

**Cited articles:** Article 36 (self-application; we cannot ship a contract that breaks `verify-mutation`'s existing consumers), Article 38 (JSON canon; the `current.json` shape is the JSON envelope verify-mutation already reads).

### Decision 7 — Breaking-change policy: scenario schema major bumps require ADR

**Decision.** Any change to `mutation-scenario.schema.json` that removes a field, renames a field, changes a required-field's type, or removes a `mutations[].type` / `expectations[].assertion` enum value bumps the major version AND requires a new ADR. The ADR enumerates:

1. What changed and why.
2. Which adopters are affected (run a survey across known consumers).
3. The migration path (with a worker-authored codemod or a documented mechanical translation).
4. The deprecation window and removal date for the prior major.

Additive changes (new optional fields, new enum values) do NOT require an ADR — they bump the minor version and land via a CHANGELOG entry.

**Rationale.** Per Article 6, the scenario schema is Architect substrate; changes to it carry the same governance burden as changes to `invariant.schema.json` or `task.schema.json`. The ADR requirement prevents drive-by major bumps and forces a multi-adopter survey before the breakage.

**Alternatives considered.**
- **All changes require ADR** — rejected: high friction for purely additive evolution; minor bumps would never happen.
- **No ADR requirement; CHANGELOG only** — rejected: under-governs breaking changes to a contract used by multiple adopters.

## Consequences

**Positive.**
- TEAT G3 closes: TEAT can delete `scripts/run-teat-mutation-scenarios.ts` and declare its 27 scenarios as JSON files.
- Per Article 36, DEVAI applies the contract to itself starting from worker 03's implementation.
- `verify-mutation` is unchanged; no existing consumer breaks.
- The adapter slot (Decision 3) prevents the contract from limiting adopters with non-string mutation strategies.
- The schema is domain-agnostic by construction (Decision 4); future adopters in unrelated domains inherit the contract for free.

**Negative / trade-offs.**
- Three substrates to maintain instead of one: the scenario schema, the built-in runner, and the verifier. Worth it because each has a single responsibility (Article 32).
- The adapter slot is a dynamic-import surface; misconfigured adapters surface as load errors. Worker 03 must document the adapter contract precisely.
- File-per-scenario means 27 files for TEAT instead of one. Mitigated by glob loading and subdirectory grouping.

## Out of scope

- AST mutators (`ast-mutator` `mutations[].type`). Reserved for v1.1.
- Multi-file atomic mutations (one scenario mutating two files simultaneously). Reserved for a future minor; the `mutations` array shape permits it without a schema break.
- A `tests-detect-any` / `tests-detect-all` semantics distinction. v1 treats `tests-detect` as "the configured test command exits non-zero when the named specs run with the mutation applied" — which collapses to "at least one named spec fails."
- Cleanup policy for the optional Stryker-compatible report under `report_path`. Adopter's responsibility.
- Concurrency: parallel scenario execution. v1 runs scenarios sequentially. A future minor MAY add `mutation.parallelism` to `.devai/config/mutation.json`.

## Implementation notes for downstream workers

- **R11-W2.02 (worker 02)** authors `docs/framework/schemas/mutation-scenario.schema.json` per Decision 2 and `docs/adopters/mutation-scenarios.md` cross-linked from this ADR.
- **R11-W2.03 (worker 03)** implements `devai mutation run` per Decision 3 (built-in runner + adapter slot), including the self-applied scenario under `tests/mutation/scenarios/` (Article 36).
- **R11-W3.04 (worker 04)** spikes the TEAT migration per Decision 6: convert all 27 TEAT scenarios to JSON, validate the new `current.json` matches the legacy producer's output for the same source state, run TEAT's full `pnpm check` gate.

**Per-batch verification gates (per `CLAUDE.md`):** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`. Worker 02's schema addition mandates a schema-instance round-trip test in the workers' batches.

## References

- `align/proposals/teat-to-devai.md` § Gap 3 (source motivation).
- `/Users/aarusso/Development/stech/teat/scripts/run-teat-mutation-scenarios.ts` (current TEAT producer — domain content to be migrated).
- `packages/cli/src/commands/verify/mutation.ts` (current `verify-mutation` contract — unchanged by this ADR).
- `docs/adopters/mutation-scenarios.md` (companion adopter guide — authored by R11-W2.02).
- `ADR-ROUND-EXECUTE-SEMANTICS` (precedent for ADR sectioning and gate-evidence parallels).
- Constitution Articles 6, 29, 32, 36, 38, 39.
