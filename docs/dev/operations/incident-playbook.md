# Incident playbook

**Scope:** "the gate is failing — what do I do?" Maps common symptoms to next actions. Open the section that matches your symptom; each ends with a pointer to the deeper runbook.

## 1. `devai doctor` reports failures

Doctor is the composite health check: schemas loadable, F1 paths present, evidence chain valid, invariant catalog non-empty.

```bash
devai doctor --format human
```

Read the failing checks top-down. Most common:

- **"evidence chain hash mismatch"** → [`evidence-chain-runbook.md`](./evidence-chain-runbook.md) §"Recovery from a corrupt chain".
- **"missing .devai/config/domains.json"** → run `devai init apply-f5 --as-role architect --write` to re-seed the F5 segment (deny-by-default on existing files; safe).
- **"invariant catalog empty"** → `law/invariants/` was wiped. Recover from git.

## 2. `spec validate-all` reports schema violations

```bash
devai spec validate all --format human
```

The first failing entry tells you which validator fired. Common patterns:

- **"file does not match `<id>.json`"** → the invariant id and filename diverged; rename the file or fix the id.
- **"cannot resolve anchor '<slug>' in doc '<doc>'"** → the cited heading was removed/renamed. Fix the invariant's `authority.docs[].anchor` or restore the heading.
- **"tombstoned id '<id>' reused"** → the id was retired in `tombstones.json`. Pick a fresh id (10.D).
- **"duplicate invariant id"** → two files have the same id; rename one.

## 3. CI green locally, red in CI

Likely causes:

| Diagnostic                             | Action                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| Different Node version                 | Check CI's Node matches `engines.node` in `package.json` (24.x).                       |
| Test relying on filesystem case        | macOS is case-insensitive; Linux CI is case-sensitive. Hunt for paths with mixed case. |
| Test relying on env var not set in CI  | Check `DEVAI_LLM_BACKEND` (default `mock` in CI per Phase 9).                          |
| Time-sensitive test using `Date.now()` | Pin timestamps in tests; never use real wall clock.                                    |
| Coverage threshold                     | `inv coverage --fail-under N` may differ between local and CI configs.                 |

## 4. `inv regen` produces different output across two runs

Determinism is the F4 self-application criterion. Causes of non-determinism:

| Cause                                         | Action                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Walker reading hidden files                   | Confirm `DEFAULT_IGNORE` covers `.git`, `node_modules`, etc.                                                             |
| Schema discovery double-counting via symlinks | Check `inv schemas` count against `ls law/schemas/*.json \| wc -l`.                                                      |
| Timestamps in the output                      | `--timestamp` flag should pin; no `Date.now()` calls outside it.                                                         |
| Map iteration order                           | `Map` preserves insertion order; if you're seeing drift, a `Set` is being iterated where order matters. Sort explicitly. |

## 5. `inv adherence-reverse` reports orphans

Per Phase 11.F. An orphan is a plant surface (route/module/component) that no invariant's `code_areas` claims.

```bash
devai inventory adherence --format human
```

Three responses, in order of preference:

1. **The surface should be claimed.** Add it to the relevant invariant's `code_areas`.
2. **The surface is intentionally ungoverned.** Add to `.devai/config/orphan-allowlist.json` with a justification.
3. **The surface is dead code.** Delete it; re-run `inv regen`; the orphan goes away.

## 6. Loop killed mid-iteration

Mid-iteration kill leaves: half-edited worktree, ghost locks, possibly a malformed evidence record.

```bash
# 1. Identify the worktree:
devai work worktree list --format human

# 2. Inspect for uncommitted state:
cd .devai/worktrees/WT-NNNN && git status

# 3. Decide: keep or discard?
#    Keep:    git stash, then cd back to main repo and address.
#    Discard: cd back, devai work worktree destroy --id WT-NNNN --force.

# 4. Reap stale locks:
devai work lock reap --write

# 5. Verify evidence chain:
devai evidence chain verify
#    If non-zero, see evidence-chain-runbook.md §"Recovery".
```

## 7. RGR pile-up

If `devai govern rgr list --status open` shows many open RGRs, the Specifier loop is the bottleneck.

```bash
devai govern rgr list --status open --format human
```

For each RGR, the resolver should `devai govern rgr resolve <RGR-id> --resolver <email> --answer Qn=text` after updating the relevant invariant (and bumping its `version` per 10.E). Resumed tasks then unblock automatically (the `task pause-rgr` / `task resume-rgr` lifecycle, Phase 5 + 10.E).

If RGRs pile up faster than they resolve, the spec is too thin for the current scope. Pause autonomous loop runs and put a human Architect on the queue.

## 8. LLM substrate budget exhausted

```bash
# Inspect cumulative usage:
cat record/proofs/llm-usage.jsonl | jq '.cost_usd' | awk '{s+=$1} END {print s}'

# Reset the budget for this billing window:
export DEVAI_LLM_BUDGET_USD=10.00
```

If you're hitting the budget repeatedly, raise it or shorten the loop's `--max-iterations`. See [`loop-runbook.md`](./loop-runbook.md) §"Cost control".

## 9. Test suite times out

Likely culprits, in order:

1. A `runtime-probe` test pointing at an unreachable URL. Hermeticize with `--dry-run` (Phase 11.A).
2. A `db-introspector` test trying to reach a Postgres that isn't running. Full-production runs require local Postgres; use `DEVAI_DB_TESTS=0` only for a declared hermetic lane.
3. A worker stuck in an infinite loop. Bisect: `pnpm test packages/<one-package>` to localize.

## 10. `release gate` says `block` but you don't see why

```bash
devai release gate --format human
```

The output lists per-check verdicts. The block reasons are aggregated in the `reasons[]` field of the persisted REL-NNNN record. Inspect:

```bash
cat record/proofs/releases/REL-NNNN.json | jq '.reasons, .checks'
```

Most common blocks: scorecard decision is not `pass`; invariants directory empty; no fresh sensor readings.

## See also

- [`evidence-chain-runbook.md`](./evidence-chain-runbook.md), [`lock-runbook.md`](./lock-runbook.md), [`worktree-runbook.md`](./worktree-runbook.md), [`loop-runbook.md`](./loop-runbook.md), [`capacity.md`](./capacity.md), [`slos.md`](./slos.md).
- `docs/dev/security/threat-model.md` for security-flavored incidents.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/incident-playbook.md (classification CURRENT).
