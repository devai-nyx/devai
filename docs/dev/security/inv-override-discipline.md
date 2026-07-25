# inv-override discipline

**Scope:** the in-source `inv-override` annotation that records site-specific deviation from non-constitutional invariants. Per Phase 10.B and `GE-027`.

## What an override is

An invariant has a `severity:` per the 5-tier ladder (`constitutional | hard-fail | gate | warn | advisory`, Phase 10.A, `GE-026`). The two upper tiers — constitutional and hard-fail — are **not** overridable. The three lower tiers (gate / warn / advisory) **can** be overridden with an annotation.

An override is a structured comment in source code that says: "I know `INV-XX-NNN` says this surface should behave a certain way; here at this specific point, with this reason and this approver, we are deviating."

## The annotation form

```ts
// inv-override: INV-AUTH-007
//   reason: Legacy migration path; cannot upgrade callers until v2.
//   ticket: ENG-1234
//   expires: 2026-09-01
//   approver: architect@example.com
function legacyAuthHandler(req: Request) {
  // …
}
```

Required fields:

| Field            | Format                | Notes                                            |
| ---------------- | --------------------- | ------------------------------------------------ |
| The invariant id | After `inv-override:` | Must match an active invariant (not tombstoned). |
| `reason`         | Free text             | Why the deviation is necessary. Reviewable.      |
| `ticket`         | Free text or ID       | An external tracking handle.                     |
| `expires`        | ISO-8601 date         | When this override must be revisited. Required.  |
| `approver`       | Email or identifier   | Who signed off.                                  |

The scanner accepts the annotation in a few forms: a single-line `// inv-override: …` followed by the structured key/value comment lines (preferred), or a JSDoc-style `/** @inv-override … */` block. See `inv-override.schema.json` for the canonical structure.

## What the scanner does

```bash
devai policy check overrides
```

Scans configured source globs for the annotation. For each occurrence:

1. **Schema validation** — the structured form parses cleanly and has all required fields.
2. **Invariant resolution** — the cited `INV-XX-NNN` exists in the catalog and is not tombstoned.
3. **Severity check** — the cited invariant is not `constitutional` or `hard-fail` (override of these is rejected outright).
4. **Expiry check** — `expires` is in the future. Past-expiry overrides surface as `cnl-warn`-level findings (won't block, but the score assess routes them to the backlog).

Output: a structured report of every override with its status (`valid | expired | invalid_invariant | invalid_severity`).

## Lifecycle

```
   write code with override         expires reached
        │                                  │
        ▼                                  ▼
   reviewed in PR              surfaces in `check overrides`
        │                                  │
        ▼                                  ▼
   commits with                  three paths:
   Inv-Compliance trailer        a) refresh the override
                                 b) fix the code so override is unneeded
                                 c) escalate to amend the invariant
```

The `expires` date is mandatory **and** must be revisited. The framework refuses to silently re-up an override; either the code changes, the invariant changes, or the operator explicitly bumps the `expires`.

## Authority

Overrides are an Engineer-tier mechanism (they live in source code). But the **approver** must be Architect-tier — the person who can speak for whether the deviation is structurally OK. Approvers are tracked by email or identifier; the framework does not enforce role membership, but PR review should.

## What an override is **not**

- It is **not** a way to escape constitutional/hard-fail invariants. The scanner rejects those outright.
- It is **not** permanent. The `expires` field forces revisit.
- It is **not** an alternative to fixing the code. The reviewer should ask: "could we fix this in N hours instead of carrying an override?" Often the answer is yes.
- It is **not** an alternative to `RGR` (`GE-018`). RGR is for spec gaps; override is for cases where the spec is right but a specific call site needs a documented exception.

## Anti-patterns

| Pattern                                                 | Why bad                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Override without `reason`                               | Defeats the purpose; reviewer can't evaluate.             |
| Override with `reason: "for now"`                       | Vague; no constraint on what unlocks removal.             |
| Override with `expires` years in the future             | Effectively permanent. Tighten.                           |
| Override approved by the same person who wrote the code | No independent review.                                    |
| Override on a `severity: constitutional` invariant      | Schema-rejected.                                          |
| Multiple overrides accumulating on the same surface     | Architecture smell; revisit the invariant or the surface. |

## CI integration

`devai policy check overrides` runs on every PR. The gate decision:

- Any `invalid_*` finding → CI fails.
- Any `expired` finding → CI gates with `review` (not `block`); allows merge with explicit override of the override-expiry.
- Clean → CI passes.

## Forensic value

Every override is a record. Over time, the override log shows:

- Which invariants are most often overridden (candidates for re-tuning).
- Which approvers are sign-off bottlenecks.
- Which code areas accumulate exceptions (refactor candidates).

`devai inventory adherence` (Phase 11.F) intersects with this: a surface that's heavily orphaned **and** carries old overrides is a high-priority cleanup target.

## See also

- [`forbidden-actions.md`](./forbidden-actions.md) — adjacent governance discipline.
- `GE-019` (Invariant), `GE-026` (Severity ladder), `GE-027` (inv-override).
- `inv-override.schema.json` — the canonical structure.
- Phase 10.B commit body.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/inv-override-discipline.md (classification CURRENT).
