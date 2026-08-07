# R-0007 GitHub Actions current-state inventory

## Snapshot identity

- Observed at: `2026-08-07T04:44:28Z`
- Repository: `devai-nyx/devai`
- Visibility: `PUBLIC`
- Default branch: `main`
- Exact live main: `9b435e5ca479a837baffe2b597c8ba582fec08f4`
- Organization plan reported by the GitHub REST API: `free`
- Collection mode: read-only GitHub REST and `gh` queries; no setting, ref, workflow,
  release, cache, artifact, environment, or repository mutation was performed.

This is a point-in-time inventory. It is not an activation record, benchmark, required-check
receipt, or authority to mutate GitHub configuration.

## Repository and Actions settings

| Fact                                | Observed value                      | Read-only source                                                              |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Actions enabled                     | yes                                 | `GET /repos/devai-nyx/devai/actions/permissions`                              |
| Allowed actions                     | `all`                               | same endpoint                                                                 |
| Platform SHA pinning required       | no                                  | same endpoint                                                                 |
| Default workflow token permission   | `read`                              | `GET /repos/devai-nyx/devai/actions/permissions/workflow`                     |
| Workflow may approve PR reviews     | yes                                 | same endpoint                                                                 |
| Artifact/log retention              | 90 days; repository maximum 90 days | `GET /repos/devai-nyx/devai/actions/permissions/artifact-and-log-retention`   |
| Fork contributor approval           | `first_time_contributors`           | `GET /repos/devai-nyx/devai/actions/permissions/fork-pr-contributor-approval` |
| Repository forking                  | allowed                             | `GET /repos/devai-nyx/devai`                                                  |
| Actions caches                      | zero                                | `GET /repos/devai-nyx/devai/actions/caches`                                   |
| Actions artifacts                   | zero                                | `GET /repos/devai-nyx/devai/actions/artifacts`                                |
| Repository self-hosted runners      | zero                                | `GET /repos/devai-nyx/devai/actions/runners`                                  |
| Repository rulesets                 | zero                                | `GET /repos/devai-nyx/devai/rulesets`                                         |
| Rules applying to `main`            | zero                                | `GET /repos/devai-nyx/devai/rules/branches/main`                              |
| Classic branch protection on `main` | absent (`404 Branch not protected`) | `GET /repos/devai-nyx/devai/branches/main/protection`                         |
| Open pull requests                  | zero                                | GraphQL-backed `gh pr list --state open`                                      |
| Releases                            | zero                                | `gh release list`                                                             |
| Tags                                | zero                                | `GET /repos/devai-nyx/devai/tags`                                             |
| Environments                        | zero                                | `GET /repos/devai-nyx/devai/environments`                                     |
| Immutable releases                  | disabled and not owner-enforced     | `GET /repos/devai-nyx/devai/immutable-releases`                               |

The REST APIs expose the current empty cache inventory and the artifact/log retention
maximum. They did not return a repository-specific cache storage quota, larger-runner
entitlement, or accepted cost. Those values are unproved and are not invented here.

## Active workflows and present semantics

The repository exposes exactly three active workflows:

1. `.github/workflows/ci.yml` (`CI`, workflow ID `319897929`);
2. `.github/workflows/reusable-evidence-gate.yml` (`Reusable local-evidence gate`,
   workflow ID `321094581`); and
3. `.github/workflows/round-gates.yml` (`Round gates`, workflow ID `319897930`).

All remote actions currently used by those files are full 40-hex SHA references with
readable version comments. Workflow-level permissions are `contents: read`. The current CI
workflow has one concurrency group with unconditional `cancel-in-progress: true`, so a later
main run can currently cancel an earlier main run. Round gates use
`cancel-in-progress: false`.

The repository-level setting permits workflows to approve pull-request reviews, but none of
the three workflows grants pull-request write permission. The feature policy rejects using
that capability in R-0007; disabling the live repository setting would be a separate
administrative mutation and is not performed by this batch.

The current CI dependency graph is:

```text
evidence-mode
  -> static
     -> fast -------------------+
     -> changesets -------------+-> merged-coverage --+
     -> governance -----------------------------------+-> round-gates
                                                         regression
                                                           -> smoke-e2e
                                                              -> containment
```

Every substantive job repeats checkout, setup-node, package-manager prewarm, Corepack enable,
and frozen pnpm installation. There is no dependency cache, report artifact, workflow-summary
contract, structured timing record, validation classifier, or scheduled cold sentinel.
The reusable evidence gate remains fail-closed bootstrap plumbing and does not make local
evidence authoritative in pull requests.

## Runner and critical-path observation

The latest exact-main CI run observed was run `31129071619` for push SHA
`9b435e5ca479a837baffe2b597c8ba582fec08f4`. It used standard GitHub-hosted
`ubuntu-latest` runners in the `GitHub Actions` runner group. It started at
`2026-08-06T22:33:02Z` and completed at `2026-08-06T23:08:18Z`, an elapsed workflow
critical path of 35 minutes 16 seconds.

The critical path followed evidence refusal, static checks, stage 2, merged coverage, and
the serial T4/T5/T6 round gates. Stage 2 ran for approximately 12 minutes 25 seconds and
merged coverage for approximately 18 minutes 50 seconds. Changesets and governance ran in
parallel after static. No repository self-hosted runner was registered.

This is one descriptive baseline run. It does not satisfy the R-0007 paired-run requirement:
there are not yet three baseline and three candidate observations for both cold-miss and
warm-hit states, no candidate workflow exists, and semantic-population equality has not been
recorded. Therefore no wall-time optimization is active or proved by this inventory.

## Capability boundary and dispositions

The in-scope feature population is limited to capabilities named by OM-021, capabilities
already used by the three live workflows, and adjacent GitHub controls necessary to enforce
their threat boundaries. Its canonical one-to-one dispositions are in
`law/policy/github-actions-features.json`.

- Standard hosted runners, the PostgreSQL service container, immutable source pins, and
  read-only workflow permissions are existing foundations to retain.
- Acquisition-only pnpm-store caching, reusable setup, semantic DAG/matrix behavior,
  event-specific concurrency, bounded report artifacts, summaries, telemetry, fast/cold
  lanes, and the cold sentinel are adopted as designs but remain unimplemented.
- Larger runners, merge queues, rulesets, branch-protection checks, repository action
  allowlisting/SHA enforcement, OIDC, artifact attestations, and authenticated result reuse
  are deferred for missing availability, cost, authority, or R-0008 trust policy.
- Self-hosted runners, mutable pins, `node_modules` or verdict caches, unsound sharding,
  artifact-derived PASS, and deployment environments in R-0007 are rejected.

No package publication, tag, GitHub Release, deployment, evidence promotion, settings
mutation, real-stynx mutation, or predecessor mutation is implied by this census.
