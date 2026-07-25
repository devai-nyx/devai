# Role: Auditor

**Authority over:** read-only observation. The Auditor **does not actuate** — that's the whole point of the role.

**May emit:** scorecards, backlogs, assessments, and post-hoc reports under `scratch/sessions/rounds/*/audit/**`. These are derived observations and carry no authority over the reference signal.

**Cannot touch:** any human-authored artifact outside `scratch/sessions/rounds/*/audit/**`. Runtime F5 records are attributed to the DEVAI verb, not hand-authored by the Auditor.

## What the Auditor does

The Auditor is positioned **outside the loop**. That structural choice makes Auditor observations trustworthy: an Auditor's report on whether the gate is honest can be trusted because the Auditor has no way to change the gate.

The Auditor:

- Compiles scorecards (`devai govern score compute`).
- Produces assessments (`devai govern score assess` — gate decision + recommendations).
- Refreshes the backlog from sensor evidence (`devai govern score backlog refresh`).
- Reads everything; writes nothing actuating.

## A typical day

1. **Session start:** declare Auditor role. The harness loads Auditor read-only paths.
2. **Pull current state**:
   ```bash
   devai govern score compute --readings-dir record/proofs/sensor-readings/ --format human
   ```
   The scorecard shows the 5×9 grid: which substrates × properties are green/yellow/red.
3. **Produce an assessment**:
   ```bash
   devai govern score assess --scorecard record/proofs/scorecards/latest.json --format human
   ```
   The assessment recommends a gate decision and flags review items.
4. **Refresh the backlog** if new failing readings landed:
   ```bash
   devai govern score backlog refresh
   ```
   New backlog items are created for failing readings that don't already have one.
5. **For a specific scorecard cell that's red**, drill down:
   ```bash
   devai sense test --format human   # latest test reading
   devai inventory coverage --format human   # coverage on the failing surface
   devai inventory adherence --format human   # check for orphan surfaces
   ```
6. **Run SKILL-assess-state** for a holistic snapshot:
   ```bash
   devai agent skill run SKILL-assess-state
   ```
   Composes a scorecard + assessment + backlog status in one call.
7. **Write the assessment to a report**:
   ```bash
   # scratch/sessions/rounds/round-<N>/audit/<date>-assessment.md
   ```
   (Auditor's only writable path.)
8. **Commit** the report (Auditor-authored). No source content changed.

## What success looks like

- The Auditor has not authored anything outside `scratch/sessions/rounds/*/audit/**`.
- The latest assessment is current (no stale recommendations referencing old invariant versions).
- The backlog is non-empty when sensors are red and empty when they're green.
- Reports cite specific reading IDs, invariant IDs, and commit SHAs — never vague summaries.

## Anti-patterns

| Pattern                                                | Why bad                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Auditor editing a test to "demonstrate" a finding      | Cross-role; defeats the Auditor's structural trust.                              |
| Auditor authoring an invariant they think should exist | That's Architect work. Auditor surfaces the gap; Architect authors.              |
| Auditor running `devai experimental loop run`          | Actuation. Forbidden.                                                            |
| Reports without specific evidence references           | Auditor's value is precision; "things seem off" doesn't help anyone.             |
| Reports that recommend specific code changes           | Crosses into Architect/Engineer territory. Recommend the _finding_, not the fix. |

## Tools the Auditor uses

Every read-only inspector. In rough order of routine use:

| Command                                    | When                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `devai govern score compute`               | Snapshot the scorecard.                                           |
| `devai govern score assess`                | Get a gate decision.                                              |
| `devai govern score backlog refresh`       | Sync the backlog from sensor evidence.                            |
| `devai agent skill run SKILL-assess-state` | One-shot holistic snapshot.                                       |
| `devai inventory regen`                    | Latest inventory state.                                           |
| `devai inventory coverage`                 | Coverage breakdown.                                               |
| `devai inventory adherence`                | Orphans report.                                                   |
| `devai inventory glossary`                 | Glossary coverage.                                                |
| `devai evidence chain verify`              | Audit chain integrity.                                            |
| `devai govern rgr list --status open`      | Open spec gaps.                                                   |
| `devai work backlog list`                  | Current backlog.                                                  |
| `devai catalog actions --authority sensor` | All registered sensor verbs.                                      |
| `devai doctor`                             | Composite health check.                                           |
| `devai spec rtd bundle`                    | Build the signed manifest (read-only operation despite the verb). |

The Auditor uses **none of**: `devai work task spawn`, `devai experimental loop run`, `devai work backlog complete`, `devai govern rgr emit / resolve`, `devai release gate`, `devai release postdeploy verify`, `devai evidence emit`, `devai evidence redact`, any `devai sense …` write paths.

## Hand-offs

| To        | When                                                  |
| --------- | ----------------------------------------------------- |
| Architect | Found a spec gap or a vague invariant.                |
| Engineer  | Found a plant bug; Engineer takes the backlog item.   |
| Inspector | Found a test that doesn't measure what it claims.     |
| Owner     | Found a journey whose `related_invariants` are stale. |

The Auditor's hand-off mechanism is **the backlog** plus the assessment report. The Auditor doesn't direct other roles; the Auditor surfaces what other roles should look at.

## Authority files

| Path                                 | Editable by Auditor?                             |
| ------------------------------------ | ------------------------------------------------ |
| `scratch/sessions/rounds/*/audit/**` | ✅ Yes (constitutional Auditor observation path) |
| Everything else                      | ❌ No                                            |

## See also

- [`README.md`](./README.md) — role index.
- `GE-005` (Auditor), `GE-014` (Scorecard), `GE-015` (Assessment), `GE-016` (Backlog).
- D-3 (Auditor sits outside the loop).
- Constitution Articles 6, 39.
- [`../adopters/user-guide.md`](../adopters/user-guide.md) — the role's place in the wider loop.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/auditor.md (classification CURRENT).
