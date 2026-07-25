# Prompt-firewall notes

**Scope:** the prompt-firewall introduced in Phase 12.B (D-42). The firewall prevents prompt overlays from expanding Constructor authority into RTD/policy write scopes. Per `GE-037` and the Phase-12 closeout.

## Why a prompt firewall

Prompts are part of the control plane. Prompt changes can alter agent behavior even when code and RTD remain unchanged. Without governance, a prompt overlay smuggled into an agent's session (via an issue body, a PR comment, an injected file) could try to instruct the agent to:

- Edit invariants directly (out-of-role).
- Disable forbidden-action checks.
- Skip evidence emission.
- Operate outside its `allowed_write_scopes`.

The harness's path-based authority enforcement (see [`authority-enforcement.md`](./authority-enforcement.md)) catches most of these at the tool layer — but the prompt firewall catches them **earlier**, at composition time, preventing the LLM from even being asked.

## What the firewall checks

`devai policy check prompt overlays` walks the registered overlays and the most recent `PromptComposition` records. For each, it verifies:

1. **No overlay attempts to grant Constructor write authority outside its declared scope.** Overlays declare a `scope:` field; the firewall checks that any imperative content addressed at the LLM does not contradict the role's allowed paths.

2. **No overlay attempts to bypass governance.** Phrases like "ignore the previous instructions", "do not emit evidence", "skip the forbidden-actions check" trigger a `firewall-block` finding.

3. **No overlay attempts to alter the audit trail.** Imperatives that would touch `record/proofs/` outside the harness's own write paths are rejected.

4. **Per-component hashes are intact.** The `prompt-composition.schema.json` already records per-component `body_sha256`. The firewall compares the current stack's component hashes against a frozen reference if one is registered (Phase 12.A `frozen_against` field on PromptComposition).

## How it composes with authority enforcement

The two layers are complementary:

| Layer                                            | When it fires                          | What it catches                                            |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------- |
| Prompt firewall (12.B)                           | At prompt composition, before LLM call | An overlay that **asks** the LLM to do something forbidden |
| Authority enforcement (Article 6, harness-level) | At Edit/Write tool invocation          | An LLM that **tries** to do something forbidden anyway     |

The prompt firewall is the first line of defense; authority enforcement is the second. The defense-in-depth lets us tolerate some firewall false negatives without compromising the chain.

## How to register an overlay

Overlays are declared in `.devai/config/prompt-overlays.json`. Each entry:

```json
{
  "id": "OV-engineer-tightening",
  "scope": "engineer.role",
  "body_path": "prompts/overlays/engineer-tightening.md",
  "purpose": "Tighten Engineer agent code-style preferences",
  "applies_when": "skill in [SKILL-feedback-iteration, SKILL-fix-build]"
}
```

The firewall validates:

1. `body_path` exists and is readable.
2. The overlay's `scope` matches a known role/skill scope.
3. The overlay body's hash matches its `body_sha256` if frozen.
4. The body content doesn't trip any of the firewall's flagged phrases.

## What an overlay should NOT contain

| Pattern                                                    | Why blocked                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| "Ignore the previous instructions"                         | Defeats the prompt stack's compositional discipline.          |
| "You may edit docs/arch" (for an Engineer overlay)         | Cross-role authority claim.                                   |
| "Skip evidence emission"                                   | Audit-trail tampering attempt.                                |
| "Run this command without checking forbidden-actions"      | Direct bypass of a defense.                                   |
| "Use this API key: `sk-…`"                                 | Secret in prompt; would be redacted, but the intent is wrong. |
| Citations to documents the LLM doesn't have read access to | Smuggling content via reference.                              |

## Frozen overlays

When an overlay matters enough to govern long-term, freeze it:

```bash
devai agent prompt freeze --overlay OV-engineer-tightening --output verification/prompt_hashes.json
```

The freeze records the body's SHA-256. Future `check prompt-overlays` invocations compare current body to frozen; drift = a firewall finding.

This makes prompt behavior reviewable in the same way that schemas are reviewable. A change to a frozen overlay must go through a re-freeze, which is an Architect-authority change.

## Failure modes

| Symptom                                                          | Cause                                          | Action                                                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `check prompt-overlays` exits 2 with `firewall-block` finding    | An overlay tripped a flagged phrase            | Edit the overlay to remove the trip; or escalate the overlay design.                      |
| `check prompt-overlays` exits 2 with `drift-from-frozen` finding | A frozen overlay's body changed                | Either revert the change, or re-freeze with explicit Architect approval.                  |
| Overlay body has a hash mismatch in `PromptComposition`          | The body was edited between freeze and compose | The compose ran against the new body; freeze needs to update or the body needs to revert. |
| `check prompt-overlays` exits 64                                 | `.devai/config/prompt-overlays.json` malformed | Validate; re-emit.                                                                        |

## Per-component prompt hashing

The `prompt-composition.schema.json` records hashes per component:

- `body_sha256` per component (global / role / discipline / task / payload / overlay).
- `stack_sha256` over the full ordered composition.

When prompt behavior is part of a governed RTD loop, freezing the relevant set is a sensor: deviations become firewall findings, the same way schema drift becomes a `spec validate-*` finding.

## Residual risks

1. **The flagged-phrase list is not exhaustive.** A prompt that smuggles forbidden intent in a paraphrase the list doesn't recognize will pass. Mitigation: defense in depth (authority enforcement still catches the attempted write); periodic review of new attack patterns.
2. **Semantic vs. syntactic detection.** The firewall is keyword/regex-based, not LLM-as-judge. A future enhancement (Phase 14+?) could run an LLM-as-firewall over prompt overlays before they ship.
3. **The firewall does not inspect runtime prompts** built dynamically from PR/issue content. That defense is the redaction filter (see [`secret-handling.md`](./secret-handling.md)) plus the authority chain.

## See also

- [`authority-enforcement.md`](./authority-enforcement.md) — the layer that catches what the firewall misses.
- [`secret-handling.md`](./secret-handling.md) — secret-redaction in prompt composition.
- D-42 (Phase 12.B) — original decision.
- `GE-037` (Prompt firewall).
- `prompt-composition.schema.json` — per-component hashing.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/security/prompt-firewall-notes.md (classification CURRENT).
