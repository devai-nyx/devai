---
id: R-0007-PROPOSED-CLI-MIGRATION-INVENTORY
title: Former runnable CLI to consolidated CLI map
type: inventory
status: active
date: 2026-08-07
authority: Architect
---

# Binding old-to-new CLI inventory

The admitted left column bijects with the 147 runnable identities at the R-0007 opening
base `9b435e5ca479a837baffe2b597c8ba582fec08f4`. The binding disposition produces 42
runnable workflow actions, 169 folded historical identities, and 11 tombstones across
222 never-reminted identities. The 42 runnable actions comprise 31 porcelain actions in
the seven default domains and 11 hidden plumbing actions: ten `task` actions and
`catalog actions`.

> Task executor modeling adds no public top-level command and therefore does not change
> this command migration denominator. Hidden `task` plumbing remains round-bound and is
> consumed normally through `round run`.

`sense run <kind>` is one parameterized action identity. Sensor kinds are canonical
registry values with their own resolved effect contracts; they do not mint additional
CLI action identities. The generic `sense run` registry entry carries the conservative
maximum ceiling, while runtime dispatch must resolve and enforce the selected kind's
strictly narrower or equal contract before checking authority and consent.

`REMOVED` means tombstone with no runnable CLI successor. Every other changed route is
folded with the shown migration guidance. Hidden `task` targets always require the
declared active `--round R-NNNN`.

## Adopt, agent, catalog, and docs

| Old action              | New action or disposition                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `adopt ci scaffold`     | `init apply harness --include ci`                                                                                                             |
| `adopt hooks install`   | `init apply architect --include hooks`                                                                                                        |
| `adopt pack graduate`   | `round plan --source pack --graduate-invariants`                                                                                              |
| `adopt pack resolve`    | `sense inventory --slice pack`                                                                                                                |
| `adopt upgrade`         | `init upgrade`                                                                                                                                |
| `agent llm probe`       | `doctor --probe llm`                                                                                                                          |
| `agent prompt compose`  | `round plan --prompt compose`                                                                                                                 |
| `agent prompt diff`     | `round plan --prompt diff`                                                                                                                    |
| `agent prompt freeze`   | `round plan --prompt freeze`                                                                                                                  |
| `agent skill list`      | `round plan --list-executors`                                                                                                                 |
| `agent skill run`       | normally `round run`; hidden `task start --round R-NNNN --task TASK-NNNN` after the task declares an `agent` executor and registered skill ID |
| `catalog actions`       | retained hidden plumbing                                                                                                                      |
| `docs cli`              | check: `check --only cli-reference`; generation: `round plan --documents cli`                                                                 |
| `docs decisions render` | `evidence render --kind decisions`                                                                                                            |
| `docs links`            | `check --only docs-links`                                                                                                                     |
| `docs publish`          | `release publish docs`                                                                                                                        |
| `docs render mermaid`   | `round plan --documents diagrams`                                                                                                             |
| `docs rounds render`    | `evidence render --kind rounds`                                                                                                               |
| `docs synthesize`       | `round plan --documents <id>`                                                                                                                 |
| `docs synthesize all`   | `round plan --documents all`                                                                                                                  |

## Doctor, evidence, experimental, and govern

| Old action                     | New action or disposition                         |
| ------------------------------ | ------------------------------------------------- |
| `doctor`                       | retained                                          |
| `evidence actions verify`      | `evidence collect --source actions`               |
| `evidence chain head`          | `evidence verify --scope chain --show-head`       |
| `evidence chain verify`        | `evidence verify --scope chain`                   |
| `evidence coverage aggregate`  | `evidence record --kind coverage`                 |
| `evidence emit`                | `evidence record --kind generic`                  |
| `evidence local collect`       | `evidence collect --source local`                 |
| `evidence local verify`        | `evidence verify --scope local`                   |
| `evidence redact`              | `evidence redact`                                 |
| `evidence test matrix`         | `evidence render --kind test-matrix`              |
| `evidence test record`         | `evidence record --kind test`                     |
| `experimental loop run`        | **REMOVED**                                       |
| `govern auditor post-merge`    | `round close --post-merge-receipt`                |
| `govern phase close`           | `round close`                                     |
| `govern phase ledger`          | `round status --ledger`                           |
| `govern rgr emit`              | `round gap create`                                |
| `govern rgr list`              | `round gap list`                                  |
| `govern rgr resolve`           | `round gap resolve`                               |
| `govern rgr show`              | `round gap show`                                  |
| `govern score assess`          | `round assess --view narrative`                   |
| `govern score backlog refresh` | `round assess --refresh-backlog`                  |
| `govern score compute`         | `round assess --compute`                          |
| `govern score view`            | `round assess --view <grid \| narrative \| json>` |
| `govern triage classify`       | `round assess --triage classify`                  |
| `govern triage dispatch`       | `round assess --triage dispatch`                  |
| `govern triage tie break`      | `round assess --triage tie-break`                 |

## Init and inventory

| Old action               | New action or disposition              |
| ------------------------ | -------------------------------------- |
| `init apply-architect`   | `init apply architect`                 |
| `init apply-f5`          | `init apply harness`                   |
| `init apply-owner`       | `init apply owner`                     |
| `init plan`              | retained                               |
| `inventory adherence`    | `sense inventory --slice adherence`    |
| `inventory components`   | `sense inventory --slice components`   |
| `inventory contracts`    | `sense inventory --slice contracts`    |
| `inventory coverage`     | `sense inventory --slice coverage`     |
| `inventory dependencies` | `sense inventory --slice dependencies` |
| `inventory glossary`     | `sense inventory --slice glossary`     |
| `inventory modules`      | `sense inventory --slice modules`      |
| `inventory regen`        | `sense inventory --slice all`          |
| `inventory routes`       | `sense inventory --slice routes`       |
| `inventory schemas`      | `sense inventory --slice schemas`      |
| `inventory suggest`      | `round plan --from-inventory`          |
| `inventory tests`        | `sense inventory --slice tests`        |

## Policy and release

| Old action                       | New action or disposition        |
| -------------------------------- | -------------------------------- |
| `policy check action effects`    | `check --only action-effects`    |
| `policy check adrs`              | `check --only adrs`              |
| `policy check ci economy`        | `check --only ci-economy`        |
| `policy check dependencies`      | `check --only dependencies`      |
| `policy check docs governance`   | `check --only docs-governance`   |
| `policy check forbidden actions` | `check --only forbidden-actions` |
| `policy check glob guards`       | `check --only glob-guards`       |
| `policy check overrides`         | `check --only overrides`         |
| `policy check pr compliance`     | `check --only pr-compliance`     |
| `policy check prompt overlays`   | `check --only prompt-overlays`   |
| `policy check schemas`           | `check --only schemas`           |
| `policy check sensor integrity`  | `check --only sensor-integrity`  |
| `release gate`                   | `release check`                  |
| `release list`                   | `release status`                 |
| `release postdeploy verify`      | `release verify`                 |
| `release runtime drift`          | `release drift`                  |

## Round and sense

| Old action                    | New action or disposition                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| `round archive`               | `round seal`                                                        |
| `round declare`               | `round plan --declare <record>`                                     |
| `round scaffold`              | `round plan --scaffold`                                             |
| `round status`                | retained                                                            |
| `sense build`                 | `sense run build`                                                   |
| `sense docs drift`            | `sense run docs_drift`                                              |
| `sense inventory api`         | `sense run inventory_api`                                           |
| `sense inventory data model`  | `sense run inventory_data_model`                                    |
| `sense inventory performance` | `sense run inventory_performance`                                   |
| `sense inventory rbac`        | `sense run inventory_rbac`                                          |
| `sense judge`                 | `sense run llm_judge`                                               |
| `sense lint`                  | `sense run lint`                                                    |
| `sense migrate check`         | `sense migrate` with DB-write authority                             |
| `sense mutation run`          | `evidence record --kind mutation --run`                             |
| `sense mutation verify`       | `check --only mutation`                                             |
| `sense readings rebuild`      | `sense record --rebuild`                                            |
| `sense readings record`       | `sense record --input <path>`                                       |
| `sense run`                   | retained; `--set` becomes `--preset`                                |
| `sense runtime api`           | `sense run runtime_probe_api`                                       |
| `sense runtime auth`          | `sense run runtime_probe_auth`                                      |
| `sense runtime data`          | `sense run runtime_probe_data`                                      |
| `sense site drift`            | `sense run site_drift`                                              |
| `sense spec idiomaticity`     | `sense run spec_idiomaticity`                                       |
| `sense test`                  | `sense run <unit_test \| integration_test \| e2e_test>` or a preset |
| `sense trace resolve`         | `sense run trace_resolution`                                        |
| `sense type check`            | `sense run type_check`                                              |

## Spec and verify

| Old action                           | New action or disposition                               |
| ------------------------------------ | ------------------------------------------------------- |
| `spec blueprint diff`                | `round plan --blueprint diff`                           |
| `spec blueprint plan`                | `round plan --blueprint plan`                           |
| `spec blueprint validate`            | `check --only blueprint`                                |
| `spec decision close`                | `round close --decision <id>`                           |
| `spec rtd bundle`                    | `evidence record --kind rtd`                            |
| `spec validate action coverage`      | `check --only action-coverage`                          |
| `spec validate all`                  | `check --suite standard`                                |
| `spec validate glossary`             | `check --only glossary`                                 |
| `spec validate invariant strategies` | `check --only invariant-strategies`                     |
| `spec validate invariants`           | `check --only invariants`                               |
| `spec validate journeys`             | `check --only journeys`                                 |
| `spec validate schema`               | `check --only schema --schema <path> --instance <path>` |
| `spec validate test trace`           | `check --only test-trace`                               |
| `spec validate trace`                | `check --only trace`                                    |
| `verify translation`                 | `check --only translation`                              |

## Work

| Old action                 | New action or disposition                                 |
| -------------------------- | --------------------------------------------------------- |
| `work backlog add`         | hidden `task queue add --round R-NNNN`                    |
| `work backlog complete`    | hidden `task queue complete --round R-NNNN`               |
| `work backlog list`        | hidden `task queue list --round R-NNNN`                   |
| `work backlog next`        | hidden `task queue next --round R-NNNN`                   |
| `work db drop`             | internal to `task finish --round R-NNNN --drop-db`        |
| `work db provision`        | internal to `task start --round R-NNNN --with-db`         |
| `work db rebuild template` | **REMOVED**; operator-owned DB tooling                    |
| `work db start shared`     | **REMOVED**; operator-owned container tooling             |
| `work db status`           | hidden `task status --round R-NNNN --resources db`        |
| `work db stop shared`      | **REMOVED**; operator-owned container tooling             |
| `work lock acquire`        | internal to round-bound task start                        |
| `work lock list`           | hidden `task status --round R-NNNN --resources locks`     |
| `work lock reap`           | **REMOVED** from CLI                                      |
| `work lock release`        | internal to round-bound task finish/escalate              |
| `work session end`         | **REMOVED**; use invocation-scoped `--as-role`            |
| `work session start`       | **REMOVED**; use invocation-scoped `--as-role`            |
| `work state prune`         | **REMOVED** from CLI                                      |
| `work task complete`       | hidden `task finish --round R-NNNN`                       |
| `work task escalate`       | hidden `task escalate --round R-NNNN`                     |
| `work task list`           | hidden `task status --round R-NNNN`                       |
| `work task pause rgr`      | hidden `task pause --round R-NNNN --gap <id>`             |
| `work task resume rgr`     | hidden `task resume --round R-NNNN --gap <id>`            |
| `work task spawn`          | normally `round run`; hidden `task start --round R-NNNN`  |
| `work worktree adopt`      | **REMOVED**; unmanaged branches remain operator-owned     |
| `work worktree create`     | internal to round-bound task start                        |
| `work worktree destroy`    | internal to round-bound task finish                       |
| `work worktree list`       | hidden `task status --round R-NNNN --resources worktrees` |
| `work worktree reap`       | **REMOVED** from CLI                                      |

## Global vocabulary and consent migration

| Old spelling                                           | New spelling                                   |
| ------------------------------------------------------ | ---------------------------------------------- |
| check `--profile quick \| standard \| full \| release` | `--suite quick \| standard \| full \| release` |
| sense `--set baseline`                                 | `--preset baseline`                            |
| sense `--set tier1`                                    | `--preset baseline`                            |
| sense `--set tier2`                                    | `--preset structural`                          |
| sense `--set tier3`                                    | `--preset governed`                            |
| sense `--set all`                                      | `--preset governed`                            |
| sense `--set sweep`                                    | `--preset sweep --round R-NNNN`                |
| adoption `--profile tier1 \| tier2 \| tier3`           | `--tier tier1 \| tier2 \| tier3`               |
| `--allow-publish`                                      | `--publish`, still requiring `--write`         |

The two consent flags are independent inputs. `--publish` never implies `--write`, and
`--write` never implies `--publish`; an invocation whose resolved effect is
`remote-write` requires both.
