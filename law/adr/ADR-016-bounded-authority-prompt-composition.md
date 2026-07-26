---
id: ADR-016
title: Bounded authority prompt composition
type: adr
status: active
date: 2026-07-26
authority: Architect
supersedes: [ADR-011]
superseded_by: null
provenance:
  - DII-202; BL-015; ADR-011 sealed source; R-0005-KNOWN-RED; R-0005-ENTRY-INVENTORY
affected_rules:
  - packages/skills/src/prompt-firewall/index.ts
  - packages/skills/src/skills/impl/core.ts
  - packages/skills/src/skills/impl/writers.ts
  - packages/skills/src/skills/impl/round.ts
---

# ADR-016. Bounded authority prompt composition

## Status

Accepted and active in R-0005. Supersedes ADR-011 while preserving its sealed body
through a terminal lifecycle transition.

## Context

ADR-011 correctly rejects a prompt that asks an agent to write a path reserved to a
different authority. Its initial implementation nevertheless reports 27 findings for
two narrower cases that are not authority elevation: read-tier skills whose only output
is machine evidence, and Architect-declared writer skills whose exact output is a single
document. Three experimental round composers also claim direct write scope over
Architect round intent and must be corrected rather than exempted.

## Decision

The prompt firewall retains reserved-root and glob-overlap denial. A read-tier skill may
declare only `record/proofs/work/skill-runs/**` or `record/proofs/work/rgr/**` output when
its host mutation policy is exactly `evidence_only`; that permission is machine evidence,
not human-role authorship.

An Architect-bound review-agent writer may name one exact file under `docs/` when it has
write tier and `write_requires_flag`. The prompt remains a proposal executed under an
explicit Architect authority session; the exception never covers a directory, wildcard,
other reserved tree, coding-agent, ambient role, or runtime mutation without final
authority enforcement.

Experimental orchestrator- or Auditor-bound round composers may not write
`work/rounds/**`. Their disposable execution and closeout outputs belong under
`.devai/state/round-runs/**`; attributable Auditor observations belong under
`work/audit/**`; only an explicit Architect invocation may append committed round
intent.

## Consequences

The inherited 27 findings can reach zero without weakening malicious overlap denial.
Evidence-only writes, exact Architect document writes, and disposable round state have
distinct rules and destinations. Runtime authority, consent, expected-diff, and role
purity remain final.

## Alternatives Considered

Blanket allowlisting all 27 findings, treating every `authority_role` string as sufficient,
letting experimental composers mutate round intent, and deleting the reserved-root rule
were rejected because each would turn prompt lint into an elevation channel. Requiring
all evidence-only skills to claim write tier was rejected because their only output is
validated machine evidence.

## Affected Rules

- `packages/skills/src/prompt-firewall/index.ts`
- `packages/skills/src/skills/impl/core.ts`
- `packages/skills/src/skills/impl/writers.ts`
- `packages/skills/src/skills/impl/round.ts`
