---
id: R-0001-P1-SCHEMA-ROSTER-KNOWN-RED
title: P1 schema-roster role handoff (closed)
type: round-handoff
status: superseded
date: 2026-07-23
authority: Architect
supersedes: null
superseded_by: 9f9f5a2134cd3823015ede8e4b097829c07ed932
provenance: R-0001/P1 role-pure dependency; Constitution Article 6
---

# P1 schema-roster role handoff

P1 adds `law/schemas/population-registry.schema.json` and four draft DII entries.
Until the downstream role-pure wiring lands, the full suite is expected to report:

1. roster-directory bijection mismatch because the new schema is not yet in
   `packages/schemas/src/roster.ts`;
2. register population count mismatch because the parsed population grows from 100 to
   104 entries.

The literal `checkSchemas()` acceptance gate also exposes a pre-existing linter defect:
the genesis baseline has 62 `open-world-object` findings, all on predicate fragments
such as `allOf/if`, `contains`, and `oneOf` branches. Representative paths include
`authority-session.schema.json $root/allOf[0]/if`,
`sensor-input-spec.schema.json $root/properties/specs/allOf[0]/contains`, and
`validation-result.schema.json $root/allOf[0]/then`. These fragments intentionally
match part of a containing object. Adding `additionalProperties: false` changes their
logic; adding `additionalProperties: true` only games the current rule. Neither is an
acceptable law change.

Required role-separated changes:

- **Engineer:** add `population-registry.schema.json` to the sorted `ROSTER` in
  `packages/schemas/src/roster.ts`; update its count comments from 51 to 52. It is a
  contract schema, not an infrastructure schema.
- **Inspector:** update
  `packages/schemas/tests/contract/roster.contract.test.ts` to expect 52 and
  `packages/schemas/tests/contract/register.contract.test.ts` to expect 104; correct the
  stale register-test title that says 96 while the prior assertion was 100.
- **Engineer support:** refine `checkSchemas()` so `open-world-object` applies only to
  complete object shapes, not conditional/contains/oneOf predicate fragments, and add a
  package-level regression proving a genuinely open complete shape still fails while
  predicate fragments do not. The resulting complete-roster `checkSchemas()` output
  must be an empty array.

After both changes, P1 must rerun the full suite, assert meta-gate zero noncompliant,
assert `checkSchemas()` zero findings, and replace this known-red handoff with a closure
note or mark it superseded. No package or test file is Architect-authorized.

## Closure

Closed by Engineer commit `9f9f5a2134cd3823015ede8e4b097829c07ed932`.
The roster contains 52 schemas, the register count guard expects 104 parsed entries,
the canon linter distinguishes complete shapes from predicate fragments, and its
regression preserves detection of a genuinely open complete object shape.

Architect re-verification after that commit:

- full contract suite: 5 files, 28 tests, all green;
- meta-gate: all 52 roster schemas compliant, zero noncompliant;
- canon linter: zero findings;
- all 52 schemas compile and every declared example validates;
- population registry validates with 11 declared populations;
- predecessor worktree remains clean.

Two repository-wide bootstrap baselines remain outside P1 and are routed to P7:

- `pnpm typecheck` cannot resolve Node built-ins/`ImportMeta` types because the TypeScript
  configuration does not load the installed Node type definitions; the failed build also
  emits JavaScript, declarations, maps, and `tsconfig.tsbuildinfo` into source paths.
- `pnpm lint` cannot start because `eslint.config.mjs` imports undeclared package
  `@eslint/js`.
