# Forbidden actions registry

**Scope:** the `.devai/config/forbidden-actions.json` registry and the runtime + CI gate that enforces it. Per Phase 10.H and `GE-035`.

## What is forbidden

The registry encodes commands that no agent (LLM-backed or otherwise) may execute. The 16 entries that ship out of the box:

| #   | Pattern                                              | Why forbidden                                               |
| --- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `git push --force` (any branch)                      | History rewrite without explicit operator intent.           |
| 2   | `git push --force-with-lease`                        | Same class; explicit operator override required.            |
| 3   | `git push origin main` (or default branch)           | Pushing directly to main bypasses PR review.                |
| 4   | `git push origin master`                             | Same.                                                       |
| 5   | `--no-verify` on any git command                     | Skips pre-commit hooks, including the harness's own guards. |
| 6   | `git commit -n`                                      | Same as `--no-verify`.                                      |
| 7   | `rm -rf` against tracked paths                       | Catastrophic deletion with no audit trail.                  |
| 8   | `DROP DATABASE` outside dev environments             | Production data loss.                                       |
| 9   | `DROP TABLE` outside dev environments                | Same.                                                       |
| 10  | `TRUNCATE` against any audit/log/billing/users table | Data-protection class.                                      |
| 11  | `chmod 777`                                          | Permissions widening to world-writable.                     |
| 12  | `chown root`                                         | Privilege change.                                           |
| 13  | `curl … \| sh` (piping remote content to a shell)    | Arbitrary remote code execution.                            |
| 14  | `wget … \| sh`                                       | Same.                                                       |
| 15  | `eval` (when applied to untrusted input)             | Arbitrary code execution.                                   |
| 16  | `npm install --unsafe-perm`                          | Privilege escalation during install.                        |

The registry is a JSON file under `.devai/config/forbidden-actions.json`; each entry has a pattern (string match or regex), a category, and a justification.

## How enforcement works

### At skill-run time

Skills declare in their manifest whether they execute shell commands (`kind: 'command'` or `kind: 'shell'`). When such a skill runs, the harness intercepts each command and matches against the registry. A match → the skill returns `status: fail` with a `forbidden-action` finding, evidence is emitted, and no command runs.

### At CI / PR time

`devai policy check forbidden actions` is a gate that scans recent agent-runs and skill evidence for any record whose `commands_run[]` would have matched the registry. This is **redundant with** runtime enforcement (the runtime layer should have stopped them) but catches the case where a forbidden command was attempted, refused, and the agent then tried a near-miss the runtime didn't catch.

```bash
devai policy check forbidden actions
```

Exit 0 = clean; exit 2 = at least one forbidden action observed; exit 64 = config malformed.

### As a runtime block

The harness's command runner (`@devai-nyx/core/run-command` or the skill-specific equivalent) wraps every `execSync` / `spawnSync` call with the registry check. Bypass is not a flag — to allow a "near-forbidden" action, edit the registry with a justification commit.

## How to add an entry

Adding to the registry is an Architect-authority change. Process:

1. **Justify.** What attack or accident is this entry preventing? Write the rationale into the entry's `notes` field.
2. **Edit** `.devai/config/forbidden-actions.json`. Pick the lowest available id (`FA-NNN`). Specify `pattern` (string or `regex:<pattern>`), `category`, `notes`.
3. **Validate** with `devai policy check forbidden actions` against the repo to confirm no existing recorded action would trip the new entry. (If something would trip, decide whether to grandfather it via a note or fix the trip.)
4. **Commit** with the Inv-Compliance trailer citing the relevant invariant (typically `INV-DEVAI-001` for governance-policy changes).

## How to retire an entry

Forbidden-action entries are **rarely** retired. A retirement should be exceptional and well-justified. Process:

1. Add `retired_at: <ISO-8601>` to the entry; do not delete it.
2. Move it to a `retired: []` section at the bottom of the registry.
3. Commit with explicit Architect approval and a `forbidden-action.retirement` evidence event.

The retired entry stays for forensic purposes: it documents that this pattern was once forbidden and when it stopped being.

## Per-environment relaxation

Some entries are conditionally forbidden:

- `DROP DATABASE` is forbidden outside `dev`. The registry entry checks the `NODE_ENV` or the configured `project_type` (Phase 10.J): if `project_type: 'docs-archive'`, the DDL entries don't apply.

These conditions are encoded in the entry's `applies_when` field. The check is "deny by default" — if `applies_when` doesn't match the current environment, the entry still applies.

## Failure modes

| Symptom                                                      | Cause                                                          | Action                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Skill returns `status: fail` with `forbidden-action` finding | Tried to run a registered command                              | Either reformulate the command, or escalate to add a justified registry exception.      |
| `check forbidden-actions` exits 2 in CI                      | A past skill run executed a near-miss the runtime didn't catch | Investigate the specific finding; tighten the runtime check or split into two patterns. |
| `check forbidden-actions` exits 64                           | `.devai/config/forbidden-actions.json` malformed               | Validate against `forbidden-actions.schema.json`; re-emit.                              |

## Residual risk

The registry is **pattern-based**. A determined attacker (or a misconfigured agent) can write a command that semantically matches a forbidden pattern but textually evades it (e.g., aliasing, base64-encoding, environment-variable expansion). Defenses against this:

1. Conservative patterns — match a broad family, not a narrow string.
2. Defense in depth — `check forbidden-actions` running periodically + PR review of any skill manifest changes.
3. `allowed_write_scopes` on skill manifests — a forbidden action that would write outside the scope is doubly blocked.

## See also

- [`audit-requirements.md`](./audit-requirements.md) — what gets recorded.
- Phase 10.H commit body for the original 16-entry list rationale.
- `forbidden-actions.schema.json` — registry schema.
- `GE-035` (Forbidden action).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/forbidden-actions.md (classification CURRENT).
