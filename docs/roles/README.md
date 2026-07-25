# Roles

Five roles, declared at session start by the human user. Each governs which agent disciplines may actuate. Per Constitution Article 6, D-3, and `GE-001`..`GE-005`.

## Quick map

| Role          | Authority over                                                            | Read [`docs/roles/<role>.md`]    |
| ------------- | ------------------------------------------------------------------------- | -------------------------------- |
| **Owner**     | Business and behavioral specs (`product/`); joint glossary                | [`owner.md`](./owner.md)         |
| **Architect** | Engineering specs, invariants, trace, ADRs, schemas, ops + security specs | [`architect.md`](./architect.md) |
| **Engineer**  | Application code (`packages/**`)                                          | [`engineer.md`](./engineer.md)   |
| **Inspector** | Tests at all levels (`packages/**/test/**`, `tests/**`)                   | [`inspector.md`](./inspector.md) |
| **Auditor**   | Read-only; produces scorecards, backlogs, assessments                     | [`auditor.md`](./auditor.md)     |

## How to declare a role at session start

For Claude Code sessions, the role is declared in the first message of the session. Format:

```
I am operating in <role> role. Please load my authority paths.
```

For a DEVAI mutation, pass that declaration explicitly as `--as-role <role>` or start a repository-bound `devai work session start` and use `--authority-session <id>`. Repository instructions guide host agents; they do not themselves constrain an unrestricted editor or shell (see [`../meta/security/authority-enforcement.md`](../dev/security/authority-enforcement.md)).

Other harnesses use the equivalent of `AGENTS.md` at the repo root.

## How to hand off

When a task needs work in two roles, end the current session cleanly first:

1. Commit whatever the current role wrote.
2. Optionally push, or stage the next role to pick up in a fresh session.
3. Start a new session in the new role.

This is the **session boundary** discipline. It is mechanical, not bureaucratic — see [`../meta/security/authority-enforcement.md`](../dev/security/authority-enforcement.md) §"Cross-role work".

## Why five roles

Each role corresponds to a distinct kind of work and a distinct authority over a distinct path set:

- **Owner** writes natural-language business intent. Cannot translate it into machine-checkable form.
- **Architect** distills business intent into invariants. Cannot write code.
- **Engineer** satisfies invariants with code. Cannot rewrite invariants (escalates via RGR when stuck).
- **Inspector** calibrates the sensors (tests). Cannot weaken them to hide bugs.
- **Auditor** observes the whole system without actuating. Trustworthy precisely because it's outside the loop.

Per D-3: Inspector and Auditor are non-extensible (sub-roles would fragment sensor calibration / observation authority). Owner, Architect, and Engineer are extensible per client.

## See also

- Constitution Article 6 (Authority).
- D-3 (Five roles, separated authority).
- `GE-001`..`GE-005` (per-role glossary).
- [`../meta/security/authority-enforcement.md`](../dev/security/authority-enforcement.md) — the enforcement layer.
- [`../adopters/user-guide.md`](../adopters/user-guide.md) — narrative introduction.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/README.md (classification CURRENT).
