# P5 known-red contracts

These are exact bootstrap defects. The executable guards pin their current shape so
the green tier ladder cannot silently relabel or widen them.

## P5-KR-001 — F1:T1 scheduled reachability

- Guard: `packages/schemas/tests/contract/governed-populations.contract.test.ts`
- Current exact gap: `F1:T1` is the sole nondegenerate scorecard cell without a
  scheduled live sensor. `contract_validation` is archived because the attested
  predecessor pin has no emitter.
- Reason: P5 cannot invent a live emitter or change the Architect-owned registry.
- Suggested wave / backlog pointer: `post-bootstrap/W05-sensor-reachability`.
- Closure: an Architect-approved live emitter or explicit N/A disposition makes the
  general reachability set empty; update the exact guard in the same role-separated
  change.

## P5-KR-002 — proof epoch line-chain writer absent

- Requested guard: intra-epoch JSONL line-chain verification under `record/proofs/`.
- Current exact gap: P4 did not ship a canonical proof-epoch writer. Existing JSONL
  writers are unrelated work logs and do not implement the Article-32 epoch contract.
- Reason: a test cannot define the missing production protocol.
- Suggested wave / backlog pointer: `post-bootstrap/W05-proof-epoch-writer`.
- Closure: Engineer ships the canonical writer; Inspector adds previous-line hash,
  terminal-hash, append-only, and tamper-detection tests before removing this entry.

## P5-KR-003 — stale-reading threshold policy absent

- Executable behavior: `tests/integration/sensor-standing.integration.test.ts` proves
  FAIL persistence, newer same-kind supersession, UNKNOWN non-erasure, and explicit
  stale-to-REVIEW behavior.
- Current exact gap: no Architect-owned policy value supplies `staleFailAfterMs`; the
  caller must provide it.
- Reason: P5 cannot add or choose a law threshold.
- Suggested wave / backlog pointer: `post-bootstrap/W05-sensor-freshness-policy`.

## P5-KR-004 — RTD invariant readiness lacks materialized domains

- Guard: `tests/integration/rtd-manifest.integration.test.ts` pins the manifest's sole
  failing sub-verdict to `invariants` and preserves schema/hash/determinism coverage.
- Current exact gap: `.devai/config/domains.json` is absent, so invariant validation
  cannot establish a green RTD readiness claim.
- Reason: P5 cannot invent or materialize Architect-owned F5 policy.
- Suggested wave / backlog pointer: `post-bootstrap/W05-domain-policy-materialization`.

## P5-KR-005 — prompt-overlay firewall rejects successor scopes

- Guards: `packages/skills/tests/contract/skills-fingerprint-behavior.test.ts` and
  `packages/cli/tests/contract/action-coverage.contract.test.ts`.
- Current exact gap: 27 findings: 10 read-tier evidence-scope findings for
  `record/proofs/**` and 17 Architect-scope inversions for docs and round manifests.
- Reason: these are production manifest/firewall classifications, not test paths.
- Suggested wave / backlog pointer: `post-bootstrap/W04-skill-authority-reconciliation`.

## P5-KR-006 — generated CLI reference pages absent

- Guard: `packages/cli/tests/contract/action-coverage.contract.test.ts` pins all 18
  absent generated pages reported by `devai docs cli --check`.
- Reason: generated Architect-owned `docs/reference/cli/**` pages were not present at
  the P5 boundary; Inspector cannot publish them.
- Suggested wave / backlog pointer: `R-0001/P7-generated-cli-reference`.

## P5-KR-007 — action coverage blocked by missing domains policy

- Guard: `packages/cli/tests/contract/action-coverage.contract.test.ts` requires the
  action-coverage command to identify `.devai/config/domains.json` as its exact blocker.
- Reason: same Architect-owned materialization gap as P5-KR-004.
- Suggested wave / backlog pointer: `post-bootstrap/W05-domain-policy-materialization`.

## P5-KR-008 — effect extractor still sees pre-collapse actions

- Guard: `tests/integration/action-effects-binding.integration.test.ts` executes the
  production analyzer and pins the exact mismatch class to 39 stale extracted actions,
  including `backlog compact` and the pre-collapse sensor verbs.
- Reason: the analyzer/source catalog binding is production code.
- Suggested wave / backlog pointer: `post-bootstrap/W05-effect-catalog-rebinding`.

## P5-KR-009 — leaf help resolves to generic group help

- Guard: `tests/e2e/usage-exit-codes.e2e.test.ts` proves
  `devai init apply-owner --help` is non-authorizing and pins the currently rendered
  group-help shape.
- Current exact gap: the leaf description and mutation options are not rendered.
- Reason: hierarchical help routing is production CLI behavior.
- Suggested wave / backlog pointer: `post-bootstrap/W05-leaf-help-routing`.

## P5-KR-010 — post-merge Auditor reports a dirty persistent worktree

- Guard: `tests/e2e/post-merge-auditor.e2e.test.ts` proves first-pass observation,
  missing/forged receipt refusal, and injected failure persistence, then pins retries
  to `POST_MERGE_WORKTREE_DIRTY`.
- Current exact gap: observation products under `work/audit/post-merge/**` leave the
  persistent Auditor worktree as `?? work/`. Later merges and human retries can write
  completed products but return exit 2 with `POST_MERGE_WORKTREE_DIRTY`.
- Reason: cleanup/commit semantics belong to the production post-merge service.
- Suggested wave / backlog pointer: `post-bootstrap/W05-post-merge-worktree-cleanliness`.

## P5-KR-011 — merged T1+T3 coverage is below policy

- Guard: `tests/config/t1-t3.coverage.config.ts` reads, without weakening, the
  Architect-owned thresholds from `law/policy/thresholds.json`.
- Current exact result: 28.22% statements, 26.81% branches, 31.09% functions, and
  29.2% lines against required 70% / 60% / 70% / 70%.
- Execution dependency: the workspace does not declare `@vitest/coverage-v8`; the
  gate was therefore measured with an ephemeral version-matched 4.1.10 provider.
- Reason: P5 cannot weaken law thresholds or add the Owner/Engineer-owned dependency
  manifest entry.
- Suggested wave / backlog pointer: `post-bootstrap/W05-coverage-depth-and-provider`.
