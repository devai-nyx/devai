# Security specifications

**Authority:** Architect (Constitution Article 6).

This directory holds DEVAI's own threat model + authority enforcement specs + audit requirements + secret handling + governance discipline. Per Article 36 (DEVAI must apply to itself), these are not "future client" placeholders; they describe how this repository defends itself.

## Index

| Doc                                                          | What it covers                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`threat-model.md`](./threat-model.md)                       | Who attacks a governance harness, with what, for what goal. The five-role authority chain as primary defense.                                           |
| [`authority-enforcement.md`](./authority-enforcement.md)     | How filesystem-path-based authority is enforced at the tool layer (CLAUDE.md + harness refusal). Session-boundary discipline.                           |
| [`audit-requirements.md`](./audit-requirements.md)           | Articles 32–33 evidence-chain semantics; agent-run hash chaining (10.I); tamper-detection via `evidence verify`.                                        |
| [`secret-handling.md`](./secret-handling.md)                 | LLM API keys, redaction patterns, `DEVAI_LLM_BUDGET_USD` as fail-safe, never-inline-in-source.                                                          |
| [`forbidden-actions.md`](./forbidden-actions.md)             | The 16-entry registry (Phase 10.H), how to add entries, the runtime + CI gate.                                                                          |
| [`inv-override-discipline.md`](./inv-override-discipline.md) | Audit trail for non-constitutional invariant overrides (Phase 10.B); annotation form, expiry, approver.                                                 |
| [`prompt-firewall-notes.md`](./prompt-firewall-notes.md)     | Why prompt overlays can't expand Constructor authority into RTD/policy write scopes (Phase 12.B / D-42). Per-component `body_sha256` as drift detector. |

The transversal property **T6 — Security and Privacy** scores across all substrates against these specs.

## How to read

Open the doc that matches your concern. For broad orientation, start with [`threat-model.md`](./threat-model.md) and [`authority-enforcement.md`](./authority-enforcement.md) — they define the model the other specs operationalize.

## How to extend

Security specs are Architect authority and benefit from a higher review bar than ops specs. Adding a new spec:

1. Open with the threat or surface it addresses.
2. State the existing defenses (cite the harness mechanism + the Constitution article).
3. State the **residual risk** explicitly — security is rarely perfect; document what remains.
4. Link to operational follow-ups in `docs/dev/operations/`.
5. Add a row to this README's index.

## Reporting vulnerabilities

See `SECURITY.md` at the repo root (placeholder; to be expanded once distribution context exists).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/README.md (classification CURRENT).
