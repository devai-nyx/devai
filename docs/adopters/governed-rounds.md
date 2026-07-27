# Governed rounds

A governed round is DEVAI's supported, human-supervised unit for planning,
role-separated execution, verification, and durable closure. It is not the
experimental autonomous loop.

## Canonical layout

Three surfaces remain separate throughout the round:

The governed round closes in place; no close action relocates its intent.

- `work/rounds/R-NNNN/` is committed Architect-owned intent. It contains the
  authorization, plan, prompts, declared record, and in-place close state. Closing a
  round never moves or renames this directory.
- `work/audit/R-NNNN/` contains attributable Auditor observations. Audit reports are
  committed under Auditor identity and are not smuggled through an Architect skill.
- `.devai/state/round-runs/R-NNNN/` is ignored, disposable runtime state. Backlog and
  prompt proposals, orchestration logs, and local closeout material live here until an
  Architect explicitly reviews and promotes selected intent into `work/rounds/R-NNNN/`.

Machine closure evidence is separate again:
`record/proofs/compliance/closures/PC-NNNN.json`. The production closure verb emits it;
a human or agent must not hand-author it. None of these paths alone establishes
readiness, release, or evidence-reuse standing.

## Supported ceremony

1. An Owner supplies the goal and authorization. An Architect records the declaring
   decision and creates `work/rounds/R-NNNN/` with `devai round scaffold --round N`.
2. The Architect completes lowercase `plan.md`, the orchestrator prompt, and a
   public-schema-valid declaration through
   `devai round declare --round N --record <record.json>`.
3. Each wave runs under its declared human role, lock scopes, and gates. Role boundaries
   remain separate commits. Runtime proposals and logs remain under
   `.devai/state/round-runs/R-NNNN/` unless the Architect deliberately promotes intent.
4. `devai round status --round N` reads the canonical round in place without mutation.
5. After the source merge has passed its required exact-SHA checks, the machine
   `devai govern phase close --input <draft.json>` verb validates and emits the closure
   record; the derived phase ledger is regenerated through the governed machine path.
6. `devai round archive --round N` is a compatibility spelling for in-place close. It
   validates the declaration, closing decision, merge binding, machine closure, ledger,
   gates, and required artifacts, then appends idempotent close state inside the same
   `work/rounds/R-NNNN/` directory. It does not move, hash-seal, stage, commit, push, or
   publish a dossier.

## Supported versus experimental

`round scaffold`, `round declare`, `round status`, and the compatibility
`round archive` action are deterministic governance primitives. They organize
explicitly human-actuated work; they do not choose implementation, merge, push, publish,
or confer readiness.

The `SKILL-round-*` composer remains experimental. It may measure and produce disposable
state, but it cannot author governed law, round intent, Auditor findings, closure proof,
or release standing. `devai experimental loop run` likewise requires project opt-in and
invocation-level consent, stops at human review, and cannot contribute supported
readiness evidence.

## Decision records

Decision records remain direct Architect work. No agent skill may claim a wildcard
write scope under `law/adr/` or `law/register/`. An Architect selects the next
collision-free identity, authors the record under the governed law surface, and applies
the normal review and decision lifecycle; creating a file never accepts it.

The canonical navigation surfaces are the
[decision-record index](../../law/adr/README.md) and
[closed-round ledger](../dev/round-ledger.md). The frozen pre-v1 monoliths remain
available under [`docs/meta/archive/pre-v1/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/meta/archive/pre-v1/).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/governed-rounds.md (classification CURRENT); corrected to the R-0005 in-place lifecycle.
