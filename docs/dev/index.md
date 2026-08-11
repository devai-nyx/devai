---
title: Developer guide
---

# Developer guide

Human maintainers choose DEVAI's scope, review changes, and authorize releases. Work in a
dedicated branch or worktree, preserve unrelated changes, and run the smallest trustworthy
checks affected by the change.

## Test lanes

| Lane                   | Purpose                                                              | Normal trigger                  |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------- |
| affected               | content-addressed closure changed by an exact base-to-candidate diff | every change                    |
| local                  | complete cheap deterministic closure                                 | before integration              |
| coverage               | eligible tests once, floors 70/60/70/70                              | RC gate only                    |
| DB / E2E / performance | environment-dependent proof                                          | RC gate only                    |
| containment            | current operation, recipe, path, symlink, and write-scope boundaries | RC gate and containment changes |

PASS-only cache reuse is allowed when the task key and dependency closure are unchanged.
Candidate receipts require a clean exact tree. Remote CI validates the signed receipt and
required-node closure; it does not claim to prove local execution.

## Runbooks

- [Testing](operations/testing.md)
- [Worktrees](operations/worktree-runbook.md)
- [Database isolation](operations/db-isolation.md)
- [Evidence](operations/local-evidence-runbook.md)
- [Incident response](operations/incident-playbook.md)
- [Security](security/README.md)
