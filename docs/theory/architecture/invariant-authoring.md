# Invariant Authoring Guide (CNL Discipline)

This guide is Architect-owned guidance for writing the `statement:` field of `invariant.schema.json` records. It distills the Controlled Natural Language (CNL) discipline absorbed from the sibling-exploration draft (see D-39 Bucket-A.5 / Phase 11.E).

The guidance is **descriptive**, not enforced by the schema. A `warn`-severity lint in `spec validate-invariants --strict-cnl` flags `statement:` fields that violate the modal-verb requirement; everything else here is style guidance.

## Why CNL

Invariants exist so an automated agent can decide, from the `statement:` alone, whether plant behavior violates the rule. Free-form prose makes that decision unreliable: pronouns are ambiguous, modal force varies, time windows are implicit, actors are elided. CNL constrains the writing style enough that the agent's decision becomes mechanical.

This is not about restricting expressiveness — it's about restricting *ambiguity* in the small subset of prose that drives go/no-go gates.

## The pattern

Use this skeleton for every normative `statement:`:

```
<Actor> <MODAL> <Behavior> [WHEN <Condition>] [UNLESS <Exception>] [WITHIN <Bound>].
```

Concrete examples (from imaginary client invariants):

- `The API MUST return HTTP 401 WHEN a protected endpoint is requested without a bearer token.`
- `A tenant user MUST NOT read data belonging to another tenant.`
- `The migration runner MUST complete a forward migration WITHIN 30 seconds UNLESS the migration declares long_running=true.`
- `Every mutating route MUST emit an audit.events record WITHIN the same transaction.`

Compare with the equivalent free-form prose:

> "Auth is enforced on protected endpoints" — three failures: no actor (who enforces?), no modal (MUST? SHOULD?), no observable (status code? response body? side effect?). An agent cannot decide whether plant behavior satisfies this.

## Modal verbs

Use exactly one of the five RFC-2119 modals per `statement:`, and pick the one that matches the invariant's `severity:`:

| Modal | Severity | Meaning |
|---|---|---|
| `MUST` | `constitutional`, `hard-fail` | Hard requirement. Violation blocks. |
| `MUST NOT` | `constitutional`, `hard-fail` | Prohibited behavior. Violation blocks. |
| `SHOULD` | `gate` | Preferred. Violation gates with possible override. |
| `SHOULD NOT` | `gate` | Discouraged. Violation gates with possible override. |
| `MAY` | `warn`, `advisory` | Explicitly optional. Surfaced but never blocks. |

Do not mix modals in one statement (`The API MUST authenticate but MAY skip when…`). Split into two invariants.

## Actor specificity

Replace vague subjects with concrete ones:

| Vague | Specific |
|---|---|
| "the system" | "the API gateway" / "the migration runner" / "the audit interceptor" |
| "users" | "tenant users" / "platform admins" / "service accounts" |
| "data" | "tenant rows" / "audit events" / "session tokens" |

If you can't name the actor, the invariant is probably too coarse — split it.

## Conditions and bounds

The `WHEN`, `UNLESS`, `WITHIN` clauses make the rule machine-checkable:

- `WHEN` scopes when the rule applies. Without it, the rule applies always.
- `UNLESS` carves out a single named exception. Multiple exceptions → split the invariant.
- `WITHIN` gives a measurable bound. Use units (`30 seconds`, `100 milliseconds`, `1000 rows`). Avoid `fast`, `soon`, `eventually`.

## Anti-patterns

Bad statements share these failure modes:

- **Pronouns without antecedent.** "It MUST validate" — what is `it`?
- **Implementation masquerading as semantics.** "The route handler MUST call `validateToken()`" — that's an implementation note, not an observable contract. Rewrite as the *observable* the implementation produces.
- **Hidden time windows.** "The job MUST complete soon" — what does soon mean? Bound it or remove it.
- **Mixed modal force.** "The API MUST return 401 but MAY return 403" — split into two.
- **Authoring policy in the statement.** "Engineers MUST review this carefully" — that's a process, not an invariant.

## Cross-references

The `authority:` block on an invariant should cite the prose source that elaborates the statement (e.g., `AGENTS.md#stack-uniformity`). Keep the `statement:` field self-contained — it must be readable without the linked prose — but the linked prose may explain rationale, examples, and edge cases.

## When the CNL pattern doesn't fit

Some constitutional invariants are about substrate facts rather than behaviors (e.g., `INV-DEVAI-001`: "DEVAI applies to itself from Phase 0"). For these, the modal stays (`DEVAI MUST apply itself to its own development …`) but the actor is the substrate, not a runtime component. That's fine; the CNL pattern is a default, not a straitjacket.

## Verification (informal)

Before merging a new invariant, the Architect should be able to answer:

1. **Who is the actor?** Named in the statement.
2. **What is the observable?** A sensor could plausibly check it (HTTP status, log line, DB row, file diff, type-checker error).
3. **What is the bound?** If `WITHIN` is missing, why?
4. **What is the exception scope?** If `UNLESS` is missing, are there none, or did I forget?
5. **What is the modal?** Matches the chosen `severity:`.

If any of those answers is "unclear", rewrite before merging.

## Lint (Phase 11.E)

`devai spec validate invariants --strict-cnl` flags `statement:` fields that lack a recognized modal verb (`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`) as `warn` severity. The flag is opt-in to avoid breaking existing invariants that pre-date the CNL discipline; new invariants are expected to pass the strict check.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/framework/arch/invariant-authoring.md (classification CURRENT).
