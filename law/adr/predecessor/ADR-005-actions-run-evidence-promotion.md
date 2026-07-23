---
adr_id: ADR-005
title: Actions-run evidence promotion without a parallel evidence authority
status: accepted
date: 2026-07-17
authors: ["@aarusso"]
tags: [ci-economy, evidence, github-actions, round-22, self-application]
---

# ADR-005 — Actions-run evidence promotion without a parallel evidence authority

## Status

Accepted for red-first specification in R22 W06 under D-146. This ADR defines
the contract; it does not enable heavy-tier skipping. R22 emits and verifies the
new evidence in shadow while full CI remains binding.

## Context

DEVAI's source PR, merged `main`, version PR, and version merge can execute the
same tree-deterministic heavy tiers repeatedly. D-115/D-117 already allow a
maintainer's local evidence to replace remote heavy tiers for a trusted direct
push, but DEVAI's own PR workflow calls the reusable gate in verification-only
mode and always runs `build-and-test`.

D-103/REJ-4 rejected a second CI-side digest verifier because the Article-32
hash chain is the canonical evidence mechanism. A new Actions cache, parallel
ledger, or independently authoritative digest would violate that decision. The
required extension must carry a remote run's readings through the existing
manifest and evidence-chain substrates.

GitHub workflow artifacts and attestations are useful transport/integrity
layers, not DEVAI's durable authority. Workflow artifacts disappear with their
run and are retention-bound. GitHub attestations can also be deleted. Therefore
neither may independently satisfy Article 32 or the graduation window.

## Decision 1: refine REJ-4 by extending D-117

`local-evidence-manifest.schema.json` remains the one heavy-tier evidence
manifest. It gains an origin discriminator:

- absent `origin` or `origin: local` preserves the complete D-117 contract;
- `origin: actions-run` carries evidence produced by a GitHub-hosted workflow.

The existing `sourceHash`, `policy`, `tools`, `platforms`, and successful `jobs`
members remain required. The Actions variant adds one `actionsRun` member:

```json
{
  "origin": "actions-run",
  "actionsRun": {
    "repository": "devai-nyx/devai",
    "workflowRef": "devai-nyx/devai/.github/workflows/ci.yml@refs/pull/46/merge",
    "eventName": "pull_request",
    "runId": "29623903828",
    "runAttempt": 1,
    "actor": "aarusso",
    "headSha": "<40-hex PR head>",
    "baseSha": "<40-hex base head>",
    "mergeBaseSha": "<40-hex merge base>",
    "testedCommitSha": "<40-hex checked-out commit>",
    "testedTree": {
      "algorithm": "sha1",
      "value": "<40-hex git tree>"
    },
    "digests": {
      "workflowPolicySha256": "<64-hex>",
      "lockfileSha256": "<64-hex>",
      "toolchainContractSha256": "<64-hex>",
      "testContractSha256": "<64-hex>",
      "serviceContractSha256": "<64-hex>"
    }
  }
}
```

The manifest records the checkout actually tested. It never reconstructs
`refs/pull/<n>/merge` after the run. Git repositories using SHA-256 object IDs
may declare `algorithm: sha256` and a 64-hex tree; DEVAI's current repository
uses SHA-1 tree identities without treating SHA-1 as the content-integrity
digest. `sourceHash` remains SHA-256 over tracked content.

This is not a parallel verifier. The new `devai evidence actions verify` path
uses the D-117 validator, produces an Article-32 evidence disposition, and has
no independent readiness authority.

## Decision 2: producer and verifier trust boundaries

The pull-request workflow is an untrusted evidence producer. After all declared
heavy jobs succeed, it emits a canonical manifest and transport artifact. The
manifest may optionally receive a GitHub artifact attestation, but verification
does not equate attestation presence with DEVAI acceptance.

The `main` workflow is the verifier. It receives a specific `runId` and
`runAttempt`, validates repository/workflow identity, verifies the manifest
schema and transport digest, and compares it with the actual merged checkout.
Caller-provided actor, ref, SHA, job result, or digest values are data to verify,
never trusted selectors.

The verifier exposes two modes:

- `shadow`: compute and record the binding disposition while full CI runs;
- `gate`: available only after the recorded graduation decision and used to
  select promotion or full fallback.

R22 wires only `shadow`.

## Decision 3: merge and tree identity

Promotion requires all of the following:

1. the actual merge mechanically proves the claimed protected-base commit and
   PR head as its exact configured merge inputs; R22 accepts the ordinary
   two-parent merge shape and fails closed on squash, rebase, or merge-queue
   shapes until an equivalent input proof is implemented;
2. `actionsRun.baseSha` is the actual base parent used by the merge;
3. the actual merged commit's tree equals `actionsRun.testedTree.value`;
4. `sourceHash` recomputed from the merged checkout equals the manifest's
   SHA-256 `sourceHash`;
5. the recorded PR head is an input to that merge according to the repository's
   configured merge method;
6. every policy and environment digest matches the merged checkout.

The tree, not the commit SHA or commit message, is the reusable-value identity.
Additional squash, rebase, or merge-queue shapes may become acceptable only
when they carry an equivalent mechanical input proof. A moved base or
recomputed merge tree is a fallback, not a near-match.

The proof does not query branch-protection administration state. The workflow's
scoped `GITHUB_TOKEN` cannot be assumed to read that endpoint, and translating
an authorization failure into `basePolicySatisfied=false` would make every
promotion hit unreachable. Post-merge parent identity plus the tree,
`sourceHash`, and policy digests proves the tested value without a privileged
secret; unrecognized merge shapes remain fallback.

## Decision 4: invalidators and reusable results

The workflow-policy digest covers `.github/workflows/**`, `.github/actions/**`,
the CI/release/evidence scripts, authority and CI-economy configuration, and the
manifest schema/validator. The test-contract digest covers Vitest/TypeScript/
ESLint/Prettier configuration, coverage thresholds, test discovery, and gate
registries. The service-contract digest covers runner image, database image and
configuration, and other declared service substrates.

Any change in tested tree, recomputed `sourceHash`, base, lockfile,
package-manager pin, Node engines or pin, workflow/policy digest, test-contract
digest, service-contract digest, required-job set, or run attempt invalidates
promotion.

Eligible tree-deterministic readings are merged unit/integration coverage,
regression, contract, smoke, supported E2E, experimental containment,
gate-invariant verb smoke, and inventory/spec self-application. Build, lint,
format, typecheck, evidence-chain verification, Changesets/version contracts,
and time-dependent dependency policy remain freshness checks and rerun.

## Decision 5: dispositions and fail-closed behavior

The verifier returns one typed disposition:

- `promotion-hit` — all evidence and identity conditions match;
- `fallback-no-evidence` — no claim exists; run full remote tiers;
- `fallback-tree-mismatch`;
- `fallback-base-moved`;
- `fallback-policy-changed`;
- `fallback-lockfile-changed`;
- `fallback-toolchain-changed`;
- `fallback-job-incomplete`;
- `invalid-claim` — malformed, forged, inconsistent, or unverifiable claimed
  evidence.

In shadow, every disposition is observational and full CI remains authoritative.
In future gate mode, absence or a legitimate mismatch selects full execution;
`invalid-claim` is a hard failure, preserving D-115/D-117's never-silently-open
rule.

## Decision 6: two-stage durability without intermediate main commits

Each shadow run initially produces provisional GitHub transport artifacts: the
manifest, verification decision, and full-CI comparison. Provisional evidence
cannot count toward graduation.

Before the R22 close or any binding authorization:

1. an Auditor downloads every manifest/decision/full-result tuple in the
   observation window;
2. the Auditor writes the byte-exact set under
   `docs/work/round-22/audit/ci-shadow/<run-id>-<attempt>/` with an index that
   proves no observed merge is missing;
3. a separate registered harness mutation validates each tuple and appends one
   `ci.actions-evidence.shadow` EvidenceRecord to the canonical Article-32
   chain, referencing the imported files and SHA-256 digests;
4. the Architect close consumes those records but cannot alter the Auditor's
   verdicts.

This import occurs in the one planned R22 closeout candidate, not as a new main
commit after every merge. If an artifact or attestation has expired, was
deleted, cannot be verified, or cannot be matched to a full-CI result, that
observation is `UNKNOWN`, does not enter the consecutive streak, and blocks
graduation for every candidate streak containing it. An `UNKNOWN` merge is not
skippable: a later candidate streak must begin after that merge and independently
satisfy every threshold.

The recording verb is a distinct F5 mutation derived through the verified host
adapter; the pure post-merge observation does not silently append the chain or
fabricate a human Inspector/Auditor role. This refines ADR-004 Decision 5 while
preserving its observation/persistence separation.

## Decision 7: graduation and revocation

The thresholds in the R22 Plan are conjunctive: five consecutive post-Node-24
merges with exact shadow/full agreement, three real hits, at least 50% eligible
hit rate, four forced fallback classes, complete Article-32 import, one green
weekly audit, independent zero-relabeling review, and a streak reset on any
mechanism defect.

The R22 close may authorize gate mode only for later merges. A weekly audit red,
an unexplained promoted/full disagreement, a chain failure, or loss of required
durable evidence revokes promotion and restores full remote execution until a
new complete green streak is recorded.

## Consequences

- The expensive result is reused by exact tested value, not branch name or
  narrative impact analysis.
- R20/R22 can gather real data without allowing new machinery to certify its
  own first release.
- Shadow storage has a bounded ingestion obligation; GitHub retention is not
  mistaken for governance durability.
- R22 adds no cache and no second evidence authority.
- Full CI remains the only binding result until a later merge consumes an
  explicitly authorized gate-mode transition.

## Alternatives Considered

- **Separate Actions digest ledger:** repeats REJ-4 and creates competing
  authority.
- **Artifact or attestation alone:** deletable/retention-bound and therefore
  insufficient for Article 32.
- **Commit evidence to `main` after every merge:** durable but recreates the CI
  amplification R22 is reducing.
- **Match only PR head SHA:** does not prove the integrated tree.
- **Bind during R22:** makes the first combined release depend on an ungraduated
  verifier and violates the shadow-first evidence contract.

## Affected Rules

- Constitution Articles 16, 17, 32, 34, 36, and 39.
- D-103/REJ-4, D-115, D-117, D-121, D-145, and D-146.
- ADR-CI-ECONOMY and ADR-004.

## References

- Constitution Articles 16, 17, 32, 34, 36, and 39.
- D-103/REJ-4, D-115, D-117, D-121, D-145, and D-146.
- ADR-CI-ECONOMY and ADR-004.
- [GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations).
- [GitHub attestation lifecycle](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/manage-attestations).
- [GitHub workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).
