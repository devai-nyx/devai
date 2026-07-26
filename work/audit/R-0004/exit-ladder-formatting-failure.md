---
id: R-0004-EXIT-LADDER-FORMATTING-FAILURE
title: Exact-candidate cross-authority formatting failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate 907ccd94bad69c9a5c58709494ae24114412027c; standalone Prettier gate; BL-143]
---

# Exact-candidate cross-authority formatting failure

Candidate `907ccd94bad69c9a5c58709494ae24114412027c` passed Stage 1 through Stage 3,
changeset classification, strict governance with zero findings, T4, a fresh root build,
T5, and T6. Fresh coverage remained above the unchanged floors at 71.12% statements,
61.67% branches, 77.55% functions, and 73.13% lines. The ladder then correctly stopped
at standalone `prettier --check .` on exactly 13 tracked files:

- Architect: four files under `law/`;
- Engineer: four hand-authored production/generator files and three generated action
  views;
- Inspector: two test-support files;

The three generated action views currently reproduce exactly, so directly formatting
their outputs would create projection drift. BL-143 therefore requires the Engineer to
make the generator itself emit formatter-clean deterministic bytes and regenerate every
view. All other bytes must be formatted by their owning role in separate commits.

No root-test run, clean-worktree assertion, package dry-run refresh, or Opus review ran
after this stop. No behavior, assertion, threshold, skip, external gate, or release
boundary may change as part of the correction.
