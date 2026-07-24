# Operations specifications

**Authority:** Architect (Constitution Article 6).

This directory holds operational specifications for **DEVAI applying to itself**: runbooks, SLOs, capacity notes, and an incident playbook. Per Article 36 (DEVAI must apply to itself from Phase 0), these are not "future client" docs; they govern how this repository is operated as a plant.

## Index

| Doc | What it covers |
|---|---|
| [`evidence-chain-runbook.md`](./evidence-chain-runbook.md) | Verifying, redacting, and recovering the hash-chained evidence log under `record/proofs/chain.json`. Per Articles 32–33. |
| [`local-evidence-runbook.md`](./local-evidence-runbook.md) | Collecting and verifying local-CI-evidence manifests so a direct main push may skip heavy remote CI tiers. Per ADR-CI-ECONOMY Decisions 1–3, D-117. |
| [`versioning-policy.md`](./versioning-policy.md) | The `@devai-nyx/*` release contract: minor=additive/major=migration, the constitution-version CHANGELOG rule, consumption-model declaration, and "which devai am I running." Per D-118, D-122. |
| [`lock-runbook.md`](./lock-runbook.md) | TTL-based file locks under `record/proofs/locks/`; the Postgres advisory-lock backend (Phase 9.G); reaping stale locks. |
| [`worktree-runbook.md`](./worktree-runbook.md) | Git worktree lifecycle: create / list / destroy / reap, the runtime policy cap (`WORKTREE_CAP`), and the `escalated/<task-id>` rename pattern. |
| [`loop-runbook.md`](./loop-runbook.md) | Starting, monitoring, and safely stopping `devai experimental loop run`; LLM budget caps, iteration limits, model-tier bumps. |
| [`slos.md`](./slos.md) | DEVAI's own development SLOs: what the scorecard considers green, CI deadlines, hard-fail blocking. |
| [`incident-playbook.md`](./incident-playbook.md) | Top diagnostics for the most common "gate is failing" scenarios with concrete next-action commands. |
| [`capacity.md`](./capacity.md) | Limits: worktree cap, Postgres connection pool, LLM budget, evidence chain growth, RTD manifest size. |
| [`release-discipline.md`](./release-discipline.md) | Why `release gate`, `release postdeploy-verify`, and `release runtime-drift` record verdicts but do not probe. Records-vs-detectors split. |
| [`db-isolation.md`](./db-isolation.md) | One Postgres per worktree via `CREATE DATABASE … TEMPLATE devai_template`; cluster-isolation as opt-in. Per D-15. |
| [`testing.md`](./testing.md) | Full-production DB/LLM integration defaults, with explicit hermetic opt-outs. Per D-105. |
| [`structural-sensor-exemptions.md`](./structural-sensor-exemptions.md) | The five current repository-specific N/A cells, with exact framework-shape rationales and the boundary between N/A, UNKNOWN, and defects. |
| [`current-scorecard.md`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/meta/ops/current-scorecard.md) | Historical 2026-05-29 scorecard snapshot. It is stale forensic evidence, not a current readiness claim. |
| [`current-test-matrix.md`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/meta/ops/current-test-matrix.md) | Historical 2026-05-29 local test/validation matrix. It is retained for diagnosis, not current gate status. |

## How to read

Each runbook is self-contained. Open the doc whose title matches the symptom; each ends with a "see also" pointer to related runbooks.

If the symptom is unclear, start with [`incident-playbook.md`](./incident-playbook.md) — it maps "what you see" to "which runbook to open."

## How to extend

Operations specs are Architect authority. Adding a new runbook:

1. Pick a stable filename: `<surface>-runbook.md` (or `<topic>.md` for non-runbook docs).
2. Open with a one-paragraph summary of when this runbook applies.
3. List the commands the reader will run, in order.
4. Cover the failure modes for each command + their next actions.
5. Cite Constitution articles and Glossary terms (`GE-NNN`) where relevant.
6. Add a row to this README's index.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/README.md (classification CURRENT).
