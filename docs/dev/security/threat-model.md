# Threat model

**Scope:** DEVAI as a governance harness operating on (and inside) software repositories. The question this doc answers: *who would attack a system like DEVAI, and what would they try to do?*

## Adversary classes

| Class | Capability | Motivation |
|---|---|---|
| Malicious agent | A misconfigured or compromised LLM-backed agent with write authority over its allowed scope | Insert backdoors, exfiltrate secrets, weaken tests to hide breakage |
| Insider with excess authority | A human contributor in the wrong role attempting an out-of-scope edit (Owner editing code, Engineer editing invariants, etc.) | Bypass review, ship a non-compliant change |
| Supply-chain attacker | Compromised dependency injected through `package.json` | Run arbitrary code at install / build time |
| Prompt-injection attacker | Crafts content that ends up in the LLM's prompt stack (e.g., an issue title, a PR body, a code comment) | Steer the agent into running forbidden actions, leaking secrets, or rewriting governance content |
| Replay attacker | Anyone with read access to the evidence chain | Replay a `release gate` verdict from an older state to claim a current artifact is approved |
| Audit-trail tamperer | Anyone with write access to `record/proofs/chain.json` | Hide evidence of a past action; alter compliance history |

## Assets

What the system protects:

| Asset | Why it's valuable |
|---|---|
| The invariant catalog (F1) | The reference signal. Any silent rewrite causes the harness to gate the wrong thing. |
| The evidence chain (F5) | The audit trail. Any tampering invalidates compliance claims. |
| Production credentials / API keys | Standard secret value. |
| Production data | Standard data-protection value. |
| The schemas (`law/schemas/`) | If schemas are weakened, all artifacts validated against them become weakened. |
| The forbidden-actions registry | If reduced, the harness loses runtime safety nets. |
| The skill manifests | If `allowed_write_scopes` are widened, agents gain unintended authority. |

## Defenses (mapped to mechanism)

| Defense | Mechanism | Article / Phase |
|---|---|---|
| Five-role authority chain | Fail-closed role, policy, resource, plan, and final-adapter enforcement inside DEVAI CLI/runtime | Articles 6–10, D-135, [`authority-enforcement.md`](./authority-enforcement.md) |
| Tests are sensors, not malleable | Test-weakening detection | Article 39, Phase 4 |
| Spec drift is reviewable, not silent | RGR escalation path | Article 19, [`GE-018`](../../../law/glossary/GE-018.json) |
| Tamper-evident audit | Hash-chained evidence | Articles 32–33, [`audit-requirements.md`](./audit-requirements.md) |
| Runtime command safety | Forbidden actions registry | Phase 10.H, [`forbidden-actions.md`](./forbidden-actions.md) |
| Override audit trail | `inv-override` annotation with expires/approver | Phase 10.B, [`inv-override-discipline.md`](./inv-override-discipline.md) |
| Prompt-overlay containment | Prompt-firewall (D-42) | Phase 12.B, [`prompt-firewall-notes.md`](./prompt-firewall-notes.md) |
| Agent-run provenance | UUIDv7 + hash chain on agent-runs | Phase 10.I |
| Cost-bound LLM substrate | `DEVAI_LLM_BUDGET_USD`, rate limit | Article 30, Phase 9.B |
| Authority-tagged actions | `authority` enum on every CLI action | Phase 11.G |
| RTD bundle as signed reference | `manifest_hash` on `RTM-NNNN` | Phase 12.A / D-41 |

## Adversary × asset matrix (high-level)

| Adversary | Invariants (F1) | Evidence (F5) | Secrets | Schemas |
|---|---|---|---|---|
| Malicious agent | DEVAI verbs refuse cross-role targets; unrestricted host tools remain outside `cli-only` | DEVAI state verbs are governed; out-of-band writes remain detectable rather than prevented | Redaction patterns + typed boundaries | DEVAI verbs require Architect policy; host tools require an adapter |
| Insider wrong-role | Explicit DEVAI declaration and path refusal + PR review | Same boundary distinction | PR review | Architect declaration inside DEVAI; host review outside it |
| Supply-chain | Could run arbitrary code at install; **NOT mitigated** by DEVAI itself (out of scope) | Could write the chain at install time; **partial mitigation** via chain verification | Could read; **NOT mitigated** | Could rewrite; PR review on `package.json` is the residual mitigation |
| Prompt-injection | If overlay smuggles spec-rewrite intent: blocked by prompt-firewall + authority chain | Cannot persuade the LLM to write the chain directly; chain writes are tool-mediated | The LLM never sees raw secrets (env-var-only); residual risk via the overlay smuggling instructions to log a secret to a file | Blocked by authority |
| Replay | N/A | The chain is append-only; replay = inspection, not tampering | N/A | N/A |
| Audit-trail tamperer | N/A | `evidence verify` detects; the corrupt file is preserved per Article 32 | N/A | N/A |

## Residual risks (explicit)

These risks are **not** fully mitigated:

1. **Supply chain.** DEVAI itself depends on npm packages. A compromised dep can run arbitrary code at install/build, which is outside DEVAI's threat model. Mitigation guidance: pin lockfile, audit `pnpm-lock.yaml` diffs, use `pnpm audit` regularly.
2. **Prompt injection via PR bodies and issue titles.** If the loop ingests an attacker-crafted PR body as context, the prompt firewall can prevent authority escalation but cannot prevent the LLM from doing wasteful or low-quality work within its allowed scope. Mitigation: human review on every PR before merge; never auto-merge.
3. **Out-of-band filesystem writes.** In `cli-only`, anyone with shell/editor access can bypass DEVAI's preventive boundary and tamper with repository files directly. `evidence verify` detects some state tampering but cannot prevent it. Mitigation: a declared verified host adapter, standard repo access controls, and branch protection.
4. **Experimental-loop cost griefing.** A malicious input could attempt to drive an explicitly activated experiment to spend the LLM budget. Mitigation: triple activation (`feature_flags.autonomous_loop`, `--experimental`, `--write`), bounded retries, provider-test opt-in, budget caps, and preserved human-review termination. None of these results promote supported readiness.
5. **Time-of-check / time-of-use.** Between `release gate` returning `pass` and the deploy actually happening, the artifact could be modified. Mitigation: `release postdeploy-verify` compares observed audit-chain head against the artifact's claimed head — see Phase 11.B.
6. **Untyped subprocesses.** A generic shell can have effects that cannot be represented by the filesystem/Git/database/remote planners. DEVAI refuses these with `AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED`; it does not reinterpret the process as read-only or widen path policy.

## What we do **not** model

- Network-layer attacks against an agent's LLM-API call (TLS handles this).
- Physical access to a CI runner.
- Anthropic / Codex side compromise.
- Bugs in `git` itself.

If you need to defend against any of these, layer additional controls outside DEVAI.

## See also

- [`authority-enforcement.md`](./authority-enforcement.md)
- [`audit-requirements.md`](./audit-requirements.md)
- [`prompt-firewall-notes.md`](./prompt-firewall-notes.md)
- Constitution Articles 6 (Authority), 14 (Security-sensitive change policy), 19 (Escalation), 32–33 (Evidence), 39 (Tests as sensors), 40 (Amendment process).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/threat-model.md (classification CURRENT).
