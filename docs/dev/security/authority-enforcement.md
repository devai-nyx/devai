# Authority enforcement

**Scope:** the mechanical authority boundary shipped by DEVAI under Constitution Articles 6–10, INV-AUTH-001 through INV-AUTH-004, D-135, and ADR-003.

## Exact guarantee

DEVAI mechanically enforces role, consent, policy, resource, plan, and final-boundary checks for side effects performed through its CLI/runtime adapters. It does not claim to constrain an arbitrary editor, shell, Git command, or host-agent file tool in `cli-only` mode. Those surfaces become mechanically covered only when a named, verified host adapter intercepts them and applies the same policy.

There are exactly five caller-declarable human roles: `owner`, `architect`, `inspector`, `engineer`, and `auditor`. Machine principals are derived by trusted runtime transitions; callers cannot select `harness`, `upgrade`, `release`, or `orchestrator` as a human role.

## Constitutional path table

| Substrate                      | Authority                   | Canonical paths                                                                                                                                          |
| ------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 business reference          | Owner                       | `product/`; `law/glossary/` jointly with Architect                                                                                                       |
| F1 engineering reference       | Architect                   | `docs/start/`, `docs/theory/`, `docs/theory/framework/` except `product/`, `docs/roles/`, `docs/adopters/`, `docs/reference/`, `docs/meta/`, `README.md` |
| F1 governed round intent       | Architect                   | `work/rounds/R-NNNN/`; committed intent closes in place                                                                                                  |
| F1 observations                | Auditor                     | `work/audit/` and descendants; observation does not ratify the reference signal                                                                          |
| F2 plant                       | Engineer                    | `apps/`, `libs/`, `db/migrations/`, `db/seeds/`, `iac/`, root build scripts, and project-specific additive source paths                                  |
| F3 sensors                     | Inspector                   | `**/*.spec.ts`, `**/*.test.ts`, `tests/`, `e2e/`, and test-intent configuration                                                                          |
| F4 inventory                   | Derived inventory subsystem | `record/derived/inventory/`; never hand-edited                                                                                                           |
| F5 configuration and machinery | Derived upgrade subsystem   | `.devai/` excluding `inventory/`, `worktrees/`, and `state/`                                                                                             |
| F5 runtime state               | Executing DEVAI verb        | `record/proofs/`; attributed to the verb and never hand-edited                                                                                           |
| F5 disposable round state      | Executing DEVAI verb        | `.devai/state/round-runs/R-NNNN/`; backlog proposals, orchestration logs, and local closeout never become governed intent without Architect promotion    |

Client extensions are additive. They may narrow a specialization, add project paths, or add a higher-precedence deny; they cannot replace, weaken, or tie-conflict with the immutable core.

## Invocation contract

Read actions take no authority declaration. Supplying `--as-role` or `--authority-session` to a read action is a usage error.

A mutation-capable action requires:

- exactly one declaration: `--as-role <role>` or `--authority-session <id>`;
- `--write`;
- `--allow-publish` as well for publication;
- `--experimental` as well where the action lifecycle requires it.

Example direct invocation:

```bash
devai inventory suggest --from-inventory --repo-root . \
  --as-role architect --write
```

An explicit session is repository-, package-, Constitution-, and policy-bound:

```bash
devai work session start --target . --ttl-minutes 60 \
  --as-role architect --write

devai inventory suggest --from-inventory --repo-root . \
  --authority-session AUTH-SESSION-... --write
```

Sessions are stored under `record/proofs/authority-sessions/`, expire, can be revoked, and cannot be transferred to another repository or policy version. Environment variables such as `DEVAI_ROLE` never authorize.

## Decision and mutation chain

For a governed mutation DEVAI performs this chain before the effect:

1. Resolve the live action contract and its explicit effect, subject, consent, planner, boundary, and readiness fields.
2. Resolve the direct role or validate the opaque session record.
3. For derived actions, preserve the initiating human role and consent in a trusted machine context.
4. Load the materialized policy and recompute package, Constitution, immutable-source, extension, and resolved-rule digests.
5. Classify the exact filesystem, Git-ref, database, or remote resource and operation.
6. Apply deterministic precedence. Unknown targets, missing matches, conflicting top-precedence matches, denies, or subject/action/operation/consent mismatches refuse.
7. Register an exact plan or bounded plan and issue an opaque, process-local, one-use decision receipt.
8. Re-check target identity, containment, batch membership, bounds, order, and replay immediately before the final adapter applies the effect.

JSON-looking decisions, copied receipts, recomputed hashes, evidence records, and audit documents are not capabilities.

## Policy materialization and posture

The supported materialization path is an explicit Architect invocation of `adopt upgrade` with `--write`. The Architect initiates the transition; the trusted `upgrade` machine principal owns the F5 write.

```bash
devai adopt upgrade --target . --as-role architect --write
```

The resulting `.devai/config/authority-policy.json` is generated, canonical, version-bound, and must not be hand-edited. Re-materialize it after package, Constitution, or additive-policy changes.

`authority_enforcement.mode` has two honest values:

- `cli-only`: DEVAI runtime adapters are binding; unrestricted host tools remain outside the boundary.
- `host-integrated`: valid only when `adapter_config` names a real adapter and runtime attestation verifies it. Configuration text alone is not an attestation.

Shadow evaluation is time-bounded, explicitly Architect-approved, evidence-visible, and readiness-ineligible. Expired shadow posture is stale, not binding.

## Exit and output semantics

| Category           | Exit | Meaning                                                        |
| ------------------ | ---: | -------------------------------------------------------------- |
| `usage-error`      |    2 | Missing/conflicting/invalid declaration or consent             |
| `refused`          |    1 | Policy, role, resource, plan, replay, or final-boundary denial |
| `dependency-error` |    1 | A required validator or declared host adapter is unavailable   |

JSON output includes a stable `category` and `code`. Human output is one concise line. Both redact local paths, credential URLs, secrets, and tokens. Dry-run, shadow, denial, unverified-host, and experimental evidence cannot promote supported readiness.

## Role-separated work

Cross-role work uses explicit boundaries and role-clean commits:

1. Architect authors reference changes.
2. Inspector authors tests.
3. Engineer implements code.
4. Auditor independently observes under `work/audit/`.

Changing roles means ending the current authority context and starting a new direct declaration or session. DEVAI never infers the next role from the files being touched.

## Residual risks

- A permitted Engineer can still write defective code inside an allowed path. Tests, review, and independent acceptance address quality, not the path boundary.
- Read access is not restricted by this model.
- `cli-only` cannot prevent out-of-band writes. Evidence verification may detect some tampering after the fact, but detection is not containment.
- A generic shell command or composed skill subprocess without a typed adapter is refused. Do not solve that refusal by widening filesystem policy or adding an environment bypass.
- The experimental loop uses the same boundary but remains readiness-ineligible and human-review terminated.

## See also

- Constitution Articles 6–10, 14, 36, and 39.
- [ADR-003](../../../law/adr/README.md).
- [Threat model](./threat-model.md).
- [Authority migration for adopter agents](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/migrating-authority-enforcement.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/authority-enforcement.md (classification CURRENT).
