# Adopter guide: mutation scenarios

**Authority:** Architect. **Schema:** [`docs/reference/contracts/mutation-scenario.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/mutation-scenario.schema.json). **ADR:** [`ADR-MUTATION-SCENARIOS`](../../law/adr/README.md) (D-A-44).

This guide is for adopters who want to declare mutation tests as data rather than ship a bespoke producer script. It is companion to the ADR; read the ADR first if you need the *why*.

## When to write a scenario

Write a mutation scenario when:

- An invariant in your codebase is load-bearing enough that *silent regression of the test that pins it* would be costly. Examples: gate-evidence formats, security-sensitive comparators, billing-rounding logic, contract serialization.
- The mutation is expressible as a small literal or single-occurrence regex edit. v1.0.0 ships `string-replace` and `regex-replace` only; AST-class mutations are reserved for v1.1.
- The expected outcome is observable from your test command's exit code. The runner classifies outcomes from process exit; if your test command always exits zero on failure, fix the test command before adopting scenarios.

Do *not* write a scenario when:

- The mutation requires multi-file atomicity (reserved for a future minor; the `mutations` array shape permits it but the v1.0.0 built-in runner does not execute it as a single transaction).
- The "mutation" is really a fault-injection (network timeout, clock skew, etc.). The schema's `kind` enum reserves space for future kinds; v1.0.0 is `mutation` only.
- You are pinning a behavior that is easier covered by a normal unit test. Mutation scenarios are second-tier coverage; the primary test must exist before the scenario can detect its absence.

## How scenarios map to `verify-mutation`

The pipeline has two stages:

```
scenarios/*.json  ──►  devai sense mutation run  ──►  record/proofs/mutation/current.json  ──►  devai verify-mutation  ──►  verdict
                          (producer)                 (Stryker-compatible flat shape)         (sensor)
```

`verify-mutation` is unchanged by this contract. It still reads `mutation_score` / `survived` (or Stryker's `metrics.mutationScore` / `metrics.survived`) from `current.json` and compares to baseline + thresholds. The contract introduced by D-A-44 is *upstream* of `verify-mutation` — it standardizes the input shape that `devai sense mutation run` consumes.

You can adopt the scenario format without adopting `devai sense mutation run` (use it purely as documentation; keep your external producer). You can adopt `devai sense mutation run` without adopting the scenario format (… you cannot, actually; `devai sense mutation run` consumes scenarios). You can skip both and continue writing `current.json` from any tool (Stryker, Pitest, hand-rolled); `verify-mutation` does not care how `current.json` was produced.

### Configuration

`.devai/config/mutation.json`:

```json
{
  "scenarios_glob": "tests/mutation/scenarios/**/*.json",
  "test_command": "pnpm exec vitest run --config vitest.config.ts",
  "default_timeout_ms": 60000,
  "mutator": "./scripts/my-mutator.mjs"
}
```

- `scenarios_glob` — default `tests/mutation/scenarios/**/*.json`. Override to relocate.
- `test_command` — invoked once per scenario with `expectations[].specs` appended as positional arguments. The exit code determines the verdict.
- `default_timeout_ms` — fallback when a scenario omits `timeout_ms`. Default 60000.
- `mutator` — optional ESM module path for the adopter-declared mutator slot (Decision 3). When set, DEVAI defers all mutation logic to your module; the built-in `string-replace`/`regex-replace` runners are bypassed.

## How `domain_tags` work

`domain_tags` is a free-form `string[]`. DEVAI does not interpret tag values; you assign them, you filter on them.

Two affordances:

- **Filtering:** `devai sense mutation run --tag tier1` runs scenarios whose `domain_tags` contains `tier1`. Multiple `--tag` flags are AND-combined.
- **Reporting:** the optional Stryker-compatible report at `mutation.report_path` groups mutants by tag for review.

Convention examples (none are first-class to DEVAI):

- **Severity tiers:** `tier1` / `tier2` / `tier3` as TEAT uses them.
- **Domain area:** `payments`, `auth`, `signing`, `mobile`.
- **Mutator class:** `boundary`, `string-literal`, `array-decl`.
- **Stability:** `flaky`, `pinned`, `quarantined`.

Mix freely. The schema enforces `uniqueItems` to keep the tag list a set.

## How to migrate from a bespoke producer

The canonical bespoke producer is TEAT's `scripts/run-teat-mutation-scenarios.ts` (27 scenarios as TypeScript records). Migration is mechanical:

1. **Inventory.** List your scenarios. For TEAT this is the `MutationScenario[]` literal in the script.
2. **Translate.** For each scenario, produce one JSON file under `tests/mutation/scenarios/` (or a subdirectory). Field mapping:

   | Bespoke field (TEAT) | Scenario JSON field |
   |---|---|
   | `name` (e.g., `ait-finalize-status-guard`) | `id` |
   | `target` / `file` | `target.file` |
   | `find` | `mutations[0].find` (type `string-replace`) |
   | `replace` | `mutations[0].replace` |
   | `specs` | `expectations[0].specs` |
   | `tier` (`tier1`/`tier2`/`tier3`) | `domain_tags` entry |
   | `description` / inline comment | `rationale` |

3. **Validate.** Each file must validate against the schema. Run `devai inventory contracts` (or your existing schema-validation gate) over the new files.
4. **Wire.** Replace your bespoke-producer invocation in `package.json` with `devai sense mutation run && devai verify-mutation`. The `verify-mutation` call is unchanged from your current setup.
5. **Delete.** Remove the bespoke producer script and its tests once the new pipeline produces a `current.json` that matches your previous output for the same source state.

### TEAT producer shape — expressibility check

TEAT's current shape (from `align/proposals/teat-to-devai.md` § Gap 3 and the ADR's Context section) is:

```ts
interface MutationScenario {
  name: string;          // e.g. 'ait-finalize-status-guard'
  target: string;        // repo-relative path
  find: string;          // literal substring
  replace: string;       // literal substring
  specs: string[];       // vitest spec paths
  tier: 'tier1' | 'tier2' | 'tier3';
}
```

Expressed in the v1.0.0 schema:

```json
{
  "schema_version": "1.0.0",
  "id": "ait-finalize-status-guard",
  "kind": "mutation",
  "target": {
    "file": "domain/ait-ait-lifecycle/api/src/wave2-legal/ait-commands.service.ts",
    "symbol": "AitCommandsService.finalize"
  },
  "mutations": [{
    "type": "string-replace",
    "find": "const ait = await this.requireAitStatus(id, ['draft']);",
    "replace": "const ait = await this.requireAitStatus(id, ['issued']);",
    "mutator_name": "ArrayDeclaration"
  }],
  "expectations": [{
    "assertion": "tests-detect",
    "specs": ["tests/unit/domain/wave2-legal-commands.spec.ts"]
  }],
  "domain_tags": ["tier1", "ait-lifecycle"],
  "rationale": "Finalization MUST accept only draft AITs; flipping the allowed-status list is a silent governance regression."
}
```

Every TEAT field has a destination:

- `name` → `id` (TEAT slugs become DEVAI ids verbatim; DEVAI does not parse them).
- `target` → `target.file`. The optional `target.symbol` is new; TEAT can populate from the spec's surrounding context.
- `find` / `replace` → `mutations[].find` / `mutations[].replace` with `type: "string-replace"`.
- `specs` → `expectations[].specs` under `assertion: "tests-detect"`.
- `tier` → `domain_tags` entry (e.g., `tier1`). DEVAI does not interpret the value.

Expressible: yes. The migration is 1:1 with no data loss; TEAT gains `mutator_name`, `rationale`, optional `target.symbol`, optional `target.invariant_ref`, and optional `timeout_ms` as additive affordances.

## Deprecation policy

Per ADR Decision 5:

- **Per-file `schema_version`.** Every scenario declares its version.
- **N and N-1 supported.** DEVAI's loader supports the current major and the immediately previous major. v1.x is supported under DEVAI v1 and v2; v3 drops v1 support entirely.
- **Minor bumps coexist freely.** v1.0.0 and v1.1.0 scenarios may sit side-by-side; the loader handles each at its declared version.
- **Major bumps require a new ADR** (Decision 7). Adopters get one full major-version cycle to migrate before the prior major is removed.
- **Removal is a CHANGELOG event.** The original deprecation ADR governs; no new ADR is required at removal time.

If you encounter a `schema_version` your loader does not support, you will see a load-time error with a pointer to this guide.

## Cross-references

- ADR: [`law/adr/ADR-MUTATION-SCENARIOS.md`](../../law/adr/README.md)
- Schema: [`docs/reference/contracts/mutation-scenario.schema.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/mutation-scenario.schema.json)
- Examples: [`docs/reference/contracts/examples/mutation-scenario-simple.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/examples/mutation-scenario-simple.json), [`mutation-scenario-complex.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/examples/mutation-scenario-complex.json), [`mutation-scenario-external-runner.json`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/contracts/examples/mutation-scenario-external-runner.json)
- Verifier: `packages/cli/src/commands/verify/mutation.ts` (unchanged by this contract)
- Constitution: Articles 6 (substrate authority), 32 (sensor adapter uniformity), 36 (DEVAI applies to itself), 38 (JSON canon), 39 (explicit uncertainty over false precision)

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/mutation-scenarios.md (classification CURRENT).
