# Experimental autonomous-loop runbook

> **Experimental — not a production-readiness surface.** `devai experimental loop run` is retained as a strategic autonomous-controller track. It is not part of DEVAI's supported human-supervised baseline, and its results cannot establish supported readiness.

DEVAI's supported role is a human-steered control and governance harness: a human Architect, Inspector, Engineer, Auditor, or an explicitly operated external tool supplies intent; DEVAI constrains authority, senses state, verifies acceptance, blocks unsafe transitions, and records evidence. The loop is an opt-in experiment built from those primitives.

## Activation

A dry run is always available and never mutates project state:

```bash
devai experimental loop run --dry-run
```

A mutating experiment requires all three independent consent signals:

1. `.devai/config/project.json` sets `feature_flags.autonomous_loop` to `true`.
2. The invocation includes `--experimental`.
3. The invocation includes `--write`.

It also requires a specific task description and explicit acceptance commands. A representative invocation is:

```bash
devai experimental loop run \
  --experimental \
  --write \
  --task-id TASK-0042 \
  --description "Implement the approved TASK-0042 change" \
  --acceptance "pnpm test -- changed-area"
```

Direct execution of `SKILL-feedback-iteration` is governed by the same experimental activation and write-consent boundary. `skill run` is not a bypass.

## Safety boundary

The experiment may sense, triage, acquire bounded locks, create a recoverable worktree, invoke its bounded writer, and evaluate the supplied task-specific acceptance commands. It must perform the requested task even when the initial repository baseline is green; baseline health is not task completion.

The only terminal states are:

- `awaiting_human_review` — task-specific acceptance passed and the prepared change is ready for a human to inspect.
- `experimental_blocked` — execution or acceptance failed and recoverable state is preserved for diagnosis.

In both states DEVAI preserves the branch, worktree, iteration evidence, changed-file list, lock disposition, and human-review instructions. The experimental controller never merges, pushes, marks the task completed, deletes the branch, destroys the worktree, or discards edits.

## Human review

The human Architect or Auditor reviews the preserved work, the acceptance commands and outputs, authority decisions, and evidence provenance. Any later merge, task completion, or cleanup is a separate human-authorized operation using supported commands. Experimental evidence remains visible in ledgers and reports but is excluded from supported production-readiness denominators.

## Failure and recovery

Treat `experimental_blocked` as a recoverable checkpoint, not a cleanup trigger. Inspect the recorded worktree path and branch, rerun acceptance manually if appropriate, and follow the [worktree runbook](./worktree-runbook.md) and [lock runbook](./lock-runbook.md). Do not delete evidence or canonical ledgers. `devai work state prune` only previews disposable ignored outputs by default and requires `--write` to delete candidates older than its 30-day default.

## Promotion criteria

Promotion from experimental to supported requires all of the following in a later round:

- a new Architect ADR and lifecycle change;
- evidence from a real, human-supervised adopter pilot;
- correct branch integration and task-completion semantics;
- full autonomous end-to-end coverage, including recovery and destructive-boundary tests;
- an Auditor verdict that autonomous results may enter supported readiness accounting.

Until then, autonomous convergence and production suitability are explicitly unclaimed. Historical autonomous-loop ADRs remain active design authority for this experimental track; they are not evidence of present production support.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/loop-runbook.md (classification CURRENT).
