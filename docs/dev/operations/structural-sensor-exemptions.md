# Structural scorecard exclusions for the framework repository

**Authority:** Architect (Constitution Article 6).
**Audience:** reviewers interpreting DEVAI's Article-36 self-scorecard.

The machine-readable authority is
`.devai/config/scorecard-na.json`. This page explains the current repository
shape; it does not create additional N/A cells.

## Project shape

DEVAI declares `project_type: framework`. Its product surface is the CLI and
governance substrate, not a business HTTP service, relational domain model, or
customer-data store. Example applications and stack packs are fixtures and
must not be counted as DEVAI's own production API or database.

The repository does contain a current CLI use-case artifact at
`product/use-cases/devai-cli.json`; older prose claiming no use
cases existed is historical and is not an exemption rationale.

## Current N/A cells

| Cell                             | Why it is structurally inapplicable to DEVAI-self                                                                                                                         | What remains applicable to adopters                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `F2:T4` Plant × Alignment        | DEVAI has no application migration substrate or database of record for `sense migrate check`.                                                                             | Runtime-host repositories with migrations measure this cell.                     |
| `F4:T1` Inventory × Coverage     | The actual DEVAI product inventory is the CLI action registry; API/data inventory sensors otherwise observe fixtures rather than the product surface.                     | Repositories with controllers, routes, or data models measure presence normally. |
| `F4:T2` Inventory × Depth        | The same CLI-vs-fixture mismatch prevents API-oriented depth from representing DEVAI's product.                                                                           | Runtime-host repositories measure inventory depth.                               |
| `F4:T6` Inventory × Security     | DEVAI has no customer PII/data-model inventory for the data-handling and product-RBAC sensors. CLI authority is verified through separate Article-6 invariants and tests. | Product repositories with data/RBAC surfaces measure this cell.                  |
| `F1:T6` Specification × Security | The spec-security sensor's PII-registry leg has no application data substrate in this framework repository. Threat-model and authority signals remain separately binding. | Repositories with product data must provide the full security-spec substrate.    |

`F2:T9` is **not** N/A: build readings map to Plant × Discipline. `F5:T5` is
also applicable: R21 records the hybrid CI decision and DEVAI's `ci.yml`
self-consumes the exported reusable evidence gate while retaining
framework-specific jobs.

## Review discipline

- N/A excludes only the exact configured cell; it never converts REVIEW,
  UNKNOWN, malformed evidence, or execution error into PASS.
- Any finding outside the five configured cells is triaged normally.
- A new product substrate or a new sensor mapping requires re-evaluating and,
  when appropriate, removing an exclusion.
- `runtime-host` adopters do not inherit DEVAI-self's framework-shape overlay.

The N/A-aware aggregate reports execution health separately from readiness and
preserves UNKNOWN as non-promoting.
