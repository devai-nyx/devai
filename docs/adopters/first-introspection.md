# First introspection (brownfield path)

Goal: take an existing repository, run DEVAI's deterministic L0 inventory sensors against it, and surface a structured set of candidate invariants you can promote into governance.

This is the **brownfield** path. If you're starting a new module from scratch, see [blueprint-authoring.md](./blueprint-authoring.md) instead.

## Prerequisites

- Completed [install.md](./install.md). `pack-resolve` matches your repo to a non-null pack.
- Your repo is in a clean working tree (sensors only read; introspection writes under `record/proofs/` which is gitignored).

## Step 1 — Bootstrap

```bash
export DEVAI=/path/to/devai
node "$DEVAI/packages/cli/dist/bin.js" init plan --target .
node "$DEVAI/packages/cli/dist/bin.js" init apply-f5 \
  --target . --introspect --as-role architect --write
```

The first command is read-only. The second is an explicit Architect-initiated, upgrade-machine F5 transition that writes `record/proofs/init-introspection.json`, summarizing the detected stack, languages, package manager, and frameworks. No application source files are modified. Run the Owner and Architect bootstrap segments from the [adoption guide](./adoption.md) if this repository has not otherwise been initialized.

Verify:

```bash
cat record/proofs/init-introspection.json
```

## Step 2 — Run the seven L0 inventory sensors

Each sensor is deterministic (no LLM), tier L0 (static analysis only), and writes a body file under `record/proofs/sensors/inventory_<kind>/<name>.json`.

```bash
for verb in api routes data-model data-handling rbac dep-graph coverage; do
  node "$DEVAI/packages/cli/dist/bin.js" sense "$verb" \
    --repo-root . \
    --adopter-root . \
    --pack-tune \
    --format human
done
```

`--pack-tune` opts in to pack-provided `extractor_params` defaults (scan dirs, SQL dialect, etc.). Without it, sensors run with framework-agnostic defaults that may scan more broadly than needed.

Exit code `0` = pass (clean reading); `1` = review (sensor ran but found notable conditions worth attention); `2` = fail. The brownfield convention is to accept `0` or `1` and treat review as informational.

### Sensor readings get persisted automatically (Phase 21.E)

Each `sense-*` command writes two artifacts: a **body** under `record/proofs/sensors/<verb>/<file>.json` (the structured inventory) and a **`SensorReading`** record under `record/proofs/sensor-readings/<kind>/<id>.json` (the substrate-level reading the scorecard consumes). The reading carries the status, the evidence-path pointer to the body, and a deterministic `SR-<hash>` id.

If you want to run a sensor without polluting the readings store (e.g., diagnostic reruns from a workflow that already populated readings), pass `--no-emit-reading`:

```bash
node "$DEVAI/packages/cli/dist/bin.js" sense-routes \
  --repo-root . \
  --framework angular \
  --no-emit-reading
```

If you bootstrapped DEVAI before Phase 21.E and already have body files but no reading records, run the aggregator once to backfill:

```bash
node "$DEVAI/packages/cli/dist/bin.js" sense-readings-rebuild \
  --repo-root . \
  --format human
```

`sense-readings-rebuild` walks every `record/proofs/sensors/<verb>/*.json` body file and synthesizes a minimal SensorReading wrapping it. The synthesized readings carry `status: pass` and a stub `REBUILT_FROM_BODY` finding marker (the original sensor's findings/metrics aren't reconstructable from the body alone — a fresh sensor run is the only way to recover those). The scorecard treats them like any other reading.

After this step, `devai govern score compute --repo-root .` will produce a scorecard with non-UNKNOWN cells under the F4 (Inventory) substrate.

### Correctness sensors

Phase 22.F (closes D-A-16). The seven L0 inventory sensors populate F4 (Inventory) cells but leave F2 (Plant — `sense-lint` / `sense-build` / `sense-type-check`) and F3 (Observation — `sense-test`) UNKNOWN until you wrap your existing build/test/lint scripts as `devai sense-*` invocations with `--emit-reading`. After wrapping, your scorecard's cell matrix populates across substrates and `SKILL-assess-state`'s narrative moves from "X cells unknown (sensor coverage gap)" to a real read on plant health.

Recommended wrapper pattern (drop into your repo as `package.json` scripts or `tools/devai-sensors.sh`):

```bash
# After `pnpm test` (or your repo's equivalent):
node "$DEVAI/packages/cli/dist/bin.js" sense-test \
  --repo-root . \
  --suite unit \
  --command "pnpm test --silent" \
  --emit-reading

# Same shape for sense-build, sense-lint, sense-type-check.
node "$DEVAI/packages/cli/dist/bin.js" sense-build \
  --repo-root . \
  --command "pnpm build" \
  --emit-reading

node "$DEVAI/packages/cli/dist/bin.js" sense-lint \
  --repo-root . \
  --command "pnpm lint" \
  --emit-reading

node "$DEVAI/packages/cli/dist/bin.js" sense-type-check \
  --repo-root . \
  --command "pnpm typecheck" \
  --emit-reading
```

Each wrapper invokes your existing tool and tags its exit code + last-line summary as a `SensorReading` under `record/proofs/sensor-readings/<kind>/`. The scorecard machinery picks up these readings on the next `devai govern score compute` invocation; cells under F2 / F3 populate accordingly.

If you have CI, the natural place for these wrappers is the same workflow that already runs your test/lint/build commands — append a `--emit-reading` invocation per step. The stynx pilot's `.github/workflows/devai-gates.yml` is a working reference (post-Phase-21).

## Step 3 — Suggest candidate invariants

The Phase 17.E bridge reads every sensor body and emits structured "invariant candidate" records:

```bash
node "$DEVAI/packages/cli/dist/bin.js" inv-suggest \
  --from-inventory \
  --repo-root . \
  --format human
```

Candidate categories (one record per gap found):

- `unmapped_route` — a frontend route with no covering use-case.
- `unmapped_endpoint` — a backend endpoint with no covering use-case.
- `unlabeled_pii_column` — a column flagged as PII but missing `legal_basis` and/or `retention`.
- `forbidden_edge` — a cross-package import that crosses an `internal/` boundary.
- `unbound_endpoint` — a backend endpoint with no auth guard.

Each candidate is persisted at `record/proofs/inv-candidates/INV-CANDIDATE-<ulid>.json`. Validate them:

```bash
ls record/proofs/inv-candidates/
```

## Step 4 — Synthesize documentation

The Phase 17.F writer family turns inventory bodies into long-form prose docs. You pick the writers you want; each is independent. To get a starting set:

```bash
node "$DEVAI/packages/cli/dist/bin.js" docs-synthesize overview --repo-root .
node "$DEVAI/packages/cli/dist/bin.js" docs-synthesize architecture-guide --repo-root .
node "$DEVAI/packages/cli/dist/bin.js" docs-synthesize api-map --repo-root .
node "$DEVAI/packages/cli/dist/bin.js" docs-synthesize rbac-matrix --repo-root .
```

These are **LLM-backed**. The default backend in CI / mock-LLM environments returns stub prose; for real prose, set `DEVAI_LLM_BACKEND=claude` (or `codex`) and an API key. See [adoption.md](./adoption.md) for the cost model.

Outputs land at `docs/Overview.md`, `docs/Architecture Guide.md`, etc. — read them, edit them, treat them as the seed of your own governance docs.

## Step 5 — Promote candidate invariants

Review each `INV-CANDIDATE-*.json` in `record/proofs/inv-candidates/`. For each one worth keeping, the Architect:

1. Hand-edits the candidate into a real `INV-<DOMAIN>-NNN.json` file under `law/invariants/`.
2. Runs `node "$DEVAI/packages/cli/dist/bin.js" spec validate-all` to confirm the invariant is well-formed.
3. Commits the new invariant with `Architect:` in the subject line.

This is where DEVAI starts to *govern* your repo: each promoted invariant becomes a gate the scorecard checks on every loop iteration.

## What the brownfield path doesn't do

- It doesn't write code. Sensors are read-only.
- It doesn't enforce anything immediately — promoted invariants only start enforcing once their `severity` is non-`info` AND the scorecard runs in CI.
- It doesn't replace your existing tests / lints / type checks. DEVAI complements them; it doesn't substitute.

## Further reading

- [common-pitfalls.md](./common-pitfalls.md) — when sensors return 0 endpoints, missing fields, etc.
- [../product/journeys/](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/framework/product/journeys/) — the canonical journey specs (JNY-001 etc.).
- [pack-resolution.md](./pack-resolution.md) — making sure the right pack is matched.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/first-introspection.md (classification CURRENT).
