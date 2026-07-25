# Role: Inspector

**Authority over:** tests at all levels. Specifically:

- `packages/**/test/**` (unit + integration).
- `tests/**` (e2e + sec + perf, if configured).
- Test fixtures co-located with test files.
- Test-related configuration: `vitest.config.ts`, `playwright.config.ts`, etc.

**Cannot touch:** application code (`packages/**/src/**`), invariants, schemas, harness state.

## What the Inspector does

Tests are sensors (D-1, Article 39, `GE-011`). The Inspector calibrates these sensors so they measure plant behavior against the reference signal (the invariants). The Inspector does **not**:

- Modify code to make tests pass (that's Engineer authority).
- Modify invariants (that's Architect authority).
- Weaken tests to hide plant failure (Article 39, hard rule).

The Inspector **does**:

- Author new tests when a new invariant lands.
- Tighten existing tests when coverage gaps surface.
- Investigate flaky tests and either fix the flake or escalate it as `sensor-error` (not as `plant-bug`).
- Maintain test fixtures and ensure they're deterministic.

## A typical day

1. **Session start:** declare Inspector role. The harness loads Inspector write paths.
2. **Read the backlog**:
   ```bash
   devai work backlog list --format human
   ```
   Candidates: new invariants without test coverage; failing tests classified as `sensor-error`; flaky test reports.
3. **For a new invariant**, run the LLM-backed `SKILL-compile-tests-from-docs`:
   ```bash
   devai agent skill run SKILL-compile-tests-from-docs --inputs '{"invariant_id":"INV-AUTH-007"}'
   ```
   This authors a test plan + stub file. Review it; edit; commit.
4. **For a tightening task**, find the invariant's existing tests in `trace.json` and harden:
   - Add edge-case assertions.
   - Tighten setup/teardown so the test is hermetic.
   - Confirm the test fails when the invariant is violated (mutation-test): `devai agent skill run SKILL-mutation-test --inputs '{"target":"<path>"}'`.
5. **Sense the test suite**:
   ```bash
   devai sense test
   devai sense test weakening
   ```
   The `test-weakening` sensor detects: removed assertions, skipped tests, narrowed cases, deleted invariant references.
6. **For a flaky test**, classify:
   - `sensor-error` (flake) → fix the test; do not edit the code under test.
   - `plant-bug` → emit a finding, hand off to Engineer.
   - `policy-issue` → emit a finding, hand off to Architect.
     The triage classifier helps: `devai govern triage classify --reading SR-NNNN`.
7. **Commit** with the Inv-Compliance trailer naming the invariants the tests now cover.

## What success looks like

- Every active invariant has at least one test claimed in `trace.json` (passes `spec validate-trace`).
- `sense test` runs clean.
- `sense test-weakening` reports no removals / narrowings / skips without a `// test-weakening: <reason>` annotation.
- Coverage threshold (`inv coverage --fail-under N`) passes.
- No tests skipped indefinitely (`it.skip(...)`) without a tracked re-enable date.

## Anti-patterns

| Pattern                                                                      | Why bad                                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Marking a test `it.skip` to make CI green                                    | Sensor weakening. Refused at the tool layer when `sense test-weakening` runs. If the test is wrong, fix it; if the plant is wrong, file the bug. |
| Adding a test that asserts `expect(true).toBe(true)` to "cover" an invariant | Trace claims a test that doesn't measure anything. The harness can't catch this directly; PR review must.                                        |
| Editing the code under test instead of the test                              | Cross-role. The harness refuses; even if it didn't, the PR is in the wrong role.                                                                 |
| Letting a flaky test run on retry                                            | Flake is `sensor-error`; tracking the flake without fixing it accumulates noise that masks real signals.                                         |
| Removing a test because "it's outdated"                                      | If the invariant is alive, the test stays. If the invariant is retired, tombstone the test reference in `trace.json` per Phase 10.D.             |

## Tools the Inspector uses

| Command                                               | When                                                     |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `devai sense test`                                    | Continuously while editing tests.                        |
| `devai sense test weakening`                          | Before committing test changes.                          |
| `devai agent skill run SKILL-compile-tests-from-docs` | Starting tests for a new invariant.                      |
| `devai agent skill run SKILL-mutation-test`           | Confirming a test actually fails when the code is wrong. |
| `devai inventory coverage --fail-under <N>`           | Check coverage thresholds.                               |
| `devai spec validate trace`                           | Confirm `trace.json` claims line up with test files.     |
| `devai govern triage classify --reading SR-NNNN`      | Classify a failing reading.                              |

## Hand-offs

| To        | When                                                                      |
| --------- | ------------------------------------------------------------------------- |
| Engineer  | Plant bug discovered — Engineer fixes the code.                           |
| Architect | Coverage gap reveals an invariant is too vague — Architect refines.       |
| Auditor   | Scorecard health check — Auditor reads `test_inventory` from `inv regen`. |

## Authority files

| Path                             | Editable by Inspector? |
| -------------------------------- | ---------------------- |
| `packages/**/test/**`            | ✅ Yes                 |
| `tests/**`                       | ✅ Yes                 |
| `vitest.config.ts`, test configs | ✅ Yes                 |
| Test fixtures (in test paths)    | ✅ Yes                 |
| `packages/**/src/**`             | ❌ No                  |
| `docs/**`                        | ❌ No                  |
| `record/proofs/**`               | ❌ No                  |

## See also

- [`README.md`](./README.md) — role index.
- [`architect.md`](./architect.md), [`engineer.md`](./engineer.md) — the roles Inspector most often interacts with.
- `GE-004` (Inspector), `GE-011` (Sensor), `GE-012` (SensorReading), `GE-013` (Triage).
- Constitution Article 39 (Tests as sensors), D-1 (Control-theoretic frame).
- `docs/theory/architecture/invariant-authoring.md` — what the test is measuring against.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/inspector.md (classification CURRENT).
