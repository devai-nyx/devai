# Adoption profiles

DEVAI adoption is tiered (D-112; governance-roadmap item 5). Before profiles, adoption was all-or-nothing: constitution, five roles, invariants, trace, and the 45-cell scorecard all stood between a new repo and its first green gate. A profile declares how much of the framework a repo currently runs, so the on-ramp can be one afternoon instead of one architecture review — without forking the framework into editions.

Declare the profile in `.devai/config/project.json`:

```json
{
  "schemaVersion": "1.0.0",
  "project_type": "runtime-host",
  "profile": "tier1"
}
```

Pass `--profile tier1` to each applicable `devai init apply-*` bootstrap segment. **Absent means `tier3`** for backward-compatible supported governance checks. A profile never activates experimental autonomous execution.

## The three tiers

| | tier1 — gates + evidence | tier2 — reference signal | tier3 — supervised control |
|---|---|---|---|
| Pitch | "CI you cannot lie to, in an afternoon" | Specs become setpoints | Humans drive through the complete control harness |
| Hard gates (type-check, lint, build, test) | binding | binding | binding |
| Evidence chain, authority-by-path | binding | binding | binding |
| Invariants, trace, spec validation | — | binding | binding |
| Test-weakening checks, deterministic sensors | — | binding | binding |
| Scorecard | not expected | computed, **advisory** | **gates merges** |
| Soft gate (LLM-judged), triage, coupled triplets, supervised backlog/worktree flow | — | — | binding |

## What a profile changes mechanically

A profile is a **floor declaration, not a cage**. Nothing is disabled; obligations above the declared floor become advisory:

- **`devai doctor`** reports the declared profile, and checks that only matter above your tier (`llm-bridges`, `docs-governance`) are reported as `advisory: true` instead of failing the run.
- **`devai govern score compute`** still computes the full scorecard at tier1/tier2, but exits PASS regardless of cell verdicts (the JSON body is unchanged; only gating is suspended). At tier3 a failing cell fails the command, as always.
- **Everything else runs identically.** You can run `devai sense lint` or `devai spec validate all` at tier1 — the profile never blocks a tool, it only changes what blocks *you*.

Two boundaries to respect:

- A tier1/tier2 repo **must not claim Article 36-style full self-application** — the scorecard isn't gating, so "all gates green" means the *declared* gates.
- The constitution still binds at every tier. Profiles tier obligations, not axioms (Article 18's threshold-override clause is the constitutional basis for advisory scoring).

## Walking up a tier

`devai adopt upgrade --profile <target>` emits the checklist between your declared profile and the target — the artifacts to author, the sensors that flip from advisory to binding, and the docs to read — as a plan, not an execution. Work the list, then update `profile` in `project.json`; `devai doctor` confirms the new floor holds.

Recommended path: adopt at **tier1**, run one real human-supervised feature cycle, then climb. The first chapter of the [user guide](./user-guide.md) and the [adoption guide](./adoption.md) cover tier1 end-to-end; invariant authoring (tier2) and the full supervised harness (tier3) are later chapters.

## Experimental autonomous loop is orthogonal

`feature_flags.autonomous_loop=true` plus invocation-level `--experimental --write` is a separate experimental opt-in, not a fourth profile and not implied by tier3. Its results remain outside supported readiness accounting and stop at `awaiting_human_review` or `experimental_blocked`. See the [experimental loop runbook](../dev/operations/loop-runbook.md) for the safety and promotion boundary.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/adoption-profiles.md (classification CURRENT).
