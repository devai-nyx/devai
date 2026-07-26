---
id: ADR-017
title: R-0005 independent review corrections
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: [DII-202; DII-203; R-0005-INDEPENDENT-CODEX-REVIEW-1-FAILURE]
superseded_by: null
provenance:
  - DII-202; DII-203; OM-009; R-0005-INDEPENDENT-CODEX-REVIEW-1-FAILURE; KR-R5-017 through KR-R5-026
affected_rules:
  - .github/workflows/reusable-evidence-gate.yml
  - law/schemas/common-defs.schema.json
  - law/policy/governed-sequencing.json
  - packages/cli/src/authority/sense-run-child.ts
  - packages/evidence/src/evidence/verb-evidence.ts
  - packages/evidence/src/local-evidence/subject.ts
  - packages/evidence/src/local-evidence/verify.ts
  - packages/loop/src/loop/worktrees.ts
  - packages/loop/src/round-lifecycle/index.ts
  - packages/skills/src/post-merge-auditor/index.ts
  - packages/skills/src/prompt-firewall/index.ts
  - scripts/check-governed-sequencing.mjs
  - scripts/detect-conditional-skips.mjs
---

# ADR-017. R-0005 independent review corrections

## Status

Accepted and active in R-0005. This record governs only the bounded repairs exposed by
the first independent Codex review and exact-candidate exit ladder.

## Context

The first exact-candidate review found that several locally green contracts proved
shapes rather than the promised end-to-end behavior. Managed cleanup trusted mutable
paths; declared rounds did not round-trip; evidence subjects invalidated themselves on
commit; the compatibility proof chain still accepted writes; prompt and sequencing
rules admitted overbroad authority; post-merge products lacked Auditor attribution; and
conditional-skip detection was lexical and incomplete. The exit ladder separately
proved missing active-ADR coverage for the reusable evidence workflow and a coverage
regression caused by importing a large broker solely to test one pure predicate.

## Decision

Managed worktree deletion is permitted only for an exact valid ID whose registry path
equals `<repository>/.devai/worktrees/<id>`, is not a symlink, and is registered by Git
at that exact path. Any divergence fails before removal. Manual fallback deletion may
target only the same already-proven managed path.

Round declaration preserves the complete schema-valid record frontmatter. `closed` is a
governed record status. Close resolves `D-*` standalone records and canonical `DII-*`
entries in `law/register/DECISIONS.md`, then proves the compliance closure, ledger,
gates, artifacts, reread, and idempotent close state without moving intent.

Local evidence binds the clean source commit and tree that precede a manifest-only
trailer commit. Verification accepts the source snapshot itself for strict local
preflight, or an exact one-parent trailer commit whose only tree change is the canonical
manifest path. It derives both cases from Git and never accepts caller-selected subject
bytes or a mixed source/evidence commit.

The aggregate `record/proofs/chain.json` surface is read/verify compatibility only.
Automatic verb evidence becomes a non-writing compatibility no-op; explicit legacy
emit, redact, record-chain, and readings-chain mutations fail closed with migration
guidance until a round-bound epoch destination exists.

Architect role metadata alone never exempts prompt scope. ADR-016's evidence-only roots
and exact Architect document writer remain the only non-draft exceptions.

Post-merge locks, receipts, and retry cache remain runtime state. Successful inventory,
scorecard, backlog, assessment, and status products are also copied into
`work/audit/post-merge/<merge-sha>` in the managed Auditor worktree and committed as
`DEVAI Auditor`. Replays verify the committed bundle and leave both worktrees clean.

Prospective sequencing uses exact machine-readable bindings from every substantive
implementation commit to prior Architect law commits and an exact Inspector red-evidence
commit. The checker rejects missing objects, wrong authors, wrong order, unrelated test
paths, and evidence that does not identify a non-zero red observation. Historical R-0002
exceptions remain round-bounded and cannot satisfy a later binding.

Conditional-skip discovery parses TypeScript/JavaScript syntax and detects Vitest
`.skip`, `.skipIf`, `.runIf`, direct aliases, and skip-named wrappers. The governed
allowlist remains exact by source; new bypass forms fail closed.

The reusable evidence workflow is an affected rule of this active ADR. The
child-authority predicate is extracted without behavior change so tests cover the pure
surface without importing the complete broker; coverage thresholds and source inclusion
remain unchanged.

## Consequences

Destructive cleanup, closure, evidence standing, and post-merge attribution gain
end-to-end adversaries. Legacy proof writers become visibly unavailable instead of
creating a second canon. Sequencing and anti-skip checks bind evidence rather than
presence. The repair may require caller migrations, but it creates no release or
readiness standing.

## Alternatives Considered

Trusting registry paths, accepting same-round law/test presence, lowering coverage,
excluding broker code, retaining the Architect blanket prompt exemption, treating
`.git` cache as attributable audit, editing a manifest after collection, and silently
continuing legacy chain writes were rejected because each preserves the reviewed gap.

## Affected Rules

The authoritative affected-rule list is the exact `affected_rules` frontmatter above.
