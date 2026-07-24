# Known Tech-Debt Items

**Authority:** Architect (Constitution Article 6).

A living catalogue of debt items that are *intentionally not fixed*: each entry documents the smell, why we are leaving it in place today, and the migration sketch for when the trigger arrives. Items move to `CHANGELOG.md` (closed) or stay here (open) — they are never silently resolved.

## Index

| Item | Status | Trigger to revisit |
|---|---|---|
| [Async parallelization of `buildRtdManifest`](#async-parallelization-of-buildrtdmanifest) | deferred | `rtd bundle` latency exceeds ~500 ms on a real client repo. |
| [Non-NestJS inventory parsers](#non-nestjs-inventory-parsers) | deferred | A named adopter requires complete Laravel, Express, Spring, Blade, or AngularJS inventory; or one of those parsers is separately authorized. |

Closed entries (forensic trail in `CHANGELOG.md`):
- *Canonical-JSON hash algorithm divergence* — closed in Phase 16.G. `@devai-nyx/core/canonical-json` ships `canonicalSha256(value, version)` with `v1.0` (legacy shallow-sort) and `v2.0` (true deep-sort) dispatch. `agent-run` and `rtd-manifest` schemas grow an optional `hash_algo_version`; new writes stamp `'2.0'`, readers default to `'1.0'` on absence (matching the legacy algorithm those records were hashed under). `rgr` / `release-control` carry no stored hash field, so their `*ContentHash` helpers are utility-only and always use the current default. See CHANGELOG entry under Phase 16 for the full migration record.
- *Coverage measurement was unit-only with no binding threshold* — closed in
  R15. Deterministic unit and subprocess integration V8 output is merged and
  the repository gate enforces 70/60/70/70 lines/branches/functions/statements.
  The 80% line figure remains an improvement target, not the binding floor.

## Async parallelization of `buildRtdManifest`

**Surface.** `packages/core/src/rtd-manifest/index.ts` `buildRtdManifest` runs seven `summarize*` helpers sequentially. Each is synchronous: `readFileSync` + `JSON.parse` + hash. Independent of each other after the invariant-id set is built from the first.

**Why we are NOT parallelizing today.** Current registry sizes are queryable
and no captured `rtd bundle` measurement exceeds the ~500 ms trigger. The
sequential implementation remains simpler until a real adopter measurement
shows user-perceptible latency.

**Migration sketch (when triggered).**

1. Convert each `summarize*` helper to async using `fs/promises`.
2. After computing the `invariantIds` set (which all xref-aware summarizers depend on), `Promise.all` the remaining six.
3. Convert `buildRtdManifest` to `async`. Update the three call sites (`packages/cli/src/commands/rtd/index.ts` + two test files).
4. Re-verify component-hash determinism by running `devai spec rtd bundle` twice and diffing.

**Trigger.** `devai spec rtd bundle` on a real client repo exceeds ~500 ms (user-perceptible) or the CI step running the bundle starts dominating its phase budget.

## Non-NestJS inventory parsers

**Surface.** `SENSOR_DESCRIPTORS` and its generated [sensor registry](../reference/sensor-registry.md) now distinguish pack parameters actually consumed at runtime from declared-only detection/advisory hints. The old blanket “sensor-side wiring is deferred” claim is closed. What remains is parser coverage: `inventory_api` is NestJS-shaped, while `inventory_routes` supports React and Angular. Laravel, Express, Spring, Blade, and AngularJS parsers are absent.

**Why we are not shipping those parsers today.** A framework name in a pack is not an implementation. Each parser requires a separately designed syntax/AST boundary, fixtures, conservative failure semantics, and adopter validation. Shipping generic regex approximations under a production-support label would overstate what the sensor observed.

**Migration sketch (when triggered).**

1. Specify one framework parser and its incomplete/unknown behavior before implementation.
2. Add representative framework fixtures and red-first extraction contracts.
3. Implement the parser behind the existing descriptor and pack binding without treating declared-only hints as executable until that batch ships.
4. Add a brownfield end-to-end fixture for the new framework and update the descriptor's `parserSupport` metadata.

**Trigger.** A named adopter needs complete inventory for one absent framework, or a separate Architect decision authorizes that parser with a concrete fixture and acceptance boundary.

## How to use this document

- **Adding an entry.** New tech-debt finding goes here, not into a comment in the source. Each entry MUST have a *trigger* — without one, it's not debt, it's just a complaint.
- **Closing an entry.** When the trigger fires, execute the migration sketch, move the entry to `CHANGELOG.md` with a brief note on what changed, and delete it from here.
- **Auditing.** This document is part of the Architect-authored security/governance surface. Items here are visible to anyone reading `docs/theory/architecture/`. Don't hide debt elsewhere.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/known-tech-debt.md (classification CURRENT).
