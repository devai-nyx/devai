# Invariant domain taxonomy

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchor:** [D-9](../../../law/adr/README.md) — "Hybrid invariant domain taxonomy (soft)."

## Rule

Every invariant carries a **domain prefix** in its ID: `INV-<DOMAIN>-NNN`. The domain set is hybrid:

- **Core domains** ship with DEVAI and are stable across all projects.
- **Client domains** are project-specific and declared in `.devai/config/domains.json`.

Each invariant references exactly one domain.

### Core domains

| Domain  | Concern                                                 | Examples                                                              |
| ------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `AUTH`  | Authentication, authorization, RBAC                     | `INV-AUTH-001` (e.g. "session tokens are HttpOnly+Secure")            |
| `SEC`   | Security beyond auth (CSP, secrets handling, injection) | `INV-SEC-001` (e.g. "no eval in prod bundles")                        |
| `PERF`  | Performance budgets, latency targets                    | `INV-PERF-001` (e.g. "p99 page load < 2s")                            |
| `DATA`  | Data integrity, PII handling, constraints               | `INV-DATA-001` (e.g. "users.email NOT NULL UNIQUE")                   |
| `API`   | API contracts, versioning, deprecation                  | `INV-API-001` (e.g. "v1 endpoints maintain backward compatibility")   |
| `INFRA` | Build, deploy, CI, infrastructure-as-code               | `INV-INFRA-001` (e.g. "deploys are reversible")                       |
| `UI`    | Frontend behavior, accessibility, UX                    | `INV-UI-001` (e.g. "all interactive elements are keyboard-reachable") |
| `CORE`  | DEVAI-internal governance                               | `INV-DEVAI-001` ("DEVAI applies to itself")                           |

`CORE` is reserved for the framework itself. Adopters use the other seven plus their own client domains.

### Client domains

Declared in `.devai/config/domains.json`:

```json
{
  "domains": [
    { "code": "BILLING", "description": "Subscription, invoicing, payment flows" },
    { "code": "INVENTORY", "description": "Stock tracking, fulfillment" },
    { "code": "REPORTING", "description": "Analytics dashboards" }
  ]
}
```

The code is uppercase, 3–10 characters, matches `[A-Z]+`. Description is human-readable.

Adding a domain is a config change reviewed under Architect authority.

## Rationale

Three options were considered:

| Option                                               | Verdict  | Why                                                                                                                                                    |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fixed taxonomy (DEVAI ships a single canonical list) | Rejected | Business domains vary widely. A fixed list either gets too long (covering every plausible business) or too short (leaving real concerns unclassified). |
| Pure client-defined (no canonical core)              | Rejected | Cross-DEVAI consistency dies. `INV-AUTH-001` should mean roughly the same kind of thing across every DEVAI-governed repo.                              |
| Hybrid (core + client extensions)                    | Chosen   | Cross-cutting concerns have stable names; business specifics are project-defined. Both needs met.                                                      |

The core seven (eight including `CORE`) was distilled from analysis of what concerns reliably appear across every adopter, regardless of business domain. Adding a ninth core domain requires a successor D-entry: the bar is "this concern appears in the majority of DEVAI-adopting projects."

## Practical consequences

1. **Invariant IDs are domain-anchored.** `INV-AUTH-001` is allocated separately from `INV-DATA-001`. Two domains can have an "-001" simultaneously; the domain prefix disambiguates.

2. **Sequential allocation is per-domain.** The next `INV-AUTH-NNN` is computed by reading the highest existing `INV-AUTH-*` and incrementing. Parallel work across different domains doesn't contend.

3. **Scorecard rollups can group by domain.** The 5×9 substrate-aspect grid is the primary axis, but secondary breakdowns by domain are supported (e.g., "all AUTH invariants in the scorecard's F3 row").

4. **Client domains are validated on load.** `.devai/config/domains.json` is JSON-Schema-validated. Malformed or unknown domain codes in invariant IDs fail the validator.

5. **Domain choice influences sensor dispatch.** Some sensors (`sense-auth`, `sense-data-handling`) are domain-aware: when run against an invariant with a specific domain prefix, they apply domain-specific extractors.

## Adding a new domain

For a **client domain** (most common case):

1. Open `.devai/config/domains.json`.
2. Add a new object with `code` (uppercase 3–10 chars) and `description`.
3. Re-run `devai spec validate invariants` to confirm any new invariants using the domain resolve.

No D-entry needed for client domain additions.

For a **core domain**:

1. Propose in a D-entry citing the cross-project evidence: which adopters have invariants currently mis-domained or unclassifiable because no core domain fits?
2. If accepted, the D-entry adds the domain to the canonical list above, and ship the domain support in the next DEVAI release.
3. Adopters get the new core domain on their next `devai adopt upgrade`.

## When to revisit

A successor D-entry would be needed if:

- A ninth (or larger) core domain meets the cross-project-prevalence bar.
- The hybrid pattern proves operationally clumsy — e.g., adopters consistently misuse a core domain that should arguably be split. So far the core seven (+ `CORE`) have held up across the canonical reference repo and pilot adopters.
- A breaking change to the domain code format becomes necessary (e.g., longer codes, hyphenated codes). This would require a migration plan for existing invariants.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/invariant-taxonomy.md (classification CURRENT).
