---
id: R-0004-CORRECTED-CANDIDATE-T2-FAILURE
title: Corrected-candidate T2 collateral failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate 8d95fd020b4f27989596e7f7bd55c81f7e4b3100; Stage 2 T2; BL-152–153]
---

# Corrected-candidate T2 collateral failure

The complete ladder restarted from clean candidate `8d95fd0`. Stage 1 passed workflow,
action-registry, trace-generation, repository-reference, lint, and type checks. Stage 2
then passed the root build and T1 at 70 files / 820 tests before T2 stopped with four
failures across two root causes.

BL-152 records that the canonical trace schema's invariant-level suite enum omits
`contract`, although the test-index enum and generator correctly classify contract
tests. The live trace therefore fails schema and CLI resolution.

BL-153 records that the test-only authority host permits bare `pnpm vitest run` but does
not yet recognize the production fixed `--config tests/config/t2.contract.config.ts`
suffix. Two skills baselines consequently fail closed with
`AUTHORITY_TEST_PROCESS_NOT_READ_ONLY`.

No Stage 3, coverage, governance, T4–T6, formatting, root-floor, package dry-run, or Opus
review ran after this stop. Both repairs are bounded to their owning roles; no production
argv, threshold, skip, external gate, or release boundary may change.
