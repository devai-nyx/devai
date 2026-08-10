# Sensor input specification contract

**Authority:** Architect. **Decision:** D-161, R26 W01. **Lifecycle:**
experimental/report-only.

`sensor-inputs.json` is the canonical F1 source for the ten hermetic sensor
kinds admitted to R26 measurement. It validates against
`sensor-input-spec.schema.json`. The registry describes inputs; it does not
authorize execution, persistence, cache population, replay, or readiness.

## Materialization boundary

The future F5 target is `.devai/config/sensor-inputs.json`. It may be written
only by the registered `devai adopt upgrade --sensor-inputs` transition under
an Architect authority declaration and explicit write consent. The transition
must validate the F1 source, preserve byte identity, publish its digest, and
provide an adopter upgrade path. R26 W01 defines this contract but does not
implement the verb or write the target. Direct edits and checker-authored
registry entries are forbidden by Constitution Article 6 and the R23
materialization doctrine.

## Derived glob integrity check

The W03 checker consumes the registry read-only and evaluates its complete
file-input union against Git-tracked paths:

- A direct pattern requires `min_matches` matches; absence means the default
  of one.
- `min_matches: 0` is valid only when the same pattern records a non-empty
  `reason`.
- An alternative group passes when at least one member of `any_of` matches;
  every member is still reported so a degraded alternative remains visible.
- A missing, duplicate, unknown, or non-hermetic kind fails schema validation
  before glob evaluation.
- The check never mutates `glob-guards.json`, `sensor-inputs.json`, or any F5
  target. A checker cannot author its own inputs.

The planned failure codes are `SENSOR_INPUT_DEAD_GLOB`,
`SENSOR_INPUT_OPTIONAL_REASON_REQUIRED`, `SENSOR_INPUT_ALTERNATIVES_DEAD`, and
`SENSOR_INPUT_KIND_INELIGIBLE`. W02 owns their red-first executable contracts.

## Digest contract for W03

For a clean tree, W03 derives a digest from the Git index without reading file
bodies: sorted `(path, blob_sha)` pairs plus kind, `spec_version`, sensor
version, `command_hash`, resolved tool versions, and declared environment
values. Dirty matched files use `git hash-object`, and the report marks the
subject `dirty`; otherwise it records the exact `git_sha`.

The output belongs only to `sense run --incremental --dry-run`. R26 does not
change SensorReading, skip a sensor, populate a cache, or persist replay
provenance. Those boundaries are required by Articles 17, 36, and 39 and by
D-161's single-schema ruling.
