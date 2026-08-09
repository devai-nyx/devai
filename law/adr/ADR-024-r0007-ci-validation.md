---
id: ADR-024
title: R-0007 GitHub Actions and commit-validation setpoint
type: adr
status: active
date: 2026-08-07
authority: Architect
supersedes: [R-0007-PLAN#GitHub-Actions-and-commit-validation-setpoint]
superseded_by: null
provenance:
  - OM-021
  - R-0007-PLAN
  - ADR-013
  - ADR-015
  - work/rounds/R-0007/inventory/github-actions-current-state.md
affected_rules:
  - law/policy/github-actions-features.json
  - law/schemas/github-actions-features.schema.json
  - law/policy/commit-validation.json
  - law/schemas/commit-validation-plan.schema.json
  - law/schemas/ci-optimisation-evidence.schema.json
  - work/rounds/R-0007/affected-test-graph.json
  - scripts/derive-commit-validation-plan.mjs
  - scripts/check-workflows.mjs
  - .github/workflows/ci.yml
  - .github/workflows/round-gates.yml
  - .github/workflows/reusable-evidence-gate.yml
---

# ADR-024. R-0007 GitHub Actions and commit-validation setpoint

## Status

Accepted as the R-0007 B2 semantic setpoint. This ADR supersedes only the provisional
`R-0007-PLAN#GitHub-Actions-and-commit-validation-setpoint` section. ADR-013, ADR-015,
and every other R-0007 plan provision remain active and retained. Adoption is an
architectural disposition, not an activation claim. Workflow implementation, paired
measurements, and any separately authorized repository-settings changes remain outstanding.

## Context

ADR-013 and ADR-015 require fail-closed CI economy, exact active-ADR association,
immutable remote action references, and live workflow-path coverage. OM-021 additionally
requires a complete feature census, acquisition-only dependency caching, semantic
parallelism, fast and cold lanes, a mechanical four-class commit validator, a cold
sentinel, and paired equal-population timing evidence.

The live 2026-08-07 census found a public repository on the GitHub Free plan with three
active workflows and standard GitHub-hosted Ubuntu runners. Actions permits all actions,
platform SHA-pin enforcement is disabled, artifact/log retention is 90 days, and the
repository has no Actions caches, artifacts, self-hosted runners, rulesets, branch
protection, merge queue, open pull requests, releases, tags, or environments. The latest
exact-main CI run was one successful descriptive baseline, not a paired benchmark.

## Decision

`law/policy/github-actions-features.json` is the one-to-one feature-disposition source.
Every in-scope feature has exactly one `adopt`, `defer`, or `reject` outcome. `adopt`
means the design is selected; it does not mean a feature is implemented, enabled, or
measured. Administrative settings remain deferred unless separately authorized.

Dependency caching is limited to the pnpm content-addressed store. Keys bind runner OS
and architecture, exact Node and pnpm identities, the lockfile digest, and effective
package-manager configuration. Every job still performs `pnpm install
--frozen-lockfile`. `node_modules`, DEVAI state, verdicts, coverage, and evidence are
never cached. Fork-originated pull requests neither save nor restore privileged cache
namespaces.

Artifacts carry only reports or inter-job bytes. Producers publish a manifest of byte
digests and consumers verify it before use. Artifact presence, name, GitHub conclusion,
or digest verification grants no PASS standing. Authenticated claim reuse remains an
R-0008 concern.

The workflow DAG may parallelize only independent complete populations. Build, test-tier,
database-service, instrumentation, and round-gate dependencies remain explicit. A matrix
cell must execute its declared population exactly once; slicing a test population without
a completeness proof is forbidden. Superseded pull-request feedback may be cancelled.
Main, merge-group, frozen-candidate, convergence, sentinel, and round-close executions
must not be cancelled or silently replaced.

The fast lane provides non-authoritative feedback from mechanically selected commands.
The cold lane begins without DEVAI result reuse and executes the complete active
authoritative population. Dependency-download caching is allowed in the cold lane only
under the acquisition-only rule. Merge eligibility, frozen candidates, and round close
continue to require uninterrupted cold proof.

`law/policy/commit-validation.json` defines four ordered validation classes:
`governance-text`, `law-and-schema`, `runtime-and-tests`, and `candidate-and-close`.
The classifier receives an exact base and candidate; consumes status-aware NUL-delimited
Git diff records, including exact renames and symlinks; follows affected-test, command,
schema, materialization, generated-source, package-script, workflow, and governance
closures; and emits a plan conforming to
`law/schemas/commit-validation-plan.schema.json`. An author cannot provide or lower the
class. The strictest applicable class wins. Unknown, ambiguous, dynamic, incomplete, or
classifier-owning changes widen to a complete safe population.

Classifier policy, implementation, graph, sentinel, or activation changes bootstrap as
`candidate-and-close`. Every class retains exact-range `git diff --check`. A cold
sentinel compares the predicted population with complete same-candidate execution. One
false negative emits `CLASSIFIER_FALSE_NEGATIVE`, disables narrowing for the observation,
and returns the exact active cold command roster as the fallback. Persistent activation
remains deny-by-default until its fail-closed health input and rollback path are proved.
After a governed activation, any sentinel failure or incomplete sentinel-run history since
that activation widens to the full floor. A read-only negative or missing signal may only
disable; no success conclusion, cache, artifact, or summary can enable narrowing or satisfy
a gate. An unavailable or unauthenticated cross-run health artifact widens rather than
enables.

Optimization activation requires at least three baseline and three candidate runs for
both cold-miss and warm-hit cache states on one exact candidate and runner class. Semantic
file, suite, case, execution, reuse, and coverage populations must be equal before timing
is compared. The candidate median critical path must be lower in at least one state and
must not regress the other by more than 2 percent, unless a separately proved security or
operability benefit justifies the feature. Any semantic mismatch, false negative,
permission widening, mutable pin, cancellation of authoritative work, or threshold breach
rolls back to the complete prior floor.

B3C acceptance is limited to implementation and fail-safe behavior. It validates the
complete feature census from `law/policy/github-actions-features.json`, the workflow and
classifier adversaries, the disabled fallback state, and the complete local Vitest and
coverage floors. Missing paired GitHub evidence is therefore an expected deny-by-default
activation state during B3C, not permission to fabricate evidence or activate narrowing.
B7 activation and round closure continue to require the canonical paired benchmark at
`work/audit/R-0007/ci-optimisation-benchmark.json`; until that evidence exists and passes,
no speed claim, classifier narrowing, cache acceleration, R7-F018 closure, or round-close
claim is permitted.

## Consequences

R-0007 can implement shorter feedback without converting cached or transported bytes into
evidence. The design preserves all cold proof properties and makes classifier uncertainty
visible and monotonic. The present B2 commit establishes policy and schemas only; it does
not activate caching, classification, new workflows, artifacts, or GitHub settings and does
not claim a measured speedup.

## Alternatives Considered

Caching `node_modules`, caching verdicts, mutable action tags, self-hosted runners,
unsound test sharding, and artifact-derived PASS were rejected because they weaken
reproducibility, provenance, or population proof. Larger hosted runners, merge queues,
rulesets, branch protection, OIDC, artifact attestations, and authenticated result reuse
were deferred because live availability, cost, administrative authority, or R-0008 trust
policy is absent. Keeping unconditional full Vitest for every governance-text commit was
rejected by OM-021, while removing the complete cold lane was rejected because it would
surrender proof.

## Affected Rules

- `law/policy/github-actions-features.json`
- `law/schemas/github-actions-features.schema.json`
- `law/policy/commit-validation.json`
- `law/schemas/commit-validation-plan.schema.json`
- `law/schemas/ci-optimisation-evidence.schema.json`
- `work/rounds/R-0007/affected-test-graph.json`
- `scripts/derive-commit-validation-plan.mjs`
- `scripts/check-workflows.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/cold-sentinel.yml`
- `.github/workflows/round-gates.yml`
- `.github/workflows/reusable-evidence-gate.yml`
