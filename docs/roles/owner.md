# Role: Owner

**Authority over:** business and behavioral specifications. Specifically:

- `product/**` — journeys, user stories, acceptance criteria, business rules.
- `law/glossary/**` — jointly with Architect.

**Cannot touch:** `docs/theory/architecture/**`, `law/schemas/**`, code, tests, harness state.

## What the Owner does

The Owner is the voice of _what the software is for_. The Owner writes in natural
language, close to user intent. The Architect translates that intent into
machine-checkable contracts when needed.

The compilation link from Owner to Architect is the `related_invariants` array on each Owner-authored artifact. The Owner says "this journey requires this invariant"; the Architect authors the invariant.

## A typical day

1. **Session start:** declare Owner role. The harness loads Owner write paths (`product/**`, `law/glossary/**`).
2. **Pick a journey to refine.** Look under `product/journeys/` (a future client repo's; canonical DEVAI has stub journeys).
3. **Edit the journey** to clarify acceptance criteria, success/failure paths, edge cases.
4. **Validate the journey** schema:
   ```bash
   devai spec validate journeys
   ```
   Catches dangling `related_invariants` references.
5. **If a new term enters the journey** that isn't in the glossary, add a glossary entry:
   ```bash
   # Edit law/glossary/GE-NNN.json with the term
   devai spec validate glossary
   ```
6. **Commit** with the Inv-Compliance trailer if the change advances a known invariant; otherwise plain commit.
7. **Hand off** to Architect via a session boundary if the change requires a new invariant.

## What success looks like

- Every journey has clear acceptance criteria (one observable per criterion).
- Every domain term used in a journey has a glossary entry.
- Every blocking requirement has a `related_invariants` reference to an Architect-authored invariant.
- No journey has prose that implies a constraint without explicit `related_invariants`.

## Anti-patterns

| Pattern                                                      | Why bad                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Writing imperatives in Owner artifacts ("The system MUST X") | Owner uses Architect vocabulary; that's role-blur. Rephrase as user intent and reference the invariant. |
| Editing invariants directly                                  | Cross-role; the harness will refuse. Open an Architect session instead.                                 |
| Adding glossary entries without an authority anchor          | Glossary entries need to cite the doc that introduces the term.                                         |
| Deleting a journey because it "doesn't apply anymore"        | Journeys live until their related invariants are tombstoned. Mark `status: deprecated`, don't delete.   |

## Tools the Owner uses

| Command                                       | When                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `devai spec validate journeys`                | Before committing journey changes.                                               |
| `devai spec validate glossary`                | Before committing glossary changes.                                              |
| `devai inventory glossary --format human`     | See coverage of glossary terms across F1/F2.                                     |
| `devai work backlog list`                     | See what Architect/Engineer is working on.                                       |
| `devai catalog actions --authority specifier` | Filter the action catalog to Architect-tier verbs (Owner consumes their output). |

## Hand-offs

| To        | When                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Architect | A journey reveals a new invariant is needed.                                                              |
| Auditor   | Question about whether a journey is being measurably advanced — Auditor produces the scorecard breakdown. |

## Authority files

| Path                          | Editable by Owner?              |
| ----------------------------- | ------------------------------- |
| `product/**`                  | ✅ Yes                          |
| `law/glossary/**`             | ✅ Yes (jointly with Architect) |
| `docs/theory/architecture/**` | ❌ No                           |
| `law/schemas/**`              | ❌ No                           |
| `packages/**`                 | ❌ No                           |

## See also

- [`README.md`](./README.md) — role index.
- [`README.md`](./README.md) — current human authority overview.
- Constitution Article 6.
