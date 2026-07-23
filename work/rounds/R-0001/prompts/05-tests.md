# P5 — TESTS track (Inspector · effort: high)

Role: **Inspector**. You own `tests/**`, `packages/*/tests/**`, and test-intent configs
(`tests/config/`, vitest configs). You may not change code (P4) or law (P1); a test that
cannot pass without a code change is a DEFECT report, not a code edit.

## Context to read first
Dossier Part VII §4 (the seven tiers) · `scratch/pre-plan/08-ci-workflow.md` (CTX-08)
· P2's report (HANDOFFS-TO-P5: the seam-test and glossary-count changes) · P4's report
(what ported where).

## Tasks

1. **Tier structure**: materialize `tests/{integration,regression,e2e,containment}` +
   `tests/config/` with per-tier vitest configs (T1/T2 live per-package; T3–T6
   top-level). One root `tsconfig` include set covers all test trees — the
   dual-typecheck trap stays dead. Migrate the predecessor suites P4 relocated into
   their correct tiers (regression = pinned defects; contract = schema/CLI-shape;
   integration = cross-package, DB-gated by env flag).
2. **Apply P2 handoffs exactly** (active-vs-record seam assertion; glossary counts).
3. **New guards** (each one a test, per the population registry P1 authored):
   register-consistency (no register entry contradicts constitutional text — string-level
   heuristic + anchor resolution is acceptable v1); roster/count guards for every
   population (schemas 51+ P1 additions, invariants 34, journeys, glossary, ADR 12,
   register entries, sensor-registry entries); FAIL-persistence + cell-reachability
   tests against the sensor registry (red allowed ONLY as documented known-reds with a
   backlog pointer); intra-epoch line-chain verification for `record/proofs/` writers
   if P4 shipped the epoch writer (else backlog).
4. **Coverage semantics**: wire T1+T3 merged coverage per CTX-08; thresholds from
   `law/policy/thresholds.json`; T4–T6 excluded from coverage arithmetic.
5. Keep the 27 wireframe contract tests (they are law-coupled); extend counts only
   forward.

## Acceptance
Full tier ladder runs green locally via one documented command per tier · known-reds
(if any) are enumerated in the report with backlog pointers, never silent · coverage
gate computes · role-pure commits.

Final message: `DONE (tier map + test counts) / KNOWN-REDS / DEFECTS-FOUND / COMMITS`.
