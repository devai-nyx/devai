---
title: Status
sidebar_position: 4
---

# Status

## Current line

DEVAI's packages follow the current pre-1.0 development line. The authoritative
statement of what is in flight is the **Status section of `BUILD-PLAN.md`**;
`CHANGELOG.md` and installed package metadata remain authoritative for release
history. The small fact block below is mechanically checked through
`docs/meta/current-claims.json` instead of being maintained as unverified prose.

The supported baseline is a human-supervised control and governance harness: humans or explicitly operated external tools actuate; DEVAI constrains authority, senses state, verifies acceptance, blocks unsafe transitions, and records evidence.

Binding role/path enforcement applies to side effects performed through DEVAI's CLI/runtime adapters. The repository currently declares `cli-only`; arbitrary shell, editor, and host-agent writes are not represented as mechanically contained without a verified host adapter.

The autonomous loop remains an intentional but **experimental** capability. Mutation requires project opt-in plus `--experimental --write`; execution stops at `awaiting_human_review` or `experimental_blocked` with branch and worktree preserved. It cannot merge, push, complete a task, or satisfy supported production-readiness cells.

## Machine-bound current claims

- Constitution version: 0.6.0
- Framework package version: 0.7.0
- Host authority mode: cli-only
- Project type: framework
- Project DEVAI pin: 0.7.0
- Autonomous-loop feature flag: false

These values are checked against `.devai/config/authority-policy.json` and
`.devai/config/project.json`. Historical papers, version snapshots, and the
Round 9007 experimental fixture are explicitly outside this current-claim
surface.

## Readiness scope

Shipped closures are machine-recorded: `devai govern phase ledger` lists every closure since PC-0001 with its gate sweep, batches, and supersessions. No round claims autonomous convergence or real-adopter production suitability; a supervised real-adopter pilot remains the next readiness milestone (governance-roadmap item 6), and autonomous promotion is a separate later decision.

Binding repository gates include build, lint, typecheck, deterministic unit/integration coverage, regression, contract, smoke, supported E2E, experimental containment, complete test-to-invariant trace, documentation governance, glob guards, package-tarball installation, secret safety, immutable release pins, and checkout cleanliness. Merged coverage floors are 70% lines, 60% branches, 70% functions, and 70% statements; 80% lines remains an improvement target.

## Lifecycle views

Actions, skills, journeys, evidence, and trace entries declare `supported`, `experimental`, or `retired` lifecycle provenance. Generated CLI references visibly label experimental surfaces. Experimental measurements are auditable but excluded from supported readiness denominators.

## Current inventories

Live action and skill inventories come from `devai catalog actions` and `devai agent skill list`. The canonical test trace is validated by `devai spec validate test trace`; hand-written counts are intentionally absent from this page — query the tools.

Historical phase and round descriptions are frozen in `BUILD-PLAN-ARCHIVE.md` and the versioned documentation snapshots; per-round working papers live under `docs/work/` in the repository.
