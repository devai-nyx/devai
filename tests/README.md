# DEVAI-II test tiers

The test tier is determined by its directory. Run each lane from the repository
root:

| Tier           | Home                         | Local command                                                    |
| -------------- | ---------------------------- | ---------------------------------------------------------------- |
| T1 unit        | `packages/*/tests/unit/`     | `pnpm vitest run --config tests/config/t1.unit.config.ts`        |
| T2 contract    | `packages/*/tests/contract/` | `pnpm vitest run --config tests/config/t2.contract.config.ts`    |
| T3 integration | `tests/integration/`         | `pnpm vitest run --config tests/config/t3.integration.config.ts` |
| T4 regression  | `tests/regression/`          | `pnpm vitest run --config tests/config/t4.regression.config.ts`  |
| T5 smoke / E2E | `tests/e2e/`                 | `pnpm vitest run --config tests/config/t5.e2e.config.ts`         |
| T6 containment | `tests/containment/`         | `pnpm vitest run --config tests/config/t6.containment.config.ts` |

Database-backed T3 cases are opt-in with `DEVAI_DB_TESTS=1`; the default T3 command
still runs their connection-failure and input-validation contracts. Override the
target with `DEVAI_DB_URL`.

Merged T1+T3 coverage is computed with:

```sh
pnpm vitest run --config tests/config/t1-t3.coverage.config.ts
```

The coverage config reads all four thresholds from
`law/policy/thresholds.json`. T2 and T4–T6 never enter the coverage arithmetic.
Bootstrap defects that cannot be corrected by Inspector-owned tests are pinned in
`tests/KNOWN-RED-P5.md`.
