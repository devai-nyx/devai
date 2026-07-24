# KNOWN-RED handoff to P5

The P4 schemas build is green. The package-local contract suite has exactly
three count-guard failures after the authorized P1 law additions and P3 product
transposition. Their assertions are Inspector-owned test content, so P4 has
left them unchanged.

Raw verification:

- 5 test files collected
- 28 tests collected
- 25 passed
- 3 failed
- no other failures

P5 dispositions:

1. `tests/contract/roster.contract.test.ts`
   - `roster > bijects with law/schemas (count guard: 52)`
   - Actual roster and `law/schemas/**` both contain 54 entries after
     `error.schema.json` and `sensor-registry.schema.json` joined the law.
   - Update the assertion and title from 52 to 54.
2. `tests/contract/register.contract.test.ts`
   - `register records > parses a non-trivial population (count guard: 104 provisional entries)`
   - The register now contains 107 entries after DII-102 through DII-104.
   - Update the assertion and title from 104 to 107.
3. `tests/contract/product.contract.test.ts`
   - `glossary records (joint tier) > all 37 entries validate with provenance applied`
   - The transposed product glossary contains 44 entries.
   - Update the assertion and title from 37 to 44.

These are stale census assertions, not schema-validation failures. The same run
confirmed the remaining 25 contract cases green.

The root lint route is live and reaches ESLint through `devai sense lint`.
After P4 removed the two source-only lint defects, five Inspector-owned test
findings remain:

- `tests/contract/adr.contract.test.ts:16`:
  `@typescript-eslint/no-non-null-assertion`
- `tests/contract/adr.contract.test.ts:37`:
  `@typescript-eslint/no-explicit-any`
- `tests/contract/constitution.contract.test.ts:19`:
  `@typescript-eslint/no-non-null-assertion`
- `tests/contract/product.contract.test.ts:17`:
  `@typescript-eslint/no-non-null-assertion`
- `tests/contract/roster.contract.test.ts:5`:
  `@typescript-eslint/no-unused-vars` for `loadSchema`

P5 should repair these test sources rather than weakening the workspace lint
configuration. No non-test lint findings remain after the P4 source cleanup.
