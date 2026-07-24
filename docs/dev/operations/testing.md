# Testing operations

**Authority:** Architect (Constitution Article 6, F1).
**Forensic anchors:**
- [D-54](../../../law/adr/README.md) — "DB-gated integration tests stay opt-in (`DEVAI_DB_TESTS=1`) (locked)."
- [D-55](../../../law/adr/README.md) — "CI runs the mock LLM provider; real providers are opt-in (locked)."
- [D-126](../../../law/adr/README.md) — supported supervision and experimental autonomy are accounted separately.
- [D-105](../../../law/adr/README.md) — "Full-production readiness makes natural DB/LLM credentials default."

## Scope

This runbook covers two intersecting testing decisions: which integration tests require a live Postgres, and which LLM backend DEVAI uses by default. Both are operational choices about production evidence, test cost, determinism, and authority firewalls.

## Rule 1: DB-backed integration tests are default-on for full-production

Integration tests requiring a reachable Postgres run by default against the natural local test database:

```bash
postgresql://$USER@localhost:5432/devai_test
```

Override with `DEVAI_DB_URL` when a different local test database is the intended production-readiness target. Set `DEVAI_DB_TESTS=0` only for explicitly hermetic wiring runs; that skip is not full-production evidence. The current DB-backed suite is:

- `sense.integration.test.ts` — the migrate-check probe
- `db-introspector.integration.test.ts`
- `runtime-probe-data.integration.test.ts`

This list, rather than a hand-maintained test count, is the current operational scope.

**Honest-failure branch.** If the natural Postgres URL is not reachable, the tests **error**, not skip. Silent-skip on misconfiguration would mask the most common bug shape: an assumed-local service missing or pointed at the wrong database.

### Local trust-auth recipe

The default assumes a local Postgres 15+ server with trust/peer auth and a dedicated `devai_test` database:

```
createdb devai_test
pnpm test:integration
```

## Rule 2: Real-provider tests are explicit opt-in

Runtime backend resolution may discover host credentials, but the ordinary test suite never invokes them implicitly. Tests use deterministic mocks unless `DEVAI_LLM_TESTS=1` is explicitly set. When real-provider testing is enabled, backend resolution is:

1. `.devai/config/llm.json` `default_family`, if configured.
2. `claude-cli` when the host `claude` CLI is on PATH.
3. `codex-cli` when the host `codex` CLI is on PATH.
4. `mock` only when no natural real provider is available, or when explicitly requested.

Direct SDK backends still work with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Host CLI backends inherit the operator's logged-in OAuth session and need no exported API key.

### Hermetic mode

The ordinary deterministic lane is:

```bash
DEVAI_DB_TESTS=0 DEVAI_LLM_TESTS=0 DEVAI_LLM_BACKEND=mock pnpm test:integration
```

That lane is the supported repository gate. Two explicitly gated integration files cover **four writer surfaces** (`overview`, `rbac-matrix`, `architecture-guide`, and `onboarding`). Their results are **additional, opt-in evidence** for those surfaces only; they do not generalize to every writer or make experimental autonomous execution production-ready.

## Practical consequences

1. **`pnpm test:integration` is deterministic by default** and cannot consume ambient real-provider credentials.

2. **Real LLM use must be intentional.** Only `DEVAI_LLM_TESTS=1` authorizes provider-backed test cases.

3. **`DEVAI_LLM_BUDGET_USD` is recommended for SDK providers** as a fail-safe cap. CLI bridges may delegate budget controls to the host CLI; DEVAI still records usage envelopes in `record/proofs/llm-usage.jsonl`.

4. **`CONTRIBUTING.md` remains the canonical onboarding doc** for local DB setup and real-LLM setup. This runbook states the policy.

5. **Mock remains an explicit backend.** It is still valid for tests that deliberately pin `DEVAI_LLM_BACKEND=mock` to assert parser and wiring behavior.

## Trigger conditions to flip

| Rule | Flip triggers |
|---|---|
| DB default-on → hermetic-by-default | Only if local Postgres becomes unavailable as a natural DEVAI development substrate and the failure mode blocks more production evidence than it provides. |
| Deterministic mock default → real-provider default | Requires a new Architect decision; ambient credentials must never silently create cost or nondeterminism. |

No current trigger fires for either rollback.

## See also

- [`db-isolation.md`](./db-isolation.md) — how per-task databases are provisioned when the gated tests run.
- [`../../docs/theory/architecture/test-weakening.md`](../../theory/architecture/test-weakening.md) — the detector that ensures tests don't silently degrade.
- [`incident-playbook.md`](./incident-playbook.md) — diagnosing "tests failing in CI but passing locally" symptoms.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/testing.md (classification CURRENT).
