# Role: Engineer

**Authority over:** application code. Specifically:

- `packages/**` (source files only, not tests).
- `apps/**` or the client's configured source globs.
- Build / config files in the source tree (`tsconfig.json`, `vite.config.ts`, etc.).

**Cannot touch:** invariants, schemas, tests, harness state, documentation, ADRs.

## What the Engineer does

The Engineer writes code that **satisfies Architect-authored invariants**. The Engineer's authority is over the plant (`GE-007` / F2), not over the reference signal (`GE-006` / F1) or the sensors (`GE-008` / F3).

When the spec is silent, contradictory, or unclear, the Engineer does **not** guess — the Engineer emits an RGR (Reference Gap Report, `GE-018`) and pauses on it. This is the only allowed escalation path back to the Architect for semantic clarification.

## A typical day

1. **Session start:** declare Engineer role. The harness loads Engineer write paths.
2. **Pick a backlog item**:
   ```bash
   devai work backlog next --format human
   ```
   The next item is typically a failing invariant + its evidence pointer.
3. **Read the invariant**:
   ```bash
   cat law/invariants/INV-XX-NNN.json
   ```
   Confirm you understand the statement, the `code_areas`, and the `verification` clause.
4. **Spawn a task with a worktree**:
   ```bash
   devai work task spawn \
     --task TASK-NNNN \
     --substrate F2 \
     --with-worktree \
     --base main
   ```
   You now have an isolated working tree and a `WT-NNNN` registry entry.
5. **Sense the current state**:
   ```bash
   devai sense type check
   devai sense lint
   devai sense test
   ```
   Establish the baseline before editing.
6. **Edit code** to satisfy the invariant. Stay strictly within `packages/**` or the source globs.
7. **Re-sense and verify**:
   ```bash
   devai sense type check
   devai sense lint
   devai sense test
   devai sense judge --invariant INV-XX-NNN
   ```
8. **If stuck on a spec ambiguity**, emit an RGR:
   ```bash
   devai govern rgr emit \
     --task-id TASK-NNNN \
     --discipline engineer \
     --summary 'auth refresh spec silent on stale tokens' \
     --ambiguity 'INV-AUTH-007 says reject expired but does not define what makes a refresh token "expired"' \
     --evidence EV-<sha> \
     --invariant INV-AUTH-007 \
     --question 'Should expired = past expires_at or past last_used_at + grace?'
   ```
   Then pause the task on the RGR:
   ```bash
   devai work task pause rgr TASK-NNNN --rgr-id RGR-NNNN
   ```
   The task resumes when the Architect resolves the RGR (typically with a new invariant version).
9. **Complete the task**:
   ```bash
   devai work task complete TASK-NNNN --destroy-worktree
   ```
   The worktree is reaped; locks are released; the task transitions to `completed`.
10. **Commit** with the Inv-Compliance trailer naming the invariants advanced.

## What success looks like

- Code edits stay within `packages/**` (or configured source globs).
- Every committed change advances at least one named invariant.
- The PR's Inv-Compliance trailer lists those invariants and they exist in the catalog.
- `devai sense` runs clean on the worktree before completion.
- No test files were touched (Inspector calibrates those).
- No `inv-override` annotations added without explicit Architect approval recorded.

## Anti-patterns

| Pattern                                                          | Why bad                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Editing a test file to make it pass                              | Sensor weakening. Tests are sensors (D-1, Article 39). Refused at the tool layer.                  |
| Editing an invariant because the code is "obviously right"       | Cross-role. The harness will refuse; if the harness somehow allowed it, the PR review will reject. |
| Adding code without a named invariant claim                      | Code without a spec is plant without setpoint. Author the invariant first (escalate to Architect). |
| Sprinkling `inv-override` annotations to silence findings        | Override expires; tech debt accumulates. Fix the code or amend the invariant.                      |
| Writing 10 commits then bundling the Inv-Compliance trailer once | Each commit's claim should be reviewable in isolation. Add the trailer per commit.                 |

## Tools the Engineer uses

| Command                                              | When                                              |
| ---------------------------------------------------- | ------------------------------------------------- |
| `devai work backlog next`                            | Get the next task.                                |
| `devai work task spawn --with-worktree`              | Start working.                                    |
| `devai sense {type-check, lint, build, test, judge}` | Continuously, while editing.                      |
| `devai govern rgr emit`                              | Spec ambiguity.                                   |
| `devai work task pause rgr` / `resume-rgr`           | Around an RGR cycle.                              |
| `devai work task complete`                           | When the gate is green and you're ready to merge. |
| `devai policy check overrides`                       | Before committing if you added an `inv-override`. |
| `devai policy check forbidden actions`               | If you scripted anything; auto-runs in CI.        |

## Hand-offs

| To        | When                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| Architect | Spec ambiguity → RGR.                                                        |
| Inspector | New behavior shipped → Inspector calibrates a test for it.                   |
| Auditor   | Question about whether your work advanced the invariant — Auditor scores it. |

## Authority files

| Path                           | Editable by Engineer?   |
| ------------------------------ | ----------------------- |
| `packages/**` (source)         | ✅ Yes                  |
| `apps/**` (source globs)       | ✅ Yes (configured)     |
| `tsconfig.json`, build configs | ✅ Yes                  |
| `package.json` (deps)          | ✅ Yes (with PR review) |
| `packages/**/test/**`          | ❌ No                   |
| `docs/**`                      | ❌ No                   |
| `record/proofs/**`             | ❌ No                   |

## See also

- [`README.md`](./README.md) — role index.
- [`README.md`](./README.md) — current human authority overview.
- `GE-003` (Engineer), `GE-018` (RGR), `GE-017` (Task).
- Constitution Articles 6 (Authority), 19 (Escalation), 25 (Module locking), 27 (Worktree discipline).
- [`../meta/ops/worktree-runbook.md`](../dev/operations/worktree-runbook.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/engineer.md (classification CURRENT).
