# Secret handling

**Scope:** how DEVAI handles secrets — primarily LLM provider API keys, but also any client-tier secrets (DB credentials, OAuth tokens, signing keys). Per Article 14 (Security-sensitive change policy).

## Core rules

1. **Secrets never inline in source.** No API keys, tokens, or credentials in `.ts`, `.json`, `.md` files. Ever.
2. **Secrets live in environment variables.** Loaded at process start; visible only to the running process.
3. **Secrets never written to evidence.** Every persisted record is filtered through redaction patterns before write.
4. **Secrets never in prompts.** The LLM substrate sees a redacted prompt; secrets are substituted out before composition.

## Where secrets come from

| Secret                               | Env var                                       | Used by                                                                                 |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Anthropic API key                    | `ANTHROPIC_API_KEY`                           | `@devai-nyx/core/llm/AnthropicLlmClient`                                                |
| OpenAI / Codex API key               | `OPENAI_API_KEY`                              | `@devai-nyx/core/llm/CodexLlmClient`                                                    |
| Host LLM CLI auth                    | `claude` / `codex` CLI session                | `@devai-nyx/core/llm/CliLlmClient`                                                      |
| Postgres URL (advisory locks)        | `DEVAI_LOCK_PG_URL`                           | `@devai-nyx/core/loop/locks-pg` (Phase 9.G)                                             |
| Postgres URL (per-task DBs)          | `DATABASE_URL` per task                       | `@devai-nyx/core/loop/db.ts`                                                            |
| Shared development Postgres password | `DEVAI_DB_PASSWORD`                           | `devai work db start shared`; never accepted as a CLI flag and never printed in its URL |
| GitHub Packages read token           | package-manager environment / user npm config | Installing `@devai-nyx/*`; requires `read:packages`, including public-source packages   |
| DB test opt-out                      | `DEVAI_DB_TESTS=0`                            | Hermetic-only skip for Postgres-backed integration tests                                |

The LLM substrate refuses to start if the relevant env var is missing **and** the backend requires it. When no backend is set, DEVAI prefers logged-in host CLI bridges before falling back to `mock`; explicit `DEVAI_LLM_BACKEND=mock` is hermetic wiring mode, not full-production evidence.

## The redaction layer

Every emitted record (sensor reading, agent-run, skill result, evidence event) passes through a redaction filter before write:

### Field-level

Skill manifests declare which fields are sensitive:

```json
{
  "redaction": {
    "fields": ["token", "password", "secret", "authorization", "cookie"],
    "patterns": ["(?i)(api[_-]?key|token|password|secret)\\s*[:=]\\s*[^\\s]+"]
  }
}
```

At emit time, the framework recursively walks the record. Any field whose **name** matches `redaction.fields` is replaced with `<REDACTED>`. Any field whose **value** matches one of `redaction.patterns` is replaced.

### Pattern-level

The default patterns (applied even to records that don't declare their own):

- `(?i)(api[_-]?key|token|password|secret)\s*[:=]\s*[^\s]+` — common assignment syntax.
- `Bearer [A-Za-z0-9._\-]{20,}` — bearer tokens.
- `sk-[A-Za-z0-9]{20,}` — OpenAI-style keys.
- `eyJ[A-Za-z0-9._\-]{20,}` — JWTs (first segment of base64-encoded `eyJ`).

These are conservative — false positives (a legitimate string that matches) are preferred over false negatives.

## Manual redaction

When a secret slips into an emitted record (e.g., a sensor wrote stdout containing a leaked token), redact retroactively:

```bash
devai evidence redact \
  --target EV-abc12345 \
  --pattern 'sk-[A-Za-z0-9]{20,}' \
  --note 'Operator-detected leak'
```

The redaction itself emits an `evidence.redact` event recording who redacted what, **without** surfacing the redacted content. The downstream chain is re-linked; `evidence verify` passes.

Important: **`evidence redact` is reactive, not preventive.** It scrubs the local record but cannot scrub the secret from any externally exfiltrated copy (CI logs, terminal scrollback, etc.). Treat any leak as needing immediate key rotation in addition to redaction.

## Budget as a fail-safe

`DEVAI_LLM_BUDGET_USD` is a defense-in-depth cap for explicitly activated experimental provider-backed work:

```bash
export DEVAI_LLM_BUDGET_USD=2.00
devai experimental loop run --experimental --write
```

This does not authorize mutation by itself: project feature activation plus `--experimental --write` remain mandatory. Per Article 30 (Cost discipline).

## Prompt safety

When the LLM substrate composes a prompt:

1. Task payload is fetched from the task record.
2. Redaction patterns are run against the payload before it joins the prompt stack.
3. The composed stack is recorded as a `PromptComposition` (PC-`<sha16>` id) with per-component hashes.
4. The actual LLM call sends the redacted stack.

This means: even if an attacker plants a secret in a place the LLM might read (e.g., a code comment), the redaction filter scrubs it before the LLM sees it.

Residual risk: a secret embedded in **encoded** form (base64-encoded fragment of a longer string) won't match the patterns. Mitigation: defense in depth — keep secrets in env vars, not in artifacts.

## Authority and access

| Role      | Access to env vars                                                    |
| --------- | --------------------------------------------------------------------- |
| Owner     | Has whatever env vars the operator gave them. Not framework-enforced. |
| Architect | Same.                                                                 |
| Engineer  | Same.                                                                 |
| Inspector | Same.                                                                 |
| Auditor   | Read-only on the repo; should not need secrets.                       |

DEVAI does not implement per-role secret access at the OS level — that's the operator's responsibility (Vault, KMS, GitHub secret store, etc.). DEVAI **does** ensure that secrets ingested into the harness's process never appear in the audit trail.

## Residual risks

1. **Env vars leak via process inspection.** On a multi-tenant host, `ps`, `/proc/<pid>/environ`, or a container with debug access can expose env vars. Mitigation: don't run DEVAI on multi-tenant hosts you don't control.
2. **CI logs.** If a tool prints the env var by accident (a `console.log(process.env)`), it lands in CI logs which are typically less governed than the evidence chain. Mitigation: code review on any logging; the redaction filter applies only to harness-emitted records.
3. **Anthropic / Codex logging the prompt.** The provider's TOS governs how they retain prompts. Mitigation: choose providers that align with your data-handling requirements; use `mock` backend for sensitive content.

## See also

- [`../ops/loop-runbook.md`](../operations/loop-runbook.md) — experimental activation and containment.
- [`forbidden-actions.md`](./forbidden-actions.md) — secrets-related forbidden actions (`cat .env`, etc.).
- [`audit-requirements.md`](./audit-requirements.md) — what gets recorded after redaction.
- Constitution Articles 14 (Security-sensitive change policy), 30 (Cost discipline).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/secret-handling.md (classification CURRENT).
