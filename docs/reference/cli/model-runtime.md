---
title: Model and runtime roster
---

# Model and runtime roster

This generated roster reports selection eligibility, not host reachability or governance
authority. Every attempted execution still requires the declared adapter/provider preflight,
an authorized selection mode, and exact runtime/model/effort compatibility. Edit the registry
or renderer, never the bytes between markers.

<!-- devai:generated-reference:start category="runtimes" -->

## Runtimes

<!-- devai:generated-entry category="runtimes" id="anthropic-api" -->

### `anthropic-api` — Anthropic Provider Api runtime

- **Stable ID:** anthropic-api
- **User-facing label:** Anthropic Provider Api runtime
- **Purpose:** Connect a governed agent request through the rostered `anthropic-sdk-adapter` adapter.
- **Population or projection:** Vendor `Anthropic`; family `claude`; transport `provider-api`; adapter `anthropic-sdk-adapter` at `packages/skills/src/llm/anthropic-client.ts`; capabilities `text-generation`, `structured-output-best-effort`.
- **Prerequisites:** rostered adapter; credential and provider reachability are mandatory runtime preflights; host preflight is mandatory.
- **Required external tools:** `ANTHROPIC_API_KEY` and provider reachability.
- **Accepted inputs:** A task agent executor selecting a rostered model whose `runtime_id` is `anthropic-api` and one supported effort.
- **Defaults:** No adapter, credential, provider alias, or fallback is inferred.
- **Output contract:** Resolved runtime/model/effort, adapter/tool versions, selection decision, prompt and I/O digests, usage/cost, timestamps, verdict, and evidence references.
- **Verdict semantics:** Unavailable adapter, missing credential/login, unreachable provider, identity mismatch, or unsupported capability blocks before invocation.
- **Declared effect:** Not applicable: runtime capability and transport grant no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from runtime availability.
- **Cost class:** `external-dependent`
- **When to use:** Use only through a rostered model entry whose runtime is `anthropic-api`.
- **When not to use:** Do not treat registry availability as proof of host reachability or as governance authority.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/runtimes)
- **Related workflow:** `round`

<!-- devai:generated-entry category="runtimes" id="claude-cli" -->

### `claude-cli` — Anthropic Host Cli runtime

- **Stable ID:** claude-cli
- **User-facing label:** Anthropic Host Cli runtime
- **Purpose:** Connect a governed agent request through the rostered `claude-cli-adapter` adapter.
- **Population or projection:** Vendor `Anthropic`; family `claude`; transport `host-cli`; adapter `claude-cli-adapter` at `packages/skills/src/llm/cli-client.ts`; capabilities `text-generation`, `structured-output-best-effort`.
- **Prerequisites:** rostered adapter; executable, login, and reported model identity are mandatory runtime preflights; host preflight is mandatory.
- **Required external tools:** `claude` plus `host-cli-session`.
- **Accepted inputs:** A task agent executor selecting a rostered model whose `runtime_id` is `claude-cli` and one supported effort.
- **Defaults:** No adapter, credential, provider alias, or fallback is inferred.
- **Output contract:** Resolved runtime/model/effort, adapter/tool versions, selection decision, prompt and I/O digests, usage/cost, timestamps, verdict, and evidence references.
- **Verdict semantics:** Unavailable adapter, missing credential/login, unreachable provider, identity mismatch, or unsupported capability blocks before invocation.
- **Declared effect:** Not applicable: runtime capability and transport grant no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from runtime availability.
- **Cost class:** `external-dependent`
- **When to use:** Use only through a rostered model entry whose runtime is `claude-cli`.
- **When not to use:** Do not treat registry availability as proof of host reachability or as governance authority.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/runtimes)
- **Related workflow:** `round`

<!-- devai:generated-entry category="runtimes" id="codex-cli" -->

### `codex-cli` — OpenAI Host Cli runtime

- **Stable ID:** codex-cli
- **User-facing label:** OpenAI Host Cli runtime
- **Purpose:** Connect a governed agent request through the rostered `codex-cli-adapter` adapter.
- **Population or projection:** Vendor `OpenAI`; family `codex`; transport `host-cli`; adapter `codex-cli-adapter` at `packages/skills/src/llm/cli-client.ts`; capabilities `text-generation`, `structured-output`.
- **Prerequisites:** rostered adapter; executable, login, and reported model identity are mandatory runtime preflights; host preflight is mandatory.
- **Required external tools:** `codex` plus `host-cli-session`.
- **Accepted inputs:** A task agent executor selecting a rostered model whose `runtime_id` is `codex-cli` and one supported effort.
- **Defaults:** No adapter, credential, provider alias, or fallback is inferred.
- **Output contract:** Resolved runtime/model/effort, adapter/tool versions, selection decision, prompt and I/O digests, usage/cost, timestamps, verdict, and evidence references.
- **Verdict semantics:** Unavailable adapter, missing credential/login, unreachable provider, identity mismatch, or unsupported capability blocks before invocation.
- **Declared effect:** Not applicable: runtime capability and transport grant no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from runtime availability.
- **Cost class:** `external-dependent`
- **When to use:** Use only through a rostered model entry whose runtime is `codex-cli`.
- **When not to use:** Do not treat registry availability as proof of host reachability or as governance authority.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/runtimes)
- **Related workflow:** `round`

<!-- devai:generated-entry category="runtimes" id="openai-api" -->

### `openai-api` — OpenAI Provider Api runtime

- **Stable ID:** openai-api
- **User-facing label:** OpenAI Provider Api runtime
- **Purpose:** Connect a governed agent request through the rostered `openai-sdk-adapter` adapter.
- **Population or projection:** Vendor `OpenAI`; family `codex`; transport `provider-api`; adapter `openai-sdk-adapter` at `packages/skills/src/llm/codex-client.ts`; capabilities `text-generation`, `structured-output`.
- **Prerequisites:** rostered adapter; credential and provider reachability are mandatory runtime preflights; host preflight is mandatory.
- **Required external tools:** `OPENAI_API_KEY` and provider reachability.
- **Accepted inputs:** A task agent executor selecting a rostered model whose `runtime_id` is `openai-api` and one supported effort.
- **Defaults:** No adapter, credential, provider alias, or fallback is inferred.
- **Output contract:** Resolved runtime/model/effort, adapter/tool versions, selection decision, prompt and I/O digests, usage/cost, timestamps, verdict, and evidence references.
- **Verdict semantics:** Unavailable adapter, missing credential/login, unreachable provider, identity mismatch, or unsupported capability blocks before invocation.
- **Declared effect:** Not applicable: runtime capability and transport grant no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from runtime availability.
- **Cost class:** `external-dependent`
- **When to use:** Use only through a rostered model entry whose runtime is `openai-api`.
- **When not to use:** Do not treat registry availability as proof of host reachability or as governance authority.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/runtimes)
- **Related workflow:** `round`

<!-- devai:generated-reference:end category="runtimes" -->

<!-- devai:generated-reference:start category="rostered-models" -->

## Rostered models

<!-- devai:generated-entry category="rostered-models" id="anthropic-api:claude-3-5-sonnet-latest" -->

### `anthropic-api:claude-3-5-sonnet-latest` — Anthropic claude-3-5-sonnet-latest

- **Stable ID:** anthropic-api:claude-3-5-sonnet-latest
- **User-facing label:** Anthropic claude-3-5-sonnet-latest
- **Purpose:** Select the exact rostered `claude-3-5-sonnet-latest` model through `anthropic-api`.
- **Population or projection:** Runtime `anthropic-api`; vendor/family `Anthropic`/`claude`; adapter `anthropic-sdk-adapter`; identifier kind `exact`; efforts `default`; capabilities `text-generation`, `structured-output-best-effort`; eligible classes `coding-agent`, `review-agent`, `ops-agent`; available `true`; replacement `none`.
- **Prerequisites:** exact current adapter default; provider acceptance is rechecked before invocation; runtime adapter and provider/host preflight remain mandatory.
- **Required external tools:** The `anthropic-api` runtime adapter and its declared credential or host session.
- **Accepted inputs:** An `exact`, explicit `preferred`, or named-versioned `policy` selection that includes `anthropic-api:claude-3-5-sonnet-latest`, one of `default`, and supported capabilities.
- **Defaults:** No implicit latest version, alias, effort, or fallback.
- **Output contract:** The immutable request digest and a separate resolved executor record with exact runtime/model/effort and selection/fallback evidence.
- **Verdict semantics:** Unavailable, unrostered, unsupported-effort, capability, adapter, or exact-identity mismatch blocks before invocation.
- **Declared effect:** Not applicable: model capability grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from model selection.
- **Cost class:** `external-dependent`
- **When to use:** Use only when `anthropic-api:claude-3-5-sonnet-latest` and the chosen effort are explicitly rostered and selection-eligible.
- **When not to use:** Do not infer reachability, authority, a newer model, or fallback from this entry.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models)
- **Related workflow:** `round`

<!-- devai:generated-entry category="rostered-models" id="claude-cli:claude-opus-5" -->

### `claude-cli:claude-opus-5` — Anthropic claude-opus-5

- **Stable ID:** claude-cli:claude-opus-5
- **User-facing label:** Anthropic claude-opus-5
- **Purpose:** Select the exact rostered `claude-opus-5` model through `claude-cli`.
- **Population or projection:** Runtime `claude-cli`; vendor/family `Anthropic`/`claude`; adapter `claude-cli-adapter`; identifier kind `exact`; efforts `default`; capabilities `text-generation`, `structured-output-best-effort`, `repository-context`; eligible classes `coding-agent`, `review-agent`, `ops-agent`; available `true`; replacement `none`.
- **Prerequisites:** Owner-bound exact R-0007 selector; host identity and availability remain mandatory preflights; runtime adapter and provider/host preflight remain mandatory.
- **Required external tools:** The `claude-cli` runtime adapter and its declared credential or host session.
- **Accepted inputs:** An `exact`, explicit `preferred`, or named-versioned `policy` selection that includes `claude-cli:claude-opus-5`, one of `default`, and supported capabilities.
- **Defaults:** No implicit latest version, alias, effort, or fallback.
- **Output contract:** The immutable request digest and a separate resolved executor record with exact runtime/model/effort and selection/fallback evidence.
- **Verdict semantics:** Unavailable, unrostered, unsupported-effort, capability, adapter, or exact-identity mismatch blocks before invocation.
- **Declared effect:** Not applicable: model capability grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from model selection.
- **Cost class:** `external-dependent`
- **When to use:** Use only when `claude-cli:claude-opus-5` and the chosen effort are explicitly rostered and selection-eligible.
- **When not to use:** Do not infer reachability, authority, a newer model, or fallback from this entry.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models)
- **Related workflow:** `round`

<!-- devai:generated-entry category="rostered-models" id="claude-cli:claude-sonnet-4-6" -->

### `claude-cli:claude-sonnet-4-6` — Anthropic claude-sonnet-4-6

- **Stable ID:** claude-cli:claude-sonnet-4-6
- **User-facing label:** Anthropic claude-sonnet-4-6
- **Purpose:** Select the exact rostered `claude-sonnet-4-6` model through `claude-cli`.
- **Population or projection:** Runtime `claude-cli`; vendor/family `Anthropic`/`claude`; adapter `claude-cli-adapter`; identifier kind `exact`; efforts `default`; capabilities `text-generation`, `structured-output-best-effort`, `repository-context`; eligible classes `coding-agent`, `review-agent`, `ops-agent`; available `true`; replacement `none`.
- **Prerequisites:** exact current CLI-adapter default; host identity is rechecked before invocation; runtime adapter and provider/host preflight remain mandatory.
- **Required external tools:** The `claude-cli` runtime adapter and its declared credential or host session.
- **Accepted inputs:** An `exact`, explicit `preferred`, or named-versioned `policy` selection that includes `claude-cli:claude-sonnet-4-6`, one of `default`, and supported capabilities.
- **Defaults:** No implicit latest version, alias, effort, or fallback.
- **Output contract:** The immutable request digest and a separate resolved executor record with exact runtime/model/effort and selection/fallback evidence.
- **Verdict semantics:** Unavailable, unrostered, unsupported-effort, capability, adapter, or exact-identity mismatch blocks before invocation.
- **Declared effect:** Not applicable: model capability grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from model selection.
- **Cost class:** `external-dependent`
- **When to use:** Use only when `claude-cli:claude-sonnet-4-6` and the chosen effort are explicitly rostered and selection-eligible.
- **When not to use:** Do not infer reachability, authority, a newer model, or fallback from this entry.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models)
- **Related workflow:** `round`

<!-- devai:generated-entry category="rostered-models" id="codex-cli:gpt-5.6-sol" -->

### `codex-cli:gpt-5.6-sol` — OpenAI gpt-5.6-sol

- **Stable ID:** codex-cli:gpt-5.6-sol
- **User-facing label:** OpenAI gpt-5.6-sol
- **Purpose:** Select the exact rostered `gpt-5.6-sol` model through `codex-cli`.
- **Population or projection:** Runtime `codex-cli`; vendor/family `OpenAI`/`codex`; adapter `codex-cli-adapter`; identifier kind `exact`; efforts `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; capabilities `text-generation`, `structured-output`, `repository-context`; eligible classes `coding-agent`, `review-agent`, `ops-agent`; available `true`; replacement `none`.
- **Prerequisites:** exact model used by the committed R-0007 role prompts; host identity is rechecked before invocation; runtime adapter and provider/host preflight remain mandatory.
- **Required external tools:** The `codex-cli` runtime adapter and its declared credential or host session.
- **Accepted inputs:** An `exact`, explicit `preferred`, or named-versioned `policy` selection that includes `codex-cli:gpt-5.6-sol`, one of `low`, `medium`, `high`, `xhigh`, `max`, `ultra`, and supported capabilities.
- **Defaults:** No implicit latest version, alias, effort, or fallback.
- **Output contract:** The immutable request digest and a separate resolved executor record with exact runtime/model/effort and selection/fallback evidence.
- **Verdict semantics:** Unavailable, unrostered, unsupported-effort, capability, adapter, or exact-identity mismatch blocks before invocation.
- **Declared effect:** Not applicable: model capability grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from model selection.
- **Cost class:** `external-dependent`
- **When to use:** Use only when `codex-cli:gpt-5.6-sol` and the chosen effort are explicitly rostered and selection-eligible.
- **When not to use:** Do not infer reachability, authority, a newer model, or fallback from this entry.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models)
- **Related workflow:** `round`

<!-- devai:generated-entry category="rostered-models" id="openai-api:gpt-4o-latest" -->

### `openai-api:gpt-4o-latest` — OpenAI gpt-4o-latest

- **Stable ID:** openai-api:gpt-4o-latest
- **User-facing label:** OpenAI gpt-4o-latest
- **Purpose:** Select the exact rostered `gpt-4o-latest` model through `openai-api`.
- **Population or projection:** Runtime `openai-api`; vendor/family `OpenAI`/`codex`; adapter `openai-sdk-adapter`; identifier kind `exact`; efforts `default`; capabilities `text-generation`, `structured-output`; eligible classes `coding-agent`, `review-agent`, `ops-agent`; available `true`; replacement `none`.
- **Prerequisites:** exact current adapter default; provider acceptance is rechecked before invocation; runtime adapter and provider/host preflight remain mandatory.
- **Required external tools:** The `openai-api` runtime adapter and its declared credential or host session.
- **Accepted inputs:** An `exact`, explicit `preferred`, or named-versioned `policy` selection that includes `openai-api:gpt-4o-latest`, one of `default`, and supported capabilities.
- **Defaults:** No implicit latest version, alias, effort, or fallback.
- **Output contract:** The immutable request digest and a separate resolved executor record with exact runtime/model/effort and selection/fallback evidence.
- **Verdict semantics:** Unavailable, unrostered, unsupported-effort, capability, adapter, or exact-identity mismatch blocks before invocation.
- **Declared effect:** Not applicable: model capability grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from model selection.
- **Cost class:** `external-dependent`
- **When to use:** Use only when `openai-api:gpt-4o-latest` and the chosen effort are explicitly rostered and selection-eligible.
- **When not to use:** Do not infer reachability, authority, a newer model, or fallback from this entry.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models)
- **Related workflow:** `round`

<!-- devai:generated-reference:end category="rostered-models" -->

<!-- devai:generated-reference:start category="supported-efforts" -->

## Supported efforts

<!-- devai:generated-entry category="supported-efforts" id="default" -->

### `default` — Default

- **Stable ID:** default
- **User-facing label:** Default
- **Purpose:** Request the exact rostered `default` effort without inventing provider semantics.
- **Population or projection:** Supported by `anthropic-api:claude-3-5-sonnet-latest`, `claude-cli:claude-opus-5`, `claude-cli:claude-sonnet-4-6`, `openai-api:gpt-4o-latest`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `default` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `default` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="high" -->

### `high` — High

- **Stable ID:** high
- **User-facing label:** High
- **Purpose:** Request the exact rostered `high` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `high` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `high` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="low" -->

### `low` — Low

- **Stable ID:** low
- **User-facing label:** Low
- **Purpose:** Request the exact rostered `low` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `low` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `low` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="max" -->

### `max` — Max

- **Stable ID:** max
- **User-facing label:** Max
- **Purpose:** Request the exact rostered `max` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `max` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `max` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="medium" -->

### `medium` — Medium

- **Stable ID:** medium
- **User-facing label:** Medium
- **Purpose:** Request the exact rostered `medium` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `medium` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `medium` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="ultra" -->

### `ultra` — Ultra

- **Stable ID:** ultra
- **User-facing label:** Ultra
- **Purpose:** Request the exact rostered `ultra` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `ultra` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `ultra` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-entry category="supported-efforts" id="xhigh" -->

### `xhigh` — Xhigh

- **Stable ID:** xhigh
- **User-facing label:** Xhigh
- **Purpose:** Request the exact rostered `xhigh` effort without inventing provider semantics.
- **Population or projection:** Supported by `codex-cli:gpt-5.6-sol`.
- **Prerequisites:** One rostered model entry that explicitly lists this effort and a successful runtime preflight.
- **Required external tools:** The selected model runtime adapter and provider or host session.
- **Accepted inputs:** An agent executor selecting `xhigh` with one of the listed rostered models.
- **Defaults:** No effort is inferred across models; task selection must satisfy the chosen model entry.
- **Output contract:** Requested effort remains in the immutable executor digest and resolved effort appears in task-execution evidence.
- **Verdict semantics:** An effort/model mismatch blocks before invocation and never falls back implicitly.
- **Declared effect:** Not applicable: effort selection grants no action effect or governance authority.
- **Consent flags:** Not applicable: consent is resolved from the task work and its action effects, not from effort selection.
- **Cost class:** `external-dependent`
- **When to use:** Use `xhigh` only with a model listed in this generated projection.
- **When not to use:** Do not assume every runtime or model supports this effort.
- **Non-pass semantics:** `fail` is a negative finding; `error` is an execution or producer defect; `unknown` never passes; `review` requires human disposition; `skipped` reports an unexecuted member; `N/A` is valid only when the governing contract explicitly permits it.
- **New-grammar example:** `devai doctor --probe llm --repo-root .`
- **Canonical source:** [`law/policy/model-runtime-registry.json`](../../../law/policy/model-runtime-registry.json#/models/*/supported_efforts)
- **Related workflow:** `round`

<!-- devai:generated-reference:end category="supported-efforts" -->
