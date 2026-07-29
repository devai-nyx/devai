---
id: R-0007-PRE-ENTRY-CONTROL-CERTIFICATION
title: Pre-R-0007 close-control machinery certification
type: assessment
status: active
date: 2026-07-29
authority: Auditor
supersedes: null
superseded_by: null
provenance: [OM-014; DII-246; candidate 185dcd840259586384c5a0823da879dd7ba63579]
related_invariants: [INV-DEVAI-001; INV-DEVAI-002; INV-DEVAI-003; INV-DEVAI-017; INV-DEVAI-020]
---

# Pre-R-0007 close-control machinery certification

## Exact subject

- Base: `722e8a3438f3534260ac4f24c3eecc59e76f905b`.
- Pre-review candidate: `185dcd840259586384c5a0823da879dd7ba63579`.
- Governing Owner mandate: OM-014 at
  `096c2d7eea3dceea0fbb24161604a255df95f0f7`.
- Governing Architect decision and generic contracts: DII-246 at
  `55b0a78ca9585c1166d1eba109a97596e2f8649e`.
- Primary Engineer implementation: `477237c8b7c33c2c59e2262ec9147311feaf6e5b`.
- DAG precision repair: `c0b26d6a7a2949dd5b64933844f9d0add26fc2cf`.
- Output-key stability repair: `5b5bae5c9b3bedbaf1facd6dcab2363993ffcca1`.

All three substantive Engineer commits have exact prior Inspector red sources, durable
Auditor JSON, and Architect law bindings. `ci:sequencing` passes the complete 23-commit
campaign range without a historical exception.

## Acceptance evidence

- `pnpm run devai:prepare`: PASS.
- `pnpm vitest run`: 160 files PASS; 1,508 tests PASS; 8 intentional skips.
- `pnpm run ci:stage1`: PASS.
- `pnpm run ci:stage2`: PASS; T1 1,024/1,024 and T2 396 PASS with one intentional skip.
- `pnpm run test:t4`: 4/4 PASS.
- `pnpm run test:t5`: 25/25 PASS.
- `pnpm run test:t6`: 3/3 PASS.
- `pnpm run test:coverage:t1-t3`: PASS; statements 72.45%, branches 60.75%,
  functions 81.14%, lines 73.90%.
- `pnpm run ci:changesets`: PASS with zero pending changesets.
- `pnpm run ci:governance`: PASS, including sequencing, governed SHA references,
  forbidden-action policy, decision integrity and citations, trace resolution, and docs
  drift.
- `git diff --check`: PASS.

## Content-addressed convergence proof

After setting the prior runtime freshness directory aside, the exact pre-review
candidate planned all 14 authoritative graph nodes as `EXECUTE`.

- Cold pass 1: 14 executed, zero reused, zero blocked.
- Cold pass 2: zero executed, 14 reused, zero blocked.
- Identical warm pass 1: zero executed, 14 reused, zero blocked.
- Identical warm pass 2: zero executed, 14 reused, zero blocked.
- Warm invocation started zero test-node processes.

The demonstration rejected two earlier false standings before this proof. First,
fallback nodes were selected as ordinary impact edges; the complete six-case DAG
population now prevents that widening. Second, an output digest participated in the
task key, causing whole coverage to execute again on pass two; output bytes now validate
the cached PASS without changing task identity, and an ignored output-bearing fixture
proves single execution followed by reuse.

## Entry and authority boundary

Preparation policy validation passes and reports
`ENTRY_BLOCKED_REVIEWER_UNBOUND`. R-0007 `entry-check` fails solely with that same
diagnostic because no Owner mandate has yet bound an exact reviewer model. Silent
fallback remains forbidden.

This assessment is pre-review evidence, not the independent machinery review. Exact-head
PR CI, merge, and exact-main CI remain pending. R-0007 has not started. Deployment,
publication, release, evidence promotion, real-stynx mutation, and predecessor mutation
remain unauthorized.
